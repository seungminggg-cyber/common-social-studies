// 기출변형 문제집 만들기: 문항(content) → HTML → (자동 쪽 나눔) → PDF / PNG / 한글 파일용 JSON
//
//   node build.mjs 1                 1차: 단원별 문제(학생용) + 모의고사 + 정답과 해설
//   node build.mjs 1 units t2-04     1차 단원별 중 t2-04만 (시험판 확인용)
//   node build.mjs 1 mock png        1차 모의고사만, 쪽 그림(PNG)까지
//   node build.mjs 2 teacher         교사용(정답 표시·해설이 문제 아래)도 함께
//   node build.mjs 1 book t1         단원별을 책(t1 = 통합사회1, t2 = 통합사회2)으로 나눠 만들기
//   node build.mjs vol t1            합본 MINIMAX 기출분석 통합사회1(기본편 + 심화편, 2026-11-07) — 아래 '합본' 참고
//
// 결과: out/<차수>/*.pdf, out/<차수>/png/, out/<차수>/<이름>.json(한글 파일용), out/<차수>/fig/<이름>/*.png
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { FIGURE_TYPES } from '../textbook/lib/figures.js';
import { ensureTerrain } from '../textbook/lib/terrain.js';
import { BOOKS, UNITS } from './lib/units.js';
import { renderUnits, renderMocks, renderAnswers } from './lib/wb-render.js';
import { chapters } from './cover/book-data.js';
import { mmVol } from './cover/mm-data.js';
import { mmSubjectPage, mmChapterPage, mmTitlePage, mmAnswerTitlePage, MM_DIV_CSS } from './cover/mm-div.js';
import { setX5Palette } from './cover/mmx.js';
import { maxiTitlePage, maxiLogPage, maxiRoundPage, maxiAnswerTitlePage, MX_CSS } from './cover/maxi.js';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); } })();
const ROOT = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const ed = args.find((a) => a === '1' || a === '2') || '1';
const what = args.find((a) => ['units', 'mock', 'answers', 'all'].includes(a)) || 'all';
const only = args.filter((a) => /^t[12]-\d\d$/.test(a));
const sub = args.find((a) => a === 't1' || a === 't2'); // 책 하나만
const wantPng = args.includes('png');
const teacher = args.includes('teacher');
// mm: MINIMAX 완성본 본문 — 과목 간지·대단원 간지를 쪽 나누기에 넣고(쪽 번호·차례가 함께 맞춰짐), 글꼴을 인쇄용 TrueType으로
const mmMode = args.includes('mm');
// mx: MAXIMIN 완성본 본문(2차 모의고사 10회) — 속표지·차례와 성적 기록표·회차 간지 + 인쇄용 TrueType 글꼴
const mxMode = args.includes('mx');
// vol: 합본(기본편 + 심화편을 과목별 한 권으로, 2026-11-07) → out/vol/
const volMode = args.includes('vol');
const OUT = join(ROOT, 'out', volMode ? 'vol' : ed);
mkdirSync(join(OUT, 'png'), { recursive: true });
const EDITION = ed === '1' ? '1차 · 겨울방학 특강판' : '2차 · 심화(중상·상)판';
// soft: 단원이 끝난 쪽에 자리가 남으면 다음 단원을 이어서 싣는다(대단원 첫 단원은 새 쪽). 순서 정하기(order)에서는 끔.
const LAYOUT = { cover: 1, toc: 1, exam: 2, mock: 2, answers: 2, soft: args.includes('order') ? [] : ['exam'], memoMin: 0.4, spreadMax: 9 };
const paginateJs = readFileSync(join(ROOT, '../textbook/lib/paginate.js'), 'utf8');

// 단원별 문항 모으기 (책 순서)
async function loadUnits(raw = false) {
  const dir = join(ROOT, 'content', ed);
  const keys = Object.keys(UNITS).filter((k) => existsSync(join(dir, `${k}.js`)) && (raw || ((!only.length || only.includes(k)) && (!sub || k.startsWith(sub)))));
  // 책에 싣는 순서(order.json, 'order' 명령으로 만듦). 없거나 빠진 문항은 파일 순서대로 뒤에.
  const orderFile = join(dir, 'order.json');
  const order = !raw && existsSync(orderFile) ? JSON.parse(readFileSync(orderFile, 'utf8')) : {};
  const sets = [];
  for (const k of keys) {
    const mod = (await import(pathToFileURL(join(dir, `${k}.js`)).href)).default;
    let qs = mod.questions || mod;
    if (order[k]) {
      const pos = new Map(order[k].map((id, i) => [id, i]));
      qs = [...qs].sort((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9));
    }
    sets.push({ unit: UNITS[k], qs });
  }
  return sets;
}
async function loadMocks() {
  const dir = join(ROOT, 'content', ed, 'mock');
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => /^m\d+\.js$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
  const out = [];
  for (const f of files) out.push((await import(pathToFileURL(join(dir, f)).href)).default);
  return out;
}

