// MINIMAX 킬러편 스킬특강 교재 만들기: 스킬 내용(content/skills.js) + 킬러편 문항(../../content/k, id로 불러옴)
//   → HTML → (자동 쪽 나눔) → PDF / PNG
//
//   (기출변형 폴더에서) node 킬러편/스킬특강/build.mjs            학생용 + 교사용 + 정답과 해설(별책)
//   node 킬러편/스킬특강/build.mjs png        쪽 그림(PNG)까지
//   node 킬러편/스킬특강/build.mjs student    학생용만 (teacher, answers도 같은 방식)
//
// 결과: 기출변형/out/skill/*.pdf, out/skill/png/<이름>/ (결과물은 저장소에 올리지 않는다)
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { ensureTerrain } from '../../../textbook/lib/terrain.js';
import { renderAnswers } from '../../lib/wb-render.js';
import { bigMapText, cleanLabels, numberFigures } from '../../lib/prep.js';
import { BOOKS } from '../../lib/units.js';
import { renderSkill, TITLE } from './render.js';
import { SKILLS, INTRO } from './content/skills.js';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); } })();
const ROOT = dirname(fileURLToPath(import.meta.url));
const WB = join(ROOT, '..', '..');
const OUT = join(WB, 'out', 'skill');
mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
const wantPng = args.includes('png');
const want = ['student', 'teacher', 'answers'].filter((k) => args.includes(k));
const parts = want.length ? want : ['student', 'teacher', 'answers'];

const LAYOUT = { cover: 1, toc: 1, intro: 1, type: 1, exam: 2, answers: 2, soft: ['answers'], memoMin: 0.4, spreadMax: 9 };
const paginateJs = readFileSync(join(WB, '../textbook/lib/paginate.js'), 'utf8');

// 킬러편 문항 모두 읽기(id → 문항). 킬러편 책에 실리는 번호(order.json 순서)도 함께 구한다.
const kdir = join(WB, 'content', 'k');
const order = existsSync(join(kdir, 'order.json')) ? JSON.parse(readFileSync(join(kdir, 'order.json'), 'utf8')) : {};
const qmap = {}, knum = {};
for (const f of readdirSync(kdir).filter((f) => /^t\d-\d+\.js$/.test(f)).sort()) {
  const key = f.replace('.js', '');
  let list = (await import(pathToFileURL(join(kdir, f)).href)).default;
  if (order[key]) { const pos = new Map(order[key].map((id, i) => [id, i])); list = [...list].sort((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9)); }
  list.forEach((q, i) => { qmap[q.id] = q; knum[q.id] = `${key.slice(1, 2)}-${key.slice(3)}-${String(i + 1).padStart(2, '0')}`; });
}
// 쓰는 문항 확인(없는 id, 두 번 쓴 id)
const used = SKILLS.flatMap((s) => [...s.examples.map((e) => e.id), ...s.practice]);
const bad = used.filter((id) => !qmap[id]);
const twice = used.filter((id, i) => used.indexOf(id) !== i);
if (bad.length || twice.length) { console.error('문항 id 오류 — 없음:', bad.join(' ') || '-', '/ 두 번 씀:', twice.join(' ') || '-'); process.exit(1); }
const usedQs = used.map((id) => qmap[id]);
bigMapText(usedQs);
cleanLabels(usedQs);
numberFigures(SKILLS.map((s) => [...s.examples.map((e) => qmap[e.id]), ...s.practice.map((id) => qmap[id])]));
ensureTerrain(usedQs);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });

async function emit(name, html) {
  const htmlPath = join(OUT, `${name}.html`);
  writeFileSync(htmlPath, html.replace('__LAYOUT__', JSON.stringify(LAYOUT)).replace('__PAGINATE__', () => paginateJs));
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { console.error(`[${name}] 페이지 오류:`, e.message); process.exit(1); });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForFunction(() => window.PAGINATED === true, null, { timeout: 600000 });
  const { pages, warn } = await page.evaluate(() => ({ pages: window.PAGES, warn: window.WARN }));
  const over = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.page').forEach((pg, i) => {
      const no = i + 1;
      pg.querySelectorAll('.slot').forEach((s) => { if (s.scrollHeight > s.clientHeight + 2) out.push(`${no}쪽: 단 아래로 넘침`); });
      pg.querySelectorAll('.slot, .sk-ex-q').forEach((s) => {
        const sr = s.getBoundingClientRect();
        s.querySelectorAll('svg, table, img, .figrow').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && (r.right > sr.right + 3 || r.left < sr.left - 3)) out.push(`${no}쪽: 칸보다 넓음 (${el.tagName.toLowerCase()} ${Math.round(r.width)}px > ${Math.round(sr.width)}px)`);
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
  console.log(`${name}: ${pages}쪽 → out/skill/${name}.pdf`);
  await page.close();
}

const content = { SKILLS, INTRO, qmap, knum };
if (parts.includes('student')) await emit('스킬특강-학생용', renderSkill(content, { mode: 'student' }));
if (parts.includes('teacher')) await emit('스킬특강-교사용', renderSkill(content, { mode: 'teacher' }));
if (parts.includes('answers')) {
  const groups = SKILLS.map((s) => ({ no: `스킬 ${s.no}`, tab: s.no, title: `${s.title.replace(/\*\*/g, '')} — 예제 ${s.examples.length} · 연습 ${s.practice.length}`,
    qs: [...s.examples.map((e) => qmap[e.id]), ...s.practice.map((id) => qmap[id])] }));
  const coverHtml = () => `<div class="cover wb-cover sp-cover sk-cover"><div class="cv-deco"><i></i><i></i><i></i></div><div class="cv-brand">승민T 통합사회 · 2028 수능 대비</div>
    <div class="cv-title">MINIMAX 킬러편<br>스킬특강<br>정답과 해설</div><div class="cv-sub">대표 예제 · 연습 문항 — 오답 선지까지 풀이</div><div class="cv-theme">별책</div><div class="cv-unit"></div></div>`;
  const html = renderAnswers(groups, { title: TITLE, mx: { cover: coverHtml, headLeft: `승민T 통합사회 <b>${TITLE}</b> 정답과 해설` } })
    .replace('</head>', '<link rel="stylesheet" href="../../특강/sp.css"><link rel="stylesheet" href="../../킬러편/스킬특강/sk.css"></head>').replace('class="theme-b', 'class="sp sk theme-b');
  await emit('스킬특강-정답과해설', html);
}
await browser.close();
void BOOKS;
