// 11/29 전범위 백지(계산여고) Ⅴ-2·3 — 공통 쪽(fe)에 계산여고 학습지의 환경 협약(IMG_3938)을 더함.
import base from './fe.js';
const treaty = {
  t: 'table', kind: '비교 표', title: '환경 문제 해결을 위한 국제 협약', wide: true, head: '26mm',
  cols: ['', '다루는 문제'],
  rows: [
    ['람사르 협약', '**습지** 보호'],
    ['몬트리올 의정서', '**오존층** 파괴 물질 규제'],
    ['바젤 협약', '**유해 폐기물** 이동 규제'],
  ],
};
export default { ...base, blocks: [...base.blocks.slice(0, 2), treaty, ...base.blocks.slice(2)] };
