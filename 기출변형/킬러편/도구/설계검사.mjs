// 킬러편 설계 카드 검사: node 킬러편/도구/설계검사.mjs  (기출변형 폴더에서)
//  JSON 읽힘, 슬롯 수 = 배분.json, id 꼴·중복, 개념 번호, 유형·스킬 키, 이미 쓴 씨앗과 겹침, 근거 없는 슬롯
import { readFileSync, existsSync } from 'node:fs';
import { UNITS } from '../../lib/units.js';
const quota = JSON.parse(readFileSync('킬러편/배분.json', 'utf8'));
const used = JSON.parse(readFileSync('킬러편/설계/쓴씨앗.json', 'utf8'))['씨앗'];
const N = (s) => String(s || '').replace(/[\s·・]/g, '');
const usedSrc = used.map((u) => N(u.src));
const TYPES = ['개념 이해', '사례 적용', '자료 해석', '그래프 해석', '지도 해석', '사상가 입장', '사상가 비교', '입장 비교', '글 해석', '질문 분류표', '계산'];
let err = 0, warn = 0, total = 0;
const ids = new Set();
const skills = {}, types = {}, forms = [];
for (const [k, n] of Object.entries(quota)) {
  const f = `킬러편/설계/${k}.json`;
  if (!existsSync(f)) { console.log(`✗ ${k}: 설계 카드 없음`); err++; continue; }
  let c;
  try { c = JSON.parse(readFileSync(f, 'utf8')); } catch (e) { console.log(`✗ ${k}: JSON 오류 ${e.message}`); err++; continue; }
  const slots = c.slots || [];
  total += slots.length;
  if (slots.length !== n) { console.log(`✗ ${k}: 슬롯 ${slots.length} / 배분 ${n}`); err++; }
  const u = UNITS[k];
  for (const s of slots) {
    const w = `${k} ${s.id}`;
    if (!new RegExp(`^${k}-k-\\d{3}$`).test(s.id)) { console.log(`✗ ${w}: id 꼴`); err++; }
    if (ids.has(s.id)) { console.log(`✗ ${w}: id 중복`); err++; }
    ids.add(s.id);
    for (const cn of [].concat(s.concept || [])) if (!u.concepts.some((x) => +x.no === +cn)) { console.log(`✗ ${w}: 개념 ${cn} 없음(1~${u.concepts.length})`); err++; }
    if (!TYPES.includes(s.type)) { console.log(`! ${w}: 유형 '${s.type}'`); warn++; }
    if (!/^S\d\d$/.test(s.skill || '')) { console.log(`! ${w}: 스킬 '${s.skill}'`); warn++; }
    skills[s.skill] = (skills[s.skill] || 0) + 1;
    types[s.type] = (types[s.type] || 0) + 1;
    forms.push(s.kform || '');
    if (!(s.seeds || []).length) { console.log(`! ${w}: 근거 기출 없음`); warn++; }
    for (const sd of s.seeds || []) {
      if (!sd.no || /예시|학평|고1|고2/.test(sd.exam || '')) continue;
      const key = N(`${sd.exam}${sd.subject}${sd.no}번`);
      const hit = used.find((x, i) => usedSrc[i].includes(key));
      if (hit) { console.log(`! ${w}: 이미 쓴 씨앗 ${sd.exam} ${sd.subject} ${sd.no}번 (${hit.book} ${hit.id})`); warn++; }
    }
    if ((s.kcond || []).length < 3) { console.log(`! ${w}: 킬러 조건 ${(s.kcond || []).length}개`); warn++; }
  }
}
console.log(`\n슬롯 ${total} / 200 · 오류 ${err} · 알림 ${warn}`);
console.log('스킬: ' + Object.entries(skills).sort().map(([a, b]) => `${a} ${b}`).join(' · '));
console.log('유형: ' + Object.entries(types).sort((a, b) => b[1] - a[1]).map(([a, b]) => `${a} ${b}`).join(' · '));
const kw = ['순서도', '채점', '응답', '벤', '질문 분류', '좌표', '거품', '산점도', '편차', '지도', '계산', '사료', '밑줄', '퍼즐', '지우기', '역추론', '옳지 않은'];
console.log('형식 낱말: ' + kw.map((k) => `${k} ${forms.filter((f) => f.includes(k)).length}`).join(' · '));
process.exit(err ? 1 : 0);
