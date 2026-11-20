// 초록 칠판 + 빔 프로젝터용 시범강의 PPT (2028 수능 예시문항 통합사회 5·15·21번)
//
//   1) python3 -I 기출변형/특강/칠판/crop-chalk.py <예시문항 문제지 PDF> 기출변형/out/시범강의/chalk
//   2) NODE_PATH=<pptxgenjs·jszip 설치 폴더>/node_modules \
//        node 기출변형/특강/칠판/build-deck.cjs 기출변형/out/시범강의/chalk 기출변형/out/시범강의/시범강의-5-15-21.pptx
//
// - 문제는 **평가원 문제지 원본 그대로**(1단계에서 부분별로 잘라 분필색으로 바꾼 그림)를 붙인다.
//   글꼴·줄바꿈·빗금·공식 모양이 시험지와 똑같고, 파워포인트·한쇼·미리보기 어디서 열어도 모양이 같다.
//   (2026-11-20 강사 요청 "원본 문제와 정말 유사하게" — 그 전 판은 글자를 다시 입력해 공식·제시문 배치가 어긋났음)
// - 화면: 16:9, 바탕 검정(빔이 빛을 안 쏘는 곳 = 칠판 그대로), 글자는 흰 분필색, 문항 번호만 분필 노랑.
//   문제는 왼쪽 약 58%에만 두고 오른쪽은 모든 장에서 비워 판서 칸으로 쓴다(장을 넘겨도 판서가 안 겹침).
// - 장 구성: 표지 → 문항마다 **한 장**(발문 + 자료 + 〈보기〉 + 선지). 2026-11-20 강사가 시강 시뮬레이션 뒤
//   "한 문제가 두 장으로 나뉘면 판서하며 수업하기 불편하다" → 선지까지 무조건 한 장에.
//   풀이·힌트는 화면에 넣지 않는다(강사가 판서). 정답·단서는 발표자 노트에만(기출변형/특강/content/analysis.js).
const path = require('path');
const fs = require('fs');
const pptxgen = require('pptxgenjs');
const JSZip = require('jszip');

const [srcDir, outFile] = process.argv.slice(2);
if (!srcDir || !outFile) {
  console.log('쓰는 법: node build-deck.cjs <분필색 그림 폴더(crop-chalk.py 결과)> <저장할 .pptx>');
  process.exit(1);
}
const PARTS = JSON.parse(fs.readFileSync(path.resolve(srcDir, 'parts.json'), 'utf8'));
const SOURCE = '자료: 한국교육과정평가원, 2028학년도 대학수학능력시험 예시문항 사회탐구 영역(통합사회)';

// ---------- 테마 ----------
const FONT = '맑은 고딕';
const THEME = {
  name: '초록 칠판',
  colors: {
    dk1: '000000', lt1: 'FFFFFF', dk2: '262626', lt2: 'A6A6A6',
    accent1: 'FFE45C', // 분필 노랑 (문항 번호)
    accent2: '9AD8FF', accent3: 'FFA3BE', accent4: 'B9F08C', accent5: 'D9D9D9', accent6: 'FFC27A',
    hlink: '9AD8FF', folHlink: 'FFA3BE',
  },
};

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 × 7.5 in (16:9)
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
pres.title = '2028 수능 예시문항 통합사회 시범강의';
pres.author = '승민T';
const C = pres.SchemeColor;
const WHITE = C.background1, MUTED = C.background2, CHALK = C.accent1;

// 판서 칸을 뺀 왼쪽 영역 (in)
// 한 장에 문제 전체를 넣으므로 높이가 모자라다 → 위아래 여백을 줄여 세로를 최대한 쓴다.
const ZX = 0.5, ZW = 7.3, TOP = 0.2, BOTTOM = 7.12;
const GAP = 8; // 부분 사이 간격(원본 pt, 크기에 맞춰 함께 늘어남)

// ---------- 레이아웃(틀) ----------
const footer = {
  text: { text: SOURCE, options: { x: ZX, y: 7.18, w: ZW, h: 0.24, fontSize: 10, color: MUTED, margin: 0, valign: 'bottom', lang: 'ko-KR' } },
};
pres.defineSlideMaster({ title: 'TITLE', background: { color: THEME.colors.dk1 }, objects: [footer] });
pres.defineSlideMaster({ title: 'ITEM', background: { color: THEME.colors.dk1 }, objects: [footer] });

const tx = (s, text, o) => s.addText(text, { isTextBox: true, margin: 0, color: WHITE, valign: 'top', lang: 'ko-KR', fit: 'none', ...o });