// 지도 범례·화살표 이름표 글씨를 문제집에서만 키운다(한 단 너비에 줄어들면 4pt 안팎이라 인쇄하면 안 읽힘).
// 지도 폭(w, 기본 600)에 맞춰 약 6~7pt가 되도록. 문항에 legendSize·size를 적으면 그 값을 쓴다.
function bigMapText(root) {
  const walk = (x) => {
    if (Array.isArray(x)) return x.forEach(walk);
    if (!x || typeof x !== 'object') return;
    // 기후 그래프를 나란히 둔 줄: 한 줄에 셋이면 글씨가 3pt 안팎 → 두 개씩 놓고(cols 2), 그래프 폭을 줄여 글씨를 키운다
    if (x.t === 'figrow' && x.items.every((i) => i.kind === 'climate' || i.kind === 'climdev')) {
      if (x.items.length >= 3 && !x.cols) x.cols = 2;
      for (const i of x.items) if (i.compact && !i.w) i.w = 240;
    }
    if (x.t === 'map') {
      const s = Math.max(11, Math.round((x.w || 600) * 0.036 * 10) / 10);
      if (x.legend && !x.legendSize) x.legendSize = s;
      for (const a of x.arrows || []) if (a.label && !a.size) a.size = s;
    }
    Object.values(x).forEach(walk);
  };
  walk(root);
}

// 강사 요청(2026-11-07, MAXIMIN 7회 검수):
//  · 문제 쪽에는 출처, '가상 자료', '(실제 … 단순화)', '개념도' 같은 표시를 싣지 않는다.
//    실제 통계·지도 자료의 출처는 정답과 해설의 해설 끝에 '자료 출처'로 옮긴다(Natural Earth는 공공 영역이라 뺌).
//  · '옳지 않은 것' 발문의 '않은'에 검정 밑줄(__않은__ → PDF·한글 파일 모두 밑줄).
const LABEL_NOTE = (s) => String(s)
  .replace(/\s*\((?:가상 자료|가상 사례)\)/g, '')
  .replace(/,\s*가상 자료/g, '')
  .replace(/\.?\s*가상 자료\.?/g, (m) => (m.startsWith('.') ? '.' : ''))
  .replace(/[^.]*실제[^.]*단순화[^.]*\.\s*/g, '')
  .replace(/\(\s*\)/g, '')
  .trim();
function realSources(src) {
  const out = [];
  for (let part of String(src).split(/\s+\/\s+/)) {
    const inner = part.match(/\((지도 자료:[^)]*)\)/);
    if (/^(가상|개념도)/.test(part)) { if (inner) part = inner[1]; else continue; }
    part = part.replace(/\s*\((?:[^()]*(?:단순화|대략|개념도|가상)[^()]*)\)/g, '').trim();
    const map = /^지도 자료:/.test(part);
    let body = part.replace(/^(지도 )?자료:\s*/, '');
    body = body.split(/,\s*/).filter((x) => !/^Natural Earth$/.test(x)).join(', ');
    if (body) out.push(map ? `지도: ${body}` : body);
  }
  return out;
}
function cleanLabels(root) {
  const fix = (q) => {
    if (q._labelsDone) return;
    q._labelsDone = true;
    const found = [];
    const walk = (x) => {
      if (Array.isArray(x)) return x.forEach(walk);
      if (!x || typeof x !== 'object') return;
      if (typeof x.source === 'string') {
        // '가상 자료(단위: %)'처럼 출처 칸에 적어 둔 단위는 그림 설명으로 옮긴다
        const unit = x.source.match(/\((단위:[^)]*)\)/);
        if (unit && !String(x.note || '').includes(unit[1])) x.note = `(${unit[1]})${x.note ? ' ' + x.note : ''}`;
        found.push(...realSources(x.source));
        delete x.source;
      }
      if (typeof x.note === 'string') { x.note = LABEL_NOTE(x.note); if (!x.note) delete x.note; }
      if (typeof x.unit === 'string') x.unit = LABEL_NOTE(x.unit);
      if (typeof x.title === 'string') x.title = x.title.replace(/\s*\((?:개념도|가상 자료)\)/g, '');
      if (x.t === 'p' && typeof x.text === 'string') x.text = x.text.replace(/\s*\((?:가상 자료|새로 씀|새로 옮김)\)/g, '').replace(/(을|를) 새로 옮김\)/g, ')');
      Object.values(x).forEach(walk);
    };
    walk(q.data || []);
    q.data = (q.data || []).filter((d) => !(d.t === 'p' && !String(d.text || '').trim()));
    const uniq = [...new Set(found)];
    if (uniq.length) q.explain = `${q.explain} (자료 출처: ${uniq.join(' / ')})`;
    if (typeof q.stem === 'string') q.stem = q.stem.replace(/(지\s)않은(?=\s*것)/, '$1__않은__').replace(/다음 가상 (사례|신문 기사|기사)/g, '다음 $1');
  };
  const walk = (x) => {
    if (Array.isArray(x)) return x.forEach(walk);
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x.choices) && 'explain' in x) return fix(x);
    Object.values(x).forEach(walk);
  };
  walk(root);
}

