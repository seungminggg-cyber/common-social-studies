// 정조준 시리즈 — 권 목록(데이터). 표지 문구는 여기서만 고친다.
// ground: paper(종이) · gray(회색 종이) · ink(먹, 글자 반전)
// [ ]로 둘러싼 값은 아직 정해지지 않은 자리 표시.
export const BRAND = { name: '승민T 통합사회', motto: ['효율적으로,', '효과적으로,', '확실하게.'], contact: '[학원 주소·연락처]' };
export const SERIES_TOTAL = 7;

export const VOLUMES = [
  { id: '01-t1', no: '01', word: '개념', sub: '수능 개념서', subject: '통합사회1', ground: 'paper' },
  { id: '01-t2', no: '01', word: '개념', sub: '수능 개념서', subject: '통합사회2', ground: 'paper' },
  { id: '02', no: '02', word: '기출분석', sub: '기출변형 문제집 · 기본편', subject: '통합사회1 + 통합사회2', ground: 'paper', edition: '1' },
  { id: '03', no: '03', word: '기출분석', sub: '기출변형 문제집 · 심화편', subject: '통합사회1 + 통합사회2', ground: 'gray', edition: '2' },
  { id: '04', no: '04', word: '수특분석', sub: '[수능특강 연계 분석 문제집]', subject: '통합사회1 + 통합사회2', ground: 'gray' },
  { id: '05', no: '05', word: '수완분석', sub: '[수능완성 연계 분석 문제집]', subject: '통합사회1 + 통합사회2', ground: 'gray' },
  { id: '06', no: '06', word: '실전', sub: '실전 모의고사', subject: '통합사회1 + 통합사회2', ground: 'ink' },
  { id: '07', no: '07', word: '파이널', sub: '[파이널 모의고사]', subject: '통합사회1 + 통합사회2', ground: 'ink' },
];
export const vol = (id) => VOLUMES.find((v) => v.id === id);
// 표지에 쓰는 짧은 이름: "기출분석 정조준 · 기본편"
export const shortName = (v) => `${v.word} 정조준${v.sub.includes('·') ? ' · ' + v.sub.split('·').pop().trim() : ''}`;
