// 학원 블로그 글 초안 → 워드 파일(그림 6장 포함)
//   node 수능반OT/blog/cards.mjs   (먼저 카드 그림 만들기)
//   node 수능반OT/blog/docx.cjs    →  수능반OT/out/블로그/블로그-초안-연간커리큘럼OT.docx
// 글 내용은 수능반OT/블로그초안.md를 그대로 읽어 만든다(2026-11-26: OT 영상에서 강사가 실제로 한 말 기준으로 고쳐 씀).
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, BorderStyle, ShadingType, LevelFormat,
} = require('/opt/node-tools/node_modules/docx');

const OUT = path.join(__dirname, '../out/블로그');
const FONT = '맑은 고딕';
const BLUE = '0C357F', GRAY = '6B7686';

// ── 문단 도구 ──
const run = (t, o = {}) => new TextRun({ text: t, font: FONT, size: o.size || 22, bold: o.bold, color: o.color, italics: o.italic });
// 한 줄 = 한 문단. 글자 조각: '보통 글' 또는 ['글', {bold, color, size}]
const P = (parts, o = {}) => new Paragraph({
  children: (Array.isArray(parts) ? parts : [parts]).map((x) => (typeof x === 'string' ? run(x, o) : run(x[0], { ...o, ...x[1] }))),
  spacing: { after: o.after ?? 40, line: 300 },
  alignment: o.align,
  shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
  border: o.border,
  indent: o.indent,
});
const gap = () => new Paragraph({ children: [run('')], spacing: { after: 60 } });
// 줄 여러 개를 문단으로(블로그처럼 짧은 줄 + 빈 줄)
const lines = (txt, o = {}) => txt.split('\n').map((l) => P(l, o));
const H = (t) => new Paragraph({ children: [run(t, { bold: true, size: 30, color: BLUE })], spacing: { before: 200, after: 160 }, keepNext: true });
const SUBH = (t) => new Paragraph({ children: [run(t, { bold: true, size: 25 })], spacing: { before: 120, after: 60 }, keepNext: true });
const quote = (t) => P(t, { size: 24, italic: false, color: '333333', fill: 'F2F4F8', indent: { left: 240, right: 240 }, after: 120,
  border: { left: { style: BorderStyle.SINGLE, size: 24, color: BLUE, space: 8 } } });
const hr = () => new Paragraph({ children: [run('')], spacing: { before: 120, after: 240 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C9D1DE', space: 1 } } });
// 블로그에서 직접 넣을 것(영상·지도) 표시
const slot = (t) => P(`▶ ${t}`, { color: GRAY, size: 21, fill: 'FFF6D6', align: AlignmentType.CENTER, after: 160 });
const img = (n) => new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 120, after: 200 },
  children: [new ImageRun({ type: 'jpg', data: fs.readFileSync(path.join(OUT, `카드-${n}.jpg`)), transformation: { width: 386, height: 483 }, altText: { title: `카드 ${n}`, description: `블로그 카드 그림 ${n}`, name: `card${n}` } })],
});
// ── 초안(블로그초안.md)을 읽어 문단으로 바꾼다 ──
// 표시: [제목 후보] … ─── / [카드N] 그림 / [OT 영상]·[지도] 노란 칸 / [인용구] 글 / [구분선] / ■ 큰 제목 /
//       ①~④·📘📗📕📒 작은 제목 / ✔ 제목: 설명 (제목만 굵게) / **굵게** / 빈 줄 = 간격 / [태그 후보] 회색
const inline = (line, o = {}) => line.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((t) => (t.startsWith('**') ? [t.slice(2, -2), { bold: true }] : [t, {}]));
function build(md) {
  const out = [];
  const L = md.split('\n');
  let i = 0;
  if (L[0].startsWith('[제목 후보]')) {
    out.push(P([['제목 후보 (하나만 고르기)', { bold: true, color: GRAY, size: 20 }]], { fill: 'EEF1F6', after: 0 }));
    for (i = 1; !L[i].startsWith('───'); i++) out.push(P(L[i], { size: 20, color: '333333', fill: 'EEF1F6', after: 0 }));
    out.push(gap()); i++;
  }
  for (; i < L.length; i++) {
    const l = L[i].trimEnd();
    let m;
    if (!l) { out.push(gap()); continue; }
    if (l.startsWith('───')) { out.push(hr()); continue; }
    if ((m = l.match(/^\[카드(\d)\]$/))) { out.push(img(+m[1])); continue; }
    if (l === '[OT 영상]') { out.push(slot('여기에 OT 영상')); continue; }
    if (l === '[지도]') { out.push(slot('여기에 지도(장소: 너를위한메이트학원)')); continue; }
    if (l === '[구분선]') { out.push(hr()); continue; }
    if ((m = l.match(/^\[인용구\]\s*(.*)$/))) { out.push(quote(m[1])); continue; }
    if ((m = l.match(/^\[태그 후보\]\s*(.*)$/))) { out.push(P([['태그 후보', { bold: true, color: GRAY, size: 20 }]], { after: 0 }), P(m[1], { size: 20, color: GRAY })); continue; }
    if (l.startsWith('■ ')) { out.push(H(l)); while (i + 1 < L.length && !L[i + 1].trim()) i++; continue; } // 제목 바로 뒤 빈 줄은 건너뜀(제목이 쪽 끝에 홀로 남지 않게)
    if (/^[①②③④]|^📘|^📗|^📕|^📒/.test(l)) { out.push(SUBH(l)); continue; }
    if ((m = l.match(/^✔\s*([^:]+):\s*(.*)$/))) { out.push(P([['✔ ', { color: BLUE, bold: true }], [m[1] + ': ', { bold: true }], ...inline(m[2])])); continue; }
    if ((m = l.match(/^✔\s*(.*)$/))) { out.push(P([['✔ ', { color: BLUE, bold: true }], ...inline(m[1])])); continue; }
    out.push(P(inline(l)));
  }
  return out;
}
const body = build(fs.readFileSync(path.join(__dirname, '../블로그초안.md'), 'utf8'));

const doc = new Document({
  creator: '이승민',
  title: '블로그 글 초안 — 2028 수능 대비 연간 커리큘럼 OT',
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  numbering: { config: [{ reference: 'none', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT }] }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1300, left: 1300, right: 1300 } } },
    children: body,
  }],
});
Packer.toBuffer(doc).then((buf) => {
  const f = path.join(OUT, '블로그-초안-연간커리큘럼OT.docx');
  fs.writeFileSync(f, buf);
  console.log('완성:', f);
});
