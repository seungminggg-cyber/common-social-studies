// 통합본 만들기: Ⅰ~Ⅴ 대단원을 한 권의 개념서로 + 별책 정답과 해설
//
//   node build-book.mjs            학생용 개념서, 교사용 개념서, 정답과 해설 (PDF 3개)
//   node build-book.mjs png        쪽 그림(PNG)도 저장 (out/png/book-*.png)
//   node build-book.mjs student    학생용만 (teacher, answers 도 따로 고를 수 있음)
//   node build-book.mjs t2         통합사회2 (기본은 통합사회1)
//   node build-book.mjs mm [t2]    MINIMAP 완성본 본문(학생용): 속표지·대단원 간지를 MINIMAP 표지 디자인으로, 인쇄용 TrueType 글꼴
//                                  → out/MINIMAP-통합사회1-본문.pdf + MINIMAP-통합사회1-쪽.json(간지 표의 쪽 번호, 도련 낱장 간지용)
//
// 결과: out/통합사회1-개념서-학생용.pdf, out/통합사회1-개념서-교사용.pdf, out/통합사회1-정답과해설.pdf (t2 면 통합사회2-…)
// 양면 인쇄용: 간지는 늘 오른쪽(홀수) 쪽에 오고, 필요하면 앞에 메모 쪽이 들어간다.
// 교사용은 빈칸과 정답이 채워져 있고, 쪽 번호가 학생용과 같다(해설은 별책에만 있음).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { renderFull } from './lib/render.js';
import { ensureTerrain } from './lib/terrain.js';

const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); }
})();

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'out');
const args = process.argv.slice(2);
// 어느 책을 만들지: 기본은 통합사회1, t2 를 주면 통합사회2
const { default: full } = await import(args.includes('t2') ? './content/_book/t2.js' : './content/_book/t1.js');
const wantPng = args.includes('png');
ensureTerrain(full); // 지형도 바탕 그림이 없으면 만든다
const theme = args.includes('b') ? 'b' : args.includes('d') ? 'd' : 'h'; // 디자인: 기본은 시안 H(편집 디자인형, 2026-11 강사 확정), d·b를 주면 예전 시안
const picked = ['student', 'teacher', 'answers'].filter((k) => args.includes(k));
const mmMode = args.includes('mm');
const jobs = mmMode ? ['student'] : picked.length ? picked : ['student', 'teacher', 'answers'];

// MINIMAP 완성본(2026-11-07): 표지·간지 디자인은 기출변형/cover/(시리즈 표지 폴더)에 있다
let mmOpt = null, mmHead = '';
if (mmMode) {
  const COVER = join(ROOT, '../기출변형/cover');
  const { mmapTitlePage, mmapChapterPage, chapterInfo, MMAP_DIV_CSS } = await import(pathToFileURL(join(COVER, 'mmap-div.js')).href);
  const { MMAP } = await import(pathToFileURL(join(COVER, 'mm-data.js')).href);
  const v = MMAP.vols.find((x) => x.subject === full.subject);
  // 인쇄용 글꼴: KoPub OTF·Pretendard 가변 글꼴은 PDF에 Type 3으로 들어가므로 TrueType으로 바꿔 쓴다(기출변형 cover/otf2ttf.py가 만든 것)
  const TTF = join(ROOT, '../기출변형/out/cover/fonts'), PRE = join(ROOT, 'node_modules/pretendard/dist/public/static/alternative');
  if (!existsSync(join(TTF, 'KoPubWorld-Dotum-Bold.ttf'))) { console.error('TrueType 글꼴이 없습니다 → 기출변형 폴더에서 python3 cover/otf2ttf.py'); process.exit(1); }
  const faces = [['Dotum', 300, 'Light'], ['Dotum', 400, 'Medium'], ['Dotum', 700, 'Bold'], ['Batang', 300, 'Light'], ['Batang', 400, 'Medium'], ['Batang', 700, 'Bold']]
    .map(([fam, w, n]) => `@font-face{font-family:'KoPubWorld ${fam}';font-weight:${w};src:url('file://${TTF}/KoPubWorld-${fam}-${n}.ttf');}`)
    .concat([[300, 'Light'], [400, 'Regular'], [500, 'Medium'], [600, 'SemiBold'], [700, 'Bold'], [800, 'ExtraBold']].map(([w, n]) => `@font-face{font-family:'Pretendard Variable';font-weight:${w};src:url('file://${PRE}/Pretendard-${n}.ttf');}`))
    // 표지와 같은 그림을 쓰는 속표지는 글꼴 이름 'KoPub Dotum'을 쓴다
    .concat([['Dotum', 300, 'Light'], ['Dotum', 500, 'Medium'], ['Dotum', 700, 'Bold'], ['Batang', 300, 'Light'], ['Batang', 500, 'Medium'], ['Batang', 700, 'Bold']].map(([fam, w, n]) => `@font-face{font-family:'KoPub ${fam}';font-weight:${w};src:url('file://${TTF}/KoPubWorld-${fam}-${n}.ttf');}`))
    .join('\n');
  mmHead = `<style>${faces}\n${MMAP_DIV_CSS}</style>`;
  mmOpt = { title: () => mmapTitlePage(v), chapter: (ch, ci, d) => mmapChapterPage(v, chapterInfo(ch, ci), { keys: d.keys || [], uid: `c${ci}` }) };
}

