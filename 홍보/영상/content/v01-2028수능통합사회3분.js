// 유튜브 긴 영상 01 — 2028 수능 통합사회, 3분 정리 (예비 고1·학부모 대상, 가로 1920×1080)
// 블로그 blog01과 같은 내용(원소스 멀티유즈). 사실·숫자 근거는 홍보/content/blog01-고1통합사회수능.js 맨 위 주석:
//   - 2028학년도 수능 사회·과학탐구 과목당 25문항·40분, 탐구 응시자는 통합사회·통합과학 모두 응시: 교육부·평가원 2025-01-20 발표
//   - 2028학년도 수능 2027-11-18 시행 예정 / 2027년 6월 첫 평가원 모의평가
//   - 예시문항 분류 숫자(13·6·4, 통합사회1 9 · 통합사회2 16): 승민T 분류(기출변형/특강)
// 선행교육규제법 제8조④: '선행·미리·앞서' 같은 말을 쓰지 않는다. 학원 모집 광고가 아니다.
//
// 원고 쓰는 법
//   lines: [{ t: '자막 겸 원고. | 로 자막을 나눔. **굵게**는 민트색', say: '읽는 문장이 다를 때만' }]
//   html 안의 움직임: data-a="up@L2" (두 번째 문장 시작에 올라오며 나타남), data-a="pop@w:25문항" (그 단어를 말할 때)
//   숫자 올라가기: <b data-count="25" data-from="20" data-at="w:25문항">20</b>

const SUBJ = ['생활과 윤리', '윤리와 사상', '한국지리', '세계지리', '동아시아사', '세계사', '경제', '정치와 법', '사회·문화'];
const U1 = [['I', '통합적 관점', 'u1'], ['II', '인간, 사회, 환경과 행복', 'u2'], ['III', '자연환경과 인간', 'u3'], ['IV', '문화와 다양성', 'u4'], ['V', '생활공간과 사회', 'u5']];
const U2 = [['I', '인권 보장과 헌법', 'u1'], ['II', '사회 정의와 불평등', 'u2'], ['III', '시장경제와 지속가능발전', 'u3'], ['IV', '세계화와 평화', 'u4'], ['V', '미래와 지속가능한 삶', 'u5']];

