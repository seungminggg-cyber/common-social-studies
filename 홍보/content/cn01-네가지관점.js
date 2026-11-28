// 인스타그램 카드뉴스 01 — 통합사회1 I. 통합적 관점: 네 가지 관점 한 장 정리 (10장)
// 내용 출처: 개념서 MINIMAP 통합사회1 I단원(textbook/content/t1-1.js)을 짧게 다시 씀.
// '학평 1번' 근거: textbook/참고/기출분류.json — 2025.6~2026.9 고1·고2 학력평가 8회 모두 1번이 I단원.
// 디자인: 홍보/디자인_가이드.md (2026-11-28 개편 — 아이콘·상자·이름표 없이 글자 위계와 가는 선으로)
// 말투: '~함/~임' 개조식, 딱딱하면 느낌표.

const N = 10;

const PERSP = [
  {
    no: '01', name: '시간적 관점',
    q: '언제부터, 어떻게 변해 왔을까?',
    rows: [
      ['주목', '현상이 나타난 <b>시대적 배경</b>과 <b>역사적 맥락</b>'],
      ['자료', '사료(유물·유적, 옛 신문 기사, 문서 기록), 과거 통계'],
      ['예시', '우리나라 교복 모양이 시대에 따라 어떻게 달라졌는지 조사함'],
    ],
    clues: ['언제', '변화', '추이', '역사', '시대', '배경', '기원'],
    tip: '과거를 분석해 현재를 이해하고, <b>미래의 변화 방향</b>까지 예측함',
  },
  {
    no: '02', name: '공간적 관점',
    q: '어디에서, 왜 그곳에서 나타날까?',
    rows: [
      ['주목', '위치·장소·분포, 사람·물자·정보가 오가는 <b>공간적 상호 작용</b>'],
      ['자료', '지도, 지역 사진·통계, 지리 정보 시스템(GIS)'],
      ['예시', '봄철 황사가 어디에서 생겨 어떤 경로로 들어오는지 지도로 분석함'],
    ],
    clues: ['어디', '위치', '분포', '지역 차이', '입지', '이동', '교류'],
    tip: '자연환경뿐 아니라 언어·종교·산업 같은 <b>인문환경</b>도 함께 봄',
  },
  {
    no: '03', name: '사회적 관점',
    q: '어떤 구조와 제도가 영향을 주었을까?',
    rows: [
      ['주목', '<b>사회 구조</b>와 <b>사회 제도</b>가 개인의 생각·행동과 사회현상에 미치는 영향'],
      ['자료', '설문 조사, 통계 분석, 면담, 참여 관찰'],
      ['예시', '선거권 나이가 18세로 낮아진 뒤 청소년의 정치 참여가 어떻게 달라졌는지 분석함'],
    ],
    clues: ['제도', '법', '정책', '사회 구조', '정치·경제', '설문'],
    tip: '<b>정치적·경제적 관점</b>도 사회적 관점 안에 들어감!',
  },
  {
    no: '04', name: '윤리적 관점',
    q: '이것은 바람직한가?',
    rows: [
      ['주목', '양심과 도덕적 가치를 기준으로 현상을 <b>평가</b>하고 바람직한 방향을 찾음'],
      ['자료', '여러 시대·지역의 윤리 이론, 도덕적 원칙'],
      ['예시', '자율 주행 자동차가 사고 순간 누구를 보호하도록 설계해야 할지 판단함'],
    ],
    clues: ['바람직한가', '옳은가', '정의', '공정', '책임', '양심'],
    tip: '사실 판단(출생률이 낮아졌다)을 넘어 <b>가치 판단</b>(정책은 공정해야 한다)을 함',
  },
];

// O/X 문장은 시험 선지 모양이라 '~이다'를 그대로 둠
const QUIZ = [
  ['공간적 관점은 사회현상이 과거부터 어떻게 변해 왔는지에 초점을 둔다.', 'X', '변해 온 과정은 <b>시간적 관점</b>. 공간적 관점은 위치·분포·지역에 주목함'],
  ['저출생 문제를 해결하기 위한 육아 지원 제도를 분석하는 것은 사회적 관점의 탐구이다.', 'O', '제도가 미치는 영향을 <b>분석</b>하므로 사회적 관점임'],
  ['정치적·경제적 관점은 사회적 관점과 관계없는 별개의 관점이다.', 'X', '정치적·경제적 관점은 <b>사회적 관점 안에</b> 포함됨'],
];

