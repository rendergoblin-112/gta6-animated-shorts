// Contact sheet of stills (one labelled thumbnail per file), ffmpeg only.
//   node tools/sheet.mjs out/sheet.jpg [--cols 7] [--w 220] img1.png img2.png ...
//   node tools/sheet.mjs out/sheet.jpg out/stills          (a folder = every image in it)
import fs from 'node:fs';
import path from 'node:path';
import {FFMPEG, run, ls} from './lib.mjs';

export const FONT = ['/System/Library/Fonts/Supplemental/Arial Bold.ttf', '/System/Library/Fonts/Helvetica.ttc',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'C:/Windows/Fonts/arialbd.ttf'].find((f) => fs.existsSync(f));
export const label = (txt, size) => FONT
  ? `,drawtext=fontfile='${FONT}':text='${String(txt).replace(/[':\\%]/g, ' ')}':x=6:y=6:fontsize=${size}:fontcolor=yellow:box=1:boxcolor=black@0.85:boxborderw=5`
  : '';

export function sheet(out, files, {cols = 7, w = 220, aspect = 16 / 9} = {}) {
  const h = Math.round(w * aspect);
  const args = ['-y', '-v', 'error'];
  files.forEach((f) => args.push('-i', f));
  // pad 2 px larger then crop: 'decrease' scaling can round 1 px over the box and make pad fail
  const fc = files.map((f, i) => `[${i}]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w + 2}:${h + 2}:(ow-iw)/2:(oh-ih)/2:color=0x1e1e1e,crop=${w}:${h}${label(path.basename(f).replace(/\.\w+$/, '').slice(0, 18), Math.max(12, Math.round(w / 13)))}[v${i}]`);
  const layout = files.map((_, i) => `${(i % cols) * (w + 4)}_${Math.floor(i / cols) * (h + 4)}`).join('|');
  fc.push(files.length === 1 ? '[v0]null[out]' : `${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=0x1e1e1e[out]`);
  run(FFMPEG, [...args, '-filter_complex', fc.join(';'), '-map', '[out]', '-frames:v', '1', '-q:v', '3', out]);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2);
  const opt = (k, d) => { const i = a.indexOf(k); if (i < 0) return d; const v = a[i + 1]; a.splice(i, 2); return +v; };
  const cols = opt('--cols', 7), w = opt('--w', 220);
  const out = a.shift();
  let files = [];
  for (const x of a) files.push(...(fs.statSync(x).isDirectory() ? ls(x, /\.(png|jpe?g)$/i) : [x]));
  if (!out || !files.length) { console.error('usage: sheet.mjs out.jpg [--cols N] [--w PX] <images or folder>'); process.exit(1); }
  console.log('saved', sheet(out, files, {cols, w}));
}
