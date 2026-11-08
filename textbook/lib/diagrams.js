// 개념 도식 (인포그래픽) — { t: 'diagram', kind: ..., title, note, source, width }
//
// kind
//   cycle      { center, nodes: [{ title, text, icon }] }            순환도 (화살표가 고리를 따라 돎)
//   concentric { rings: [{ title, text }] (안쪽 → 바깥쪽), label }    동심원 (범위가 넓어짐)
//   triangle   { corners: [{ title, text, icon }] ×3, center, split } 삼각형 (예: 폭력의 삼각형, split: 보이는/보이지 않는 선)
//   stairs     { steps: [{ title, text, icon }], arrow }               계단 (단계가 높아짐)
//   timeline   { events: [{ year, title, text, icon }] }               연표
//   cards      { items: [{ title, text, icon, tag }], cols }           아이콘 카드
//   layers     { layers: [{ title, text }] (아래 → 위), shape: 'pyramid'|'stack' }
//   econflow   { gov: true }                                           민간 경제의 순환 (가계·기업·시장)
//   cultchange { items: [{ title, text }] ×3 }                          문화 변동의 양상 (동화·병존·융합)
//   venn3      { sets: [이름×3], center, texts: [설명×3] }              세 원 (예: 지속가능발전)
//   yesno      { start, tree, legend }                                 예/아니요 순서도(사상가 입장 탐구 등)
//              tree: { q: 'A', yes: 노드|'갑의 입장', no: 노드|'을의 입장' } — 예는 아래로(실선), 아니요는 오른쪽으로(점선)
//   citymodel  { items: [{ key, title, text }] }                        도시 내부 구조 모식도(도심·부도심·주거·공업·개발 제한 구역·위성 도시)
//              색은 우리나라 용도 지역 지도의 관례를 따른다(상업 분홍, 주거 노랑, 공업 보라, 녹지 초록)
// 색은 대단원 색(--c1 계열)을 따르고, 아이콘은 lib/icons.js (Tabler Icons)
import { icon, iconAt } from './icons.js';

const r1 = (n) => Math.round(n * 10) / 10;
// 항목마다 다른 색 (대단원 색 → 진한 색 → 보조색 순)
const TONES = ['var(--dg1)', 'var(--dg2)', 'var(--dg3)', 'var(--dg4)', 'var(--dg5)', 'var(--dg6)'];
const tone = (i) => TONES[i % TONES.length];

