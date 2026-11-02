// 뽀모도로 타이머
// '끝나는 시각'을 기억하는 방식이라, 폰 화면을 끄거나 다른 앱에 다녀와도 시간이 정확합니다.
import { chime } from './audio.js';

const KEY = 'tongsa:pomo';

export const pomo = {
  focus: 25,
  brk: 5,
  phase: 'focus', // 'focus' | 'break'
  running: false,
  endAt: 0,
  remaining: 25 * 60 * 1000,
};

try {
  Object.assign(pomo, JSON.parse(localStorage.getItem(KEY) || '{}'));
} catch { /* 저장된 값이 없으면 기본값 */ }

let onFocusDone = () => {};
let onUpdate = () => {};
let ticker = null;

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(pomo)); } catch { /* 무시 */ }
}

export function initPomodoro({ focusDone, update }) {
  onFocusDone = focusDone;
  onUpdate = update;
  if (pomo.running) startTicker();
}

export function remainingMs() {
  return pomo.running ? Math.max(0, pomo.endAt - Date.now()) : pomo.remaining;
}

export function formatMs(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startTicker() {
  clearInterval(ticker);
  ticker = setInterval(tick, 500);
  tick();
}

function tick() {
  if (!pomo.running) return;
  if (Date.now() >= pomo.endAt) {
    finishPhase();
    return;
  }
  onUpdate();
}

function finishPhase() {
  const wasFocus = pomo.phase === 'focus';
  pomo.running = false;
  clearInterval(ticker);
  pomo.phase = wasFocus ? 'break' : 'focus';
  pomo.remaining = (wasFocus ? pomo.brk : pomo.focus) * 60 * 1000;
  save();
  chime();
  if (wasFocus) onFocusDone();
  onUpdate(wasFocus ? 'focusDone' : 'breakDone');
}

export function toggle() {
  if (pomo.running) {
    pomo.remaining = remainingMs();
    pomo.running = false;
    clearInterval(ticker);
  } else {
    pomo.endAt = Date.now() + pomo.remaining;
    pomo.running = true;
    startTicker();
  }
  save();
  onUpdate();
}

export function reset() {
  pomo.running = false;
  clearInterval(ticker);
  pomo.phase = 'focus';
  pomo.remaining = pomo.focus * 60 * 1000;
  save();
  onUpdate();
}

export function switchPhase() {
  pomo.running = false;
  clearInterval(ticker);
  pomo.phase = pomo.phase === 'focus' ? 'break' : 'focus';
  pomo.remaining = (pomo.phase === 'focus' ? pomo.focus : pomo.brk) * 60 * 1000;
  save();
  onUpdate();
}

export function setDurations(focus, brk) {
  pomo.focus = focus;
  pomo.brk = brk;
  if (!pomo.running) pomo.remaining = (pomo.phase === 'focus' ? focus : brk) * 60 * 1000;
  save();
  onUpdate();
}
