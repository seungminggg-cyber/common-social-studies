// 홈 탭: 앱을 열면 가장 먼저 보이는 화면
// 학생: 오늘의 한마디, 시험 D-Day, 오늘 할 일, 공지 모아보기
// 강사: 오늘의 한마디, 승인 대기 알림, 학교별 시험 일정, 공지 미리보기
import { S, refresh, savePref, schoolName, teacherName } from '../store.js';
import { html } from '../lib/html.js';
import { ddayText, prettyDate, todayKey, parseDateKey } from '../lib/util.js';
import { quoteOfToday } from '../quotes.js';
import { todaysQuizzes } from '../lib/daily.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return '늦은 밤까지 수고 많아요';
  if (h < 11) return '좋은 아침이에요';
  if (h < 17) return '오늘도 힘내요';
  if (h < 21) return '오늘 하루도 수고했어요';
  return '조금만 더 힘내요';
}

function quoteCard() {
  const q = quoteOfToday();
  return html`
    <section class="card bg-gradient-to-br from-indigo-700 to-violet-700 border-0 text-white space-y-3">
      <p class="text-xs font-semibold text-indigo-200 flex items-center gap-1.5"><i class="fa-solid fa-quote-left"></i>오늘의 한마디</p>
      <blockquote class="text-lg sm:text-xl font-semibold leading-relaxed">${q.text}</blockquote>
      <p class="text-sm text-indigo-200">— ${q.by}</p>
    </section>
  `;
}

function ddayCard(sch) {
  if (!sch?.examDate) return '';
  const d = ddayText(sch.examDate);
  const exam = parseDateKey(sch.examDate);
  return html`
    <section class="card border-rose-200 flex items-center justify-between gap-4">
      <div class="min-w-0">
        <p class="text-sm text-slate-500">${sch.name} ${sch.examName || '시험'}</p>
        <p class="text-sm text-slate-400">${exam.getMonth() + 1}월 ${exam.getDate()}일${sch.scope ? ` · ${sch.scope}` : ''}</p>
      </div>
      <p class="text-4xl sm:text-5xl font-bold text-rose-600 shrink-0 tabular-nums">${d}</p>
    </section>
  `;
}

function todoItem({ icon, color, title, detail, done, tab, sub }) {
  return html`
    <li>
      <button type="button" class="w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40 ${done ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white'}"
        data-action="go" data-tab="${tab}" data-sub="${sub || ''}">
        <span class="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${done ? 'bg-emerald-500 text-white' : color}">
          <i class="fa-solid ${done ? 'fa-check' : icon}"></i>
        </span>
        <span class="flex-1 min-w-0">
          <span class="block font-semibold ${done ? 'text-emerald-800' : 'text-slate-900'}">${title}</span>
          <span class="block text-sm ${done ? 'text-emerald-700' : 'text-slate-500'}">${detail}</span>
        </span>
        <i class="fa-solid fa-chevron-right text-slate-300"></i>
      </button>
    </li>
  `;
}

