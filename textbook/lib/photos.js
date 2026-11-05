// 사진 자료 (위키미디어 공용에서 라이선스를 확인하고 내려받은 사진)
// assets/photos/<id>.jpg + assets/photos/credits.json { id: { caption, title, author, license, licenseUrl, page } }
// 사진마다 저작자·라이선스를 그림 아래와 책 끝 '사진 출처' 쪽에 적는다 (CC BY·CC BY-SA 조건)
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const DIR = new URL('../assets/photos/', import.meta.url).pathname;
let CREDITS = null;
export function credits() {
  if (!CREDITS) CREDITS = existsSync(DIR + 'credits.json') ? JSON.parse(readFileSync(DIR + 'credits.json', 'utf8')) : {};
  return CREDITS;
}
export function hasPhoto(id) {
  return !!id && existsSync(`${DIR}${id}.jpg`) && !!credits()[id];
}
export const photoUrl = (id) => pathToFileURL(`${DIR}${id}.jpg`).href;
// 짧은 출처 (그림 아래): "작가 / CC BY-SA 4.0"
export function shortCredit(id) {
  const c = credits()[id];
  if (!c) return '';
  const who = (c.author || '').replace(/\s*\(.*?\)\s*/g, ' ').trim() || '작자 미상';
  if (/^CC0/i.test(c.license)) return `${who} / CC0`;
  return /public domain|^PD/i.test(c.license) ? `${who} / 퍼블릭 도메인` : `${who} / ${c.license}`;
}
// 책 안에서 쓴 사진 id 모으기 (사진 블록 + 사상가 초상)
export function collectPhotos(root) {
  const used = new Set();
  const walk = (x) => {
    if (Array.isArray(x)) return x.forEach(walk);
    if (!x || typeof x !== 'object') return;
    if (x.t === 'photo') for (const it of x.items || []) if (hasPhoto(it.src)) used.add(it.src);
    if (x.t === 'thinker' && hasPhoto(x.photo)) used.add(x.photo);
    Object.values(x).forEach(walk);
  };
  walk(root);
  return [...used];
}
