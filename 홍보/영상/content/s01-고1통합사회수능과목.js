// 유튜브 쇼츠 01 — 고1 통합사회, 이제 수능 과목 (세로 1080×1920, 30~45초)
// 긴 영상 v01(2028 수능 통합사회 3분 정리)에서 뽑은 내용. 사실 근거는 v01·blog01 맨 위 주석과 같다.
// 화면 아래 약 1/4은 유튜브 버튼·제목이 덮으므로 중요한 것은 위쪽 3/4 안에 둔다(자막은 아래에서 520px 위).
// 선행교육규제법 제8조④: '선행·미리·앞서' 같은 말을 쓰지 않는다.

const SUBJ = ['생활과 윤리', '윤리와 사상', '한국지리', '세계지리', '동아시아사', '세계사', '경제', '정치와 법', '사회·문화'];

export default function (H) {
  const { icon } = H;
  const scenes = [
    { id: 'hook', cls: 'dark',
      lines: [{ t: '고1 통합사회, | 이제 **수능 과목**입니다.' }],
      html: `<div class="s-top">${H.wm}</div>
        <div class="s-k" data-a="up@s+0.1">2028 수능</div>
        <h1 class="s-h"><span data-a="up@s+0.2">고1</span><br><span data-a="up@s+0.35">통합사회,</span><br><span data-a="up@w:이제">이제 <span class="mk" data-a="hl@w:수능/0.6">수능 과목</span></span></h1>`,
    },
    { id: 'one',
      lines: [
        { t: '2028 수능부터 사회탐구는 | **통합사회** 한 과목.', say: '2028 수능부터 사회탐구는 통합사회 한 과목.' },
        { t: '문과·이과 상관없이 | 탐구를 보면 모두 봅니다.', say: '문과, 이과 상관없이 탐구를 보면 모두 봅니다.' },
      ],
      html: `<div class="s-top">${H.wm}</div>
        <div class="s-cap" data-a="up@s+0.1">사회탐구 9과목</div>
        <div class="s-g">${SUBJ.map((s, i) => `<span class="cut" data-a="pop@s+${(0.15 + i * 0.06).toFixed(2)}/0.4; out@w1:통합사회+${(i * 0.03).toFixed(2)}/0.35">${s}</span>`).join('')}
          <div class="s-one cut" data-a="pop@w1:통합사회+0.25/0.6">통합사회</div></div>
        <div class="s-both">
          <span class="cut" data-a="left@L2">문과</span><span class="cut" data-a="right@L2+0.15">이과</span>
        </div>
        <div class="s-all" data-a="up@w2:모두">${icon('circle-check', { size: 52, stroke: 2.2 })}모두 응시</div>`,
    },
    { id: 'num',
      lines: [
        { t: '**25문항, 40분.**', say: '스물다섯 문항, 40분.' },
        { t: '범위는 고1 때 배우는 | 통합사회1과 2 전체입니다.', say: '범위는 고1 때 배우는 통합사회 1과 2 전체입니다.' },
      ],
      html: `<div class="s-top">${H.wm}</div>
        <div class="s-num">
          <div data-a="up@s+0.1"><b data-count="25" data-at="L1" data-dur="0.8">0</b><span>문항</span></div>
          <div data-a="up@s+0.25"><b data-count="40" data-at="w1:40분" data-dur="0.8">0</b><span>분</span></div>
        </div>
        <div class="s-rng" data-a="up@L2">
          <div class="s-rk">수능 범위</div>
          <div class="s-rb"><span class="cut" data-a="wipe@w2:통합사회/0.5"><small>고1 1학기</small>통합사회1</span><span class="cut" data-a="wipe@w2:2+0.1/0.5"><small>고1 2학기</small>통합사회2</span></div>
        </div>`,
    },
    { id: 'grid', cls: 'dark',
      lines: [
        { t: '예시문항 25문항 중 **13문항**은 | 지도, 그래프, 표를 읽어야 풀립니다.', say: '예시문항 스물다섯 문항 중 열세 문항은 지도, 그래프, 표를 읽어야 풀립니다.' },
      ],
      html: `<div class="s-top">${H.wm}</div>
        <div class="s-gk" data-a="up@s+0.1">2028 수능 예시문항</div>
        <div class="s-gg">${Array.from({ length: 25 }, (_, i) => `<i data-a="in@s+${(0.1 + i * 0.02).toFixed(2)}/0.3">${i < 13 ? `<b data-a="pop@w:열세+${(i * 0.05).toFixed(2)}/0.4"></b>` : ''}</i>`).join('')}</div>
        <div class="s-gn" data-a="up@w:열세"><b data-count="13" data-at="w:열세" data-dur="0.7">0</b><span>/ 25</span></div>
        <div class="s-gl" data-a="up@w:지도">${icon('map', { size: 46, stroke: 2 })}지도 · 그래프 · 표</div>
        <div class="s-src" data-a="in@s+0.5">승민T 분류 · 한국교육과정평가원 2028학년도 수능 예시문항</div>`,
    },
    { id: 'end', cls: 'dark', hold: 1.2,
      lines: [
        { t: '고1 개념 정리가 | 고3 수능까지 이어집니다.' },
        { t: '자세한 내용은 | 3분 정리 영상에서 확인하세요.' },
      ],
      html: `<div class="s-top">${H.wm}</div>
        <div class="s-arc">
          <span class="cut a" data-a="up@L1">고1</span>
          <svg viewBox="0 0 400 60"><path class="draw" style="--len:420" data-a="draw@L1+0.3/0.9" d="M10 30 H370 M350 10 L372 30 L350 50" fill="none" stroke="var(--mint)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="cut b" data-a="up@w1:고3">고3 수능</span>
        </div>
        <div class="s-next cut" data-a="up@L2">${icon('player-play', { size: 44, stroke: 2.2 })}<div><small>긴 영상</small><b>2028 수능 통합사회, 3분 정리</b></div></div>`,
    },
  ];

  const css = `
  .s-top { position: absolute; left: 72px; top: 110px; font-size: 34px; }
  .s-k { position: absolute; left: 72px; top: 330px; font-size: 52px; font-weight: 800; color: var(--mint); }
  .s-h { position: absolute; left: 72px; top: 420px; font-size: 170px; font-weight: 900; line-height: 1.1; letter-spacing: -0.06em; }
  .s-h > span { display: inline-block; }

  .s-cap { position: absolute; left: 72px; top: 270px; font-size: 48px; font-weight: 800; color: var(--gray); }
  .s-g { position: absolute; left: 72px; right: 72px; top: 360px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .s-g span { background: #fff; border: 2px solid var(--rule-2); padding: 34px 6px; text-align: center; font-size: 38px; font-weight: 700; color: var(--ink-2); --cut: 16px; letter-spacing: -0.04em; }
  .s-one { position: absolute; inset: 40px 30px; background: var(--navy); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 120px; font-weight: 900; letter-spacing: -0.06em; --cut: 40px; }
  .s-both { position: absolute; left: 72px; right: 72px; top: 860px; display: flex; gap: 20px; }
  .s-both span { flex: 1; background: var(--mint-soft); color: var(--mint-ink); text-align: center; font-size: 60px; font-weight: 850; padding: 26px 0; --cut: 20px; }
  .s-all { position: absolute; left: 72px; right: 72px; top: 1030px; display: flex; justify-content: center; align-items: center; gap: 14px; font-size: 58px; font-weight: 850; color: var(--ink); }
  .s-all .ic { color: var(--mint-2); }

  .s-num { position: absolute; left: 72px; right: 72px; top: 300px; display: flex; flex-direction: column; gap: 10px; }
  .s-num div { display: flex; align-items: baseline; gap: 14px; }
  .s-num b { font-size: 260px; font-weight: 900; letter-spacing: -0.05em; color: var(--navy); line-height: 1; font-feature-settings: 'tnum' 1; }
  .s-num div:nth-child(2) b { color: var(--mint-ink); }
  .s-num span { font-size: 84px; font-weight: 850; }
  .s-rng { position: absolute; left: 72px; right: 72px; top: 940px; }
  .s-rk { font-size: 44px; font-weight: 800; color: var(--gray); }
  .s-rb { margin-top: 18px; display: flex; gap: 16px; }
  .s-rb span { flex: 1; background: var(--mint-2); color: #fff; padding: 26px 30px; font-size: 58px; font-weight: 900; letter-spacing: -0.04em; --cut: 20px; }
  .s-rb small { display: block; font-size: 32px; font-weight: 700; opacity: .9; }

  .s-gk { position: absolute; left: 72px; top: 270px; font-size: 48px; font-weight: 800; color: #aab4d6; }
  .s-gg { position: absolute; left: 72px; top: 360px; width: 560px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
  .s-gg i { aspect-ratio: 1; background: var(--navy-2); border-radius: 8px; position: relative; }
  .s-gg b { position: absolute; inset: 0; background: var(--mint); border-radius: 8px; }
  .s-gn { position: absolute; left: 670px; top: 520px; display: flex; flex-direction: column; }
  .s-gn b { font-size: 220px; font-weight: 900; color: var(--mint); line-height: .95; letter-spacing: -0.05em; font-feature-settings: 'tnum' 1; }
  .s-gn span { font-size: 60px; font-weight: 800; color: #8f9ac2; }
  .s-gl { position: absolute; left: 72px; right: 72px; top: 990px; display: flex; align-items: center; gap: 16px; font-size: 66px; font-weight: 900; letter-spacing: -0.04em; }
  .s-gl .ic { color: var(--mint); }
  .s-src { position: absolute; left: 72px; right: 72px; top: 1110px; font-size: 26px; color: #8f9ac2; }

  .s-arc { position: absolute; left: 72px; right: 72px; top: 400px; display: flex; flex-direction: column; align-items: center; gap: 30px; }
  .s-arc span { font-size: 110px; font-weight: 900; letter-spacing: -0.05em; padding: 20px 50px; --cut: 30px; }
  .s-arc .a { background: var(--mint); color: var(--navy); }
  .s-arc .b { background: #fff; color: var(--navy); }
  .s-arc svg { width: 200px; height: 120px; transform: rotate(90deg); }
  .s-next { position: absolute; left: 72px; right: 72px; top: 1080px; display: flex; align-items: center; gap: 24px; background: var(--navy-2); border-left: 8px solid var(--mint); padding: 30px 36px; --cut: 24px; }
  .s-next .ic { color: var(--mint); }
  .s-next small { display: block; font-size: 32px; color: var(--mint); font-weight: 800; }
  .s-next b { display: block; font-size: 46px; font-weight: 850; letter-spacing: -0.04em; }
  `;

  return { size: [1080, 1920], vertical: true, fps: 30, voice: 'ko-KR-SunHiNeural', rate: '+10%', gap: 0.22, pre: 0.3, post: 0.35, progress: false, scenes, css };
}
