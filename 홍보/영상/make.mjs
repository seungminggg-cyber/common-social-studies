// 영상 만들기 — 원고(content/*.js) → AI 목소리 → 시간표 → 장면(HTML) 프레임 캡처 → mp4
//   사용: node 홍보/영상/make.mjs v01                (이름이 v01로 시작하는 원고)
//         node 홍보/영상/make.mjs v01 --stills       (영상 대신 문장마다 정지 화면 PNG — 빠른 확인용)
//         node 홍보/영상/make.mjs v01 --draft        (작은 화면·낮은 프레임으로 빨리 만들어 보기)
//         node 홍보/영상/make.mjs v01 --voice ko-KR-InJoonNeural   (목소리 바꿔 보기)
//         node 홍보/영상/make.mjs v01 --audio 녹음폴더  (AI 목소리 대신 강사 녹음: 녹음폴더/01.m4a, 02.m4a … 문장 순서대로)
//   결과: 홍보/영상/out/<원고 이름>/  영상.mp4, 썸네일.png, 자막.srt, 설명_복사용.txt
//   준비: (cd textbook && npm install) — 글꼴·아이콘. pip install edge-tts. ffmpeg.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { icon } from '../../textbook/lib/icons.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = dirname(fileURLToPath(import.meta.url));
const FONT = join(ROOT, '../../textbook/node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2');
if (!existsSync(FONT)) { console.error('글꼴이 없습니다. textbook 폴더에서 npm install 을 먼저 하세요.'); process.exit(1); }

// ── 명령줄 ──
const argv = process.argv.slice(2);
const flag = (k) => argv.includes(k);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const want = argv.filter((a, i) => !a.startsWith('--') && !(i && ['--voice', '--audio', '--workers', '--only'].includes(argv[i - 1])));
const STILLS = flag('--stills'), DRAFT = flag('--draft');
const WORKERS = +(opt('--workers') || 4);

// 원고들이 함께 쓰는 작은 부품
const wmHTML = `<div class="wm"><i></i><span><span class="s">통합사회</span> 승민<span class="t">T</span></span></div>`;
export const H = {
  icon,
  wm: wmHTML,
  top: (no, title) => `<div class="v-top">${wmHTML}<div class="v-ch">${no ? `<b>${no}</b>` : ''}${title || ''}</div></div>`,
};

const files = readdirSync(join(ROOT, 'content')).filter((f) => f.endsWith('.js') && want.some((w) => f.startsWith(w)));
if (!files.length) { console.error('만들 원고가 없습니다. 예: node 홍보/영상/make.mjs v01'); process.exit(1); }

