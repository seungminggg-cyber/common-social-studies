// 유튜브 업로드 (YouTube Data API v3)
//
// 원칙: 항상 '비공개'로 올린다. publishAt(예약 공개 시각)을 주면 그 시각에 유튜브가 공개로 바꾼다.
//       공개 범위를 안 적으면 2026-11-02부터 '공개'가 기본이라, 이 도구는 언제나 privacyStatus=private 를 적는다.
// 꼭 적어야 하는 것(빠지면 멈춤): 아동용 여부, 유료 광고(PPL) 여부, 합성 미디어(실제처럼 보이는 AI) 여부.
//
// 열쇠
//   - YT_REFRESH_TOKEN (환경 변수): 강사가 OAuth Playground에서 받은 '갱신 토큰'. API_연결.md 참고.
//   - 클라이언트 ID·비밀번호: 네트워크 비밀값(oauth2.googleapis.com, Basic 방식)에 저장 → 중계 서버가 붙여 줌.
//     환경 변수 YT_CLIENT_ID·YT_CLIENT_SECRET 이 있으면 그것을 쓴다.
//   갱신 토큰만으로는 클라이언트 비밀번호가 없으면 쓸 수 없어서, 둘을 다른 곳에 나눠 둔다.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { BASE, REPO, guardDuplicate, addLog, ApiError } from './common.mjs';

export const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
];

// ── 접근 토큰(1시간짜리) 받기 ───────────────────────
let cached = null;
export async function accessToken() {
  if (cached && cached.until > Date.now()) return cached.token;
  const refresh = process.env.YT_REFRESH_TOKEN;
  if (!refresh) throw new Error('YT_REFRESH_TOKEN 이 없음 — API_연결.md의 유튜브 5단계(환경 변수 넣기)를 먼저');
  const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh });
  if (process.env.YT_CLIENT_ID) body.set('client_id', process.env.YT_CLIENT_ID);
  if (process.env.YT_CLIENT_SECRET) body.set('client_secret', process.env.YT_CLIENT_SECRET);
  const r = await fetch(`${BASE.oauth}/token`, { method: 'POST', body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (j.error === 'invalid_grant') throw new Error('갱신 토큰이 만료·취소됨 → API_연결.md의 \'유튜브 토큰 다시 받기\' (테스트 모드면 7일마다 만료됨)');
    if (j.error === 'invalid_client' || j.error === 'invalid_request') throw new Error(`클라이언트 ID·비밀번호를 못 찾음(네트워크 비밀값 확인): ${j.error_description || j.error}`);
    throw new ApiError(`토큰 받기 실패: ${JSON.stringify(j)}`, r.status, j);
  }
  cached = { token: j.access_token, until: Date.now() + (j.expires_in - 60) * 1000 };
  return cached.token;
}

export async function gapi(method, url, { json, body, headers = {} } = {}) {
  const token = await accessToken();
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(json ? { 'Content-Type': 'application/json; charset=UTF-8' } : {}), ...headers },
    body: json ? JSON.stringify(json) : body,
  });
  if (!res.ok) {
    const t = await res.text();
    let reason = '';
    try { reason = JSON.parse(t).error.errors?.[0]?.reason || JSON.parse(t).error.message; } catch { reason = t.slice(0, 300); }
    if (reason === 'quotaExceeded' || reason === 'uploadLimitExceeded') throw new ApiError('오늘 업로드 한도를 넘음 — 내일 다시', res.status, t);
    throw new ApiError(`유튜브 오류 ${res.status}: ${reason}`, res.status, t);
  }
  return res;
}

