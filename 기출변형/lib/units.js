// 단원 목록 — 개념서(textbook/content)의 책·중단원·개념 이름을 그대로 가져온다.
import t11 from '../../textbook/content/t1-1.js';
import t12 from '../../textbook/content/t1-2.js';
import t13 from '../../textbook/content/t1-3.js';
import t14 from '../../textbook/content/t1-4.js';
import t15 from '../../textbook/content/t1-5.js';
import t21 from '../../textbook/content/t2-1.js';
import t22 from '../../textbook/content/t2-2.js';
import t23 from '../../textbook/content/t2-3.js';
import t24 from '../../textbook/content/t2-4.js';
import t25 from '../../textbook/content/t2-5.js';

const raw = { 't1-1': t11, 't1-2': t12, 't1-3': t13, 't1-4': t14, 't1-5': t15, 't2-1': t21, 't2-2': t22, 't2-3': t23, 't2-4': t24, 't2-5': t25 };

// BOOKS['t2-2'] = { key, subject, chapter: { no, title }, units: [{ no, title, key: 't2-04', concepts: [{ no, title, stars }] }] }
export const BOOKS = {};
export const UNITS = {}; // 't2-04' → { ...unit, book }
for (const [key, b] of Object.entries(raw)) {
  const sub = key.slice(0, 2);
  BOOKS[key] = {
    key, subject: b.subject, chapter: b.chapter,
    units: b.units.map((u) => {
      const unit = {
        no: u.no, title: u.title, key: `${sub}-${u.no}`, book: key,
        concepts: u.concept.filter((x) => x.t === 'concept').map((c) => ({ no: c.no, title: String(c.title).replace(/\*\*/g, ''), stars: c.stars || 1 })),
      };
      UNITS[unit.key] = unit;
      return unit;
    }),
  };
}
