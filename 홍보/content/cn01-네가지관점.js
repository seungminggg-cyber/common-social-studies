// 인스타그램 카드뉴스 01 — 통합사회1 Ⅰ. 통합적 관점: 네 가지 관점 한 장 정리 (10장)
// 내용 출처: 개념서 MINIMAP 통합사회1 Ⅰ단원(textbook/content/t1-1.js)을 짧게 다시 씀.
// '학평 1번' 근거: textbook/참고/기출분류.json — 2025.6~2026.9 고1·고2 학력평가 8회 모두 1번이 Ⅰ단원.

const N = 10;

const PERSP = [
  {
    no: '01', name: '시간적 관점', icon: 'hourglass',
    q: '언제부터, 어떻게<br>변해 왔을까?',
    rows: [
      ['주목', '현상이 나타난 <b>시대적 배경</b>과 <b>역사적 맥락</b>'],
      ['자료', '사료(유물·유적, 옛 신문 기사, 문서 기록), 과거 통계'],
      ['예시', '우리나라 교복 모양이 시대에 따라 어떻게 달라졌는지 조사한다.'],
    ],
    clues: ['언제', '변화', '추이', '역사', '시대', '배경', '기원'],
    tip: '과거를 분석해 현재를 이해하고, <b>미래의 변화 방향</b>까지 예측한다.',
  },
  {
    no: '02', name: '공간적 관점', icon: 'map-pin',
    q: '어디에서, 왜<br>그곳에서 나타날까?',
    rows: [
      ['주목', '위치·장소·분포, 사람·물자·정보가 오가는 <b>공간적 상호 작용</b>'],
      ['자료', '지도, 지역 사진·통계, 지리 정보 시스템(GIS)'],
      ['예시', '봄철 황사가 어디에서 생겨 어떤 경로로 들어오는지 지도로 분석한다.'],
    ],
    clues: ['어디', '위치', '분포', '지역 차이', '입지', '이동', '교류'],
    tip: '자연환경뿐 아니라 언어·종교·산업 같은 <b>인문환경</b>도 함께 본다.',
  },
  {
    no: '03', name: '사회적 관점', icon: 'building-community',
    q: '어떤 구조와 제도가<br>영향을 주었을까?',
    rows: [
      ['주목', '<b>사회 구조</b>와 <b>사회 제도</b>가 개인의 생각·행동과 사회현상에 미치는 영향'],
      ['자료', '설문 조사, 통계 분석, 면담, 참여 관찰'],
      ['예시', '선거권 나이가 18세로 낮아진 뒤 청소년의 정치 참여가 어떻게 달라졌는지 분석한다.'],
    ],
    clues: ['제도', '법', '정책', '사회 구조', '정치·경제', '설문'],
    tip: '<b>정치적·경제적 관점</b>도 사회적 관점 안에 들어간다.',
  },
  {
    no: '04', name: '윤리적 관점', icon: 'scale',
    q: '이것은<br>바람직한가?',
    rows: [
      ['주목', '양심과 도덕적 가치를 기준으로 현상을 <b>평가</b>하고 바람직한 방향을 찾는다'],
      ['자료', '여러 시대·지역의 윤리 이론, 도덕적 원칙'],
      ['예시', '자율 주행 자동차가 사고 순간 누구를 보호하도록 설계해야 할지 판단한다.'],
    ],
    clues: ['바람직한가', '옳은가', '정의', '공정', '책임', '양심'],
    tip: '사실 판단(출생률이 낮아졌다)을 넘어 <b>가치 판단</b>(정책은 공정해야 한다)을 한다.',
  },
];

const QUIZ = [
  ['공간적 관점은 사회현상이 과거부터 어떻게 변해 왔는지에 초점을 둔다.', 'X', '변해 온 과정은 <b>시간적</b> 관점. 공간적 관점은 위치·분포·지역에 주목한다.'],
  ['저출생 문제를 해결하기 위한 육아 지원 제도를 분석하는 것은 사회적 관점의 탐구이다.', 'O', '제도가 미치는 영향을 <b>분석</b>하므로 사회적 관점이다.'],
  ['정치적·경제적 관점은 사회적 관점과 관계없는 별개의 관점이다.', 'X', '정치적·경제적 관점은 <b>사회적 관점 안에</b> 포함된다.'],
];

