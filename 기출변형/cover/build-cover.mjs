// 정조준 시리즈 표지·간지 만들기 (기출변형 폴더에서 실행)
//   node cover/build-cover.mjs fronts        앞표지 다듬은 안 A·B·C (02권) + 바탕별 비교(02·03·06)
// 결과: out/cover/*.pdf, out/cover/png/*.png  (out/은 커밋하지 않음)
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { doc } from './sheet.js';
import { front } from './front.js';
import { vol, spineMm, PAGES } from './series.js';
import { front2, back2, spread2, divider2, subject2, DESIGNS, DIVIDER_CSS } from './v2.js';
import { chapters } from './book-data.js';
import { V3, face3 } from './v3.js';
import { V4, face4 } from './v4.js';
import { V5, face5 } from './v5.js';
import { LETTER_STYLES } from './lettering.js';
import { V7, face7 } from './v7.js';
import { mmFront, mmBack, MM_CONCEPTS, MM_CSS, LOGO_FONTS } from './mm.js';
import { mmVol } from './mm-data.js';
import { MMX, mmxFace, x5BackMini } from './mmx.js';
import { MMAPS, mmapFace, m1Back } from './mmap.js';
import { MMAP } from './mm-data.js';
import { mmSubjectPage, mmChapterPage, mmTitlePage } from './mm-div.js';
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
  // 로고 맞춤: data-fit="폭(mm)"인 글자를 그 폭에 꼭 맞는 크기로(모든 권에서 같은 자리·같은 크기)
  await page.evaluate(async () => {
    const px = 96 / 25.4;
    for (const el of document.querySelectorAll('[data-fit]')) {
      for (let i = 0; i < 3; i++) {
        const w = el.getBoundingClientRect().width;
        el.style.fontSize = `${(parseFloat(getComputedStyle(el).fontSize) * parseFloat(el.dataset.fit) * px) / w}px`;
      }
    }
    // MIN·MAX 밑줄: 로고 안 글자 묶음의 실제 폭에 맞춤
    for (const u of document.querySelectorAll('[data-under]')) {
      const box = u.parentElement.getBoundingClientRect();
      const t = u.parentElement.querySelector(`.mm-${u.dataset.under}`);
      if (!t) continue;
      const r = t.getBoundingClientRect();
      u.style.marginLeft = `${r.left - box.left}px`;
      u.style.width = `${r.width}px`;
    }
    await document.fonts.ready;
  });
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
// 3차 시안: 시중 교재 표지를 참고한 후보 5개 — 앞표지·뒷표지
//   node cover/build-cover.mjs v3 [1 2 3 4 5]
if (args.includes('v3')) {
  const ns = args.filter((a) => V3[a]);
  for (const n of ns.length ? ns : Object.keys(V3)) {
    await emit(`3차-${n}-${V3[n].name}-앞표지`, doc([face3(n, 'front', vol('02'))]));
    await emit(`3차-${n}-${V3[n].name}-뒷표지`, doc([face3(n, 'back', vol('02'))]));
  }
}
// 4차 시안: 3차 '1 조준경' 바탕 후보 3개(A 본문형 · B 명조형 · C 계기형) — 앞표지·뒷표지
//   node cover/build-cover.mjs v4 [A B C]
if (args.includes('v4')) {
  const ks = args.filter((a) => V4[a] && a.length === 1);
  for (const k of ks.length ? ks : Object.keys(V4)) {
    await emit(`4차-${k}-${V4[k].name}-앞표지`, doc([face4(k, 'front', vol('02'))]));
    await emit(`4차-${k}-${V4[k].name}-뒷표지`, doc([face4(k, 'back', vol('02'))]));
  }
}
// 5차 시안: A 본문형 + 직접 그린 제목 레터링 3가지(L1 블록 · L2 조준선 · L3 기울임) — 앞표지·뒷표지
//   node cover/build-cover.mjs v5 [L1 L2 L3]
if (args.includes('v5')) {
  const ks = args.filter((a) => V5[a]);
  for (const k of ks.length ? ks : Object.keys(V5)) {
    await emit(`5차-${k}-${V5[k]}-앞표지`, doc([face5(k, 'front', vol('02'))]));
    await emit(`5차-${k}-${V5[k]}-뒷표지`, doc([face5(k, 'back', vol('02'))]));
  }
}
// 6차 시안: 레터링 후보 5개(블록·스텐실·다중선·고대비·입체), '정'을 키움 — 앞표지·뒷표지
//   node cover/build-cover.mjs v6
if (args.includes('v6')) {
  const ks = ['block', 'stencil', 'multi', 'hicon', 'stack'];
  for (const [i, k] of ks.entries()) {
    await emit(`6차-${i + 1}-${LETTER_STYLES[k]}-앞표지`, doc([face5(k, 'front', vol('02'))]));
    await emit(`6차-${i + 1}-${LETTER_STYLES[k]}-뒷표지`, doc([face5(k, 'back', vol('02'))]));
  }
}
// 7차 시안: 제목 자리를 바꾼 후보 5개(세로 기둥·과녁 안·넘침·대각선·가운데 세로) — 앞표지
//   node cover/build-cover.mjs v7
if (args.includes('v7')) {
  for (const [i, k] of Object.keys(V7).entries()) await emit(`7차-${i + 1}-${V7[k]}-앞표지`, doc([face7(k, vol('02'))]));
}
// MINIMAX 시리즈(2026-11-07): 앞표지 콘셉트 A·B·C(02권) + 로고 글꼴 비교 + 뒷표지(대표 문장 1안·2안) + 바탕별 확인(01·03·06)
//   node cover/build-cover.mjs mm [A B C]
if (args.includes('mm')) {
  const cs = args.filter((a) => MM_CONCEPTS[a]);
  const d = (pages) => doc(pages, { css: MM_CSS });
  for (const c of cs.length ? cs : Object.keys(MM_CONCEPTS)) {
    const tag = `MM-${c}-${MM_CONCEPTS[c]}`;
    await emit(`${tag}-앞표지-02`, d([mmFront(mmVol('02'), c)]));
    await emit(`${tag}-뒷표지-02`, d([mmBack(mmVol('02'), c, 1), mmBack(mmVol('02'), c, 2)]));
    await emit(`${tag}-로고글꼴`, d(Object.keys(LOGO_FONTS).map((f) => mmFront(mmVol('02'), c, f))), { scale: 1 });
    await emit(`${tag}-바탕별`, d(['01-t1', '03', '06'].map((id) => mmFront(mmVol(id), c))), { scale: 1 });
  }
}
// MINIMAX 2차(화려한 색·직접 그린 로고·포인트 그림) 후보 5개 — 앞표지·뒷표지
//   node cover/build-cover.mjs mmx [X1 … X5]
if (args.includes('mmx')) {
  const ks = args.filter((a) => MMX[a]);
  for (const k of ks.length ? ks : Object.keys(MMX)) {
    await emit(`MMX-${k}-${MMX[k]}-앞표지`, doc([mmxFace(k, 'front', mmVol('02'))]));
    await emit(`MMX-${k}-${MMX[k]}-뒷표지`, doc([mmxFace(k, 'back', mmVol('02'))]));
  }
}
// MINIMAP 개념서 앞표지 후보: node cover/build-cover.mjs mmap [M1 …]  → out/cover/MMAP-<후보>-<이름>-통합사회1·2
if (args.includes('mmap')) {
  const ks = args.filter((a) => MMAPS[a]);
  for (const k of ks.length ? ks : Object.keys(MMAPS)) {
    for (const v of MMAP.vols) await emit(`MMAP-${k}-${MMAPS[k][0]}-${v.subject}`, doc([mmapFace(k, v)]), { scale: 1 });
  }
}
// MINIMAP 1번(네온 지구) 앞·뒷표지: node cover/build-cover.mjs mmapfinal → out/cover/MINIMAP-통합사회1·2-앞표지·뒷표지
if (args.includes('mmapfinal')) {
  for (const v of MMAP.vols) {
    await emit(`MINIMAP-${v.subject}-앞표지`, doc([mmapFace('M1', v)]));
    await emit(`MINIMAP-${v.subject}-뒷표지`, doc([m1Back(v)]));
    // 속표지 + 대단원 간지 5장(도련 3mm, 엄지 색인 포함). 표의 쪽 번호는 개념서 본문 빌드(textbook: node build-book.mjs mm)가 남긴 json
    const { mmapTitlePage, mmapChapterPage, chapterInfo } = await import('./mmap-div.js');
    const { C1 } = await import('./mmap.js');
    const book = (await import(`../../textbook/content/_book/${v.id}.js`)).default;
    const pj = join(ROOT, `../../textbook/out/MINIMAP-${v.subject}-쪽.json`);
    const pages = existsSync(pj) ? JSON.parse(readFileSync(pj, 'utf8')) : null;
    if (!pages) console.warn(`[${v.subject}] 쪽 번호 파일이 없어 간지 표의 쪽 칸이 비어 있습니다 → textbook에서 node build-book.mjs mm${v.n === 2 ? ' t2' : ''}`);
    const sheet = (inner) => `<section class="sheet" style="background:${C1[v.n].bg}"><div class="t" style="overflow:visible">${inner}</div></section>`;
    const divs = [sheet(mmapTitlePage(v)), ...book.chapters.map((ch, ci) => sheet(mmapChapterPage(v, chapterInfo(ch, ci), { keys: book.dividers?.[ch.chapter.no]?.keys || [], uid: `c${ci}`, tab: true, pages })))];
    await emit(`MINIMAP-${v.subject}-속표지간지-도련`, doc(divs, { css: '.mm-page .abs{position:absolute}' }), { scale: 1 });
  }
}
// 뒷표지 시안(문구 없이 작은 미로 + 작은 MINIMAX): node cover/build-cover.mjs mmback
if (args.includes('mmback')) {
  const v = mmVol('02');
  const sheet = (inner) => `<section class="sheet" style="background:#0B1026"><div class="t" style="overflow:visible">${inner}</div></section>`;
  await emit('MMBACK-A-네온글자', doc([sheet(x5BackMini(v))]));
  await emit('MMBACK-B-보통글자', doc([sheet(x5BackMini(v, { plain: true }))]));
}
// MINIMAX 완성본(인쇄용 낱장): 앞표지·뒷표지·간지 12장(도련 3mm). 본문은 build.mjs <차수> units mm
//   node cover/build-cover.mjs mmfinal [2]   (2 = 03 심화편 데이터)
if (args.includes('mmfinal')) {
  const v = mmVol(args.includes('2') ? '03' : '02');
  const name = `MINIMAX ${v.kind.replace(/^통합사회 /, '')}`;
  const tag = `MINIMAX-${v.no}`;
  const chs = await chapters(v.no === '03' ? '2' : '1');
  const sheet = (inner) => `<section class="sheet" style="background:#0B1026"><div class="t" style="overflow:visible">${inner}</div></section>`;
  const pages = [sheet(mmTitlePage(v))]; // 속표지 + 간지 12장(본문 순서)
  for (const sub of ['통합사회1', '통합사회2']) {
    const list = chs.filter((ch) => ch.subject === sub);
    pages.push(sheet(mmSubjectPage(sub, list, { name, uid: `s${pages.length}` })));
    for (const ch of list) pages.push(sheet(mmChapterPage(ch, { name, uid: `c${pages.length}`, tab: true })));
  }
  await emit(`${tag}-앞표지`, doc([mmxFace('X5', 'front', v)]));
  await emit(`${tag}-뒷표지`, doc([mmxFace('X5', 'back', v)]));
  await emit(`${tag}-속표지간지-도련`, doc(pages, { css: '.mm-page .abs{position:absolute}' }), { scale: 1 });
}
await browser.close();