// 그림 블록마다 번호 → PDF와 한글 파일이 같은 그림을 가리키게
function numberFigures(root) {
  let n = 0;
  const walk = (x) => {
    if (Array.isArray(x)) return x.forEach(walk);
    if (!x || typeof x !== 'object') return;
    if (FIGURE_TYPES.has(x.t)) x._fig = `f${String(++n).padStart(3, '0')}`;
    if (x.t === 'figrow') x._fig = `r${String(++n).padStart(3, '0')}`;
    Object.values(x).forEach(walk);
  };
  walk(root);
  return n;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
let failed = false;

async function emit(name, html, data) {
  const htmlPath = join(OUT, `${name}.html`);
  writeFileSync(htmlPath, html.replace('__LAYOUT__', JSON.stringify(LAYOUT)).replace('__PAGINATE__', () => paginateJs));
  if (data) writeFileSync(join(OUT, `${name}.json`), JSON.stringify(data));
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { console.error(`[${name}] 페이지 오류:`, e.message); failed = true; });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForFunction(() => window.PAGINATED === true, null, { timeout: 600000 });
  const { pages, warn } = await page.evaluate(() => ({ pages: window.PAGES, warn: window.WARN }));
  // 넘침 검사: 단 밖으로 나간 내용, 단보다 넓은 그림·표
  const over = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.page').forEach((pg, i) => {
      const no = i + 1;
      pg.querySelectorAll('.slot').forEach((s) => { if (s.scrollHeight > s.clientHeight + 2) out.push(`${no}쪽: 단 아래로 넘침`); });
      pg.querySelectorAll('.slot').forEach((s) => {
        const sr = s.getBoundingClientRect();
        s.querySelectorAll('svg, table, img, .figrow').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && (r.right > sr.right + 3 || r.left < sr.left - 3)) out.push(`${no}쪽: 단보다 넓음 (${el.tagName.toLowerCase()} ${Math.round(r.width)}px > ${Math.round(sr.width)}px) — ${(el.closest('.row')?.querySelector('.q-stem')?.textContent || '').slice(0, 30)}`);
        });
      });
      pg.querySelectorAll('.q-head').forEach((h) => { if (h.getBoundingClientRect().height > 40) out.push(`${no}쪽: 문제 머리 두 줄 — ${h.textContent.trim().slice(0, 30)}`); });
    });
    return out;
  });
  if (over.length) console.warn(`[${name}] 넘침 검사:\n  ` + [...new Set(over)].join('\n  '));
  if (warn.length) console.warn(`[${name}] 경고:\n  ` + warn.join('\n  '));
  await page.pdf({ path: join(OUT, `${name}.pdf`), preferCSSPageSize: true, printBackground: true });
  if (wantPng) {
    const dir = join(OUT, 'png', name);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const els = await page.$$('.page');
    for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: join(dir, `${String(i + 1).padStart(3, '0')}.png`) });
  }
  if (data) { // 한글 파일용 그림
    const dir = join(OUT, 'fig', name);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    for (const el of await page.$$('figure[data-fig]')) {
      const body = await el.$('.fig-body');
      await (body || el).screenshot({ path: join(dir, `${await el.getAttribute('data-fig')}.png`) });
    }
    for (const el of await page.$$('.figrow[data-row]')) await el.screenshot({ path: join(dir, `${await el.getAttribute('data-row')}.png`) });
  }
  console.log(`${name}: ${pages}쪽 → out/${volMode ? "vol" : ed}/${name}.pdf`);
  await page.close();
}

