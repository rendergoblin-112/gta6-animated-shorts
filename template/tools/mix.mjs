// Mix out/cues.json -> out/mix.wav. Rules (references/sound.md): continuous bed ~12 dB under the effects,
// a code-generated room tone so there is never digital silence, ducks under the big moments, -14 LUFS (two-pass),
// limiter at -0.9 dBFS. Prints the checks: loudness, silent windows, cue density, longest gap between effects.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, FFMPEG, run, findSound} from './lib.mjs';

const J = JSON.parse(fs.readFileSync(path.join(ROOT, 'out', 'cues.json'), 'utf8'));
const DUR = +J.dur.toFixed(3);
const OUT = path.join(ROOT, 'out', 'mix.wav');

function volExpr() {
  let e = '1';
  const quiet = J.beds.filter(([, m]) => m === 'night' || m === 'twist' || m === 'quiet').map(([t]) => t);
  if (quiet.length) e = `if(gte(t,${Math.min(...quiet)}),0.6,1)`;
  for (const [a, b] of J.ducks) e = `if(between(t,${a},${b}),0.35,${e})`;
  return e;
}
// Peak-normalise every source to -1 dBFS before the cue gain: generated, synthesized and recorded files arrive at
// very different levels (one generated boing peaked at -12 dB), and a cue's dB should mean the same for any file.
const peakCache = new Map();
function norm(file) {
  if (!peakCache.has(file)) {
    const e = run(FFMPEG, ['-hide_banner', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'], {check: false}).stderr;
    const mx = +((e.match(/max_volume: ([-\d.]+) dB/) || [])[1] ?? -1);
    peakCache.set(file, Math.min(24, -1 - mx));
  }
  return peakCache.get(file);
}
function build(extra) {
  const args = ['-y', '-hide_banner', '-stream_loop', '-1', '-i', findSound(J.bed)];
  for (const [, name] of J.cues) args.push('-i', findSound(name));
  const fc = [`[0]atrim=0:${DUR},asetpts=N/SR/TB,aformat=channel_layouts=stereo,volume=${J.bedGain}dB,volume='${volExpr()}':eval=frame[bed]`,
    `anoisesrc=color=brown:amplitude=0.12:sample_rate=48000:duration=${DUR},lowpass=f=900,highpass=f=60,aformat=channel_layouts=stereo[tone]`];
  const labels = ['[bed]', '[tone]'];
  J.cues.forEach(([t, name, g], i) => {
    const ms = Math.round(t * 1000);
    const gain = (g + norm(findSound(name))).toFixed(2);
    fc.push(`[${i + 1}]aformat=sample_rates=48000:channel_layouts=stereo,volume=${gain}dB,adelay=${ms}|${ms},apad[c${i + 1}]`);
    labels.push(`[c${i + 1}]`);
  });
  fc.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=first,atrim=0:${DUR},alimiter=limit=0.9:attack=2:release=40,afade=t=in:d=0.02,afade=t=out:st=${(DUR - 0.08).toFixed(3)}:d=0.08${extra}[out]`);
  return [...args, '-filter_complex', fc.join(';'), '-map', '[out]', '-ar', '48000', '-ac', '2'];
}

const p1 = run(FFMPEG, [...build(',loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json'), '-f', 'null', '-']).stderr;
const j = JSON.parse(p1.slice(p1.lastIndexOf('{'), p1.lastIndexOf('}') + 1));
const ln = `,loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
run(FFMPEG, [...build(ln), '-v', 'error', OUT]);

// checks
const e = run(FFMPEG, ['-hide_banner', '-i', OUT, '-af', 'ebur128', '-f', 'null', '-']).stderr;
const I = (e.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop();
const pcm = run(FFMPEG, ['-v', 'error', '-i', OUT, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], {binary: true}).stdout;
const nS = Math.floor(pcm.length / 4);
const x = new Float32Array(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + nS * 4));
const win = 1600; let silent = 0, n = Math.floor(x.length / win);
for (let w = 0; w < n; w++) { let s = 0; for (let i = w * win; i < (w + 1) * win; i++) s += x[i] * x[i]; if (10 * Math.log10(s / win + 1e-12) < -45) silent++; }
const ts = J.cues.map((c) => c[0]).sort((a, b) => a - b);
const gaps = [0, ...ts].map((t, i, arr) => (i + 1 < arr.length ? arr[i + 1] - t : DUR - t));
console.log(`mix: ${(x.length / 48000).toFixed(2)} s | loudness ${I} (target -14) | silent 33ms windows ${(100 * silent / n).toFixed(2)}% (target <= 5%)`);
console.log(`cues ${J.cues.length} | ${(J.cues.length / DUR).toFixed(2)} per s | longest gap between effects ${Math.max(...gaps).toFixed(2)} s (target <= 1.5 s)`);
console.log('wrote out/mix.wav');
