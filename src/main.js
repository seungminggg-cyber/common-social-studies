import './style.css';
import morphdom from 'morphdom';
import { S, onRender, refresh, ensureWatches, savePref, appTitle, schoolName } from './store.js';
import { html } from './lib/html.js';
import { toast } from './lib/util.js';
import { drafts } from './lib/drafts.js';
import { initPomodoro, remainingMs, formatMs, pomo } from './pomodoro.js';
import {
  loadingView, loginView, profileSetupView, pendingView, authActions, authErrorMessage,
} from './views/auth.js';
import { quizView, quizActions } from './views/quiz.js';
import { schoolView, schoolActions } from './views/school.js';
import { studyView, studyActions, printModal, addPomoCount } from './views/study.js';
import { teacherView, teacherActions } from './views/teacher.js';

const actions = {
  ...authActions, ...quizActions, ...schoolActions, ...studyActions, ...teacherActions,
  tab: (el) => {
    S.ui.tab = el.dataset.tab;
    savePref('tab', S.ui.tab);
    refresh();
    window.scrollTo({ top: 0 });
  },
};

// ---------- 화면 구성 ----------
function tabsFor() {
  const tabs = [
    { id: 'quiz', label: '오늘의 퀴즈', short: '퀴즈', icon: 'fa-bolt' },
    { id: 'school', label: '우리 학교', short: '우리 학교', icon: 'fa-school' },
  ];
  if (S.role === 'student') tabs.push({ id: 'study', label: '내 공부', short: '내 공부', icon: 'fa-calendar-check' });
  if (S.role === 'teacher') tabs.push({ id: 'admin', label: '강사 관리', short: '관리', icon: 'fa-sliders' });
  return tabs;
}

function appShell(content) {
  const tabs = tabsFor();
  const who = S.role === 'teacher'
    ? html`<span class="chip bg-rose-50 text-rose-700"><i class="fa-solid fa-chalkboard-user"></i>강사</span>`
    : html`<span class="chip bg-indigo-50 text-indigo-700">${schoolName(S.profile?.schoolId)} · ${S.profile?.name}</span>`;
  return html`
    <header class="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-9 h-9 shrink-0 rounded-xl bg-indigo-600 text-white flex items-center justify-center"><i class="fa-solid fa-earth-asia"></i></div>
          <h1 class="font-bold text-base sm:text-lg truncate">${appTitle()}</h1>
        </div>
        <nav class="hidden lg:flex items-center gap-1">
          ${tabs.map((t) => html`
            <button type="button" class="btn btn-sm !text-sm ${S.ui.tab === t.id ? 'bg-indigo-50 text-indigo-700' : 'btn-ghost'}" data-action="tab" data-tab="${t.id}">
              <i class="fa-solid ${t.icon}"></i>${t.label}
            </button>`)}
        </nav>
        <div class="flex items-center gap-2 shrink-0">
          <span class="hidden sm:inline-flex">${who}</span>
          <button type="button" class="btn btn-ghost btn-sm" data-action="logout" title="로그아웃"><i class="fa-solid fa-arrow-right-from-bracket"></i><span class="hidden sm:inline">로그아웃</span></button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-5 sm:py-6 pb-28 lg:pb-10">${content}</main>

    <nav class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
      <div class="grid" style="grid-template-columns: repeat(${tabs.length}, minmax(0, 1fr))">
        ${tabs.map((t) => html`
          <button type="button" class="flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${S.ui.tab === t.id ? 'text-indigo-600' : 'text-slate-500'}" data-action="tab" data-tab="${t.id}">
            <i class="fa-solid ${t.icon} text-lg"></i>${t.short}
          </button>`)}
      </div>
    </nav>
    ${S.role === 'student' ? printModal() : ''}
  `;
}

