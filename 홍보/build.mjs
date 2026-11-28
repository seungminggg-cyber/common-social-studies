// 홍보물 만들기 — 카드뉴스·블로그 그림을 HTML로 그린 뒤 PNG로 저장한다.
//   사용: node 홍보/build.mjs            (content/ 안의 모든 조각)
//         node 홍보/build.mjs cn01 blog01 (이름이 이렇게 시작하는 조각만)
//   결과: 홍보/out/<조각 이름>/  01-표지.png …, 복사용 글(.txt), 미리보기.png
//   준비: textbook 폴더에서 npm install (Pretendard 글꼴, Tabler 아이콘을 거기서 가져다 씀)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { icon } from '../textbook/lib/icons.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = dirname(fileURLToPath(import.meta.url));
const FONT = join(ROOT, '../textbook/node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2');
if (!existsSync(FONT)) { console.error('글꼴이 없습니다. textbook 폴더에서 npm install 을 먼저 하세요.'); process.exit(1); }
const BRAND = readFileSync(join(ROOT, 'lib/brand.css'), 'utf8');

// 조각들이 함께 쓰는 작은 부품
export const H = {
  icon,
  // 맨 위 줄: 왼쪽 이름표(워드마크), 오른쪽 단원 표시
  top: (crumb = '') => `<div class="top"><div class="wm"><i></i><span><span class="s">통합사회</span> 승민<span class="t">T</span></span></div><div class="crumb">${crumb}</div></div>`,
  // 맨 아래 줄: 쪽 번호와 '넘겨 보기' 표시
  foot: (i, n, next = '넘겨 보기') => `<div class="foot"><div class="pg"><b>${i}</b> / ${n}</div>${next ? `<div class="next">${next} ${icon('arrow-right', { size: 26, stroke: 2.4 })}</div>` : ''}</div>`,
};

const want = process.argv.slice(2);
const files = readdirSync(join(ROOT, 'content')).filter((f) => f.endsWith('.js') && (!want.length || want.some((w) => f.startsWith(w))));
if (!files.length) { console.error('만들 조각이 없습니다:', want.join(' ')); process.exit(1); }

const browser = await chromium.launch();
for (const f of files) {
  const name = f.replace(/\.js$/, '');
  const mod = await import(pathToFileURL(join(ROOT, 'content', f)).href);
  const piece = mod.default(H);
  const out = join(ROOT, 'out', name);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const fontUrl = relative(out, FONT).split('\\').join('/');
  const css = BRAND.replaceAll('FONT_URL', fontUrl) + (piece.css || '');
  const page0 = (body, extra = '') => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${css}${extra}</style></head><body>${body}</body></html>`;

  // 1) 장마다 PNG
  const htmlPath = join(out, 'index.html');
  writeFileSync(htmlPath, page0(piece.pages.map((p, i) => p.html.replace(/^<(\w+)/, `<$1 data-shot="${String(i + 1).padStart(2, '0')}-${p.name}"`)).join('\n')));
  const page = await browser.newPage({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(() => document.fonts.ready);
  const fontBad = await page.evaluate(() => [...document.fonts].filter((f) => f.status !== 'loaded').map((f) => f.family));
  if (fontBad.length) { console.error(`  ✗ ${name}: 글꼴을 못 불러옴 (${fontBad.join(', ')})`); process.exit(1); }
  // 넘친 글자 검사: 장 밖으로 삐져나간 요소를 알려 준다
  const over = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('[data-shot]').forEach((s) => {
      const r = s.getBoundingClientRect();
      const ft = s.querySelector(':scope > .foot');
      const footTop = ft ? ft.getBoundingClientRect().top : Infinity;
      s.querySelectorAll('*').forEach((el) => {
        if (ft && (el === ft || ft.contains(el))) return;
        const eb = el.getBoundingClientRect();
        if (eb.width && eb.bottom > footTop - 6 && getComputedStyle(el).position !== 'absolute') bad.push(`${s.dataset.shot}: 아래 줄(쪽 번호)과 겹침 ${(el.className || el.tagName)}`);
        const e = el.getBoundingClientRect();
        if (e.width && (e.right > r.right + 1 || e.bottom > r.bottom + 1)) bad.push(`${s.dataset.shot}: ${el.className || el.tagName} ${(el.textContent || '').trim().slice(0, 20)}`);
        if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow === 'hidden' && el.textContent.trim()) bad.push(`${s.dataset.shot}: 글자 잘림 ${(el.textContent || '').trim().slice(0, 20)}`);
      });
    });
    return [...new Set(bad)].slice(0, 20);
  });
  if (over.length) console.warn(`  ⚠ ${name} 넘침:\n   ` + over.join('\n   '));
  for (const el of await page.locator('[data-shot]').all()) {
    const shot = await el.getAttribute('data-shot');
    await el.screenshot({ path: join(out, `${shot}.png`) });
  }
  await page.close();

  // 2) 복사용 글 (블로그 본문, 인스타 캡션 등)
  for (const [file, text] of Object.entries(piece.texts || {})) writeFileSync(join(out, file), text.trim() + '\n');

  // 3) 미리보기 한 장 (블로그 글이 실제로 어떻게 보일지)
  if (piece.preview) {
    const pv = join(out, 'preview.html');
    writeFileSync(pv, page0(piece.preview.html, piece.preview.css || ''));
    const p2 = await browser.newPage({ viewport: { width: piece.preview.width || 760, height: 1000 }, deviceScaleFactor: 1.5 });
    await p2.goto(pathToFileURL(pv).href);
    await p2.evaluate(() => document.fonts.ready);
    await p2.waitForTimeout(200);
    await p2.screenshot({ path: join(out, '미리보기.png'), fullPage: true });
    await p2.close();
  }
  console.log(`✓ ${name}: ${piece.pages.length}장${piece.preview ? ' + 미리보기' : ''}`);
}
await browser.close();
