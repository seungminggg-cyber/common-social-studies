// 게시 도구들이 함께 쓰는 부품: 주소 설정, 열쇠(토큰) 다루기, 게시 기록, 날짜.
//
// 열쇠를 다루는 방식 (중요)
//   - 열쇠·토큰은 코드나 저장소에 절대 적지 않는다.
//   - 기본: 클라우드 환경의 '네트워크 비밀값'에 저장한다(Claude의 request_credential 도구로 강사가 입력).
//     그러면 환경의 중계 서버가 그 주소로 가는 요청에 'Authorization' 머리글을 자동으로 붙여 준다.
//     → 이 코드는 열쇠 값을 전혀 보지 않는다. (graph.instagram.com 은 공식 문서에 Bearer 머리글 예시가 있음. graph.threads.com 도 머리글을 읽는 것을 2026-11-28 시험으로 확인 — 첫 연결 때 다시 확인)
//   - 대안: 환경 변수(IG_TOKEN, TH_TOKEN)에 넣었다면 그 값을 access_token 으로 보낸다.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = join(dirname(fileURLToPath(import.meta.url)), '..'); // 홍보/자동화
export const PROMO = join(HERE, '..'); // 홍보
export const REPO = join(PROMO, '..');

// 주소 — 시험할 때는 환경 변수로 가짜 서버 주소를 넣을 수 있다(tests/mock.test.mjs).
export const BASE = {
  ig: process.env.IG_BASE || 'https://graph.instagram.com/v27.0',
  igRoot: process.env.IG_ROOT || 'https://graph.instagram.com',
  th: process.env.TH_BASE || 'https://graph.threads.com/v1.0',
  thRoot: process.env.TH_ROOT || 'https://graph.threads.com',
  oauth: process.env.OAUTH_BASE || 'https://oauth2.googleapis.com',
  yt: process.env.YT_BASE || 'https://www.googleapis.com/youtube/v3',
  ytUpload: process.env.YT_UPLOAD || 'https://www.googleapis.com/upload/youtube/v3',
  yta: process.env.YTA_BASE || 'https://youtubeanalytics.googleapis.com/v2',
};

// 공개 그림 주소(인스타·스레드가 가져갈 그림). 이미지_공개주소.md 참고.
export const PUBLIC = {
  owner: 'seungminggg-cyber',
  repo: 'common-social-studies',
  branch: process.env.PUBLIC_BRANCH || 'claude/promo',
  dir: '홍보/자동화/공개', // 저장소 안 폴더
};
export function publicUrl(relPath) {
  if (process.env.PUBLIC_BASE) return `${process.env.PUBLIC_BASE}/${relPath}`;
  const path = `${PUBLIC.dir}/${relPath}`.split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${PUBLIC.owner}/${PUBLIC.repo}/${PUBLIC.branch}/${path}`;
}

// ── 요청 ────────────────────────────────────────────
export class ApiError extends Error {
  constructor(msg, status, body) { super(msg); this.status = status; this.body = body; }
}

// Meta(인스타·스레드) 요청. tokenEnv 가 있으면 access_token 으로 붙이고, 없으면 중계 서버가 머리글을 붙인다.
export async function meta(method, url, params = {}, tokenEnv) {
  const u = new URL(url);
  const body = new URLSearchParams();
  const token = tokenEnv && process.env[tokenEnv];
  const all = { ...params, ...(token ? { access_token: token } : {}) };
  for (const [k, v] of Object.entries(all)) {
    if (v === undefined || v === null) continue;
    (method === 'GET' ? u.searchParams : body).set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  const res = await fetch(u, { method, ...(method === 'GET' ? {} : { body }) });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok || json.error) {
    const e = json.error || {};
    throw new ApiError(explainMeta(e, res.status), res.status, json);
  }
  return json;
}

function explainMeta(e, status) {
  const base = `${e.message || '알 수 없는 오류'} (코드 ${e.code ?? status}${e.error_subcode ? '/' + e.error_subcode : ''})`;
  if (e.code === 190) return `열쇠(토큰)가 없거나 만료됨 → 'node 홍보/자동화/post.mjs token' 으로 확인, API_연결.md의 '토큰 다시 받기'. 원문: ${base}`;
  if (e.code === 10 || e.code === 200) return `권한이 부족함(앱에 권한을 켰는지, 계정이 테스터로 수락됐는지 확인). 원문: ${base}`;
  if (e.code === 4 || e.code === 9 || e.code === 32) return `요청 한도에 걸림 — 1시간 뒤 다시. 원문: ${base}`;
  return base;
}

export function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── 게시 기록 (같은 것을 두 번 올리지 않게) ─────────────
// 기록 폴더(시험할 때는 STATE_DIR 로 바꿈)
export const STATE = process.env.STATE_DIR || join(HERE, '기록');
const LOG = join(STATE, '게시기록.json');
export function readLog() {
  if (!existsSync(LOG)) return [];
  return JSON.parse(readFileSync(LOG, 'utf8'));
}
export function writeLog(list) {
  mkdirSync(dirname(LOG), { recursive: true });
  writeFileSync(LOG, JSON.stringify(list, null, 2) + '\n');
}
// 이미 올린 것인지 확인. 올렸으면 그 기록을 돌려준다.
export function findPosted(channel, id) {
  return readLog().find((r) => r.channel === channel && r.id === id && r.status === 'posted');
}
export function addLog(rec) {
  const list = readLog();
  list.push({ at: nowKST(), ...rec });
  writeLog(list);
}
export function guardDuplicate(channel, id, again) {
  const prev = findPosted(channel, id);
  if (prev && !again) {
    throw new Error(`이미 올린 적이 있음: ${channel} ${id} (${prev.at}, ${prev.url || prev.mediaId || ''}). 정말 다시 올리려면 --again`);
  }
}

// ── 날짜 (한국 시간) ───────────────────────────────
export function nowKST() {
  const d = new Date(Date.now() + 9 * 3600e3);
  return d.toISOString().replace('T', ' ').slice(0, 16) + ' KST';
}
export function todayKST() { return nowKST().slice(0, 10); }
export function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400e3); }

// ── 명령줄 옵션 ────────────────────────────────────
// 값 없이 쓰는 옵션(켜기/끄기)
const FLAGS = new Set(['go', 'again', 'dry', 'help', 'refresh', 'check']);
export function parseArgs(argv) {
  const pos = []; const opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (!FLAGS.has(k) && next !== undefined && !next.startsWith('--')) { opt[k] = next; i++; } else opt[k] = true;
    } else pos.push(a);
  }
  return { pos, opt };
}
