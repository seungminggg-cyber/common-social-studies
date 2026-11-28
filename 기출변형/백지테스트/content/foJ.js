// 11/29 전범위 백지(작전고) Ⅴ-2·3 — 공통 쪽(fo)에 작전고 학습지 Ⅴ 주제4(IPCC·지속가능한 발전)를 더함.
import base from './fo.js';
const blocks = base.blocks.map((b) => (b.t === 'fill' ? { ...b, lines: [...b.lines, '지속가능한 발전: {미래 세대}의 필요를 해치지 않으며 현세대 필요 충족 / 기후 변화 과학 연구: {IPCC}'] } : b));
export default { ...base, blocks };
