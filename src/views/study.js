// 내 공부 탭 (학생 전용): 플래너, 집중 타이머, 성적·오답 노트
import { doc, setDoc, deleteDoc, increment } from 'firebase/firestore';
import { db } from '../firebase.js';
import { S, refresh, savePref, schoolName, teacherName } from '../store.js';
import { html } from '../lib/html.js';
import { dateKey, todayKey, prettyDate, toast, copyText, newId, clampNumber } from '../lib/util.js';
import { pomo, remainingMs, formatMs, toggle, reset, switchPhase, setDurations } from '../pomodoro.js';
import { SOUNDS, sound, playSound, setRainDensity, setVolume, unlockAudio } from '../audio.js';

const SUBJECTS = ['통합사회', '국어', '영어', '수학', '탐구', '수행평가', '기타'];

function dayData(key) {
  const d = S.days[key] || (key === S.todayKey ? S.today : null) || {};
  return { goal: d.goal || '', items: Array.isArray(d.items) ? d.items : [], pomo: d.pomo || 0 };
}

function avgProgress(items) {
  if (!items.length) return 0;
  return Math.round(items.reduce((sum, it) => sum + (Number(it.progress) || 0), 0) / items.length);
}

function summaryCard() {
  const r = S.report || {};
  const scores = Array.isArray(r.scores) ? r.scores : [];
  const latest = scores[scores.length - 1];
  const diff = latest ? latest.score - (latest.avg || 0) : null;
  const stat = (label, value, cls) => html`
    <div class="rounded-xl ${cls} p-3 text-center">
      <p class="text-xs font-medium opacity-80">${label}</p>
      <p class="text-xl font-bold mt-0.5">${value}</p>
    </div>`;
  return html`
    <section class="card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div class="space-y-1.5">
        <div class="flex items-center gap-2">
          <span class="chip bg-emerald-50 text-emerald-700"><i class="fa-solid fa-lock text-[10px]"></i>나만 보는 리포트</span>
          <span class="chip bg-slate-100 text-slate-600">${schoolName(S.profile.schoolId)}</span>
        </div>
        <h2 class="text-xl font-bold">${S.profile.name}의 공부 기록</h2>
        <p class="text-sm text-slate-600 leading-relaxed">
          <i class="fa-regular fa-comment-dots text-indigo-500 mr-1"></i><b>${teacherName()} 코멘트</b> ${r.comment || '꾸준히 복습하며 목표를 향해 달려가요!'}
        </p>
      </div>
      <div class="grid grid-cols-3 gap-2 shrink-0 lg:w-80">
        ${stat('숙제 수행률', r.homeworkRate !== undefined ? `${r.homeworkRate}%` : '-', 'bg-emerald-50 text-emerald-800')}
        ${stat('최근 테스트', latest ? `${latest.score}점` : '-', 'bg-indigo-50 text-indigo-800')}
        ${stat('반 평균 대비', diff === null ? '-' : `${diff >= 0 ? '+' : ''}${diff}점`, 'bg-amber-50 text-amber-800')}
      </div>
    </section>
  `;
}

// ---------- 플래너 ----------
function calendar() {
  const { calY, calM, selDate } = S.ui;
  const first = new Date(calY, calM - 1, 1).getDay();
  const days = new Date(calY, calM, 0).getDate();
  const today = todayKey();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(html`<div></div>`);
  for (let d = 1; d <= days; d++) {
    const key = dateKey(new Date(calY, calM - 1, d));
    const { items } = dayData(key);
    const avg = avgProgress(items);
    const sel = key === selDate;
    const dow = (first + d - 1) % 7;
    cells.push(html`
      <button type="button" data-action="pick-date" data-date="${key}"
        class="h-14 sm:h-16 rounded-lg p-1.5 text-left flex flex-col justify-between border transition
        ${sel ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 bg-white hover:border-indigo-300'}">
        <span class="text-xs font-semibold ${key === today ? 'inline-flex w-5 h-5 items-center justify-center rounded-full bg-indigo-600 text-white' : dow === 0 ? 'text-rose-500' : dow === 6 ? 'text-indigo-500' : 'text-slate-700'}">${d}</span>
        ${items.length ? html`<span class="text-[10px] font-semibold rounded px-1 ${avg >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}">${avg}%</span>` : ''}
      </button>
    `);
  }
  return html`
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <button type="button" class="btn btn-secondary btn-sm" data-action="cal-move" data-delta="-1" aria-label="이전 달"><i class="fa-solid fa-chevron-left"></i></button>
        <div class="flex items-center gap-2">
          <span class="font-bold">${calY}년 ${calM}월</span>
          <button type="button" class="btn btn-ghost btn-sm" data-action="cal-today">오늘</button>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" data-action="cal-move" data-delta="1" aria-label="다음 달"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
      <div class="grid grid-cols-7 text-center text-xs font-medium text-slate-500">
        <span class="text-rose-500">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span class="text-indigo-500">토</span>
      </div>
      <div class="grid grid-cols-7 gap-1">${cells}</div>
    </div>
  `;
}