function view() {
  if (!S.authReady) return loadingView();
  if (!S.user) return loginView();
  if (!S.role) return loadingView();
  if (S.role === 'new') return profileSetupView();
  if (S.role === 'pending') return pendingView();

  const ids = tabsFor().map((t) => t.id);
  if (!ids.includes(S.ui.tab)) S.ui.tab = 'quiz';
  const content = {
    quiz: quizView,
    school: schoolView,
    study: studyView,
    admin: teacherView,
  }[S.ui.tab]();
  return appShell(content);
}

// ---------- 화면 그리기 (바뀐 부분만 갱신) ----------
const root = document.getElementById('app');

function isField(el) {
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT';
}

function render() {
  ensureWatches();
  const markup = `<div id="app">${view()}</div>`;
  morphdom(root, markup, {
    onBeforeElUpdated(fromEl, toEl) {
      if (fromEl.isEqualNode(toEl)) return false;
      if (isField(fromEl)) {
        // 지금 입력 중인 칸은 건드리지 않음
        if (fromEl === document.activeElement && fromEl.type !== 'range') return false;
        // 아직 저장 안 한 입력 내용은 유지
        if (fromEl.id && drafts.has(fromEl.id)) {
          const v = drafts.get(fromEl.id);
          if (toEl.tagName === 'SELECT') {
            [...toEl.options].forEach((o) => o.toggleAttribute('selected', o.value === v));
          } else {
            toEl.value = v;
          }
        }
      }
      return true;
    },
  });
}

onRender(render);

// ---------- 이벤트 연결 ----------
function errorMessage(err) {
  const authMsg = authErrorMessage(err);
  if (authMsg) return authMsg;
  if (err?.code === 'permission-denied') return '권한이 없어요. 다시 로그인하거나 강사님께 문의해 주세요.';
  if (err?.code === 'unavailable') return '인터넷 연결을 확인해 주세요.';
  return '문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
}

async function run(name, ...args) {
  const fn = actions[name];
  if (!fn) return;
  try {
    await fn(...args);
  } catch (err) {
    console.error(name, err);
    toast(errorMessage(err), 'error');
  }
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  if (el.tagName !== 'A') e.preventDefault();
  run(el.dataset.action, el, e);
});

document.addEventListener('submit', (e) => {
  const form = e.target;
  if (!form.dataset.submit) return;
  e.preventDefault();
  const data = new FormData(form);
  run(form.dataset.submit, form, e, data).then(() => {
    // 저장 후 비워진 칸은 임시 기억에서도 지움
    [...form.elements].forEach((el) => {
      if (!el.id) return;
      if (el.value === '') drafts.delete(el.id);
      else if (drafts.has(el.id)) drafts.set(el.id, el.value);
    });
  });
});

document.addEventListener('reset', (e) => {
  [...e.target.elements].forEach((el) => el.id && drafts.delete(el.id));
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.form && el.id && isField(el)) drafts.set(el.id, el.value);
  if (el.dataset?.input) run(el.dataset.input, el, e);
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.form && el.id && isField(el)) drafts.set(el.id, el.value);
  if (el.dataset?.change) run(el.dataset.change, el, e);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && S.ui.printMode) {
    S.ui.printMode = '';
    refresh();
  }
});

// ---------- 집중 타이머 ----------
let lastPomoSig = '';
initPomodoro({
  focusDone: () => {
    addPomoCount().catch((err) => console.error(err));
    toast('집중 시간 완주! 잠깐 쉬어가요.');
  },
  update: (evt) => {
    const text = formatMs(remainingMs());
    const display = document.getElementById('pomo-display');
    if (display) display.textContent = text;
    document.title = pomo.running ? `${text} · ${pomo.phase === 'focus' ? '집중' : '휴식'}` : appTitle();
    const sig = `${pomo.phase}|${pomo.running}|${pomo.focus}|${pomo.brk}`;
    if (sig !== lastPomoSig || evt) {
      lastPomoSig = sig;
      refresh();
    }
    if (evt === 'breakDone') toast('휴식 끝! 다음 집중을 시작해 볼까요?');
  },
});

// 자정이 지나면 '오늘' 기록을 새 날짜로 바꾸기 위해 1분마다 확인
setInterval(() => refresh(), 60 * 1000);

refresh();
