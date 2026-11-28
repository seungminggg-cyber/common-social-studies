// 11/29 전범위 백지(서운고) Ⅳ-2·3 — 공통 쪽(fp)에 서운고 학습지의 남북 합의 연표(IMG_4079)를 더함.
import base from './fp.js';
const blocks = base.blocks.map((b) => (b.t === 'fill' ? { ...b, lines: [...b.lines, '남북 합의: 1972 {7·4 남북 공동 성명} → 1991 UN {동시 가입} → 2000 {6·15} 남북 공동 선언'] } : b));
export default { ...base, blocks };
