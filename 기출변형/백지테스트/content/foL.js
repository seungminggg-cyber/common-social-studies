// 11/29 전범위 백지(계양고·계산여고) Ⅴ-2·3 — 공통 쪽(fo)에 학습지의 LNG 기준(2022)을 더함(강사 2026-11-21).
import base from './fo.js';
const blocks = base.blocks.map((b) => (b.t === 'fill' ? { ...b, lines: [...b.lines, 'LNG(액화 천연가스)만 보면: 수출 1위 {카타르}, 수입 1위 {일본}'] } : b));
export default { ...base, blocks };
