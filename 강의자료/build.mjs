// 강의 화면 만들기
//   node 강의자료/build.mjs [강의id] [nopdf] [png]
//   예) node 강의자료/build.mjs sm-1-2          → 강의화면.html + 판서 노트·녹음 메모 PDF
//       node 강의자료/build.mjs sm-1-2 png      → 화면 그림(PNG)도 (확인용)
// 결과는 강의자료/out/<강의id>/ 에 생긴다 (저장소에는 올리지 않음).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(ROOT, '..');
const require = createRequire(import.meta.url);
const pw = () => { try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); } };

const args = process.argv.slice(2);
const id = args.find((a) => !['nopdf', 'png', 'steps'].includes(a)) || 'sm-1-2';
const want = new Set(args);
const OUT = path.join(ROOT, 'out', id);
fs.mkdirSync(OUT, { recursive: true });

const D = (await import(pathToFileURL(path.join(ROOT, 'content', `${id}.js`)))).default;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ───────── 화면 HTML ─────────
const flat = [];
D.lectures.forEach((L, li) => {
  L.slides.forEach((s, si) => {
    const head = `<header class="hd"><span class="lec">${L.no}강</span><span class="crumb">${esc(D.subject)} · ${esc(D.short)}</span><span class="sig">${esc(D.teacher)}</span><span class="pg">${si + 1} / ${L.slides.length}</span></header>`;
    let html, title = s.title, tag = s.tag || '';
    if (s.kind === 'cover') {
      title = `${L.title}`;
      html = `<section class="slide cover">${head}
        <div class="cv"><div class="cv-l"><div class="cv-no">${L.no}<small>강</small></div><h1>${esc(L.title)}</h1><p class="cv-sub">${esc(L.sub)}</p><p class="cv-path">${esc(D.subject)} · ${esc(D.unit)} › ${esc(D.chapter)}</p></div>
        <div class="cv-r"><div class="today"><h3>오늘 배울 것</h3><ol>${s.today.map((t, i) => `<li class="s" data-s="${i + 1}"><span class="n">${i + 1}</span>${esc(t)}</li>`).join('')}</ol></div></div></div>
      </section>`;
    } else {
      html = `<section class="slide">${head}<div class="tt"><span class="tag t-${esc(tag)}">${esc(tag)}</span><h2>${s.title}</h2></div><div class="bd">${s.body}</div></section>`;
    }
    const steps = Math.max(0, ...[...html.matchAll(/data-s="(\d+)"/g)].map((m) => +m[1]));
    if (s.memo.length !== steps + 1) {
      throw new Error(`${L.no}강 ${si + 1}번 화면 「${title}」: 판서 단계는 ${steps}개인데 메모는 ${s.memo.length}개예요 (단계+1개여야 함)`);
    }
    for (let k = 1; k <= steps; k++) if (!html.includes(`data-s="${k}"`)) console.warn(`  ⚠ ${L.no}강 ${si + 1}번 화면: ${k}단계에 나타나는 판서가 없어요`);
    flat.push({ key: `${L.no}-${si + 1}`, li, si, lec: L.no, tag, title: title.replace(/<[^>]+>/g, ''), steps, memo: s.memo, html });
  });
});
const data = {
  id: D.id,
  version: 1,
  title: `${D.subject} ${D.chapter}`,
  lectures: D.lectures.map((L, i) => ({ index: i, no: L.no, title: L.title, sub: L.sub, count: L.slides.length })),
  slides: flat.map(({ html, ...rest }) => rest),
};
console.log(`화면 ${flat.length}장, 판서 단계 ${flat.reduce((a, s) => a + s.steps, 0)}개, 메모 ${flat.reduce((a, s) => a + s.memo.join('').length, 0).toLocaleString()}자`);

