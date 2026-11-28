// 영상 페이지 안에서 도는 코드: 시간표(window.TL)를 읽어 움직임을 걸고, __seek(초)로 그 순간의 화면을 만든다.
// 모든 움직임은 멈춘 상태(paused)로 두고 currentTime을 직접 정하므로, 프레임마다 똑같이 매끄럽다.
(() => {
  const TL = window.TL;
  const EASE = {
    out: 'cubic-bezier(.2,.8,.2,1)', inout: 'cubic-bezier(.65,0,.35,1)', back: 'cubic-bezier(.3,1.4,.5,1)', lin: 'linear',
  };
  const DUR = { up: .7, down: .7, left: .7, right: .7, in: .5, out: .4, pop: .55, 'grow-x': .8, 'grow-y': .8, wipe: .8, draw: 1.1, hl: .6, strike: .45, dim: .5, pulse: .6 };

  // '언제' 풀기 — 장면 기준
  //   s, s+1.2 : 장면 시작(+초)        e-0.5 : 장면 끝(-초)
  //   L2, L2+0.3 : 두 번째 문장 시작    L2e : 두 번째 문장 끝
  //   w:25문항, w3:고1 : 그 단어를 말하는 순간(숫자 = 문장 번호)   1.5 : 장면 시작 + 1.5초
  function when(sc, cue) {
    cue = (cue || 's+0.3').trim();
    let m = cue.match(/^(.*?)([+-]\d*\.?\d+)?$/);
    let base = m[1], off = m[2] ? parseFloat(m[2]) : 0, t;
    if (/^\d*\.?\d+$/.test(cue)) return sc.start + parseFloat(cue);
    if (base === 's') t = sc.start;
    else if (base === 'e') t = sc.end;
    else if ((m = base.match(/^L(\d+)(e?)$/))) {
      const ln = sc.lines[+m[1] - 1];
      if (!ln) throw new Error(`장면 ${sc.id}: 문장 ${m[1]} 없음`);
      t = m[2] ? ln.start + ln.dur : ln.start;
    } else if ((m = base.match(/^w(\d*):(.+)$/))) {
      const want = m[2].replace(/\s/g, '');
      const lines = m[1] ? [sc.lines[+m[1] - 1]] : sc.lines;
      // 'TTS가 고2를 "고" "2"로 나누는 것처럼 단어가 쪼개져도 찾도록 이어 붙여서 찾는다
      for (const ln of lines) {
        if (!ln) continue;
        let joined = '', owner = [];
        ln.words.forEach((x, k) => { const s = x.w.replace(/\s/g, ''); joined += s; owner.push(...Array(s.length).fill(k)); });
        const at = joined.indexOf(want);
        if (at >= 0) { t = ln.start + ln.words[owner[at]].t; break; }
      }
      if (t === undefined) throw new Error(`장면 ${sc.id}: 단어 '${m[2]}'를 말하는 곳이 없음`);
    } else throw new Error(`장면 ${sc.id}: 알 수 없는 시간 '${cue}'`);
    return t + off;
  }
  window.__when = when;

  const counters = [];
  document.querySelectorAll('[data-scene]').forEach((el) => {
    const sc = TL.scenes[+el.dataset.scene];
    sc.el = el;
    // 장면 들어오기·나가기
    const anims = [`scene-in ${sc.inDur}s ${EASE.out} ${sc.start}s both paused`];
    if (!sc.last) anims.push(`scene-out ${sc.outDur}s ${EASE.inout} ${sc.end}s forwards paused`);
    el.style.animation = anims.join(', ');
    // data-a="up@L1; pulse@w:25문항/0.8/back"  (이름@언제/길이/부드럽기) — 여러 개는 ; 로
    el.querySelectorAll('[data-a]').forEach((n) => {
      const list = n.dataset.a.split(';').map((s) => s.trim()).filter(Boolean).map((s, i) => {
        const [name, rest = ''] = s.split('@');
        const [cue, dur, ease] = rest.split('/');
        const t = when(sc, cue);
        const d = dur ? parseFloat(dur) : (DUR[name] ?? .6);
        // 첫 움직임은 시작 전에도 처음 모습을 유지(both), 다음 움직임은 시작한 뒤에만 덮어씀(forwards)
        return `${name} ${d}s ${EASE[ease] || (name === 'pop' ? EASE.back : EASE.out)} ${t}s ${i ? 'forwards' : 'both'} paused`;
      });
      n.style.animation = list.join(', ');
    });
    // 숫자 올라가기: data-count="25" data-from="0" data-at="w:25문항" data-dur="0.9"
    el.querySelectorAll('[data-count]').forEach((n) => {
      counters.push({ n, to: +n.dataset.count, from: +(n.dataset.from || 0), t: when(sc, n.dataset.at), d: +(n.dataset.dur || 0.9) });
    });
  });

  const sub = document.querySelector('.sub');
  const bar = document.querySelector('.prog i');
  let lastSub = null;
  window.__seek = (t) => {
    for (const sc of TL.scenes) sc.el.style.visibility = (t >= sc.start - 0.02 && t < sc.end + sc.outDur + 0.02) ? 'visible' : 'hidden';
    for (const a of document.getAnimations()) a.currentTime = t * 1000;
    for (const c of counters) {
      const p = Math.min(1, Math.max(0, (t - c.t) / c.d));
      const e = 1 - Math.pow(1 - p, 3);
      c.n.textContent = Math.round(c.from + (c.to - c.from) * e).toLocaleString('ko-KR');
    }
    const cue = TL.subs.find((s) => t >= s.start && t < s.end);
    const txt = cue ? cue.html : '';
    if (sub && txt !== lastSub) { sub.innerHTML = txt; lastSub = txt; }
    if (bar) bar.style.width = `${Math.min(100, (t / TL.total) * 100)}%`;
  };
})();
