// 강사 관리 탭: 학생 승인·성적, 학교·영상·자료, 퀴즈·카드, 앱 설정
import {
  doc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { S, refresh, savePref, schoolName, teacherName } from '../store.js';
import { html } from '../lib/html.js';
import { toast, copyText, safeUrl, youtubeId, clampNumber, ddayText, todayKey } from '../lib/util.js';
import { seedSampleData } from '../seed.js';
import { dashboardView } from './dashboard.js';

const approved = () => S.t.users.filter((u) => u.status === 'approved');
const pending = () => S.t.users.filter((u) => u.status !== 'approved');
const reportOf = (uid) => S.t.reports[uid] || {};
const scoresOf = (uid) => (Array.isArray(reportOf(uid).scores) ? reportOf(uid).scores : []);

function schoolOptions(selected, { withAll = false, allLabel = '전체 학교' } = {}) {
  return html`
    ${withAll ? html`<option value="" ${!selected ? 'selected' : ''}>${allLabel}</option>` : ''}
    ${S.schools.map((s) => html`<option value="${s.id}" ${s.id === selected ? 'selected' : ''}>${s.name}</option>`)}
  `;
}

// ---------- 처음 시작 안내 ----------
function seedBanner() {
  if (!S.schoolsLoaded || S.schools.length > 0) return '';
  return html`
    <section class="card border-indigo-300 bg-indigo-50 space-y-3">
      <h2 class="card-title"><i class="fa-solid fa-wand-magic-sparkles text-indigo-600"></i>처음 오셨네요! 샘플 데이터로 시작해 볼까요?</h2>
      <p class="text-sm text-slate-600 leading-relaxed">기존 앱에 있던 5개 학교 정보, O/X·빈칸 퀴즈, 개념 카드, 플래시카드를 한 번에 넣어드려요. 넣은 뒤에 자유롭게 고치거나 지울 수 있어요. (예시 학생은 넣지 않아요)</p>
      <button type="button" class="btn btn-primary" data-action="seed" ${S.ui.busy ? 'disabled' : ''}>샘플 데이터로 시작하기</button>
    </section>
  `;
}

// ---------- 1. 학생 ----------
function pendingCard() {
  const list = pending();
  if (list.length === 0) return '';
  return html`
    <section class="card border-amber-300 space-y-3">
      <h2 class="card-title"><i class="fa-solid fa-user-clock text-amber-500"></i>가입 승인 대기 <span class="chip bg-amber-100 text-amber-800">${list.length}명</span></h2>
      <ul class="divide-y divide-slate-100">
        ${list.map((u) => html`
          <li class="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
            <div class="flex-1 min-w-0">
              <p class="font-semibold">${u.name}</p>
              <p class="text-xs text-slate-500 truncate"><i class="${u.provider === 'google' ? 'fa-brands fa-google' : 'fa-regular fa-envelope'} mr-1"></i>${u.email || '이메일 없음'}</p>
            </div>
            <select class="input sm:w-36" id="ap-school-${u.id}" aria-label="학교">${schoolOptions(u.schoolId)}</select>
            <div class="flex gap-2">
              <button type="button" class="btn btn-primary btn-sm" data-action="approve" data-id="${u.id}">승인</button>
              <button type="button" class="btn btn-secondary btn-sm" data-action="reject" data-id="${u.id}">거절</button>
            </div>
          </li>
        `)}
      </ul>
    </section>
  `;
}

function nextWeekLabel(schoolId) {
  const counts = approved()
    .filter((u) => !schoolId || u.schoolId === schoolId)
    .map((u) => scoresOf(u.id).length);
  return `${Math.max(0, ...counts) + 1}주 차`;
}

function bulkCard() {
  const sel = document.getElementById('bulk-school')?.value || '';
  return html`
    <section class="card space-y-3">
      <div>
        <h2 class="card-title"><i class="fa-solid fa-paste text-indigo-500"></i>성적·숙제율 한 번에 입력</h2>
        <p class="card-desc">한 줄에 한 명씩 <code class="text-xs bg-slate-100 rounded px-1">이름 | 점수 | 숙제율</code> 형식으로 붙여넣으세요. 엑셀에서 복사한 표도 돼요. 반 평균은 자동으로 계산돼요.</p>
      </div>
      <form class="space-y-2" data-submit="bulk-scores">
        <div class="grid grid-cols-2 gap-2">
          <select class="input" id="bulk-school" name="school" data-change="noop" aria-label="학교">${schoolOptions(sel, { withAll: true, allLabel: '학교 전체에서 찾기' })}</select>
          <input class="input" id="bulk-week" name="week" maxlength="20" placeholder="회차 (예: ${nextWeekLabel(sel)})" />
        </div>
        <textarea class="input font-mono" id="bulk-rows" name="rows" rows="5" placeholder="김민준 | 98 | 100&#10;이서연 | 92 | 95"></textarea>
        <button class="btn btn-primary w-full">반영하기</button>
      </form>
      ${S.ui.bulkResult ? html`<p class="text-sm whitespace-pre-line ${S.ui.bulkResult.ok ? 'text-emerald-700' : 'text-rose-600'}">${S.ui.bulkResult.text}</p>` : ''}
    </section>
  `;
}

function studentCard(u) {
  const r = reportOf(u.id);
  const scores = scoresOf(u.id);
  return html`
    <li id="stu-${u.id}" class="rounded-xl border border-slate-200 p-4 space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <p class="font-bold text-base">${u.name}</p>
        <select class="input !w-auto !py-1 !text-sm" data-change="change-school" data-id="${u.id}" aria-label="학교">${schoolOptions(u.schoolId)}</select>
        <span class="text-xs text-slate-400 truncate">${u.email}</span>
        <div class="ml-auto flex gap-1">
          <button type="button" class="btn btn-secondary btn-sm" data-action="copy-sms" data-id="${u.id}"><i class="fa-regular fa-message"></i>학부모 문자</button>
          <button type="button" class="btn btn-ghost btn-sm hover:!text-rose-600" data-action="delete-student" data-id="${u.id}" aria-label="학생 삭제"><i class="fa-regular fa-trash-can"></i></button>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <div>
          <label class="label !text-xs" for="hw-${u.id}">숙제율 (%)</label>
          <input class="input" type="number" min="0" max="100" id="hw-${u.id}" value="${r.homeworkRate ?? ''}" data-change="set-hw" data-id="${u.id}" />
        </div>
        <div class="sm:col-span-3">
          <label class="label !text-xs" for="cm-${u.id}">${teacherName()} 코멘트 (학생 리포트에 보여요)</label>
          <input class="input" id="cm-${u.id}" maxlength="200" value="${r.comment || ''}" data-change="set-comment" data-id="${u.id}" placeholder="칸을 벗어나면 자동 저장돼요" />
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        ${scores.length === 0 ? html`<span class="text-xs text-slate-400">성적 없음</span>` : scores.map((s, i) => html`
          <span class="chip bg-slate-100 text-slate-700">${s.week} <b class="text-indigo-700">${s.score}</b><span class="text-slate-400">/평균 ${s.avg ?? '-'}</span>
            <button type="button" class="ml-0.5 text-slate-400 hover:text-rose-600" data-action="del-score" data-id="${u.id}" data-idx="${i}" aria-label="삭제"><i class="fa-solid fa-xmark"></i></button>
          </span>`)}
      </div>
    </li>
  `;
}

function rosterCard() {
  const filter = S.ui.adminFilter;
  const list = approved().filter((u) => !filter || u.schoolId === filter);
  return html`
    <section class="card space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="card-title"><i class="fa-solid fa-users text-indigo-500"></i>수강생 <span class="text-slate-400 font-medium">${list.length}명</span></h2>
        <select class="input !w-auto" data-change="admin-filter" aria-label="학교 필터">${schoolOptions(filter, { withAll: true })}</select>
      </div>
      ${list.length === 0 ? html`<div class="empty">승인된 학생이 없어요. 학생들에게 앱 주소를 보내서 가입하게 해주세요.</div>` : html`
        <ul class="space-y-3">${list.map(studentCard)}</ul>
      `}
    </section>
  `;
}

function studentsTab() {
  return html`
    ${pendingCard()}
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div class="lg:col-span-4 lg:sticky lg:top-24">${bulkCard()}</div>
      <div class="lg:col-span-8">${rosterCard()}</div>
    </div>
  `;
}

// ---------- 2. 학교·영상·자료 ----------
function schoolTabs() {
  return html`
    <div class="flex flex-wrap gap-2 items-center">
      ${S.schools.map((s) => html`
        <button type="button" class="btn btn-sm ${s.id === S.ui.schoolId ? 'btn-primary' : 'btn-secondary'}" data-action="pick-school" data-id="${s.id}">${s.name}</button>`)}
      <form class="flex gap-1.5" data-submit="add-school">
        <input class="input !py-1.5 !w-32" id="new-school" name="name" maxlength="20" placeholder="새 학교 이름" />
        <button class="btn btn-secondary btn-sm"><i class="fa-solid fa-plus"></i>추가</button>
      </form>
    </div>
  `;
}

function schoolInfoCard(sch) {
  const id = sch.id;
  const field = (key, label, attrs = '') => html`
    <div>
      <label class="label" for="sch-${key}-${id}">${label}</label>
      <input class="input" id="sch-${key}-${id}" name="${key}" value="${sch[key] || ''}" ${attrs} />
    </div>`;
  const dday = ddayText(sch.examDate);
  return html`
    <section class="card space-y-4">
      <h2 class="card-title"><i class="fa-solid fa-school text-indigo-500"></i>${sch.name} 기본 정보</h2>
      <form class="space-y-3" data-submit="save-school" data-id="${id}">
        <div class="grid grid-cols-2 gap-3">
          ${field('name', '학교 이름', 'maxlength="20" required')}
          ${field('schedule', '수업 시간', 'maxlength="40" placeholder="매주 토요일 14:00~17:00"')}
          ${field('examName', '시험 이름', 'maxlength="20" placeholder="기말고사"')}
          <div>
            <label class="label" for="sch-examDate-${id}">시험 날짜 ${dday ? html`<span class="text-rose-500">(${dday})</span>` : ''}</label>
            <input class="input" type="date" id="sch-examDate-${id}" name="examDate" value="${sch.examDate || ''}" min="${todayKey().slice(0, 4)}-01-01" />
          </div>
        </div>
        ${field('notice', '학교 공지', 'maxlength="120"')}
        ${field('scope', '시험 범위', 'maxlength="80"')}
        <button class="btn btn-primary">저장</button>
      </form>
    </section>
  `;
}

function summaryPanel() {
  const v = S.ui.summaryView;
  if (!v) return '';
  const done = new Set(v.rows.map((r) => r.uid));
  const notYet = approved().filter((u) => u.schoolId === S.school.id && !done.has(u.id));
  return html`
    <div class="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3 text-sm">
      <div class="flex items-center justify-between gap-2">
        <p class="font-semibold">수강 인증 현황 · ${v.title}</p>
        <button type="button" class="btn btn-ghost btn-sm" data-action="close-summaries" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <p class="text-xs text-slate-500">인증 ${v.rows.length}명 · 미인증 ${notYet.length}명</p>
      ${v.rows.length ? html`<ul class="space-y-1.5">${v.rows.map((r) => html`<li class="rounded-lg bg-white p-2"><b>${r.name}</b> <span class="text-slate-600">${r.text}</span></li>`)}</ul>` : ''}
      ${notYet.length ? html`<p class="text-rose-600"><b>미인증:</b> ${notYet.map((u) => u.name).join(', ')}</p>` : ''}
    </div>
  `;
}

function videosCard() {
  return html`
    <section class="card space-y-4">
      <h2 class="card-title"><i class="fa-brands fa-youtube text-rose-500"></i>수업 영상</h2>
      <form class="space-y-2" data-submit="add-video">
        <input class="input" id="vid-title" name="title" maxlength="80" placeholder="영상 제목 (예: [계양고] 롤스 정의론 완벽 정리)" />
        <div class="grid grid-cols-3 gap-2">
          <input class="input col-span-2" id="vid-url" name="url" placeholder="유튜브 주소 (https://youtu.be/...)" />
          <input class="input" id="vid-date" name="date" maxlength="10" placeholder="표시 날짜 (예: 11/09)" />
        </div>
        <p class="text-xs text-slate-500">유튜브에서 '일부 공개'로 올리면 링크를 아는 학생만 볼 수 있어요.</p>
        <button class="btn btn-primary"><i class="fa-solid fa-plus"></i>영상 등록</button>
      </form>
      ${summaryPanel()}
      ${S.school.videos.length === 0 ? html`<div class="empty">등록된 영상이 없어요.</div>` : html`
        <ul class="divide-y divide-slate-100">
          ${S.school.videos.map((v) => html`
            <li class="py-3 flex items-center gap-2">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">${v.title}</p>
                <p class="text-xs ${youtubeId(v.youtubeUrl) ? 'text-slate-400' : 'text-rose-500'} truncate">${v.date ? `${v.date} · ` : ''}${youtubeId(v.youtubeUrl) ? v.youtubeUrl : '주소 오류: ' + v.youtubeUrl}</p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm shrink-0" data-action="load-summaries" data-id="${v.id}">인증 현황</button>
              <button type="button" class="btn btn-ghost btn-sm shrink-0 hover:!text-rose-600" data-action="del-video" data-id="${v.id}" aria-label="삭제"><i class="fa-regular fa-trash-can"></i></button>
            </li>`)}
        </ul>
      `}
    </section>
  `;
}

function materialsCard() {
  return html`
    <section class="card space-y-4">
      <h2 class="card-title"><i class="fa-solid fa-folder-open text-emerald-500"></i>자료실</h2>
      <form class="space-y-2" data-submit="add-material">
        <div class="grid grid-cols-3 gap-2">
          <input class="input col-span-2" id="mat-title" name="title" maxlength="80" placeholder="자료 이름" />
          <input class="input" id="mat-tag" name="tag" maxlength="10" placeholder="분류 (예: 필수)" />
        </div>
        <input class="input" id="mat-url" name="url" placeholder="링크 (구글 드라이브 등 https://...)" />
        <p class="text-xs text-slate-500">PDF는 구글 드라이브에 올리고 공유를 '링크가 있는 모든 사용자'로 바꾼 뒤 링크를 붙여넣으세요.</p>
        <button class="btn btn-primary"><i class="fa-solid fa-plus"></i>자료 등록</button>
      </form>
      ${S.school.materials.length === 0 ? html`<div class="empty">등록된 자료가 없어요.</div>` : html`
        <ul class="divide-y divide-slate-100">
          ${S.school.materials.map((m) => html`
            <li class="py-3 flex items-center gap-2">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">${m.tag ? html`<span class="chip bg-emerald-100 text-emerald-800 mr-1">${m.tag}</span>` : ''}${m.title}</p>
                <p class="text-xs truncate ${safeUrl(m.url) ? 'text-slate-400' : 'text-amber-600'}">${safeUrl(m.url) || '링크 없음 (학생에게 "준비 중"으로 보여요)'}</p>
              </div>
              <form class="hidden sm:flex gap-1" data-submit="set-material-url" data-id="${m.id}">
                <input class="input !py-1 !text-xs !w-40" id="mat-url-${m.id}" name="url" placeholder="링크 수정" />
                <button class="btn btn-secondary btn-sm">저장</button>
              </form>
              <button type="button" class="btn btn-ghost btn-sm shrink-0 hover:!text-rose-600" data-action="del-material" data-id="${m.id}" aria-label="삭제"><i class="fa-regular fa-trash-can"></i></button>
            </li>`)}
        </ul>
      `}
    </section>
  `;
}

function intelsAdminCard() {
  return html`
    <section class="card space-y-3">
      <h2 class="card-title"><i class="fa-solid fa-bullhorn text-amber-500"></i>학생 제보함</h2>
      ${S.school.intels.length === 0 ? html`<div class="empty">아직 제보가 없어요.</div>` : html`
        <ul class="space-y-2">
          ${S.school.intels.map((it) => html`
            <li class="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-sm">
              <b class="shrink-0">${it.authorName}</b>
              <span class="flex-1">${it.text}</span>
              <button type="button" class="text-slate-400 hover:text-rose-600 px-1" data-action="delete-intel" data-id="${it.id}" aria-label="삭제"><i class="fa-solid fa-xmark"></i></button>
            </li>`)}
        </ul>
      `}
    </section>
  `;
}

function schoolsTab() {
  const sch = S.schools.find((s) => s.id === S.school.id);
  return html`
    ${schoolTabs()}
    ${!sch ? html`<div class="empty">학교를 선택하거나 추가해 주세요.</div>` : html`
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div class="space-y-5">${schoolInfoCard(sch)}${intelsAdminCard()}</div>
        <div class="space-y-5">${videosCard()}${materialsCard()}</div>
      </div>
    `}
  `;
}

// ---------- 3. 퀴즈·카드 ----------
function quizForms() {
  return html`
    <section class="card space-y-3">
      <h2 class="card-title">O/X 문제 추가</h2>
      <form class="space-y-2" data-submit="add-ox">
        <input class="input" id="ox-unit" name="unit" maxlength="40" placeholder="단원 (예: Ⅳ. 인권 보장과 헌법)" />
        <textarea class="input" id="ox-q" name="question" rows="2" maxlength="300" placeholder="문제 지문"></textarea>
        <div class="grid grid-cols-4 gap-2">
          <select class="input" id="ox-a" name="answer" aria-label="정답"><option value="O">정답 O</option><option value="X">정답 X</option></select>
          <input class="input col-span-3" id="ox-exp" name="explanation" maxlength="300" placeholder="해설" />
        </div>
        <button class="btn btn-primary w-full">O/X 문제 추가</button>
      </form>
    </section>
    <section class="card space-y-3">
      <h2 class="card-title">빈칸 문제 추가</h2>
      <form class="space-y-2" data-submit="add-blank">
        <input class="input" id="bl-unit" name="unit" maxlength="40" placeholder="단원 (예: Ⅴ. 시장 경제와 금융)" />
        <textarea class="input" id="bl-q" name="question" rows="2" maxlength="300" placeholder="문제 지문 (빈칸은 [    ] 로 표시)"></textarea>
        <div class="grid grid-cols-2 gap-2">
          <input class="input" id="bl-a" name="answer" maxlength="60" placeholder="정답 (예: 기회비용/기회 비용)" />
          <input class="input" id="bl-hint" name="hint" maxlength="30" placeholder="힌트 (예: ㄱㅎㅂㅇ)" />
        </div>
        <p class="text-xs text-slate-500">띄어쓰기와 영어 대소문자는 채점할 때 무시돼요. 정답이 여러 개면 / 로 구분하세요.</p>
        <button class="btn btn-primary w-full">빈칸 문제 추가</button>
      </form>
    </section>
  `;
}

function quizList() {
  return html`
    <section class="card space-y-3">
      <h2 class="card-title">등록된 문제 <span class="text-slate-400 font-medium">${S.quizzes.length}</span></h2>
      ${S.quizzes.length === 0 ? html`<div class="empty">문제가 없어요.</div>` : html`
        <ul class="divide-y divide-slate-100 max-h-[640px] overflow-y-auto pr-1">
          ${[...S.quizzes].reverse().map((q) => html`
            <li class="py-2.5 flex items-start gap-2 text-sm">
              <span class="chip shrink-0 ${q.type === 'ox' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}">${q.type === 'ox' ? 'O/X' : '빈칸'}</span>
              <div class="flex-1 min-w-0">
                <p class="text-slate-800">${q.question}</p>
                <p class="text-xs text-slate-500 mt-0.5">${q.unit} · 정답 <b>${q.answer}</b></p>
              </div>
              <button type="button" class="btn btn-ghost btn-sm shrink-0 hover:!text-rose-600" data-action="del-quiz" data-id="${q.id}" aria-label="삭제"><i class="fa-regular fa-trash-can"></i></button>
            </li>`)}
        </ul>
      `}
    </section>
  `;
}

function cardForms() {
  const cards = S.cards;
  return html`
    <section class="card space-y-3">
      <h2 class="card-title">개념 비교 카드 추가</h2>
      <form class="space-y-2" data-submit="add-concept">
        <div class="grid grid-cols-3 gap-2">
          <input class="input col-span-2" id="cc-title" name="title" maxlength="40" placeholder="제목 (예: 롤스)" />
          <input class="input" id="cc-tag" name="tag" maxlength="15" placeholder="태그" />
        </div>
        <textarea class="input" id="cc-body" name="body" rows="2" maxlength="300" placeholder="내용 (가릴 키워드는 [무지의 베일] 처럼 대괄호로)"></textarea>
        <button class="btn btn-primary w-full">개념 카드 추가</button>
      </form>
    </section>
    <section class="card space-y-3">
      <h2 class="card-title">암기 카드 추가</h2>
      <form class="space-y-2" data-submit="add-flash">
        <input class="input" id="fc-unit" name="unit" maxlength="20" placeholder="단원 (예: 사회 정의)" />
        <input class="input" id="fc-front" name="front" maxlength="150" placeholder="앞면 (질문)" />
        <textarea class="input" id="fc-back" name="back" rows="2" maxlength="300" placeholder="뒷면 (정답, 강조는 [대괄호])"></textarea>
        <button class="btn btn-primary w-full">암기 카드 추가</button>
      </form>
    </section>
    <section class="card space-y-3">
      <h2 class="card-title">등록된 카드 <span class="text-slate-400 font-medium">${cards.length}</span></h2>
      ${cards.length === 0 ? html`<div class="empty">카드가 없어요.</div>` : html`
        <ul class="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-1">
          ${[...cards].reverse().map((c) => html`
            <li class="py-2.5 flex items-start gap-2 text-sm">
              <span class="chip shrink-0 ${c.type === 'concept' ? 'bg-amber-50 text-amber-700' : 'bg-violet-50 text-violet-700'}">${c.type === 'concept' ? '개념' : '암기'}</span>
              <div class="flex-1 min-w-0">
                <p class="font-medium">${c.type === 'concept' ? c.title : c.front}</p>
                <p class="text-xs text-slate-500 mt-0.5">${c.type === 'concept' ? c.body : c.back}</p>
              </div>
              <button type="button" class="btn btn-ghost btn-sm shrink-0 hover:!text-rose-600" data-action="del-card" data-id="${c.id}" aria-label="삭제"><i class="fa-regular fa-trash-can"></i></button>
            </li>`)}
        </ul>
      `}
    </section>
  `;
}

function contentTab() {
  return html`
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
      <div class="space-y-5">${quizForms()}</div>
      <div>${quizList()}</div>
      <div class="space-y-5">${cardForms()}</div>
    </div>
  `;
}

// ---------- 4. 설정 ----------
const GEMINI_PROMPT = `고등학교 통합사회 내신 대비용 문제를 만들어줘.
- 단원: (여기에 단원 이름을 적으세요)
- O/X 문제 5개, 빈칸 문제 3개
- 기출에 자주 나오는 선지 스타일로, 해설은 1~2문장으로
- 빈칸 문제의 지문에는 빈칸 위치를 [    ] 로 표시

반드시 아래 형식으로만, 한 줄에 한 문제씩 출력해줘. 다른 설명은 쓰지 마.
OX | 단원명 | 문제지문 | O또는X | 해설
BLANK | 단원명 | 빈칸이 [    ] 로 표시된 지문 | 정답 | 초성힌트`;

function settingsTab() {
  const c = S.config || {};
  const field = (key, label, placeholder = '') => html`
    <div>
      <label class="label" for="cfg-${key}">${label}</label>
      <input class="input" id="cfg-${key}" name="${key}" value="${c[key] || ''}" maxlength="120" placeholder="${placeholder}" />
    </div>`;
  return html`
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      <section class="card space-y-4">
        <h2 class="card-title"><i class="fa-solid fa-robot text-indigo-500"></i>제미나이로 문제 한 번에 등록</h2>
        <ol class="text-sm text-slate-600 space-y-1 list-decimal pl-5">
          <li>아래 버튼으로 출제 명령어를 복사해서 제미나이(또는 Claude)에 붙여넣으세요.</li>
          <li>나온 결과를 아래 칸에 그대로 붙여넣고 등록하세요.</li>
        </ol>
        <button type="button" class="btn btn-secondary" data-action="copy-prompt"><i class="fa-regular fa-copy"></i>출제 명령어 복사</button>
        <form class="space-y-2" data-submit="ai-upload">
          <textarea class="input font-mono !text-xs" id="ai-rows" name="rows" rows="7" placeholder="OX | 단원명 | 문제지문 | O | 해설&#10;BLANK | 단원명 | 빈칸 [    ] 지문 | 정답 | 힌트"></textarea>
          <button class="btn btn-primary w-full">문제 등록하기</button>
        </form>
        ${S.ui.aiResult ? html`<p class="text-sm ${S.ui.aiResult.ok ? 'text-emerald-700' : 'text-rose-600'}">${S.ui.aiResult.text}</p>` : ''}
      </section>

      <div class="space-y-5">
        <section class="card space-y-4">
          <h2 class="card-title"><i class="fa-solid fa-pen text-indigo-500"></i>앱 이름·공지</h2>
          <form class="space-y-3" data-submit="save-config">
            ${field('appTitle', '앱 이름', '승민T 통합사회 클래스')}
            ${field('appSubtitle', '부제목', '작전고 · 계양고 · ...')}
            ${field('teacherName', '강사 호칭', '승민T')}
            ${field('noticeHeadline', '전체 공지 제목')}
            ${field('noticeSubtext', '전체 공지 내용')}
            <button class="btn btn-primary">저장</button>
          </form>
        </section>
        <section class="card space-y-3">
          <h2 class="card-title"><i class="fa-solid fa-download text-indigo-500"></i>데이터 백업</h2>
          <p class="text-sm text-slate-600">학생, 성적, 퀴즈, 학교 정보를 파일 하나로 내려받아요. 한 달에 한 번 정도 받아두면 안심이에요.</p>
          <button type="button" class="btn btn-secondary" data-action="backup" ${S.ui.busy ? 'disabled' : ''}><i class="fa-solid fa-file-arrow-down"></i>백업 파일 받기 (.json)</button>
        </section>
      </div>
    </div>
  `;
}

export function teacherView() {
  const tab = S.ui.adminTab;
  const tabBtn = (id, label, badge = '') => html`
    <button type="button" class="seg-btn whitespace-nowrap ${tab === id ? 'active' : ''}" data-action="admin-tab" data-tab="${id}">${label}${badge ? html` <span class="chip bg-amber-400 text-slate-900 !px-1.5 ml-0.5">${badge}</span>` : ''}</button>`;
  const waiting = pending().length;
  return html`
    <div class="space-y-5">
      ${seedBanner()}
      <div class="seg overflow-x-auto">
        ${tabBtn('dashboard', '현황판')}
        ${tabBtn('students', '학생·성적', waiting ? String(waiting) : '')}
        ${tabBtn('schools', '학교·영상·자료')}
        ${tabBtn('content', '퀴즈·카드')}
        ${tabBtn('settings', '설정·백업')}
      </div>
      ${tab === 'dashboard' ? dashboardView() : ''}
      ${tab === 'students' ? studentsTab() : ''}
      ${tab === 'schools' ? schoolsTab() : ''}
      ${tab === 'content' ? contentTab() : ''}
      ${tab === 'settings' ? settingsTab() : ''}
    </div>
  `;
}

// ---------- 동작 ----------
const str = (data, key) => String(data.get(key) || '').trim();

// 같은 학교·같은 회차 학생들의 평균을 다시 계산해서 각자의 성적에 넣어줌
function applyAverages(batch, schoolId, week, newScores) {
  const students = approved().filter((u) => u.schoolId === schoolId);
  const scoreLists = Object.fromEntries(students.map((u) => [u.id, newScores[u.id] || scoresOf(u.id)]));
  const values = Object.values(scoreLists).flat().filter((s) => s.week === week).map((s) => Number(s.score) || 0);
  const avg = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
  Object.entries(scoreLists).forEach(([uid, list]) => {
    if (!list.some((s) => s.week === week)) return;
    const updated = list.map((s) => (s.week === week ? { ...s, avg } : s));
    newScores[uid] = updated;
    batch.set(doc(db, 'reports', uid), { scores: updated, updatedAt: Date.now() }, { merge: true });
  });
}

function smsText(u) {
  const r = reportOf(u.id);
  const scores = scoresOf(u.id);
  const latest = scores[scores.length - 1];
  return `안녕하세요 학부모님, ${schoolName(u.schoolId)} 통합사회 담당 강사 ${teacherName()}입니다.

[${u.name} 학생 주간 학습 리포트]
■ 과제 수행률: ${r.homeworkRate ?? '-'}%
■ 주간 테스트: ${latest ? `${latest.score}점 (반 평균 ${latest.avg ?? '-'}점)` : '아직 없음'}
■ 강사 코멘트: ${r.comment || '-'}

가정에서도 많은 격려 부탁드립니다. 감사합니다.`;
}

async function deleteSubcollection(path) {
  const snap = await getDocs(collection(db, path));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

async function withBusy(fn) {
  S.ui.busy = true;
  refresh();
  try {
    await fn();
  } finally {
    S.ui.busy = false;
    refresh();
  }
}

export const teacherActions = {
  noop: () => refresh(),
  'admin-tab': (el) => {
    S.ui.adminTab = el.dataset.tab;
    savePref('adminTab', S.ui.adminTab);
    refresh();
  },
  'admin-filter': (el) => {
    S.ui.adminFilter = el.value;
    refresh();
  },
  seed: () => withBusy(async () => {
    await seedSampleData();
    toast('샘플 데이터를 넣었어요!');
  }),

  // 학생
  approve: async (el) => {
    const uid = el.dataset.id;
    const schoolId = document.getElementById(`ap-school-${uid}`)?.value;
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', uid), { status: 'approved', schoolId });
    batch.set(doc(db, 'reports', uid), { updatedAt: Date.now() }, { merge: true });
    await batch.commit();
    toast('승인했어요.');
  },
  reject: async (el) => {
    const u = S.t.users.find((x) => x.id === el.dataset.id);
    if (!confirm(`${u?.name || ''} 학생의 가입 신청을 거절할까요?`)) return;
    await deleteDoc(doc(db, 'users', el.dataset.id));
  },
  'change-school': async (el) => {
    await updateDoc(doc(db, 'users', el.dataset.id), { schoolId: el.value });
    toast('학교를 바꿨어요.');
  },
  'set-hw': async (el) => {
    const v = el.value === '' ? null : clampNumber(el.value, 0, 100);
    await setDoc(doc(db, 'reports', el.dataset.id), { homeworkRate: v, updatedAt: Date.now() }, { merge: true });
    toast('숙제율을 저장했어요.');
  },
  'set-comment': async (el) => {
    await setDoc(doc(db, 'reports', el.dataset.id), { comment: el.value.trim(), updatedAt: Date.now() }, { merge: true });
    toast('코멘트를 저장했어요.');
  },
  'del-score': async (el) => {
    const uid = el.dataset.id;
    const idx = Number(el.dataset.idx);
    const list = scoresOf(uid);
    const target = list[idx];
    if (!target || !confirm(`${target.week} 성적(${target.score}점)을 삭제할까요?`)) return;
    const u = S.t.users.find((x) => x.id === uid);
    const batch = writeBatch(db);
    const newScores = { [uid]: list.filter((_, i) => i !== idx) };
    batch.set(doc(db, 'reports', uid), { scores: newScores[uid], updatedAt: Date.now() }, { merge: true });
    applyAverages(batch, u.schoolId, target.week, newScores);
    await batch.commit();
  },
  'bulk-scores': async (form, e, data) => {
    const school = str(data, 'school');
    const week = str(data, 'week') || nextWeekLabel(school);
    const lines = str(data, 'rows').split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return toast('붙여넣을 내용을 입력해 주세요.', 'error');
    const pool = approved().filter((u) => !school || u.schoolId === school);
    const newScores = {};
    const hw = {};
    const problems = [];
    let count = 0;
    lines.forEach((line) => {
      const parts = line.split(/\t|\|/).map((p) => p.trim());
      const [name, scoreStr, hwStr] = parts;
      const score = Number(scoreStr);
      if (!name || scoreStr === undefined || scoreStr === '' || !Number.isFinite(score)) {
        problems.push(`형식 오류: ${line}`);
        return;
      }
      const matches = pool.filter((u) => u.name === name);
      if (matches.length === 0) return problems.push(`학생 없음: ${name}`);
      if (matches.length > 1) return problems.push(`같은 이름이 여러 명: ${name} (위에서 학교를 골라주세요)`);
      const u = matches[0];
      const list = (newScores[u.id] || scoresOf(u.id)).filter((s) => s.week !== week);
      newScores[u.id] = [...list, { week, score: clampNumber(score, 0, 100) }];
      if (hwStr !== undefined && hwStr !== '' && Number.isFinite(Number(hwStr))) hw[u.id] = clampNumber(hwStr, 0, 100);
      count += 1;
    });
    if (count > 0) {
      const batch = writeBatch(db);
      Object.entries(newScores).forEach(([uid, scores]) => {
        const patch = { scores, updatedAt: Date.now() };
        if (hw[uid] !== undefined) patch.homeworkRate = hw[uid];
        batch.set(doc(db, 'reports', uid), patch, { merge: true });
      });
      const schools = new Set(Object.keys(newScores).map((uid) => S.t.users.find((u) => u.id === uid)?.schoolId));
      schools.forEach((sid) => applyAverages(batch, sid, week, newScores));
      await batch.commit();
      form.elements.rows.value = '';
    }
    S.ui.bulkResult = {
      ok: problems.length === 0,
      text: `${week}: ${count}명 반영 완료${problems.length ? `\n반영 안 된 줄 ${problems.length}개:\n${problems.join('\n')}` : ''}`,
    };
    refresh();
  },
  'copy-sms': async (el) => {
    const u = S.t.users.find((x) => x.id === el.dataset.id);
    if (!u) return;
    await copyText(smsText(u));
    toast(`${u.name} 학부모 문자를 복사했어요.`);
  },
  'delete-student': async (el) => {
    const u = S.t.users.find((x) => x.id === el.dataset.id);
    if (!u || !confirm(`${u.name} 학생을 삭제할까요?\n성적, 플래너, 오답 노트가 모두 지워지고 되돌릴 수 없어요.`)) return;
    await deleteSubcollection(`users/${u.id}/days`);
    await deleteSubcollection(`users/${u.id}/weak`);
    await deleteDoc(doc(db, 'reports', u.id));
    await deleteDoc(doc(db, 'users', u.id));
    toast(`${u.name} 학생을 삭제했어요.`);
  },

  // 학교
  'add-school': async (form, e, data) => {
    const name = str(data, 'name');
    if (!name) return toast('학교 이름을 입력해 주세요.', 'error');
    const ref = await addDoc(collection(db, 'schools'), { name, order: S.schools.length + 1 });
    S.ui.schoolId = ref.id;
    savePref('schoolId', ref.id);
    form.reset();
    toast(`${name}을(를) 추가했어요.`);
  },
  'save-school': async (form, e, data) => {
    const name = str(data, 'name');
    if (!name) return toast('학교 이름은 비울 수 없어요.', 'error');
    await updateDoc(doc(db, 'schools', form.dataset.id), {
      name,
      schedule: str(data, 'schedule'),
      examName: str(data, 'examName'),
      examDate: str(data, 'examDate'),
      notice: str(data, 'notice'),
      scope: str(data, 'scope'),
    });
    toast('학교 정보를 저장했어요.');
  },
  'add-video': async (form, e, data) => {
    const title = str(data, 'title');
    const url = str(data, 'url');
    if (!title) return toast('영상 제목을 입력해 주세요.', 'error');
    if (!youtubeId(url)) return toast('유튜브 주소가 올바르지 않아요.', 'error');
    await addDoc(collection(db, 'schools', S.school.id, 'videos'), {
      title, youtubeUrl: url, date: str(data, 'date'), createdAt: Date.now(),
    });
    form.reset();
    toast('영상을 등록했어요.');
  },
  'del-video': async (el) => {
    if (!confirm('이 영상을 삭제할까요? 학생들의 수강 인증 기록도 함께 지워져요.')) return;
    const path = `schools/${S.school.id}/videos/${el.dataset.id}`;
    await deleteSubcollection(`${path}/summaries`);
    await deleteDoc(doc(db, path));
    if (S.ui.summaryView?.videoId === el.dataset.id) S.ui.summaryView = null;
  },
  'load-summaries': async (el) => {
    const v = S.school.videos.find((x) => x.id === el.dataset.id);
    const snap = await getDocs(collection(db, 'schools', S.school.id, 'videos', el.dataset.id, 'summaries'));
    S.ui.summaryView = {
      videoId: el.dataset.id,
      title: v?.title || '',
      rows: snap.docs.map((d) => ({ uid: d.id, ...d.data() })).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    };
    refresh();
  },
  'close-summaries': () => {
    S.ui.summaryView = null;
    refresh();
  },
  'add-material': async (form, e, data) => {
    const title = str(data, 'title');
    const rawUrl = str(data, 'url');
    if (!title) return toast('자료 이름을 입력해 주세요.', 'error');
    if (rawUrl && !safeUrl(rawUrl)) return toast('링크는 https:// 로 시작해야 해요.', 'error');
    await addDoc(collection(db, 'schools', S.school.id, 'materials'), {
      title, tag: str(data, 'tag'), url: safeUrl(rawUrl), createdAt: Date.now(),
    });
    form.reset();
    toast('자료를 등록했어요.');
  },
  'set-material-url': async (form, e, data) => {
    const url = safeUrl(str(data, 'url'));
    if (!url) return toast('링크는 https:// 로 시작해야 해요.', 'error');
    await updateDoc(doc(db, 'schools', S.school.id, 'materials', form.dataset.id), { url });
    form.reset();
    toast('링크를 저장했어요.');
  },
  'del-material': async (el) => {
    if (!confirm('이 자료를 삭제할까요?')) return;
    await deleteDoc(doc(db, 'schools', S.school.id, 'materials', el.dataset.id));
  },

  // 퀴즈·카드
  'add-ox': async (form, e, data) => {
    const question = str(data, 'question');
    if (!question) return toast('문제 지문을 입력해 주세요.', 'error');
    await addDoc(collection(db, 'quizzes'), {
      type: 'ox', unit: str(data, 'unit'), question, answer: str(data, 'answer') === 'X' ? 'X' : 'O',
      explanation: str(data, 'explanation'), createdAt: Date.now(),
    });
    form.reset();
    toast('O/X 문제를 추가했어요.');
  },
  'add-blank': async (form, e, data) => {
    const question = str(data, 'question');
    const answer = str(data, 'answer');
    if (!question || !answer) return toast('지문과 정답을 입력해 주세요.', 'error');
    await addDoc(collection(db, 'quizzes'), {
      type: 'blank', unit: str(data, 'unit'), question, answer, hint: str(data, 'hint'), createdAt: Date.now(),
    });
    form.reset();
    toast('빈칸 문제를 추가했어요.');
  },
  'del-quiz': async (el) => {
    if (!confirm('이 문제를 삭제할까요?')) return;
    await deleteDoc(doc(db, 'quizzes', el.dataset.id));
  },
  'add-concept': async (form, e, data) => {
    const title = str(data, 'title');
    const body = str(data, 'body');
    if (!title || !body) return toast('제목과 내용을 입력해 주세요.', 'error');
    await addDoc(collection(db, 'cards'), { type: 'concept', title, tag: str(data, 'tag'), body, createdAt: Date.now() });
    form.reset();
    toast('개념 카드를 추가했어요.');
  },
  'add-flash': async (form, e, data) => {
    const front = str(data, 'front');
    const back = str(data, 'back');
    if (!front || !back) return toast('앞면과 뒷면을 입력해 주세요.', 'error');
    await addDoc(collection(db, 'cards'), { type: 'flash', unit: str(data, 'unit'), front, back, createdAt: Date.now() });
    form.reset();
    toast('암기 카드를 추가했어요.');
  },
  'del-card': async (el) => {
    if (!confirm('이 카드를 삭제할까요?')) return;
    await deleteDoc(doc(db, 'cards', el.dataset.id));
  },

  // 설정
  'save-config': async (form, e, data) => {
    const keys = ['appTitle', 'appSubtitle', 'teacherName', 'noticeHeadline', 'noticeSubtext'];
    await setDoc(doc(db, 'config', 'app'), Object.fromEntries(keys.map((k) => [k, str(data, k)])), { merge: true });
    toast('저장했어요.');
  },
  'copy-prompt': async () => {
    await copyText(GEMINI_PROMPT);
    toast('출제 명령어를 복사했어요. 단원 이름을 바꿔서 붙여넣으세요.');
  },
  'ai-upload': async (form, e, data) => {
    const lines = str(data, 'rows').split('\n').map((l) => l.replace(/^[-*\d.\s]+(?=OX|BLANK)/i, '').trim()).filter(Boolean);
    const batch = writeBatch(db);
    let t = Date.now();
    let added = 0;
    let skipped = 0;
    lines.forEach((line) => {
      const p = line.split('|').map((x) => x.trim());
      const kind = (p[0] || '').toUpperCase();
      if (kind === 'OX' && p.length >= 4 && p[2] && /^[OX]$/i.test(p[3])) {
        batch.set(doc(collection(db, 'quizzes')), {
          type: 'ox', unit: p[1], question: p[2], answer: p[3].toUpperCase(), explanation: p[4] || '', createdAt: t++,
        });
        added += 1;
      } else if (kind === 'BLANK' && p.length >= 4 && p[2] && p[3]) {
        batch.set(doc(collection(db, 'quizzes')), {
          type: 'blank', unit: p[1], question: p[2], answer: p[3], hint: p[4] || '', createdAt: t++,
        });
        added += 1;
      } else {
        skipped += 1;
      }
    });
    if (added) {
      await batch.commit();
      form.reset();
    }
    S.ui.aiResult = {
      ok: added > 0 && skipped === 0,
      text: added ? `${added}문제를 등록했어요.${skipped ? ` (형식이 맞지 않는 ${skipped}줄은 건너뛰었어요)` : ''}` : '등록할 수 있는 문제를 찾지 못했어요. 형식을 확인해 주세요.',
    };
    refresh();
  },
  backup: () => withBusy(async () => {
    const dump = async (path) => (await getDocs(collection(db, path))).docs.map((d) => ({ id: d.id, ...d.data() }));
    const schools = await dump('schools');
    for (const s of schools) {
      s.videos = await dump(`schools/${s.id}/videos`);
      s.materials = await dump(`schools/${s.id}/materials`);
      s.intels = await dump(`schools/${s.id}/intels`);
    }
    const data = {
      exportedAt: new Date().toISOString(),
      config: await dump('config'),
      schools,
      quizzes: await dump('quizzes'),
      cards: await dump('cards'),
      users: await dump('users'),
      reports: await dump('reports'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tongsa-backup-${todayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }),
};
