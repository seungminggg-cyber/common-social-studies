// Firestore 보안 규칙 자동 테스트
// 실행: npx firebase-tools emulators:exec --only firestore "npm run test:rules"
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs,
} from 'firebase/firestore';

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-rules-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  // 규칙을 무시하고 기본 데이터 준비
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'admins/teacher'), { name: '승민T' });
    await setDoc(doc(db, 'config/app'), { appTitle: '테스트' });
    await setDoc(doc(db, 'schools/a'), { name: 'A고' });
    await setDoc(doc(db, 'schools/b'), { name: 'B고' });
    await setDoc(doc(db, 'schools/a/videos/v1'), { title: 'A 영상' });
    await setDoc(doc(db, 'schools/b/videos/v1'), { title: 'B 영상' });
    await setDoc(doc(db, 'quizzes/q1'), { type: 'ox', question: 'Q', answer: 'O' });
    await setDoc(doc(db, 'users/stuA'), { name: '김A', schoolId: 'a', status: 'approved' });
    await setDoc(doc(db, 'users/stuB'), { name: '이B', schoolId: 'b', status: 'approved' });
    await setDoc(doc(db, 'users/wait'), { name: '박대기', schoolId: 'a', status: 'pending' });
    await setDoc(doc(db, 'reports/stuA'), { homeworkRate: 90, scores: [] });
    await setDoc(doc(db, 'reports/stuB'), { homeworkRate: 80, scores: [] });
  });
});

const as = (uid) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

test('로그인하지 않으면 학교·퀴즈·학생 정보를 볼 수 없다', async () => {
  await assertFails(getDoc(doc(anon(), 'schools/a')));
  await assertFails(getDoc(doc(anon(), 'quizzes/q1')));
  await assertFails(getDoc(doc(anon(), 'users/stuA')));
  await assertFails(getDoc(doc(anon(), 'reports/stuA')));
  await assertSucceeds(getDoc(doc(anon(), 'config/app')));
});

test('학생은 자기 학교 영상만 볼 수 있다', async () => {
  await assertSucceeds(getDoc(doc(as('stuA'), 'schools/a/videos/v1')));
  await assertFails(getDoc(doc(as('stuA'), 'schools/b/videos/v1')));
});

test('승인 대기 학생은 퀴즈와 학교 자료를 볼 수 없다', async () => {
  await assertFails(getDoc(doc(as('wait'), 'quizzes/q1')));
  await assertFails(getDoc(doc(as('wait'), 'schools/a/videos/v1')));
  await assertSucceeds(getDoc(doc(as('wait'), 'users/wait')));
});

test('학생은 다른 학생의 정보·성적을 볼 수 없다', async () => {
  await assertSucceeds(getDoc(doc(as('stuA'), 'reports/stuA')));
  await assertFails(getDoc(doc(as('stuA'), 'reports/stuB')));
  await assertFails(getDoc(doc(as('stuA'), 'users/stuB')));
  await assertFails(getDocs(collection(as('stuA'), 'users')));
  await assertFails(getDoc(doc(as('stuA'), 'users/stuB/days/2026-11-02')));
});

test('학생은 자기 성적과 승인 상태를 바꿀 수 없다', async () => {
  await assertFails(setDoc(doc(as('stuA'), 'reports/stuA'), { homeworkRate: 100 }));
  await assertFails(updateDoc(doc(as('stuA'), 'users/stuA'), { status: 'approved', schoolId: 'b' }));
  await assertFails(updateDoc(doc(as('wait'), 'users/wait'), { status: 'approved' }));
  await assertSucceeds(updateDoc(doc(as('stuA'), 'users/stuA'), { retryCards: ['c1'] }));
});

test('스스로 관리자가 될 수 없다', async () => {
  await assertFails(setDoc(doc(as('stuA'), 'admins/stuA'), { name: '해커' }));
});