// ── 문항 순서 정하기 (node build.mjs <차수> order) ──
// 지문이 긴 중상·상 문항만 이어지면 한 단에 한두 문제만 들어가 빈 곳이 생긴다.
// 문항마다 실제 높이를 잰 뒤, 단마다 남은 높이에 가장 꼭 맞는 문항을 골라 넣는다(난이도가 이어지지 않게 섞음).
// 결과는 content/<차수>/order.json(단원별 문항 id 순서)에 저장하고, 빌드·정답과 해설·한글 파일이 모두 이 순서를 쓴다.
async function measure(sets) {
  // 실제 책과 같은 모양으로 높이를 잰다(그림 글씨 키우기, 출처·가상 자료 표시 빼기)
  bigMapText(sets.map((s) => s.qs));
  cleanLabels(sets.map((s) => s.qs));
  const htmlPath = join(OUT, '_order.html');
  writeFileSync(htmlPath, renderUnits(sets, { title: 'order', edition: '', mode: 'student' }).replace('__LAYOUT__', JSON.stringify(LAYOUT)).replace('__PAGINATE__', () => paginateJs));
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForFunction(() => window.PAGINATED === true, null, { timeout: 600000 });
  const m = await page.evaluate(() => {
    document.querySelectorAll('.page.tight').forEach((p) => p.classList.remove('tight'));
    const rows = [...document.querySelectorAll('.row-q[data-qid]')];
    rows.forEach((r) => (r.style.marginTop = ''));
    const second = rows.find((r) => r.previousElementSibling && r.previousElementSibling.classList.contains('row-q'));
    const gap = parseFloat(getComputedStyle(second).marginTop);
    const h = {};
    rows.forEach((r) => (h[r.dataset.qid] = r.getBoundingClientRect().height));
    const slots = [...document.querySelectorAll('.region-exam .slot')];
    const H = Math.max(...slots.map((s) => s.clientHeight));
    // 단원 첫 문항이 놓인 단의 높이(대단원 머리·단원 띠가 위에 있는 쪽)
    const cap = {};
    const band = {};
    const probe = slots.find((s) => s.clientHeight === H);
    document.querySelectorAll('.wb-band').forEach((b) => {
      const key = b.id.replace('u-', '');
      const first = document.querySelector(`.row-q[data-qid^="${key}-"]`);
      cap[key] = first.closest('.slot').clientHeight;
      const r = document.createElement('div');
      r.className = 'row row-top';
      const top = document.createElement('div');
      top.className = 'top';
      top.appendChild(b.cloneNode(true));
      r.appendChild(top);
      probe.prepend(r);
      band[key] = r.getBoundingClientRect().height;
      r.remove();
    });
    const st = document.querySelector('.row-step'); // 합본의 단계 머리
    return { gap, h, H, cap, band, step: st ? st.getBoundingClientRect().height : 0 };
  });
  await page.close();
  rmSync(htmlPath, { force: true });
  return m;
}

