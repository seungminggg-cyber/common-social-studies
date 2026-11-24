// 칠판 테스트용 PPT (5장): 학원 칠판에 직접 띄우고 촬영 카메라(폰)로 찍어서 확인
//   node test-deck.mjs  →  out/칠판-테스트.pptx
// 1 화면 크기·초점  2 색  3 밝기 계단  4 글자 크기  5 선 굵기·상자
// 번호를 붙여 두었으니 "3번 색이 안 보임"처럼 알려 주면 본 PPT 색·크기를 고친다.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLORS as K } from './palette.mjs';

const require = createRequire(import.meta.url);
const pptxgen = require('pptxgenjs');
const JSZip = require(require.resolve('jszip', { paths: [require.resolve('pptxgenjs')] }));
const ROOT = dirname(fileURLToPath(import.meta.url));
const FILE = join(ROOT, 'out/칠판-테스트.pptx');
const F = { head: 'Pretendard ExtraBold', body: 'Pretendard', semi: 'Pretendard SemiBold', med: 'Pretendard Medium' };
const W = 13.333, H = 7.5, ML = 0.75;

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.title = '칠판 테스트';
pres.theme = { headFontFace: F.head, bodyFontFace: F.body };
pres.defineSlideMaster({ title: 'T', background: { color: '000000' } });
const S = pres.ShapeType;
const tx = (s, text, x, y, w, h, o = {}) => s.addText(text, { x, y, w, h, isTextBox: true, margin: 0, fontFace: o.font || F.semi, fontSize: o.size || 20, color: o.color || 'FFFFFF', align: o.align || 'left', valign: o.valign || 'top', lineSpacingMultiple: o.lsm || 1.15, fit: 'none' });
const head = (s, no, t, sub) => {
  tx(s, `칠판 테스트 ${no}`, ML, 0.4, 6, 0.4, { size: 17, color: K.neon });
  tx(s, t, ML, 0.78, W - 2 * ML, 0.7, { font: F.head, size: 32 });
  if (sub) tx(s, sub, ML, 1.45, W - 2 * ML, 0.45, { font: F.med, size: 17, color: K.sub });
};
const slide = (notes) => { const s = pres.addSlide({ masterName: 'T' }); s.addNotes(notes); return s; };

// 1. 화면 크기·초점
{
  const s = slide('빔 크기와 위치를 맞추는 화면입니다.\n점선 네모(화면 가장자리)가 칠판 안에 모두 들어오게 빔을 옮기거나 크기를 줄이세요. 네 모서리의 ㄱ자 표시가 모두 칠판 위에 있어야 합니다.\n가는 격자선과 작은 글자가 또렷하게 보이도록 빔 초점을 맞추세요.\n가로 격자선이 휘거나 사다리꼴로 보이면 빔의 사다리꼴 보정(키스톤)으로 바로잡습니다.\n촬영할 카메라 자리에서 폰으로 한 장 찍어 두세요.');
  for (let x = 1; x < W; x += 1) s.addShape(S.line, { x, y: 0, w: 0.0001, h: H, line: { color: K.line, width: 0.75 } });
  for (let y = 1; y < H; y += 1) s.addShape(S.line, { x: 0, y, w: W, h: 0.0001, line: { color: K.line, width: 0.75 } });
  s.addShape(S.rect, { x: 0.12, y: 0.12, w: W - 0.24, h: H - 0.24, line: { color: K.neon, width: 3, dashType: 'dash' } });
  const L = 0.7;
  [[0.3, 0.3, 1, 1], [W - 0.3, 0.3, -1, 1], [0.3, H - 0.3, 1, -1], [W - 0.3, H - 0.3, -1, -1]].forEach(([x, y, dx, dy]) => {
    s.addShape(S.line, { x: Math.min(x, x + dx * L), y, w: L, h: 0.0001, line: { color: K.yellow, width: 4.5 } });
    s.addShape(S.line, { x, y: Math.min(y, y + dy * L), w: 0.0001, h: L, line: { color: K.yellow, width: 4.5 } });
  });
  s.addShape(S.line, { x: W / 2 - 0.5, y: H / 2, w: 1, h: 0.0001, line: { color: 'FFFFFF', width: 2 } });
  s.addShape(S.line, { x: W / 2, y: H / 2 - 0.5, w: 0.0001, h: 1, line: { color: 'FFFFFF', width: 2 } });
  s.addShape(S.rect, { x: 2.4, y: 1.2, w: 8.53, h: 1.55, fill: { color: '000000' }, line: { type: 'none' } });
  tx(s, '칠판 테스트 1 · 화면 크기와 초점', 2.4, 1.25, 8.53, 0.6, { font: F.head, size: 30, align: 'center' });
  tx(s, '점선 네모와 노란 ㄱ자 4개가 모두 칠판 안에 들어오게', 2.4, 1.95, 8.53, 0.5, { font: F.med, size: 20, color: K.sub, align: 'center' });
  s.addShape(S.rect, { x: 3.4, y: 4.6, w: 6.53, h: 1.4, fill: { color: '000000' }, line: { type: 'none' } });
  tx(s, '초점 확인: 이 글자가 또렷한가요?', 3.4, 4.65, 6.53, 0.5, { size: 20, align: 'center' });
  tx(s, '작은 글자 14pt · 통합사회 1등급 ABC 123', 3.4, 5.2, 6.53, 0.4, { font: F.med, size: 14, color: K.sub, align: 'center' });
}

