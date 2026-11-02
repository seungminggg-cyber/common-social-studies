// 집중 사운드: 음원 파일 없이 브라우저에서 소리를 직접 만들어 재생합니다.
//
// - 소리 크기를 측정해서 폰 스피커로도 잘 들리는 크기·음역으로 맞춤
// - 아이폰 무음 모드에서도 재생되도록 미디어 재생으로 설정 (iOS 17 이상)
// - 효과음(빗방울, 장작 튀는 소리, 발소리 등)은 1.5초 앞까지 미리 예약해서 끊기지 않게 함

export const SOUNDS = [
  { id: 'off', label: '끄기', icon: 'fa-volume-xmark' },
  { id: 'rain', label: '빗소리', icon: 'fa-cloud-rain' },
  { id: 'brown', label: '백색 소음', icon: 'fa-headphones' },
  { id: 'library', label: '도서관', icon: 'fa-book-open' },
  { id: 'fire', label: '모닥불', icon: 'fa-fire' },
  { id: 'waves', label: '파도', icon: 'fa-water' },
];

export const sound = {
  type: 'off',
  volume: 60,
  rain: 'medium', // light, medium, heavy
};

let ctx = null;
let master = null;
let buffers = null;
let current = null; // 지금 재생 중인 소리
let timer = null;

const rand = (min, max) => min + Math.random() * (max - min);

// 사용자가 버튼을 누를 때 호출해야 브라우저가 소리 재생을 허락함
export function unlockAudio() {
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch { /* 지원 안 하는 브라우저 */ }
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = volumeGain();
    // 갑자기 큰 소리가 나도 찢어지지 않도록 살짝 눌러주는 리미터
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 3;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.15;
    master.connect(limiter);
    limiter.connect(ctx.destination);
    buffers = makeBuffers(ctx);
  }
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  return ctx;
}

function volumeGain() {
  return Math.pow(sound.volume / 100, 1.5);
}

// 소리 재료: 부드러운 핑크 노이즈(바탕음용)와 화이트 노이즈(짧고 또렷한 효과음용)
export function makeBuffers(audioCtx) {
  const sr = audioCtx.sampleRate;

  const pinkLen = sr * 4;
  const pink = audioCtx.createBuffer(1, pinkLen, sr);
  const p = pink.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < pinkLen; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    p[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
    b6 = w * 0.115926;
  }
  // 반복 재생 이음새에서 '툭' 소리가 나지 않도록 앞뒤를 부드럽게 겹침
  const fade = Math.floor(sr * 0.05);
  for (let i = 0; i < fade; i++) {
    const t = i / fade;
    p[i] = p[i] * t + p[pinkLen - fade + i] * (1 - t);
  }
  normalize(p, 0.25);

  const white = audioCtx.createBuffer(1, sr * 2, sr);
  const w = white.getChannelData(0);
  for (let i = 0; i < w.length; i++) w[i] = Math.random() * 2 - 1;
  normalize(w, 0.25);

  return { pink, white };
}

function normalize(data, targetRms) {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  const scale = targetRms / Math.sqrt(sum / data.length);
  for (let i = 0; i < data.length; i++) data[i] *= scale;
}

// ---------- 소리 부품 ----------

// 계속 흐르는 바탕음: 노이즈 → 필터들 → 음량
function bed(audioCtx, dest, buffer, filters, gain) {
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.loopStart = 0;
  let node = src;
  filters.forEach(([type, freq, q = 0.7]) => {
    const f = audioCtx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    node.connect(f);
    node = f;
  });
  const g = audioCtx.createGain();
  g.gain.value = gain;
  node.connect(g);
  g.connect(dest);
  src.start(audioCtx.currentTime, Math.random() * 3);
  return { src, gain: g };
}

// 아주 짧은 소리 하나: 노이즈 조각 → 필터 → 빠르게 커졌다 사라지는 음량
function hit(audioCtx, dest, buffer, t, { type = 'bandpass', freq, q = 1, peak, attack = 0.001, decay }) {
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const f = audioCtx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  src.connect(f);
  f.connect(g);
  g.connect(dest);
  src.start(t, Math.random() * (buffer.duration - 0.5), attack + decay + 0.02);
}

// 일정하지 않게 음량을 천천히 바꿔서 자연스러운 변화 만들기 (바람, 불꽃 일렁임)
function drift(param, t, min, max, dur) {
  param.setTargetAtTime(rand(min, max), t, dur / 3);
}

