// 문제 팩 자동 반영
// 강사 계정으로 앱을 열면, 아직 들어가지 않은(또는 새 버전이 나온) 문제 팩을 Firebase에 자동으로 넣습니다.
// - 같은 팩을 여러 번 넣어도 문제가 중복되지 않음 (문제마다 고정된 ID 사용)
// - 새 버전에서 빠진 문제는 지움
// - 처음 한 번은 예전 교육과정 샘플 문제도 정리
import {
  collection, doc, getDocs, query, where, writeBatch, setDoc,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { S } from './store.js';
import { toast } from './lib/util.js';
import { LEGACY_SAMPLE_TEXTS } from './seed.js';
import t1u12 from './content/t1-u12.js';
import t1u3 from './content/t1-u3.js';
import t1u4 from './content/t1-u4.js';
import t1u5 from './content/t1-u5.js';

export const PACKS = [t1u12, t1u3, t1u4, t1u5];

let running = false;
let finishedThisSession = false;

async function commitInChunks(ops) {
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    ops.slice(i, i + 400).forEach((op) => op(batch));
    await batch.commit();
  }
}

export async function syncPacks() {
  if (running || finishedThisSession) return;
  if (S.role !== 'teacher' || !S.configLoaded) return;
  const applied = S.config?.packs || {};
  const todo = PACKS.filter((p) => (applied[p.id] || 0) < p.version);
  const needCleanup = !S.config?.legacySamplesRemoved;
  if (!todo.length && !needCleanup) {
    finishedThisSession = true;
    return;
  }

  running = true;
  try {
    let added = 0;
    const ops = [];
    const deletedByTeacher = new Set(S.config?.deletedPackItems || []);
    for (const pack of todo) {
      const base = Date.now();
      const wanted = { quizzes: new Set(), cards: new Set() };
      const items = [
        ...pack.quizzes.map((q) => ['quizzes', q]),
        ...pack.cards.map((c) => ['cards', c]),
      ];
      // 이 팩에서 이미 들어가 있는 문제들 (강사님이 고친 것은 그대로 둠)
      const existing = {};
      for (const col of ['quizzes', 'cards']) {
        existing[col] = await getDocs(query(collection(db, col), where('pack', '==', pack.id)));
      }
      const edited = new Set(['quizzes', 'cards'].flatMap((col) => existing[col].docs.filter((d) => d.data().edited).map((d) => d.id)));
      items.forEach(([col, { key, ...data }], i) => {
        const id = `${pack.id}-${key}`;
        wanted[col].add(id);
        if (edited.has(id) || deletedByTeacher.has(id)) return;
        ops.push((b) => b.set(doc(db, col, id), { ...data, pack: pack.id, createdAt: base + i }));
        added += 1;
      });
      // 새 버전에서 빠진 문제 정리 (강사님이 고친 문제는 남김)
      for (const col of ['quizzes', 'cards']) {
        existing[col].docs
          .filter((d) => !wanted[col].has(d.id) && !d.data().edited)
          .forEach((d) => ops.push((b) => b.delete(d.ref)));
      }
    }

    if (needCleanup) {
      for (const col of ['quizzes', 'cards']) {
        const all = await getDocs(collection(db, col));
        all.docs
          .filter((d) => !d.data().pack && LEGACY_SAMPLE_TEXTS.has(d.data().question || d.data().body || d.data().front))
          .forEach((d) => ops.push((b) => b.delete(d.ref)));
      }
    }

    await commitInChunks(ops);
    await setDoc(doc(db, 'config', 'app'), {
      packs: Object.fromEntries(todo.map((p) => [p.id, p.version])),
      legacySamplesRemoved: true,
    }, { merge: true });

    finishedThisSession = true;
    if (added) toast(`새 문제·카드 ${added}개를 자동으로 반영했어요.`);
  } catch (err) {
    console.error('문제 팩 반영 실패', err);
    toast('새 문제를 반영하지 못했어요. 새로고침하면 다시 시도해요.', 'error');
  } finally {
    running = false;
  }
}
