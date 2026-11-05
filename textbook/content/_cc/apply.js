// 개념 카드 붙이기 (시안 H)
//
// 중단원 내용(u)은 그대로 두고, 따로 적은 '개념 계획(spec)'으로
//   1) 큰 묶음(A·B·C) 제목을 빼고 '개념 01, 02 …' 머리를 넣는다 (중단원을 한 가지로만 나눈다)
//   2) 개념마다 끝에 '이렇게 나온다'(기출 선지 모양 O/X)를 넣는다
//   3) 중단원 끝 '한 장 정리'(summary)와 수능형 문제의 관련 개념·유형을 붙인다
//
// spec = {
//   concepts: [{ at, title, stars, hits, pattern, unwrap }],
//     at: 개념이 시작하는 블록 — 'item:제목'(소항목), 'sec:B'(큰 묶음), 'table:제목', 'thinker:이름',
//         'source:제목', 'compare:제목', 'chart:제목', 'map:제목', 'diagram:제목', 'photo:#', '#12'(순서 번호)
//         제목은 앞부분만 적어도 된다(앞에서부터 같은지 본다).
//     stars: 출제 빈도 1~3 (1 기본 개념, 2 빈출: 최근 기출 9회 중 1~2번, 3 최다 빈출: 3번 이상)
//     hits: 근거가 된 기출(보이지는 않음, 확인용)  pattern: [[문장, 'O'|'X', 틀린 이유], …]
//     unwrap: 시작 블록이 소항목(item)이면 그 제목 대신 개념 머리를 쓰고 본문만 남긴다(기본 true)
//   keep: 개념 밖에 남길 큰 묶음 제목(예: '수능 자료 해석 연습') — 글자(A·B) 없이 제목만 남는다.
//         적지 않으면 제목에 '해석 연습'이 들어간 묶음을 남긴다.
//   summary: { core, concepts: [{ no, title?, lines }], traps: [[이것, 저것]], checks: [] }
//   exam: [[개념 번호, 문제 유형], …] — 수능형 문제 순서대로
// }
const two = (n) => String(n).padStart(2, '0');

function matcher(at) {
  if (/^#\d+$/.test(at)) { const k = +at.slice(1); return (b, i) => i === k; }
  const m = at.match(/^(\w+):(.*)$/);
  if (!m) throw new Error(`개념 시작 위치를 알 수 없음: ${at}`);
  const [, t, key] = m;
  return (b) => b.t === t && (t === 'sec' ? b.mark === key : String(b.title ?? b.name ?? '').replace(/\*\*/g, '').startsWith(key));
}

export function applyCC(u, spec) {
  if (!spec) return u;
  const list = u.concept;
  const keepRe = spec.keep ? new RegExp(spec.keep) : /해석 연습/;
  const starts = new Map();
  let last = -1;
  spec.concepts.forEach((c, i) => {
    const f = matcher(c.at);
    const idx = list.findIndex((b, k) => k > last && f(b, k));
    if (idx < 0) throw new Error(`${u.no} 단원: 개념 ${two(i + 1)}의 시작(${c.at})을 찾지 못함`);
    starts.set(idx, { ...c, no: two(i + 1) });
    last = idx;
  });
  const out = [];
  let open = null; // 지금 열려 있는 개념(끝에 '이렇게 나온다'를 넣기 위해)
  const close = () => { if (open?.pattern?.length) out.push({ t: 'pattern', items: open.pattern }); open = null; };
  list.forEach((b, i) => {
    const c = starts.get(i);
    if (c) {
      close();
      out.push({ t: 'concept', no: c.no, title: c.title, stars: c.stars || 1, hits: c.hits, tags: c.tags });
      open = c;
      if (b.t === 'item' && c.unwrap !== false) {
        const body = b.body.map((x) => ({ ...x }));
        if (b.side && body.length) body[body.length - 1].side = b.side;
        out.push(...body);
        return;
      }
      if (b.t === 'sec') return; // 큰 묶음 제목은 개념 머리로 대신
    }
    if (b.t === 'sec') {
      if (keepRe.test(b.title)) { close(); out.push({ ...b, mark: '' }); }
      return; // 나머지 큰 묶음 제목은 뺀다
    }
    // 개념 안의 소항목은 번호 없이(개념 번호 하나로만 나누기)
    if (b.t === 'item' && open) { out.push({ ...b, no: '' }); return; }
    out.push(b);
  });
  close();
  const exam = (u.exam || []).map((q, i) => (spec.exam?.[i] ? { ...q, concept: spec.exam[i][0], type: spec.exam[i][1] } : q));
  const res = { ...u, concept: out, exam, ...(spec.summary ? { summary: spec.summary } : {}) };
  Object.defineProperty(res, '_raw', { value: list, enumerable: false }); // 계획 적용 전 블록(개요 도구용, 저장 안 됨)
  return res;
}

// 책 전체에 적용: book.units 각각에 같은 번호의 계획을 붙인다
export const withCC = (book, specs) => ({ ...book, units: book.units.map((u) => applyCC(u, specs[u.no])) });