function todoCard() {
  const answers = S.today?.answers || {};
  const daily = todaysQuizzes(S.quizzes, S.config?.dailySubject);
  const total = daily.length;
  const solved = daily.filter((q) => answers[q.id] !== undefined).length;
  const videos = S.school.videos;
  const unwatched = videos.filter((v) => !S.school.summaries[v.id]).length;
  const items = Array.isArray(S.today?.items) ? S.today.items : [];
  const planAvg = items.length ? Math.round(items.reduce((a, it) => a + (Number(it.progress) || 0), 0) / items.length) : 0;
  const pomo = S.today?.pomo || 0;
  const weak = S.weak.length;

  const list = [
    {
      icon: 'fa-bolt', color: 'bg-amber-100 text-amber-600', tab: 'quiz',
      title: '오늘의 3분 퀴즈',
      detail: total === 0 ? '아직 등록된 문제가 없어요' : solved >= total ? `${total}문제 모두 풀었어요!` : `${total - solved}문제 남았어요 (${solved}/${total})`,
      done: total > 0 && solved >= total,
    },
    {
      icon: 'fa-play', color: 'bg-rose-100 text-rose-600', tab: 'school',
      title: '수업 영상 수강 인증',
      detail: videos.length === 0 ? '등록된 영상이 없어요' : unwatched ? `아직 인증 안 한 영상 ${unwatched}개` : '모든 영상 인증 완료!',
      done: videos.length > 0 && unwatched === 0,
    },
    {
      icon: 'fa-calendar-check', color: 'bg-indigo-100 text-indigo-600', tab: 'study', sub: 'planner',
      title: '오늘 플래너',
      detail: items.length === 0 ? '오늘 공부 계획을 세워보세요' : `계획 ${items.length}개 · 달성률 ${planAvg}%`,
      done: items.length > 0 && planAvg >= 100,
    },
    {
      icon: 'fa-bookmark', color: 'bg-violet-100 text-violet-600', tab: 'study', sub: 'report',
      title: '오답 노트 복습',
      detail: weak ? `복습할 문제 ${weak}개` : '복습할 오답이 없어요',
      done: weak === 0,
    },
    {
      icon: 'fa-stopwatch', color: 'bg-slate-100 text-slate-600', tab: 'study', sub: 'timer',
      title: '집중 타이머',
      detail: pomo ? `오늘 ${pomo}번 완주했어요` : '25분 집중으로 시작해 볼까요?',
      done: pomo > 0,
    },
  ];
  const doneCount = list.filter((x) => x.done).length;
  return html`
    <section class="card space-y-4">
      <div class="flex items-center justify-between gap-2">
        <h2 class="card-title"><i class="fa-solid fa-list-check text-indigo-500"></i>오늘 할 일</h2>
        <span class="chip ${doneCount === list.length ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}">${doneCount} / ${list.length} 완료</span>
      </div>
      <div class="h-2 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full bg-emerald-500 transition-all" style="width:${Math.round((doneCount / list.length) * 100)}%"></div></div>
      <ul class="space-y-2">${list.map(todoItem)}</ul>
    </section>
  `;
}

function noticeCard(sch) {
  const c = S.config || {};
  const block = (label, cls, title, body, extra = '') => html`
    <div class="rounded-xl ${cls} p-4 space-y-1.5">
      <span class="chip bg-white/80 text-slate-700">${label}</span>
      ${title ? html`<p class="font-semibold leading-snug">${title}</p>` : ''}
      ${body ? html`<p class="text-sm text-slate-600 leading-relaxed">${body}</p>` : ''}
      ${extra}
    </div>`;
  const blocks = [];
  if (c.noticeHeadline || c.noticeSubtext) blocks.push(block('전체 공지', 'bg-indigo-50', c.noticeHeadline, c.noticeSubtext));
  if (sch && (sch.notice || sch.schedule || sch.scope)) {
    blocks.push(block(`${sch.name} 공지`, 'bg-amber-50', sch.notice, '', html`
      <ul class="text-sm text-slate-600 space-y-0.5 pt-1">
        ${sch.schedule ? html`<li><i class="fa-regular fa-clock w-4 text-slate-400"></i> 수업: ${sch.schedule}</li>` : ''}
        ${sch.scope ? html`<li><i class="fa-regular fa-file-lines w-4 text-slate-400"></i> 시험 범위: ${sch.scope}</li>` : ''}
      </ul>`));
  }
  return html`
    <section class="card space-y-3">
      <h2 class="card-title"><i class="fa-solid fa-bullhorn text-amber-500"></i>공지</h2>
      ${blocks.length ? blocks : html`<div class="empty">새 공지가 없어요.</div>`}
    </section>
  `;
}

function studentHome() {
  const sch = S.schools.find((s) => s.id === S.profile.schoolId);
  return html`
    <div class="space-y-5">
      <div>
        <p class="text-sm text-slate-500">${prettyDate(todayKey())}</p>
        <h2 class="text-2xl font-bold">${greeting()}, ${S.profile.name}님</h2>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div class="lg:col-start-1">${quoteCard()}</div>
        ${sch?.examDate ? html`<div class="lg:col-start-1">${ddayCard(sch)}</div>` : ''}
        <div class="lg:col-start-2 lg:row-start-1 lg:row-span-3">${todoCard()}</div>
        <div class="lg:col-start-1">${noticeCard(sch)}</div>
      </div>
    </div>
  `;
}