// ---------- 빗소리 ----------
// 넓게 깔리는 빗소리 + 아주 촘촘하고 작은 빗방울 + 가끔 가까이 떨어지는 굵은 빗방울
// (예전의 '또르르' 하는 높은 물방울 소리는 없앴습니다)
function rain(audioCtx, out, buf, mode) {
  const p = {
    light: { hiss: 0.35, body: 0.25, lp: 5000, rate: 25, near: 0.6 },
    medium: { hiss: 0.5, body: 0.4, lp: 7000, rate: 45, near: 1.2 },
    heavy: { hiss: 0.75, body: 0.6, lp: 9000, rate: 80, near: 2 },
  }[mode];
  const bus = audioCtx.createGain();
  bus.connect(out);
  bed(audioCtx, bus, buf.pink, [['highpass', 400], ['lowpass', p.lp]], p.hiss);
  bed(audioCtx, bus, buf.pink, [['lowpass', 900]], p.body);
  return [
    { // 작은 빗방울: 아주 짧고 부드러운 '사락' 소리가 촘촘하게
      gap: () => -Math.log(1 - Math.random()) / p.rate,
      fire: (t) => hit(audioCtx, bus, buf.white, t, {
        freq: rand(2000, 7000), q: rand(0.5, 1), peak: 0.15 * Math.pow(Math.random(), 2) + 0.02, decay: rand(0.004, 0.012),
      }),
    },
    { // 가까이 떨어지는 굵은 빗방울: 낮고 둔탁한 '톡'
      gap: () => -Math.log(1 - Math.random()) / p.near,
      fire: (t) => hit(audioCtx, bus, buf.white, t, {
        freq: rand(700, 1600), q: rand(0.6, 1.2), peak: rand(0.25, 0.5), decay: rand(0.02, 0.05),
      }),
    },
    { // 빗줄기 세기가 몇 초마다 조금씩 달라짐
      gap: () => rand(2, 5),
      fire: (t) => drift(bus.gain, t, 0.8, 1.15, 2),
    },
  ];
}

// ---------- 모닥불 ----------
// 낮게 타오르는 불꽃 소리 + 장작이 '타닥타닥' 튀는 소리(여러 번 연달아) + 가끔 크게 '탁' 갈라지는 소리
function fire(audioCtx, out, buf) {
  const flame = bed(audioCtx, out, buf.pink, [['lowpass', 500]], 0.45);
  const hiss = bed(audioCtx, out, buf.pink, [['bandpass', 1800, 0.5]], 0.12);

  const click = (t, peak) => hit(audioCtx, out, buf.white, t, {
    type: 'highpass', freq: rand(1500, 4000), q: 0.7, peak: peak * 2.5, attack: 0.0005, decay: rand(0.002, 0.007),
  });

  return [
    { // 타닥타닥: 짧은 튀는 소리가 2~7번 불규칙하게 연달아
      gap: () => rand(0.15, 0.9),
      fire: (t) => {
        const n = 1 + Math.floor(Math.pow(Math.random(), 1.5) * 7);
        let at = t;
        for (let i = 0; i < n; i++) {
          click(at, rand(0.2, 0.9) * (i === 0 ? 1 : rand(0.4, 1)));
          at += rand(0.008, 0.07);
        }
      },
    },
    { // 장작이 크게 갈라지는 '탁!' 소리와 뒤따르는 잔불 튀는 소리
      gap: () => rand(3, 9),
      fire: (t) => {
        hit(audioCtx, out, buf.white, t, { freq: rand(500, 1100), q: 1.2, peak: rand(0.8, 1.2), attack: 0.0007, decay: rand(0.04, 0.08) });
        click(t, 1.4);
        for (let i = 0; i < 4; i++) click(t + rand(0.03, 0.4), rand(0.15, 0.5));
      },
    },
    { // 수액이 끓는 '치익' 소리 (아주 가끔, 작게)
      gap: () => rand(8, 18),
      fire: (t) => hit(audioCtx, out, buf.white, t, { type: 'highpass', freq: 3000, q: 0.5, peak: 0.06, attack: 0.15, decay: rand(0.4, 0.9) }),
    },
    { // 불꽃이 일렁이며 소리 크기가 조금씩 변함
      gap: () => rand(0.8, 2.5),
      fire: (t) => {
        drift(flame.gain.gain, t, 0.32, 0.6, 1);
        drift(hiss.gain.gain, t, 0.06, 0.18, 1);
      },
    },
  ];
}

// ---------- 도서관 ----------
// 기본은 아주 조용한 실내 공기 소리. 가끔 누군가 걸어 지나가는 발소리와 책장 넘기는 소리
function footstep(audioCtx, out, buf, t, level) {
  // 뒤꿈치가 닿는 둔한 소리 + 바닥에 닿는 짧은 마찰음, 이어서 앞꿈치
  hit(audioCtx, out, buf.pink, t, { type: 'lowpass', freq: rand(350, 550), q: 0.8, peak: 1.6 * level, attack: 0.003, decay: rand(0.06, 0.09) });
  hit(audioCtx, out, buf.white, t, { freq: rand(1800, 2600), q: 1.2, peak: 0.2 * level, attack: 0.001, decay: 0.012 });
  hit(audioCtx, out, buf.pink, t + rand(0.06, 0.09), { type: 'lowpass', freq: rand(500, 800), q: 0.8, peak: 0.7 * level, attack: 0.004, decay: 0.05 });
}

