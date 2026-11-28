// 스레드 글 게시 (Threads API, graph.threads.com)
//
// 글 파일: 홍보/ 안의 .txt 파일(인스타·스레드 채팅이 만든 th* 글). 첫 줄부터 끝까지가 본문.
//   그림을 붙이려면 --image <공개 주소> (JPEG·PNG 8MB 이하).
// 순서: 그릇(컨테이너) 만들기 → 처리 확인 → 게시.
import { readFileSync, existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { BASE, meta, sleep, guardDuplicate, addLog } from './common.mjs';

const TOKEN_ENV = 'TH_TOKEN';
const TEXT_MAX = 500;
const LINK_MAX = 5;

export function checkText(text) {
  const problems = [];
  const n = [...text].length;
  if (!n) problems.push('글이 비어 있음');
  if (n > TEXT_MAX) problems.push(`글이 ${n}자 — ${TEXT_MAX}자 이하여야 함`);
  const links = new Set(text.match(/https?:\/\/\S+/g) || []);
  if (links.size > LINK_MAX) problems.push(`서로 다른 링크 ${links.size}개 — ${LINK_MAX}개 이하여야 함`);
  return problems;
}

export function readPost(file) {
  const f = resolve(file);
  if (!existsSync(f)) throw new Error(`글 파일이 없음: ${file}`);
  return { id: basename(f).replace(/\.[^.]+$/, ''), text: readFileSync(f, 'utf8').trim() };
}

async function waitReady(containerId) {
  for (let i = 0; i < 20; i++) {
    const r = await meta('GET', `${BASE.th}/${containerId}`, { fields: 'status,error_message' }, TOKEN_ENV);
    if (r.status === 'FINISHED') return;
    if (r.status === 'ERROR' || r.status === 'EXPIRED') throw new Error(`처리 실패: ${r.status} ${r.error_message || ''}`);
    await sleep(Number(process.env.POLL_MS ?? 10000));
  }
  throw new Error('처리가 끝나지 않음 — 나중에 다시');
}

export async function post(file, { go = false, again = false, image, aiLabel = false } = {}) {
  const { id, text } = readPost(file);
  guardDuplicate('threads', id, again);
  const problems = checkText(text);
  if (problems.length) throw new Error(problems.join('\n'));
  const plan = { channel: 'threads', id, text, image: image || null };
  if (!go) return { dry: true, ...plan };

  const me = await meta('GET', `${BASE.th}/me`, { fields: 'id,username' }, TOKEN_ENV);
  const params = image
    ? { media_type: 'IMAGE', image_url: image, text }
    : { media_type: 'TEXT', text };
  if (aiLabel) params.is_made_with_ai = true;
  const c = await meta('POST', `${BASE.th}/${me.id}/threads`, params, TOKEN_ENV);
  await waitReady(c.id);
  const pub = await meta('POST', `${BASE.th}/${me.id}/threads_publish`, { creation_id: c.id }, TOKEN_ENV);
  let url = '';
  try { url = (await meta('GET', `${BASE.th}/${pub.id}`, { fields: 'permalink' }, TOKEN_ENV)).permalink || ''; } catch { /* 없어도 됨 */ }
  addLog({ channel: 'threads', id, status: 'posted', mediaId: pub.id, url, account: me.username });
  return { posted: true, mediaId: pub.id, url, account: me.username };
}