// 시안 B 배치 (개념 1단, 개념 확인 1단, 수능형 문제·정답 2단)
// 개념 확인은 늘 새 쪽에서 시작(개념 부분과 나눔), 정리 노트·오답 노트 옆 안내 문구는 뺀다(2026-11 강사 피드백)
// MINIMAP 완성본(mm)은 쪽수를 줄이려고 개념 확인을 두 단으로(새 쪽에서 시작하는 것은 같음, 2026-11-07 강사)
const layout = { concept: 1, summary: 1, check: mmMode ? 2 : 1, exam: 2, answers: 2, credits: 2, soft: ['exam'], ...(mmMode ? { softRegion: ['exam'] } : {}), memoPrompt: false, keepTerms: true, ...(theme === 'h' ? { memoMin: 0.4, spreadMax: 9 } : {}) };
const NAMES = { student: '개념서-학생용', teacher: '개념서-교사용', answers: '정답과해설' };
const paginateJs = readFileSync(join(ROOT, 'lib/paginate.js'), 'utf8');

mkdirSync(join(OUT, 'png'), { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
let failed = false;
const pageCounts = {};

for (const job of jobs) {
  const part = job === 'answers' ? 'answers' : 'book';
  const mode = job === 'teacher' ? 'teacher' : job === 'answers' ? 'teacher' : 'student';
  // 별책은 대단원을 새 쪽에서 시작하지 않고 이어 붙인다 (자리가 넉넉할 때)
  let html = renderFull(full, { mode, layout: part === 'answers' ? { ...layout, soft: ['answers'] } : layout, paginateJs, part, theme, mm: mmOpt });
  if (mmMode) html = html.replace(/@font-face \{ font-family: 'Pretendard Variable';[^}]*\}/, '').replace('</head>', `${mmHead}</head>`);
  const base = `book-${job}`;
  const htmlPath = join(OUT, `${base}.html`);
  writeFileSync(htmlPath, html);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { console.error(`[${job}] 페이지 오류:`, e.message); failed = true; });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForFunction(() => window.PAGINATED === true, null, { timeout: 300000 });
  const { pages, warn } = await page.evaluate(() => ({ pages: window.PAGES, warn: window.WARN }));
  if (warn.length) console.warn(`[${job}] 경고:\n  ` + warn.join('\n  '));
  const pdf = join(OUT, mmMode ? `MINIMAP-${full.subject}-본문.pdf` : `${full.subject}-${NAMES[job]}.pdf`);
  if (mmMode) { // 간지 표의 쪽 번호(중단원 u01…, 대단원 ch0…) → 도련 낱장 간지에 같은 번호를 쓴다
    const pg = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[id]')].filter((el) => /^(u\d+|ch\d)$/.test(el.id)).map((el) => [el.id, +el.closest('.page')?.querySelector('.folio span')?.textContent || null])));
    writeFileSync(join(OUT, `MINIMAP-${full.subject}-쪽.json`), JSON.stringify(pg, null, 1));
  }
  await page.pdf({ path: pdf, preferCSSPageSize: true, printBackground: true, timeout: 0 });
  if (wantPng) {
    for (const f of readdirSync(join(OUT, 'png'))) if (f.startsWith(`${base}-`)) unlinkSync(join(OUT, 'png', f));
    const els = await page.$$('.page');
    for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: join(OUT, 'png', `${base}-${String(i + 1).padStart(3, '0')}.png`) });
  }
  pageCounts[job] = pages;
  console.log(`${job}: ${pages}쪽 → ${pdf}`);
  await page.close();
}
await browser.close();
if (pageCounts.student && pageCounts.teacher && pageCounts.student !== pageCounts.teacher) {
  console.warn(`주의: 학생용(${pageCounts.student}쪽)과 교사용(${pageCounts.teacher}쪽)의 쪽 수가 다릅니다.`);
}
if (failed) process.exit(1);
