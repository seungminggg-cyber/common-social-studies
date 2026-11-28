// 네이버 블로그 01 — 고1 통합사회, 이제 수능 과목입니다 (예비 고1 학부모용)
// 그림 5장 + 복사용 글 + 미리보기.
// 사실 근거:
//   - 2028학년도 수능 사회·과학탐구 과목당 25문항·40분, 탐구 응시자는 통합사회·통합과학 모두 응시: 교육부·평가원 2025-01-20 발표
//     (한국경제 2025-01-20, 생글생글 2025-01-31)
//   - 2028학년도 수능 2027-11-18 시행 예정: KDI 경제정보센터 정책자료
//   - 고1 내신 5등급 상대평가(1등급 10%): 2028 대입 개편 확정안(2023-12-27), 뉴시스 2025-01-02
//   - 고3에 1학년 과목을 학교가 다시 열기 어렵다: 뉴스토마토 2026-10-21(김경범 칼럼)
//   - 예시문항 분류 숫자: 기출변형/특강/content/analysis.js, render.js (승민T 분류)
// 선행교육규제법 제8조④: 예비 고1 대상 글에 '선행·미리·앞서' 같은 말을 쓰지 않는다. 이 글은 학원 모집 광고가 아니다.

const U1 = [
  ['I', '통합적 관점', '네 가지 관점 · 통합적 탐구', 'u1'],
  ['II', '인간, 사회, 환경과 행복', '행복의 기준 · 행복의 조건', 'u2'],
  ['III', '자연환경과 인간', '기후와 생활 · 자연관 · 환경 문제', 'u3'],
  ['IV', '문화와 다양성', '문화권 · 문화 변동 · 문화 상대주의 · 다문화', 'u4'],
  ['V', '생활공간과 사회', '도시화 · 교통·통신 · 지역의 변화', 'u5'],
];
const U2 = [
  ['I', '인권 보장과 헌법', '인권 · 헌법과 기본권 · 인권 문제', 'u1'],
  ['II', '사회 정의와 불평등', '정의관(롤스·노직) · 사회·공간 불평등', 'u2'],
  ['III', '시장경제와 지속가능발전', '자본주의 · 합리적 선택 · 금융 생활 · 무역', 'u3'],
  ['IV', '세계화와 평화', '세계화 · 국제 사회 · 남북 분단·동아시아 갈등', 'u4'],
  ['V', '미래와 지속가능한 삶', '인구 문제 · 자원 · 세계시민', 'u5'],
];