export default function (H) {
  const { run, head, rows, aside } = H;
  const pages = [];

  // 1. 표지
  pages.push({ name: '표지', html: `<section class="slide dark cover">
    ${run()}
    ${head({ eyebrow: '통합사회1 · 첫 단원', title: '네 가지 관점,<br><span class="acc">한 장</span>으로 끝', display: true,
      sub: '최근 학력평가 8번, 모두 1번 문제로 나온 단원' })}
    <div class="c-list push">${PERSP.map((p) => `<div><span>${p.no}</span>${p.name.replace(' 관점', '')}</div>`).join('')}</div>
    <p class="source c-src">2025.6~2026.9 고1·고2 학력평가 8회 · 승민T 분류</p>
  </section>` });

  // 2. 통합적 관점이란
  pages.push({ name: '통합적관점', html: `<section class="slide s2">
    ${run(2, N)}
    ${head({ eyebrow: '통합적 관점이란', title: '같은 현상도<br><span class="acc">묻는 질문</span>이 다름' })}
    <div class="body">${rows(PERSP.map((p) => [p.no, `<b>${p.name}</b><small>${p.q}</small>`]), { big: true, rl: '96px' })}</div>
    ${aside('정리', '네 관점을 <b>종합</b>해 인간·사회·환경을 균형 있게 보는 것이 통합적 관점. 한 관점만 보면 코끼리 다리만 만지는 셈!', { rl: '96px' })}
  </section>` });

  // 3~6. 관점 하나씩 — 강조는 '핵심 질문' 한 곳
  PERSP.forEach((p, i) => {
    pages.push({ name: p.name.replace(' ', ''), html: `<section class="slide persp">
      ${run(3 + i, N)}
      ${head({ eyebrow: `관점 ${p.no} / 04`, title: p.name })}
      <p class="p-q"><span class="acc">${p.q}</span></p>
      <div class="body">${rows([...p.rows, ['이런 말', `<span class="clues">${p.clues.join('<i>·</i>')}</span>`]])}</div>
      ${aside('한 줄 더', p.tip)}
    </section>` });
  });

  // 7. 같은 소재, 다른 초점
  const aging = [
    ['고령 인구가 해마다 어떻게 늘어 왔을까?', 0],
    ['도시와 농촌의 고령화는 왜 차이가 날까?', 1],
    ['노인 복지·연금 제도는 노인의 삶에 어떤 영향을 줄까?', 2],
    ['노부모 부양은 누구의 책임이어야 할까?', 3],
  ];
  pages.push({ name: '같은소재', html: `<section class="slide">
    ${run(7, N)}
    ${head({ eyebrow: '같은 소재, 다른 초점', title: '소재가 같아도<br><span class="acc">초점</span>이 다르면 다른 관점', sub: '소재 — 고령화' })}
    <div class="body">${rows(aging.map(([t, k]) => [PERSP[k].no, t, PERSP[k].name.replace(' 관점', '')]), { rl: '64px' })}</div>
    ${aside('정리', '다루는 <b>소재</b>가 아니라 <b>초점</b>으로 구분함', { rl: '64px' })}
  </section>` });

  // 8. 헷갈리는 것 — 질문에 바로 답하는 모양
  const traps = [
    ['‘제도’가 보이면 무조건 사회적 관점?', '제도의 효과를 <b>분석</b>하면 사회적, 제도가 옳은지 <b>평가</b>하면 윤리적 관점'],
    ['정치적·경제적 관점은 따로 있는 관점?', '정치·경제는 <b>사회적 관점 안에</b> 들어감'],
    ['한 해의 분포 지도로 변화 추이를 알 수 있다?', '한 해의 분포는 공간적 관점. <b>변화</b>를 보려면 여러 시기의 자료가 필요함(시간적)'],
  ];
  pages.push({ name: '함정', html: `<section class="slide">
    ${run(8, N)}
    ${head({ eyebrow: '헷갈림 주의', title: '자주 헷갈리는 것<br><span class="acc">3가지</span>' })}
    <div class="body">${rows(traps.map(([q, a], i) => [String(i + 1), `${q}<small>${a}</small>`]), { big: true, rl: '64px' })}</div>
  </section>` });

  // 9. 퀴즈
  pages.push({ name: '퀴즈', html: `<section class="slide">
    ${run(9, N)}
    ${head({ eyebrow: '3초 퀴즈', title: 'O일까, <span class="acc">X</span>일까?' })}
    <div class="body qz">${rows(QUIZ.map(([t], i) => [String(i + 1), t, 'O / X']), { big: true, rl: '64px' })}</div>
    ${aside('답', '댓글에 <b>X O X</b>처럼 남겨 주세요. 정답은 다음 장!', { rl: '64px' })}
  </section>` });

  // 10. 정답 + 다음 편
  pages.push({ name: '정답', html: `<section class="slide">
    ${run(10, N)}
    ${head({ eyebrow: '정답', title: '<span class="acc">X · O · X</span>' })}
    <div class="body">${rows(QUIZ.map(([t, v, why]) => [v, `${why}<small>${t}</small>`]), { big: true, rl: '64px' })}</div>
    <div class="next push">
      <div class="eyebrow">다음 편</div>
      <p>행복의 조건 — 아리스토텔레스 vs 에피쿠로스</p>
      <div class="next-s">저장해 두고, 시험 전에 다시 보기!</div>
    </div>
  </section>` });

  const css = `
  /* 표지 */
  .cover .head { margin-top: 160px; }
  .cover .sub { margin-top: 48px; }
  .c-list { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--rule-dark); }
  .c-list div { padding: 28px 0 0; font-size: 42px; font-weight: 700; letter-spacing: -0.04em; }
  .c-list span { display: block; font-size: var(--fs-label); font-weight: 600; color: var(--on-dark-3); margin-bottom: 10px; letter-spacing: 0; }
  .c-src { margin-top: 48px; color: var(--on-dark-3); }

  .s2 .body { margin-top: 48px; }
  .s2 .row { padding: 18px 0 20px; }

  /* 관점 */
  .persp .title { font-size: 104px; line-height: 1.1; }
  .p-q { margin-top: 32px; font-size: var(--fs-big); font-weight: 700; letter-spacing: -0.045em; line-height: 1.3; }
  .clues { font-weight: 700; }
  .clues i { font-style: normal; color: var(--gray); font-weight: 400; margin: 0 14px; }

  /* 퀴즈 */
  .qz .row > .end { font-size: var(--fs-small); color: var(--gray); font-weight: 600; letter-spacing: 0.04em; padding-left: 24px; }
  .qz .row > .v { font-weight: 600; }

  /* 정답 마지막 칸 */
  .next { border-top: 2px solid var(--ink); padding-top: var(--sp-2); }
  .next p { font-size: var(--fs-lead); font-weight: 700; margin-top: 12px; letter-spacing: -0.035em; }
  .next-s { font-size: var(--fs-small); color: var(--ink-2); margin-top: 10px; }
  `;

  const caption = `
통합사회 첫 단원, 네 가지 관점 한 장 정리

시간적·공간적·사회적·윤리적 관점, 문제에서는 어떻게 가를까?
최근 학력평가 8번, 모두 1번 문제로 나온 단원임 (2025.6~2026.9 고1·고2)

- 관점마다 '핵심 질문' 하나만 기억하기
- 같은 소재라도 초점으로 구분하기
- 마지막 장 O/X 퀴즈, 댓글로 답 남기기 (예: X O X)

저장해 두고 시험 전에 꺼내 보기!

#통합사회 #통합사회1 #고1통합사회 #통합적관점 #2028수능
`;

  return { pages, css, texts: { '캡션.txt': caption } };
}
