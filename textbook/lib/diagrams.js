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
      return `<div class="dg dg-stairs">${steps}${b.arrow ? `<div class="dg-sarrow">${T(b.arrow)} ➜</div>` : ''}</div>`;
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
