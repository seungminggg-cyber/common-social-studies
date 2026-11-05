// 통합본 만들기: Ⅰ~Ⅴ 대단원을 한 권의 개념서로 + 별책 정답과 해설
//
//   node build-book.mjs            학생용 개념서, 교사용 개념서, 정답과 해설 (PDF 3개)
//   node build-book.mjs png        쪽 그림(PNG)도 저장 (out/png/book-*.png)
//   node build-book.mjs student    학생용만 (teacher, answers 도 따로 고를 수 있음)
//
// 결과: out/통합사회1-개념서-학생용.pdf, out/통합사회1-개념서-교사용.pdf, out/통합사회1-정답과해설.pdf
// 양면 인쇄용: 간지는 늘 오른쪽(홀수) 쪽에 오고, 필요하면 앞에 메모 쪽이 들어간다.
// 교사용은 빈칸과 정답이 채워져 있고, 쪽 번호가 학생용과 같다(해설은 별책에만 있음).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { renderFull } from './lib/render.js';
import full from './content/_book/t1.js';

const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); }
})();

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'out');
const args = process.argv.slice(2);
const wantPng = args.includes('png');
const picked = ['student', 'teacher', 'answers'].filter((k) => args.includes(k));
const jobs = picked.length ? picked : ['student', 'teacher', 'answers'];

// 시안 B 배치 (개념 1단, 개념 확인 1단, 수능형 문제·정답 2단)
const layout = { concept: 1, check: 1, exam: 2, answers: 2, soft: ['check', 'exam'] };
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
  const html = renderFull(full, { mode, layout: part === 'answers' ? { ...layout, soft: ['answers'] } : layout, paginateJs, part });
  const base = `book-${job}`;
  const htmlPath = join(OUT, `${base}.html`);
  writeFileSync(htmlPath, html);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { console.error(`[${job}] 페이지 오류:`, e.message); failed = true; });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForFunction(() => window.PAGINATED === true, null, { timeout: 300000 });
  const { pages, warn } = await page.evaluate(() => ({ pages: window.PAGES, warn: window.WARN }));
  if (warn.length) console.warn(`[${job}] 경고:\n  ` + warn.join('\n  '));
  const pdf = join(OUT, `${full.subject}-${NAMES[job]}.pdf`);
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