// 원본 부분 그림을 위에서부터 차례로 쌓는다. 한 장 안에서는 모두 같은 배율(시험지와 같은 글자 크기 비율),
// 가로 위치는 원본의 들여쓰기 그대로(발문 번호가 자료 상자보다 왼쪽에 나온 모양 유지).
function stack(s, names) {
  const ps = names.map((n) => ({ n, ...PARTS[n] }));
  const minX = Math.min(...ps.map((p) => p.x));
  const maxR = Math.max(...ps.map((p) => p.x + p.w));
  const sumH = ps.reduce((a, p) => a + p.h, 0) + GAP * (ps.length - 1);
  const k = Math.min((ZW * 72) / (maxR - minX), ((BOTTOM - TOP) * 72) / sumH) / 72; // 원본 pt → 슬라이드 in
  let y = TOP;
  for (const p of ps) {
    s.addImage({ path: path.resolve(srcDir, `${p.n}.png`), x: ZX + (p.x - minX) * k, y, w: p.w * k, h: p.h * k, altText: ALT[p.n.split('-')[1]] });
    y += (p.h + GAP) * k;
  }
  return k * 72; // 원본 대비 배율
}
const ALT = { stem: '발문(평가원 원문)', data: '자료(평가원 원문)', mini: '자료 일부(평가원 원문)', bogi: '〈보기〉(평가원 원문)', choices: '선지(평가원 원문)' };

// ---------- 슬라이드 ----------
const notes = { front: {}, back: {} };
const scales = [];

function titleSlide() {
  pres.addSection({ title: '표지' });
  const s = pres.addSlide({ masterName: 'TITLE', sectionTitle: '표지' });
  tx(s, '2028학년도 대학수학능력시험 예시문항', { x: ZX, y: 2.0, w: ZW, h: 0.5, fontSize: 24 });
  tx(s, '사회탐구 영역 (통합사회)', { x: ZX, y: 2.6, w: ZW, h: 0.9, fontSize: 44, bold: true });
  tx(s, '5번 · 15번 · 21번', { x: ZX, y: 3.65, w: ZW, h: 0.65, fontSize: 32, bold: true, color: CHALK });
  tx(s, '승민T', { x: ZX, y: 4.75, w: ZW, h: 0.5, fontSize: 22 });
}

// 한 문항 = 한 장 (발문부터 선지까지)
function item(no, parts) {
  pres.addSection({ title: `${no}번` });
  const s = pres.addSlide({ masterName: 'ITEM', sectionTitle: `${no}번` });
  scales.push([`${no}번`, stack(s, parts.map((p) => `q${no}-${p}`))]);
  s.addNotes(`${notes.front[no]}\n\n[선지 판단]\n${notes.back[no]}`);
}

// ---------- 발표자 노트(화면에는 안 나옴) ----------
const CIRCLED = ['①', '②', '③', '④', '⑤'];
async function loadNotes() {
  const a = await import(path.resolve(__dirname, '../content/analysis.js'));
  const strip = (t) => String(t).replace(/\*\*/g, '');
  for (const n of [5, 15, 21]) {
    const it = a.ITEMS[n];
    notes.front[n] = [
      `정답 ${CIRCLED[it.ans - 1]} (${it.pts}점)`,
      `핵심 단서: ${strip(it.clue)}`,
      '풀이 순서:', ...it.steps.map((st, i) => `${i + 1}) ${strip(st)}`),
    ].join('\n');
    const mark = n === 15 ? ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ'] : CIRCLED;
    notes.back[n] = [
      ...it.judge.map(([ox, why], i) => `${mark[i]} ${ox} — ${strip(why)}`),
      '함정:', ...it.traps.map(([k, t]) => `${k} ${strip(t)}`),
    ].join('\n');
  }
}

// ---------- 저장 뒤 손보기 ----------
async function finish(file) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const themePath = Object.keys(zip.files).find((f) => /^ppt\/theme\/theme\d+\.xml$/.test(f));
  let th = await zip.file(themePath).async('string');
  const c = THEME.colors;
  const clr = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink']
    .map((k) => `<a:${k}><a:srgbClr val="${c[k]}"/></a:${k}>`).join('');
  // 테마 색(pptxgenjs는 Office 기본 색을 씀) + 한글 글꼴 칸을 맑은 고딕으로
  th = th.replace(/<a:clrScheme\b[^>]*>[\s\S]*?<\/a:clrScheme>/, `<a:clrScheme name="${THEME.name}">${clr}</a:clrScheme>`);
  th = th.replace(/<a:ea typeface=""\/>/g, `<a:ea typeface="${FONT}"/>`);
  zip.file(themePath, th);
  // 폴더 항목 없이 다시 묶기(클라우드 저장소에서 열 때 문제가 되므로)
  const out = new JSZip();
  for (const [n, e] of Object.entries(zip.files)) if (!e.dir) out.file(n, await e.async('nodebuffer'), { createFolders: false });
  fs.writeFileSync(file, await out.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}

(async () => {
  await loadNotes();
  titleSlide();
  item(5, ['stem', 'data', 'choices']);
  item(15, ['stem', 'data', 'bogi', 'choices']);
  item(21, ['stem', 'data', 'choices']);
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  await pres.writeFile({ fileName: outFile });
  await finish(outFile);
  for (const [n, k] of scales) console.log(`${n}: 원본의 ${k.toFixed(2)}배 (본문 글자 약 ${(9.5 * k).toFixed(0)}pt)`);
  console.log('저장:', outFile);
})();