function teacherHome() {
  const waiting = S.t.users.filter((u) => u.status !== 'approved');
  const students = S.t.users.filter((u) => u.status === 'approved');
  const exams = S.schools
    .filter((s) => s.examDate && ddayText(s.examDate) !== '시험 종료')
    .sort((a, b) => String(a.examDate).localeCompare(String(b.examDate)));
  const c = S.config || {};
  return html`
    <div class="space-y-5">
      <div>
        <p class="text-sm text-slate-500">${prettyDate(todayKey())}</p>
        <h2 class="text-2xl font-bold">${greeting()}, ${teacherName()}</h2>
      </div>
      ${waiting.length ? html`
        <button type="button" class="w-full flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-left hover:bg-amber-100 transition" data-action="go" data-tab="admin" data-sub="students">
          <span class="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center"><i class="fa-solid fa-user-clock"></i></span>
          <span class="flex-1"><b>가입 승인 대기 ${waiting.length}명</b><span class="block text-sm text-amber-800">${waiting.map((u) => u.name).join(', ')}</span></span>
          <span class="btn btn-sm bg-amber-400 text-slate-900">승인하러 가기</span>
        </button>` : ''}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div class="space-y-5">
          ${quoteCard()}
          <section class="card space-y-3">
            <h2 class="card-title"><i class="fa-solid fa-bullhorn text-amber-500"></i>전체 공지 (학생 홈에 보여요)</h2>
            ${c.noticeHeadline || c.noticeSubtext ? html`
              <div class="rounded-xl bg-indigo-50 p-4 space-y-1">
                <p class="font-semibold">${c.noticeHeadline}</p>
                <p class="text-sm text-slate-600">${c.noticeSubtext}</p>
              </div>` : html`<div class="empty">공지가 없어요.</div>`}
            <button type="button" class="btn btn-secondary btn-sm" data-action="go" data-tab="admin" data-sub="settings"><i class="fa-solid fa-pen"></i>공지 수정</button>
          </section>
        </div>
        <div class="space-y-5">
          <section class="card space-y-3">
            <div class="flex items-center justify-between gap-2">
              <h2 class="card-title"><i class="fa-solid fa-users text-indigo-500"></i>수강생 ${students.length}명</h2>
              <button type="button" class="btn btn-primary btn-sm" data-action="go" data-tab="admin" data-sub="dashboard"><i class="fa-solid fa-chart-column"></i>현황판 보기</button>
            </div>
            <ul class="divide-y divide-slate-100 text-sm">
              ${S.schools.map((s) => html`
                <li class="py-2 flex justify-between"><span>${s.name}</span><span class="text-slate-500">${students.filter((u) => u.schoolId === s.id).length}명</span></li>`)}
            </ul>
          </section>
          <section class="card space-y-3">
            <div class="flex items-center justify-between gap-2">
              <h2 class="card-title"><i class="fa-regular fa-calendar text-rose-500"></i>다가오는 시험</h2>
              <button type="button" class="btn btn-secondary btn-sm" data-action="go" data-tab="admin" data-sub="schools"><i class="fa-solid fa-pen"></i>일정 수정</button>
            </div>
            ${exams.length === 0 ? html`<div class="empty">등록된 시험 날짜가 없어요.</div>` : html`
              <ul class="space-y-2">
                ${exams.map((s) => html`
                  <li class="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <span><b>${s.name}</b> <span class="text-sm text-slate-500">${s.examName || '시험'} · ${prettyDate(s.examDate)}</span></span>
                    <span class="font-bold text-rose-600 tabular-nums">${ddayText(s.examDate)}</span>
                  </li>`)}
              </ul>
            `}
          </section>
        </div>
      </div>
    </div>
  `;
}

export function homeView() {
  return S.role === 'teacher' ? teacherHome() : studentHome();
}

export const homeActions = {
  go: (el) => {
    S.ui.tab = el.dataset.tab;
    const sub = el.dataset.sub;
    if (sub && el.dataset.tab === 'study') {
      S.ui.studyTab = sub;
      savePref('studyTab', sub);
    }
    if (sub && el.dataset.tab === 'admin') {
      S.ui.adminTab = sub;
      savePref('adminTab', sub);
    }
    refresh();
    window.scrollTo({ top: 0 });
  },
};
