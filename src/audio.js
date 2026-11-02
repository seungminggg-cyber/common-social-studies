// 집중 사운드: 음원 파일 없이 브라우저에서 소리를 직접 만들어 재생합니다.
// (기존 앱의 빗방울·모닥불·파도 소리 엔진을 그대로 옮겨왔습니다)

export const SOUNDS = [
  { id: 'off', label: '끄기', icon: 'fa-volume-xmark' },
  { id: 'rain', label: '빗소리', icon: 'fa-cloud-rain' },
  { id: 'brown', label: '독서실 소음', icon: 'fa-headphones' },
  { id: 'library', label: '도서관', icon: 'fa-book-open' },
  { id: 'fire', label: '모닥불', icon: 'fa-fire' },
  { id: 'waves', label: '파도', icon: 'fa-water' },
];

export const sound = {
  type: 'off',
  volume: 45,
  rain: 'medium', // light, medium, heavy
};

let ctx = null;
let master = null;
let nodes = [];
let loopTimer = null;

export function playSound(type) {
  sound.type = type;
  if (type === 'off') stopSound();
  else start(type);
}

export function setRainDensity(mode) {
  sound.rain = mode;
  if (sound.type === 'rain') start('rain');
}

export function setVolume(v) {
  sound.volume = Number(v);
  if (master && ctx) master.gain.setValueAtTime((sound.volume / 100) * 0.45, ctx.currentTime);
}

export function stopSound() {
  if (loopTimer) clearInterval(loopTimer);
  loopTimer = null;
  nodes.forEach((n) => {
    try { n.stop(); n.disconnect(); } catch { /* 이미 멈춤 */ }
  });
  nodes = [];
  if (ctx) {
    try { ctx.close(); } catch { /* 무시 */ }
  }
  ctx = null;
  master = null;
}

function start(type) {
  stopSound();
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = (sound.volume / 100) * 0.45;
    master.connect(ctx.destination);

    // 부드러운 핑크 노이즈 바탕음
    const len = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }
    const base = ctx.createBufferSource();
    base.buffer = buffer;
    base.loop = true;
    const filter = ctx.createBiquadFilter();
    base.connect(filter);
    base.start(0);
    nodes.push(base);

    if (type === 'rain') {
      const mode = sound.rain;
      filter.type = 'lowpass';
      filter.frequency.value = mode === 'light' ? 480 : mode === 'heavy' ? 820 : 620;
      const bed = ctx.createGain();
      bed.gain.value = mode === 'light' ? 0.28 : mode === 'heavy' ? 0.55 : 0.38;
      filter.connect(bed);
      bed.connect(master);
      const interval = mode === 'light' ? 55 : mode === 'heavy' ? 18 : 30;
      loopTimer = setInterval(() => {
        if (ctx && ctx.state === 'running') raindrop(buffer);
      }, interval);
    } else if (type === 'brown') {
      filter.type = 'lowpass';
      filter.frequency.value = 190;
      filter.connect(master);
    } else if (type === 'library') {
      filter.type = 'bandpass';
      filter.frequency.value = 340;
      filter.Q.value = 0.7;
      filter.connect(master);
      loopTimer = setInterval(() => {
        if (ctx && Math.random() < 0.35) pageTurn(buffer);
      }, 2200);
    } else if (type === 'fire') {
      filter.type = 'lowpass';
      filter.frequency.value = 260;
      filter.connect(master);
      loopTimer = setInterval(() => {
        if (ctx && Math.random() < 0.55) crackle(buffer);
      }, 90);
    } else if (type === 'waves') {
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.14; // 약 7초 주기 파도
      lfoGain.gain.value = 220;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start(0);
      filter.connect(master);
      nodes.push(lfo);
    }
  } catch (e) {
    console.error('사운드 재생 오류:', e);
  }
}

function raindrop(noise) {
  const t = ctx.currentTime;
  const burst = ctx.createBufferSource();
  burst.buffer = noise;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(900 + Math.random() * 1900, t);
  bp.Q.setValueAtTime(3.5 + Math.random() * 4, t);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.12 + Math.random() * 0.22, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.018 + Math.random() * 0.015);
  burst.connect(bp);
  bp.connect(g);
  g.connect(master);
  burst.start(t, Math.random() * 2, 0.04);

  if (Math.random() < 0.45) {
    const osc = ctx.createOscillator();
    const dg = ctx.createGain();
    const f = 1100 + Math.random() * 1400;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 1.35, t + 0.022);
    dg.gain.setValueAtTime(0.001, t);
    dg.gain.linearRampToValueAtTime(0.035 + Math.random() * 0.04, t + 0.004);
    dg.gain.exponentialRampToValueAtTime(0.0005, t + 0.028);
    osc.connect(dg);
    dg.connect(master);
    osc.start(t);
    osc.stop(t + 0.032);
  }
}

function pageTurn(noise) {
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1600;
  bp.Q.value = 1.5;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.08, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  src.connect(bp);
  bp.connect(g);
  g.connect(master);
  src.start(t, Math.random(), 0.4);
}

function crackle(noise) {
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2200 + Math.random() * 1500;
  bp.Q.value = 6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.18, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
  src.connect(bp);
  bp.connect(g);
  g.connect(master);
  src.start(t, Math.random(), 0.02);
}

// 타이머가 끝났을 때 울리는 짧은 알림음
export function chime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const c = new AudioCtx();
    [880, 1320].forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      const t = c.currentTime + i * 0.25;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      o.connect(g);
      g.connect(c.destination);
      o.start(t);
      o.stop(t + 0.65);
    });
    setTimeout(() => c.close(), 1200);
  } catch { /* 소리 재생이 막힌 경우 무시 */ }
}