// ── 영상 정보 파일 검사 ──────────────────────────────
// 예시: 홍보/자동화/예시/영상정보_예시.json
export function loadSpec(file) {
  const spec = JSON.parse(readFileSync(resolve(file), 'utf8'));
  const p = [];
  for (const k of ['id', 'file', 'title', 'description']) if (!spec[k]) p.push(`'${k}' 칸이 비어 있음`);
  for (const k of ['madeForKids', 'paidPlacement', 'syntheticMedia']) {
    if (typeof spec[k] !== 'boolean') p.push(`'${k}' 칸에 true 또는 false 를 꼭 적어야 함(기본값 없음)`);
  }
  if (spec.title && [...spec.title].length > 100) p.push('제목은 100자 이하');
  if (/[<>]/.test(`${spec.title}${spec.description}`)) p.push('제목·설명에 < > 글자는 못 씀');
  if (spec.description && Buffer.byteLength(spec.description) > 5000) p.push('설명은 5000바이트(한글 약 1600자) 이하');
  if (spec.tags && spec.tags.join(',').length > 500) p.push('태그는 모두 합쳐 500자 이하');
  if (spec.publishAt) {
    const t = new Date(spec.publishAt);
    if (isNaN(t)) p.push('publishAt 형식 예: 2026-12-20T19:00:00+09:00');
    else if (t < Date.now() + 15 * 60e3) p.push('publishAt 은 지금부터 15분 뒤 이후여야 함');
  }
  if (spec.privacy && spec.privacy !== 'private') p.push('이 도구는 비공개(private)로만 올림 — privacy 칸을 지우거나 private 로');
  const path = spec.file && resolve(REPO, spec.file);
  if (path && !existsSync(path)) p.push(`영상 파일이 없음: ${spec.file}`);
  if (spec.thumbnail && !existsSync(resolve(REPO, spec.thumbnail))) p.push(`썸네일 파일이 없음: ${spec.thumbnail}`);
  if (p.length) throw new Error(`영상 정보 확인:\n- ${p.join('\n- ')}`);
  return { ...spec, path };
}

export function videoResource(spec) {
  return {
    snippet: {
      title: spec.title,
      description: spec.description,
      tags: spec.tags || [],
      categoryId: String(spec.categoryId || 27), // 27 = 교육
      defaultLanguage: spec.language || 'ko',
      defaultAudioLanguage: spec.language || 'ko',
    },
    status: {
      privacyStatus: 'private', // 언제나 비공개. 예약이면 publishAt 시각에 유튜브가 공개로 바꿈
      ...(spec.publishAt ? { publishAt: new Date(spec.publishAt).toISOString() } : {}),
      selfDeclaredMadeForKids: spec.madeForKids,
      containsSyntheticMedia: spec.syntheticMedia,
      embeddable: true,
      license: 'youtube',
    },
    paidProductPlacementDetails: { hasPaidProductPlacement: spec.paidPlacement },
  };
}

const PARTS = 'snippet,status,paidProductPlacementDetails';

export async function upload(file, { go = false, again = false } = {}) {
  const spec = loadSpec(file);
  guardDuplicate('youtube', spec.id, again);
  const resource = videoResource(spec);
  const size = statSync(spec.path).size;
  if (!go) return { dry: true, channel: 'youtube', id: spec.id, file: spec.file, mb: Math.round(size / 1e6), resource };

  // 이어 올리기(resumable) 방식: ① 정보 보내고 올릴 주소 받기 ② 파일 보내기
  const start = await gapi('POST', `${BASE.ytUpload}/videos?uploadType=resumable&part=${PARTS}`, {
    json: resource,
    headers: { 'X-Upload-Content-Length': String(size), 'X-Upload-Content-Type': mime(spec.path) },
  });
  const loc = start.headers.get('location');
  if (!loc) throw new Error('올릴 주소를 받지 못함');
  const put = await gapi('PUT', loc, { body: readFileSync(spec.path), headers: { 'Content-Type': mime(spec.path) } });
  const video = await put.json();
  let thumb = false;
  if (spec.thumbnail) {
    const tp = resolve(REPO, spec.thumbnail);
    await gapi('POST', `${BASE.ytUpload}/thumbnails/set?videoId=${video.id}`, { body: readFileSync(tp), headers: { 'Content-Type': mime(tp) } });
    thumb = true;
  }
  const url = `https://youtu.be/${video.id}`;
  addLog({ channel: 'youtube', id: spec.id, status: 'posted', mediaId: video.id, url, privacy: 'private', publishAt: spec.publishAt || null, thumbnail: thumb });
  return { posted: true, videoId: video.id, url, studio: `https://studio.youtube.com/video/${video.id}/edit`, publishAt: spec.publishAt || '(예약 없음 — 비공개로 남음)' };
}

function mime(p) {
  return { '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }[extname(p).toLowerCase()] || 'application/octet-stream';
}