function packOrder(sets, m) {
  const { gap, h, H, cap, band } = m;
  const order = {};
  const SOFT = 0.28; // paginate.js의 softMin
  let R = 0, col = 2, colCap = H; // 지금 단에 남은 높이, 단 번호(0·1), 단 높이
  const newPage = (c) => { col = 0; colCap = c; R = c; };
  const nextCol = () => { if (col === 0) { col = 1; R = colCap; } else newPage(H); };
  let prevBook = null;
  for (const { unit, qs } of sets) {
    const first = unit.book !== prevBook; // 대단원 첫 단원: 언제나 새 쪽
    prevBook = unit.book;
    let left = [...qs];
    const out = [];
    let lastLv = null;
    const fits = (q) => h[q.id] + (R < colCap ? gap : 0) <= R + 1;
    const pick = () => {
      const ok = left.filter(fits);
      if (!ok.length) return null;
      const best = Math.max(...ok.map((q) => h[q.id]));
      const near = ok.filter((q) => h[q.id] >= best - 45); // 거의 꼭 맞는 것들 가운데
      return near.find((q) => q.level !== lastLv) || near[0]; // 앞 문항과 난이도가 다른 것을 먼저
    };
    const put = (q) => { R -= h[q.id] + (R < colCap ? gap : 0); out.push(q); lastLv = q.level; left = left.filter((x) => x !== q); };
    // 단원 띠 놓기
    if (first) newPage(cap[unit.key]);
    else if (col === 0 || R > colCap * SOFT) {
      if (R < colCap * SOFT) nextCol();
      R -= band[unit.key] + (R < colCap ? gap : 0);
      if (!pick()) { nextCol(); R -= band[unit.key]; }
    } else newPage(cap[unit.key]);
    while (left.length) {
      const q = pick();
      if (q) { put(q); continue; }
      if (R >= colCap - 1) { put([...left].sort((a, b) => h[b.id] - h[a.id])[0]); continue; } // 한 단보다 큰 문항
      nextCol();
    }
    order[unit.key] = out.map((q) => q.id);
  }
  return order;
}

