// 앱 전체 데이터와 Firebase 실시간 연결을 관리합니다.
// Firebase에서 데이터가 바뀌면 자동으로 화면을 다시 그립니다. (예전 12초마다 확인하던 방식 대신)
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc, collection, onSnapshot, getDoc, query, where, documentId,
} from 'firebase/firestore';
import { auth, db } from './firebase.js';
import { todayKey, dateKey } from './lib/util.js';

function loadPref(key, fallback) {
  try {
    const v = localStorage.getItem('tongsa:' + key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function savePref(key, value) {
  try { localStorage.setItem('tongsa:' + key, JSON.stringify(value)); } catch { /* 저장 못 해도 괜찮음 */ }
}

const now = new Date();

export const S = {
  authReady: false,
  user: null,
  isTeacher: false,
  profile: undefined, // undefined = 불러오는 중, null = 가입 정보 없음
  role: '', // 'teacher' | 'student' | 'pending' | 'new'
  config: null,
  configLoaded: false,
  schools: [],
  schoolsLoaded: false,
  quizzes: [],
  cards: [],
  report: null,
  weak: [],
  today: null, // 오늘 날짜 기록 (퀴즈 답, 뽀모도로 횟수, 플래너)
  todayKey: todayKey(),
  days: {}, // 달력에 보이는 날짜들의 기록
  daysRange: '',
  school: { id: '', videos: [], materials: [], intels: [], summaries: {}, loaded: false },
  t: { users: [], reports: {} }, // 강사 전용 데이터
  ui: {
    tab: loadPref('tab', 'quiz'),
    quizTab: 'ox',
    blur: true,
    fcFilter: 'all',
    fcIndex: 0,
    fcFlipped: false,
    localAnswers: {}, // 강사가 미리보기로 푼 답 (저장 안 함)
    localRetry: [],
    schoolId: loadPref('schoolId', ''),
    studyTab: loadPref('studyTab', 'planner'),
    calY: now.getFullYear(),
    calM: now.getMonth() + 1,
    selDate: todayKey(),
    adminTab: loadPref('adminTab', 'dashboard'),
    adminFilter: '',
    printMode: '',
    loginMode: 'login',
    busy: false,
    summaryView: null, // 강사: 수강 인증 현황 { videoId, title, rows }
    pomoTitle: '',
  },
};

// ---------- 화면 다시 그리기 예약 ----------
let renderFn = () => {};
let scheduled = false;
export function onRender(fn) {
  renderFn = fn;
}
export function refresh() {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    renderFn();
  }, 0);
}

// ---------- 실시간 연결 관리 ----------
const subs = new Map();

function listen(key, ref, onData) {
  stop(key);
  const unsub = onSnapshot(
    ref,
    (snap) => {
      onData(snap);
      refresh();
    },
    (err) => {
      console.warn(`[${key}]`, err.code || err.message);
    },
  );
  subs.set(key, unsub);
}

function stop(key) {
  const unsub = subs.get(key);
  if (unsub) unsub();
  subs.delete(key);
}

function stopPrefix(prefix) {
  [...subs.keys()].filter((k) => k.startsWith(prefix)).forEach(stop);
}

const list = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const byCreated = (a, b) => (a.createdAt || 0) - (b.createdAt || 0);
const byCreatedDesc = (a, b) => (b.createdAt || 0) - (a.createdAt || 0);
const bySchoolOrder = (a, b) => (a.order ?? 99) - (b.order ?? 99) || String(a.name).localeCompare(String(b.name), 'ko');

// 앱 이름·공지 (로그인 전에도 필요)
listen('config', doc(db, 'config', 'app'), (snap) => {
  S.config = snap.exists() ? snap.data() : null;
  S.configLoaded = true;
});

// ---------- 로그인 상태 ----------
onAuthStateChanged(auth, async (user) => {
  stopPrefix('p:');
  setRole('');
  S.user = user;
  S.isTeacher = false;
  S.profile = user ? undefined : null;
  S.authReady = true;
  refresh();
  if (!user) return;

  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    if (auth.currentUser?.uid !== user.uid) return; // 그사이 다른 계정으로 바뀐 경우
    S.isTeacher = adminDoc.exists();
  } catch {
    S.isTeacher = false;
  }

  listen('p:profile', doc(db, 'users', user.uid), (snap) => {
    S.profile = snap.exists() ? { id: snap.id, ...snap.data() } : null;
    updateRole();
  });
  if (S.isTeacher) updateRole();
});

function updateRole() {
  if (S.isTeacher) setRole('teacher');
  else if (S.profile === undefined) setRole('');
  else if (!S.profile) setRole('new');
  else setRole(S.profile.status === 'approved' ? 'student' : 'pending');
}