// 2. 색
{
  const s = slide('색이 칠판 위에서 어떻게 보이는지 확인하는 화면입니다.\n1~7번은 지금 OT PPT에 쓴 색이고, 8~12번은 바꿔 쓸 수 있는 후보 색입니다.\n폰으로 찍은 사진에서 안 보이거나 서로 너무 비슷해 보이는 번호를 알려 주세요. 예: "2번과 3번이 똑같아 보임", "11번이 제일 잘 보임".');
  head(s, 2, '색 — 안 보이거나 서로 비슷한 번호를 찾아 주세요', '1~7번: 지금 PPT에 쓴 색   ·   8~12번: 바꿔 쓸 수 있는 후보 색');
  const cur = [['1 흰색', K.text], ['2 하늘(주 색)', K.neon], ['3 민트', K.mint], ['4 분필 노랑', K.yellow], ['5 분홍(통사2)', K.pink], ['6 보조 글자', K.sub], ['7 흐린 글자', K.dim]];
  const alt = [['8 주황', 'FFB443'], ['9 연두', 'C6FF4D'], ['10 진한 노랑', 'FFF200'], ['11 연분홍', 'FF9BE6'], ['12 연하늘', '9FE3FF']];
  const bw = 1.55, gap = 0.18;
  const row = (items, y) => items.forEach(([t, c], i) => {
    const x = ML + i * (bw + gap);
    s.addShape(S.rect, { x, y, w: bw, h: 0.75, fill: { color: c }, line: { type: 'none' } });
    tx(s, t, x, y + 0.82, bw + 0.1, 0.38, { size: 15, color: c });
    tx(s, '1등급', x, y + 1.22, bw, 0.6, { font: F.head, size: 30, color: c });
  });
  row(cur, 2.15);
  row(alt, 4.55);
}

// 3. 밝기 계단
{
  const s = slide('밝기를 10단계로 나눈 화면입니다. 칠판 위에서는 어두운 칸이 칠판 색에 묻혀 사라집니다.\n폰 사진에서 처음으로 구별되는 칸 번호를 알려 주세요. 그보다 어두운 색은 PPT에서 쓰지 않겠습니다.\n아래 글자 줄은 지금 PPT의 보조 글자(6번 칸 정도)와 흐린 글자(4번 칸 정도) 밝기입니다.');
  head(s, 3, '밝기 계단 — 칠판 위에서 처음 보이는 칸은 몇 번인가요?');
  const n = 10, bw = (W - 2 * ML - (n - 1) * 0.12) / n;
  for (let i = 0; i < n; i++) {
    const v = Math.round(((i + 1) / n) * 255), hex = v.toString(16).padStart(2, '0').repeat(3).toUpperCase();
    const x = ML + i * (bw + 0.12);
    s.addShape(S.rect, { x, y: 2.0, w: bw, h: 1.6, fill: { color: hex }, line: { type: 'none' } });
    tx(s, `${i + 1}`, x, 3.7, bw, 0.5, { font: F.head, size: 24, color: 'FFFFFF', align: 'center' });
    tx(s, `${(i + 1) * 10}%`, x, 4.15, bw, 0.4, { font: F.med, size: 15, color: K.sub, align: 'center' });
  }
  tx(s, '보조 글자 밝기 · 2028 대입부터 수능 공통 과목', ML, 4.95, 11.8, 0.5, { font: F.med, size: 22, color: K.sub });
  tx(s, '흐린 글자 밝기 · 100명이 시험을 보면', ML, 5.55, 11.8, 0.5, { font: F.med, size: 22, color: K.dim });
  tx(s, '아주 어두운 상자 (보이면 알려 주세요) →', ML, 6.3, 6, 0.6, { font: F.med, size: 18, color: K.sub, valign: 'middle' });
  s.addShape(S.rect, { x: 7.0, y: 6.3, w: 2.6, h: 0.6, fill: { color: '0C1A24' }, line: { type: 'none' } });
  s.addShape(S.rect, { x: 9.9, y: 6.3, w: 2.6, h: 0.6, fill: { color: '1E1E1E' }, line: { type: 'none' } });
}