function dayPanel() {
  const key = S.ui.selDate;
  const { goal, items } = dayData(key);
  const avg = avgProgress(items);
  return html`
    <div class="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-4">
      <div class="flex items-center justify-between gap-2">
        <h3 class="font-bold">${prettyDate(key)}${key === todayKey() ? ' · 오늘' : ''}</h3>
        <span class="chip bg-indigo-600 text-white">달성률 ${avg}%</span>
      </div>
      <div>
        <label class="label" for="goal-input">오늘의 다짐</label>
        <input class="input" id="goal-input" data-change="save-goal" maxlength="100" value="${goal}" placeholder="예: 롤스·노직 비교 완벽 암기!" />
      </div>
      <form class="space-y-2 rounded-xl bg-white border border-slate-200 p-3" data-submit="add-plan">
        <p class="text-sm font-semibold">계획 추가</p>
        <div class="grid grid-cols-2 gap-2">
          <select class="input" id="plan-subject" name="subject">
            ${SUBJECTS.map((s) => html`<option value="${s}">${s}</option>`)}
          </select>
          <input class="input" id="plan-time" name="time" maxlength="30" placeholder="시간 (선택)" />
        </div>
        <div class="flex gap-2">
          <input class="input" id="plan-title" name="title" maxlength="100" placeholder="무엇을 공부할까요?" />
          <button class="btn btn-primary shrink-0">추가</button>
        </div>
      </form>
      ${items.length === 0 ? html`<div class="empty bg-white">이 날 계획이 없어요. 위에서 추가해 보세요!</div>` : html`
        <ul class="space-y-2">
          ${items.map((it) => html`
            <li class="rounded-xl bg-white border border-slate-200 p-3 space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <span class="text-xs text-indigo-600 font-semibold">${it.subject}${it.time ? ` · ${it.time}` : ''}</span>
                  <p class="text-sm font-semibold text-slate-900 ${it.progress >= 100 ? 'line-through text-slate-400' : ''}">${it.title}</p>
                </div>
                <div class="flex shrink-0">
                  <button type="button" class="btn btn-ghost btn-sm" data-action="plan-timer" data-id="${it.id}" title="집중 타이머와 연결"><i class="fa-solid fa-stopwatch"></i></button>
                  <button type="button" class="btn btn-ghost btn-sm hover:!text-rose-600" data-action="plan-delete" data-id="${it.id}" aria-label="삭제"><i class="fa-regular fa-trash-can"></i></button>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <input type="range" class="flex-1" min="0" max="100" step="10" value="${it.progress}" data-change="plan-progress" data-id="${it.id}" aria-label="진행률" />
                <span class="w-10 text-right text-xs font-semibold text-slate-600">${it.progress}%</span>
                <button type="button" class="btn btn-sm ${it.progress >= 100 ? 'bg-emerald-600 text-white' : 'btn-secondary'}" data-action="plan-done" data-id="${it.id}">완료</button>
              </div>
            </li>
          `)}
        </ul>
      `}
      <button type="button" class="btn btn-secondary w-full" data-action="plan-share"><i class="fa-solid fa-share-nodes"></i>이 날 플래너 카톡용으로 복사</button>
    </div>
  `;
}

function plannerSection() {
  return html`
    <section class="card">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${calendar()}
        ${dayPanel()}
      </div>
    </section>
  `;
}

