// 개념서 만들기: 내용 + 디자인 → HTML → (자동 쪽 나눔) → PDF / PNG
//
//   node build.mjs                 시안 a, b, c 학생용 PDF
//   node build.mjs a teacher       시안 a 교사용
//   node build.mjs all both png    모든 시안, 학생용+교사용, 쪽 그림(PNG)까지
//
// 결과물은 out/ 폴더에 생깁니다.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import book from './content/t1-1.js';
import { renderBook } from './lib/render.js';

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
};

const args = process.argv.slice(2);
const themeArg = args.find((a) => /^(all|[abc](,[abc])*)$/.test(a)) || 'all';
const themes = themeArg === 'all' ? Object.keys(THEMES) : themeArg.split(',');
const modeArg = args.find((a) => ['student', 'teacher', 'both'].includes(a)) || 'student';
const modes = modeArg === 'both' ? ['student', 'teacher'] : [modeArg];
const wantPng = args.includes('png');

const paginateJs = readFileSync(join(ROOT, 'lib/paginate.js'), 'utf8');
mkdirSync(join(OUT, 'png'), { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
let failed = false;

for (const theme of themes) {
  for (const mode of modes) {
    const t = THEMES[theme];
    const name = `${theme}-${mode}`;
    const html = renderBook(book, { theme, themeName: t.name, mode, layout: t.layout, paginateJs });
    const htmlPath = join(OUT, `${name}.html`);
    writeFileSync(htmlPath, html);

    const page = await ctx.newPage();
    page.on('pageerror', (e) => { console.error(`[${name}] 페이지 오류:`, e.message); failed = true; });
    await page.goto(pathToFileURL(htmlPath).href);
    await page.waitForFunction(() => window.PAGINATED === true, null, { timeout: 30000 });
    const { pages, warn } = await page.evaluate(() => ({ pages: window.PAGES, warn: window.WARN }));
    if (warn.length) { console.warn(`[${name}] 경고:\n  ` + warn.join('\n  ')); }

    await page.pdf({ path: join(OUT, `${name}.pdf`), preferCSSPageSize: true, printBackground: true });
    if (wantPng) {
      // 이 시안의 예전 쪽 그림만 지우고 새로 저장
      for (const f of readdirSync(join(OUT, 'png'))) if (f.startsWith(`${name}-`) && f.endsWith('.png')) unlinkSync(join(OUT, 'png', f));
      const els = await page.$$('.page');
      for (let i = 0; i < els.length; i++) {
        await els[i].screenshot({ path: join(OUT, 'png', `${name}-${String(i + 1).padStart(2, '0')}.png`) });
      }
    }
    console.log(`${name}: ${pages}쪽 → out/${name}.pdf`);
    await page.close();
  }
}
await browser.close();
if (failed) process.exit(1);
