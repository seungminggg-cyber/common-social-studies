// MINIMAX 시리즈 — 권 목록과 표지 문구(데이터). 문구는 여기서만 고친다. (강사 요청 2026-11-07)
// 시리즈 이름 MINIMAX: 게임이론의 '최악의 경우를 최소로 줄이는 최적의 선택' · 최소(MIN) 시간에 최대(MAX) 효과 · 승민의 MIN.
// ground: paper(종이) · gray(회색 종이) · ink(먹, 글자 반전) — 수능에 가까울수록 진해진다.
// [ ]로 둘러싼 값은 아직 정해지지 않은 자리 표시.
export const MM = {
  brand: '승민T 통합사회',
  reading: '미니맥스',
  meaning: 'MINIMAX — 최악의 경우를 최소로 줄이는 최적의 선택',
  // 뒷표지 대표 문장 아래 회색 한 줄(강사 2026-11-07: 뒷표지는 대표 문장 + 이 한 줄만)
  backLine: 'MINIMAX - 가장 효율적인 통합사회',
  exam: '2028 수능 대비 · 2022 개정 교육과정',
  total: '07',
  desc: ['기출 문항이 묻는 방식은 그대로 살리고,', '문장과 자료는 모두 새로 썼습니다.'],
  // 뒷표지 대표 문장 두 안(강사가 고름)
  motto: {
    1: { lines: ['최소의 시간으로,', '최대의 점수를.'] },
    2: { label: '승민주의 3원칙', lines: ['효율적으로,', '효과적으로,', '확실하게.'] },
  },
  contact: '[학원 주소·연락처]',
  isbn: '[ISBN·바코드]',
  price: '[정가 또는 비매품]',
};

// kind: 표지의 책 종류 줄, short: 시리즈 순서 줄에 쓰는 이름, subject: 과목 줄
export const MM_VOLUMES = [
  { id: '01-t1', no: '01', kind: '통합사회 개념', short: '개념', subject: '통합사회1', ground: 'paper' },
  { id: '01-t2', no: '01', kind: '통합사회 개념', short: '개념', subject: '통합사회2', ground: 'paper' },
  { id: '02', no: '02', kind: '통합사회 기출분석 · 기본편', short: '기출분석 기본편', subject: '통합사회1 + 통합사회2', ground: 'paper' },
  { id: '03', no: '03', kind: '통합사회 기출분석 · 심화편', short: '기출분석 심화편', subject: '통합사회1 + 통합사회2', ground: 'gray' },
  { id: '04', no: '04', kind: '통합사회 수특분석', short: '수특분석', subject: '통합사회1 + 통합사회2', ground: 'gray' },
  { id: '05', no: '05', kind: '통합사회 수완분석', short: '수완분석', subject: '통합사회1 + 통합사회2', ground: 'gray' },
  { id: '06', no: '06', kind: '통합사회 실전 모의고사', short: '실전 모의고사', subject: '통합사회1 + 통합사회2', ground: 'ink' },
  { id: '07', no: '07', kind: '통합사회 파이널', short: '파이널', subject: '통합사회1 + 통합사회2', ground: 'ink' },
];
export const mmVol = (id) => MM_VOLUMES.find((v) => v.id === id);
// 뒷표지 위쪽 이름: "MINIMAX 기출분석 · 기본편"
export const mmName = (v) => `MINIMAX ${v.kind.replace(/^통합사회 /, '')}`;
// 시리즈 순서(01 개념은 한 번만)
export const mmSeries = () => {
  const seen = new Set();
  return MM_VOLUMES.filter((v) => !seen.has(v.no) && seen.add(v.no));
};

// ── MINIMAP 개념서 (강사 2026-11-07) ──
// 작은 지도 한 장에서 온 세상을 다 보듯, 이 개념서에서 시작해 만점의 초석을 다진다.
// 통합사회1·2 두 권: 디자인은 같고 색만 다르다.
export const MMAP = {
  title: 'MINIMAP',
  brand: '승민T 통합사회',
  exam: '2028 수능 대비 · 2022 개정 교육과정',
  meaning: '작은 지도에서 온 세상을 보듯, 이 개념서에서 만점의 초석을 다진다',
  vols: [
    { id: 't1', n: 1, subject: '통합사회1', kind: '통합사회1 개념서' },
    { id: 't2', n: 2, subject: '통합사회2', kind: '통합사회2 개념서' },
  ],
};

// ── MAXIMIN 실전 모의고사 10회 (강사 2026-11-07) ──
// 최저점(MIN)을 만점(MAX)으로. 시리즈 공통: 어두운 바탕 + 직접 그린 네온 로고. 색은 실전 느낌의 진한 빨강·금색.
export const MAXI = {
  title: 'MAXIMIN',
  brand: '승민T 통합사회',
  kind: '통합사회 실전 모의고사 10회',
  subject: '통합사회1 + 통합사회2',
  exam: '2028 수능 대비 · 2022 개정 교육과정',
  meaning: '최저점(MIN)을 만점(MAX)으로',
};
