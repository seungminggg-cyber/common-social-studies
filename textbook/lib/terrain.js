// 지형 바탕 그림 만들기 (style: 'terrain' 지도)
//
// 1) 지도에 보이는 범위의 고도 타일(AWS Terrain Tiles, terrarium 형식)을 내려받아 이어 붙임 (tools/terrain/mosaic.py)
// 2) 지도 그림의 각 칸이 가리키는 경위도의 높이를 읽고, 육지 마스크(Natural Earth 육지)를 칠함
// 3) 높이에 따라 지도책 색을 칠하고 음영 기복을 넣어 JPEG 로 저장 (tools/terrain/color.py)
// 결과: assets/terrain/<번호>.jpg — 저장소에 함께 올려 두므로, 지도를 바꾸지 않으면 다시 만들 필요 없음
// 타일 보관 폴더: 환경 변수 TERRAIN_TILES (기본 ~/.cache/terrain-tiles)
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { feature } from 'topojson-client';
import { geoPath, geoEquirectangular } from 'd3-geo';
import { makeProjection, terrainFile, terrainKey } from './maps.js';

const require = createRequire(import.meta.url);
const ROOT = new URL('../', import.meta.url).pathname;
const TILES = process.env.TERRAIN_TILES || join(homedir(), '.cache', 'terrain-tiles');

function walkMaps(x, out) {
  if (Array.isArray(x)) { x.forEach((y) => walkMaps(y, out)); return out; }
  if (!x || typeof x !== 'object') return out;
  if (x.t === 'map' && x.style === 'terrain') out.push(x);
  Object.values(x).forEach((y) => walkMaps(y, out));
  return out;
}

// 책(또는 블록 묶음) 안의 지형도 바탕이 없으면 만든다
export function ensureTerrain(root) {
  const seen = new Set();
  for (const b of walkMaps(root, [])) {
    const f = terrainFile(b);
    if (existsSync(f) || seen.has(f)) continue;
    seen.add(f);
    console.log(`  지형 바탕 만들기: ${b.title || '(제목 없음)'} → ${terrainKey(b)}.jpg`);
    try { makeTerrain(b); } catch (e) { console.warn('  ! 지형 바탕을 만들지 못함:', e.message.split('\n')[0]); }
  }
}

const tileX = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const tileY = (lat, z) => { const r = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180; return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z); };

