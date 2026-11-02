// 오늘의 문제 고르기: 날짜마다 정해진 순서로 돌아가며 골라서
// 모든 학생이 같은 날 같은 문제를 풀고, 며칠에 걸쳐 전체 문제를 골고루 풀게 됩니다.

export const DAILY_OX = 7;
export const DAILY_BLANK = 3;

export function dayNumber(d = new Date()) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

// 문제 ID로 정해지는 섞인 순서 (문제가 추가돼도 기존 순서가 크게 흔들리지 않음)
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // 마지막 글자만 다른 ID들도 골고루 섞이도록 한 번 더 뒤섞기
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function rotate(items, count, salt = '') {
  const pool = [...items].sort((a, b) => hash(salt + a.id) - hash(salt + b.id));
  if (pool.length <= count) return pool;
  const start = (dayNumber() * count) % pool.length;
  return Array.from({ length: count }, (_, i) => pool[(start + i) % pool.length]);
}

const inSubject = (subject) => (x) => !subject || !x.subject || x.subject === subject;

export function todaysQuizzes(allQuizzes, subject = '') {
  const quizzes = allQuizzes.filter(inSubject(subject));
  return [
    ...rotate(quizzes.filter((q) => q.type === 'ox'), DAILY_OX, 'ox'),
    ...rotate(quizzes.filter((q) => q.type === 'blank'), DAILY_BLANK, 'bl'),
  ];
}

export function todaysCards(cards, count, subject = '') {
  return rotate(cards.filter(inSubject(subject)), count, 'card');
}

// 단원을 과목별로 묶기: [['통합사회1', [단원...]], ['통합사회2', [...]], ['기타', [...]]]
export function unitGroups(...lists) {
  const groups = new Map();
  lists.flat().forEach((x) => {
    if (!x.unit) return;
    const g = x.subject || '직접 추가한 문제';
    if (!groups.has(g)) groups.set(g, new Set());
    groups.get(g).add(x.unit);
  });
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'ko'))
    .map(([g, set]) => [g, [...set].sort((a, b) => a.localeCompare(b, 'ko'))]);
}

// 등록된 문제·카드에 있는 단원 이름 목록 (Ⅰ-1, Ⅰ-2, Ⅱ-1 … 순서)
export function unitList(...lists) {
  const set = new Set();
  lists.flat().forEach((x) => x.unit && set.add(x.unit));
  return [...set].sort((a, b) => a.localeCompare(b, 'ko'));
}