export function diagram(b, inl) {
  const T = (s) => inl(s ?? '');
  switch (b.kind) {
    case 'cycle': {
      const n = b.nodes.length, W = 100, H = b.ratio || 62;
      const cx = 50, cy = H / 2, rx = 34, ry = H * 0.36;
      const pos = b.nodes.map((_, i) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a), a]; });
      // 고리 화살표 (노드 사이 호)
      let arcs = '';
      for (let i = 0; i < n; i++) {
        const a0 = pos[i][2] + 0.42, a1 = pos[(i + 1) % n][2] - 0.42 + (i === n - 1 ? 2 * Math.PI : 0);
        const p0 = [cx + rx * Math.cos(a0), cy + ry * Math.sin(a0)], p1 = [cx + rx * Math.cos(a1), cy + ry * Math.sin(a1)];
        arcs += `<path d="M${r1(p0[0])},${r1(p0[1])} A${rx},${ry} 0 0 1 ${r1(p1[0])},${r1(p1[1])}" class="dg-arc" marker-end="url(#dgah)"/>`;
      }
      const svg = `<svg class="dg-layer" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><marker id="dgah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto"><path d="M0,0L10,5L0,10z" class="dg-ahd"/></marker></defs>${arcs}</svg>`;
      const nodes = b.nodes.map((nd, i) => `<div class="dg-cnode" style="left:${r1(pos[i][0])}%;top:${r1((pos[i][1] / H) * 100)}%;--t:${tone(i)}"><span class="dg-badge">${icon(nd.icon, { size: 20 })}</span><b>${T(nd.title)}</b>${nd.text ? `<span>${T(nd.text)}</span>` : ''}</div>`).join('');
      const center = b.center ? `<div class="dg-ccenter" style="top:${r1((cy / H) * 100)}%">${T(b.center)}</div>` : '';
      return `<div class="dg dg-cycle" style="aspect-ratio:${W}/${H}">${svg}${center}${nodes}</div>`;
    }
    case 'concentric': {
      const n = b.rings.length;
      let svg = '';
      for (let i = n - 1; i >= 0; i--) {
        const r = 18 + (i * 78) / Math.max(1, n - 1);
        svg += `<circle cx="100" cy="100" r="${r1(r)}" style="fill:${tone(i)}" class="dg-ring"/>`;
      }
      for (let i = 0; i < n; i++) {
        const r = 18 + (i * 78) / Math.max(1, n - 1), rin = i === 0 ? 0 : 18 + ((i - 1) * 78) / Math.max(1, n - 1);
        const y = i === 0 ? 100 : 100 - (r + rin) / 2;
        svg += `<text x="100" y="${r1(y + 4)}" text-anchor="middle" class="dg-rlabel">${esc(b.rings[i].short || String(i + 1))}</text>`;
      }
      const list = b.rings.map((rg, i) => `<li style="--t:${tone(i)}"><span class="dg-dot">${esc(rg.short || String(i + 1))}</span><div><b>${T(rg.title)}</b>${rg.text ? `<span>${T(rg.text)}</span>` : ''}</div></li>`).join('');
      return `<div class="dg dg-concentric"><svg viewBox="0 0 200 200" class="dg-rings">${svg}</svg><ol class="dg-rlist">${b.label ? `<div class="dg-rlab">${T(b.label)}</div>` : ''}${list}</ol></div>`;
    }
    case 'yesno': {
      // 2026-11-07: 평가원 생활과 윤리·스타강사 모의고사의 '사상가 입장 순서도' 형식. 마름모 = 판단 내용(A·B·C 또는 짧은 질문), 네모 = 출발 조건, 물결 상자 = 입장
      const CW = 150, RH = 74, PADX = 14, PADY = 10, DW = 118, DH = 46, TW = 118, TH = 34;
      const width = (n) => (typeof n === 'string' || !n ? 1 : width(n.yes) + (n.no ? width(n.no) : 0));
      const items = [];
      const place = (n, col, row) => {
        if (!n) return null;
        const me = { n, col, row };
        items.push(me);
        if (typeof n !== 'string') { me.y = place(n.yes, col, row + 1); me.no = n.no ? place(n.no, col + width(n.yes), row + 1) : null; }
        return me;
      };
      const root = place(b.tree, 0, 1);
      const cols = width(b.tree), rows = Math.max(...items.map((i) => i.row)) + 1;
      const W = PADX * 2 + cols * CW + (b.legend === false ? 0 : 150), H = PADY * 2 + rows * RH - 18;
      const cx = (c) => PADX + c * CW + CW / 2, cy = (r) => PADY + r * RH + DH / 2;
      const wrap = (t, n) => { const out = []; let line = ''; for (const w of String(t).split(' ')) { if ((line + ' ' + w).trim().length > n && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); } if (line) out.push(line); return out; };
      // fs: 글씨 배율(문제집 빌드에서 1.2 — 순서도 글씨가 작다는 검토 의견 2026-11-08). 배율만큼 한 줄 글자 수를 줄여 상자 밖으로 안 나가게
      const fs = b.fs || 1;
      const txt = (x, y, t, n0, size0 = 11, w = 400) => { const size = size0 * fs, n = Math.max(4, Math.floor(n0 / fs)); const ls = wrap(t, n); return ls.map((l, i) => `<text x="${r1(x)}" y="${r1(y + (i - (ls.length - 1) / 2) * (size + 2) + size * 0.35)}" text-anchor="middle" style="font-size:${size}px;font-weight:${w}" class="yn-t">${esc(l)}</text>`).join(''); };
      let g = '';
      // 출발 조건
      const sx0 = cx(0), sy0 = PADY + 4;
      g += `<rect x="${r1(sx0 - 66)}" y="${sy0}" width="132" height="${TH + 6}" class="yn-start"/>` + txt(sx0, sy0 + (TH + 6) / 2, b.start || '', 12, 10.5);
      g += `<line x1="${r1(sx0)}" y1="${r1(sy0 + TH + 6)}" x2="${r1(sx0)}" y2="${r1(cy(1) - DH / 2 - 2)}" class="yn-a" marker-end="url(#ynah)"/>`;
      for (const it of items) {
        const x = cx(it.col), y = cy(it.row);
        if (typeof it.n === 'string') {
          // 입장(물결 아래 변 상자)
          const w = TW, h = TH, x0 = x - w / 2, y0 = y - h / 2;
          g += `<path d="M${r1(x0)},${r1(y0)} h${w} v${h - 4} q${-w / 4},6 ${-w / 2},0 t${-w / 2},0 z" class="yn-end"/>` + txt(x, y - 1, it.n, 10, 11, 700);
          continue;
        }
        g += `<polygon points="${r1(x)},${r1(y - DH / 2)} ${r1(x + DW / 2)},${r1(y)} ${r1(x)},${r1(y + DH / 2)} ${r1(x - DW / 2)},${r1(y)}" class="yn-q"/>` + txt(x, y, it.n.q, 9, it.n.q.length <= 2 ? 13 : 10, it.n.q.length <= 2 ? 700 : 400);
        if (it.y) { // 예: 아래로
          const ty = typeof it.y.n === 'string' ? cy(it.y.row) - TH / 2 : cy(it.y.row) - DH / 2;
          g += `<line x1="${r1(x)}" y1="${r1(y + DH / 2)}" x2="${r1(x)}" y2="${r1(ty - 2)}" class="yn-a" marker-end="url(#ynah)"/>` + `<text x="${r1(x + 6)}" y="${r1((y + DH / 2 + ty) / 2 + 4)}" class="yn-l">예</text>`;
        }
        if (it.no) { // 아니요: 오른쪽으로 갔다가 아래로(점선)
          const nx = cx(it.no.col), ty = typeof it.no.n === 'string' ? cy(it.no.row) - TH / 2 : cy(it.no.row) - DH / 2;
          g += `<path d="M${r1(x + DW / 2)},${r1(y)} H${r1(nx)} V${r1(ty - 2)}" class="yn-a yn-no" marker-end="url(#ynah)"/>` + `<text x="${r1((x + DW / 2 + nx) / 2)}" y="${r1(y - 5)}" text-anchor="middle" class="yn-l">아니요</text>`;
        }
      }
      if (b.legend !== false) {
        const lx = PADX + cols * CW + 14, ly = PADY + 6;
        g += `<rect x="${lx - 6}" y="${ly - 4}" width="140" height="92" class="yn-lg"/><text x="${lx + 64}" y="${ly + 8}" text-anchor="middle" class="yn-l">(범 례)</text>`;
        const rowsL = [['start', '출발 조건'], ['q', '판단 내용'], ['a', '판단 방향'], ['end', '사상가의 입장']];
        rowsL.forEach(([k, lab], i) => {
          const y = ly + 26 + i * 18, x = lx + 4;
          g += k === 'start' ? `<rect x="${x}" y="${y - 6}" width="22" height="11" class="yn-start"/>`
            : k === 'q' ? `<polygon points="${x + 11},${y - 7} ${x + 23},${y} ${x + 11},${y + 7} ${x - 1},${y}" class="yn-q"/>`
            : k === 'a' ? `<line x1="${x}" y1="${y}" x2="${x + 22}" y2="${y}" class="yn-a" marker-end="url(#ynah)"/>`
            : `<path d="M${x},${y - 6} h22 v9 q-5.5,4 -11,0 t-11,0 z" class="yn-end"/>`;
          g += `<text x="${x + 32}" y="${y + 4}" class="yn-l" style="text-anchor:start">${lab}</text>`;
        });
      }
      const defs = `<defs><marker id="ynah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="#495057"/></marker></defs>`;
      return `<div class="dg dg-yesno"><svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W * 1.1}px;display:block;margin:0 auto">${defs}<style>.yn-start,.yn-q,.yn-end,.yn-lg{fill:#fff;stroke:#495057;stroke-width:1.1}.yn-lg{stroke:#adb5bd}.yn-a{stroke:#495057;stroke-width:1.2;fill:none}.yn-no{stroke-dasharray:4 3}.yn-l{font-size:${r1(10.5 * fs)}px;fill:#343a40}.yn-t{fill:#212529}</style>${g}</svg></div>`;
    }
    case 'citymodel': {
      // 강사 2026-11-07: 도심·부도심·주거 지역 + 공업 지역을 한 그림에. 서울 지도(용도 색)와 같은 색을 쓴다.
      const C = { cbd: '#d6336c', sub: '#f783ac', res: '#ffe066', ind: '#b197fc', gb: '#8ce99a', sat: '#dee2e6' };
      const pt = (r, deg) => [100 + r * Math.cos((deg * Math.PI) / 180), 100 + r * Math.sin((deg * Math.PI) / 180)];
      const wedge = (r0, r1_, a0, a1) => { const [x0, y0] = pt(r1_, a0), [x1, y1] = pt(r1_, a1), [x2, y2] = pt(r0, a1), [x3, y3] = pt(r0, a0);
        return `M${r1(x0)},${r1(y0)} A${r1_},${r1_} 0 0 1 ${r1(x1)},${r1(y1)} L${r1(x2)},${r1(y2)} A${r0},${r0} 0 0 0 ${r1(x3)},${r1(y3)}Z`; };
      let g = '';
      g += `<circle cx="100" cy="100" r="92" fill="${C.gb}"/><circle cx="100" cy="100" r="82" fill="${C.res}"/>`; // 개발 제한 구역 띠, 주거 지역
      g += `<path d="${wedge(44, 78, 192, 242)}" fill="${C.ind}"/><path d="${wedge(52, 78, 330, 352)}" fill="${C.ind}"/>`; // 공업 지역(강·철도·고속 도로 가)
      g += `<circle cx="100" cy="100" r="44" fill="#fff3bf" stroke="#e8c547" stroke-width=".6" stroke-dasharray="2 1.5"/>`; // 중간 지역(주거·상업·공업 혼재)
      g += `<path d="M2,128 C40,122 62,140 100,134 S160,112 198,118" fill="none" stroke="#4dabf7" stroke-width="4" stroke-linecap="round"/>`; // 강
      for (const [r, a] of [[60, 20], [62, 150], [58, 275]]) { const [x, y] = pt(r, a); g += `<circle cx="${r1(x)}" cy="${r1(y)}" r="9" fill="${C.sub}" stroke="#fff" stroke-width="1.2"/><text x="${r1(x)}" y="${r1(y + 3.2)}" text-anchor="middle" class="dg-rlabel" style="font-size:8.5px">2</text>`; }
      g += `<circle cx="100" cy="100" r="16" fill="${C.cbd}" stroke="#fff" stroke-width="1.4"/><text x="100" y="104" text-anchor="middle" class="dg-rlabel" style="fill:#fff">1</text>`;
      for (const [x, y] of [[214, 40], [222, 150], [196, 206]]) g += `<circle cx="${x}" cy="${y}" r="10" fill="${C.sat}" stroke="#adb5bd" stroke-width=".8"/><text x="${x}" y="${y + 3.2}" text-anchor="middle" class="dg-rlabel" style="font-size:8.5px">6</text>`;
      g += `<text x="74" y="78" text-anchor="middle" class="dg-rlabel" style="font-size:8.5px">3</text><text x="166" y="70" text-anchor="middle" class="dg-rlabel" style="font-size:8.5px">3</text>`;
      { const [x, y] = pt(64, 217); g += `<text x="${r1(x)}" y="${r1(y + 3)}" text-anchor="middle" class="dg-rlabel" style="font-size:8.5px">4</text>`; }
      g += `<text x="100" y="12" text-anchor="middle" class="dg-rlabel" style="font-size:8.5px">5</text>`;
      const sw = { cbd: C.cbd, sub: C.sub, res: C.res, ind: C.ind, gb: C.gb, sat: C.sat };
      const ink = { cbd: '#c2255c', sub: '#c2255c', res: '#9c7a00', ind: '#6741d9', gb: '#2b8a3e', sat: '#5c636a' }; // 제목 글자는 진한 색(연한 칸 색은 읽기 어려움)
      const list = b.items.map((it, i) => `<li style="--t:${ink[it.key] || tone(i)}"><span class="dg-dot" style="background:${sw[it.key]};color:${['res', 'gb', 'sat'].includes(it.key) ? '#333' : '#fff'}">${i + 1}</span><div><b>${T(it.title)}</b>${it.text ? `<span>${T(it.text)}</span>` : ''}</div></li>`).join('');
      return `<div class="dg dg-concentric dg-city"><svg viewBox="0 0 240 216" class="dg-rings">${g}</svg><ol class="dg-rlist">${b.label ? `<div class="dg-rlab">${T(b.label)}</div>` : ''}${list}</ol></div>`;
    }
    case 'triangle': {
      // 꼭짓점: 위(50,22) / 왼쪽 아래(16,66) / 오른쪽 아래(84,66). 위 꼭짓점 글자는 꼭짓점 위에, 아래 꼭짓점 글자는 아래에 둔다
      const [a, c, d] = b.corners, H = 84;
      const Y = (y70) => 22 + (y70 - 10) * (44 / 52);   // 예전 좌표(0~70) → 새 좌표
      const sy = Y(b.splitY || 44);
      const split = b.split ? `<line x1="4" y1="${r1(sy)}" x2="96" y2="${r1(sy)}" class="dg-split"/>` : '';
      const splitL = b.split ? `<div class="dg-splitl" style="top:${r1((sy / H) * 100)}%"><span>▲ ${T(b.split[0])}</span><span>▼ ${T(b.split[1])}</span></div>` : '';
      const svg = `<svg class="dg-layer" viewBox="0 0 100 ${H}" preserveAspectRatio="none"><polygon points="50,22 16,66 84,66" class="dg-tri"/>${split}</svg>`;
      const node = (x, y, nd, i, cls) => `<div class="dg-tnode ${cls}" style="left:${x}%;top:${r1((y / H) * 100)}%;--t:${tone(i)}"><span class="dg-badge">${icon(nd.icon, { size: 20 })}</span><b>${T(nd.title)}</b>${nd.text ? `<span>${T(nd.text)}</span>` : ''}</div>`;
      return `<div class="dg dg-triangle" style="aspect-ratio:100/${H}">${svg}${splitL}${b.center ? `<div class="dg-tcenter" style="top:${r1((Y(43) / H) * 100)}%">${T(b.center)}</div>` : ''}${node(50, 22, a, 0, 'top')}${node(16, 66, c, 1, 'bl')}${node(84, 66, d, 2, 'br')}</div>`;
    }
    case 'stairs': {
      // 왼쪽 → 오른쪽으로 한 칸씩 높아지는 계단. 칸 높이는 글자에 맞추고, 위쪽 여백으로 계단 모양을 만든다
      const n = b.steps.length, rise = b.rise || 7;
      const steps = b.steps.map((s, i) => `<div class="dg-step" style="--t:${tone(i)};margin-top:${(n - 1 - i) * rise}mm"><div class="dg-sh"><span class="dg-sn">${i + 1}</span>${icon(s.icon, { size: 18 })}</div><b>${T(s.title)}</b>${s.text ? `<span>${T(s.text)}</span>` : ''}</div>`).join('');
      return `<div class="dg dg-stairs">${steps}${b.arrow ? `<div class="dg-sarrow">${T(b.arrow)} →</div>` : ''}</div>`;
    }
    case 'timeline': {
      const ev = b.events.map((e, i) => `<div class="dg-ev" style="--t:${tone(b.mono ? 0 : i)}"><div class="dg-year">${T(e.year)}</div><div class="dg-pin">${icon(e.icon || 'point', { size: 14 })}</div><b>${T(e.title)}</b>${e.text ? `<span>${T(e.text)}</span>` : ''}</div>`).join('');
      return `<div class="dg dg-timeline" style="grid-template-columns:repeat(${b.events.length},1fr)">${ev}</div>`;
    }
    case 'cards': {
      const cols = b.cols || b.items.length;
      const items = b.items.map((it, i) => `<div class="dg-card" style="--t:${tone(b.mono ? 0 : i)}">${it.tag ? `<span class="dg-tag">${T(it.tag)}</span>` : ''}<span class="dg-badge">${icon(it.icon, { size: 22 })}</span><b>${T(it.title)}</b>${it.text ? `<span>${T(it.text)}</span>` : ''}</div>`).join('');
      return `<div class="dg dg-cards" style="grid-template-columns:repeat(${cols},1fr)">${items}</div>`;
    }
    case 'layers': {
      // 아래 → 위 순서로 받은 층을 위부터 그림. 피라미드는 위로 갈수록 좁아지는 사다리꼴
      const n = b.layers.length, pyr = b.shape !== 'stack';
      const rows = b.layers.slice().reverse().map((l, k) => {
        const wb = pyr ? 26 + (74 * (k + 1)) / n : 100, wt = pyr ? 26 + (74 * k) / n : 100;
        const inset = r1(((wb - wt) / 2 / wb) * 100);
        const clip = pyr ? `clip-path:polygon(${inset}% 0, ${r1(100 - inset)}% 0, 100% 100%, 0 100%)` : '';
        return `<div class="dg-lrow"><div class="dg-lbox" style="--t:${tone(n - 1 - k)};width:${r1(wb)}%;${clip}"><b>${T(l.title)}</b></div><div class="dg-ltext">${T(l.text)}</div></div>`;
      }).join('');
      return `<div class="dg dg-layers${pyr ? ' pyr' : ''}">${rows}${b.arrow ? `<div class="dg-larrow">${T(b.arrow)}</div>` : ''}</div>`;
    }
    case 'econflow': {
      // 가계(왼쪽)·기업(오른쪽)·생산물 시장(위)·생산 요소 시장(아래)
      const box = (x, y, w, h, t, ic, cls) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" class="dg-ebox ${cls}"/>${iconAt(ic, x + w / 2 - 11, y + 8, 22, { color: '#fff' })}<text x="${x + w / 2}" y="${y + h - 11}" text-anchor="middle" class="dg-et">${t}</text>`;
      const arr = (d, cls, lab, lx, ly, anchor = 'middle') => `<path d="${d}" class="dg-ea ${cls}" marker-end="url(#ea-${cls})"/><text x="${lx}" y="${ly}" text-anchor="${anchor}" class="dg-el ${cls}">${lab}</text>`;
      let s = `<defs>${['real', 'money'].map((c) => `<marker id="ea-${c}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" class="dg-eah ${c}"/></marker>`).join('')}</defs>`;
      s += box(20, 120, 120, 70, '가계', 'home', 'hh') + box(460, 120, 120, 70, '기업', 'building-factory-2', 'firm');
      s += box(220, 12, 160, 62, '생산물 시장', 'shopping-cart', 'mk') + box(220, 236, 160, 62, '생산 요소 시장', 'users-group', 'mk');
      // 위쪽: 재화·서비스(기업 → 시장 → 가계), 소비 지출(가계 → 시장 → 기업)
      s += arr('M520,118 C520,60 470,36 386,36', 'real', '재화·서비스', 470, 48);
      s += arr('M214,36 C130,36 82,60 82,116', 'real', '재화·서비스', 128, 48);
      s += arr('M96,118 C100,74 150,58 214,56', 'money', '소비 지출', 150, 92);
      s += arr('M386,56 C452,58 500,74 506,116', 'money', '판매 수입', 452, 92);
      // 아래쪽: 생산 요소(가계 → 시장 → 기업), 소득(기업 → 시장 → 가계)
      s += arr('M82,192 C82,250 130,274 214,274', 'real', '노동·토지·자본', 128, 266);
      s += arr('M386,274 C470,274 520,250 520,194', 'real', '노동·토지·자본', 470, 266);
      s += arr('M506,194 C500,236 452,252 386,254', 'money', '생산 비용 지급', 452, 228);
      s += arr('M214,254 C150,252 100,236 96,194', 'money', '소득(임금·지대·이자)', 150, 228);
      if (b.gov) {
        s += box(250, 132, 100, 46, '정부', 'building-bank', 'gov');
        s += `<path d="M142,155 L246,155" class="dg-ea gov" marker-end="url(#ea-money)"/><path d="M354,155 L456,155" class="dg-ea gov" marker-end="url(#ea-money)"/><text x="194" y="149" text-anchor="middle" class="dg-el gov">세금</text><text x="405" y="149" text-anchor="middle" class="dg-el gov">세금</text>`;
      }
      s += `<g transform="translate(18 322)"><path d="M0,0h22" class="dg-ea real"/><text x="28" y="4" class="dg-elg">실물(재화·서비스, 생산 요소)의 흐름</text><path d="M230,0h22" class="dg-ea money"/><text x="258" y="4" class="dg-elg">화폐의 흐름</text></g>`;
      return `<div class="dg dg-econ"><svg viewBox="0 0 600 332">${s}</svg></div>`;
    }
    case 'cultchange': {
      // 동화 · 병존 · 융합: A(우리 문화) + B(외래문화) → 결과
      const C = (x, y, r, cls, t) => `<circle cx="${x}" cy="${y}" r="${r}" class="dg-cc ${cls}"/><text x="${x}" y="${y + 4.5}" text-anchor="middle" class="dg-cct">${t}</text>`;
      const pre = C(26, 40, 15, 'a', 'A') + C(62, 40, 15, 'b', 'B') + `<path d="M84,40 h18" class="dg-carr" marker-end="url(#ccah)"/>`;
      const res = [C(130, 40, 19, 'b', 'B'), C(118, 40, 13, 'a', 'A') + C(146, 40, 13, 'b', 'B'), C(130, 40, 19, 'c', 'C')];
      const defs = `<defs><marker id="ccah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="#5c6670"/></marker></defs>`;
      const items = b.items.map((it, i) => `<div class="dg-ccard" style="--t:${tone(i)}"><b>${T(it.title)}</b><svg viewBox="0 0 160 80">${defs}${pre}${res[i]}</svg><span>${T(it.text)}</span></div>`).join('');
      return `<div class="dg dg-cult">${items}</div>${b.legend !== false ? `<div class="dg-cleg"><i class="a"></i>A 기존 문화 <i class="b"></i>B 다른 문화 <i class="c"></i>C 새로운 문화</div>` : ''}`;
    }
    case 'venn3': {
      const [A, B2, C] = b.sets;
      const svg = `<svg viewBox="0 0 300 250" class="dg-v3"><circle cx="150" cy="92" r="72" class="dg-vc" style="fill:${tone(0)}"/><circle cx="104" cy="168" r="72" class="dg-vc" style="fill:${tone(1)}"/><circle cx="196" cy="168" r="72" class="dg-vc" style="fill:${tone(2)}"/>`
        + `<text x="150" y="58" text-anchor="middle" class="dg-vt">${esc(A)}</text><text x="78" y="196" text-anchor="middle" class="dg-vt">${esc(B2)}</text><text x="222" y="196" text-anchor="middle" class="dg-vt">${esc(C)}</text>`
        + (b.center ? `<text x="150" y="146" text-anchor="middle" class="dg-vcen">${esc(b.center)}</text>` : '') + '</svg>';
      const texts = (b.texts || []).map((t, i) => `<li style="--t:${tone(i)}"><b>${esc(b.sets[i])}</b> ${T(t)}</li>`).join('');
      return `<div class="dg dg-venn3">${svg}${texts ? `<ul class="dg-vlist">${texts}</ul>` : ''}</div>`;
    }
    default:
      throw new Error(`모르는 도식: ${b.kind}`);
  }
}
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
