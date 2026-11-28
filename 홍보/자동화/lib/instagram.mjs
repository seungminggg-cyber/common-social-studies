// 인스타그램 카드뉴스 게시 (Instagram API with Instagram Login, graph.instagram.com)
//
// 순서
//   1) 준비(prepare): 홍보/out/<조각>/ 의 PNG를 JPEG로 바꿔 홍보/자동화/공개/<조각>/01.jpg … 에 둔다.
//      인스타 API는 JPEG만 받고, 누구나 열 수 있는 인터넷 주소에서 그림을 가져간다.
//   2) 공개: 그 폴더를 commit·push 하면 raw.githubusercontent.com 주소로 열린다(이미지_공개주소.md).
//   3) 게시(post): 장마다 '그릇(컨테이너)' → 묶음 그릇(CAROUSEL) → 처리 끝날 때까지 기다림 → 게시.
import { readdirSync, readFileSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { BASE, PROMO, HERE, meta, sleep, publicUrl, guardDuplicate, addLog } from './common.mjs';

const TOKEN_ENV = 'IG_TOKEN';
const MAX_ITEMS = 10; // 인스타 앱 화면의 기본 한도는 10장. API 문서는 20장까지라고 함 → 안전하게 10장.
const MAX_BYTES = 8 * 1024 * 1024; // JPEG 8MB 이하
const CAPTION_MAX = 2200;
const HASHTAG_MAX = 30;

export function outDir(piece) {
  const dir = join(PROMO, 'out', piece);
  if (!existsSync(dir)) throw new Error(`조각이 없음: 홍보/out/${piece} — 먼저 'node 홍보/build.mjs ${piece.split('-')[0]}'`);
  return dir;
}

// 홍보/out/cn01-네가지관점 처럼 앞부분(cn01)만 줘도 찾는다.
export function resolvePiece(name) {
  const all = readdirSync(join(PROMO, 'out'));
  const hit = all.filter((d) => d === name || d.startsWith(name + '-'));
  if (hit.length !== 1) throw new Error(hit.length ? `여러 개가 맞음: ${hit.join(', ')}` : `홍보/out/ 에 '${name}' 조각이 없음`);
  return hit[0];
}

export function slides(piece) {
  return readdirSync(outDir(piece)).filter((f) => /^\d\d-.*\.png$/.test(f)).sort();
}

export function readCaption(piece) {
  const f = join(outDir(piece), '캡션.txt');
  if (!existsSync(f)) throw new Error(`캡션이 없음: 홍보/out/${piece}/캡션.txt`);
  return readFileSync(f, 'utf8').trim();
}

export function checkCaption(text) {
  const problems = [];
  if ([...text].length > CAPTION_MAX) problems.push(`캡션이 ${[...text].length}자 — ${CAPTION_MAX}자 이하여야 함`);
  const tags = text.match(/#[^\s#]+/g) || [];
  if (tags.length > HASHTAG_MAX) problems.push(`해시태그 ${tags.length}개 — ${HASHTAG_MAX}개 이하여야 함`);
  return problems;
}

// PNG → JPEG (흰 바탕, 품질 92). ImageMagick 이 없으면 파이썬 PIL 로.
function toJpeg(src, dst) {
  try {
    execFileSync('convert', [src, '-background', 'white', '-flatten', '-quality', '92', '-sampling-factor', '4:2:0', '-strip', dst]);
  } catch {
    execFileSync('python3', ['-I', '-c',
      'import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert("RGB");im.save(sys.argv[2],"JPEG",quality=92,optimize=True)', src, dst]);
  }
}

function jpegSize(file) {
  // JPEG 머리에서 가로·세로를 읽는다(SOF 표시 찾기).
  const b = readFileSync(file);
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xc3) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

// 1) 준비: JPEG 만들기 + 검사. 만든 파일 목록을 돌려준다.
export function prepare(piece) {
  const names = slides(piece);
  if (!names.length) throw new Error(`홍보/out/${piece} 에 01-… .png 그림이 없음`);
  if (names.length > MAX_ITEMS) throw new Error(`${names.length}장 — 한 번에 ${MAX_ITEMS}장까지`);
  const id = piece.split('-')[0]; // 공개 주소는 짧은 영문 이름으로: 공개/cn01/01.jpg
  const dst = join(HERE, '공개', id);
  rmSync(dst, { recursive: true, force: true });
  mkdirSync(dst, { recursive: true });
  const files = [];
  for (const [i, n] of names.entries()) {
    const out = join(dst, `${String(i + 1).padStart(2, '0')}.jpg`);
    toJpeg(join(outDir(piece), n), out);
    const size = statSync(out).size;
    const dim = jpegSize(out);
    if (size > MAX_BYTES) throw new Error(`${n}: ${Math.round(size / 1e6)}MB — 8MB 이하여야 함`);
    const ratio = dim ? dim.w / dim.h : 0;
    if (dim && (ratio < 0.8 - 0.005 || ratio > 1.91)) throw new Error(`${n}: 비율 ${dim.w}×${dim.h} — 4:5(세로)~1.91:1(가로) 사이여야 함`);
    files.push({ src: n, rel: `${id}/${String(i + 1).padStart(2, '0')}.jpg`, bytes: size, ...dim });
  }
  return { id, files };
}

// 공개 주소가 실제로 열리는지(push 했는지) 확인
export async function checkPublic(urls) {
  const bad = [];
  for (const u of urls) {
    try {
      const r = await fetch(u, { method: 'HEAD' });
      const type = r.headers.get('content-type') || '';
      if (!r.ok || !/image\/jpe?g/.test(type)) bad.push(`${u} → ${r.status} ${type}`);
    } catch (e) { bad.push(`${u} → ${e.message}`); }
  }
  return bad;
}

async function waitReady(containerId) {
  // 문서 권장: 1분에 한 번, 5분 안에 확인. 카드뉴스 그림은 보통 몇 초면 끝나서 10초 간격으로 본다.
  for (let i = 0; i < 30; i++) {
    const r = await meta('GET', `${BASE.ig}/${containerId}`, { fields: 'status_code,status' }, TOKEN_ENV);
    if (r.status_code === 'FINISHED') return;
    if (r.status_code === 'ERROR' || r.status_code === 'EXPIRED') throw new Error(`그림 처리 실패: ${r.status_code} ${r.status || ''}`);
    await sleep(Number(process.env.POLL_MS ?? 10000));
  }
  throw new Error('5분이 지나도 그림 처리가 끝나지 않음 — 나중에 다시');
}

// 3) 게시. go=false 이면 무엇을 할지 보여 주기만 한다.
export async function post(piece, { go = false, again = false, aiLabel = false } = {}) {
  const id = piece.split('-')[0];
  guardDuplicate('instagram', id, again);
  const caption = readCaption(piece);
  const problems = checkCaption(caption);
  if (problems.length) throw new Error(problems.join('\n'));
  const dir = join(HERE, '공개', id);
  if (!existsSync(dir)) throw new Error(`먼저 준비: node 홍보/자동화/post.mjs insta ${id} --prepare`);
  const rels = readdirSync(dir).filter((f) => f.endsWith('.jpg')).sort().map((f) => `${id}/${f}`);
  const urls = rels.map(publicUrl);
  const plan = { channel: 'instagram', id, piece, images: urls, caption };
  if (!go) return { dry: true, ...plan };

  const bad = await checkPublic(urls);
  if (bad.length) throw new Error(`공개 주소가 아직 안 열림(commit·push 했는지 확인):\n${bad.join('\n')}`);

  const me = await meta('GET', `${BASE.ig}/me`, { fields: 'user_id,username' }, TOKEN_ENV);
  const uid = me.user_id || me.id;
  let creation;
  if (urls.length === 1) {
    creation = (await meta('POST', `${BASE.ig}/${uid}/media`, { image_url: urls[0], caption, ...(aiLabel ? { is_ai_generated: true } : {}) }, TOKEN_ENV)).id;
  } else {
    const children = [];
    for (const u of urls) children.push((await meta('POST', `${BASE.ig}/${uid}/media`, { image_url: u, is_carousel_item: true }, TOKEN_ENV)).id);
    for (const c of children) await waitReady(c);
    creation = (await meta('POST', `${BASE.ig}/${uid}/media`, {
      media_type: 'CAROUSEL', children: children.join(','), caption, ...(aiLabel ? { is_ai_generated: true } : {}),
    }, TOKEN_ENV)).id;
  }
  await waitReady(creation);
  const pub = await meta('POST', `${BASE.ig}/${uid}/media_publish`, { creation_id: creation }, TOKEN_ENV);
  let url = '';
  try { url = (await meta('GET', `${BASE.ig}/${pub.id}`, { fields: 'permalink' }, TOKEN_ENV)).permalink || ''; } catch { /* 주소는 못 받아도 게시는 끝남 */ }
  addLog({ channel: 'instagram', id, piece, status: 'posted', mediaId: pub.id, url, account: me.username, images: urls.length });
  return { posted: true, mediaId: pub.id, url, account: me.username };
}
