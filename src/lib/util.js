// 날짜, 알림창, 복사 등 여러 화면에서 함께 쓰는 기능

export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey() {
  return dateKey(new Date());
}

export function parseDateKey(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

const KOR_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function prettyDate(key) {
  const d = parseDateKey(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${KOR_DAYS[d.getDay()]})`;
}

// 시험 날짜로 D-Day 자동 계산
export function ddayText(examDate) {
  if (!examDate) return '';
  const today = parseDateKey(todayKey());
  const exam = parseDateKey(examDate);
  const diff = Math.round((exam - today) / 86400000);
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return 'D-Day';
  return '시험 종료';
}

let toastTimer = null;
export function toast(message, type = 'ok') {
  const box = document.getElementById('toast');
  if (!box) return;
  box.textContent = message;
  box.dataset.type = type;
  box.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.add('hidden'), type === 'error' ? 4500 : 2600);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

// 유튜브 주소에서 영상 ID만 뽑아냄 (11자리 영문·숫자·-·_)
export function youtubeId(url) {
  const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  return m ? m[1] : '';
}

// http/https 주소만 허용 (javascript: 같은 위험한 주소 차단)
export function safeUrl(url) {
  try {
    const u = new URL(String(url || '').trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch {
    return '';
  }
}

// 빈칸 정답 비교: 띄어쓰기·대소문자 무시, '/' 나 ',' 로 여러 정답 허용
export function normalizeAnswer(s) {
  return String(s || '').replace(/\s+/g, '').toLowerCase();
}

export function isBlankCorrect(input, answer) {
  const given = normalizeAnswer(input);
  if (!given) return false;
  return String(answer || '')
    .split(/[\/,]/)
    .map(normalizeAnswer)
    .filter(Boolean)
    .includes(given);
}

export function firstAnswer(answer) {
  return String(answer || '').split(/[\/,]/)[0].trim();
}

export function newId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function clampNumber(v, min, max, fallback = min) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function isKakaoInApp() {
  return /KAKAOTALK/i.test(navigator.userAgent);
}

export function isInAppBrowser() {
  return /KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(inapp|Line\/|everytimeApp|DaumApps/i.test(navigator.userAgent);
}