// ───────── 글꼴 (쓰는 글자만 뽑아 파일 안에 넣기) ─────────
const css = fs.readFileSync(path.join(ROOT, 'lib', 'deck.css'), 'utf8');
const runtime = fs.readFileSync(path.join(ROOT, 'lib', 'runtime.js'), 'utf8');
const NM = path.join(REPO, 'textbook', 'node_modules');
const CACHE = path.join(ROOT, '.cache');
fs.mkdirSync(path.join(CACHE, 'subset'), { recursive: true });
const FONTS = [
  { family: 'Pretendard', weight: 400, file: path.join(NM, 'pretendard/dist/web/static/woff2/Pretendard-Regular.woff2') },
  { family: 'Pretendard', weight: 700, file: path.join(NM, 'pretendard/dist/web/static/woff2/Pretendard-Bold.woff2') },
  { family: 'Pretendard', weight: 800, file: path.join(NM, 'pretendard/dist/web/static/woff2/Pretendard-ExtraBold.woff2') },
  { family: 'KoPub Batang', weight: 400, file: path.join(NM, 'font-kopubworld/fonts/KoPubWorld-Batang-Medium.woff2') },
  { family: 'KoPub Batang', weight: 700, file: path.join(NM, 'font-kopubworld/fonts/KoPubWorld-Batang-Bold.woff2') },
];
const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
const glyphText = [...new Set([...flat.map((s) => s.html + s.memo.join('') + s.title).join(''), ...runtime, ...JSON.stringify(data.lectures), ascii, '①②③④⑤⑥⑦⑧→←↑↓↺·…“”‘’—–×○●■▶◀※'].join(''))].join('');
function subset(f) {
  const h = crypto.createHash('sha1').update(glyphText).update(f.file).digest('hex').slice(0, 16);
  const outp = path.join(CACHE, 'subset', `${h}.woff2`);
  if (!fs.existsSync(outp)) {
    const tf = path.join(CACHE, 'subset', `${h}.txt`);
    fs.writeFileSync(tf, glyphText);
    execFileSync('pyftsubset', [f.file, `--text-file=${tf}`, '--flavor=woff2', '--layout-features=*', '--no-hinting', `--output-file=${outp}`], { stdio: 'pipe' });
  }
  return fs.readFileSync(outp).toString('base64');
}
const fontCss = FONTS.map((f) => `@font-face{font-family:'${f.family}';font-weight:${f.weight};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${subset(f)}) format('woff2')}`).join('\n');

// ───────── 강의 화면 파일 ─────────
const pageTitle = `${D.subject} 탐구 방법 강의`;
const appHtml = `<div id="app">
  <div id="stage"><div id="sizer"><div id="frame">
${flat.map((s) => s.html).join('\n')}
  </div></div><div id="count" aria-live="polite"></div></div>
  <aside id="memo" aria-label="녹음 메모">
    <div class="mh" id="mh"></div>
    <ol id="mlist"></ol>
    <div class="mf" id="mf"></div>
    <div id="recbox">
      <div class="row"><button class="btn rec" id="rbtn">● 이 화면부터 녹음</button><span id="rstate">아직 녹음 안 함</span></div>
      <div class="row"><button class="btn" id="rplay">▶ 이 화면 들어보기</button><button class="btn" id="rdel">이 화면 녹음 지우기</button></div>
      <div class="row"><label class="chk"><input type="checkbox" id="rauto" checked> 다음 화면도 이어서 녹음</label></div>
      <div class="row"><button class="btn" id="rsave">녹음 파일 저장</button><label class="btn" for="rload">녹음 파일 불러오기</label><input type="file" id="rload" accept=".json,application/json" hidden></div>
      <div id="rhelp">R로 녹음을 시작하고 → 키(또는 화면 클릭)로 판서를 넘기며 말하세요. 마지막 판서에서 →를 누르면 그 화면 녹음이 끝나고 다음 화면 녹음이 바로 이어져요. 틀리면 R로 멈추고 그 화면만 다시 녹음하면 돼요.<br><span id="rprog"></span></div>
      <div id="rmsg" aria-live="polite"></div>
    </div>
  </aside>
  <div id="bar" role="toolbar" aria-label="강의 화면 조작">
    <button class="btn" id="btoc">차례 <kbd>T</kbd></button>
    <button class="btn" id="bprev" aria-label="이전 판서">◀</button>
    <span id="pos"></span>
    <button class="btn" id="bnext" aria-label="다음 판서">▶</button>
    <button class="btn" id="bmemo" aria-pressed="false">메모 <kbd>N</kbd></button>
    <button class="btn" id="brec" aria-pressed="false">녹음 모드 <kbd>R</kbd></button>
    <button class="btn" id="bfull">전체 화면 <kbd>F</kbd></button>
  </div>
</div>
<nav id="toc" aria-label="차례"><div class="row" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2>${esc(D.subject)} · ${esc(D.chapter)}</h2><button class="btn" id="tocclose">닫기</button></div>
<p class="sub">→ 키나 화면 클릭으로 판서가 하나씩 나타나요. 메모(N)를 켜면 단계마다 할 말이 보여요.</p><div id="tocbody"></div></nav>
<script type="application/json" id="deck-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
<script>${runtime}</script>`;
const headPart = `<title>${esc(pageTitle)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>${fontCss}
${css}</style>`;
const full = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">${headPart}</head><body>${appHtml}</body></html>`;
fs.writeFileSync(path.join(OUT, '강의화면.html'), full);
fs.writeFileSync(path.join(OUT, 'artifact.html'), `${headPart}\n${appHtml}`);
console.log(`강의화면.html ${(full.length / 1024).toFixed(0)}KB`);