export default function (H) {
  const { icon, top, foot } = H;
  const crumb = '통합사회1 · 통합적 관점'; // 로마 숫자(Ⅰ)는 Pretendard에 없어 쓰지 않음
  const mark = (v, size = 64) => v === 'O'
    ? `<span class="mk o" style="width:${size}px;height:${size}px">${icon('circle', { size: size * 0.78, stroke: 3.2 })}</span>`
    : `<span class="mk x" style="width:${size}px;height:${size}px">${icon('x', { size: size * 0.82, stroke: 3.4 })}</span>`;

  const pages = [];

  // 1. 표지
  pages.push({ name: '표지', html: `<section class="slide dark cover">
    ${top(crumb)}
    <div class="kicker c-k"><i class="sq"></i>통합사회 첫 단원</div>
    <h1 class="c-h">네 가지 관점,<br><span class="hl-d">한 장</span>으로 끝</h1>
    <p class="lead c-l">시간적 · 공간적 · 사회적 · 윤리적 관점<br>헷갈리지 않게 구별하는 법</p>
    <div class="quad">${PERSP.map((p) => `<div class="qd cut">${icon(p.icon, { size: 78, stroke: 1.6 })}<span>${p.name.replace(' 관점', '')}</span></div>`).join('')}</div>
    <div class="badge cut"><b>최근 학력평가 8번 모두 1번 문제</b><span>2025.6~2026.9 고1·고2 학력평가</span></div>
    ${foot(1, N, '저장하고 넘겨 보기')}
  </section>` });

  // 2. 통합적 관점이란
  pages.push({ name: '통합적관점', html: `<section class="slide">
    ${top(crumb)}
    <div class="kicker s-k">통합적 관점이란?</div>
    <h2 class="h">같은 현상이라도<br><span class="m">묻는 질문</span>이 다르다</h2>
    <p class="lead s-l">네 관점을 <b>종합</b>해 인간·사회·환경을 균형 있게 보는 것</p>
    <div class="hub">
      ${PERSP.map((p) => `<div class="hc"><div class="hi cut">${icon(p.icon, { size: 44, stroke: 1.9 })}</div><div class="hn">${p.name}</div><div class="hq">${p.q.replace('<br>', ' ')}</div></div>`).join('')}
      <div class="hcenter">사회<br>현상</div>
    </div>
    <div class="note cut">${icon('alert-triangle', { size: 34, stroke: 2 })}<p>한 관점만 보면 놓친다. 코끼리 다리만 만지고 코끼리를 안다고 하는 셈(군맹무상)!</p></div>
    ${foot(2, N)}
  </section>` });

  // 3~6. 관점 하나씩
  PERSP.forEach((p, i) => {
    pages.push({ name: p.name.replace(' ', ''), html: `<section class="slide persp">
      ${top(crumb)}
      <div class="p-head"><div class="p-no cut">${p.no}</div><h2 class="p-t">${p.name}</h2><div class="p-ic">${icon(p.icon, { size: 132, stroke: 1.3 })}</div></div>
      <div class="p-q cut">${icon('quote', { size: 46, stroke: 2.2 })}<p>${p.q}</p></div>
      <div class="p-rows">${p.rows.map(([k, v]) => `<div class="p-row"><div class="p-k">${k}</div><div class="p-v">${v}</div></div>`).join('')}</div>
      <div class="p-clue"><div class="p-cl">문장에 이런 말이 보이면 → <b>${p.name}</b></div><div class="chips">${p.clues.map((c) => `<span class="chip cut">${c}</span>`).join('')}</div></div>
      <div class="p-tip">${icon('bulb', { size: 34, stroke: 2 })}<p>${p.tip}</p></div>
      ${foot(3 + i, N)}
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
    ${top(crumb)}
    <div class="kicker s-k">같은 소재, 다른 초점</div>
    <h2 class="h">소재가 같아도<br><span class="m">초점</span>이 다르면 다른 관점</h2>
    <div class="topic"><span class="tag cut">소재 · 고령화</span></div>
    <div class="ag">${aging.map(([t, k]) => `<div class="ag-r"><p>${t}</p><span class="ag-t cut">${icon(PERSP[k].icon, { size: 32, stroke: 2 })}${PERSP[k].name.replace(' 관점', '')}</span></div>`).join('')}</div>
    <div class="note mint cut">${icon('bulb', { size: 34, stroke: 2 })}<p><b>무엇을 다루나</b>가 아니라 <b>무엇에 초점을 두나</b>로 가른다.</p></div>
    ${foot(7, N)}
  </section>` });

  // 8. 함정
  const traps = [
    ['‘제도’라는 말이 보이면 무조건 사회적 관점이다', '제도의 효과를 <b>분석</b>하면 사회적, 제도가 옳은지 <b>평가</b>하면 윤리적 관점'],
    ['정치적·경제적 관점은 따로 있는 관점이다', '정치·경제는 <b>사회적 관점 안에</b> 들어간다'],
    ['한 해의 분포 지도만으로 변화 추이를 알 수 있다', '한 해의 분포는 공간적. <b>변화</b>를 보려면 여러 시기의 자료가 필요하다(시간적)'],
  ];
  pages.push({ name: '함정', html: `<section class="slide">
    ${top(crumb)}
    <div class="kicker s-k">헷갈림 주의</div>
    <h2 class="h">헷갈리기 쉬운<br>함정 <span class="m">3가지</span></h2>
    <div class="traps">${traps.map(([w, r], i) => `<div class="tr cut"><div class="tr-n">${i + 1}</div><div class="tr-b"><div class="tr-w">${mark('X', 44)}<p><span class="tr-l">이렇게 생각하면 틀린다</span>${w}</p></div><div class="tr-r">${icon('arrow-right', { size: 34, stroke: 2.6 })}<p>${r}</p></div></div></div>`).join('')}</div>
    ${foot(8, N)}
  </section>` });

  // 9. 퀴즈
  pages.push({ name: '퀴즈', html: `<section class="slide">
    ${top(crumb)}
    <div class="kicker s-k">3초 퀴즈</div>
    <h2 class="h">O일까, <span class="m">X</span>일까?</h2>
    <div class="qz">${QUIZ.map(([t], i) => `<div class="qz-r cut"><div class="qz-n">${i + 1}</div><p>${t}</p><div class="qz-ox"><span>O</span><span>X</span></div></div>`).join('')}</div>
    <div class="note cut">${icon('message-circle', { size: 34, stroke: 2 })}<p>댓글에 <b>X O X</b>처럼 답을 남겨 보세요. 정답은 다음 장!</p></div>
    ${foot(9, N, '정답 보기')}
  </section>` });

  // 10. 정답 + 다음 편
  pages.push({ name: '정답', html: `<section class="slide">
    ${top(crumb)}
    <div class="kicker s-k">정답</div>
    <h2 class="h a-h">X · O · X</h2>
    <div class="ans">${QUIZ.map(([t, v, why], i) => `<div class="an-r">${mark(v, 70)}<div><div class="an-q">${i + 1}. ${t}</div><div class="an-w">${why}</div></div></div>`).join('')}</div>
    <div class="cta cut">
      <div class="cta-h">도움이 됐다면</div>
      <div class="cta-i"><span>${icon('bookmark', { size: 40, stroke: 2 })}저장</span><span>${icon('send', { size: 40, stroke: 2 })}친구에게 보내기</span><span>${icon('user-plus', { size: 40, stroke: 2 })}팔로우</span></div>
      <div class="cta-n"><b>다음 편</b> 통합사회1 · 행복의 조건 — 아리스토텔레스 vs 에피쿠로스</div>
    </div>
    ${foot(10, N, '')}
  </section>` });

  const css = `
  /* 표지 */
  .cover .c-k { margin-top: 96px; }
  .sq { width: 18px; height: 18px; background: var(--mint); display: inline-block; clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%); }
  .c-h { font-size: 120px; font-weight: 900; line-height: 1.1; letter-spacing: -0.055em; margin-top: 26px; }
  .hl-d { color: var(--navy); background: var(--mint); padding: 0 14px 4px; margin: 0 4px 0 -4px; }
  .c-l { margin-top: 36px; font-size: 38px; }
  .quad { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 74px; }
  .qd { height: 212px; background: var(--navy-2); border-top: 4px solid var(--mint); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; color: var(--mint); --cut: 22px; }
  .qd span { color: #fff; font-size: 34px; font-weight: 800; letter-spacing: -0.03em; }
  .badge { position: absolute; left: 84px; right: 84px; bottom: 128px; background: var(--mint); color: var(--navy); padding: 26px 36px; display: flex; justify-content: space-between; align-items: center; --cut: 22px; }
  .badge b { font-size: 36px; font-weight: 850; letter-spacing: -0.03em; }
  .badge span { font-size: 22px; font-weight: 650; opacity: .75; }

  /* 공통 머리 */
  .s-k { margin-top: 64px; }
  .slide .h { margin-top: 18px; }
  .s-l { margin-top: 22px; font-size: 32px; }

  /* 2. 허브 */
  .hub { position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 48px; }
  .hc { background: #fff; border: 2px solid var(--rule); padding: 34px 34px 30px; height: 268px; display: flex; flex-direction: column; }
  .hc:nth-child(2), .hc:nth-child(4) { padding-left: 92px; }
  .hc:nth-child(1), .hc:nth-child(3) { padding-right: 92px; }
  .hi { width: 72px; height: 72px; background: var(--mint-soft); color: var(--mint-ink); display: flex; align-items: center; justify-content: center; --cut: 14px; }
  .hn { font-size: 38px; font-weight: 850; letter-spacing: -0.04em; margin-top: 20px; }
  .hq { font-size: 30px; line-height: 1.45; color: var(--ink-2); margin-top: 10px; font-weight: 550; }
  .hcenter { position: absolute; left: 50%; top: 50%; width: 176px; height: 176px; margin: -88px 0 0 -88px; border-radius: 50%; background: var(--navy); color: #fff;
    display: flex; align-items: center; justify-content: center; text-align: center; font-size: 36px; font-weight: 850; line-height: 1.2; letter-spacing: -0.03em; border: 10px solid var(--paper); }
  .note { margin-top: auto; display: flex; align-items: center; gap: 20px; background: #fff; border-left: 8px solid var(--coral); padding: 26px 32px; color: var(--ink-2); --cut: 16px; }
  .note .ic { color: var(--coral); }
  .note p { font-size: 29px; line-height: 1.45; font-weight: 600; }
  .note.mint { border-left-color: var(--mint-2); background: var(--mint-pale); }
  .note.mint .ic { color: var(--mint-ink); }
  .slide .note { margin-bottom: 0; }

  /* 3~6. 관점 */
  .p-head { display: flex; align-items: center; gap: 30px; margin-top: 58px; }
  .p-no { width: 108px; height: 108px; background: var(--navy); color: var(--mint); font-size: 48px; font-weight: 850; display: flex; align-items: center; justify-content: center; letter-spacing: -0.03em; --cut: 22px; }
  .p-t { font-size: 90px; font-weight: 900; letter-spacing: -0.055em; line-height: 1; }
  .p-ic { margin-left: auto; color: var(--mint-2); opacity: .9; }
  .p-q { margin-top: 40px; background: var(--navy); color: #fff; padding: 40px 48px 44px; display: flex; gap: 26px; align-items: flex-start; --cut: 26px; }
  .p-q .ic { color: var(--mint); margin-top: 4px; }
  .p-q p { font-size: 54px; font-weight: 850; line-height: 1.26; letter-spacing: -0.045em; }
  .p-rows { margin-top: 30px; }
  .p-row { display: grid; grid-template-columns: 108px 1fr; gap: 20px; padding: 22px 0; border-bottom: 2px solid var(--rule); }
  .p-row:first-child { border-top: 2px solid var(--ink); }
  .p-k { font-size: 28px; font-weight: 800; color: var(--mint-ink); padding-top: 5px; }
  .p-v { font-size: 33px; line-height: 1.46; color: var(--ink); font-weight: 520; letter-spacing: -0.025em; }
  .p-clue { margin-top: 30px; }
  .p-cl { font-size: 26px; color: var(--gray); font-weight: 650; }
  .p-cl b { color: var(--ink); }
  .chips { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
  .p-tip { margin-top: auto; display: flex; align-items: center; gap: 18px; background: var(--mint-soft); color: var(--ink); padding: 22px 30px; }
  .p-tip .ic { color: var(--mint-ink); }
  .p-tip p { font-size: 28px; line-height: 1.45; font-weight: 600; }

  /* 7. 같은 소재 */
  .topic { margin-top: 40px; }
  .topic .tag { font-size: 30px; padding: 12px 26px 13px; }
  .ag { margin-top: 26px; display: flex; flex-direction: column; gap: 18px; }
  .ag-r { background: #fff; border: 2px solid var(--rule); height: 140px; padding: 0 30px 0 38px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
  .ag-r p { font-size: 34px; font-weight: 650; line-height: 1.38; letter-spacing: -0.03em; }
  .ag-t { flex: none; display: inline-flex; align-items: center; gap: 10px; background: var(--mint-soft); color: var(--mint-ink); font-size: 30px; font-weight: 850; padding: 14px 22px 14px 18px; --cut: 12px; letter-spacing: -0.03em; }
  .slide .ag ~ .note { margin-top: auto; }

  /* 8. 함정 */
  .traps { margin-top: 40px; display: flex; flex-direction: column; gap: 18px; }
  .tr { background: #fff; border: 2px solid var(--rule); display: grid; grid-template-columns: 76px 1fr; --cut: 22px; }
  .tr-n { background: var(--navy); color: var(--mint); font-size: 40px; font-weight: 850; display: flex; align-items: center; justify-content: center; }
  .tr-b { padding: 22px 32px 24px; }
  .tr-w { display: flex; gap: 16px; align-items: flex-start; }
  .tr-w p { font-size: 30px; line-height: 1.42; color: var(--gray); font-weight: 600; letter-spacing: -0.03em; }
  .tr-l { display: block; font-size: 22px; color: var(--coral); font-weight: 750; margin-bottom: 2px; }
  .tr-r { display: flex; gap: 16px; align-items: flex-start; margin-top: 14px; padding-top: 14px; border-top: 2px dashed var(--rule); }
  .tr-r .ic { color: var(--mint-ink); margin: 3px 5px 0; }
  .tr-r p { font-size: 31px; line-height: 1.42; font-weight: 600; letter-spacing: -0.03em; }
  .mk { flex: none; display: inline-flex; align-items: center; justify-content: center; }
  .mk.o { color: var(--mint-2); }
  .mk.x { color: var(--coral); }

  /* 9. 퀴즈 */
  .qz { margin-top: 48px; display: flex; flex-direction: column; gap: 22px; }
  .qz-r { background: #fff; border: 2px solid var(--rule); padding: 32px 30px 32px 0; display: grid; grid-template-columns: 96px 1fr 150px; align-items: center; --cut: 22px; min-height: 196px; }
  .qz-n { font-size: 56px; font-weight: 900; color: var(--mint-2); text-align: center; }
  .qz-r p { font-size: 34px; line-height: 1.45; font-weight: 600; letter-spacing: -0.03em; }
  .qz-ox { display: flex; gap: 12px; justify-content: flex-end; }
  .qz-ox span { width: 62px; height: 62px; border: 3px solid var(--rule-2); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 850; color: var(--gray); }
  .qz ~ .note { border-left-color: var(--mint-2); background: var(--mint-pale); }
  .qz ~ .note .ic { color: var(--mint-ink); }

  /* 10. 정답 */
  .a-h { letter-spacing: 0.02em; }
  .ans { margin-top: 34px; display: flex; flex-direction: column; }
  .an-r { display: grid; grid-template-columns: 70px 1fr; gap: 28px; padding: 24px 0; border-bottom: 2px solid var(--rule); }
  .an-r:first-child { border-top: 2px solid var(--ink); }
  .an-q { font-size: 26px; color: var(--gray); line-height: 1.45; font-weight: 550; }
  .an-w { font-size: 32px; line-height: 1.42; font-weight: 650; margin-top: 8px; letter-spacing: -0.03em; }
  .cta { margin-top: auto; background: var(--navy); color: #fff; padding: 36px 44px 38px; --cut: 26px; }
  .cta-h { font-size: 28px; color: var(--mint); font-weight: 800; }
  .cta-i { display: flex; gap: 42px; margin-top: 18px; }
  .cta-i span { display: inline-flex; align-items: center; gap: 12px; font-size: 36px; font-weight: 800; letter-spacing: -0.03em; }
  .cta-i .ic { color: var(--mint); }
  .cta-n { margin-top: 26px; padding-top: 22px; border-top: 2px solid var(--navy-line); font-size: 27px; color: #c9d1ee; font-weight: 550; }
  .cta-n b { color: #fff; margin-right: 10px; }
  `;

  const caption = `
통합사회 첫 단원, 네 가지 관점 한 장 정리

시간적·공간적·사회적·윤리적 관점, 문제에서는 어떻게 가를까?
최근 학력평가 8번 모두 1번 문제로 나온 단원이에요. (2025.6~2026.9 고1·고2)

✔ 관점마다 '핵심 질문' 하나만 기억하기
✔ 같은 소재라도 무엇에 초점을 두는지로 가르기
✔ 마지막 장 O/X 퀴즈, 댓글로 답 남겨 보기 (예: X O X)

저장해 두고 시험 전에 꺼내 보세요.

#통합사회 #통합사회1 #고1통합사회 #통합적관점 #2028수능
`;

  return { pages, css, texts: { '캡션.txt': caption } };
}
