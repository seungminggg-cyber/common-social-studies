// 대단원 끝 백지테스트 — 백지테스트 채팅(브랜치 claude/blank-test)의 블록 형식을 그대로 읽어 총정리 쪽 모양으로 그린다.
// 블록: flow(개념 지도) · table(비교 표) · keys(키워드) · fill(빈칸 정리, {답})
// 칸 글: '~'로 시작하면 **굵은** 핵심어만 빈칸, '!'로 시작하면 주어진 칸(채점 칸 아님), 그 밖은 칸 전체가 답.
// test = 학생 책(답 글자 투명 + 쓰는 줄), answer = 정답 별책(답 빨강)
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const bold = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

export function blankPage(P) {
  let cells = 0;
  const ans = (s) => {
    if (s.startsWith('!')) return `<span class="bt-g">${bold(s.slice(1))}</span>`;
    if (s.startsWith('~')) return `<span class="bt-kw">${esc(s.slice(1)).replace(/\*\*(.+?)\*\*/g, (_, x) => { cells += 1; return `<span class="bt-a bt-f">${x}</span>`; })}</span>`;
    cells += 1;
    return `<span class="bt-a bt-whole">${bold(s)}</span>`;
  };
  const fillLine = (s) => esc(s).replace(/\{(.+?)\}/g, (_, x) => { cells += 1; return `<span class="bt-a bt-f">${x}</span>`; });
  const blockHtml = (b, i) => {
    const head = `<div class="bt-h"><span class="bt-no">${i + 1}</span><span class="bt-kind">${esc(b.kind || '')}</span>${b.title ? `<h3>${esc(b.title)}</h3>` : ''}</div>`;
    if (b.t === 'flow') {
      const n = b.steps.length;
      let h = `<div class="bt-flow" style="grid-template-columns:${b.label || '7.5em'} repeat(${n}, 1fr)"><div class="bt-fc"></div>`;
      h += b.steps.map((s, k) => `<div class="bt-fname${k < n - 1 ? ' arrow' : ''}">${esc(s.name)}</div>`).join('');
      b.rows.forEach((r, ri) => { h += `<div class="bt-frow">${esc(r)}</div>` + b.steps.map((s) => `<div class="bt-fcell">${ans(s.cells[ri])}</div>`).join(''); });
      return `<section class="bt-bk">${head}${h}</div></section>`;
    }
    if (b.t === 'table') {
      const th = `<tr>${b.cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr>`;
      const tr = b.rows.map((r) => `<tr><th class="rh">${esc(r[0])}</th>${r.slice(1).map((c) => `<td>${ans(c)}</td>`).join('')}</tr>`).join('');
      return `<section class="bt-bk${b.wide ? '' : ' half'}">${head}<table class="bt-cmp"><colgroup><col style="width:${b.head || '22mm'}">${b.cols.slice(1).map(() => '<col>').join('')}</colgroup>${th}${tr}</table></section>`;
    }
    if (b.t === 'keys') return `<section class="bt-bk">${head}<dl class="bt-keys">${b.items.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${ans(v)}</dd></div>`).join('')}</dl></section>`;
    if (b.t === 'fill') return `<section class="bt-bk">${head}<ol class="bt-fill">${b.lines.map((l) => `<li>${fillLine(l)}</li>`).join('')}</ol></section>`;
    throw new Error(`모르는 백지테스트 블록: ${b.t}`);
  };
  const body = P.blocks.map(blockHtml);
  const html = [];
  for (let i = 0; i < body.length; i++) {
    if (body[i].includes('bt-bk half') && body[i + 1]?.includes('bt-bk half')) { html.push(`<div class="bt-pair">${body[i]}${body[i + 1]}</div>`); i += 1; } else html.push(body[i]);
  }
  const inner = html.join('');
  return { test: `<div class="bt bt-test">${inner}</div>`, answer: `<div class="bt bt-ans">${inner}</div>`, cells };
}
