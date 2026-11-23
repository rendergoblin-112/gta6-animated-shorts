// Frame metrics on stills, compared with the measured medians of the top shorts (references/colour-and-night.md).
//   node tools/metrics.mjs out/stills         (or a list of images)
import fs from 'node:fs';
import path from 'node:path';
import {loadProject, readRGB, ls, median} from './lib.mjs';

const args = process.argv.slice(2);
let files = [];
for (const a of args.length ? args : ['out/stills']) files.push(...(fs.statSync(a).isDirectory() ? ls(a, /\.(png|jpe?g)$/i) : [a]));
const {project} = await loadProject();
const acc = (project.palette && project.palette.accent) || '#16c76a';
const hueOf = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
const accHue = hueOf(...[1, 3, 5].map((i) => parseInt(acc.slice(i, i + 2), 16)));

const rows = files.map((f) => {
  const {w, h, data} = readRGB(f, 270, 480);
  const n = w * h, Y = new Float32Array(n);
  let sat = 0, accN = 0; const cols = new Set();
  for (let i = 0; i < n; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const s = mx ? (255 * (mx - mn)) / mx : 0; sat += s;
    Y[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    cols.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4));
    const dh = Math.abs(hueOf(r, g, b) - accHue);
    if (s > 150 && mx > 120 && Math.min(dh, 360 - dh) < 14) accN++;
  }
  const sorted = Float32Array.from(Y).sort();
  const third = Math.floor(h / 3) * w;
  let top = 0, bot = 0; for (let i = 0; i < third; i++) { top += Y[i]; bot += Y[n - 1 - i]; }
  let flat = 0, cnt = 0;
  for (let y = 2; y < h - 2; y += 2) for (let x = 2; x < w - 2; x += 2) {
    let s = 0, s2 = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const v = Y[(y + dy) * w + x + dx]; s += v; s2 += v * v; }
    if (s2 / 25 - (s / 25) ** 2 < 4) flat++; cnt++;
  }
  return {f: path.basename(f), sat: sat / n, luma: sorted.reduce((a, b) => a + b, 0) / n, rng: sorted[Math.floor(n * 0.95)] - sorted[Math.floor(n * 0.05)],
    tb: top / Math.max(1, bot), flat: flat / cnt, cols: cols.size, acc: (100 * accN) / n};
});
const H = ['sat', 'luma', 'rng', 'tb', 'flat', 'cols', 'acc'];
console.log(`${'still'.padEnd(18)} ${'sat'.padStart(6)} ${'luma'.padStart(6)} ${'p95-5'.padStart(6)} ${'top/bot'.padStart(7)} ${'flat'.padStart(5)} ${'cols'.padStart(5)} ${'accent%'.padStart(7)}`);
const fmt = (r) => `${r.f.slice(0, 18).padEnd(18)} ${r.sat.toFixed(1).padStart(6)} ${r.luma.toFixed(1).padStart(6)} ${r.rng.toFixed(0).padStart(6)} ${r.tb.toFixed(2).padStart(7)} ${r.flat.toFixed(2).padStart(5)} ${String(r.cols).padStart(5)} ${r.acc.toFixed(2).padStart(7)}`;
rows.forEach((r) => console.log(fmt(r)));
const m = Object.fromEntries(H.map((k) => [k, median(rows.map((r) => r[k]))]));
console.log(fmt({f: 'MEDIAN', ...m}));
console.log('target (measured medians): sat <= 56 (41.8) | luma ~130 | p95-5 >= 175 (189) | top/bot > 1 (1.26) | flat >= 0.70 (0.74) | accent 2-4% in hero shots');
const dark = rows.filter((r) => r.luma < 85).map((r) => r.f);
if (dark.length) console.log(`TOO DARK for a phone (luma < 85): ${dark.join(', ')}`);
const loud = rows.filter((r) => r.sat > 70 && !/R\d|fire|rage/i.test(r.f)).map((r) => r.f);
if (loud.length) console.log(`TOO SATURATED (> 70) outside the rage card: ${loud.join(', ')} (screens can be bright; check it is not the room)`);
