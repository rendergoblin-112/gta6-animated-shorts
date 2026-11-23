// Mux out/video.mp4 + out/mix.wav -> out/short.mp4 (or the path you give), then print specs + loudness.
//   node tools/mux.mjs [out/short.mp4]
import path from 'node:path';
import fs from 'node:fs';
import {ROOT, FFMPEG, run} from './lib.mjs';

const out = path.resolve(process.argv[2] || path.join(ROOT, 'out', 'short.mp4'));
run(FFMPEG, ['-y', '-hide_banner', '-v', 'error', '-i', path.join(ROOT, 'out', 'video.mp4'), '-i', path.join(ROOT, 'out', 'mix.wav'),
  '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
const info = run(FFMPEG, ['-hide_banner', '-i', out, '-af', 'ebur128', '-f', 'null', '-'], {check: false}).stderr;
const dur = (info.match(/Duration: ([\d:.]+)/) || [])[1];
const v = (info.match(/Video: ([^\n]+)/) || [])[1] || '';
const I = (info.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop();
console.log(`${out}\n  duration ${dur} | ${v.split(',').slice(0, 4).join(',')}\n  ${I} | ${(fs.statSync(out).size / 1e6).toFixed(1)} MB`);