test('신규 가입은 승인 대기 상태로만 가능하다', async () => {
  const db = as('newbie');
  await assertFails(setDoc(doc(db, 'users/newbie'), {
    name: '신입', schoolId: 'a', status: 'approved', provider: 'google', email: '', createdAt: 1,
  }));
  await assertFails(setDoc(doc(db, 'users/newbie'), {
    name: '신입', schoolId: 'zzz', status: 'pending', provider: 'google', email: '', createdAt: 1,
  }));
  await assertFails(setDoc(doc(db, 'users/someoneElse'), {
    name: '신입', schoolId: 'a', status: 'pending', provider: 'google', email: '', createdAt: 1,
  }));
  await assertSucceeds(setDoc(doc(db, 'users/newbie'), {
    name: '신입', schoolId: 'a', status: 'pending', provider: 'google', email: '', createdAt: 1,
  }));
});

test('학생은 자기 플래너·오답노트만 쓸 수 있다', async () => {
  await assertSucceeds(setDoc(doc(as('stuA'), 'users/stuA/days/2026-11-02'), { goal: '화이팅' }));
  await assertSucceeds(setDoc(doc(as('stuA'), 'users/stuA/weak/q1'), { question: 'Q' }));
  await assertFails(setDoc(doc(as('stuA'), 'users/stuB/days/2026-11-02'), { goal: '장난' }));
  await assertFails(setDoc(doc(as('wait'), 'users/wait/days/2026-11-02'), { goal: '대기중' }));
});

test('제보는 자기 학교에만, 자기 이름으로만 쓸 수 있다', async () => {
  const ok = { text: '서술형 나와요', authorUid: 'stuA', authorName: '김A', createdAt: 1 };
  await assertSucceeds(setDoc(doc(as('stuA'), 'schools/a/intels/i1'), ok));
  await assertFails(setDoc(doc(as('stuA'), 'schools/b/intels/i2'), ok));
  await assertFails(setDoc(doc(as('stuA'), 'schools/a/intels/i3'), { ...ok, authorName: '이B' }));
  await assertFails(setDoc(doc(as('stuB'), 'schools/a/intels/i4'), { ...ok, authorUid: 'stuB', authorName: '이B' }));
  await assertFails(deleteDoc(doc(as('stuB'), 'schools/a/intels/i1')));
});

test('수강 인증은 본인 것만 쓸 수 있다', async () => {
  const path = 'schools/a/videos/v1/summaries';
  await assertSucceeds(setDoc(doc(as('stuA'), `${path}/stuA`), { text: '롤스 정의', name: '김A', updatedAt: 1 }));
  await assertFails(setDoc(doc(as('stuA'), `${path}/other`), { text: '대리 인증', name: '김A', updatedAt: 1 }));
  await assertFails(getDocs(collection(as('stuA'), path)));
});

test('학생은 퀴즈·학교 정보·앱 설정을 수정할 수 없다', async () => {
  await assertFails(setDoc(doc(as('stuA'), 'quizzes/q2'), { question: '가짜' }));
  await assertFails(updateDoc(doc(as('stuA'), 'schools/a'), { notice: '휴강!' }));
  await assertFails(setDoc(doc(as('stuA'), 'config/app'), { appTitle: '해킹' }));
});

test('강사는 모든 학생 정보와 성적을 관리할 수 있다', async () => {
  const t = as('teacher');
  await assertSucceeds(getDocs(collection(t, 'users')));
  await assertSucceeds(updateDoc(doc(t, 'users/wait'), { status: 'approved' }));
  await assertSucceeds(setDoc(doc(t, 'reports/stuB'), { homeworkRate: 100 }));
  await assertSucceeds(getDoc(doc(t, 'schools/b/videos/v1')));
  await assertSucceeds(setDoc(doc(t, 'quizzes/q9'), { question: '새 문제' }));
  await assertSucceeds(getDoc(doc(t, 'users/stuA/days/2026-11-02')));
});