export default function (H) {
  const { icon } = H;
  const wm = `<div class="wm"><i></i><span><span class="s">통합사회</span> 승민<span class="t">T</span></span></div>`;
  const pages = [];

  // 그림 1. 대표 이미지 (정사각형 — 블로그 목록·검색 썸네일)
  pages.push({ name: '대표', html: `<section class="fig dark sq1">
    <div class="top">${wm}<div class="crumb">2028 대입 개편</div></div>
    <div class="kicker f1-k"><i class="sq"></i>예비 고1 학부모님께</div>
    <h1 class="f1-h">고1 통합사회,<br>이제 <span class="hl-d">수능 과목</span>입니다</h1>
    <p class="lead f1-l">2028 대입 개편 후 꼭 알아야 할 5가지</p>
    <div class="f1-s">
      <div class="cut"><b>25문항 · 40분</b><span>수능 통합사회</span></div>
      <div class="cut"><b>문·이과 모두</b><span>탐구 응시자 전원</span></div>
      <div class="cut"><b>고1 과목 = 범위</b><span>통합사회1·2</span></div>
    </div>
  </section>` });

  // 그림 2. 달라진 점
  const cmp = [
    ['사회탐구', '9과목 중 골라서 응시<br><small>생활과 윤리, 한국지리, 사회·문화 등</small>', '<b>통합사회</b> 1과목'],
    ['응시 방법', '사회·과학탐구 17과목 중<br>최대 2과목 선택', '탐구를 보면 <b>통합사회 + 통합과학</b><br>둘 다 응시'],
    ['문항 · 시간', '과목당 20문항 · 30분', '과목당 <b>25문항 · 40분</b>'],
    ['출제 범위', '2·3학년 선택과목', '<b>고1</b> 통합사회1·2'],
    ['고1 통합사회', '수능에 나오지 않음', '<b>수능 범위 전체</b>'],
  ];
  pages.push({ name: '달라진점', html: `<section class="fig">
    <div class="f-k">무엇이 달라졌나</div>
    <h2 class="f-h">수능 사회탐구, <span class="m">이렇게 바뀝니다</span></h2>
    <div class="cmp">
      <div class="cmp-h"><span></span><span class="old">2027학년도 수능까지</span><span class="new cut">2028학년도 수능부터</span></div>
      ${cmp.map(([k, a, b]) => `<div class="cmp-r"><span class="ck">${k}</span><span class="old">${a}</span><span class="new">${b}</span></div>`).join('')}
    </div>
    <div class="src">자료: 교육부·한국교육과정평가원 발표(2025.1), 2028학년도 대학수학능력시험 개편 내용</div>
    <div class="brand">통합사회 승민T</div>
  </section>` });

  // 그림 3. 누가 언제
  const gen = [
    ['지금 고2', '2027년 11월 18일 (예정)', '2028학년도 수능', '첫 번째', false],
    ['지금 고1', '2028년 11월', '2029학년도 수능', '두 번째', false],
    ['지금 중3<br><small>예비 고1</small>', '2029년 11월', '2030학년도 수능', '세 번째', true],
  ];
  pages.push({ name: '누가언제', html: `<section class="fig">
    <div class="f-k">누가, 언제 보나</div>
    <h2 class="f-h">통합사회 수능, <span class="m">학년별 시험 시기</span></h2>
    <div class="gen">${gen.map(([who, when, exam, nth, me]) => `<div class="gen-r${me ? ' me cut' : ''}">
      <div class="g-who">${who}</div>
      <div class="g-arr">${icon('arrow-right', { size: 40, stroke: 2.2 })}</div>
      <div class="g-ex"><b>${exam}</b><span>${when}</span></div>
      <div class="g-nth">${nth}</div></div>`).join('')}</div>
    <div class="gen-n">${icon('flag', { size: 30, stroke: 2 })}<p>통합사회 학력평가는 2025년부터 치르고 있고, <b>2027년 6월</b>에는 평가원 모의평가가 처음 열립니다.</p></div>
    <div class="src">수능 날짜: 2028학년도는 발표된 예정일, 2029·2030학년도는 해마다 11월에 치르는 일정에 따른 예상</div>
    <div class="brand">통합사회 승민T</div>
  </section>` });

  // 그림 4. 단원 지도
  const col = (title, sub, rows) => `<div class="uc"><div class="uc-h"><b>${title}</b><span>${sub}</span></div>
    ${rows.map(([n, t, kw, c]) => `<div class="ur"><span class="un cut" style="background:var(--${c})">${n}</span><div><div class="ut">${t}</div><div class="uk">${kw}</div></div></div>`).join('')}</div>`;
  pages.push({ name: '단원', html: `<section class="fig">
    <div class="f-k">어떤 과목인가</div>
    <h2 class="f-h">통합사회1·2, <span class="m">10개 단원 한눈에</span></h2>
    <p class="f-l">윤리 · 지리 · 일반사회 · 역사가 한 과목 안에 섞여 있습니다.</p>
    <div class="units">${col('통합사회1', '보통 1학기', U1)}${col('통합사회2', '보통 2학기', U2)}</div>
    <div class="src">단원 이름: 2022 개정 교육과정 통합사회1·2 · 학기 편성은 학교마다 다를 수 있습니다.</div>
    <div class="brand">통합사회 승민T</div>
  </section>` });

  // 그림 5. 예시문항 분석
  const bars = [
    ['지도 · 그래프 · 표를 읽어야 푸는 문항', 13],
    ['사상가의 주장을 판단하는 문항', 6],
    ['역사 자료(사료·문서)를 읽는 문항', 4],
  ];
  pages.push({ name: '예시문항', html: `<section class="fig">
    <div class="f-k">어떤 문제가 나오나</div>
    <h2 class="f-h">예시문항 25문항, <span class="m">직접 분류해 보니</span></h2>
    <div class="bars">${bars.map(([t, n]) => `<div class="bar"><div class="b-t"><span>${t}</span><b>${n}<small>/25</small></b></div><div class="b-tr">${Array.from({ length: 25 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div></div>`).join('')}</div>
    <div class="split">
      <div class="sp-t">단원별 문항 수</div>
      <div class="sp-b"><div class="s1" style="flex:9"><b>통합사회1</b> 9문항</div><div class="s2" style="flex:16"><b>통합사회2</b> 16문항</div></div>
    </div>
    <div class="f5-n">${icon('bulb', { size: 32, stroke: 2 })}<p>개념 암기만으로는 부족합니다. <b>처음 보는 자료를 배운 개념에 연결하는 연습</b>이 필요합니다.</p></div>
    <div class="src">자료: 2028학년도 대학수학능력시험 예시문항(한국교육과정평가원, 사회탐구 25문항)을 승민T가 직접 분류. 한 문항이 두 유형에 걸칠 수 있습니다.</div>
    <div class="brand">통합사회 승민T</div>
  </section>` });

  const css = `
  .sq { width: 18px; height: 18px; background: var(--mint); display: inline-block; clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%); }
  .hl-d { color: var(--navy); background: var(--mint); padding: 0 12px 4px; margin: 0 2px; }
  .sq1 { height: 1080px; padding: 76px 80px; }
  .f1-k { margin-top: 110px; }
  .f1-h { font-size: 96px; font-weight: 900; line-height: 1.16; letter-spacing: -0.055em; margin-top: 24px; }
  .f1-l { margin-top: 30px; font-size: 38px; }
  .f1-s { position: absolute; left: 80px; right: 80px; bottom: 80px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .f1-s div { background: var(--navy-2); border-top: 4px solid var(--mint); padding: 26px 26px 28px; --cut: 18px; }
  .f1-s b { display: block; font-size: 34px; font-weight: 850; letter-spacing: -0.04em; color: var(--mint); }
  .f1-s span { display: block; font-size: 24px; color: #c9d1ee; margin-top: 8px; font-weight: 550; }

  .f-k { font-size: 26px; font-weight: 800; color: var(--mint-ink); }
  .f-h { font-size: 56px; font-weight: 900; letter-spacing: -0.05em; line-height: 1.2; margin-top: 10px; }
  .f-h .m { color: var(--mint-2); }
  .f-l { font-size: 30px; color: var(--ink-2); margin-top: 16px; font-weight: 550; }

  .cmp { margin-top: 44px; }
  .cmp-h, .cmp-r { display: grid; grid-template-columns: 190px 1fr 1fr; gap: 0; }
  .cmp-h span { font-size: 26px; font-weight: 800; padding: 16px 22px; }
  .cmp-h .old { color: var(--gray); background: var(--paper); }
  .cmp-h .new { color: var(--mint); background: var(--navy); --cut: 14px; }
  .cmp-r { border-bottom: 2px solid var(--rule); }
  .cmp-r span { padding: 24px 22px; font-size: 29px; line-height: 1.42; letter-spacing: -0.03em; }
  .cmp-r .ck { font-weight: 800; color: var(--ink); font-size: 27px; }
  .cmp-r .old { color: var(--gray); background: #fafbfc; font-weight: 550; }
  .cmp-r .new { color: var(--ink); background: var(--mint-pale); font-weight: 600; }
  .cmp-r .new b { color: var(--mint-ink); }
  .cmp-r small { font-size: 23px; }

  .gen { margin-top: 44px; display: flex; flex-direction: column; gap: 16px; }
  .gen-r { display: grid; grid-template-columns: 210px 60px 1fr 150px; align-items: center; padding: 26px 30px; border: 2px solid var(--rule); background: #fff; }
  .gen-r.me { background: var(--navy); color: #fff; border-color: var(--navy); --cut: 22px; }
  .g-who { font-size: 36px; font-weight: 850; letter-spacing: -0.04em; line-height: 1.2; }
  .g-who small { display: block; font-size: 24px; font-weight: 700; color: var(--mint); margin-top: 4px; }
  .g-arr { color: var(--mint-2); }
  .g-ex b { display: block; font-size: 34px; font-weight: 850; letter-spacing: -0.03em; }
  .g-ex span { display: block; font-size: 26px; color: var(--gray); margin-top: 6px; font-weight: 550; }
  .me .g-ex span { color: #c9d1ee; }
  .g-nth { justify-self: end; font-size: 26px; font-weight: 800; color: var(--mint-ink); background: var(--mint-soft); padding: 10px 18px; }
  .me .g-nth { background: var(--mint); color: var(--navy); }
  .gen-n { margin-top: 30px; display: flex; gap: 16px; align-items: flex-start; background: var(--paper); padding: 24px 28px; }
  .gen-n .ic { color: var(--mint-ink); margin-top: 3px; }
  .gen-n p { font-size: 28px; line-height: 1.5; font-weight: 550; color: var(--ink-2); }
  .gen-n b { color: var(--ink); }

  .units { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
  .uc-h { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 3px solid var(--ink); padding-bottom: 14px; }
  .uc-h b { font-size: 36px; font-weight: 900; letter-spacing: -0.04em; }
  .uc-h span { font-size: 24px; color: var(--gray); font-weight: 650; }
  .ur { display: grid; grid-template-columns: 60px 1fr; gap: 18px; padding: 20px 0; border-bottom: 2px solid var(--rule); height: 162px; align-items: start; }
  .un { width: 60px; height: 60px; color: #fff; font-size: 24px; font-weight: 800; display: flex; align-items: center; justify-content: center; --cut: 12px; font-feature-settings: 'tnum' 0; }
  .ut { font-size: 30px; font-weight: 800; letter-spacing: -0.04em; line-height: 1.3; }
  .uk { font-size: 24px; color: var(--gray); line-height: 1.45; margin-top: 6px; font-weight: 550; }

  .bars { margin-top: 48px; display: flex; flex-direction: column; gap: 34px; }
  .b-t { display: flex; justify-content: space-between; align-items: baseline; }
  .b-t span { font-size: 31px; font-weight: 700; letter-spacing: -0.03em; }
  .b-t b { font-size: 48px; font-weight: 900; color: var(--mint-ink); letter-spacing: -0.03em; }
  .b-t small { font-size: 26px; color: var(--gray); font-weight: 700; margin-left: 4px; }
  .b-tr { display: grid; grid-template-columns: repeat(25, 1fr); gap: 6px; margin-top: 14px; }
  .b-tr i { height: 46px; background: var(--rule); }
  .b-tr i.on { background: var(--mint-2); }
  .split { margin-top: 52px; }
  .sp-t { font-size: 26px; font-weight: 800; color: var(--gray); }
  .sp-b { display: flex; margin-top: 14px; height: 84px; }
  .sp-b div { display: flex; align-items: center; padding: 0 24px; font-size: 28px; color: #fff; font-weight: 600; gap: 10px; }
  .sp-b b { font-weight: 850; }
  .s1 { background: var(--navy-3); }
  .s2 { background: var(--navy); }
  .f5-n { margin-top: 40px; display: flex; gap: 16px; align-items: flex-start; background: var(--mint-pale); border-left: 8px solid var(--mint-2); padding: 24px 28px; }
  .f5-n .ic { color: var(--mint-ink); margin-top: 3px; }
  .f5-n p { font-size: 29px; line-height: 1.5; font-weight: 550; }
  `;

  // ── 복사용 글 (네이버 블로그 편집기에 붙여넣기) ──
  const title = '고1 통합사회, 이제 수능 과목입니다 | 예비 고1 학부모님이 알아야 할 5가지';
  const S = (t) => `\n[소제목] ${t}\n`;
  const body = `
제목: ${title}

[사진 1: 01-대표.png]

안녕하세요, 통합사회 승민T입니다.

겨울방학을 앞두고 "고등학교 통합사회는 뭐가 달라졌나요?"라는 질문을 많이 받습니다. 결론부터 말씀드리면 세 가지입니다.

[인용구]
① 고1 때 배우는 통합사회1·2가 그대로 수능 범위가 됩니다.
② 탐구 영역을 보는 학생은 문과·이과 구분 없이 모두 통합사회를 봅니다.
③ 수능 통합사회는 25문항·40분이고, 예시문항 25문항 중 13문항이 지도·그래프·표를 읽어야 풀립니다.
[인용구 끝]

하나씩 자세히 설명드리겠습니다.
${S('1. 무엇이 달라졌나요?')}
2027학년도 수능까지 사회탐구는 생활과 윤리, 한국지리, 사회·문화 같은 과목 가운데 골라서 보는 시험이었습니다. 사회·과학탐구 17과목 가운데 최대 2과목을 고르고, 과목당 20문항을 30분 동안 풀었습니다. 고1 때 배우는 통합사회는 수능에 나오지 않았습니다.

2028학년도 수능부터는 선택과목이 없어집니다. 사회탐구는 '통합사회', 과학탐구는 '통합과학' 한 과목씩이고, 탐구 영역을 보는 학생은 두 과목을 모두 봅니다. 문항 수는 과목당 25문항, 시험 시간은 40분으로 늘었습니다(교육부·한국교육과정평가원, 2025년 1월 발표).

[사진 2: 02-달라진점.png]
${S('2. 누가, 언제 처음 보나요?')}
통합사회 수능을 처음 보는 학생은 지금의 고2입니다. 2027년 11월 18일(예정)에 치르는 2028학년도 수능이 첫 통합사회 수능입니다. 지금 고1이 두 번째, 지금 중학교 3학년인 예비 고1이 세 번째로 이 시험을 봅니다.

세 번째라서 좋은 점도 있습니다. 통합사회 학력평가는 2025년부터 치르고 있고, 2027년 6월에는 평가원 모의평가가 처음 열립니다. 예비 고1 학생들은 위 두 학년이 실제로 치른 시험을 보면서 준비할 수 있습니다.

[사진 3: 03-누가언제.png]
${S('3. 고1 내신이 곧 수능 공부입니다')}
통합사회1·2는 고1이 배우는 공통과목입니다. 보통 1학기에 통합사회1, 2학기에 통합사회2를 배웁니다(학교마다 편성은 다를 수 있습니다). 고1 내신은 5등급 상대평가로, 1등급은 상위 10%입니다.

예전에는 고1 통합사회 성적이 내신에만 쓰였다면, 이제는 고1 때 배운 내용이 고3 수능까지 그대로 이어집니다. 그런데 2·3학년에는 학교에서 선택과목을 배우기 때문에, 고3이 되어 학교에서 통합사회를 처음부터 다시 배우기는 어렵습니다. 고1 때 만든 개념 정리가 고3까지 가져가는 '나만의 교과서'가 되어야 하는 이유입니다.
${S('4. 통합사회는 어떤 과목인가요?')}
윤리, 지리, 일반사회(정치·법·경제·사회·문화), 역사가 한 과목 안에 섞여 있습니다. 통합사회1은 '통합적 관점'부터 '생활공간과 사회'까지 5단원, 통합사회2는 '인권 보장과 헌법'부터 '미래와 지속가능한 삶'까지 5단원입니다.

[사진 4: 04-단원.png]

한 단원 안에서도 여러 분야가 함께 나옵니다. 예를 들어 '사회 정의와 불평등' 단원에서는 롤스·노직 같은 사상가의 정의관(윤리), 지역 사이의 불평등(지리), 불평등을 줄이는 제도(일반사회)를 함께 배웁니다.
${S('5. 어떤 문제가 나오나요? 예시문항 25문항을 직접 분류했습니다')}
한국교육과정평가원이 공개한 2028학년도 수능 예시문항 25문항을 하나씩 분류해 보면 특징이 뚜렷합니다.

· 25문항 중 13문항이 지도·그래프·표를 읽어야 풀립니다.
· 사상가의 주장을 읽고 판단하는 문항이 6문항입니다(롤스, 노직, 칸트, 갈퉁 등).
· 권리 장전, 남북 공동 선언 같은 역사 자료를 읽는 문항이 4문항입니다.
· 예시문항에서는 통합사회1에서 9문항, 통합사회2에서 16문항이 나왔습니다.
· 금융 상품과 기회비용처럼 두 단원을 한 문제에 묶은 문항이 많습니다.

[사진 5: 05-예시문항.png]

개념을 외우는 것만으로는 부족하고, 처음 보는 자료를 배운 개념에 연결하는 연습이 꼭 필요하다는 뜻입니다.
${S('6. 고1 통합사회, 이렇게 공부하면 흔들리지 않습니다')}
① 개념은 '질문'으로 정리합니다. 첫 단원에서 배우는 네 가지 관점도 "언제부터?(시간적)", "어디에서?(공간적)", "어떤 제도가?(사회적)", "바람직한가?(윤리적)"라는 질문 하나로 기억하면 처음 보는 문제에도 바로 쓸 수 있습니다.

② 지도·그래프는 매주 조금씩 봅니다. 기후 그래프나 인구 피라미드는 몰아서 보면 금방 잊습니다.

③ 사상가는 '짝'으로 외웁니다. 롤스와 노직, 칸트와 벤담처럼 짝을 지어 차이를 정리하면 오답 선지가 보입니다.

④ 틀린 문제는 이유를 한 줄로 적습니다. "왜 틀렸는지"가 남아야 같은 함정에 다시 빠지지 않습니다.

[승민T 한마디 — 강사님이 직접 2~3줄]
(예: 수업에서 고1 학생들이 가장 많이 헷갈려하는 부분, 수업에서 꼭 강조하는 것)
${S('마치며')}
통합사회는 새로 생긴 수능 과목이라 학생도 학부모님도 정보가 부족한 과목입니다. 이 블로그에는 앞으로 2028 수능 통합사회 소식과 시험 분석, 단원별 개념 한 장 정리, 시험 기간 공부법을 꾸준히 올리겠습니다. 저는 직접 만든 개념서와 문제집으로 수업하고 있습니다.

다음 글에서는 통합사회 첫 단원인 '네 가지 관점'을 한 번에 정리해 드리겠습니다.

[카카오톡 채널 링크 — 개설 후 넣기]

태그: 통합사회, 고1통합사회, 예비고1, 2028수능, 2028대입개편, 통합사회공부법, 통합사회1, 통합사회2, 김포통합사회
`;

  // ── 미리보기 (블로그에서 보이는 모습, 휴대폰 폭) ──
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const lines = body.trim().split('\n');
  let html = '', inQuote = false, para = [];
  const flush = () => { if (para.length) { html += `<p>${para.join('<br>')}</p>`; para = []; } };
  for (const raw of lines) {
    const l = raw.trim();
    if (l.startsWith('제목:')) { html += `<div class="pv-cat">통합사회 · 입시 정보</div><h1>${esc(l.slice(3).trim())}</h1><div class="pv-by"><span class="pv-av"></span><b>통합사회 승민T</b> · 2026. 12. 1.</div>`; continue; }
    if (!l) { flush(); continue; }
    let m;
    if ((m = l.match(/^\[사진 \d+: (.+)\]$/))) { flush(); html += `<img src="${m[1]}">`; continue; }
    if (l === '[인용구]') { flush(); inQuote = true; html += '<blockquote>'; continue; }
    if (l === '[인용구 끝]') { flush(); inQuote = false; html += '</blockquote>'; continue; }
    if ((m = l.match(/^\[소제목\] (.+)$/))) { flush(); html += `<h2>${esc(m[1])}</h2>`; continue; }
    if (l.startsWith('[승민T 한마디')) { flush(); html += `<div class="pv-me"><b>${esc(l.replace(/^\[|\]$/g, ''))}</b>`; continue; }
    if (l.startsWith('(예:')) { html += `<p>${esc(l)}</p></div>`; continue; }
    if (l.startsWith('[카카오톡')) { flush(); html += `<div class="pv-kk">${esc(l.replace(/^\[|\]$/g, ''))}</div>`; continue; }
    if (l.startsWith('태그:')) { flush(); html += `<div class="pv-tags">${l.slice(3).split(',').map((t) => `#${esc(t.trim())}`).join(' ')}</div>`; continue; }
    para.push(esc(l));
  }
  flush();
  const preview = {
    width: 720,
    css: `html, body { background: #fff; } .pv { width: 720px; padding: 40px 36px 60px; font-size: 19px; line-height: 1.85; color: #222; }
      .pv-cat { color: #00b74a; font-size: 15px; font-weight: 700; } .pv h1 { font-size: 29px; line-height: 1.4; margin: 10px 0 16px; letter-spacing: -0.03em; font-weight: 750; }
      .pv-by { display: flex; align-items: center; gap: 10px; font-size: 15px; color: #888; padding-bottom: 22px; border-bottom: 1px solid #eee; margin-bottom: 26px; }
      .pv-av { width: 34px; height: 34px; border-radius: 50%; background: var(--navy); display: inline-block; } .pv-by b { color: #333; }
      .pv p { margin: 0 0 20px; } .pv img { width: 100%; display: block; margin: 8px 0 26px; }
      .pv h2 { font-size: 23px; font-weight: 800; margin: 40px 0 16px; padding-left: 12px; border-left: 5px solid var(--mint-2); letter-spacing: -0.03em; line-height: 1.45; }
      .pv blockquote { border: 1px solid #e3e3e3; border-left: 5px solid var(--navy); background: #fafafa; padding: 18px 22px 2px; margin: 0 0 24px; font-weight: 600; }
      .pv-me { background: #fff8d6; border: 2px dashed #e0b400; padding: 16px 20px 2px; margin: 26px 0; } .pv-me b { color: #8a6a00; font-size: 16px; }
      .pv-kk { background: #fee500; color: #3c1e1e; font-weight: 800; text-align: center; padding: 16px; margin: 20px 0; }
      .pv-tags { color: #3d6bd6; font-size: 16px; margin-top: 30px; line-height: 1.8; }`,
    html: `<div class="pv">${html}</div>`,
  };

  return { pages, css, texts: { '글_복사용.txt': body }, preview };
}