// ── 합본(강사 2026-11-07: "기본편과 심화편을 나누는 게 의미가 있나, 섞어서 한 권으로") ──
//   과목별 두 권: MINIMAX 기출분석 통합사회1 · 통합사회2. 중단원마다 STEP 1 기본(1차 문항) → STEP 2 심화(2차 문항),
//   문항 번호는 중단원 안에서 이어진다. 권 끝에 1차 실전 모의고사(통합사회1 권: 통합사회1 범위 1회 / 통합사회2 권: 통합사회2 범위 1회 + 전 범위 2회, 권마다 1회부터).
//   node build.mjs vol order            → content/order-vol.json(단계마다 실제 높이를 재서 단을 꼭 맞게 채우는 순서)
//   node build.mjs vol t1 [teacher] [png] → out/vol/MINIMAX-통합사회1-본문.pdf · -정답과해설.pdf (· -교사용.pdf) + 한글 파일용 JSON
//   문항 파일(content/1·2)은 그대로 — 1차·2차 문항 id도 그대로다.
const VOL_ORDER = join(ROOT, 'content', 'order-vol.json');
const VOL_MOCKS = { t1: [1], t2: [2, 3, 4] };
const edOrders = {};
const edOrder = (e) => (edOrders[e] ??= existsSync(join(ROOT, 'content', e, 'order.json')) ? JSON.parse(readFileSync(join(ROOT, 'content', e, 'order.json'), 'utf8')) : {});
async function loadVol(subj, raw = false) {
  const vo = !raw && existsSync(VOL_ORDER) ? JSON.parse(readFileSync(VOL_ORDER, 'utf8')) : {};
  const out = [];
  for (const k of Object.keys(UNITS).filter((x) => x.startsWith(subj) && (raw || !only.length || only.includes(x)))) {
    const steps = [];
    for (const [e, step] of [['1', 1], ['2', 2]]) {
      const f = join(ROOT, 'content', e, `${k}.js`);
      if (!existsSync(f)) continue;
      const mod = (await import(pathToFileURL(f).href)).default;
      const qs = (mod.questions || mod).map((q) => ({ ...q, _step: step }));
      const ord = (!raw && vo[k]?.[step]) || edOrder(e)[k];
      if (ord) { const pos = new Map(ord.map((id, i) => [id, i])); qs.sort((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9)); }
      steps.push({ step, qs });
    }
    out.push({ unit: UNITS[k], steps, qs: steps.flatMap((x) => x.qs) });
  }
  return out;
}
async function loadVolMocks(subj) {
  const out = [];
  for (const [i, no] of VOL_MOCKS[subj].entries()) {
    const m = (await import(pathToFileURL(join(ROOT, 'content', '1', 'mock', `m${no}.js`)).href)).default;
    out.push({ ...m, no: i + 1, orig: m.no, questions: m.questions.map((q) => ({ ...q })) });
  }
  return out;
}
// packOrder와 같은 방식 + 단계 머리(다음 문항과 같은 단). 결과: { 't1-01': { 1: [id…], 2: [id…] } }
function packOrderVol(sets, m) {
  const { gap, h, H, cap, band, step: stepH } = m;
  const order = {};
  const SOFT = 0.28;
  let R = 0, col = 2, colCap = H;
  const newPage = (c) => { col = 0; colCap = c; R = c; };
  const nextCol = () => { if (col === 0) { col = 1; R = colCap; } else newPage(H); };
  const g = () => (R < colCap ? gap : 0);
  let prevBook = null;
  for (const { unit, steps } of sets) {
    const first = unit.book !== prevBook;
    prevBook = unit.book;
    const fitsAny = (list, extra) => list.some((q) => h[q.id] + extra <= R + 1);
    if (first) newPage(cap[unit.key]);
    else if (col === 0 || R > colCap * SOFT) {
      if (R < colCap * SOFT) nextCol();
      R -= band[unit.key] + g();
      if (!fitsAny(steps[0].qs, stepH + 2 * gap)) { nextCol(); R -= band[unit.key]; }
    } else newPage(cap[unit.key]);
    order[unit.key] = {};
    for (const { step, qs } of steps) {
      if (!fitsAny(qs, stepH + g() + gap)) nextCol(); // 단계 머리만 단 아래에 남지 않게
      R -= stepH + g();
      let left = [...qs];
      const out = [];
      let lastLv = null;
      const fits = (q) => h[q.id] + g() <= R + 1;
      const pick = () => {
        const ok = left.filter(fits);
        if (!ok.length) return null;
        const best = Math.max(...ok.map((q) => h[q.id]));
        const near = ok.filter((q) => h[q.id] >= best - 45);
        return near.find((q) => q.level !== lastLv) || near[0];
      };
      const put = (q) => { R -= h[q.id] + g(); out.push(q); lastLv = q.level; left = left.filter((x) => x !== q); };
      while (left.length) {
        const q = pick();
        if (q) { put(q); continue; }
        if (R >= colCap - 1) { put([...left].sort((a, b) => h[b.id] - h[a.id])[0]); continue; }
        nextCol();
      }
      order[unit.key][step] = out.map((q) => q.id);
    }
  }
  return order;
}
if (volMode) {
  if (args.includes('order')) {
    const order = {};
    for (const subj of ['t1', 't2']) {
      const vs = await loadVol(subj, true);
      Object.assign(order, packOrderVol(vs, await measure(vs)));
    }
    writeFileSync(VOL_ORDER, JSON.stringify(order, null, 1) + '\n');
    console.log(`합본 문항 순서 저장: content/order-vol.json (${Object.keys(order).length}개 단원)`);
    await browser.close();
    process.exit(0);
  }
  const subj = sub || 't1';
  const SUBJ = subj === 't1' ? '통합사회1' : '통합사회2';
  const vsets = await loadVol(subj);
  const vmocks = only.length ? [] : await loadVolMocks(subj);
  bigMapText(vsets.map((x) => x.qs));
  bigMapText(vmocks);
  cleanLabels(vsets.map((x) => x.qs));
  cleanLabels(vmocks);
  numberFigures([vsets.map((x) => x.qs), vmocks]); // 권 하나에 그림 번호 한 줄(본문과 모의고사가 같은 문서)
  ensureTerrain([...vsets.flatMap((x) => x.qs), ...vmocks.flatMap((m) => m.questions)]);
  const v = mmVol(`02-${subj}`);
  setX5Palette(v.pal); // 통합사회1 남색 · 통합사회2 보라
  const name = `MINIMAX ${v.kind.replace(/^통합사회 /, '')}`;
  const chs = await chapters('vol');
  const faces = printFaces();
  const css = `${faces}\n${MM_DIV_CSS}\n.page-mxtitle .page-head, .page-mxtitle .page-foot, .page-mxtitle .edge-tab { visibility: hidden; }\n.page-mxtitle .mm-page { --mm-sans: 'KoPubWorld Dotum'; }`;
  const fix = (h) => h.replace(/@font-face \{ font-family: 'Pretendard Variable';[^}]*\}/, '').replace('</head>', `<style>${css}</style></head>`);
  let uid = 0;
  const mm = {
    headLeft: `<b>${name}</b> ${SUBJ}`,
    title: () => mmTitlePage(v),
    subject: (x) => mmSubjectPage(x, chs.filter((c) => c.subject === x), { name, uid: `s${uid++}` }),
    chapter: (key) => mmChapterPage(chs.find((c) => c.key === key), { name, uid: `c${uid++}` }),
  };
  const base = `MINIMAX-${SUBJ}${only.length ? `-${only.join('_')}` : ''}`;
  const vtitle = `${name} ${SUBJ}`;
  const data = { kind: 'vol', subject: SUBJ, name, sets: vsets.map((x) => ({ unit: x.unit, steps: x.steps })), mocks: vmocks };
  await emit(`${base}-본문`, fix(renderUnits(vsets, { title: vtitle, edition: '', mode: 'student', mm, mocks: vmocks })), data);
  if (teacher) await emit(`${base}-교사용`, fix(renderUnits(vsets, { title: `${vtitle} 교사용`, edition: '', mode: 'teacher', mm, mocks: vmocks })));
  LAYOUT.soft = ['answers'];
  const groups = [
    ...vsets.map((x) => ({ no: x.unit.no, tab: BOOKS[x.unit.book].chapter.no, title: x.unit.title, qs: x.qs })),
    ...vmocks.map((m) => ({ no: `실전 모의고사 ${m.no}회`, tab: '모의', title: m.range, qs: m.questions, mock: true })),
  ];
  await emit(`${base}-정답과해설`, fix(renderAnswers(groups, { title: vtitle, edition: '', mx: { cover: () => mmAnswerTitlePage(v), headLeft: `<b>${name}</b> ${SUBJ} 정답과 해설` } })));
  await browser.close();
  process.exit(failed ? 1 : 0);
}

