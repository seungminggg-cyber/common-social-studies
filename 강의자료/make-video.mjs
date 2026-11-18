// 녹음 파일 → 강의 영상(mp4)
//   node 강의자료/make-video.mjs <녹음파일.json> [강 번호 ...] [--partial] [--no-anim]
//   예) node 강의자료/make-video.mjs ~/녹음_sm-1-2.json        → 녹음이 다 된 강마다 영상 하나
//       node 강의자료/make-video.mjs 녹음.json 1 --partial      → 1강만, 빠진 화면은 건너뛰고
// 먼저 node 강의자료/build.mjs <강의id> 로 강의화면.html을 만들어 두어야 한다.
// 판서는 녹음할 때 → 키를 누른 시각에 맞춰 나타나고, 그어지는 움직임(0.6초)도 영상에 담는다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = () => { try { return require('playwright'); } catch { return require('/opt/node-tools/node_modules/playwright'); } };
const FPS = 30, ANIM_MS = 660;

const args = process.argv.slice(2);
const file = args.find((a) => a.endsWith('.json'));
if (!file) { console.error('쓰는 법: node 강의자료/make-video.mjs <녹음파일.json> [강 번호 ...] [--partial] [--no-anim]'); process.exit(1); }
const only = args.filter((a) => /^\d+$/.test(a)).map(Number);
const partial = args.includes('--partial');
const anim = !args.includes('--no-anim');

const rec = JSON.parse(fs.readFileSync(file, 'utf8'));
const OUT = path.join(ROOT, 'out', rec.deck);
const deckHtml = path.join(OUT, '강의화면.html');
if (!fs.existsSync(deckHtml)) { console.error(`강의화면.html이 없어요. 먼저 node 강의자료/build.mjs ${rec.deck}`); process.exit(1); }
const DATA = JSON.parse(/<script type="application\/json" id="deck-data">([\s\S]*?)<\/script>/.exec(fs.readFileSync(deckHtml, 'utf8'))[1]);
const VID = path.join(OUT, '영상');
fs.mkdirSync(VID, { recursive: true });

const run = (cmd, a) => execFileSync(cmd, a, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const probe = (f) => parseFloat(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]));
const ext = (mime) => (/mp4|aac|m4a/.test(mime) ? 'm4a' : /ogg/.test(mime) ? 'ogg' : 'webm');

// 판서 단계가 바뀐 시각 → [{step, from, to}] (초)
function segments(events, dur) {
  const ev = [...events].sort((a, b) => a.t - b.t);
  const segs = [];
  for (const e of ev) {
    const t = Math.min(e.t / 1000, dur);
    const last = segs[segs.length - 1];
    if (last && last.step === e.step) continue;
    if (last) last.to = t;
    if (last && last.to - last.from < 1e-3) segs.pop();
    segs.push({ step: e.step, from: t, to: dur });
  }
  if (!segs.length) segs.push({ step: 0, from: 0, to: dur });
  segs[0].from = 0;
  return segs.filter((s) => s.to - s.from > 0.0005);
}

const browser = await pw().chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(deckHtml).href + '?export');
await page.evaluate(() => document.fonts.ready);

