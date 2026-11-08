// MINIMAX 단원 문항(1차·2차) 규칙 점검: 금지 사상가, <보기> A·B·C 순서, 세 명 조합 위치, 계산 문항 공식
import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
const ROOT = '/workspace/common-social-studies/기출변형/content';
const out = [];
const txt = (q) => JSON.stringify({ s: q.stem, d: q.data, b: q.bogi, c: q.choices });
for (const ed of ['1', '2']) {
  for (const f of fs.readdirSync(path.join(ROOT, ed)).filter((f) => /^t[12]-\d\d\.js$/.test(f)).sort()) {
    const m = (await import(pathToFileURL(path.join(ROOT, ed, f)).href)).default;
    for (const q of m.questions || m) {
      const t = txt(q); const issues = [];
      for (const w of ['테일러', '레건', '아퀴나스']) if (t.includes(w)) issues.push('금지사상가:' + w);
      // <보기>가 'A:' 'B:' 처럼 기호로 시작하면 순서 확인
      if (q.bogi) {
        const keys = q.bogi.map((b) => (String(b).match(/^\s*\(?([A-E]|[가-라])\)?\s*[:：]/) || [])[1]).filter(Boolean);
        const ordA = 'ABCDE', ordK = '가나다라';
        const idx = keys.map((k) => ordA.includes(k) ? ordA.indexOf(k) : ordK.indexOf(k));
        if (keys.length >= 2 && idx.some((v, i) => i && v < idx[i - 1])) issues.push('보기순서:' + keys.join(''));
      }
      // 학생 고르기 선지: 세 명 조합이 ①~③에 있음
      const people = q.choices.map((c) => String(c).split(/,\s*/).filter((x) => /^[갑을병정무]$/.test(x.trim())).length);
      if (people.every((n) => n >= 1) && people.slice(0, 3).some((n) => n >= 3)) issues.push('세명조합위치:' + people.join(''));
      // 계산 문항인데 발문·자료에 식(=, ÷, ×)이 없음
      if (q.type === '계산' && !/[=÷×]/.test(JSON.stringify({ s: q.stem, d: q.data }))) issues.push('공식없음');
      if (issues.length) out.push({ id: q.id, ed, unit: f.replace('.js', ''), level: q.level, type: q.type, issues });
    }
  }
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
const c = {}; out.forEach((o) => o.issues.forEach((i) => { const k = i.split(':')[0]; c[k] = (c[k] || 0) + 1; }));
console.log('문항', out.length, c);
