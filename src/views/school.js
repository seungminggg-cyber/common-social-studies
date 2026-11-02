// 우리 학교 탭: 학교 공지, 수업 영상(수강 인증), 자료실, 선생님 강조 필기 제보함
import { doc, setDoc, addDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '../firebase.js';
import { S, refresh, savePref } from '../store.js';
import { html } from '../lib/html.js';
import { ddayText, youtubeId, safeUrl, toast } from '../lib/util.js';

function schoolPicker() {
  if (S.role !== 'teacher') return '';
  return html`
    <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      ${S.schools.map((s) => html`
        <button type="button" class="btn btn-sm shrink-0 ${s.id === S.ui.schoolId ? 'btn-primary' : 'btn-secondary'}" data-action="pick-school" data-id="${s.id}">${s.name}</button>
      `)}
    </div>
    <p class="text-xs text-slate-500">강사 미리보기: 학생들은 자기 학교 화면만 볼 수 있어요.</p>
  `;
}

function headerCard(sch) {
  const dday = ddayText(sch.examDate);
  return html`
    <section class="card border-indigo-200 space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <span class="chip bg-indigo-600 text-white">${sch.name}</span>
        ${sch.schedule ? html`<span class="chip bg-slate-100 text-slate-600"><i class="fa-regular fa-clock"></i>${sch.schedule}</span>` : ''}
        ${dday ? html`<span class="chip bg-rose-50 text-rose-600 border border-rose-200">${sch.examName || '시험'} ${dday}</span>` : ''}
      </div>
      ${sch.notice ? html`<h2 class="text-lg font-bold leading-snug">${sch.notice}</h2>` : ''}
      ${sch.scope ? html`<p class="text-sm text-slate-500">시험 범위: ${sch.scope}</p>` : ''}
    </section>
  `;
}

function videoCard(v) {
  const id = youtubeId(v.youtubeUrl);
  const isStudent = S.role === 'student';
  const mySummary = S.school.summaries[v.id] || '';
  return html`
    <article id="video-${v.id}" class="rounded-xl border border-slate-200 p-4 space-y-3">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          ${v.date ? html`<span class="text-xs font-semibold text-indigo-600">${v.date}</span>` : ''}
          <h3 class="font-semibold text-slate-900">${v.title}</h3>
        </div>
        ${isStudent ? html`
          <span class="chip ${mySummary ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">
            ${mySummary ? '수강 인증 완료' : '시청 후 1줄 요약'}
          </span>` : ''}
      </div>
      ${id ? html`
        <div class="aspect-video w-full overflow-hidden rounded-xl bg-slate-900">
          <iframe class="w-full h-full" src="https://www.youtube-nocookie.com/embed/${id}" title="${v.title}" loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>` : html`<p class="text-sm text-rose-600">영상 주소를 확인해 주세요.</p>`}
      ${isStudent ? html`
        <form class="flex gap-2" data-submit="save-summary" data-id="${v.id}">
          <input class="input" id="sum-${v.id}" name="text" maxlength="300" value="${mySummary}" placeholder="오늘 수업 핵심을 한 줄로 요약해 보세요" />
          <button class="btn btn-primary shrink-0">${mySummary ? '수정' : '인증'}</button>
        </form>` : ''}
    </article>
  `;
}

function materialsCard() {
  const items = S.school.materials;
  return html`
    <section class="card space-y-3">
      <h2 class="card-title"><i class="fa-solid fa-folder-open text-emerald-500"></i>자료실</h2>
      ${items.length === 0 ? html`<div class="empty">등록된 자료가 없어요.</div>` : html`
        <ul class="space-y-2">
          ${items.map((m) => {
            const url = safeUrl(m.url);
            return html`
              <li class="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div class="min-w-0">
                  ${m.tag ? html`<span class="chip bg-emerald-100 text-emerald-800 mb-1">${m.tag}</span>` : ''}
                  <p class="text-sm font-medium text-slate-800">${m.title}</p>
                </div>
                ${url
                  ? html`<a class="btn btn-secondary btn-sm shrink-0" href="${url}" target="_blank" rel="noopener noreferrer">열기<i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
                  : html`<span class="text-xs text-slate-400 shrink-0">준비 중</span>`}
              </li>`;
          })}
        </ul>
      `}
    </section>
  `;
}

function intelsCard() {
  const items = S.school.intels;
  const isStudent = S.role === 'student';
  const uid = S.user?.uid;
  return html`
    <section class="card space-y-3 bg-amber-50/60 border-amber-200">
      <div>
        <h2 class="card-title"><i class="fa-solid fa-bullhorn text-amber-500"></i>선생님 강조 포인트 제보함</h2>
        <p class="card-desc">학교 수업에서 "이거 시험에 낸다!" 하신 내용을 친구들과 나눠요.</p>
      </div>
      ${items.length === 0 ? html`<div class="empty bg-white/60">첫 제보를 남겨주세요!</div>` : html`
        <ul class="space-y-2">
          ${items.map((it) => html`
            <li class="flex items-start gap-2 rounded-xl bg-white border border-amber-200 p-3 text-sm">
              <span class="chip bg-amber-100 text-amber-900 shrink-0">${it.authorName}</span>
              <p class="flex-1 text-slate-800 leading-relaxed">${it.text}</p>
              ${S.role === 'teacher' || it.authorUid === uid
                ? html`<button type="button" class="text-slate-400 hover:text-rose-600 px-1" data-action="delete-intel" data-id="${it.id}" aria-label="삭제"><i class="fa-solid fa-xmark"></i></button>`
                : ''}
            </li>
          `)}
        </ul>
      `}
      ${isStudent ? html`
        <form class="flex gap-2" data-submit="add-intel">
          <input class="input bg-white" id="intel-text" name="text" maxlength="200" placeholder="예: 롤스 정의론 서술형 6점 출제 예고!" />
          <button class="btn bg-amber-400 text-slate-900 hover:bg-amber-300 shrink-0">제보</button>
        </form>` : ''}
    </section>
  `;
}

export function schoolView() {
  const id = S.school.id;
  const sch = S.schools.find((s) => s.id === id);
  if (!S.schoolsLoaded) return html`<div class="empty">불러오는 중...</div>`;
  if (!sch) return html`<div class="space-y-4">${schoolPicker()}<div class="empty">학교 정보가 없어요.</div></div>`;
  return html`
    <div class="space-y-5">
      ${schoolPicker()}
      ${headerCard(sch)}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <section class="card space-y-4 lg:col-span-7">
          <h2 class="card-title"><i class="fa-brands fa-youtube text-rose-500"></i>수업 영상</h2>
          ${S.school.videos.length === 0
            ? html`<div class="empty">${S.school.loaded ? '등록된 수업 영상이 없어요.' : '불러오는 중...'}</div>`
            : S.school.videos.map(videoCard)}
        </section>
        <div class="lg:col-span-5 space-y-5">
          ${materialsCard()}
          ${intelsCard()}
        </div>
      </div>
    </div>
  `;
}

// ---------- 동작 ----------
export const schoolActions = {
  'pick-school': (el) => {
    S.ui.schoolId = el.dataset.id;
    savePref('schoolId', S.ui.schoolId);
    refresh();
  },
  'save-summary': async (form, e, data) => {
    const text = String(data.get('text') || '').trim();
    if (!text) return toast('한 줄 요약을 입력해 주세요.', 'error');
    await setDoc(doc(db, 'schools', S.school.id, 'videos', form.dataset.id, 'summaries', S.user.uid), {
      text, name: S.profile.name, updatedAt: Date.now(),
    });
    toast('수강 인증이 저장됐어요.');
  },
  'add-intel': async (form, e, data) => {
    const text = String(data.get('text') || '').trim();
    if (!text) return;
    await addDoc(collection(db, 'schools', S.school.id, 'intels'), {
      text, authorUid: S.user.uid, authorName: S.profile.name, createdAt: Date.now(),
    });
    form.reset();
    toast('제보가 등록됐어요. 고마워요!');
  },
  'delete-intel': async (el) => {
    if (!confirm('이 제보를 삭제할까요?')) return;
    await deleteDoc(doc(db, 'schools', S.school.id, 'intels', el.dataset.id));
  },
};