const CACHE = join(ROOT, 'out/.cache');
mkdirSync(CACHE, { recursive: true });
const sh = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const durOf = (f) => parseFloat(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]));
const fmtT = (t, sep = ',') => { const ms = Math.round(t * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${sep}${String(ms % 1000).padStart(3, '0')}`; };
const clean = (s) => s.replace(/\|/g, ' ').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

const browser = await chromium.launch();
for (const f of files) {
  const name = f.replace(/\.js$/, '');
  const spec = (await import(pathToFileURL(join(ROOT, 'content', f)).href)).default(H);
  const out = join(ROOT, 'out', name);
  mkdirSync(out, { recursive: true });
  const [W, Hh] = spec.size || [1920, 1080];
  const fps = DRAFT ? 12 : (spec.fps || 30);
  const voice = opt('--voice') || spec.voice || 'ko-KR-SunHiNeural';
  const rate = spec.rate || '+5%';
  const t0 = Date.now();

  // 1) 목소리: 문장마다 mp3 + 단어 시각 (같은 문장·목소리는 다시 만들지 않음)
  const lines = spec.scenes.flatMap((sc) => sc.lines);
  const audioDir = opt('--audio');
  const jobs = [];
  lines.forEach((ln, i) => {
    ln.say = clean(ln.say || ln.t);
    if (audioDir) {
      const hit = readdirSync(audioDir).find((x) => x.startsWith(String(i + 1).padStart(2, '0') + '.'));
      if (!hit) throw new Error(`녹음 파일이 없습니다: ${String(i + 1).padStart(2, '0')}.* (${ln.say})`);
      ln.mp3 = join(audioDir, hit); ln.words = [];
      return;
    }
    const h = createHash('sha1').update(`${voice}|${rate}|${ln.say}`).digest('hex').slice(0, 16);
    ln.mp3 = join(CACHE, `${h}.mp3`); ln.json = join(CACHE, `${h}.json`);
    if (!existsSync(ln.mp3) || !existsSync(ln.json)) jobs.push({ text: ln.say, voice, rate, mp3: ln.mp3, json: ln.json });
  });
  if (jobs.length) {
    const jf = join(CACHE, 'jobs.json');
    writeFileSync(jf, JSON.stringify(jobs));
    console.log(`  목소리 ${jobs.length}문장 만드는 중 (${voice})…`);
    execFileSync('python3', ['-I', join(ROOT, 'lib/tts.py'), jf], { stdio: 'inherit' });
  }
  for (const ln of lines) {
    ln.dur = durOf(ln.mp3);
    if (ln.json) {
      ln.words = JSON.parse(readFileSync(ln.json, 'utf8'));
      // edge-tts mp3 끝의 조용한 꼬리를 잘라 문장 사이가 늘어지지 않게
      const last = ln.words[ln.words.length - 1];
      if (last) ln.dur = Math.min(ln.dur, last.t + last.d + 0.18);
    }
  }

  // 2) 시간표: 장면 시작·끝, 문장 시작, 자막
  const GAP = spec.gap ?? 0.32, PRE = spec.pre ?? 0.45, POST = spec.post ?? 0.55;
  let cur = 0;
  const scenes = spec.scenes.map((sc, si) => {
    const s = { id: sc.id || `s${si + 1}`, start: cur, inDur: si ? 0.5 : 0.01, outDur: 0.45, lines: [] };
    cur += si ? PRE : 0.35;
    sc.lines.forEach((ln, li) => {
      s.lines.push({ start: cur, dur: ln.dur, words: ln.words, t: ln.t, say: ln.say, mp3: ln.mp3 });
      cur += ln.dur + (li < sc.lines.length - 1 ? (ln.gap ?? GAP) : 0);
    });
    cur += sc.hold ?? POST;
    s.end = cur;
    return s;
  });
  scenes[scenes.length - 1].last = true;
  const total = cur + 0.3;
  // 자막: '|' 로 나눈 조각마다 따로 보여 줌. 조각이 바뀌는 시각은 단어 시각으로 맞춘다.
  const subs = [];
  const bare = (s) => s.replace(/[\s.,!?·'"“”‘’()\-~:]/g, '').replace(/\*\*/g, '');
  scenes.forEach((sc) => sc.lines.forEach((ln, li) => {
    const parts = ln.t.split('|').map((p) => p.trim()).filter(Boolean);
    const nextStart = li < sc.lines.length - 1 ? sc.lines[li + 1].start : ln.start + ln.dur + 0.25;
    let acc = 0;
    const totalChars = bare(ln.t).length;
    const starts = parts.map((p) => {
      const at = acc; acc += bare(p).length;
      if (!at) return ln.start;
      // 단어 시각에서 글자 수가 at에 이르는 단어 찾기
      let c = 0;
      for (const w of ln.words) { if (c >= at) return ln.start + w.t - 0.05; c += bare(w.w).length; }
      return ln.start + ln.dur * (at / totalChars);
    });
    parts.forEach((p, k) => {
      const html = p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      subs.push({ start: starts[k], end: k < parts.length - 1 ? starts[k + 1] : Math.min(nextStart, ln.start + ln.dur + 0.6), html, text: p.replace(/\*\*/g, '') });
    });
  }));
  const TL = { total, scenes: scenes.map(({ lines, ...s }) => ({ ...s, lines: lines.map(({ start, dur, words }) => ({ start, dur, words })) })), subs };
  console.log(`  ${name}: ${scenes.length}장면 ${lines.length}문장, ${total.toFixed(1)}초`);

  // 3) 페이지
  const u = W / 1920 * (spec.vertical ? 1920 / 1080 : 1);  // 크기 단위(세로 영상은 1080 폭 기준)
  const vars = `:root{--W:${W}px;--H:${Hh}px;--u:${(W >= Hh ? W / 1920 : W / 1080).toFixed(4)}px;--pad:${spec.pad || (W >= Hh ? 110 : 72)}px;--subB:${spec.subBottom || (W >= Hh ? 64 : 520)}px;--subF:${spec.subSize || (W >= Hh ? 46 : 56)}px;}`;
  const brand = readFileSync(join(ROOT, '../lib/brand.css'), 'utf8');
  const motion = readFileSync(join(ROOT, 'lib/motion.css'), 'utf8');
  const fontUrl = relative(out, FONT).split('\\').join('/');
  const sceneCSS = `@keyframes scene-in { from { opacity: 0; transform: scale(1.015); } to { opacity: 1; transform: none; } }
    @keyframes scene-out { from { opacity: 1; } to { opacity: 0; } }`;
  const progTicks = spec.progress === false ? '' : `<div class="prog"><i></i>${scenes.slice(1).map((s) => `<s style="left:${(s.start / total * 100).toFixed(3)}%"></s>`).join('')}</div>`;
  const body = `<div class="stage">${spec.scenes.map((sc, i) => `<section class="scene ${sc.cls || ''}" data-scene="${i}">${sc.html}</section>`).join('\n')}
    <div class="sub"></div>${progTicks}</div>`;
  const doc = (inner, extraCSS = '', script = '') => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${brand.replaceAll('FONT_URL', fontUrl)}${vars}${motion}${sceneCSS}${spec.css || ''}${extraCSS}</style></head><body>${inner}${script}</body></html>`;
  const runtime = readFileSync(join(ROOT, 'lib/runtime.js'), 'utf8');
  const htmlPath = join(out, 'index.html');
  writeFileSync(htmlPath, doc(body, '', `<script>window.TL=${JSON.stringify(TL)};</script><script>${runtime}</script>`));

  const scale = DRAFT ? 0.5 : 1;
  const openPage = async () => {
    const p = await browser.newPage({ viewport: { width: W, height: Hh }, deviceScaleFactor: scale });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(pathToFileURL(htmlPath).href);
    await p.evaluate(() => document.fonts.ready);
    if (errs.length) throw new Error(errs.join('\n'));
    const bad = await p.evaluate(() => [...document.fonts].filter((x) => x.status !== 'loaded').map((x) => x.family));
    if (bad.length) throw new Error('글꼴을 못 불러옴: ' + bad.join(', '));
    return p;
  };

  // 썸네일 (원고에 thumb가 있으면)
  if (spec.thumb) {
    const [tw, th] = spec.thumb.size || [1280, 720];
    const tp = join(out, 'thumb.html');
    writeFileSync(tp, doc(spec.thumb.html, `html,body{width:${tw}px;height:${th}px}` + (spec.thumb.css || '')));
    const p = await browser.newPage({ viewport: { width: tw, height: th }, deviceScaleFactor: 1 });
    await p.goto(pathToFileURL(tp).href);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: join(out, '썸네일.png') });
    await p.close();
  }

  // 자막 파일·설명 글
  writeFileSync(join(out, '자막.srt'), subs.map((s, i) => `${i + 1}\n${fmtT(s.start)} --> ${fmtT(s.end)}\n${s.text}\n`).join('\n'));
  const chapters = spec.scenes.map((sc, i) => sc.chapter ? `${fmtT(scenes[i].start, '.').slice(3, 8)} ${sc.chapter}` : null).filter(Boolean);
  if (chapters[0] && !chapters[0].startsWith('00:00')) chapters[0] = '00:00' + chapters[0].slice(5);
  writeFileSync(join(out, '원고.txt'), spec.scenes.map((sc, i) => `[${fmtT(scenes[i].start, '.').slice(3, 8)}] ${sc.chapter || sc.id || ''}\n` + sc.lines.map((l, k) => `${String(lines.indexOf(l) + 1).padStart(2, '0')}. ${clean(l.t)}`).join('\n')).join('\n\n') + '\n');
  if (spec.description) writeFileSync(join(out, '설명_복사용.txt'), spec.description({ chapters: chapters.join('\n') }).trim() + '\n');

  if (STILLS) {
    // 문장마다 말이 끝나갈 즈음의 화면 한 장
    const p = await openPage();
    const sd = join(out, 'stills'); rmSync(sd, { recursive: true, force: true }); mkdirSync(sd);
    let k = 0;
    for (const sc of scenes) for (const ln of sc.lines) {
      k++;
      await p.evaluate((t) => window.__seek(t), ln.start + ln.dur - 0.05);
      await p.screenshot({ path: join(sd, `${String(k).padStart(2, '0')}.png`) });
    }
    await p.close();
    console.log(`  ✓ 정지 화면 ${k}장: ${relative(process.cwd(), sd)}`);
    continue;
  }

  // 4) 소리: 문장 mp3를 시간표 자리에 놓아 한 파일로 (48kHz 모노)
  const SR = 48000;
  const pcm = Buffer.alloc(Math.ceil(total * SR) * 2);
  for (const sc of scenes) for (const ln of sc.lines) {
    const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', ln.mp3, '-t', String(ln.dur + 0.05), '-f', 's16le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 28 });
    const at = Math.round(ln.start * SR) * 2;
    // 끝 50ms 페이드로 '틱' 소리 막기
    const n = raw.length >> 1, fade = Math.min(n, SR * 0.05);
    for (let i = 0; i < n && at + i * 2 + 1 < pcm.length; i++) {
      let v = raw.readInt16LE(i * 2);
      if (i > n - fade) v = Math.round(v * (n - i) / fade);
      pcm.writeInt16LE(Math.max(-32768, Math.min(32767, pcm.readInt16LE(at + i * 2) + v)), at + i * 2);
    }
  }
  const wav = join(out, '.voice.wav');
  const hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16);
  hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(1, 22); hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 2, 28); hdr.writeUInt16LE(2, 32); hdr.writeUInt16LE(16, 34);
  hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
  writeFileSync(wav, Buffer.concat([hdr, pcm]));

  // 5) 프레임: 여러 창이 구간을 나눠 캡처 → 구간마다 ffmpeg로 바로 압축 → 이어 붙이기
  const N = Math.ceil(total * fps);
  const segs = [];
  const per = Math.ceil(N / WORKERS);
  let done = 0;
  await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
    const a = w * per, b = Math.min(N, a + per);
    if (a >= b) return;
    const seg = join(out, `.seg${w}.mp4`); segs[w] = seg;
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', DRAFT ? 'veryfast' : 'medium', '-crf', DRAFT ? '26' : '19', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-r', String(fps), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = new Promise((res, rej) => ff.on('close', (c) => c ? rej(new Error('ffmpeg 오류 ' + c)) : res()));
    const p = await openPage();
    for (let fi = a; fi < b; fi++) {
      await p.evaluate((t) => window.__seek(t), fi / fps);
      const png = await p.screenshot({ type: 'png' });
      if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
      if (++done % 300 === 0) process.stdout.write(`  프레임 ${done}/${N}\n`);
    }
    ff.stdin.end();
    await closed;
    await p.close();
  }));
  const list = join(out, '.segs.txt');
  writeFileSync(list, segs.filter(Boolean).map((s) => `file '${s}'`).join('\n'));
  const mp4 = join(out, DRAFT ? '영상_초안.mp4' : '영상.mp4');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
    '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-shortest', '-movflags', '+faststart', mp4]);
  for (const s of [...segs.filter(Boolean), list, wav]) rmSync(s, { force: true });
  const mb = (readFileSync(mp4).length / 1048576).toFixed(1);
  console.log(`  ✓ ${relative(process.cwd(), mp4)} (${total.toFixed(1)}초, ${mb}MB, ${((Date.now() - t0) / 1000).toFixed(0)}초 걸림)`);
}
await browser.close();
