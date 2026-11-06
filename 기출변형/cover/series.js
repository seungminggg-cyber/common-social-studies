// 정조준 시리즈 — 권 목록(데이터). 표지 문구는 여기서만 고친다.
// ground: white(흰 종이) · ink(먹, 글자 반전)  — 강사 의견(2026-11-06): 회색 바탕은 쓰지 않음
// (1차 시안의 paper·gray는 tokens.js에 남아 있음)
// [ ]로 둘러싼 값은 아직 정해지지 않은 자리 표시.
export const BRAND = { name: '승민T 통합사회', motto: ['효율적으로,', '효과적으로,', '확실하게.'], contact: '[학원 주소·연락처]' };
export const SERIES_TOTAL = 7;

export const VOLUMES = [
  { id: '01-t1', no: '01', word: '개념', sub: '수능 개념서', subject: '통합사회1', ground: 'white' },
  { id: '01-t2', no: '01', word: '개념', sub: '수능 개념서', subject: '통합사회2', ground: 'white' },
  { id: '02', no: '02', word: '기출분석', sub: '기출변형 문제집 · 기본편', subject: '통합사회1 + 통합사회2', ground: 'white', edition: '1' },
  { id: '03', no: '03', word: '기출분석', sub: '기출변형 문제집 · 심화편', subject: '통합사회1 + 통합사회2', ground: 'white', edition: '2' },
  { id: '04', no: '04', word: '수특분석', sub: '[수능특강 연계 분석 문제집]', subject: '통합사회1 + 통합사회2', ground: 'white' },
  { id: '05', no: '05', word: '수완분석', sub: '[수능완성 연계 분석 문제집]', subject: '통합사회1 + 통합사회2', ground: 'white' },
  { id: '06', no: '06', word: '실전', sub: '실전 모의고사', subject: '통합사회1 + 통합사회2', ground: 'ink' },
  { id: '07', no: '07', word: '파이널', sub: '[파이널 모의고사]', subject: '통합사회1 + 통합사회2', ground: 'ink' },
];
export const vol = (id) => VOLUMES.find((v) => v.id === id);

// 책등 두께 = 본문 장수 × 한 장 두께 + 표지 두께 × 2  (용지가 정해지면 PAPER 값만 바꾼다)
// 가정값(강사 확인 전): 본문 모조 80g ≈ 0.1mm/장, 표지 250g 아트지 ≈ 0.25mm
export const PAPER = { sheetMm: 0.1, coverMm: 0.25 };
// 쪽수(가정, 2026-11-06 계산): 02 기본편 = 합본 단원별 146쪽(node build.mjs 1 units, 속표지·차례 포함)
//   + 대단원 간지 10 + 간지를 오른쪽 쪽에 놓기 위한 빈 쪽(최대 10) + 모의고사 36 → 약 202 → 4의 배수 204쪽
//   정답과 해설(56쪽)은 별책으로 가정. 실제 쪽수는 표지·간지를 넣은 합본 빌드에서 다시 센다.
export const PAGES = { '02': 204, '03': null };
export const spineMm = (pages, p = PAPER) => +((pages / 2) * p.sheetMm + 2 * p.coverMm).toFixed(1);
// 표지에 쓰는 짧은 이름: "기출분석 정조준 · 기본편"
export const shortName = (v) => `${v.word} 정조준${v.sub.includes('·') ? ' · ' + v.sub.split('·').pop().trim() : ''}`;