// ───────── 판서 노트(학생용·교사용)·녹음 메모 ─────────
const finalSlide = (s) =>
  s.html
    .replace(/class="([^"]*)" data-s="(\d+)"/g, (m, c, n) => `class="${c} on" data-s="${n}"`)
    .replace('class="slide', 'class="slide cur');
const SC = 0.355;
const thumb = (s) => `<div class="th" style="width:${1920 * SC}px;height:${1080 * SC}px"><div style="transform:scale(${SC});transform-origin:0 0;width:1920px;height:1080px;position:relative">${finalSlide(s)}</div></div>`;
const printCss = `
@page { size: A4; margin: 14mm 12mm; }
:root { color-scheme: light !important; }
html, body { background: #fff !important; color: #151c2c; height: auto; }
body { font-family: 'Pretendard', sans-serif; font-size: 13px; margin: 0; }
.page { break-after: page; }
.page:last-child { break-after: auto; }
.ph { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #151c2c; padding-bottom: 6px; margin-bottom: 12px; }
.ph h1 { font-size: 17px; margin: 0; } .ph span { color: #6b7488; font-size: 12px; }
.ph .name { color: #151c2c; font-size: 13px; }
.th { position: relative; overflow: hidden; border: 1px solid #c9d0db; border-radius: 4px; margin: 0 auto; }
.th .slide { display: block !important; }
.pair { display: flex; flex-direction: column; gap: 18px; }
.cap { font-weight: 700; font-size: 13px; margin: 0 0 6px; }
.memo-list { margin: 14px 0 0; padding: 0; list-style: none; }
.memo-list li { display: grid; grid-template-columns: 44px 1fr; gap: 8px; padding: 6px 0; border-bottom: 1px dotted #c9d0db; font-size: 14.5px; line-height: 1.65; break-inside: avoid; }
.memo-list .sn { font-weight: 800; color: #2251c9; }
.memo-list i { color: #b4541a; font-style: normal; }
`;
function doc(bodyHtml, cls) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${fontCss}\n${css}\n${printCss}</style></head><body class="static print ${cls}">${bodyHtml}</body></html>`;
}
function handout(student) {
  const pages = [];
  D.lectures.forEach((L, li) => {
    const items = flat.filter((s) => s.li === li);
    for (let i = 0; i < items.length; i += 2) {
      const two = items.slice(i, i + 2);
      pages.push(`<section class="page"><div class="ph"><h1>${esc(D.subject)} · ${esc(D.chapter)} — ${L.no}강 판서 노트${student ? '' : ' (교사용)'}</h1>${
        i === 0 && student ? '<span class="name">이름 ____________</span>' : `<span>${L.no}강 ${i + 1}–${i + two.length} / ${items.length}</span>`
      }</div><div class="pair">${two.map((s) => `<div><p class="cap">${s.si + 1}. ${esc(s.title)}</p>${thumb(s)}</div>`).join('')}</div></section>`);
    }
  });
  return doc(pages.join(''), student ? 'student' : '');
}
function memoDoc() {
  const fmt = (m) => esc(m).replace(/\[([^\]]+)\]/g, '<i>[$1]</i>');
  return doc(
    flat
      .map(
        (s) => `<section class="page"><div class="ph"><h1>${s.lec}강 ${s.si + 1}. ${esc(s.title)}</h1><span>녹음 메모 · 판서 ${s.steps}단계</span></div>${thumb(s)}
      <ol class="memo-list">${s.memo.map((m, k) => `<li><span class="sn">${k === 0 ? '처음' : k + ' →'}</span><span>${fmt(m)}</span></li>`).join('')}</ol></section>`
      )
      .join(''),
    ''
  );
}
fs.writeFileSync(path.join(OUT, '판서노트_학생용.html'), handout(true));
fs.writeFileSync(path.join(OUT, '판서노트_교사용.html'), handout(false));
fs.writeFileSync(path.join(OUT, '녹음메모.html'), memoDoc());

if (!want.has('nopdf') || want.has('png')) {
  const browser = await pw().chromium.launch();
  try {
    if (!want.has('nopdf')) {
      const page = await browser.newPage();
      for (const name of ['판서노트_학생용', '판서노트_교사용', '녹음메모']) {
        await page.goto(pathToFileURL(path.join(OUT, `${name}.html`)).href);
        await page.evaluate(() => document.fonts.ready);
        await page.pdf({ path: path.join(OUT, `${name}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true });
        console.log(`${name}.pdf`);
      }
      await page.close();
    }
    if (want.has('png')) {
      // 확인용 화면 그림: 각 화면의 마지막 판서 상태 (steps를 주면 모든 단계)
      const dir = path.join(OUT, 'png');
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
      await page.goto(pathToFileURL(path.join(OUT, '강의화면.html')).href + '?export');
      await page.evaluate(() => document.fonts.ready);
      // 넘침 검사: 판서 칸(.bd)이 화면 밖으로 넘치거나, 글자가 칸을 벗어나면 알려 준다
      const over = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('#frame .slide').forEach((sl, i) => {
          window.DECK.render(i, 99);
          const bd = sl.querySelector('.bd') || sl;
          const box = sl.getBoundingClientRect();
          let bottom = 0, right = 0;
          bd.querySelectorAll('*').forEach((el) => { const r = el.getBoundingClientRect(); if (r.width && r.height) { bottom = Math.max(bottom, r.bottom); right = Math.max(right, r.right); } });
          if (bottom > box.top + 1080 - 40 || right > box.left + 1920 - 60 || bd.scrollHeight > bd.clientHeight + 2) out.push(`${window.DECK.slides[i].key}: 아래 ${Math.round(bottom - box.top)} / 오른쪽 ${Math.round(right - box.left)} / 칸 ${bd.scrollHeight}>${bd.clientHeight}`);
        });
        return out;
      });
      if (over.length) console.warn('  ⚠ 넘치는 화면:\n   ' + over.join('\n   '));
      else console.log('  넘치는 화면 없음');
      for (let i = 0; i < flat.length; i++) {
        const s = flat[i];
        const list = want.has('steps') ? [...Array(s.steps + 1).keys()] : [s.steps];
        for (const k of list) {
          await page.evaluate(([a, b]) => window.DECK.render(a, b), [i, k]);
          await page.screenshot({ path: path.join(dir, `${s.key}${want.has('steps') ? `_${k}` : ''}.png`), clip: { x: 0, y: 0, width: 1920, height: 1080 } });
        }
      }
      console.log(`png/ ${flat.length}장`);
    }
  } finally {
    await browser.close();
  }
}
