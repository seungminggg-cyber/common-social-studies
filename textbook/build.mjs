// 개념서 만들기: 내용 + 디자인 → HTML → (자동 쪽 나눔) → PDF / PNG
//
//   node build.mjs                      모든 단원(content/*.js), 시안 d(기본), 학생용 PDF
//   node build.mjs t1-2 both            Ⅱ단원만, 시안 d, 학생용+교사용 (b를 주면 예전 시안 B)
//   node build.mjs t1-1 all both png    Ⅰ단원, 모든 시안, 쪽 그림(PNG)까지
//
// 결과물은 out/ 폴더에 생깁니다.
//   out/<단원>-<시안>-<학생용|교사용>.pdf
//   out/<단원>.json            한글 파일 만들기(hwpx_build.py)에 넘길 내용 (그림 번호 포함)
//   out/fig/<단원>/<번호>.png   그래프·지도 그림 (한글 파일에 넣을 그림)
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { renderBook } from './lib/render.js';
import { FIGURE_TYPES } from './lib/figures.js';
import { ensureTerrain } from './lib/terrain.js';

const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); }
})();

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'out');

// 시안별 이름과 단 수 (concept=개념, check=개념 확인, exam=수능형 문제, answers=정답과 해설)
// soft: 앞 쪽에 자리가 넉넉하면 새 쪽을 만들지 않고 이어 붙일 부분
export const THEMES = {
  a: { name: '시안 A · 날개형', layout: { concept: 1, check: 2, exam: 2, answers: 2, soft: ['check'] } },
  b: { name: '시안 B · 카드형', layout: { concept: 1, check: 1, exam: 2, answers: 2, soft: ['check', 'exam'] } },
  c: { name: '시안 C · 2단 노트형', layout: { concept: 2, check: 2, exam: 2, answers: 2, soft: ['check', 'exam'] } },
  d: { name: '시안 D · 교과서형', layout: { concept: 1, check: 1, exam: 2, answers: 2, soft: ['check', 'exam'] } },
};

const args = process.argv.slice(2);
const allBooks = readdirSync(join(ROOT, 'content')).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3)).sort();
const bookArg = args.find((a) => allBooks.includes(a) || a.split(',').every((x) => allBooks.includes(x)));
const books = bookArg ? bookArg.split(',') : allBooks.filter((b) => !b.startsWith('z-'));
const themeArg = args.find((a) => /^(all|[abcd](,[abcd])*)$/.test(a)) || 'd'; // 기본 디자인: 시안 D(강사 확정, 2026-11)
const themes = themeArg === 'all' ? Object.keys(THEMES) : themeArg.split(',');
const modeArg = args.find((a) => ['student', 'teacher', 'both'].includes(a)) || 'student';
const modes = modeArg === 'both' ? ['student', 'teacher'] : [modeArg];
const wantPng = args.includes('png');

// 그림 블록마다 번호(_fig)를 붙인다 → PDF와 한글 파일이 같은 그림을 가리키게
function numberFigures(book) {
  let n = 0;
  const walk = (x) => {
    if (Array.isArray(x)) return x.forEach(walk);
    if (!x || typeof x !== 'object') return;
    if (FIGURE_TYPES.has(x.t)) x._fig = `f${String(++n).padStart(3, '0')}`;
    if (x.t === 'figrow') x._fig = `r${String(++n).padStart(3, '0')}`; // 줄 전체 그림 (한글 파일용)
    Object.values(x).forEach(walk);
  };
  walk(book.units);
  return n;
}

const paginateJs = readFileSync(join(ROOT, 'lib/paginate.js'), 'utf8');
mkdirSync(join(OUT, 'png'), { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
let failed = false;

for (const bookName of books) {
  const book = (await import(`./content/${bookName}.js`)).default;
  const nFig = numberFigures(book);
  ensureTerrain(book.units); // 지형도 바탕 그림이 없으면 만든다
  writeFileSync(join(OUT, `${bookName}.json`), JSON.stringify(book));
  let figsSaved = false;

  for (const theme of themes) {
    for (const mode of modes) {
      const t = THEMES[theme];
      const name = `${bookName}-${theme}-${mode}`;
      const html = renderBook(book, { theme, themeName: t.name, mode, layout: t.layout, paginateJs });
      const htmlPath = join(OUT, `${name}.html`);
      writeFileSync(htmlPath, html);

      const page = await ctx.newPage();
      page.on('pageerror', (e) => { console.error(`[${name}] 페이지 오류:`, e.message); failed = true; });
      await page.goto(pathToFileURL(htmlPath).href);
      await page.waitForFunction(() => window.PAGINATED === true, null, { timeout: 30000 });
      const { pages, warn } = await page.evaluate(() => ({ pages: window.PAGES, warn: window.WARN }));
      if (warn.length) console.warn(`[${name}] 경고:\n  ` + warn.join('\n  '));

      await page.pdf({ path: join(OUT, `${name}.pdf`), preferCSSPageSize: true, printBackground: true });
      if (wantPng) {
        for (const f of readdirSync(join(OUT, 'png'))) if (f.startsWith(`${name}-`) && f.endsWith('.png')) unlinkSync(join(OUT, 'png', f));
        const els = await page.$$('.page');
        for (let i = 0; i < els.length; i++) {
          await els[i].screenshot({ path: join(OUT, 'png', `${name}-${String(i + 1).padStart(2, '0')}.png`) });
        }
      }
      // 한글 파일용 그림: 시안 b 또는 d로 만들 때 한 번만 저장 (그래프 색은 두 시안이 같다)
      if (nFig && (theme === 'b' || theme === 'd') && !figsSaved) {
        const dir = join(OUT, 'fig', bookName);
        mkdirSync(dir, { recursive: true });
        for (const el of await page.$$('figure[data-fig]')) {
          const id = await el.getAttribute('data-fig');
          const body = await el.$('.fig-body');
          await body.screenshot({ path: join(dir, `${id}.png`), omitBackground: false });
        }
        for (const el of await page.$$('.figrow[data-row]')) {
          await el.screenshot({ path: join(dir, `${await el.getAttribute('data-row')}.png`), omitBackground: false });
        }
        figsSaved = true;
      }
      console.log(`${name}: ${pages}쪽 → out/${name}.pdf${nFig ? ` (그림 ${nFig}개)` : ''}`);
      await page.close();
    }
  }
}
await browser.close();
if (failed) process.exit(1);
