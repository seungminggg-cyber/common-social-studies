// 정조준 시리즈 표지·간지 만들기 (기출변형 폴더에서 실행)
//   node cover/build-cover.mjs fronts        앞표지 다듬은 안 A·B·C (02권) + 바탕별 비교(02·03·06)
// 결과: out/cover/*.pdf, out/cover/png/*.png  (out/은 커밋하지 않음)
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { doc } from './sheet.js';
import { front } from './front.js';
import { vol } from './series.js';
import { FONT_IS_TTF } from './tokens.js';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); } })();
const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, '../out/cover');
mkdirSync(join(OUT, 'png'), { recursive: true });
const args = process.argv.slice(2);

const browser = await chromium.launch();
async function emit(name, html, { png = true, scale = 2 } = {}) {
  const p = join(OUT, `${name}.html`);
  writeFileSync(p, html);
  const ctx = await browser.newContext({ deviceScaleFactor: scale });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(p).href);
  await page.evaluate(() => document.fonts.ready);
  // 글꼴이 실제로 KoPub로 그려졌는지 확인(쓰인 굵기만 불러오므로, 불러오다 실패한 것만 경고)
  const bad = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'error').map((f) => `${f.family} ${f.weight}`));
  if (bad.length) console.warn(`[${name}] 글꼴 못 불러옴:`, bad.join(', '));
  await page.pdf({ path: join(OUT, `${name}.pdf`), preferCSSPageSize: true, printBackground: true });
  if (png) {
    // 미리보기는 재단선 안쪽(실제 책 모양)만
    const els = await page.$$('.sheet > .t');
    for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: join(OUT, 'png', `${name}${els.length > 1 ? '-' + (i + 1) : ''}.png`) });
  }
  console.log(`${name}: ${(await page.$$('.sheet')).length}쪽 → out/cover/${name}.pdf`);
  await ctx.close();
}
if (!FONT_IS_TTF) console.warn('※ TrueType 글꼴이 없어 PDF에 Type 3 글꼴로 들어갑니다 → python3 cover/otf2ttf.py');

if (args.includes('fronts')) {
  for (const k of ['A', 'B', 'C']) {
    await emit(`앞표지-02-안${k}`, doc([front(vol('02'), k)]));
    await emit(`앞표지-바탕비교-안${k}`, doc(['02', '03', '06'].map((id) => front(vol(id), k))), { scale: 1 });
  }
}
await browser.close();
