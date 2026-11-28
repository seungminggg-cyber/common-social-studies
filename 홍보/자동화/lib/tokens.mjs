// 토큰(출입증) 만료 관리
//   인스타·스레드 장기 토큰은 60일이면 끊긴다. 받은 날짜만 기록해 두고(값은 적지 않음),
//   만료 7일 전부터 경고한다. 갱신(refresh)이 되면 자동으로 날짜를 늘린다.
//   기록 파일: 홍보/자동화/기록/토큰.json  (날짜만 들어 있음)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { STATE, BASE, meta, todayKST, daysBetween } from './common.mjs';
import { accessToken } from './youtube.mjs';

const FILE = join(STATE, '토큰.json');
export const WARN_DAYS = 7;
const LIFE = { instagram: 60, threads: 60 };
const NAMES = { instagram: '인스타그램', threads: '스레드', youtube: '유튜브' };

export function read() { return existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : {}; }
function write(d) { mkdirSync(dirname(FILE), { recursive: true }); writeFileSync(FILE, JSON.stringify(d, null, 2) + '\n'); }

function addDays(day, n) { const d = new Date(day + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

export function alias(ch) {
  const m = { insta: 'instagram', ig: 'instagram', instagram: 'instagram', 인스타: 'instagram', threads: 'threads', th: 'threads', 스레드: 'threads', youtube: 'youtube', yt: 'youtube', 유튜브: 'youtube' };
  if (!m[ch]) throw new Error(`채널 이름을 모름: ${ch} (insta / threads / youtube)`);
  return m[ch];
}

// 강사가 새 토큰을 저장한 날을 기록: token set insta [날짜]
export function setSaved(ch, day = todayKST(), note = '') {
  const d = read();
  const c = alias(ch);
  d[c] = { saved: day, ...(LIFE[c] ? { expires: addDays(day, LIFE[c]) } : {}), ...(note ? { note } : {}) };
  write(d);
  return d[c];
}

// 남은 날짜 표. 경고가 하나라도 있으면 warn=true
export function status(today = todayKST()) {
  const d = read();
  const rows = []; let warn = false;
  for (const c of ['instagram', 'threads', 'youtube']) {
    const r = d[c];
    if (!r) { rows.push(`${NAMES[c]}: 아직 연결 안 함`); continue; }
    if (!r.expires) { rows.push(`${NAMES[c]}: ${r.saved} 연결${r.note ? ` (${r.note})` : ''} — 만료 날짜 없음, 실제 확인은 'token check'`); continue; }
    const left = daysBetween(today, r.expires);
    const mark = left < 0 ? '⛔ 만료됨' : left <= WARN_DAYS ? `⚠ ${left}일 남음 — 갱신 필요` : `${left}일 남음`;
    if (left <= WARN_DAYS) warn = true;
    rows.push(`${NAMES[c]}: ${r.expires} 만료 (${mark})`);
  }
  return { rows, warn };
}

// 갱신(시험용): 인스타·스레드 장기 토큰은 받은 지 24시간이 지났고 살아 있으면 refresh 로 60일 연장된다.
//   그런데 갱신하면 '새 토큰 문자열'이 돌아오는 것으로 보이고(공식 예시), 네트워크 비밀값은 코드가 바꿀 수 없다.
//   그래서 기본 방법은 '만료 전에 대시보드에서 새 토큰을 받아 다시 저장'이다(API_연결.md 토큰 갱신).
//   이 함수는 환경 변수(IG_TOKEN/TH_TOKEN)로 토큰을 쓰는 경우에만 쓴다. 새 값은 화면에 내지 않는다.
export async function refresh(ch) {
  const c = alias(ch);
  if (c === 'youtube') { await accessToken(); return { channel: c, ok: true, note: '갱신 토큰으로 접근 토큰 받기 성공' }; }
  const env = c === 'instagram' ? 'IG_TOKEN' : 'TH_TOKEN';
  if (!process.env[env]) throw new Error(`${NAMES[c]} 토큰이 네트워크 비밀값에 있으면 여기서 갱신하지 않음 → 대시보드에서 새 토큰을 받아 다시 저장(API_연결.md)`);
  const url = c === 'instagram' ? `${BASE.igRoot}/refresh_access_token` : `${BASE.thRoot}/refresh_access_token`;
  const grant = c === 'instagram' ? 'ig_refresh_token' : 'th_refresh_token';
  const r = await meta('GET', url, { grant_type: grant }, env);
  const changed = Boolean(r.access_token && r.access_token !== process.env[env]);
  const days = Math.floor((r.expires_in || 0) / 86400);
  const d = read(); const today = todayKST();
  d[c] = { ...(d[c] || {}), refreshed: today, expires: addDays(today, days || LIFE[c]) };
  write(d);
  return { channel: c, ok: true, expires: d[c].expires, mustResave: changed, note: changed ? '새 토큰 문자열이 왔음 — 환경 변수 값을 새것으로 바꿔야 함(값은 표시하지 않음)' : '같은 토큰이 연장됨' };
}

// 실제로 열쇠가 듣는지 확인(계정 이름만 받아 봄)
export async function check() {
  const out = [];
  try { const m = await meta('GET', `${BASE.ig}/me`, { fields: 'user_id,username' }, 'IG_TOKEN'); out.push(`인스타그램: 연결됨 (@${m.username})`); }
  catch (e) { out.push(`인스타그램: 안 됨 — ${e.message}`); }
  try { const m = await meta('GET', `${BASE.th}/me`, { fields: 'id,username' }, 'TH_TOKEN'); out.push(`스레드: 연결됨 (@${m.username})`); }
  catch (e) { out.push(`스레드: 안 됨 — ${e.message}`); }
  try {
    const t = await accessToken();
    const r = await fetch(`${BASE.yt}/channels?part=snippet&mine=true`, { headers: { Authorization: `Bearer ${t}` } });
    const j = await r.json();
    out.push(r.ok ? `유튜브: 연결됨 (${j.items?.[0]?.snippet?.title || '채널 없음'})` : `유튜브: 안 됨 — ${j.error?.message}`);
  } catch (e) { out.push(`유튜브: 안 됨 — ${e.message}`); }
  return out;
}