const title = `기출변형 문제집 ${ed}차`;
if (args.includes('order')) {
  const all = await loadUnits(true);
  const order = {};
  for (const book of ['t1', 't2']) {
    const s = all.filter((x) => x.unit.key.startsWith(book));
    if (!s.length) continue;
    Object.assign(order, packOrder(s, await measure(s)));
  }
  writeFileSync(join(ROOT, 'content', ed, 'order.json'), JSON.stringify(order, null, 1) + '\n');
  console.log(`문항 순서 저장: content/${ed}/order.json (${Object.keys(order).length}개 단원)`);
  await browser.close();
  process.exit(0);
}
const sets = what === 'mock' ? [] : await loadUnits();
const mocks = what === 'units' || only.length || sub ? [] : await loadMocks();
bigMapText(sets.map((s) => s.qs));
bigMapText(mocks);
cleanLabels(sets.map((s) => s.qs));
cleanLabels(mocks);
numberFigures(sets.map((s) => s.qs));
numberFigures(mocks);
ensureTerrain([...sets.flatMap((s) => s.qs), ...mocks.flatMap((m) => m.questions)]);
const tag = only.length ? `-${only.join('_')}` : sub ? `-${sub === 't1' ? '통합사회1' : '통합사회2'}` : '';

// 인쇄용 글꼴: KoPub OTF·Pretendard 가변 글꼴은 PDF에 Type 3으로 들어가므로 TrueType 파일로 바꿔 쓴다(cover/otf2ttf.py가 만든 것)
function printFaces() {
  const TTF = join(ROOT, 'out/cover/fonts'), PRE = join(ROOT, '../textbook/node_modules/pretendard/dist/public/static/alternative');
  if (!existsSync(join(TTF, 'KoPubWorld-Dotum-Bold.ttf'))) { console.error('TrueType 글꼴이 없습니다 → python3 cover/otf2ttf.py'); process.exit(1); }
  return [['Dotum', 300, 'Light'], ['Dotum', 400, 'Medium'], ['Dotum', 700, 'Bold'], ['Batang', 300, 'Light'], ['Batang', 400, 'Medium'], ['Batang', 700, 'Bold']]
    .map(([fam, w, n]) => `@font-face{font-family:'KoPubWorld ${fam}';font-weight:${w};src:url('file://${TTF}/KoPubWorld-${fam}-${n}.ttf');}`)
    .concat([[300, 'Light'], [400, 'Regular'], [500, 'Medium'], [600, 'SemiBold'], [700, 'Bold'], [800, 'ExtraBold']].map(([w, n]) => `@font-face{font-family:'Pretendard Variable';font-weight:${w};src:url('file://${PRE}/Pretendard-${n}.ttf');}`))
    // 표지와 같은 그림을 쓰는 속표지(cover/mmx.js)는 글꼴 이름 'KoPub Dotum'·'KoPub Batang'을 쓴다
    .concat([['Dotum', 300, 'Light'], ['Dotum', 500, 'Medium'], ['Dotum', 700, 'Bold'], ['Batang', 300, 'Light'], ['Batang', 500, 'Medium'], ['Batang', 700, 'Bold']].map(([fam, w, n]) => `@font-face{font-family:'KoPub ${fam}';font-weight:${w};src:url('file://${TTF}/KoPubWorld-${fam}-${n}.ttf');}`))
    .join('\n');
}