function pageTurn(audioCtx, out, buf, t) {
  // 종이가 휘며 넘어가는 '사르륵' (높이가 올라가며 바스락거림) + 마지막에 내려앉는 '팔락'
  const dur = rand(0.25, 0.45);
  const src = audioCtx.createBufferSource();
  src.buffer = buf.white;
  const f = audioCtx.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 1.1;
  f.frequency.setValueAtTime(rand(1200, 1800), t);
  f.frequency.exponentialRampToValueAtTime(rand(3500, 5000), t + dur);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  // 바스락거림: 짧은 간격으로 크기가 불규칙하게 변함
  for (let x = 0; x < dur; x += 0.018) {
    const env = Math.sin((x / dur) * Math.PI);
    g.gain.linearRampToValueAtTime(Math.max(0.0001, env * rand(0.6, 1.6)), t + x);
  }
  g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.02);
  src.connect(f);
  f.connect(g);
  g.connect(out);
  src.start(t, Math.random(), dur + 0.1);
  hit(audioCtx, out, buf.pink, t + dur, { type: 'lowpass', freq: rand(500, 900), q: 0.7, peak: 0.8, attack: 0.004, decay: 0.07 });
}

function library(audioCtx, out, buf) {
  bed(audioCtx, out, buf.pink, [['highpass', 120], ['lowpass', 1100]], 0.18);
  return [
    { // 누군가 걸어 지나감: 6~12걸음, 다가왔다가 멀어짐
      gap: () => rand(12, 30),
      fire: (t) => {
        const steps = 6 + Math.floor(Math.random() * 7);
        const pace = rand(0.48, 0.6);
        const loud = rand(0.5, 1);
        for (let i = 0; i < steps; i++) {
          const level = loud * Math.sin(((i + 0.5) / steps) * Math.PI) * rand(0.85, 1.1);
          footstep(audioCtx, out, buf, t + i * pace + rand(-0.03, 0.03), level);
        }
      },
    },
    { // 책장 넘기는 소리 (가끔 두세 장 연달아)
      gap: () => rand(5, 14),
      fire: (t) => {
        pageTurn(audioCtx, out, buf, t);
        if (Math.random() < 0.3) pageTurn(audioCtx, out, buf, t + rand(0.8, 1.6));
      },
    },
  ];
}

// ---------- 소리 하나 만들기 ----------
// 실제 재생과 크기 측정 테스트에서 함께 사용합니다.
// schedule(until): until 시각까지 효과음을 미리 예약
export function buildSound(audioCtx, dest, type, buf, rainMode = 'medium') {
  const out = audioCtx.createGain();
  out.connect(dest);
  let generators = [];

  if (type === 'rain') {
    generators = rain(audioCtx, out, buf, rainMode);
  } else if (type === 'fire') {
    generators = fire(audioCtx, out, buf);
  } else if (type === 'library') {
    generators = library(audioCtx, out, buf);
  } else if (type === 'brown') {
    bed(audioCtx, out, buf.pink, [['lowpass', 650]], 0.8);
  } else if (type === 'waves') {
    // 약 8초 주기로 소리가 커졌다 작아지며 밀려오는 파도
    const wave = bed(audioCtx, out, buf.pink, [['lowpass', 700]], 0.6);
    const lfo = audioCtx.createOscillator();
    const depth = audioCtx.createGain();
    lfo.frequency.value = 0.125;
    depth.gain.value = 0.45;
    lfo.connect(depth);
    depth.connect(wave.gain.gain);
    lfo.start();
  }

  const start = audioCtx.currentTime + 0.05;
  generators.forEach((g) => { g.nextAt = start + g.gap() * Math.random(); });

  return {
    out,
    schedule(until) {
      generators.forEach((g) => {
        while (g.nextAt < until) {
          g.fire(g.nextAt);
          g.nextAt += g.gap();
        }
      });
    },
    stop() {
      const t = audioCtx.currentTime;
      out.gain.setValueAtTime(out.gain.value, t);
      out.gain.linearRampToValueAtTime(0, t + 0.3);
      setTimeout(() => out.disconnect(), 400);
    },
  };
}

export function playSound(type) {
  sound.type = type;
  if (current) current.stop();
  current = null;
  clearInterval(timer);
  timer = null;
  if (type === 'off') return;
  if (!unlockAudio()) return;
  current = buildSound(ctx, master, type, buffers, sound.rain);
  const tick = () => current && current.schedule(ctx.currentTime + 1.5);
  tick();
  timer = setInterval(tick, 250);
}

export function setRainDensity(mode) {
  sound.rain = mode;
  if (sound.type === 'rain') playSound('rain');
}

export function setVolume(v) {
  sound.volume = Number(v);
  if (master && ctx) master.gain.setTargetAtTime(volumeGain(), ctx.currentTime, 0.05);
}

export function stopSound() {
  playSound('off');
}

// 타이머가 끝났을 때 울리는 짧은 알림음
export function chime() {
  const c = unlockAudio();
  if (!c) return;
  [880, 1320].forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    const t = c.currentTime + i * 0.25;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + 0.65);
  });
}