// ---------- 집중 타이머 ----------
function timerSection() {
  const running = pomo.running;
  const isFocus = pomo.phase === 'focus';
  const preset = (f, b) => html`
    <button type="button" class="btn btn-sm ${pomo.focus === f && pomo.brk === b ? 'btn-primary' : 'btn-secondary'}" data-action="pomo-preset" data-focus="${f}" data-break="${b}">${f}분 + ${b}분</button>`;
  return html`
    <section class="card space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="card-title"><i class="fa-solid fa-stopwatch text-rose-500"></i>집중 타이머</h2>
          <p class="card-desc">${S.ui.pomoTitle ? html`지금 할 일: <b class="text-indigo-600">${S.ui.pomoTitle}</b>` : '플래너에서 시계 버튼을 누르면 할 일이 연결돼요.'}</p>
        </div>
        <div class="flex flex-wrap gap-1.5">${preset(25, 5)}${preset(50, 10)}${preset(100, 20)}</div>
      </div>

      <div class="rounded-2xl ${isFocus ? 'bg-slate-900' : 'bg-emerald-900'} text-white p-6 text-center space-y-4">
        <span id="pomo-phase" class="chip ${isFocus ? 'bg-indigo-500' : 'bg-emerald-500'} text-white">${isFocus ? '집중 시간' : '휴식 시간'}${running ? '' : ' · 대기'}</span>
        <div id="pomo-display" class="text-6xl sm:text-7xl font-bold tabular-nums tracking-wider">${formatMs(remainingMs())}</div>
        <div class="flex justify-center gap-2">
          <button type="button" class="btn ${running ? 'bg-white/15 hover:bg-white/25' : 'bg-indigo-500 hover:bg-indigo-400'} text-white px-8" data-action="pomo-toggle">
            <i class="fa-solid ${running ? 'fa-pause' : 'fa-play'}"></i>${running ? '일시정지' : '시작'}
          </button>
          <button type="button" class="btn bg-white/10 hover:bg-white/20 text-white" data-action="pomo-switch">${isFocus ? '휴식으로' : '집중으로'}</button>
          <button type="button" class="btn bg-white/10 hover:bg-white/20 text-white" data-action="pomo-reset" aria-label="초기화"><i class="fa-solid fa-rotate-left"></i></button>
        </div>
        <p class="text-sm text-slate-300">오늘 완주한 집중 시간 <b class="text-amber-300">${dayData(S.todayKey).pomo}회</b></p>
      </div>

      <div class="grid grid-cols-2 gap-3 max-w-sm">
        <div>
          <label class="label" for="pomo-focus">집중 (분)</label>
          <input class="input" id="pomo-focus" type="number" min="1" max="180" value="${pomo.focus}" data-change="pomo-custom" />
        </div>
        <div>
          <label class="label" for="pomo-break">휴식 (분)</label>
          <input class="input" id="pomo-break" type="number" min="1" max="60" value="${pomo.brk}" data-change="pomo-custom" />
        </div>
      </div>

      <div class="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
        <h3 class="font-semibold flex items-center gap-2"><i class="fa-solid fa-headphones text-indigo-500"></i>집중 사운드</h3>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
          ${SOUNDS.map((s) => html`
            <button type="button" class="btn btn-sm flex-col !gap-1 py-2.5 ${sound.type === s.id ? 'btn-primary' : 'btn-secondary'}" data-action="sound" data-id="${s.id}">
              <i class="fa-solid ${s.icon}"></i>${s.label}
            </button>`)}
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <label class="flex items-center gap-3 flex-1 text-sm text-slate-600">
            <i class="fa-solid fa-volume-low"></i>
            <input type="range" class="flex-1" min="5" max="100" value="${sound.volume}" data-input="sound-volume" aria-label="볼륨" />
          </label>
          ${sound.type === 'rain' ? html`
            <div class="seg !p-0.5 shrink-0">
              ${[['light', '보슬비'], ['medium', '빗방울'], ['heavy', '장대비']].map(([id, label]) => html`
                <button type="button" class="seg-btn !py-1 !text-xs ${sound.rain === id ? 'active' : ''}" data-action="rain-density" data-mode="${id}">${label}</button>`)}
            </div>` : ''}
        </div>
        <p class="text-xs text-slate-500"><i class="fa-brands fa-apple mr-1"></i>아이폰에서 소리가 안 나면 옆면의 무음 스위치를 꺼주세요. 화면을 끄면 소리도 멈춰요.</p>
      </div>
    </section>
  `;
}

// ---------- 성적·오답 ----------
function scoreSection() {
  const scores = Array.isArray(S.report?.scores) ? S.report.scores : [];
  return html`
    <section class="card space-y-4">
      <h2 class="card-title"><i class="fa-solid fa-chart-line text-indigo-500"></i>주간 테스트 성적</h2>
      ${scores.length === 0 ? html`<div class="empty">아직 등록된 성적이 없어요.</div>` : html`
        <div class="flex gap-4 text-xs text-slate-500">
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-indigo-600"></span>내 점수</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-slate-300"></span>반 평균</span>
        </div>
        <ul class="space-y-3">
          ${scores.map((s) => html`
            <li class="space-y-1">
              <div class="flex justify-between text-sm">
                <span class="font-medium text-slate-700">${s.week}</span>
                <span><b class="text-indigo-700">${s.score}점</b> <span class="text-slate-400">/ 평균 ${s.avg ?? '-'}점</span></span>
              </div>
              <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full bg-indigo-600" style="width:${Math.min(100, Number(s.score) || 0)}%"></div></div>
              <div class="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full bg-slate-300" style="width:${Math.min(100, Number(s.avg) || 0)}%"></div></div>
            </li>
          `)}
        </ul>
      `}
    </section>
  `;
}

