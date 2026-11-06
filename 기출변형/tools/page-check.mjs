// 쪽 그림 자동 검사 — 눈으로 보기 전에 프로그램으로 먼저 걸러 낸다(강사 결정 2026-11-06)
//
//   node tools/page-check.mjs 2                          2차 out/2/*.html 전부(먼저 node build.mjs 2 … 로 빌드)
//   node tools/page-check.mjs 2 단원별-통합사회2-학생용     한 권만
//   node tools/page-check.mjs 2 --only t2-15-2-004,m2-7-04  이 문항이 있는 쪽만 보고
//   node tools/page-check.mjs 2 --json 결과.json          결과를 파일로도 저장
//   node tools/page-check.mjs --dir ../textbook/out       다른 폴더의 HTML(개념서 등)도 검사
//
// 찾는 것
//   넘침    단 아래로 넘친 내용, 단보다 넓은 그림·표
//   잘림    그림 안 글자가 그림 테두리 밖으로 나감(축 이름·범례가 잘림)
//   겹침    그림 안 글자끼리 겹침(이름표 두 번 찍힘, 눈금 숫자 겹침 등)
//   작은글씨 인쇄 크기로 5pt보다 작은 그림 글자(범례·이름표·눈금)
//   중복    한 그림에 같은 이름이 가까이 두 번(예: '태평양' 두 번)
//   쉼표    연도 눈금에 천 단위 쉼표('1,920')
//   머리    문제 머리(번호·난이도·개념·유형)가 두 줄로 꺾임
//   빈단    단 아래가 35% 넘게 비었는데 단원·회차 끝이 아님(개수만 요약, 50% 넘게 빈 단만 목록 — 전부 보려면 --all)
// 걸린 쪽만 PNG로 눈으로 확인하면 된다(out/<차수>/png/<이름>/NNN.png — build.mjs … png).
import { createRequire } from 'node:module';
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); } })();
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const ed = args.find((a) => a === '1' || a === '2') || '2';
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const dirArg = args.includes('--dir') ? args[args.indexOf('--dir') + 1] : null;
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const names = args.filter((a) => !['1', '2'].includes(a) && !a.startsWith('--') && a !== jsonOut && a !== dirArg && !(only && args[args.indexOf('--only') + 1] === a));
const MIN_PT = 5; // 이보다 작으면 인쇄해서 읽기 어렵다
const EMPTY = 0.35; // 단이 이만큼 넘게 비면 알림
const showAll = args.includes('--all');

