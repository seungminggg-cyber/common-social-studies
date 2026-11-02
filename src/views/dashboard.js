// 강사용 현황판: 학생별 최근 7일 활동, 많이 틀린 문제, 영상 미시청 학생
// 실시간으로 계속 읽으면 무료 사용량을 많이 쓰기 때문에, 열 때와 [새로고침]을 누를 때만 불러옵니다.
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '../firebase.js';
import { S, refresh, schoolName } from '../store.js';
import { html } from '../lib/html.js';
import { dateKey, todayKey, parseDateKey } from '../lib/util.js';

const KOR_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const approved = () => S.t.users.filter((u) => u.status === 'approved');

function lastDays(n) {
  const today = parseDateKey(todayKey());
  return Array.from({ length: n }, (_, i) => dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (n - 1 - i))));
}

export async function loadDashboard() {
  if (S.t.dash?.loading) return;
  S.t.dash = { ...(S.t.dash || {}), loading: true, error: '' };
  refresh();
  try {
    const dayKeys = lastDays(7);
    const students = approved();
    const perStudent = await Promise.all(students.map(async (u) => {
      const [daysSnap, weakSnap] = await Promise.all([
        getDocs(query(
          collection(db, 'users', u.id, 'days'),
          where(documentId(), '>=', dayKeys[0]),
          where(documentId(), '<=', dayKeys[dayKeys.length - 1]),
        )),
        getDocs(collection(db, 'users', u.id, 'weak')),
      ]);
      return {
        uid: u.id,
        days: Object.fromEntries(daysSnap.docs.map((d) => [d.id, d.data()])),
        weak: weakSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      };
    }));
    const videos = await Promise.all(S.schools.map(async (sch) => {
      const snap = await getDocs(collection(db, 'schools', sch.id, 'videos'));
      const list = await Promise.all(snap.docs.map(async (v) => {
        const sums = await getDocs(collection(db, 'schools', sch.id, 'videos', v.id, 'summaries'));
        return { id: v.id, title: v.data().title, createdAt: v.data().createdAt || 0, done: sums.docs.map((d) => d.id) };
      }));
      return { schoolId: sch.id, videos: list.sort((a, b) => b.createdAt - a.createdAt) };
    }));
    S.t.dash = {
      loading: false,
      loadedAt: Date.now(),
      dayKeys,
      students: Object.fromEntries(perStudent.map((s) => [s.uid, s])),
      videos: Object.fromEntries(videos.map((v) => [v.schoolId, v.videos])),
    };
  } catch (err) {
    console.error(err);
    S.t.dash = { loading: false, error: '현황을 불러오지 못했어요. 잠시 후 새로고침해 주세요.' };
  }
  refresh();
}

function isActive(d) {
  if (!d) return false;
  return Boolean(
    (d.answers && Object.keys(d.answers).length)
    || d.pomo > 0
    || (Array.isArray(d.items) && d.items.length)
    || d.goal,
  );
}

function studentStats(u) {
  const dash = S.t.dash;
  const data = dash.students[u.id] || { days: {}, weak: [] };
  const today = todayKey();
  const quizIds = new Set(S.quizzes.map((q) => q.id));
  const dots = dash.dayKeys.map((k) => isActive(data.days[k]));
  const lastIdx = dots.lastIndexOf(true);
  const daysSince = lastIdx === -1 ? null : dots.length - 1 - lastIdx;
  const todayAnswers = Object.keys(data.days[today]?.answers || {}).filter((id) => quizIds.has(id)).length;
  const pomo = dash.dayKeys.reduce((sum, k) => sum + (Number(data.days[k]?.pomo) || 0), 0);
  const planDays = dash.dayKeys.map((k) => data.days[k]?.items).filter((items) => Array.isArray(items) && items.length);
  const planAvg = planDays.length
    ? Math.round(planDays.reduce((sum, items) => sum + items.reduce((a, it) => a + (Number(it.progress) || 0), 0) / items.length, 0) / planDays.length)
    : null;
  const vids = dash.videos[u.schoolId] || [];
  const missing = vids.filter((v) => !v.done.includes(u.id)).length;
  const scores = S.t.reports[u.id]?.scores || [];
  const latest = scores[scores.length - 1];
  return { dots, daysSince, todayAnswers, pomo, planAvg, weak: data.weak.length, missing, latest };
}

function tile(label, value, sub, cls) {
  return html`
    <div class="card !p-4 ${cls}">
      <p class="text-sm text-slate-500">${label}</p>
      <p class="text-2xl font-bold mt-1">${value}</p>
      ${sub ? html`<p class="text-xs text-slate-400 mt-0.5">${sub}</p>` : ''}
    </div>`;
}

