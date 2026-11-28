// 가짜 서버로 게시 흐름 전체를 시험한다(진짜 계정 없이).
//   node 홍보/자동화/tests/mock.test.mjs
// 확인하는 것: 인스타 캐러셀 순서, 스레드 글, 유튜브 비공개·예약·필수 항목, 중복 막기, 토큰 갱신·경고.
import http from 'node:http';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const calls = [];
const server = http.createServer((req, res) => {
  let body = [];
  req.on('data', (c) => body.push(c));
  req.on('end', () => {
    body = Buffer.concat(body);
    const u = new URL(req.url, 'http://x');
    calls.push({ m: req.method, p: u.pathname, q: Object.fromEntries(u.searchParams), b: body.toString('utf8').slice(0, 2000), h: req.headers });
    const send = (code, obj, headers = {}) => { res.writeHead(code, { 'content-type': 'application/json', ...headers }); res.end(JSON.stringify(obj)); };
    const p = u.pathname;
    // 공개 그림 주소
    if (p.startsWith('/pub/')) { res.writeHead(200, { 'content-type': 'image/jpeg' }); return res.end(); }
    // 인스타
    if (p === '/ig/me') return send(200, { user_id: '1784', username: 'seungmint.tonghap' });
    if (p === '/ig/1784/media') { const n = calls.filter((c) => c.p === '/ig/1784/media').length; return send(200, { id: 'c' + n }); }
    if (/^\/ig\/c\d+$/.test(p)) return send(200, { status_code: 'FINISHED' });
    if (p === '/ig/1784/media_publish') return send(200, { id: 'm1' });
    if (p === '/ig/m1') return send(200, { permalink: 'https://www.instagram.com/p/TEST/' });
    if (p === '/igroot/refresh_access_token') return send(200, { access_token: 'new', token_type: 'bearer', expires_in: 5184000 });
    // 스레드
    if (p === '/th/me') return send(200, { id: '99', username: 'seungmint.tonghap' });
    if (p === '/th/99/threads') return send(200, { id: 't1' });
    if (p === '/th/t1') return send(200, { status: 'FINISHED' });
    if (p === '/th/99/threads_publish') return send(200, { id: 'tp1' });
    if (p === '/th/tp1') return send(200, { permalink: 'https://www.threads.com/@x/post/TEST' });
    // 구글
    if (p === '/oauth/token') {
      const f = new URLSearchParams(body.toString());
      if (f.get('refresh_token') !== 'R') return send(400, { error: 'invalid_grant' });
      return send(200, { access_token: 'A', expires_in: 3599 });
    }
    if (p === '/up/videos') return send(200, {}, { location: `http://127.0.0.1:${server.address().port}/up/session1` });
    if (p === '/up/session1') return send(200, { id: 'VID123' });
    if (p === '/up/thumbnails/set') return send(200, {});
    send(404, { error: { message: 'no route ' + p } });
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const tmp = mkdtempSync(join(tmpdir(), 'promo-test-'));
const env = {
  ...process.env, STATE_DIR: tmp, POLL_MS: '0', PUBLIC_BASE: `${base}/pub`,
  IG_BASE: `${base}/ig`, IG_ROOT: `${base}/igroot`, TH_BASE: `${base}/th`, TH_ROOT: `${base}/throot`,
  OAUTH_BASE: `${base}/oauth`, YT_BASE: `${base}/yt`, YT_UPLOAD: `${base}/up`,
  YT_REFRESH_TOKEN: 'R', YT_CLIENT_ID: 'cid', YT_CLIENT_SECRET: 'cs',
};
const pexec = promisify(execFile);
const run = async (...a) => {
  try { const r = await pexec('node', [join(HERE, 'post.mjs'), ...a], { env }); return { code: 0, out: r.stdout + r.stderr }; }
  catch (e) { return { code: e.code, out: (e.stdout || '') + (e.stderr || '') }; }
};
let ok = 0;
const t = async (name, fn) => { await fn(); ok++; console.log('  ✓ ' + name); };
const since = (n) => calls.slice(n);

try {
  // ── 인스타 ──
  await t('인스타: 연습 모드는 서버에 아무것도 보내지 않음', async () => {
    const r = await run('insta', 'cn01');
    assert.equal(r.code, 0, r.out); assert.match(r.out, /\[연습\]/);
    assert.equal(calls.length, 0, '연습에서는 서버에 요청하면 안 됨');
  });
  await t('인스타: 캐러셀 10장 게시 (자식 → 묶음 → 게시)', async () => {
    const r = await run('insta', 'cn01', '--go');
    assert.equal(r.code, 0, r.out);
    const media = calls.filter((c) => c.p === '/ig/1784/media');
    assert.equal(media.length, 11);
    for (const c of media.slice(0, 10)) { const f = new URLSearchParams(c.b); assert.equal(f.get('is_carousel_item'), 'true'); assert.match(f.get('image_url'), /\/pub\/cn01\/\d\d\.jpg$/); }
    const parent = new URLSearchParams(media[10].b);
    assert.equal(parent.get('media_type'), 'CAROUSEL');
    assert.equal(parent.get('children').split(',').length, 10);
    assert.match(parent.get('caption'), /네 가지 관점/);
    assert.ok(!parent.has('access_token'), '토큰은 코드가 붙이지 않음(중계 서버 몫)');
    assert.equal(new URLSearchParams(calls.find((c) => c.p === '/ig/1784/media_publish').b).get('creation_id'), 'c11');
    assert.match(r.out, /instagram\.com\/p\/TEST/);
  });
  await t('인스타: 같은 조각 두 번 게시 막음', async () => {
    const n = calls.length;
    const r = await run('insta', 'cn01', '--go');
    assert.notEqual(r.code, 0); assert.match(r.out, /이미 올린 적이 있음/);
    assert.equal(since(n).length, 0);
  });

  // ── 스레드 ──
  await t('스레드: 글 게시', async () => {
    const r = await run('threads', join(HERE, '예시/th-예시.txt'), '--go');
    assert.equal(r.code, 0, r.out);
    const c = new URLSearchParams(calls.find((x) => x.p === '/th/99/threads').b);
    assert.equal(c.get('media_type'), 'TEXT'); assert.match(c.get('text'), /O\/X/);
    assert.ok(calls.some((x) => x.p === '/th/99/threads_publish'));
  });
  await t('스레드: 500자 넘으면 막음', async () => {
    const f = join(tmp, 'long.txt'); writeFileSync(f, '가'.repeat(501));
    const r = await run('threads', f, '--go'); assert.notEqual(r.code, 0); assert.match(r.out, /500자/);
  });

  // ── 유튜브 ──
  mkdirSync(join(tmp, 'v'), { recursive: true });
  writeFileSync(join(tmp, 'v/a.mp4'), Buffer.alloc(1000, 1));
  const spec = JSON.parse(readFileSync(join(HERE, '예시/영상정보_예시.json'), 'utf8'));
  const future = new Date(Date.now() + 3 * 86400e3).toISOString();
  Object.assign(spec, { file: join(tmp, 'v/a.mp4'), thumbnail: undefined, publishAt: future });
  writeFileSync(join(tmp, 'v.json'), JSON.stringify(spec));
  await t('유튜브: 비공개 + 예약 + 필수 3항목으로 업로드', async () => {
    const r = await run('youtube', join(tmp, 'v.json'), '--go');
    assert.equal(r.code, 0, r.out);
    const s = calls.find((c) => c.p === '/up/videos');
    assert.equal(s.q.part, 'snippet,status,paidProductPlacementDetails');
    assert.equal(s.h.authorization, 'Bearer A');
    const j = JSON.parse(s.b);
    assert.equal(j.status.privacyStatus, 'private');
    assert.equal(j.status.publishAt, future);
    assert.equal(j.status.selfDeclaredMadeForKids, false);
    assert.equal(j.status.containsSyntheticMedia, false);
    assert.equal(j.paidProductPlacementDetails.hasPaidProductPlacement, false);
    assert.equal(calls.find((c) => c.p === '/up/session1').h['content-length'], '1000');
    assert.match(r.out, /VID123/);
  });
  await t('유튜브: 필수 항목 빠지면 막음', async () => {
    const bad = { ...spec, id: 'v2' }; delete bad.paidPlacement;
    writeFileSync(join(tmp, 'v2.json'), JSON.stringify(bad));
    const r = await run('youtube', join(tmp, 'v2.json'), '--go'); assert.notEqual(r.code, 0); assert.match(r.out, /paidPlacement/);
  });
  await t('유튜브: 공개(public)로 올리려 하면 막음', async () => {
    writeFileSync(join(tmp, 'v3.json'), JSON.stringify({ ...spec, id: 'v3', privacy: 'public' }));
    const r = await run('youtube', join(tmp, 'v3.json'), '--go'); assert.notEqual(r.code, 0); assert.match(r.out, /비공개/);
  });

  // ── 토큰 ──
  await t('토큰: 저장일 기록 → 53일 뒤면 경고(끝 코드 2)', async () => {
    const d = new Date(Date.now() + 9 * 3600e3 - 54 * 86400e3).toISOString().slice(0, 10);
    await run('token', 'set', 'insta', d);
    const r = await run('token'); assert.equal(r.code, 2, r.out); assert.match(r.out, /갱신 필요/);
  });
  await t('토큰: 비밀값 방식은 갱신 막고, 환경 변수 방식은 60일 연장 + 다시 저장 안내', async () => {
    const r0 = await run('token', 'refresh', 'insta'); assert.notEqual(r0.code, 0, '비밀값 방식이면 갱신을 막아야 함');
    env.IG_TOKEN = 'old';
    const r = await run('token', 'refresh', 'insta'); delete env.IG_TOKEN; assert.equal(r.code, 0, r.out); assert.match(r.out, /mustResave": true/);
    assert.equal(calls.at(-1).q.grant_type, 'ig_refresh_token');
    const s = await run('token'); assert.match(s.out, /인스타그램: .* \((59|60)일 남음\)/);
  });
  console.log(`모두 통과 (${ok}개)`);
} finally {
  server.close();
}
