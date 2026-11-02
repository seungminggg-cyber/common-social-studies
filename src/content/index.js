// 앱에 함께 들어 있는 문제 팩 목록
// 이 문제들은 Firebase에서 읽지 않고 앱 안에서 바로 불러옵니다. (무료 사용량 절약)
// Firebase에는 강사님이 직접 만든 문제(custom)와 고친 문제(edited)만 저장됩니다.
import t1u12 from './t1-u12.js';
import t1u3 from './t1-u3.js';
import t1u4 from './t1-u4.js';
import t1u5 from './t1-u5.js';
import t2u12 from './t2-u12.js';
import t2u345 from './t2-u345.js';

export const PACKS = [t1u12, t1u3, t1u4, t1u5, t2u12, t2u345];

// 순서: 팩 순서대로, 팩 안에서는 작성 순서대로 (createdAt 값을 작게 줘서 직접 만든 문제보다 앞에 오게)
function build(kind) {
  const out = [];
  PACKS.forEach((pack, p) => {
    pack[kind].forEach(({ key, ...data }, i) => {
      out.push({ ...data, id: `${pack.id}-${key}`, pack: pack.id, createdAt: p * 100000 + i });
    });
  });
  return out;
}

export const PACK_QUIZZES = build('quizzes');
export const PACK_CARDS = build('cards');
export const PACK_BY_ID = new Map([...PACK_QUIZZES, ...PACK_CARDS].map((x) => [x.id, x]));