function activityCard(rows) {
  const dash = S.t.dash;
  const total = S.quizzes.length;
  return html`
    <section class="card space-y-4">
      <div>
        <h2 class="card-title"><i class="fa-solid fa-user-check text-indigo-500"></i>학생별 최근 7일 활동</h2>
        <p class="card-desc">오래 안 들어온 학생이 위에 보여요. 동그라미는 날짜별로 퀴즈·플래너·타이머 중 하나라도 한 날이에요.</p>
      </div>
      ${rows.length === 0 ? html`<div class="empty">승인된 학생이 없어요.</div>` : html`
        <div class="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
          <table class="w-full min-w-[720px] text-sm">
            <thead>
              <tr class="text-left text-xs text-slate-500 border-b border-slate-200">
                <th class="py-2 pr-3 font-medium">학생</th>
                <th class="py-2 pr-3 font-medium">
                  <div class="flex gap-1">${dash.dayKeys.map((k) => html`<span class="w-5 text-center">${KOR_DAYS[parseDateKey(k).getDay()]}</span>`)}</div>
                </th>
                <th class="py-2 pr-3 font-medium">마지막 활동</th>
                <th class="py-2 pr-3 font-medium text-right">오늘 퀴즈</th>
                <th class="py-2 pr-3 font-medium text-right">주간 타이머</th>
                <th class="py-2 pr-3 font-medium text-right">플래너 달성</th>
                <th class="py-2 pr-3 font-medium text-right">오답 노트</th>
                <th class="py-2 pr-3 font-medium text-right">최근 점수</th>
                <th class="py-2 font-medium text-right">영상 미인증</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${rows.map(({ u, s }) => {
                const warn = s.daysSince === null || s.daysSince >= 3;
                return html`
                  <tr class="${warn ? 'bg-rose-50/50' : ''}">
                    <td class="py-2.5 pr-3">
                      <p class="font-semibold">${u.name}</p>
                      <p class="text-xs text-slate-400">${schoolName(u.schoolId)}</p>
                    </td>
                    <td class="py-2.5 pr-3">
                      <div class="flex gap-1">${s.dots.map((on) => html`<span class="w-5 h-5 rounded-full ${on ? 'bg-emerald-500' : 'bg-slate-200'}"></span>`)}</div>
                    </td>
                    <td class="py-2.5 pr-3 ${warn ? 'text-rose-600 font-semibold' : 'text-slate-600'}">
                      ${s.daysSince === null ? '7일 넘게 없음' : s.daysSince === 0 ? '오늘' : `${s.daysSince}일 전`}
                    </td>
                    <td class="py-2.5 pr-3 text-right">${s.todayAnswers} / ${total}</td>
                    <td class="py-2.5 pr-3 text-right">${s.pomo}회</td>
                    <td class="py-2.5 pr-3 text-right">${s.planAvg === null ? '-' : `${s.planAvg}%`}</td>
                    <td class="py-2.5 pr-3 text-right">${s.weak}개</td>
                    <td class="py-2.5 pr-3 text-right">${s.latest ? `${s.latest.score}점` : '-'}</td>
                    <td class="py-2.5 text-right ${s.missing ? 'text-rose-600 font-semibold' : 'text-slate-400'}">${s.missing ? `${s.missing}개` : '없음'}</td>
                  </tr>`;
              })}
            </tbody>
          </table>
        </div>
      `}
    </section>
  `;
}

function wrongCard(students) {
  const dash = S.t.dash;
  const counts = new Map();
  students.forEach((u) => {
    (dash.students[u.id]?.weak || []).forEach((w) => {
      const cur = counts.get(w.id) || { ...w, count: 0 };
      cur.count += 1;
      counts.set(w.id, cur);
    });
  });
  const top = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  const n = students.length || 1;
  return html`
    <section class="card space-y-4">
      <div>
        <h2 class="card-title"><i class="fa-solid fa-circle-exclamation text-rose-500"></i>많이 틀린 문제 TOP 10</h2>
        <p class="card-desc">지금 오답 노트에 담고 있는 학생 수 기준이에요. 수업 때 다시 짚어주면 좋아요.</p>
      </div>
      ${top.length === 0 ? html`<div class="empty">아직 틀린 문제가 없어요.</div>` : html`
        <ol class="space-y-2.5">
          ${top.map((w, i) => {
            const pct = Math.round((w.count / n) * 100);
            return html`
              <li class="flex gap-3 text-sm">
                <span class="w-6 h-6 shrink-0 rounded-full ${i < 3 ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'} flex items-center justify-center text-xs font-bold">${i + 1}</span>
                <div class="flex-1 min-w-0 space-y-1">
                  <p class="text-slate-800 leading-snug">${w.question}</p>
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full bg-rose-400" style="width:${pct}%"></div></div>
                    <span class="text-xs text-slate-500 shrink-0">${w.count}명 (${pct}%) · ${w.type === 'ox' ? 'O/X' : '빈칸'}</span>
                  </div>
                </div>
              </li>`;
          })}
        </ol>
      `}
    </section>
  `;
}

