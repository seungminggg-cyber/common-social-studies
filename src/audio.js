// 집중 사운드: 음원 파일 없이 브라우저에서 소리를 직접 만들어 재생합니다.
//
// 예전 버전에서 소리가 안 들리던 이유와 고친 점
// - 소리가 너무 작았음 (약 -39dB) → 소리 크기를 측정해서 적당한 크기(-20dB 안팎)로 맞춤
// - 200Hz 이하 낮은 소리 위주라 폰 스피커로는 재생이 안 됨 → 폰에서도 들리는 음역으로 조정
// - 아이폰 무음 모드에서 웹 소리가 꺼짐 → 미디어 재생으로 설정 (iOS 17 이상)
// - 소리를 바꿀 때마다 새 오디오 장치를 만들던 방식 → 하나를 계속 사용

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
let noise = null;
let current = null; // 지금 재생 중인 소리
let timer = null;

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
    master.connect(ctx.destination);
    noise = makeNoiseBuffer(ctx);
  }
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  return ctx;
}

function volumeGain() {
  return Math.pow(sound.volume / 100, 1.5);
}

// 부드러운 핑크 노이즈를 만들고 크기를 일정하게 맞춤
export function makeNoiseBuffer(audioCtx) {
  const len = audioCtx.sampleRate * 4;
  const buffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let sum = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    sum += data[i] * data[i];
  }
  // 반복 재생 이음새에서 '툭' 소리가 나지 않도록 앞뒤를 부드럽게 겹침
  const fade = Math.floor(audioCtx.sampleRate * 0.05);
  for (let i = 0; i < fade; i++) {
    const t = i / fade;
    data[i] = data[i] * t + data[len - fade + i] * (1 - t);
  }
  const scale = 0.25 / Math.sqrt(sum / len); // 크기를 일정하게 (RMS 0.25)
  for (let i = 0; i < len; i++) data[i] *= scale;
  return buffer;
}

// 소리 하나를 만드는 함수. 실제 재생과 크기 측정 테스트에서 함께 사용합니다.
// schedule(until): until 시각까지 빗방울·장작 소리 같은 효과음을 미리 예약
export function buildSound(audioCtx, dest, type, noiseBuffer, rainMode = 'medium') {
  const nodes = [];
  const out = audioCtx.createGain();
  out.connect(dest);

  const base = audioCtx.createBufferSource();
  base.buffer = noiseBuffer;
  base.loop = true;
  const filter = audioCtx.createBiquadFilter();
  const bed = audioCtx.createGain();
  base.connect(filter);
  filter.connect(bed);
  bed.connect(out);
  nodes.push(base);

  let nextAt = audioCtx.currentTime + 0.05;
  let event = null;
  let gap = () => 1;

  if (type === 'rain') {
    const p = { light: [700, 0.5, 0.09], medium: [1000, 0.65, 0.045], heavy: [1400, 0.85, 0.02] }[rainMode];
    filter.type = 'lowpass';
    filter.frequency.value = p[0];
    bed.gain.value = p[1];
    gap = () => p[2] * (0.4 + Math.random() * 1.2);
    event = (t) => raindrop(audioCtx, out, noiseBuffer, t);
  } else if (type === 'brown') {
    filter.type = 'lowpass';
    filter.frequency.value = 650;
    bed.gain.value = 0.8;
  } else if (type === 'library') {
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 0.5;
    bed.gain.value = 1.1;
    gap = () => 3 + Math.random() * 6;
    event = (t) => pageTurn(audioCtx, out, noiseBuffer, t);
  } else if (type === 'fire') {
    filter.type = 'lowpass';
    filter.frequency.value = 450;
    bed.gain.value = 0.85;
    gap = () => 0.04 + Math.random() * 0.35;
    event = (t) => crackle(audioCtx, out, noiseBuffer, t);
  } else if (type === 'waves') {
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    // 약 8초 주기로 소리가 커졌다 작아지며 밀려오는 느낌
    const lfo = audioCtx.createOscillator();
    const lfoFreq = audioCtx.createGain();
    const lfoVol = audioCtx.createGain();
    lfo.frequency.value = 0.125;
    lfoFreq.gain.value = 450;
    lfoVol.gain.value = 0.45;
    bed.gain.value = 0.6;
    lfo.connect(lfoFreq);
    lfoFreq.connect(filter.frequency);
    lfo.connect(lfoVol);
    lfoVol.connect(bed.gain);
    lfo.start();
    nodes.push(lfo);
  }
  base.start();

  return {
    out,
    schedule(until) {
      if (!event) return;
      while (nextAt < until) {
        event(nextAt);
        nextAt += gap();
      }
    },
    stop() {
      const t = audioCtx.currentTime;
      out.gain.setValueAtTime(out.gain.value, t);
      out.gain.linearRampToValueAtTime(0, t + 0.3);
      setTimeout(() => {
        nodes.forEach((n) => { try { n.stop(); } catch { /* 이미 멈춤 */ } });
        out.disconnect();
      }, 400);
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
  current = buildSound(ctx, master, type, noise, sound.rain);
  // 1.5초 앞까지 미리 예약 → 화면이 잠깐 멈춰도 소리가 끊기지 않음
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

function burst(audioCtx, dest, noiseBuffer, t, { freq, q, peak, decay, type = 'bandpass' }) {
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = audioCtx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  src.connect(f);
  f.connect(g);
  g.connect(dest);
  src.start(t, Math.random() * 3, decay + 0.05);
}

function raindrop(audioCtx, dest, noiseBuffer, t) {
  burst(audioCtx, dest, noiseBuffer, t, {
    freq: 1500 + Math.random() * 3000, q: 2 + Math.random() * 3, peak: 0.6 + Math.random() * 0.9, decay: 0.015 + Math.random() * 0.03,
  });
  // 가끔 '톡' 하는 물방울 소리
  if (Math.random() < 0.25) {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const f = 1200 + Math.random() * 1800;
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.03);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.06 + Math.random() * 0.06, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + 0.05);
  }
}

function pageTurn(audioCtx, dest, noiseBuffer, t) {
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = audioCtx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 2500;
  f.Q.value = 0.8;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.7, t + 0.1);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  src.connect(f);
  f.connect(g);
  g.connect(dest);
  src.start(t, Math.random() * 3, 0.5);
}

function crackle(audioCtx, dest, noiseBuffer, t) {
  burst(audioCtx, dest, noiseBuffer, t, {
    freq: 1800 + Math.random() * 2500, q: 4, peak: 0.8 + Math.random() * 1.2, decay: 0.006 + Math.random() * 0.012,
  });
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
