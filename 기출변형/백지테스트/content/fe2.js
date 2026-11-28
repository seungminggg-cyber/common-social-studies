// 11/29 전범위 백지(작전고·서운고) Ⅴ-2·3 — 천연가스는 개념풀 기준만(강사 2026-11-21). 작전고 학습지 Ⅴ 주제3·4(IPCC·지속가능한 발전) 반영.
import base from './fe.js';
const blocks = base.blocks.map((b) => (b.t === 'fill' ? { ...b, lines: [
  b.lines[0],
  '천연가스 생산·소비 1위 {미국} / 기후 변화 과학 연구 국제기구 {IPCC}',
  b.lines[2], b.lines[3],
  '지속가능한 발전: {미래 세대}의 필요를 해치지 않으면서 현세대의 필요 충족 / 미래 예측: {델파이}·{시나리오} 기법',
] } : b));
export default { ...base, blocks };
