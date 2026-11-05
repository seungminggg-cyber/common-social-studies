// 우리나라 하천망 계산 (data/geo/kr-rivers.json 의 원자료)
//   1) python3 -I tools/terrain/mosaic.py <타일 폴더> 9 123.8 32.8 131.2 43.6 /tmp/kr9 <ne_10m_admin_0_countries.geojson>
//      (고도 타일 z=9 를 이어 붙이고, Natural Earth 나라 경계로 육지 마스크를 만든다)
//   2) node tools/terrain/rivers.mjs /tmp/kr9 80 /tmp/kr-rivers.json
//   3) node tools/geo-prep.mjs <원자료 폴더> /tmp/kr-rivers.json
// 고도 원자료 → 하천망 (경위도 선 + 지점별 유역 면적)
// (사용법은 위 2번)
// 1) 바다·가장자리에서 시작해 낮은 곳부터 채워 나가며(priority-flood) 물이 흘러갈 칸을 정함
// 2) 상류부터 유역 면적을 더해 내려감
// 3) 유역이 넓은 칸을 이어 강 줄기로 만들고, 점을 줄여 저장
import { readFileSync, writeFileSync } from 'node:fs';

const [base, minA = '100', out] = process.argv.slice(2);
const meta = JSON.parse(readFileSync(base + '.json', 'utf8'));
const { z, X0, Y0, R, C } = meta;
const h = new Float32Array(readFileSync(base + '.f32').buffer.slice(0));
const N = 256 * 2 ** z, n = R * C;

// 칸 넓이(km²)
const rowKm = new Float64Array(R);
for (let r = 0; r < R; r++) {
  const phi = Math.atan(Math.sinh(Math.PI - (2 * Math.PI * (r + Y0 + 0.5)) / N));
  rowKm[r] = (40075 * Math.cos(phi)) / N;
}

// 이진 힙 (우선순위 = 채운 높이)
const hp = new Int32Array(n), hv = new Float64Array(n); let hs = 0;
function push(i, v) { let k = hs++; while (k > 0) { const p = (k - 1) >> 1; if (hv[p] <= v) break; hp[k] = hp[p]; hv[k] = hv[p]; k = p; } hp[k] = i; hv[k] = v; }
function pop() {
  const top = hp[0], topv = hv[0]; const i = hp[--hs], v = hv[hs]; let k = 0;
  while (true) { let c = 2 * k + 1; if (c >= hs) break; if (c + 1 < hs && hv[c + 1] < hv[c]) c++; if (hv[c] >= v) break; hp[k] = hp[c]; hv[k] = hv[c]; k = c; }
  hp[k] = i; hv[k] = v; popV = topv; return top;
}
let popV = 0;

const ocean = new Uint8Array(n), done = new Uint8Array(n);
// 바다: 육지 마스크가 있으면 그것으로, 없으면 해발 0m 이하
let mask = null; try { mask = readFileSync(base + '.mask'); } catch {}
for (let i = 0; i < n; i++) if (mask ? !mask[i] : h[i] <= 0) { ocean[i] = 1; done[i] = 1; }
const recv = new Int32Array(n).fill(-1);
const DR = [-1, -1, -1, 0, 0, 1, 1, 1], DC = [-1, 0, 1, -1, 1, -1, 0, 1];
// 출발점: 바다와 맞닿은 땅(받는 칸 = 그 바다 칸), 지도 가장자리 땅
for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
  const i = r * C + c; if (ocean[i]) continue;
  let seed = r === 0 || c === 0 || r === R - 1 || c === C - 1, sea = -1;
  for (let d = 0; d < 8 && sea < 0; d++) { const rr = r + DR[d], cc = c + DC[d]; if (rr >= 0 && rr < R && cc >= 0 && cc < C && ocean[rr * C + cc]) sea = rr * C + cc; }
  if (sea >= 0) { seed = true; recv[i] = sea; }
  if (seed) { done[i] = 1; push(i, h[i]); }
}
const order = new Int32Array(n); let no = 0;
while (hs > 0) {
  const i = pop(), v = popV; order[no++] = i;
  const r = (i / C) | 0, c = i - r * C;
  for (let d = 0; d < 8; d++) {
    const rr = r + DR[d], cc = c + DC[d];
    if (rr < 0 || rr >= R || cc < 0 || cc >= C) continue;
    const j = rr * C + cc; if (done[j]) continue;
    done[j] = 1; recv[j] = i; push(j, Math.max(h[j], v + 1e-3));
  }
}
console.log('흐름 정함', no, '칸');
const acc = new Float32Array(n);
for (let k = 0; k < no; k++) { const i = order[k]; const r = (i / C) | 0; acc[i] += rowKm[r] * rowKm[r]; }
for (let k = no - 1; k >= 0; k--) { const i = order[k], j = recv[i]; if (j >= 0 && !ocean[j]) acc[j] += acc[i]; }

const TH = Number(minA);
const isRiv = (i) => !ocean[i] && acc[i] >= TH;
const up = new Uint8Array(n);
for (let k = 0; k < no; k++) { const i = order[k]; if (isRiv(i)) { const j = recv[i]; if (j >= 0 && isRiv(j)) up[j]++; } }
const lon = (c) => ((c + X0 + 0.5) / N) * 360 - 180;
const lat = (r) => (Math.atan(Math.sinh(Math.PI - (2 * Math.PI * (r + Y0 + 0.5)) / N)) * 180) / Math.PI;
const pt = (i) => { const r = (i / C) | 0, c = i - r * C; return [lon(c), lat(r), acc[i]]; };

// 점 줄이기 (더글러스-포이커, 도 단위)
function dp(p, eps) {
  if (p.length < 3) return p;
  const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1;
  const st = [[0, p.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1;
    const [ax, ay] = p[a], [bx, by] = p[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-12;
    for (let k = a + 1; k < b; k++) { const d = Math.abs((p[k][0] - ax) * dy - (p[k][1] - ay) * dx) / L; if (d > md) { md = d; mi = k; } }
    if (md > eps) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return p.filter((_, k) => keep[k]);
}
const seen = new Uint8Array(n);
const lines = [];
for (let k = 0; k < no; k++) {
  const hd = order[k]; if (!isRiv(hd) || up[hd] !== 0) continue;
  const p = [pt(hd)]; let i = hd;
  while (true) {
    const j = recv[i]; if (j < 0) break;
    if (ocean[j]) { const q = pt(j); q[2] = acc[i]; p.push(q); break; } // 바다까지 이어 그림
    p.push(pt(j));
    if (seen[j]) break; seen[j] = 1; i = j;
  }
  if (p.length >= 2) lines.push(dp(p, 0.0012).map(([x, y, a]) => [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4, Math.round(a)]));
}
writeFileSync(out, JSON.stringify(lines));
console.log('강 줄기', lines.length, '점', lines.reduce((s, l) => s + l.length, 0), (JSON.stringify(lines).length / 1024).toFixed(0) + 'KB');