// 4. 글자 크기
{
  const s = slide('글자 크기를 확인하는 화면입니다. 학생들은 영상을 폰으로 보므로, 촬영한 영상을 폰 화면으로 볼 때 편하게 읽히는 가장 작은 줄을 알려 주세요.\n지금 OT PPT는 작은 설명 글이 15~18pt, 본문이 20~26pt, 제목이 36pt입니다.');
  head(s, 4, '글자 크기 — 폰으로 찍은 영상에서 편하게 읽히는 가장 작은 줄은?');
  const rows = [[14, F.med, K.sub], [16, F.med, K.sub], [18, F.med, K.sub], [20, F.semi, 'FFFFFF'], [24, F.semi, 'FFFFFF'], [28, F.semi, 'FFFFFF'], [36, F.head, 'FFFFFF'], [48, F.head, 'FFFFFF']];
  let y = 1.95;
  rows.forEach(([pt, font, c]) => {
    const h = pt / 72 * 1.25;
    tx(s, `${pt}pt`, ML, y, 1.1, h, { font: F.semi, size: 15, color: K.neon, valign: 'middle' });
    tx(s, pt >= 36 ? '통합사회 1등급 ABC 123' : '통합사회 1등급 · 기회비용과 비교우위 ABC 123', ML + 1.2, y, 11, h, { font, size: pt, color: c, valign: 'middle' });
    y += h + 0.07;
  });
}

// 5. 선 굵기·상자
{
  const s = slide('선 굵기와 상자 모양을 확인하는 화면입니다. 가는 선은 빔과 카메라를 거치면 사라질 수 있습니다.\n폰 사진에서 또렷하게 보이는 가장 가는 선 번호와, 가장 잘 보이는 상자 모양(A·B·C)을 알려 주세요.');
  head(s, 5, '선 굵기와 상자 — 또렷하게 보이는 가장 가는 선은?');
  [0.75, 1, 1.5, 2, 3, 4.5].forEach((pt, i) => {
    const y = 2.15 + i * 0.5;
    tx(s, `${i + 1}  (${pt}pt)`, ML, y - 0.2, 1.6, 0.4, { size: 16, color: K.sub, valign: 'middle' });
    s.addShape(S.line, { x: ML + 1.7, y, w: 4.3, h: 0.0001, line: { color: K.neon, width: pt } });
    s.addShape(S.line, { x: ML + 6.2, y, w: 1.0, h: 0.0001, line: { color: 'FFFFFF', width: pt } });
  });
  const bx = 8.4, bw = 4.18;
  const boxes = [
    ['A 테두리만', { line: { color: K.neon, width: 2 } }],
    ['B 옅은 색 채움', { fill: { color: K.neon, transparency: 85 }, line: { color: K.neon, width: 2 } }],
    ['C 빛 번짐(네온)', { fill: { color: '000000' }, line: { color: K.neon, width: 2 }, shadow: { type: 'outer', color: K.neon, blur: 12, offset: 0, angle: 0, opacity: 0.5 } }],
  ];
  boxes.forEach(([t, o], i) => {
    const y = 2.0 + i * 1.6;
    s.addShape(S.snip1Rect, { x: bx, y, w: bw, h: 1.3, ...o });
    tx(s, t, bx + 0.3, y, bw - 0.4, 1.3, { font: F.head, size: 22, valign: 'middle' });
  });
}

await pres.writeFile({ fileName: FILE });
{
  const zip = await JSZip.loadAsync(readFileSync(FILE));
  for (const k of Object.keys(zip.files)) if (zip.files[k].dir) delete zip.files[k];
  writeFileSync(FILE, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}
console.log('완성:', FILE, `(${pres.slides.length}장)`);
