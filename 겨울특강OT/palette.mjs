// 색과 아이콘 목록 (art.mjs와 build.cjs가 같이 쓴다)
// 초록 칠판에 빔으로 쏘는 화면: 검정(#000) = 빛을 안 쏘는 곳 = 칠판 색 그대로.
// 그래서 바탕은 검정, 글자·선은 밝은 네온(하늘·민트·분필 노랑·분홍)만 쓴다. 빨강·진한 파랑·보라는 칠판 위에서 탁해진다.
export const COLORS = {
  bg: '000000',
  text: 'FFFFFF',
  sub: 'B9CAD6', // 보조 글자(밝은 회청색)
  dim: '6F8796', // 흐린 글자·선(약하게 보여야 하는 것)
  line: '2E5C78', // 가는 테두리
  neon: '2BE4FF', // 미니맵 통합사회1 네온(하늘) — 주 강조
  mint: '7CFFB2', // 미니맵 통합사회1 서울 표시(민트) — 해결·좋은 쪽
  yellow: 'FFE066', // 분필 노랑 — 숫자·경고
  pink: 'FF5FDC', // 미니맵 통합사회2 네온(분홍) — 통합사회2
  gray: '8FA3B0',
};
const ALL = ['cyan', 'mint', 'yellow', 'pink', 'white', 'gray'];
export const ICONS = Object.fromEntries([
  'school', 'books', 'target', 'news', 'writing', 'scale', 'percentage', 'world', 'bulb', 'coin', 'gavel',
  'file-text', 'calendar', 'calendar-week', 'alert-triangle', 'run', 'stairs-up', 'trophy', 'chart-dots-3',
  'hourglass-high', 'brain', 'book-off', 'pencil', 'square-check', 'clipboard-text', 'temperature', 'leaf',
  'calculator', 'chart-bar', 'stopwatch', 'circles-relation', 'sitemap', 'player-pause', 'eye-off', 'user-check',
  'zoom-question', 'stars', 'users', 'map-2', 'notebook', 'pencil-question', 'sunrise', 'moon', 'flag',
  'report-analytics', 'video', 'message', 'shield-lock', 'chalkboard', 'device-mobile', 'repeat', 'clock',
  'map-pin', 'phone', 'cards', 'headphones', 'list-check', 'bell', 'route', 'sparkles', 'mood-smile', 'book-2', 'checklist',
].map((n) => [n, ALL]));
