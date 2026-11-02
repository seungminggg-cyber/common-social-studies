// 강사용 문제 검토·수정 화면
// 단원별로 문제·정답·해설을 한눈에 보고, 바로 고치거나 지우고, 인쇄할 수 있습니다.
// 강사님이 고친 문제는 'edited' 표시가 붙어서, 나중에 문제 팩이 업데이트돼도 덮어쓰지 않습니다.
import { doc, updateDoc, deleteDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase.js';
import { S, refresh } from '../store.js';
import { html, highlightBrackets } from '../lib/html.js';
import { unitList } from '../lib/daily.js';
import { toast } from '../lib/util.js';
import { PACK_BY_ID } from '../content/index.js';

const TYPES = [
  ['all', '전체'],
  ['ox', 'O/X'],
  ['blank', '빈칸'],
  ['concept', '개념 카드'],
  ['flash', '암기 카드'],
];

const TYPE_LABEL = { ox: 'O/X', blank: '빈칸', concept: '개념', flash: '암기' };
const TYPE_CHIP = {
  ox: 'bg-indigo-50 text-indigo-700',
  blank: 'bg-emerald-50 text-emerald-700',
  concept: 'bg-amber-50 text-amber-700',
  flash: 'bg-violet-50 text-violet-700',
};

function items() {
  const unit = S.ui.reviewUnit || '';
  const type = S.ui.reviewType || 'all';
  const q = (S.ui.reviewSearch || '').trim();
  const all = [
    ...S.quizzes.map((x) => ({ ...x, col: 'quizzes' })),
    ...S.cards.map((x) => ({ ...x, col: 'cards' })),
  ];
  return all
    .filter((x) => !unit || x.unit === unit)
    .filter((x) => type === 'all' || x.type === type)
    .filter((x) => !q || [x.question, x.answer, x.explanation, x.hint, x.title, x.body, x.front, x.back]
      .some((v) => String(v || '').includes(q)))
    .sort((a, b) => String(a.unit || '').localeCompare(String(b.unit || ''), 'ko')
      || ['ox', 'blank', 'concept', 'flash'].indexOf(a.type) - ['ox', 'blank', 'concept', 'flash'].indexOf(b.type)
      || (a.createdAt || 0) - (b.createdAt || 0));
}

function field(name, label, value, { area = false, rows = 2 } = {}) {
  const id = `rv-${name}-${S.ui.reviewEdit}`;
  return html`
    <div>
      <label class="label !text-xs" for="${id}">${label}</label>
      ${area
        ? html`<textarea class="input" id="${id}" name="${name}" rows="${rows}">${value || ''}</textarea>`
        : html`<input class="input" id="${id}" name="${name}" value="${value || ''}" />`}
    </div>`;
}

function editForm(x) {
  const units = unitList(S.quizzes, S.cards);
  return html`
    <form class="space-y-2 rounded-xl bg-indigo-50/60 border border-indigo-200 p-3" data-submit="review-save" data-id="${x.id}" data-col="${x.col}" data-type="${x.type}">
      <div>
        <label class="label !text-xs" for="rv-unit-${x.id}">단원</label>
        <input class="input" id="rv-unit-${x.id}" name="unit" value="${x.unit || ''}" list="rv-units" />
        <datalist id="rv-units">${units.map((u) => html`<option value="${u}"></option>`)}</datalist>
      </div>
      ${x.type === 'ox' ? html`
        ${field('question', '문제', x.question, { area: true })}
        <div>
          <label class="label !text-xs" for="rv-answer-${x.id}">정답</label>
          <select class="input" id="rv-answer-${x.id}" name="answer">
            <option value="O" ${x.answer === 'O' ? 'selected' : ''}>O</option>
            <option value="X" ${x.answer === 'X' ? 'selected' : ''}>X</option>
          </select>
        </div>
        ${field('explanation', '해설', x.explanation, { area: true, rows: 3 })}` : ''}
      ${x.type === 'blank' ? html`
        ${field('question', '문제 (빈칸은 [    ])', x.question, { area: true })}
        ${field('answer', '정답 (여러 개면 / 로 구분)', x.answer)}
        ${field('hint', '힌트', x.hint)}` : ''}
      ${x.type === 'concept' ? html`
        ${field('title', '제목', x.title)}
        ${field('tag', '태그', x.tag)}
        ${field('body', '내용 (가릴 키워드는 [대괄호])', x.body, { area: true, rows: 3 })}` : ''}
      ${x.type === 'flash' ? html`
        ${field('front', '앞면 (질문)', x.front)}
        ${field('back', '뒷면 (정답, 강조는 [대괄호])', x.back, { area: true })}` : ''}
      <div class="flex gap-2">
        <button class="btn btn-primary btn-sm">저장</button>
        <button type="button" class="btn btn-secondary btn-sm" data-action="review-cancel">취소</button>
      </div>
    </form>
  `;
}

function itemView(x, i) {
  const editing = S.ui.reviewEdit === x.id;
  const hide = S.ui.reviewHideAnswers;
  let body;
  if (x.type === 'ox') {
    body = html`
      <p class="text-slate-900 leading-relaxed">${x.question}</p>
      ${hide ? '' : html`<p class="text-sm"><b class="${x.answer === 'O' ? 'text-emerald-600' : 'text-rose-600'}">정답 ${x.answer}</b>${x.explanation ? html` <span class="text-slate-600">· ${x.explanation}</span>` : ''}</p>`}`;
  } else if (x.type === 'blank') {
    body = html`
      <p class="text-slate-900 leading-relaxed">${x.question}</p>
      ${hide ? '' : html`<p class="text-sm"><b class="text-emerald-700">정답 ${x.answer}</b>${x.hint ? html` <span class="text-slate-500">· 힌트 ${x.hint}</span>` : ''}</p>`}`;
  } else if (x.type === 'concept') {
    body = html`
      <p class="font-semibold">${x.title} ${x.tag ? html`<span class="chip bg-slate-100 text-slate-600">${x.tag}</span>` : ''}</p>
      <p class="text-sm text-slate-700 leading-relaxed">${highlightBrackets(x.body, hide ? 'key-hidden' : 'key')}</p>`;
  } else {
    body = html`
      <p class="font-semibold">Q. ${x.front}</p>
      ${hide ? '' : html`<p class="text-sm text-slate-700">A. ${highlightBrackets(x.back, 'key')}</p>`}`;
  }
  return html`
    <li id="rv-${x.id}" class="py-3 space-y-1.5 break-inside-avoid">
      <div class="flex items-center gap-2 text-xs">
        <span class="text-slate-400 tabular-nums w-7">${i + 1}.</span>
        <span class="chip ${TYPE_CHIP[x.type]}">${TYPE_LABEL[x.type]}</span>
        <span class="text-slate-500 truncate">${x.unit || '단원 없음'}</span>
        ${x.edited ? html`<span class="chip bg-slate-100 text-slate-500 print:hidden">수정함</span>` : ''}
        <span class="ml-auto flex gap-1 print:hidden">
          <button type="button" class="btn btn-ghost btn-sm !py-1" data-action="review-edit" data-id="${x.id}"><i class="fa-solid fa-pen"></i>수정</button>
          <button type="button" class="btn btn-ghost btn-sm !py-1 hover:!text-rose-600" data-action="review-delete" data-id="${x.id}" data-col="${x.col}" aria-label="삭제"><i class="fa-regular fa-trash-can"></i></button>
        </span>
      </div>
      <div class="pl-9 space-y-1">${editing ? editForm(x) : body}</div>
    </li>
  `;
}

export function reviewView() {
  const list = items();
  const units = unitList(S.quizzes, S.cards);
  const unit = S.ui.reviewUnit || '';
  const type = S.ui.reviewType || 'all';
  return html`
    <section class="card space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div>
          <h2 class="card-title"><i class="fa-solid fa-list-check text-indigo-500"></i>문제 검토·수정</h2>
          <p class="card-desc">단원별로 문제와 정답을 확인하고 바로 고칠 수 있어요. 고친 문제는 자동 업데이트로 덮어쓰지 않아요.</p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn btn-secondary btn-sm" data-action="review-toggle-answers">
            <i class="fa-solid ${S.ui.reviewHideAnswers ? 'fa-eye' : 'fa-eye-slash'}"></i>${S.ui.reviewHideAnswers ? '정답 보이기' : '정답 숨기기'}
          </button>
          <button type="button" class="btn btn-primary btn-sm" data-action="print-now"><i class="fa-solid fa-print"></i>인쇄</button>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 print:hidden">
        <select class="input" data-change="review-unit" aria-label="단원">
          <option value="" ${!unit ? 'selected' : ''}>전체 단원</option>
          ${units.map((u) => html`<option value="${u}" ${u === unit ? 'selected' : ''}>${u}</option>`)}
        </select>
        <div class="seg !p-0.5 overflow-x-auto">
          ${TYPES.map(([id, label]) => html`<button type="button" class="seg-btn !py-1.5 !text-xs whitespace-nowrap ${type === id ? 'active' : ''}" data-action="review-type" data-type="${id}">${label}</button>`)}
        </div>
        <input class="input" id="review-search" data-input="review-search" value="${S.ui.reviewSearch || ''}" placeholder="검색 (예: 칸트, 택리지)" />
      </div>
      <div id="print-sheet" class="space-y-2">
        <p class="text-sm text-slate-500"><b class="text-slate-800">${unit || '전체 단원'}</b> · ${list.length}개</p>
        ${list.length === 0 ? html`<div class="empty">해당하는 문제가 없어요.</div>` : html`
          <ol class="divide-y divide-slate-100">${list.map(itemView)}</ol>`}
      </div>
    </section>
  `;
}

const str = (data, key) => String(data.get(key) || '').trim();

export const reviewActions = {
  'review-unit': (el) => {
    S.ui.reviewUnit = el.value;
    S.ui.reviewEdit = null;
    refresh();
  },
  'review-type': (el) => {
    S.ui.reviewType = el.dataset.type;
    S.ui.reviewEdit = null;
    refresh();
  },
  'review-search': (el) => {
    S.ui.reviewSearch = el.value;
    refresh();
  },
  'review-toggle-answers': () => {
    S.ui.reviewHideAnswers = !S.ui.reviewHideAnswers;
    refresh();
  },
  'review-edit': (el) => {
    S.ui.reviewEdit = el.dataset.id;
    refresh();
  },
  'review-cancel': () => {
    S.ui.reviewEdit = null;
    refresh();
  },
  'review-save': async (form, e, data) => {
    const { id, col, type } = form.dataset;
    const patch = { unit: str(data, 'unit'), edited: true };
    if (type === 'ox') {
      Object.assign(patch, { question: str(data, 'question'), answer: str(data, 'answer') === 'X' ? 'X' : 'O', explanation: str(data, 'explanation') });
      if (!patch.question) return toast('문제를 입력해 주세요.', 'error');
    } else if (type === 'blank') {
      Object.assign(patch, { question: str(data, 'question'), answer: str(data, 'answer'), hint: str(data, 'hint') });
      if (!patch.question || !patch.answer) return toast('문제와 정답을 입력해 주세요.', 'error');
    } else if (type === 'concept') {
      Object.assign(patch, { title: str(data, 'title'), tag: str(data, 'tag'), body: str(data, 'body') });
      if (!patch.title || !patch.body) return toast('제목과 내용을 입력해 주세요.', 'error');
    } else {
      Object.assign(patch, { front: str(data, 'front'), back: str(data, 'back') });
      if (!patch.front || !patch.back) return toast('앞면과 뒷면을 입력해 주세요.', 'error');
    }
    const base = PACK_BY_ID.get(id);
    if (base) {
      // 앱에 들어 있는 문제를 고친 경우: 고친 내용을 Firebase에 따로 저장
      const { id: _id, ...fields } = base;
      await setDoc(doc(db, col, id), { ...fields, ...patch }, { merge: true });
    } else {
      await updateDoc(doc(db, col, id), patch);
    }
    S.ui.reviewEdit = null;
    refresh();
    toast('저장했어요.');
  },
  'review-delete': async (el) => {
    if (!confirm('삭제할까요? 학생 화면에서도 사라져요.')) return;
    await removeContent(el.dataset.col, el.dataset.id);
  },
};

// 지운 문제가 문제 팩 업데이트 때 다시 생기지 않도록 기록해 둠
export async function removeContent(col, id) {
  const item = [...S.quizzes, ...S.cards].find((x) => x.id === id);
  await deleteDoc(doc(db, col, id));
  if (item?.pack || PACK_BY_ID.has(id)) {
    await setDoc(doc(db, 'config', 'app'), { deletedPackItems: arrayUnion(id) }, { merge: true });
  }
}
