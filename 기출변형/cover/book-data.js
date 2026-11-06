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

// edition: '1'(02 기본편) · '2'(03 심화편)
// 결과: [{ key:'t1-4', k: 0~9(엄지 색인 자리), subject:'통합사회1', no:'Ⅳ', title, units:[{no,title,count,range}], total, point }]
export async function chapters(edition) {
  const out = [];
  let k = 0;
  for (const book of Object.values(BOOKS)) {
    const units = [];
    for (const u of book.units) {
      const f = join(ROOT, 'content', edition, `${u.key}.js`);
      let count = 0;
      if (existsSync(f)) {
        const m = (await import(pathToFileURL(f).href)).default;
        count = (m.questions || m).length;
      }
      units.push({ no: u.no, title: u.title, count, range: count ? `${two(1)}–${two(count)}` : '[000]–[000]' });
    }
    out.push({ key: book.key, k: k++, subject: book.subject, no: book.chapter.no, title: book.chapter.title, units, total: units.reduce((a, u) => a + u.count, 0), point: POINTS[book.key] || '[기출 포인트]' });
  }
  return out;
}
