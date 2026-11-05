// 시안 H 견본 — z-sample-f(04 단원 + 개념 카드)에서
//  1) 나누는 방식을 '개념 01~07' 하나로: A·B·C 큰 묶음 제목을 빼고, 해석 연습 묶음은 글자 없이 제목만
//  2) 한 장 정리도 묶음 없이 개념만 나열
//  3) 수능형 문제마다 관련 개념(concept)과 문제 유형(type)을 붙임
import base from './z-sample-f.js';

const u = base.units[0];

const concept = u.concept
  .filter((b) => !(b.t === 'sec' && ['A', 'B', 'C'].includes(b.mark)))
  .map((b) => (b.t === 'sec' ? { ...b, mark: '' } : b));

// 문제 번호 순서대로: [관련 개념, 문제 유형]
const TAGS = [
  ['02', '사상가 입장'], ['05', '사상가 입장'], ['05', '사상가 비교'], ['06', '자료 해석'], ['03', '개념 이해'],
  ['02', '사례 적용'], ['06', '글 해석'], ['05', '사례 적용'], ['05', '질문 분류표'], ['04', '자료 해석'], ['07', '입장 비교'],
];
const exam = u.exam.map((q, i) => ({ ...q, concept: TAGS[i]?.[0], type: TAGS[i]?.[1] }));

const summary = {
  ...u.summary,
  branches: undefined,
  concepts: u.summary.branches.flatMap((br) => br.concepts),
};

export default { ...base, units: [{ ...u, concept, exam, summary }] };
