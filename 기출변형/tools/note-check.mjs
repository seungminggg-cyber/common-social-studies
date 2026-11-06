// 보충 설명(note) 검사
//   1) 강사가 정한 '교과 범위' 문항(참고/교과범위.json)에 note가 모두 있는지
//   2) note·해설에 내부 이름(u09, tb/, .txt, _cc 등)이 그대로 나오지 않는지
//   3) note가 너무 짧지 않은지(200자 미만 알림 — 무엇인지·선지 판단·개념서와의 관계를 다 쓰면 보통 그보다 김)
//   node tools/note-check.mjs
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadAll, ROOT } from './load.mjs';
const all = await loadAll();
const must = JSON.parse(readFileSync(join(ROOT, '참고/교과범위.json'), 'utf8')).ids;
const out = [];
for (const id of must) if (!all[id]) out.push(`${id}: 문항이 없음(바뀌었으면 교과범위.json도 고칠 것)`); else if (!all[id].note) out.push(`${id}: 교과 범위 문항인데 보충 설명 없음`);
const INNER = /\bu[01]\d\b|tb\/|\.txt\b|_cc\b|content\/|scratchpad/;
for (const q of Object.values(all)) {
  for (const k of ['explain', 'note', 'stem']) if (q[k] && INNER.test(q[k])) out.push(`${q.id}: ${k}에 내부 이름 '${q[k].match(INNER)[0]}'`);
  if (q.note && q.note.length < 200) out.push(`${q.id}: 보충 설명이 짧음(${q.note.length}자)`);
}
const n = Object.values(all).filter((q) => q.note).length;
console.log(out.length ? out.join('\n') : '문제 없음');
console.log(`(보충 설명 있는 문항 ${n} / 전체 ${Object.keys(all).length}, 교과 범위 ${must.length}문항)`);
