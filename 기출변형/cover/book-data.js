// 간지에 들어갈 데이터: 대단원·중단원 이름(개념서 목차 = lib/units.js), 중단원별 문항 수와 문항 번호 범위.
// 문항 번호는 중단원마다 01부터 다시 시작한다(wb-render.js의 renderUnits와 같음).
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { BOOKS } from '../lib/units.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const two = (n) => String(n).padStart(2, '0');

// 기출 포인트(대단원마다 한 줄) — 아직 정하지 않음. 문장이 정해지면 여기 넣는다. 키: 't1-1' 등
export const POINTS = {};

// edition: '1'(옛 02 기본편) · '2'(옛 03 심화편) · 'vol'(합본: 1차 + 2차 문항, 중단원 안에서 번호가 이어짐)
// 결과: [{ key:'t1-4', k: 0~9(엄지 색인 자리), subject:'통합사회1', no:'Ⅳ', title, units:[{no,title,count,range}], total, point,
//          levels:{상,중상,중,하}, types:[[유형, 문항 수]…](많은 순), hot:[{unit, title, stars, n}…](출제 빈도 높은 개념, 다룬 문항 많은 순) }]
// 간지의 '단원 분석'(2026-11-07 강사: 간지 아래가 허전하다)은 이 값으로 그린다. 출제 빈도(stars)는 개념서 개념 계획(content/_cc)의 값.
export const LEVELS = ['상', '중상', '중', '하'];
export async function chapters(edition) {
  const out = [];
  let k = 0;
  for (const book of Object.values(BOOKS)) {
    const units = [];
    const levels = Object.fromEntries(LEVELS.map((l) => [l, 0]));
    const types = {};
    const concepts = [];
    for (const u of book.units) {
      let qs = [];
      for (const ed of edition === 'vol' ? ['1', '2'] : [edition]) {
        const f = join(ROOT, 'content', ed, `${u.key}.js`);
        if (!existsSync(f)) continue;
        const m = (await import(pathToFileURL(f).href)).default;
        qs = qs.concat(m.questions || m);
      }
      const count = qs.length;
      const per = {}; // 개념 번호 → 문항 수
      for (const q of qs) {
        if (q.level in levels) levels[q.level] += 1;
        if (q.type) types[q.type] = (types[q.type] || 0) + 1;
        for (const c of Array.isArray(q.concept) ? q.concept : q.concept ? [q.concept] : []) per[+c] = (per[+c] || 0) + 1;
      }
      for (const c of u.concepts) concepts.push({ unit: u.no, title: String(c.title).split(' — ')[0], stars: c.stars || 1, n: per[+c.no] || 0 });
      units.push({ no: u.no, title: u.title, count, range: count ? `${two(1)}–${two(count)}` : '[000]–[000]' });
    }
    const hot = concepts.filter((c) => c.n > 0).sort((a, b) => b.stars - a.stars || b.n - a.n).slice(0, 5);
    out.push({
      key: book.key, k: k++, subject: book.subject, no: book.chapter.no, title: book.chapter.title, units, total: units.reduce((a, u) => a + u.count, 0), point: POINTS[book.key] || '[기출 포인트]',
      levels, types: Object.entries(types).sort((a, b) => b[1] - a[1]), hot,
    });
  }
  return out;
}
