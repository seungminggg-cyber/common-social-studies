// 오늘의 퀴즈 탭: O/X, 빈칸, 개념 비교 카드, 플래시카드
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase.js';
import { S, refresh } from '../store.js';
import { html, highlightBrackets } from '../lib/html.js';
import { isBlankCorrect, firstAnswer, toast } from '../lib/util.js';

const isStudent = () => S.role === 'student';
const answers = () => (isStudent() ? S.today?.answers || {} : S.ui.localAnswers);
const retryCards = () => (isStudent() ? S.profile?.retryCards || [] : S.ui.localRetry);

function isCorrect(q, choice) {
  return q.type === 'ox' ? choice === q.answer : isBlankCorrect(choice, q.answer);
}

function noticeBanner() {
  const quizzes = S.quizzes;
  const ans = answers();
  const solved = quizzes.filter((q) => ans[q.id] !== undefined).length;
  const c = S.config || {};
  return html`
    <section class="rounded-2xl bg-gradient-to-br from-indigo-700 to-violet-700 p-5 sm:p-6 text-white">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <span class="chip bg-white/15 text-white">공지</span>
          <h2 class="text-lg sm:text-xl font-bold">${c.noticeHeadline || '오늘도 3분 퀴즈로 시작해요'}</h2>
          ${c.noticeSubtext ? html`<p class="text-sm text-indigo-100 leading-relaxed">${c.noticeSubtext}</p>` : ''}
        </div>
        <div class="flex shrink-0 rounded-xl bg-white/10 divide-x divide-white/15">
          <div class="px-4 py-3 text-center">
            <p class="text-xs text-indigo-200">오늘 푼 문제</p>
            <p class="text-lg font-bold">${solved} / ${quizzes.length}</p>
          </div>
          <div class="px-4 py-3 text-center">
            <p class="text-xs text-indigo-200">오답 노트</p>
            <p class="text-lg font-bold">${isStudent() ? S.weak.length : '-'}개</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function oxItem(q, idx) {
  const choice = answers()[q.id];
  const done = choice !== undefined;
  const ok = done && isCorrect(q, choice);
  const btn = (value, label) => {
    const picked = choice === value;
    const cls = picked
      ? (ok ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-rose-600 border-rose-600 text-white')
      : (done && value === q.answer ? 'border-emerald-400 text-emerald-700 bg-emerald-50' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50');
    return html`<button type="button" class="btn border ${cls}" data-action="answer-ox" data-id="${q.id}" data-choice="${value}" ${done ? 'disabled' : ''}>${label}</button>`;
  };
  return html`
    <article class="rounded-xl border p-4 space-y-3 ${done ? (ok ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40') : 'border-slate-200'}">
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-semibold text-indigo-600">Q${idx + 1} · ${q.unit}</span>
        ${done ? html`<span class="text-xs font-bold ${ok ? 'text-emerald-600' : 'text-rose-600'}">${ok ? '정답' : '오답 · 오답 노트에 저장됨'}</span>` : ''}
      </div>
      <p class="text-[15px] leading-relaxed text-slate-900">${q.question}</p>
      <div class="grid grid-cols-2 gap-2 [&>button:disabled]:opacity-100">
        ${btn('O', 'O 맞다')}
        ${btn('X', 'X 틀리다')}
      </div>
      ${done && q.explanation ? html`<p class="rounded-lg bg-white border border-slate-200 p-3 text-sm text-slate-600 leading-relaxed"><b class="text-slate-800">해설</b> ${q.explanation}</p>` : ''}
    </article>
  `;
}

function blankItem(q, idx) {
  const choice = answers()[q.id];
  const done = choice !== undefined;
  const ok = done && isCorrect(q, choice);
  return html`
    <article class="rounded-xl border p-4 space-y-3 ${done ? (ok ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40') : 'border-slate-200'}">
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-semibold text-emerald-700">빈칸 ${idx + 1} · ${q.unit}</span>
        ${q.hint ? html`<span class="text-xs text-amber-700">힌트: ${q.hint}</span>` : ''}
      </div>
      <p class="text-[15px] leading-relaxed text-slate-900">${q.question}</p>
      ${done ? html`
        <p class="text-sm font-semibold ${ok ? 'text-emerald-600' : 'text-rose-600'}">
          ${ok ? `정답! (${choice})` : `내 답: ${choice} → 정답은 [${firstAnswer(q.answer)}] · 오답 노트에 저장됨`}
        </p>
      ` : html`
        <form class="flex gap-2" data-submit="answer-blank" data-id="${q.id}">
          <input class="input" id="blank-${q.id}" name="answer" placeholder="정답 입력" autocomplete="off" />
          <button class="btn btn-primary shrink-0">채점</button>
        </form>
      `}
    </article>
  `;
}

function quizCard() {
  const tab = S.ui.quizTab;
  const ox = S.quizzes.filter((q) => q.type === 'ox');
  const blank = S.quizzes.filter((q) => q.type === 'blank');
  const items = tab === 'ox' ? ox : blank;
  return html`
    <section class="card space-y-4 lg:col-span-7">
      <div class="flex items-center justify-between gap-2">
        <h2 class="card-title"><i class="fa-solid fa-bolt text-amber-500"></i>오늘의 3분 퀴즈</h2>
        <button type="button" class="btn btn-ghost btn-sm" data-action="reset-quiz"><i class="fa-solid fa-rotate-right"></i>다시 풀기</button>
      </div>
      <div class="seg">
        <button type="button" class="seg-btn ${tab === 'ox' ? 'active' : ''}" data-action="quiz-tab" data-tab="ox">O/X 퀴즈 <span class="text-slate-400">${ox.length}</span></button>
        <button type="button" class="seg-btn ${tab === 'blank' ? 'active' : ''}" data-action="quiz-tab" data-tab="blank">빈칸 채우기 <span class="text-slate-400">${blank.length}</span></button>
      </div>
      <div class="space-y-3">
        ${items.length === 0
          ? html`<div class="empty">아직 등록된 문제가 없어요.</div>`
          : items.map((q, i) => (tab === 'ox' ? oxItem(q, i) : blankItem(q, i)))}
      </div>
    </section>
  `;
}

function conceptCard() {
  const cards = S.cards.filter((c) => c.type === 'concept');
  if (cards.length === 0) return '';
  return html`
    <section class="card space-y-4">
      <div class="flex items-center justify-between gap-2">
        <h2 class="card-title"><i class="fa-solid fa-scale-balanced text-indigo-500"></i>1분 개념 비교</h2>
        <button type="button" class="btn btn-secondary btn-sm" data-action="toggle-blur">
          <i class="fa-solid ${S.ui.blur ? 'fa-eye' : 'fa-eye-slash'}"></i>${S.ui.blur ? '키워드 보기' : '키워드 가리기'}
        </button>
      </div>
      <div class="space-y-3">
        ${cards.map((c) => html`
          <div class="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <h3 class="font-semibold text-slate-900">${c.title}</h3>
              ${c.tag ? html`<span class="chip bg-indigo-50 text-indigo-700">${c.tag}</span>` : ''}
            </div>
            <p class="text-sm text-slate-700 leading-relaxed" ${S.ui.blur ? 'data-action="toggle-blur"' : ''}>${highlightBrackets(c.body, S.ui.blur ? 'key-hidden' : 'key')}</p>
          </div>
        `)}
      </div>
      ${S.ui.blur ? html`<p class="text-xs text-slate-400">가려진 칸을 누르면 키워드가 보여요.</p>` : ''}
    </section>
  `;
}

function flashcard() {
  const all = S.cards.filter((c) => c.type === 'flash');
  const retry = retryCards();
  const deck = S.ui.fcFilter === 'retry' ? all.filter((c) => retry.includes(c.id)) : all;
  if (S.ui.fcIndex >= deck.length) S.ui.fcIndex = 0;
  const card = deck[S.ui.fcIndex];
  const inRetry = card && retry.includes(card.id);
  return html`
    <section class="card space-y-4">
      <div class="flex items-center justify-between gap-2">
        <h2 class="card-title"><i class="fa-solid fa-layer-group text-violet-500"></i>암기 카드</h2>
        <div class="seg !p-0.5">
          <button type="button" class="seg-btn !py-1 !text-xs ${S.ui.fcFilter === 'all' ? 'active' : ''}" data-action="fc-filter" data-filter="all">전체 ${all.length}</button>
          <button type="button" class="seg-btn !py-1 !text-xs ${S.ui.fcFilter === 'retry' ? 'active' : ''}" data-action="fc-filter" data-filter="retry">복습 ${retry.filter((id) => all.some((c) => c.id === id)).length}</button>
        </div>
      </div>
      ${!card ? html`<div class="empty">${S.ui.fcFilter === 'retry' ? '다시 볼 카드가 없어요. 잘하고 있어요!' : '아직 등록된 카드가 없어요.'}</div>` : html`
        <div class="flip cursor-pointer select-none" data-action="fc-flip">
          <div class="flip-inner ${S.ui.fcFlipped ? 'flipped' : ''}">
            <div class="flip-face rounded-xl border-2 border-indigo-200 bg-indigo-50 p-5 min-h-[150px] flex flex-col justify-between">
              <div class="flex justify-between text-xs text-indigo-600 font-semibold"><span>${card.unit}</span><span>${S.ui.fcIndex + 1} / ${deck.length}</span></div>
              <p class="text-base font-semibold text-slate-900 my-3 leading-relaxed">${card.front}</p>
              <p class="text-xs text-indigo-400 text-right">눌러서 정답 보기</p>
            </div>
            <div class="flip-face flip-back rounded-xl border-2 border-indigo-800 bg-indigo-900 p-5 min-h-[150px] flex flex-col justify-between text-white">
              <div class="flex justify-between text-xs text-indigo-300 font-semibold"><span>정답</span><span>${S.ui.fcIndex + 1} / ${deck.length}</span></div>
              <p class="text-base my-3 leading-relaxed">${highlightBrackets(card.back, 'key-dark')}</p>
              <p class="text-xs text-indigo-300 text-right">눌러서 문제 보기</p>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          ${inRetry
            ? html`<button type="button" class="btn bg-emerald-50 text-emerald-700 hover:bg-emerald-100" data-action="fc-retry-remove" data-id="${card.id}"><i class="fa-solid fa-check"></i>외웠어요</button>`
            : html`<button type="button" class="btn bg-amber-50 text-amber-800 hover:bg-amber-100" data-action="fc-retry-add" data-id="${card.id}"><i class="fa-solid fa-rotate"></i>다시 볼래요</button>`}
          <button type="button" class="btn btn-primary" data-action="fc-next">다음 카드<i class="fa-solid fa-arrow-right"></i></button>
        </div>
      `}
    </section>
  `;
}

export function quizView() {
  return html`
    <div class="space-y-5">
      ${noticeBanner()}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        ${quizCard()}
        <div class="lg:col-span-5 space-y-5">
          ${conceptCard()}
          ${flashcard()}
        </div>
      </div>
    </div>
  `;
}

// ---------- 동작 ----------
async function recordAnswer(q, choice) {
  if (!isStudent()) {
    S.ui.localAnswers[q.id] = choice;
    refresh();
    return;
  }
  const uid = S.user.uid;
  const writes = [setDoc(doc(db, 'users', uid, 'days', S.todayKey), { answers: { [q.id]: choice } }, { merge: true })];
  if (!isCorrect(q, choice)) {
    const note = q.type === 'ox'
      ? `정답: ${q.answer}${q.explanation ? ' — ' + q.explanation : ''}`
      : `정답: ${firstAnswer(q.answer)}${q.hint ? ` (힌트: ${q.hint})` : ''}`;
    writes.push(setDoc(doc(db, 'users', uid, 'weak', q.id), {
      type: q.type, unit: q.unit || '', question: q.question, answerNote: note, createdAt: Date.now(),
    }));
  }
  await Promise.all(writes);
}

async function updateRetry(id, add) {
  if (!isStudent()) {
    const set = new Set(S.ui.localRetry);
    if (add) set.add(id); else set.delete(id);
    S.ui.localRetry = [...set];
    return;
  }
  await updateDoc(doc(db, 'users', S.user.uid), { retryCards: add ? arrayUnion(id) : arrayRemove(id) });
}

export const quizActions = {
  'quiz-tab': (el) => {
    S.ui.quizTab = el.dataset.tab;
    refresh();
  },
  'answer-ox': async (el) => {
    const q = S.quizzes.find((x) => x.id === el.dataset.id);
    if (q) await recordAnswer(q, el.dataset.choice);
  },
  'answer-blank': async (form, e, data) => {
    const q = S.quizzes.find((x) => x.id === form.dataset.id);
    const value = String(data.get('answer') || '').trim();
    if (!q) return;
    if (!value) return toast('정답을 입력해 주세요.', 'error');
    await recordAnswer(q, value);
  },
  'reset-quiz': async () => {
    if (!isStudent()) {
      S.ui.localAnswers = {};
      refresh();
      return;
    }
    if (S.today?.answers && Object.keys(S.today.answers).length) {
      await updateDoc(doc(db, 'users', S.user.uid, 'days', S.todayKey), { answers: {} });
    }
    toast('오늘 푼 답을 지웠어요. 오답 노트는 그대로 남아 있어요.');
  },
  'toggle-blur': () => {
    S.ui.blur = !S.ui.blur;
    refresh();
  },
  'fc-filter': (el) => {
    S.ui.fcFilter = el.dataset.filter;
    S.ui.fcIndex = 0;
    S.ui.fcFlipped = false;
    refresh();
  },
  'fc-flip': () => {
    S.ui.fcFlipped = !S.ui.fcFlipped;
    refresh();
  },
  'fc-next': () => {
    S.ui.fcIndex += 1;
    S.ui.fcFlipped = false;
    refresh();
  },
  'fc-retry-add': async (el) => {
    await updateRetry(el.dataset.id, true);
    toast('다시 볼 카드에 넣었어요.');
    S.ui.fcIndex += 1;
    S.ui.fcFlipped = false;
    refresh();
  },
  'fc-retry-remove': async (el) => {
    await updateRetry(el.dataset.id, false);
    toast('외운 카드로 표시했어요.');
    S.ui.fcFlipped = false;
    refresh();
  },
};