function setRole(next) {
  if (next === S.role) return;
  S.role = next;
  stopPrefix('r:');
  stopPrefix('s:');
  S.schools = [];
  S.schoolsLoaded = false;
  S.quizzes = [];
  S.cards = [];
  S.report = null;
  S.weak = [];
  S.today = null;
  S.days = {};
  S.daysRange = '';
  S.school = { id: '', videos: [], materials: [], intels: [], summaries: {}, loaded: false };
  S.t = { users: [], reports: {} };
  if (!next) return;

  const uid = S.user.uid;

  listen('r:schools', collection(db, 'schools'), (snap) => {
    S.schools = list(snap).sort(bySchoolOrder);
    S.schoolsLoaded = true;
  });

  if (next === 'teacher' || next === 'student') {
    listen('r:quizzes', collection(db, 'quizzes'), (snap) => {
      S.quizzes = list(snap).sort(byCreated);
    });
    listen('r:cards', collection(db, 'cards'), (snap) => {
      S.cards = list(snap).sort(byCreated);
    });
  }

  if (next === 'teacher') {
    listen('r:users', collection(db, 'users'), (snap) => {
      S.t.users = list(snap).sort((a, b) => String(a.name).localeCompare(String(b.name), 'ko'));
      S.t.usersLoaded = true;
    });
    listen('r:reports', collection(db, 'reports'), (snap) => {
      S.t.reports = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
    });
  }

  if (next === 'student') {
    listen('r:report', doc(db, 'reports', uid), (snap) => {
      S.report = snap.exists() ? snap.data() : null;
    });
    listen('r:weak', collection(db, 'users', uid, 'weak'), (snap) => {
      S.weak = list(snap).sort(byCreatedDesc);
    });
  }
  refresh();
}

// 화면을 그리기 전에 필요한 실시간 연결이 켜져 있는지 확인
export function ensureWatches() {
  if (S.role === 'student') {
    const tk = todayKey();
    if (tk !== S.todayKey || !subs.has('r:today')) {
      S.todayKey = tk;
      listen('r:today', doc(db, 'users', S.user.uid, 'days', tk), (snap) => {
        S.today = snap.exists() ? snap.data() : {};
      });
    }
    watchDays();
    watchSchool(S.profile.schoolId);
  } else if (S.role === 'teacher') {
    const ids = S.schools.map((s) => s.id);
    if (S.schoolsLoaded && ids.length && !ids.includes(S.ui.schoolId)) {
      S.ui.schoolId = ids[0];
    }
    watchSchool(S.ui.schoolId);
  }
}

// 달력에 보이는 달(앞뒤 1주 포함)의 플래너만 불러옴
function watchDays() {
  const { calY, calM } = S.ui;
  const start = dateKey(new Date(calY, calM - 1, 1 - 7));
  const end = dateKey(new Date(calY, calM, 7));
  const range = `${start}~${end}`;
  if (range === S.daysRange) return;
  S.daysRange = range;
  S.days = {};
  const q = query(
    collection(db, 'users', S.user.uid, 'days'),
    where(documentId(), '>=', start),
    where(documentId(), '<=', end),
  );
  listen('r:days', q, (snap) => {
    S.days = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
  });
}

function watchSchool(id) {
  if (S.school.id === (id || '')) return;
  stopPrefix('s:');
  S.school = { id: id || '', videos: [], materials: [], intels: [], summaries: {}, loaded: false };
  if (!id) return;
  const isStudent = S.role === 'student';
  listen('s:videos', collection(db, 'schools', id, 'videos'), (snap) => {
    S.school.videos = list(snap).sort(byCreatedDesc);
    S.school.loaded = true;
    if (isStudent) {
      S.school.videos.forEach((v) => {
        const key = `s:sum:${v.id}`;
        if (subs.has(key)) return;
        listen(key, doc(db, 'schools', id, 'videos', v.id, 'summaries', S.user.uid), (s) => {
          S.school.summaries[v.id] = s.exists() ? s.data().text : '';
        });
      });
    }
  });
  listen('s:materials', collection(db, 'schools', id, 'materials'), (snap) => {
    S.school.materials = list(snap).sort(byCreated);
  });
  listen('s:intels', collection(db, 'schools', id, 'intels'), (snap) => {
    S.school.intels = list(snap).sort(byCreatedDesc);
  });
}

// ---------- 자주 쓰는 계산 ----------
export function schoolName(id) {
  return S.schools.find((s) => s.id === id)?.name || '';
}

export function teacherName() {
  return S.config?.teacherName || '승민T';
}

export function appTitle() {
  return S.config?.appTitle || '승민T 통합사회 클래스';
}
