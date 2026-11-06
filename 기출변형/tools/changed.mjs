// 바뀐 문항 뽑기 — 다음 검수는 바뀐 문항만 본다(강사 결정 2026-11-06)
//   node tools/changed.mjs                기준(마지막 검수 커밋, 참고/검수기준.txt)과 지금을 비교
//   node tools/changed.mjs <커밋>          다른 기준과 비교
//   node tools/changed.mjs --ids          쉼표로 이은 id만 출력(explain-check --ids, page-check --only 에 그대로 넣기)
// 문항 내용(발문·자료·보기·선지·정답·해설·보충 설명·난이도 등)이 하나라도 다르면 '바뀜'. src(내부 메모)만 바뀐 것은 뺀다.
import { execSync, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { loadAll, ROOT } from './load.mjs';

const args = process.argv.slice(2);
const idsOnly = args.includes('--ids');
const ref = args.find((a) => !a.startsWith('--')) || readFileSync(join(ROOT, '참고/검수기준.txt'), 'utf8').trim().split(/\s+/)[0];
const repo = execSync('git rev-parse --show-toplevel', { cwd: ROOT }).toString().trim();
const rel = ROOT.slice(repo.length + 1);

// 기준 시점의 content 폴더를 임시 폴더에 꺼낸다(개념서·그림 코드 import가 되도록 textbook을 링크)
const tmp = mkdtempSync(join(tmpdir(), 'wb-ref-'));
// 한글 폴더 이름이 그대로 나오게 -z 로 받고, 셸을 거치지 않고 git을 부른다
const git = (...a) => execFileSync('git', ['-c', 'core.quotepath=off', ...a], { cwd: repo, maxBuffer: 64 << 20 });
const files = git('ls-tree', '-r', '-z', '--name-only', ref, '--', `${rel}/content`).toString().split('\0').filter(Boolean);
for (const f of files) {
  const out = join(tmp, f);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, git('show', `${ref}:${f}`));
}
symlinkSync(join(repo, 'textbook'), join(tmp, 'textbook'));
const before = await loadAll(['1', '2'], join(tmp, rel, 'content'));
const now = await loadAll();
rmSync(tmp, { recursive: true, force: true });

const strip = (q) => { const { src, _file, ...rest } = q; return JSON.stringify(rest); };
const added = Object.keys(now).filter((id) => !before[id]);
const removed = Object.keys(before).filter((id) => !now[id]);
const changed = Object.keys(now).filter((id) => before[id] && strip(before[id]) !== strip(now[id]));
if (idsOnly) { console.log([...added, ...changed].join(',')); process.exit(0); }
console.log(`기준: ${ref}`);
console.log(`새 문항 ${added.length}: ${added.join(' ') || '-'}`);
console.log(`바뀐 문항 ${changed.length}: ${changed.join(' ') || '-'}`);
console.log(`없어진 문항 ${removed.length}: ${removed.join(' ') || '-'}`);