export default function (H) {
  const { icon } = H;
  const cells = (n, on, cls, cue) => Array.from({ length: 25 }, (_, i) => `<i>${i < n ? `<b class="${cls}" data-a="pop@${cue}+${(i * 0.045).toFixed(3)}/0.4"></b>` : ''}</i>`).join('');

  const scenes = [
    // ── 1. 여는 장면 ──
    { id: 'open', cls: 'dark', chapter: '시작',
      lines: [
        { t: '2028학년도 수능부터 | 사회탐구가 크게 바뀝니다.' },
        { t: '고1 때 배우는 통합사회가 | 이제 **수능 과목**이 됩니다.' },
        { t: '무엇이 달라지는지 | 3분 만에 정리해 드리겠습니다.' },
      ],
      html: `${H.top('', '2028 대입 개편')}
        <div class="o-year" data-a="in@s/1.2">2028</div>
        <div class="o-k" data-a="up@s+0.2">예비 고1 · 학부모님께</div>
        <h1 class="o-h"><span data-a="up@L1+0.2">2028 수능</span><br><span data-a="up@L2">고1 통합사회,</span><br><span data-a="up@L2+0.25">이제 <span class="mk" data-a="hl@w2:수능/0.7">수능 과목</span></span></h1>
        <div class="o-pill" data-a="pop@L3">${icon('clock', { size: 44, stroke: 2 })}<b>3분 정리</b></div>`,
    },
    // ── 2. 결론 세 가지 ──
    { id: 'three', chapter: '결론 세 가지',
      lines: [
        { t: '결론부터 말씀드리면 세 가지입니다.' },
        { t: '첫째, 고1 때 배우는 통합사회1·2가 | 그대로 수능 범위입니다.', say: '첫째, 고1 때 배우는 통합사회 1, 2가 그대로 수능 범위입니다.' },
        { t: '둘째, 탐구 영역을 보는 학생은 | 문과·이과 상관없이 모두 통합사회를 봅니다.', say: '둘째, 탐구 영역을 보는 학생은 문과, 이과 상관없이 모두 통합사회를 봅니다.' },
        { t: '셋째, 처음 보는 자료를 읽고 | 푸는 문제가 많습니다.' },
      ],
      html: `${H.top('01', '결론 세 가지')}
        <h2 class="h2" data-a="up@s+0.1">결론부터, <span class="m">세 가지</span></h2>
        <div class="t3">
          ${[['01', 'books', '고1 과목 = 수능 범위', '통합사회1 · 2 전체'], ['02', 'users-group', '문·이과 모두 응시', '탐구 응시자 전원'], ['03', 'chart-histogram', '자료 읽는 문제', '지도 · 그래프 · 표 · 사료']]
          .map(([n, ic, t, s], i) => `<div class="t3c cut" data-a="up@L${i + 2}; on@L${i + 2}/0.4${i < 2 ? `; off@L${i + 3}/0.4` : ''}">
            <div class="t3n">${n}</div><div class="t3i">${icon(ic, { size: 64, stroke: 1.7 })}</div><div class="t3t">${t}</div><div class="t3s">${s}</div></div>`).join('')}
        </div>`,
    },
    // ── 3. 무엇이 달라지나 ──
    { id: 'change', chapter: '무엇이 달라지나',
      lines: [
        { t: '지금까지 사회탐구는 | 아홉 과목 가운데 골라서 보는 시험이었습니다.' },
        { t: '과목당 20문항을 30분 동안 풀었습니다.', say: '과목당 스무 문항을 30분 동안 풀었습니다.' },
        { t: '2028학년도 수능부터는 | 선택과목이 없어집니다.' },
        { t: '사회탐구는 통합사회, 과학탐구는 통합과학. | 탐구를 보면 두 과목을 모두 봅니다.' },
        { t: '문항 수는 **25문항**, | 시험 시간은 **40분**으로 늘어납니다.', say: '문항 수는 스물다섯 문항, 시험 시간은 40분으로 늘어납니다.' },
      ],
      html: `${H.top('02', '무엇이 달라지나')}
        <div class="ch">
          <div class="ch-l" data-a="in@s; dim@L3+0.2/0.6">
            <div class="ch-cap">2027학년도 수능까지</div>
            <div class="ch-g">${SUBJ.map((s, i) => `<span class="ch-s cut" data-a="pop@L1+${(0.15 + i * 0.09).toFixed(2)}/0.45">${s}</span>`).join('')}</div>
            <div class="ch-pick" data-a="up@w1:골라서">${icon('hand-click', { size: 34, stroke: 2 })} 9과목 중 골라서 응시</div>
            <div class="ch-n" data-a="up@L2"><b>20</b>문항 · <b>30</b>분</div>
          </div>
          <svg class="ch-arr" viewBox="0 0 120 40" data-a="in@L3"><path class="draw" style="--len:130" data-a="draw@L3/0.7" d="M4 20 H104 M90 6 L106 20 L90 34" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div class="ch-r">
            <div class="ch-cap new" data-a="up@L3">2028학년도 수능부터</div>
            <div class="ch-two">
              <div class="ch-b cut soc" data-a="pop@w4:통합사회/0.6"><small>사회탐구</small>통합사회</div>
              <div class="ch-plus" data-a="pop@w4:통합과학/0.5">+</div>
              <div class="ch-b cut sci" data-a="pop@w4:통합과학/0.6"><small>과학탐구</small>통합과학</div>
            </div>
            <div class="ch-both" data-a="up@w4:모두/0.5">${icon('circle-check', { size: 34, stroke: 2.2 })} 탐구 응시자는 두 과목 모두</div>
            <div class="ch-stats" data-a="up@L5">
              <div><b data-count="25" data-from="20" data-at="w5:스물다섯" data-dur="1">20</b><span>문항</span></div>
              <div><b data-count="40" data-from="30" data-at="w5:40분" data-dur="1">30</b><span>분</span></div>
            </div>
          </div>
        </div>`,
    },
    // ── 4. 누가 언제 ──
    { id: 'when', chapter: '누가, 언제 보나',
      lines: [
        { t: '이 시험을 처음 보는 학생은 지금의 고2입니다. | 2027년 11월 18일에 치를 예정입니다.', say: '이 시험을 처음 보는 학생은 지금의 고2입니다. 2027년 11월 18일에 치를 예정입니다.' },
        { t: '지금 고1이 두 번째, | 지금 중학교 3학년인 예비 고1이 세 번째입니다.' },
        { t: '2027년 6월에는 | 첫 평가원 모의평가도 열립니다.' },
        { t: '예비 고1은 선배들이 치르는 실제 시험을 보면서 | 준비할 수 있습니다.' },
      ],
      html: `${H.top('03', '누가, 언제 보나')}
        <h2 class="h2" data-a="up@s+0.1">통합사회 수능, <span class="m">학년별 시험 시기</span></h2>
        <div class="tl">
          <div class="tl-line grow-l" data-a="grow-x@s+0.3/1.4"></div>
          <div class="tl-yr" style="left:0%" data-a="in@s+0.4">2027</div><div class="tl-yr" style="left:40%" data-a="in@s+0.7">2028</div><div class="tl-yr" style="left:71%" data-a="in@s+1">2029</div>
          <div class="tl-p mock" style="left:9%" data-a="pop@L3">
            <i></i><div class="tl-card up"><b>2027년 6월</b><span>첫 평가원 모의평가</span></div></div>
          <div class="tl-p" style="left:30%" data-a="pop@w1:고2">
            <i></i><div class="tl-card"><em>지금 고2</em><b>2028학년도 수능</b><span>2027년 11월 18일 (예정)</span><u>첫 번째</u></div></div>
          <div class="tl-p" style="left:57%" data-a="pop@w2:고1">
            <i></i><div class="tl-card"><em>지금 고1</em><b>2029학년도 수능</b><span>2028년 11월</span><u>두 번째</u></div></div>
          <div class="tl-p me" style="left:86%" data-a="pop@w2:예비">
            <i></i><div class="tl-card"><em>지금 중3 · 예비 고1</em><b>2030학년도 수능</b><span>2029년 11월</span><u>세 번째</u></div></div>
          <div class="tl-br grow-l" data-a="grow-x@L4/0.8"></div>
          <div class="tl-note" data-a="up@L4+0.3">${icon('eye', { size: 32, stroke: 2 })} 선배들이 치르는 실제 시험을 보며 준비</div>
        </div>`,
    },
    // ── 5. 고1이 곧 수능 공부 ──
    { id: 'grade', chapter: '고1 내신 = 수능 공부',
      lines: [
        { t: '통합사회1·2는 고1 공통과목입니다. | 보통 1학기에 통합사회1, | 2학기에 통합사회2를 배웁니다.', say: '통합사회 1, 2는 고1 공통과목입니다. 보통 1학기에 통합사회 1, 2학기에 통합사회 2를 배웁니다.' },
        { t: '2학년과 3학년에는 | 학교에서 선택과목을 배웁니다.' },
        { t: '그래서 고3이 되어 통합사회를 | 처음부터 다시 배우기는 어렵습니다.' },
        { t: '고1 때 만든 개념 정리가 | 고3 수능까지 그대로 이어집니다.' },
      ],
      html: `${H.top('04', '고1 내신 = 수능 공부')}
        <h2 class="h2" data-a="up@s+0.1">고1 때 배운 것이 <span class="m">고3 수능까지</span></h2>
        <div class="yr">
          <div class="yr-c g1 cut" data-a="up@L1"><div class="yr-h">고1</div>
            <div class="yr-sem"><div data-a="wipe@w1:1학기/0.6"><small>1학기</small>통합사회1</div><div data-a="wipe@w1:2학기/0.6"><small>2학기</small>통합사회2</div></div></div>
          <div class="yr-c g2" data-a="up@L2"><div class="yr-h">고2</div><div class="yr-x">선택과목</div></div>
          <div class="yr-c g3" data-a="up@L2+0.2"><div class="yr-h">고3</div><div class="yr-x">선택과목</div></div>
          <div class="yr-flag cut" data-a="pop@L2+0.5">${icon('flag', { size: 40, stroke: 2 })}<b>수능</b><small>통합사회</small></div>
          <svg class="yr-arc" viewBox="0 0 1500 150" preserveAspectRatio="none"><path class="draw" style="--len:1700" data-a="draw@L4/1.3" d="M120 140 C 450 -20, 1050 -20, 1380 120" fill="none" stroke="var(--mint-2)" stroke-width="6" stroke-dasharray="1700" stroke-linecap="round"/></svg>
          <div class="yr-lbl" data-a="pop@L4+0.6">그대로 이어짐</div>
          <div class="yr-no" data-a="up@L3">${icon('rotate', { size: 30, stroke: 2 })} 고3에 학교에서 다시 배우기 어려움</div>
        </div>`,
    },
    // ── 6. 10개 단원 ──
    { id: 'units', chapter: '어떤 과목인가',
      lines: [
        { t: '통합사회는 윤리, 지리, 일반사회, 역사가 | 한 과목 안에 섞여 있습니다.' },
        { t: '통합사회1과 2에 다섯 단원씩, | 모두 열 단원입니다.', say: '통합사회 1과 2에 다섯 단원씩, 모두 열 단원입니다.' },
      ],
      html: `${H.top('05', '어떤 과목인가')}
        <h2 class="h2" data-a="up@s+0.1">한 과목 안에 <span class="m">네 분야</span></h2>
        <div class="fd">${[['윤리', 'scale'], ['지리', 'map-2'], ['일반사회', 'building-bank'], ['역사', 'history']].map(([t, ic]) => `<span class="cut" data-a="pop@w1:${t}/0.5">${icon(ic, { size: 36, stroke: 2 })}${t}</span>`).join('')}</div>
        <div class="un">${[['통합사회1', U1], ['통합사회2', U2]].map(([h, rows], c) => `<div class="un-c"><div class="un-h" data-a="up@L2${c ? '+0.5' : ''}">${h}</div>
          ${rows.map(([n, t, col], i) => `<div class="un-r" data-a="left@L2+${(0.25 + c * 0.5 + i * 0.12).toFixed(2)}/0.5"><span class="cut" style="background:var(--${col})">${n}</span>${t}</div>`).join('')}</div>`).join('')}</div>`,
    },
    // ── 7. 예시문항 ──
    { id: 'sample', cls: 'dark', chapter: '어떤 문제가 나오나',
      lines: [
        { t: '평가원이 공개한 예시문항 25문항을 | 직접 분류해 봤습니다.', say: '평가원이 공개한 예시문항 스물다섯 문항을 직접 분류해 봤습니다.' },
        { t: '25문항 가운데 **13문항**이 | 지도, 그래프, 표를 읽어야 풀립니다.', say: '스물다섯 문항 가운데 열세 문항이 지도, 그래프, 표를 읽어야 풀립니다.' },
        { t: '사상가의 주장을 판단하는 문항이 **6문항**,', say: '사상가의 주장을 판단하는 문항이 여섯 문항,' },
        { t: '역사 자료를 읽는 문항이 **4문항**입니다.', say: '역사 자료를 읽는 문항이 네 문항입니다.' },
      ],
      html: `${H.top('06', '어떤 문제가 나오나')}
        <h2 class="h2" data-a="up@s+0.1">예시문항 25문항, <span class="m">직접 분류해 보니</span></h2>
        <div class="sb">
          ${[['지도 · 그래프 · 표를 읽어야 푸는 문항', 13, 'c1', 'L2', 'map'], ['사상가의 주장을 판단하는 문항', 6, 'c2', 'L3', 'user-circle'], ['역사 자료(사료 · 문서)를 읽는 문항', 4, 'c3', 'L4', 'file-text']]
          .map(([t, n, c, cue, ic]) => `<div class="sb-r" data-a="up@L1+0.4">
            <div class="sb-t">${icon(ic, { size: 36, stroke: 1.9 })}<span>${t}</span><b class="${c}"><em data-count="${n}" data-at="${cue}" data-dur="${(0.3 + n * 0.045).toFixed(2)}">0</em><small>/25</small></b></div>
            <div class="sb-tr">${cells(n, true, c, cue)}</div></div>`).join('')}
        </div>
        <div class="sb-src" data-a="in@L1+0.8">자료: 2028학년도 대학수학능력시험 예시문항(한국교육과정평가원) 25문항을 승민T가 분류 · 한 문항이 두 유형에 걸칠 수 있음</div>`,
    },
    // ── 8. 이렇게 준비 ──
    { id: 'study', chapter: '이렇게 준비하세요',
      lines: [
        { t: '그래서 개념을 외우는 것만으로는 부족합니다.' },
        { t: '처음 보는 자료를 | 배운 개념에 연결하는 연습이 필요합니다.' },
        { t: '지도와 그래프는 매주 조금씩, | 사상가는 롤스와 노직처럼 짝으로 정리하세요.', say: '지도와 그래프는 매주 조금씩 보고, 사상가는 롤스와 노직처럼 짝으로 정리하세요.' },
        { t: '틀린 문제는 이유를 한 줄로 적어 두면 | 같은 함정에 다시 빠지지 않습니다.' },
      ],
      html: `${H.top('07', '이렇게 준비하세요')}
        <div class="sd">
          <div class="sd-l">
            <div class="sd-a" data-a="up@s+0.1"><span class="st" data-a="strike@w1:부족/0.5">개념 암기만</span></div>
            <div class="sd-b" data-a="up@L2">처음 보는 자료 <span class="sd-arr">${icon('arrow-right', { size: 64, stroke: 2.4 })}</span><br><span class="mk" data-a="hl@w2:연결/0.6">배운 개념에 연결</span></div>
          </div>
          <div class="sd-r">
            ${[['L3', 'chart-line', '지도 · 그래프', '매주 조금씩'], ['w3:사상가', 'arrows-exchange', '사상가', '짝으로 정리 (롤스 ↔ 노직)'], ['L4', 'pencil', '틀린 문제', '이유를 한 줄로']]
            .map(([cue, ic, t, s]) => `<div class="sd-tip cut" data-a="right@${cue}"><span class="sd-ic">${icon(ic, { size: 42, stroke: 2 })}</span><div><b>${t}</b><span>${s}</span></div></div>`).join('')}
          </div>
        </div>`,
    },
    // ── 9. 맺음 ──
    { id: 'end', cls: 'dark', chapter: '마치며', hold: 1.6,
      lines: [
        { t: '2028 수능 통합사회 소식과 단원별 개념 정리를 | 이 채널에 꾸준히 올리겠습니다.' },
        { t: '지금까지 통합사회 승민T였습니다.' },
      ],
      html: `<div class="e-wrap">
          <div class="e-logo" data-a="pop@s+0.2"><i class="cut"></i></div>
          <div class="e-name" data-a="up@s+0.4"><span class="s">통합사회</span> 승민<span class="t">T</span></div>
          <div class="e-line" data-a="up@L1+0.3">2028 수능 통합사회 소식 · 단원별 개념 한 장 정리</div>
          <div class="e-next cut" data-a="up@L2"><small>다음 영상</small><b>통합사회 첫 단원, 네 가지 관점 한 번에 정리</b></div>
        </div>
        <div class="e-src" data-a="in@L1+0.6">자료: 교육부·한국교육과정평가원 2028학년도 수능 개편 발표(2025.1), 2028학년도 수능 예시문항 · 단원 이름: 2022 개정 교육과정 통합사회1·2</div>`,
    },
  ];

  const css = `
  .scene { --pad: 110px; }
  .h2 { position: absolute; left: var(--pad); top: 170px; font-size: 64px; font-weight: 850; letter-spacing: -0.045em; line-height: 1.2; }
  .h2 .m { color: var(--mint-2); }
  .dark .h2 .m { color: var(--mint); }

  /* 1 */
  .o-year { position: absolute; right: -40px; top: 120px; font-size: 520px; font-weight: 900; letter-spacing: -0.06em; line-height: 1; color: transparent;
    -webkit-text-stroke: 3px rgba(63, 216, 182, .22); }
  .o-k { position: absolute; left: var(--pad); top: 250px; font-size: 38px; font-weight: 750; color: var(--mint); }
  .o-h { position: absolute; left: var(--pad); top: 320px; font-size: 118px; font-weight: 900; line-height: 1.14; letter-spacing: -0.055em; }
  .o-h > span { display: inline-block; }
  .o-h > span:first-child { font-size: 60px; color: #aab4d6; font-weight: 750; letter-spacing: -0.03em; margin-bottom: 14px; }
  .o-pill { position: absolute; right: var(--pad); bottom: 190px; display: flex; align-items: center; gap: 16px; background: var(--mint); color: var(--navy);
    padding: 22px 40px 22px 32px; border-radius: 999px; font-size: 46px; }
  .o-pill b { font-weight: 850; letter-spacing: -0.03em; }

  /* 2 */
  .t3 { position: absolute; left: var(--pad); right: var(--pad); top: 350px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 36px; }
  .t3c { background: #fff; border-top: 8px solid var(--rule-2); padding: 50px 48px 52px; --cut: 30px; height: 500px; position: relative; }
  @keyframes on { to { border-top-color: var(--mint-2); box-shadow: 0 24px 60px rgba(18, 29, 69, .14); transform: translateY(-12px); } }
  @keyframes off { from { border-top-color: var(--mint-2); box-shadow: 0 24px 60px rgba(18, 29, 69, .14); transform: translateY(-12px); } to { border-top-color: var(--rule-2); box-shadow: none; transform: none; } }
  .t3n { font-size: 34px; font-weight: 850; color: var(--mint-ink); font-feature-settings: 'tnum' 1; }
  .t3i { margin-top: 40px; color: var(--navy); }
  .t3t { margin-top: 36px; font-size: 58px; font-weight: 850; letter-spacing: -0.045em; line-height: 1.2; }
  .t3s { margin-top: 18px; font-size: 36px; color: var(--gray); font-weight: 600; }

  /* 3 */
  .ch { position: absolute; left: var(--pad); right: var(--pad); top: 175px; bottom: 170px; display: grid; grid-template-columns: 1fr 140px 1fr; align-items: center; }
  .ch-cap { font-size: 42px; font-weight: 800; color: var(--gray); margin-bottom: 30px; }
  .ch-cap.new { color: var(--mint-ink); }
  .ch-g { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .ch-s { background: #fff; border: 2px solid var(--rule-2); padding: 28px 10px; text-align: center; font-size: 34px; font-weight: 700; color: var(--ink-2); --cut: 14px; letter-spacing: -0.03em; }
  .ch-pick { margin-top: 30px; font-size: 36px; font-weight: 700; color: var(--ink-2); display: flex; align-items: center; gap: 10px; }
  .ch-n { margin-top: 16px; font-size: 46px; font-weight: 700; color: var(--ink-2); }
  .ch-n b { font-size: 72px; font-weight: 900; color: var(--ink); }
  .ch-arr { width: 120px; color: var(--mint-2); justify-self: center; }
  .ch-two { display: flex; align-items: center; gap: 22px; }
  .ch-b { flex: 1; background: var(--navy); color: #fff; padding: 40px 34px 44px; font-size: 64px; font-weight: 900; letter-spacing: -0.045em; --cut: 26px; }
  .ch-b.sci { background: var(--navy-3); }
  .ch-b small { display: block; font-size: 32px; font-weight: 700; color: var(--mint); letter-spacing: -0.01em; margin-bottom: 8px; }
  .ch-plus { font-size: 70px; font-weight: 800; color: var(--mint-2); }
  .ch-both { margin-top: 30px; font-size: 38px; font-weight: 750; color: var(--mint-ink); display: flex; align-items: center; gap: 10px; }
  .ch-stats { margin-top: 34px; display: flex; gap: 22px; }
  .ch-stats div { flex: 1; background: var(--mint-soft); padding: 18px 28px; display: flex; align-items: baseline; gap: 8px; }
  .ch-stats b { font-size: 112px; font-weight: 900; color: var(--mint-ink); letter-spacing: -0.04em; font-feature-settings: 'tnum' 1; line-height: 1.05; }
  .ch-stats span { font-size: 40px; font-weight: 800; color: var(--ink); }

  /* 4 */
  .tl { position: absolute; left: var(--pad); right: var(--pad); top: 300px; height: 560px; }
  .tl-line { position: absolute; left: 0; right: 0; top: 250px; height: 6px; background: var(--navy); border-radius: 3px; }
  .tl-yr { position: absolute; top: 200px; font-size: 32px; font-weight: 800; color: var(--gray); }
  .tl-p { position: absolute; top: 253px; width: 0; }
  .tl-p > i { position: absolute; left: -17px; top: -17px; width: 34px; height: 34px; border-radius: 50%; background: #fff; border: 7px solid var(--navy); }
  .tl-p.me > i { background: var(--mint); border-color: var(--mint-ink); }
  .tl-p.mock > i { border-color: var(--gray); width: 26px; height: 26px; left: -13px; top: -13px; border-width: 6px; }
  .tl-card { position: absolute; left: 50%; transform: translateX(-50%); top: 52px; width: 400px; box-sizing: border-box; background: #fff; border: 2px solid var(--rule); padding: 22px 26px 24px; }
  .tl-card.up { top: auto; bottom: 46px; width: 330px; transform: translateX(-22%); background: var(--paper); border-style: dashed; border-color: var(--rule-2); }
  .tl-p.me .tl-card { background: var(--navy); color: #fff; border-color: var(--navy); transform: translateX(-62%); }
  .tl-card em { display: block; font-style: normal; font-size: 27px; font-weight: 800; color: var(--mint-ink); }
  .me .tl-card em { color: var(--mint); }
  .tl-card b { display: block; font-size: 38px; font-weight: 850; letter-spacing: -0.04em; margin-top: 6px; }
  .tl-card span { display: block; font-size: 26px; color: var(--gray); font-weight: 600; margin-top: 6px; }
  .me .tl-card span { color: #c9d1ee; }
  .tl-card u { position: absolute; right: 18px; top: 18px; text-decoration: none; font-size: 22px; font-weight: 800; background: var(--mint-soft); color: var(--mint-ink); padding: 6px 12px; }
  .me .tl-card u { background: var(--mint); color: var(--navy); }
  .tl-card.up b { font-size: 32px; }
  .tl-br { position: absolute; left: 30%; width: 27%; top: 150px; height: 30px; border: 4px solid var(--mint-2); border-bottom: 0; }
  .tl-note { position: absolute; left: 18%; width: 51%; top: 92px; text-align: center; font-size: 32px; font-weight: 750; color: var(--mint-ink); display: flex; justify-content: center; align-items: center; gap: 10px; }

  /* 5 */
  .yr { position: absolute; left: var(--pad); right: var(--pad); top: 360px; height: 420px; display: grid; grid-template-columns: 1.55fr 1fr 1fr 250px; gap: 20px; align-items: stretch; }
  .yr-c { background: #fff; border: 2px solid var(--rule); padding: 26px 30px; height: 250px; align-self: end; }
  .yr-c.g1 { background: var(--mint-pale); border-color: var(--mint-2); --cut: 26px; }
  .yr-h { font-size: 40px; font-weight: 900; letter-spacing: -0.04em; }
  .yr-sem { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 22px; }
  .yr-sem div { background: var(--mint-2); color: #fff; padding: 18px 20px; font-size: 36px; font-weight: 850; letter-spacing: -0.04em; }
  .yr-sem small { display: block; font-size: 24px; font-weight: 700; opacity: .85; margin-bottom: 4px; }
  .yr-x { margin-top: 30px; font-size: 36px; font-weight: 750; color: var(--gray); background: var(--paper); padding: 30px 20px; text-align: center; }
  .yr-flag { background: var(--navy); color: #fff; height: 250px; align-self: end; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; --cut: 26px; }
  .yr-flag .ic { color: var(--mint); }
  .yr-flag b { font-size: 52px; font-weight: 900; }
  .yr-flag small { font-size: 28px; color: #c9d1ee; font-weight: 650; }
  .yr-arc { position: absolute; left: 0; right: 0; top: -40px; width: 100%; height: 160px; overflow: visible; }
  .yr-lbl { position: absolute; left: 50%; top: -76px; transform: translateX(-50%); background: var(--mint); color: var(--navy); font-size: 32px; font-weight: 850; padding: 10px 24px; border-radius: 999px; }
  .yr-no { position: absolute; left: 44%; right: 270px; bottom: -66px; font-size: 28px; font-weight: 700; color: var(--gray); display: flex; gap: 10px; align-items: center; justify-content: center; }

  /* 6 */
  .fd { position: absolute; right: var(--pad); top: 176px; display: flex; gap: 14px; }
  .fd span { display: flex; align-items: center; gap: 10px; background: var(--navy); color: #fff; font-size: 32px; font-weight: 800; padding: 14px 24px; --cut: 14px; }
  .fd .ic { color: var(--mint); }
  .un { position: absolute; left: var(--pad); right: var(--pad); top: 320px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
  .un-h { font-size: 40px; font-weight: 900; border-bottom: 4px solid var(--ink); padding-bottom: 14px; letter-spacing: -0.03em; }
  .un-r { display: flex; align-items: center; gap: 22px; font-size: 38px; font-weight: 750; letter-spacing: -0.04em; padding: 16px 0; border-bottom: 2px solid var(--rule); }
  .un-r span { width: 56px; height: 56px; flex: none; color: #fff; font-size: 24px; font-weight: 800; display: flex; align-items: center; justify-content: center; --cut: 12px; }

  /* 7 */
  .sb { position: absolute; left: var(--pad); right: var(--pad); top: 330px; display: flex; flex-direction: column; gap: 46px; }
  .sb-t { display: flex; align-items: center; gap: 16px; font-size: 40px; font-weight: 750; letter-spacing: -0.035em; }
  .sb-t .ic { color: #aab4d6; }
  .sb-t b { margin-left: auto; font-size: 72px; font-weight: 900; letter-spacing: -0.03em; line-height: 1; }
  .sb-t b em { font-style: normal; font-feature-settings: 'tnum' 1; }
  .sb-t small { font-size: 32px; color: #8f9ac2; margin-left: 6px; font-weight: 700; }
  .sb-tr { display: grid; grid-template-columns: repeat(25, 1fr); gap: 8px; margin-top: 16px; }
  .sb-tr i { height: 52px; background: var(--navy-2); border-radius: 3px; position: relative; }
  .sb-tr i b { position: absolute; inset: 0; border-radius: 3px; }
  .c1 { color: var(--mint); } .c2 { color: #9fb4ff; } .c3 { color: #f4c470; }
  .sb-tr b.c1 { background: var(--mint); } .sb-tr b.c2 { background: #9fb4ff; } .sb-tr b.c3 { background: #f4c470; }
  .sb-src { position: absolute; left: var(--pad); right: var(--pad); top: 862px; font-size: 24px; color: #8f9ac2; font-weight: 550; }

  /* 8 */
  .sd { position: absolute; left: var(--pad); right: var(--pad); top: 200px; bottom: 180px; display: grid; grid-template-columns: 1.05fr 1fr; gap: 80px; align-items: center; }
  .sd-a { font-size: 60px; font-weight: 800; color: var(--gray); letter-spacing: -0.04em; }
  .sd-b { margin-top: 40px; font-size: 76px; font-weight: 900; letter-spacing: -0.05em; line-height: 1.3; }
  .sd-arr { color: var(--mint-2); display: inline-block; vertical-align: middle; }
  .sd-r { display: flex; flex-direction: column; gap: 22px; }
  .sd-tip { display: flex; align-items: center; gap: 26px; background: #fff; padding: 30px 34px; --cut: 22px; border-left: 8px solid var(--mint-2); }
  .sd-ic { width: 76px; height: 76px; flex: none; background: var(--mint-soft); color: var(--mint-ink); display: flex; align-items: center; justify-content: center; border-radius: 50%; }
  .sd-tip b { display: block; font-size: 40px; font-weight: 850; letter-spacing: -0.04em; }
  .sd-tip span { display: block; font-size: 32px; color: var(--ink-2); font-weight: 600; margin-top: 4px; }

  /* 9 */
  .e-wrap { position: absolute; inset: 0 0 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .e-logo i { display: block; width: 110px; height: 110px; background: var(--mint); --cut: 34px; }
  .e-name { margin-top: 40px; font-size: 96px; font-weight: 900; letter-spacing: -0.05em; }
  .e-name .s { font-weight: 550; opacity: .75; }
  .e-name .t { color: var(--mint); }
  .e-line { margin-top: 18px; font-size: 38px; color: #c9d1ee; font-weight: 600; }
  .e-next { margin-top: 60px; background: var(--navy-2); padding: 26px 44px; border-left: 6px solid var(--mint); text-align: left; --cut: 20px; }
  .e-next small { display: block; font-size: 26px; color: var(--mint); font-weight: 800; }
  .e-next b { display: block; font-size: 40px; font-weight: 800; margin-top: 6px; letter-spacing: -0.03em; }
  .e-src { position: absolute; left: var(--pad); right: var(--pad); bottom: 170px; text-align: center; font-size: 22px; color: #8f9ac2; }
  `;

  // 썸네일 (1280×720) — 강사 사진이 생기면 오른쪽 칸에 넣는다
  const thumb = {
    size: [1280, 720],
    html: `<div class="th">
      <div class="th-wm">${H.wm}</div>
      <div class="th-k">2028 수능</div>
      <h1 class="th-h">통합사회<br><span>3분 정리</span></h1>
      <div class="th-s">
        <div class="cut"><b>25문항 · 40분</b></div>
        <div class="cut"><b>고1 = 수능 범위</b></div>
        <div class="cut"><b>문·이과 모두</b></div>
      </div>
      <div class="th-big">2028</div>
    </div>`,
    css: `
    .th { position: relative; width: 1280px; height: 720px; background: var(--navy); color: #fff; overflow: hidden; padding: 56px 64px; }
    .th-big { position: absolute; right: -30px; bottom: -70px; font-size: 360px; font-weight: 900; letter-spacing: -0.06em; color: transparent; -webkit-text-stroke: 3px rgba(63,216,182,.2); line-height: 1; }
    .th-wm { font-size: 30px; }
    .th-k { margin-top: 70px; display: inline-block; background: var(--mint); color: var(--navy); font-size: 46px; font-weight: 900; padding: 6px 22px 10px; letter-spacing: -0.03em; }
    .th-h { margin-top: 18px; font-size: 150px; line-height: 1.02; font-weight: 900; letter-spacing: -0.06em; }
    .th-h span { color: var(--mint); }
    .th-s { position: absolute; right: 64px; top: 170px; display: flex; flex-direction: column; gap: 16px; z-index: 2; }
    .th-s div { background: #fff; color: var(--navy); padding: 18px 30px 20px; --cut: 18px; font-size: 40px; }
    .th-s b { font-weight: 900; letter-spacing: -0.04em; }
    `,
  };

  const description = ({ chapters }) => `
2028 수능 통합사회, 3분 정리 | 예비 고1·학부모님이 알아야 할 것

2028학년도 수능부터 사회탐구는 '통합사회' 한 과목입니다. 고1 때 배우는 통합사회1·2가 그대로 수능 범위가 됩니다.
무엇이 달라지는지, 누가 언제 보는지, 어떤 문제가 나오는지 3분으로 정리했습니다.

${chapters}

자료
· 교육부·한국교육과정평가원, 2028학년도 대학수학능력시험 개편 발표(2025.1)
· 2028학년도 대학수학능력시험 예시문항(한국교육과정평가원) — 문항 분류는 승민T
· 2029·2030학년도 수능 날짜는 해마다 11월에 치르는 일정에 따른 예상입니다.

#통합사회 #2028수능 #예비고1 #고1통합사회 #2028대입개편
`;

  return { size: [1920, 1080], fps: 30, voice: 'ko-KR-SunHiNeural', rate: '+5%', scenes, css, thumb, description };
}
