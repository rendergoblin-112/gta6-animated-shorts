// Print duration, mean and peak level of every sound file in a folder (a check you can do without listening).
//   node tools/probe-sfx.mjs sfx/synth
import path from 'node:path';
import {FFMPEG, run, ls} from './lib.mjs';

const dir = process.argv[2] || 'sfx/synth';
for (const f of ls(dir, /\.(mp3|wav)$/i)) {
  const e = run(FFMPEG, ['-hide_banner', '-i', f, '-af', 'volumedetect', '-f', 'null', '-'], {check: false}).stderr;
  const g = (re) => (e.match(re) || [])[1];
  const flag = +g(/max_volume: ([-\d.]+)/) < -20 ? '  <- very quiet' : (+g(/mean_volume: ([-\d.]+)/) < -45 ? '  <- mostly silence' : '');
  console.log(`${path.basename(f).padEnd(22)} ${(g(/Duration: ([\d:.]+)/) || '').padEnd(12)} mean ${g(/mean_volume: ([-\d.]+)/)} dB  max ${g(/max_volume: ([-\d.]+)/)} dB${flag}`);
}
