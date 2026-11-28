// 조합형 선지 점검(다수결 찍기·쉬운 보기 탈락): node 기출변형/학교모의고사/tools/combo-check.mjs $PWD/기출변형/학교모의고사/content/<파일>.js …
// 선지가 'ㄱ, ㄴ' 또는 '갑, 을' 꼴인 문항에서, k개 이상 선지에 나온 글자 모음이 정답과 같은지, 글자별 등장 수, 한 글자 판정 시 빠지는 선지 수를 보여 준다.
const files = process.argv.slice(2);
const SYM = /^[ㄱ-ㅁ갑을병정무(가)(나)(다)(라)(마)\s,·]+$/;
for (const f of files) {
  const { default: m } = await import(f);
  for (const q of m.questions) {
    if (!q.choices.every((c) => SYM.test(c.replace(/[()]/g, '')) || /^[ㄱ-ㅁ](, ?[ㄱ-ㅁ])*$/.test(c))) continue;
    const sets = q.choices.map((c) => c.split(/[,·]\s*/).map((s) => s.trim()).filter(Boolean));
    const letters = [...new Set(sets.flat())].sort();
    const ans = new Set(sets[q.answer - 1]);
    const cnt = Object.fromEntries(letters.map((l) => [l, sets.filter((s) => s.includes(l)).length]));
    const maj = (k) => letters.filter((l) => cnt[l] >= k).join('');
    const ansStr = [...ans].sort().join('');
    const bad = [2, 3, 4].filter((k) => maj(k) === ansStr);
    const elim = letters.map((l) => `${l}${ans.has(l) ? '○' : '×'}${ans.has(l) ? 5 - cnt[l] : cnt[l]}`).join(' ');
    const all5 = letters.filter((l) => cnt[l] === 5);
    console.log(`${q.id} 정답 ${q.answer}(${ansStr}) | 등장 ${letters.map((l) => l + cnt[l]).join(' ')} | 판정 시 빠지는 수 ${elim} | 다수결 일치 k=${bad.join(',') || '없음'}${all5.length ? ' | 모든 선지: ' + all5.join('') : ''}`);
  }
}