export function makeTerrain(b) {
  const { proj, W, H, world } = makeProjection(b);
  const S = b.terrainScale || 3, Wo = Math.round(W * S), Ho = Math.round(H * S);
  // 각 칸의 경위도
  const lon = new Float32Array(Wo * Ho), lat = new Float32Array(Wo * Ho), mask = new Uint8Array(Wo * Ho);
  let w = 180, e = -180, s = 90, n = -90;
  for (let y = 0; y < Ho; y++) for (let x = 0; x < Wo; x++) {
    const i = y * Wo + x, xx = (x + 0.5) / S, yy = (y + 0.5) / S, p = proj.invert([xx, yy]);
    let bad = !p || !isFinite(p[0]) || !isFinite(p[1]);
    if (!bad && world) { const q = proj(p); bad = !q || Math.hypot(q[0] - xx, q[1] - yy) > 0.3; } // 지구 밖
    if (bad) { mask[i] = 2; continue; }
    lon[i] = p[0]; lat[i] = p[1];
    if (p[0] < w) w = p[0]; if (p[0] > e) e = p[0]; if (p[1] < s) s = p[1]; if (p[1] > n) n = p[1];
  }
  // 타일 확대 단계: 지도 한 칸에 타일 한 칸 이상
  const pxPerDeg = world ? Wo / 360 : Wo / (e - w);
  const z = b.terrainZoom || Math.max(3, Math.min(10, Math.ceil(Math.log2((pxPerDeg * 360) / 256))));
  const W0 = world ? -180 : w - 0.5, E0 = world ? 179.999 : e + 0.5, S0 = Math.max(-84.9, s - 0.5), N0 = Math.min(84.9, n + 0.5);
  // 타일 내려받기 (없는 것만)
  const list = [];
  for (let tx = tileX(W0, z); tx <= tileX(E0, z); tx++) for (let ty = tileY(N0, z); ty <= tileY(S0, z); ty++) {
    const f = join(TILES, String(z), String(tx), `${ty}.png`);
    if (!existsSync(f)) list.push(`${z}/${tx}/${ty}`);
  }
  if (list.length) {
    console.log(`  고도 타일 ${list.length}개 내려받는 중 (z=${z})`);
    const lf = join(tmpdir(), `tiles-${process.pid}.txt`);
    writeFileSync(lf, list.join('\n') + '\n');
    execFileSync('sh', ['-c', `cat ${lf} | xargs -P 16 -I{} sh -c 'f=${TILES}/{}.png; mkdir -p $(dirname $f); curl -sf --max-time 60 -o $f https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{}.png || rm -f $f'`]);
    rmSync(lf);
  }
  // 이어 붙이기
  const work = join(tmpdir(), `terrain-${terrainKey(b)}`);
  // 육지 마스크도 같은 격자에 칠한다 (Natural Earth 육지, 경위도 → 타일 좌표)
  const detail = world ? '50m' : '10m';
  const topo = JSON.parse(readFileSync(require.resolve(`world-atlas/land-${detail}.json`), 'utf8'));
  execFileSync('python3', ['-I', join(ROOT, 'tools/terrain/mosaic.py'), TILES, String(z), String(W0), String(S0), String(E0), String(N0), work], { stdio: ['ignore', 'ignore', 'inherit'] });
  const meta = JSON.parse(readFileSync(work + '.json', 'utf8'));
  const mos = new Float32Array(readFileSync(work + '.f32').buffer.slice(0));
  const N = 256 * 2 ** z;
  // 육지 마스크: 타일 격자 위에서 짝수-홀수 규칙으로 칠함 (Natural Earth 육지는 날짜 변경선에서 이미 나뉘어 있음)
  const lmask = new Uint8Array(meta.R * meta.C);
  {
    const MX = (lo) => ((lo + 180) / 360) * N - meta.X0;
    const MY = (la) => { const r = (Math.max(-85.05, Math.min(85.05, la)) * Math.PI) / 180; return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * N - meta.Y0; };
    const rowsX = Array.from({ length: meta.R }, () => []);
    // 날짜 변경선(180°)을 넘는 고리는 d3가 잘라서 닫아 준다 (경위도 그대로인 정거원통 투영으로 고리 모으기)
    const rings = []; let cur = null;
    const ctx = { moveTo(x, y) { cur = [[x, -y]]; rings.push(cur); }, lineTo(x, y) { cur.push([x, -y]); }, closePath() { cur.push(cur[0]); }, arc() {}, rect() {} };
    geoPath(geoEquirectangular().scale(180 / Math.PI).translate([0, 0]).precision(0), ctx)(feature(topo, topo.objects.land));
    for (const ring of rings) {
      let minLo = 180, maxLo = -180, minLa = 90, maxLa = -90;
      for (const [lo, la] of ring) { if (lo < minLo) minLo = lo; if (lo > maxLo) maxLo = lo; if (la < minLa) minLa = la; if (la > maxLa) maxLa = la; }
      if (maxLa - minLa > 179) continue; // 지구 전체를 감싸는 가짜 고리(감김 방향이 뒤집힌 작은 섬 때문에 생김)는 버림
      if (maxLo < W0 - 1 || minLo > E0 + 1 || maxLa < S0 - 1 || minLa > N0 + 1) continue;
      for (let k = 0; k + 1 < ring.length; k++) {
        const x1 = MX(ring[k][0]), y1 = MY(ring[k][1]), x2 = MX(ring[k + 1][0]), y2 = MY(ring[k + 1][1]);
        if (y1 === y2) continue;
        const ya = Math.min(y1, y2), yb = Math.max(y1, y2);
        for (let r = Math.max(0, Math.ceil(ya - 0.5)); r <= Math.min(meta.R - 1, Math.floor(yb - 0.5)); r++) {
          const yc = r + 0.5; if (yc < ya || yc >= yb) continue;
          rowsX[r].push(x1 + ((yc - y1) / (y2 - y1)) * (x2 - x1));
        }
      }
    }
    for (let r = 0; r < meta.R; r++) {
      const xs = rowsX[r].sort((a, c) => a - c);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(meta.C - 1, Math.floor(xs[k + 1] - 0.5)); x++) lmask[r * meta.C + x] = 1;
    }
  }
  const elev = new Float32Array(Wo * Ho), cell = new Float32Array(Wo * Ho);
  const sample = (lo, la) => {
    const X = ((lo + 180) / 360) * N - meta.X0 - 0.5;
    const r = (Math.max(-85, Math.min(85, la)) * Math.PI) / 180;
    const Y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * N - meta.Y0 - 0.5;
    const x0 = Math.max(0, Math.min(meta.C - 2, Math.floor(X))), y0 = Math.max(0, Math.min(meta.R - 2, Math.floor(Y)));
    const fx = Math.max(0, Math.min(1, X - x0)), fy = Math.max(0, Math.min(1, Y - y0)), k = y0 * meta.C + x0;
    const v = (mos[k] * (1 - fx) + mos[k + 1] * fx) * (1 - fy) + (mos[k + meta.C] * (1 - fx) + mos[k + meta.C + 1] * fx) * fy;
    const kl = Math.max(0, Math.min(meta.R - 1, Math.round(Y))) * meta.C + Math.max(0, Math.min(meta.C - 1, Math.round(X)));
    return [v, lmask[kl]];
  };
  const R = 6371;
  for (let y = 0; y < Ho; y++) for (let x = 0; x < Wo; x++) {
    const i = y * Wo + x; if (mask[i] === 2) continue;
    const [v, l] = sample(lon[i], lat[i]); elev[i] = v; mask[i] = l ? 1 : 0;
    // 칸 한 변의 실제 길이 (옆 칸과의 거리)
    const j = x + 1 < Wo && mask[i + 1] !== 2 ? i + 1 : x > 0 ? i - 1 : i;
    const dlo = ((lon[j] - lon[i]) * Math.PI) / 180, dla = ((lat[j] - lat[i]) * Math.PI) / 180;
    cell[i] = R * Math.hypot(dlo * Math.cos((lat[i] * Math.PI) / 180), dla) || 1;
  }
  writeFileSync(work + '.elev.f32', Buffer.from(elev.buffer));
  writeFileSync(work + '.cell.f32', Buffer.from(cell.buffer));
  writeFileSync(work + '.mask.u8', Buffer.from(mask.buffer));
  mkdirSync(join(ROOT, 'assets/terrain'), { recursive: true });
  execFileSync('python3', ['-I', join(ROOT, 'tools/terrain/color.py'), work, terrainFile(b), String(Wo), String(Ho), b.palette || 'atlas', String(b.zf || 0)], { stdio: ['ignore', 'inherit', 'inherit'] });
  for (const ext of ['.json', '.f32', '.mask', '.land.json', '.elev.f32', '.cell.f32', '.mask.u8']) rmSync(work + ext, { force: true });
}