try {
  for (const L of DATA.lectures) {
    if (only.length && !only.includes(L.no)) continue;
    const items = DATA.slides.map((s, i) => ({ ...s, i })).filter((s) => s.li === L.index);
    const have = items.filter((s) => rec.clips[s.key]);
    if (!have.length) continue;
    if (have.length < items.length && !partial) {
      console.log(`${L.no}강: 녹음 ${have.length}/${items.length}화면 — 빠진 화면: ${items.filter((s) => !rec.clips[s.key]).map((s) => s.key).join(', ')} (건너뜀, --partial 로 강제)`);
      continue;
    }
    const work = path.join(VID, '.work', `${L.no}`);
    fs.rmSync(work, { recursive: true, force: true });
    fs.mkdirSync(work, { recursive: true });
    const list = [], wavs = [];
    let total = 0, nframe = 0;
    for (const s of have) {
      const c = rec.clips[s.key];
      const raw = path.join(work, `${s.key}.${ext(c.mime)}`);
      fs.writeFileSync(raw, Buffer.from(c.data, 'base64'));
      const wav = path.join(work, `${s.key}.wav`);
      run('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-ac', '1', '-ar', '48000', wav]);
      const dur = probe(wav);
      wavs.push(wav);
      for (const seg of segments(c.events, dur)) {
        const len = seg.to - seg.from;
        const still = path.join(work, `f${String(nframe++).padStart(5, '0')}.jpg`); // 모든 장면을 같은 형식(jpg)으로 — 섞이면 ffmpeg가 일부를 버린다
        const animate = anim && seg.step > 0 && len > ANIM_MS / 1000 + 0.1;
        if (animate) {
          // 판서가 그어지는 모습: 애니메이션을 멈춰 두고 1/30초씩 넘기며 찍는다
          await page.evaluate(([i, st]) => { window.DECK.render(i, st - 1, false); void document.body.offsetHeight; window.DECK.render(i, st, true); document.getAnimations().forEach((a) => a.pause()); }, [s.i, seg.step]);
          const n = Math.round((ANIM_MS / 1000) * FPS);
          for (let k = 0; k < n; k++) {
            await page.evaluate((ms) => document.getAnimations().forEach((a) => { a.currentTime = ms; }), (k * 1000) / FPS);
            const f = path.join(work, `f${String(nframe++).padStart(5, '0')}.jpg`);
            await page.screenshot({ path: f, type: 'jpeg', quality: 96, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
            list.push({ f, d: 1 / FPS });
          }
          await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
          await page.screenshot({ path: still, type: 'jpeg', quality: 96, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
          list.push({ f: still, d: len - n / FPS });
        } else {
          await page.evaluate(([i, st]) => window.DECK.render(i, st, false), [s.i, seg.step]);
          await page.screenshot({ path: still, type: 'jpeg', quality: 96, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
          list.push({ f: still, d: len });
        }
      }
      total += dur;
      process.stdout.write(`\r${L.no}강 ${s.si + 1}/${items.length} 화면 준비 (${Math.round(total)}초)   `);
    }
    process.stdout.write('\n');
    // 소리 잇기 + 다듬기 (낮은 웅웅 소리 줄이기, 잡음 약하게 줄이기, 음량 고르게)
    const alist = path.join(work, 'audio.txt');
    fs.writeFileSync(alist, wavs.map((w) => `file '${w.replace(/'/g, "'\\''")}'`).join('\n'));
    const voice = path.join(work, 'voice.wav');
    run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', alist, '-af', 'highpass=f=80,afftdn=nf=-25,loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', voice]);
    const vlist = path.join(work, 'frames.txt');
    fs.writeFileSync(vlist, list.map((x) => `file '${x.f.replace(/'/g, "'\\''")}'\nduration ${Math.max(x.d, 1 / FPS).toFixed(4)}`).join('\n') + `\nfile '${list[list.length - 1].f}'\n`);
    const safeTitle = L.title.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ');
    const mp4 = path.join(VID, `${L.no}강_${safeTitle}.mp4`);
    run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', vlist, '-i', voice, '-fps_mode', 'cfr', '-r', String(FPS), '-c:v', 'libx264', '-preset', 'medium', '-tune', 'stillimage', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', mp4]);
    const m = Math.floor(total / 60), sec = Math.round(total % 60);
    console.log(`→ ${path.relative(process.cwd(), mp4)} (${m}분 ${sec}초, ${(fs.statSync(mp4).size / 1048576).toFixed(1)}MB)`);
    fs.rmSync(work, { recursive: true, force: true });
  }
} finally {
  await browser.close();
}
