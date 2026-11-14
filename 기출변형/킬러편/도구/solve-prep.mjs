// 정답 가리고 다시 풀기 준비(킬러편 단원 문항용)
//   node 킬러편/도구/solve-prep.mjs <저장 폴더> <단원키…>      예: node 킬러편/도구/solve-prep.mjs /tmp/s/b1 t2-08 t2-10
//   → <저장 폴더>/문제만.json(정답·해설·출처 뺀 문항, 책에 실리는 순서), 정답.json, 문제 쪽 그림 p-*.png
//   검토자에게는 킬러편/검토지시.md + 이 폴더를 준다. 정답.json은 검토자에게 보여 주지 않는다(출제자가 대조).
//   ※ 기출변형 폴더에서 실행한다.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const [dest, ...keys] = process.argv.slice(2);
if (!dest || !keys.length) { console.error('사용: node 킬러편/도구/solve-prep.mjs <저장 폴더> <단원키…>'); process.exit(1); }
mkdirSync(dest, { recursive: true });
const order = existsSync('content/k/order.json') ? JSON.parse(readFileSync('content/k/order.json', 'utf8')) : {};
const qs = [];
for (const k of keys) {
  let list = (await import(pathToFileURL(join(process.cwd(), 'content/k', `${k}.js`)).href + `?t=${Date.now()}`)).default;
  if (order[k]) { const pos = new Map(order[k].map((id, i) => [id, i])); list = [...list].sort((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9)); }
  qs.push(...list);
}
writeFileSync(join(dest, '문제만.json'), JSON.stringify(qs.map((q, i) => { const { answer, explain, note, src, kplan, ...r } = q; return { no: i + 1, ...r }; }), null, 1));
writeFileSync(join(dest, '정답.json'), JSON.stringify(qs.map((q, i) => ({ no: i + 1, id: q.id, answer: q.answer }))));
// 문제 쪽 그림: 그 단원만 빌드
execFileSync('node', ['build.mjs', 'k', 'units', ...keys], { stdio: ['ignore', 'pipe', 'inherit'] });
const pdf = join('out', 'k', `단원별-${keys.join('_')}-학생용.pdf`);
for (const f of readdirSync(dest).filter((f) => /^p-\d+\.png$/.test(f))) rmSync(join(dest, f));
execFileSync('pdftoppm', ['-r', '100', '-png', pdf, join(dest, 'p')]);
console.log(`${qs.length}문항 → ${dest} (${readdirSync(dest).filter((f) => f.endsWith('.png')).length}쪽 그림)`);