const dir = dirArg ? join(process.cwd(), dirArg) : join(ROOT, 'out', ed);
if (!existsSync(dir)) { console.error(`out/${ed} 가 없습니다. 먼저 node build.mjs ${ed} … 로 빌드하세요.`); process.exit(1); }
const files = readdirSync(dir).filter((f) => f.endsWith('.html') && (!names.length || names.includes(f.replace(/\.html$/, ''))));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 } });
const all = {};
for (const f of files) {
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(join(dir, f)).href);
  await page.waitForFunction(() => window.PAGINATED === true, null, { timeout: 600000 });
  const found = await page.evaluate(({ MIN_PT, EMPTY }) => {
    const out = [];
    const qidOf = (el) => el.closest('[data-qid]')?.dataset.qid || el.closest('.row')?.querySelector('[data-qid]')?.dataset.qid || '';
    const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const pages = [...document.querySelectorAll('.page')];
    pages.forEach((pg, i) => {
      const no = i + 1;
      const add = (kind, qid, msg) => out.push({ page: no, kind, qid, msg });
      const slots = [...pg.querySelectorAll('.slot')];
      // 넘침
      slots.forEach((s) => {
        if (s.scrollHeight > s.clientHeight + 2) add('넘침', qidOf(s.lastElementChild || s), '단 아래로 넘침');
        const sr = s.getBoundingClientRect();
        s.querySelectorAll('svg, table, img, .figrow').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && (r.right > sr.right + 3 || r.left < sr.left - 3)) add('넘침', qidOf(el), `단보다 넓음 (${el.tagName.toLowerCase()})`);
        });
      });
      // 문제 머리 두 줄
      pg.querySelectorAll('.q-head').forEach((h) => { if (h.getBoundingClientRect().height > 40) add('머리', qidOf(h), '문제 머리가 두 줄'); });
      // 그림 안 글자: 잘림 · 겹침 · 작은 글씨
      pg.querySelectorAll('svg').forEach((svg) => {
        const vb = svg.viewBox && svg.viewBox.baseVal;
        const R = svg.getBoundingClientRect();
        if (!vb || !vb.width || !R.width) return;
        const scale = R.width / vb.width;
        const texts = [...svg.querySelectorAll('text')].filter((t) => t.textContent.trim());
        const qid = qidOf(svg);
        let minPt = 99, minTxt = '';
        const boxes = [];
        for (const t of texts) {
          const pt = parseFloat(getComputedStyle(t).fontSize) * scale * 0.75; // 화면 px → pt (A4 실제 크기 기준)
          if (pt < minPt) { minPt = pt; minTxt = t.textContent.trim(); }
          const r = t.getBoundingClientRect();
          if (r.width && (r.left < R.left - 2 || r.right > R.right + 2 || r.top < R.top - 2 || r.bottom > R.bottom + 2)) add('잘림', qid, `그림 밖으로 나간 글자 '${t.textContent.trim().slice(0, 20)}'`);
          boxes.push([r, t.textContent.trim()]);
        }
        if (minPt < MIN_PT) add('작은글씨', qid, `그림 글자 ${minPt.toFixed(1)}pt ('${minTxt.slice(0, 15)}')`);
        // 같은 이름이 한 그림에 두 번(예: 태평양 중심 지도에 '태평양 태평양') — 눈금 숫자·기호는 빼고
        const named = boxes.filter(([, t]) => t.replace(/\s/g, '').length >= 2 && !/^[\d.,~%()\-+℃가-라A-E①-⑤ㄱ-ㄹ]+$/.test(t.replace(/\s/g, '')));
        const twice = new Set();
        for (let a = 0; a < named.length; a++) for (let b = a + 1; b < named.length; b++)
          if (named[a][1] === named[b][1] && Math.hypot(named[a][0].left - named[b][0].left, named[a][0].top - named[b][0].top) < R.width * 0.4) twice.add(named[a][1]);
        twice.forEach((t) => add('중복', qid, `그림에 '${t.slice(0, 12)}'가 두 번`));
        // 연도에 천 단위 쉼표(예: '1,920')
        if (boxes.some(([, t]) => /^1,[89]\d\d$|^2,0\d\d$/.test(t))) add('쉼표', qid, '연도 눈금에 쉼표(1,920 등)');
        const seen = new Set();
        for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
          const [ra, ta] = boxes[a], [rb, tb] = boxes[b];
          const small = Math.min(ra.width * ra.height, rb.width * rb.height);
          if (small > 0 && inter(ra, rb) > small * 0.25) {
            const key = `${ta}|${tb}`;
            if (!seen.has(key)) { seen.add(key); add('겹침', qid, `그림 글자 겹침 '${ta.slice(0, 12)}' / '${tb.slice(0, 12)}'`); }
          }
        }
      });
      // 빈 단: 단원·회차가 끝나는 쪽, 마지막 쪽은 빼고
      const last = i === pages.length - 1;
      slots.forEach((s, k) => {
        if (last || !s.children.length) return;
        const sr = s.getBoundingClientRect(), lr = s.lastElementChild.getBoundingClientRect();
        const free = (sr.bottom - lr.bottom) / sr.height;
        if (free <= EMPTY) return;
        const region = s.closest('.region');
        const regionSlots = region ? [...region.querySelectorAll('.slot')] : slots;
        const isRegionEnd = region && region.dataset.end && regionSlots.indexOf(s) >= regionSlots.length - 2;
        const nextPage = pages[i + 1];
        const nextStartsNew = nextPage && (nextPage.querySelector('.band, .wb-chap, .wb-mock') && !region?.nextElementSibling);
        if (isRegionEnd || (k === slots.length - 1 && nextStartsNew)) return;
        out.push({ page: no, kind: '빈단', qid: qidOf(s.lastElementChild), msg: `단 ${k + 1} 아래 ${Math.round(free * 100)}% 빔`, free });
      });
    });
    return out;
  }, { MIN_PT, EMPTY });
  await page.close();
  const list = only ? found.filter((x) => only.has(x.qid)) : found;
  all[f.replace(/\.html$/, '')] = list;
  const by = {};
  list.forEach((x) => (by[x.kind] = (by[x.kind] || 0) + 1));
  console.log(`\n■ ${f.replace(/\.html$/, '')}: ${list.length ? Object.entries(by).map(([k, n]) => `${k} ${n}`).join(' · ') : '걸린 곳 없음'}`);
  const empties = list.filter((x) => x.kind === '빈단');
  if (empties.length) console.log(`  빈 단 ${empties.length}곳, 평균 ${Math.round((empties.reduce((a, x) => a + x.free, 0) / empties.length) * 100)}% 빔${showAll ? '' : ' (50% 넘는 것만 아래에 — 전부는 --all)'}`);
  for (const x of list) if (x.kind !== '빈단' || showAll || x.free > 0.5) console.log(`  ${String(x.page).padStart(3)}쪽 [${x.kind}] ${x.qid || '-'}  ${x.msg}`);
}
await browser.close();
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(all, null, 1));
