// 문항 불러오기(검사 도구 공용): 차수별 단원별·모의고사 문항을 { id: 문항 } 으로
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export async function loadAll(eds = ['1', '2'], base = join(ROOT, 'content')) {
  const all = {};
  for (const ed of eds) for (const sub of ed === 'sp' ? [''] : ['', 'mock/']) {
    if (ed === 'sp') { // 예시문항 특강: 특강/content의 p-*.js·set.js
      const dir = join(ROOT, '특강', 'content');
      for (const f of readdirSync(dir).filter((f) => /^(p-\w|set)\.js$/.test(f))) {
        const m = (await import(pathToFileURL(join(dir, f)).href + `?t=${Date.now()}`)).default;
        for (const q of m.questions || m) all[q.id] = { ...q, _file: `특강/${f}` };
      }
      continue;
    }
    const dir = join(base, ed, sub);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
      const m = (await import(pathToFileURL(join(dir, f)).href + `?t=${Date.now()}`)).default;
      for (const q of m.questions || m) all[q.id] = { ...q, _file: `${ed}/${sub}${f}` };
    }
  }
  return all;
}