if (mxMode) {
  const faces = printFaces();
  const mx = { headLeft: '<b>MAXIMIN</b> 실전 모의고사', title: () => maxiTitlePage(), log: () => maxiLogPage(mocks), round: (m) => maxiRoundPage(m, { uid: `r${m.no}` }) };
  const html = renderMocks(mocks, { title: 'MAXIMIN 실전 모의고사', edition: EDITION, mode: 'student', mx })
    .replace(/@font-face \{ font-family: 'Pretendard Variable';[^}]*\}/, '')
    .replace('</head>', `<style>${faces}\n${MX_CSS}</style></head>`);
  await emit('MAXIMIN-본문', html);
  // 정답과 해설 별책(강사 2026-11-07): 별책 속표지 + 회차마다 빠른 정답·해설. 회차 묶음은 쪽에 자리가 남으면 이어 싣는다.
  LAYOUT.soft = ['answers'];
  const groups = mocks.map((m) => ({ no: `${m.no}회`, tab: `${m.no}회`, title: m.range, qs: m.questions, mock: true }));
  const ans = renderAnswers(groups, { title: 'MAXIMIN 실전 모의고사', edition: EDITION, mx: { cover: () => maxiAnswerTitlePage(), headLeft: '<b>MAXIMIN</b> 정답과 해설' } })
    .replace(/@font-face \{ font-family: 'Pretendard Variable';[^}]*\}/, '')
    .replace('</head>', `<style>${faces}\n${MX_CSS}</style></head>`);
  await emit('MAXIMIN-정답과해설', ans);
  await browser.close();
  process.exit(failed ? 1 : 0);
}
if (mmMode) {
  const faces = printFaces();
  const v = mmVol(ed === '1' ? '02' : '03-old');
  const name = `MINIMAX ${v.kind.replace(/^통합사회 /, '')}`;
  const chs = await chapters(ed);
  let uid = 0;
  const mm = {
    headLeft: `<b>${name}</b>`,
    title: () => mmTitlePage(v),
    subject: (sub) => mmSubjectPage(sub, chs.filter((c) => c.subject === sub), { name, uid: `s${uid++}` }),
    chapter: (key) => mmChapterPage(chs.find((c) => c.key === key), { name, uid: `c${uid++}` }),
  };
  const html = renderUnits(sets, { title: name, edition: EDITION, mode: 'student', mm })
    .replace(/@font-face \{ font-family: 'Pretendard Variable';[^}]*\}/, '')
    .replace('</head>', `<style>${faces}\n${MM_DIV_CSS}</style></head>`);
  await emit(`MINIMAX-${v.no}-본문`, html);
  await browser.close();
  process.exit(failed ? 1 : 0);
}
if (sets.length && what !== 'answers') {
  await emit(`단원별${tag}-학생용`, renderUnits(sets, { title, edition: EDITION, mode: 'student' }), { kind: 'units', ed, sets });
  if (teacher) await emit(`단원별${tag}-교사용`, renderUnits(sets, { title, edition: EDITION, mode: 'teacher' }));
}
if (mocks.length && what !== 'answers') {
  await emit('모의고사-학생용', renderMocks(mocks, { title: `실전 모의고사 ${ed}차`, edition: EDITION, mode: 'student' }), { kind: 'mock', ed, mocks });
  if (teacher) await emit('모의고사-교사용', renderMocks(mocks, { title: `실전 모의고사 ${ed}차`, edition: EDITION, mode: 'teacher' }));
}
if (what === 'all' || what === 'answers') {
  const groups = [
    ...sets.map((s) => ({ no: s.unit.key.replace('t1-', '통합사회1 ').replace('t2-', '통합사회2 '), title: s.unit.title, qs: s.qs })),
    ...mocks.map((m) => ({ no: `모의고사 ${m.no}회`, title: m.range, qs: m.questions, mock: true })),
  ];
  if (groups.length) await emit(`정답과해설${tag}`, renderAnswers(groups, { title, edition: EDITION }));
}
await browser.close();
if (failed) process.exit(1);