function weakSection() {
  return html`
    <section class="card space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="card-title"><i class="fa-solid fa-bookmark text-rose-500"></i>오답 노트 <span class="text-slate-400 font-medium">${S.weak.length}</span></h2>
        <button type="button" class="btn btn-secondary btn-sm" data-action="print-open" ${S.weak.length ? '' : 'disabled'}><i class="fa-solid fa-print"></i>오답 시험지 만들기</button>
      </div>
      ${S.weak.length === 0 ? html`<div class="empty">퀴즈에서 틀린 문제가 여기에 자동으로 모여요.</div>` : html`
        <ul class="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          ${S.weak.map((w) => html`
            <li class="rounded-xl bg-rose-50/50 border border-rose-200 p-3 space-y-1 text-sm">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-semibold text-rose-600">${w.type === 'ox' ? 'O/X' : '빈칸'} · ${w.unit}</span>
                <button type="button" class="btn btn-ghost btn-sm !py-0.5" data-action="weak-delete" data-id="${w.id}">외웠어요</button>
              </div>
              <p class="text-slate-900 leading-relaxed">${w.question}</p>
              <p class="text-slate-600">${w.answerNote}</p>
            </li>
          `)}
        </ul>
      `}
    </section>
  `;
}

export function printModal() {
  if (!S.ui.printMode) return '';
  const showAnswer = S.ui.printMode === 'answer';
  return html`
    <div class="fixed inset-0 z-50 bg-slate-900/60 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 my-8">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h2 class="text-lg font-bold">시험 전날 오답 시험지</h2>
            <p class="text-sm text-slate-500">틀렸던 문제만 모아서 스스로 시험 봐요.</p>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" data-action="print-close" aria-label="닫기"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="seg">
            <button type="button" class="seg-btn ${!showAnswer ? 'active' : ''}" data-action="print-mode" data-mode="test">시험지 (정답 숨김)</button>
            <button type="button" class="seg-btn ${showAnswer ? 'active' : ''}" data-action="print-mode" data-mode="answer">정답·해설</button>
          </div>
          <button type="button" class="btn btn-primary btn-sm ml-auto" data-action="print-now"><i class="fa-solid fa-print"></i>인쇄 / PDF 저장</button>
        </div>
        <div id="print-sheet" class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 max-h-[60vh] overflow-y-auto text-sm">
          <h3 class="font-bold text-base">${S.profile.name} · 오답 시험지 (${S.weak.length}문항)</h3>
          ${S.weak.map((w, i) => html`
            <div class="bg-white rounded-lg border border-slate-200 p-3 space-y-1.5">
              <p class="font-medium leading-relaxed">${i + 1}. [${w.unit}] ${w.question}</p>
              ${showAnswer
                ? html`<p class="text-indigo-700">${w.answerNote}</p>`
                : html`<p class="text-slate-400">나의 답: (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>`}
            </div>
          `)}
        </div>
      </div>
    </div>
  `;
}

export function studyView() {
  const tab = S.ui.studyTab;
  const tabBtn = (id, icon, label) => html`
    <button type="button" class="seg-btn ${tab === id ? 'active' : ''}" data-action="study-tab" data-tab="${id}"><i class="fa-solid ${icon} mr-1"></i>${label}</button>`;
  return html`
    <div class="space-y-5">
      ${summaryCard()}
      <div class="seg max-w-md">
        ${tabBtn('planner', 'fa-calendar-check', '플래너')}
        ${tabBtn('timer', 'fa-stopwatch', '집중 타이머')}
        ${tabBtn('report', 'fa-chart-line', '성적·오답')}
      </div>
      ${tab === 'planner' ? plannerSection() : ''}
      ${tab === 'timer' ? timerSection() : ''}
      ${tab === 'report' ? html`<div class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">${scoreSection()}${weakSection()}</div>` : ''}
    </div>
  `;
}

// ---------- 동작 ----------
function dayRef(key) {
  return doc(db, 'users', S.user.uid, 'days', key);
}

async function saveItems(items) {
  await setDoc(dayRef(S.ui.selDate), { items }, { merge: true });
}

function mapItem(id, fn) {
  return dayData(S.ui.selDate).items.map((it) => (it.id === id ? fn(it) : it));
}

export async function addPomoCount() {
  if (S.role !== 'student') return;
  await setDoc(dayRef(S.todayKey), { pomo: increment(1) }, { merge: true });
}

export const studyActions = {
  'study-tab': (el) => {
    S.ui.studyTab = el.dataset.tab;
    savePref('studyTab', S.ui.studyTab);
    refresh();
  },
  'pick-date': (el) => {
    S.ui.selDate = el.dataset.date;
    refresh();
  },
  'cal-move': (el) => {
    let m = S.ui.calM + Number(el.dataset.delta);
    let y = S.ui.calY;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    S.ui.calM = m;
    S.ui.calY = y;
    refresh();
  },
  'cal-today': () => {
    const d = new Date();
    S.ui.calY = d.getFullYear();
    S.ui.calM = d.getMonth() + 1;
    S.ui.selDate = todayKey();
    refresh();
  },
  'save-goal': async (el) => {
    await setDoc(dayRef(S.ui.selDate), { goal: el.value.trim() }, { merge: true });
  },
  'add-plan': async (form, e, data) => {
    const title = String(data.get('title') || '').trim();
    if (!title) return toast('계획 내용을 입력해 주세요.', 'error');
    const items = [...dayData(S.ui.selDate).items, {
      id: newId('p'),
      subject: String(data.get('subject') || '통합사회'),
      time: String(data.get('time') || '').trim(),
      title,
      progress: 0,
    }];
    form.elements.title.value = '';
    form.elements.time.value = '';
    await saveItems(items);
  },
  'plan-progress': async (el) => {
    await saveItems(mapItem(el.dataset.id, (it) => ({ ...it, progress: clampNumber(el.value, 0, 100) })));
  },
  'plan-done': async (el) => {
    await saveItems(mapItem(el.dataset.id, (it) => ({ ...it, progress: it.progress >= 100 ? 0 : 100 })));
  },
  'plan-delete': async (el) => {
    await saveItems(dayData(S.ui.selDate).items.filter((it) => it.id !== el.dataset.id));
  },
  'plan-timer': (el) => {
    const it = dayData(S.ui.selDate).items.find((x) => x.id === el.dataset.id);
    S.ui.pomoTitle = it?.title || '';
    S.ui.studyTab = 'timer';
    savePref('studyTab', 'timer');
    refresh();
    toast('집중 타이머에 할 일을 연결했어요.');
  },
  'plan-share': async () => {
    const { goal, items } = dayData(S.ui.selDate);
    const lines = items.map((it) => `- [${it.subject}] ${it.title} (${it.progress}%)`).join('\n');
    const msg = `[${S.profile.name} ${prettyDate(S.ui.selDate)} 학습 플래너]\n오늘의 다짐: ${goal || '계획 끝까지 완주!'}\n평균 달성률: ${avgProgress(items)}%\n${lines || '- 등록된 계획 없음'}`;
    await copyText(msg);
    toast('카톡에 붙여넣을 수 있게 복사했어요.');
  },
  'pomo-toggle': () => {
    unlockAudio(); // 타이머가 끝날 때 알림음이 울리도록 미리 허락받기
    toggle();
  },
  'pomo-reset': () => reset(),
  'pomo-switch': () => switchPhase(),
  'pomo-preset': (el) => setDurations(Number(el.dataset.focus), Number(el.dataset.break)),
  'pomo-custom': () => {
    const f = clampNumber(document.getElementById('pomo-focus')?.value, 1, 180, 25);
    const b = clampNumber(document.getElementById('pomo-break')?.value, 1, 60, 5);
    setDurations(f, b);
  },
  sound: (el) => {
    playSound(el.dataset.id);
    refresh();
  },
  'sound-volume': (el) => setVolume(el.value),
  'rain-density': (el) => {
    setRainDensity(el.dataset.mode);
    refresh();
  },
  'weak-delete': async (el) => {
    await deleteDoc(doc(db, 'users', S.user.uid, 'weak', el.dataset.id));
  },
  'print-open': () => {
    S.ui.printMode = 'test';
    refresh();
  },
  'print-close': () => {
    S.ui.printMode = '';
    refresh();
  },
  'print-mode': (el) => {
    S.ui.printMode = el.dataset.mode;
    refresh();
  },
  'print-now': () => window.print(),
};
