import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
const ROOT = '/workspace/common-social-studies/기출변형/content';
const res = { banExplain: [], bogiOrder: [] };
const lab = (s) => { const m = String(s).match(/^\s*(?:\(([가-라])\)|([A-E])(?=[는은와과의가이,·\s:]|국|시기|지역))/); return m ? (m[1] ? '가나다라'.indexOf(m[1]) + 10 : 'ABCDE'.indexOf(m[2])) : null; };
for (const ed of ['1', '2']) for (const f of fs.readdirSync(path.join(ROOT, ed)).filter((f) => /^t[12]-\d\d\.js$/.test(f)).sort()) {
  const m = (await import(pathToFileURL(path.join(ROOT, ed, f)).href)).default;
  for (const q of m.questions || m) {
    const ex = (q.explain || '') + (q.note || '');
    for (const w of ['테일러', '레건', '아퀴나스']) if (ex.includes(w)) res.banExplain.push({ id: q.id, w });
    if (q.bogi) {
      const ls = q.bogi.map(lab).filter((v) => v !== null);
      if (ls.length >= 3 && ls.some((v, i) => i && v < ls[i - 1])) res.bogiOrder.push({ id: q.id, seq: ls.map((v) => v >= 10 ? '(' + '가나다라'[v - 10] + ')' : 'ABCDE'[v]).join('') });
    }
  }
}
fs.writeFileSync(process.argv[2], JSON.stringify(res, null, 1));
console.log('해설에 금지 사상가', res.banExplain.length, [...new Set(res.banExplain.map((x) => x.id))].join(' '));
console.log('보기 순서 의심', res.bogiOrder.length, res.bogiOrder.map((x) => x.id + ':' + x.seq).join(' '));