function videoCard(students) {
  const dash = S.t.dash;
  const filter = S.ui.adminFilter;
  const schools = S.schools.filter((s) => !filter || s.id === filter);
  const blocks = schools.map((sch) => {
    const members = students.filter((u) => u.schoolId === sch.id);
    const vids = (dash.videos[sch.id] || []).slice(0, 5);
    if (!vids.length || !members.length) return '';
    return html`
      <div class="space-y-2">
        <p class="text-sm font-semibold">${sch.name} <span class="text-slate-400 font-normal">${members.length}명</span></p>
        <ul class="space-y-2">
          ${vids.map((v) => {
            const missing = members.filter((u) => !v.done.includes(u.id));
            const pct = Math.round(((members.length - missing.length) / members.length) * 100);
            return html`
              <li class="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm space-y-1.5">
                <div class="flex items-center justify-between gap-2">
                  <p class="font-medium truncate">${v.title}</p>
                  <span class="chip shrink-0 ${pct === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}">${pct}% 인증</span>
                </div>
                ${missing.length ? html`<p class="text-xs text-rose-600">미인증: ${missing.map((u) => u.name).join(', ')}</p>` : html`<p class="text-xs text-emerald-600">모두 인증했어요</p>`}
              </li>`;
          })}
        </ul>
      </div>`;
  }).filter(Boolean);
  return html`
    <section class="card space-y-4">
      <div>
        <h2 class="card-title"><i class="fa-brands fa-youtube text-rose-500"></i>수업 영상 수강 인증</h2>
        <p class="card-desc">학교별 최근 영상 5개까지 보여요.</p>
      </div>
      ${blocks.length ? blocks : html`<div class="empty">등록된 영상이나 학생이 없어요.</div>`}
    </section>
  `;
}

export function dashboardView() {
  const dash = S.t.dash;
  // 학생 목록과 학교 목록을 먼저 받아온 뒤에 현황을 불러옴
  if (!dash && S.t.usersLoaded && S.schoolsLoaded) loadDashboard();
  const filter = S.ui.adminFilter;
  const students = approved().filter((u) => !filter || u.schoolId === filter);
  const header = html`
    <div class="flex flex-wrap items-center justify-between gap-2">
      <select class="input !w-auto" data-change="admin-filter" aria-label="학교 필터">
        <option value="" ${!filter ? 'selected' : ''}>전체 학교</option>
        ${S.schools.map((s) => html`<option value="${s.id}" ${s.id === filter ? 'selected' : ''}>${s.name}</option>`)}
      </select>
      <div class="flex items-center gap-2 text-xs text-slate-500">
        ${dash?.loadedAt ? html`<span>${new Date(dash.loadedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준</span>` : ''}
        <button type="button" class="btn btn-secondary btn-sm" data-action="dash-reload" ${dash?.loading ? 'disabled' : ''}>
          <i class="fa-solid fa-rotate ${dash?.loading ? 'fa-spin' : ''}"></i>새로고침
        </button>
      </div>
    </div>`;
  if (!dash || (dash.loading && !dash.loadedAt)) {
    return html`${header}<div class="empty"><i class="fa-solid fa-spinner fa-spin mr-1"></i>현황을 불러오는 중...</div>`;
  }
  if (dash.error) return html`${header}<div class="empty text-rose-600">${dash.error}</div>`;

  const rows = students
    .map((u) => ({ u, s: studentStats(u) }))
    .sort((a, b) => (b.s.daysSince ?? 99) - (a.s.daysSince ?? 99) || String(a.u.name).localeCompare(String(b.u.name), 'ko'));
  const activeToday = rows.filter((r) => r.s.daysSince === 0).length;
  const weekPomo = rows.reduce((sum, r) => sum + r.s.pomo, 0);
  const missingVideos = rows.reduce((sum, r) => sum + r.s.missing, 0);
  const waiting = S.t.users.filter((u) => u.status !== 'approved').length;

  return html`
    ${header}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      ${tile('수강생', `${students.length}명`, waiting ? `승인 대기 ${waiting}명` : '', '')}
      ${tile('오늘 공부한 학생', `${activeToday} / ${students.length}명`, '퀴즈·플래너·타이머 기준', '')}
      ${tile('이번 주 집중 타이머', `${weekPomo}회`, '최근 7일 합계', '')}
      ${tile('영상 미인증', `${missingVideos}건`, '학생 × 영상 수', missingVideos ? 'border-rose-200' : '')}
    </div>
    ${activityCard(rows)}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      ${wrongCard(students)}
      ${videoCard(students)}
    </div>
  `;
}

export const dashboardActions = {
  'dash-reload': () => loadDashboard(),
};
