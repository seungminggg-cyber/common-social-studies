// 데이터 정리 (강사 계정으로 앱을 열 때 한 번만 실행)
// 예전에는 문제 팩을 Firebase에 통째로 복사해 넣었지만, 이제는 앱 안에서 바로 불러옵니다.
// (학생이 앱을 열 때마다 문제 수백 개를 읽으면 Firebase 무료 사용량을 금방 넘기 때문)
//
// 그래서 한 번만 다음을 정리합니다.
// - 예전에 복사해 넣은 문제 팩 사본 중 강사님이 고치지 않은 것 → 삭제 (앱 안에 같은 문제가 있음)
// - 강사님이 직접 만든 문제 → '직접 만든 문제(custom)' 표시를 붙여 계속 보이게 함
// - 예전 교육과정 샘플 문제 → 삭제
import {
  collection, doc, getDocs, writeBatch, setDoc,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { S } from './store.js';
import { LEGACY_SAMPLE_TEXTS } from './seed.js';

let running = false;
let done = false;

async function commitInChunks(ops) {
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    ops.slice(i, i + 400).forEach((op) => op(batch));
    await batch.commit();
  }
}

export async function syncPacks() {
  if (running || done) return;
  if (S.role !== 'teacher' || !S.configLoaded) return;
  if (S.config?.contentV2) {
    done = true;
    return;
  }
  running = true;
  try {
    const ops = [];
    for (const col of ['quizzes', 'cards']) {
      const snap = await getDocs(collection(db, col));
      snap.docs.forEach((d) => {
        const x = d.data();
        if (x.pack) {
          if (!x.edited) ops.push((b) => b.delete(d.ref));
        } else if (LEGACY_SAMPLE_TEXTS.has(x.question || x.body || x.front)) {
          ops.push((b) => b.delete(d.ref));
        } else if (!x.custom) {
          ops.push((b) => b.update(d.ref, { custom: true }));
        }
      });
    }
    await commitInChunks(ops);
    await setDoc(doc(db, 'config', 'app'), { contentV2: true, legacySamplesRemoved: true }, { merge: true });
    done = true;
  } catch (err) {
    console.error('데이터 정리 실패', err);
  } finally {
    running = false;
  }
}
