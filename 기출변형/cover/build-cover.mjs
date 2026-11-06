// 정조준 시리즈 표지·간지 만들기 (기출변형 폴더에서 실행)
//   node cover/build-cover.mjs fronts        앞표지 다듬은 안 A·B·C (02권) + 바탕별 비교(02·03·06)
// 결과: out/cover/*.pdf, out/cover/png/*.png  (out/은 커밋하지 않음)
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { doc } from './sheet.js';
import { front } from './front.js';
import { vol, spineMm, PAGES } from './series.js';
import { front2, back2, spread2, divider2, subject2, DESIGNS, DIVIDER_CSS } from './v2.js';
import { chapters } from './book-data.js';
import { FONT_IS_TTF, TITLE_FONTS } from './tokens.js';

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
  // 안전 여백 검사: 글자가 재단선에서 10mm 안쪽에 있는지(엄지 색인 .edge는 뺌). 펼침면은 면마다 따로 잰다.
  const unsafe = await page.evaluate(({ safe, bleed, spine }) => {
    const out = [];
    const px = 96 / 25.4;
    document.querySelectorAll('.sheet').forEach((sh, si) => {
      const t = sh.querySelector('.t').getBoundingClientRect();
      // 면 나누기: 낱장이면 하나, 펼침면이면 뒷표지·책등·앞표지
      const faces = spine == null ? [[t.left, t.right]] : [[t.left, t.left + 210 * px], [t.left + 210 * px, t.left + (210 + spine) * px], [t.left + (210 + spine) * px, t.right]];
      const walker = document.createTreeWalker(sh, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if (!n.textContent.trim() || n.parentElement.closest('.edge')) continue;
        const r = document.createRange();
        r.selectNodeContents(n);
        for (const b of r.getClientRects()) {
          const cx = (b.left + b.right) / 2;
          const fi = faces.findIndex(([a, z]) => cx >= a && cx < z);
          const [a, z] = faces[fi] || faces[0];
          const m = safe * px;
          // 책등 세로 글자는 글꼴 줄 상자가 실제 글자보다 넓어서 좌우는 PNG로 눈으로 확인하고, 위아래만 잰다
          const side = fi === 1 && spine != null ? false : b.left < a + m - 0.5 || b.right > z - m + 0.5;
          if (side || b.top < t.top + safe * px - 0.5 || b.bottom > t.bottom - safe * px + 0.5) out.push(`${si + 1}쪽: "${n.textContent.trim().slice(0, 16)}"`);
        }
      }
    });
    return out;
  }, { safe: 10, bleed: 3, spine: html.includes('data-spine') ? +html.match(/data-spine="([\d.]+)"/)[1] : null });
  if (unsafe.length) console.warn(`[${name}] 안전 여백(10mm) 밖 글자:\n  ` + [...new Set(unsafe)].join('\n  '));
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
// 제목 글꼴 후보 × 안 A·B·C (02권)
if (args.includes('fonts')) {
  for (const f of Object.keys(TITLE_FONTS)) for (const k of ['A', 'B', 'C']) await emit(`앞표지-글꼴-${f}-안${k}`, doc([front(vol('02'), k, f)]), { scale: 1 });
}
// 2차 시안: 안 A2·C2·F 각각 앞표지·뒷표지(최소/전체)·펼침면·대단원 간지 10·과목 간지 2 + 다른 권(03·06) 앞표지
//   node cover/build-cover.mjs v2 [A2|C2|F ...] [noto]
if (args.includes('v2')) {
  const designs = args.filter((a) => DESIGNS[a]);
  const font = args.includes('noto') ? 'noto' : 'kopub';
  const v = vol('02');
  const chs = await chapters(v.edition);
  const S = spineMm(PAGES['02']);
  for (const d of designs.length ? designs : Object.keys(DESIGNS)) {
    const tag = `2차-${d}${font === 'kopub' ? '' : '-' + font}`;
    await emit(`${tag}-앞표지-02`, doc([front2(v, d, font)]));
    await emit(`${tag}-앞표지-03·06`, doc([front2(vol('03'), d, font), front2(vol('06'), d, font)]), { scale: 1 });
    await emit(`${tag}-뒷표지-02`, doc([back2(v, d, font, false), back2(v, d, font, true)]));
    await emit(`${tag}-펼침면-02`, doc([spread2(v, d, S, font)], { w: 420 + S }).replace('<body>', `<body data-spine="${S}">`), { scale: 1 });
    await emit(`${tag}-대단원간지`, doc(chs.map((ch) => divider2(ch, v, d, font)), { css: DIVIDER_CSS }), { scale: 1 });
    await emit(`${tag}-과목간지`, doc([subject2('통합사회1', chs.slice(0, 5), v, d, font), subject2('통합사회2', chs.slice(5), v, d, font)]), { scale: 1 });
  }
}
await browser.close();
