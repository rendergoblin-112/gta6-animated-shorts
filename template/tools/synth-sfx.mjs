// Code-synthesized cartoon sound kit: works with NO API key and is 100% original (made from oscillators and noise).
// Writes sfx/synth/<name>.mp3 (or .wav if ffmpeg has no mp3 encoder) + a looping music bed sfx/synth/bed.mp3.
// The voice placeholders (gasp, wail, chuckle, hmm, roar, cackle) are crude: regenerate them with ElevenLabs
// (`npm run sfx:gen`) or record your own. Usage: node tools/synth-sfx.mjs [--only name,name]
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, FFMPEG, run} from './lib.mjs';

const SR = 44100;
const OUT = path.join(ROOT, 'sfx', 'synth');
fs.mkdirSync(OUT, {recursive: true});

// ---------- tiny DSP ----------
let seed = 12345;
const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
const buf = (sec) => new Float32Array(Math.round(sec * SR));
const TAU = Math.PI * 2;
const wave = {sine: (p) => Math.sin(p), square: (p) => (Math.sin(p) >= 0 ? 1 : -1) * 0.6, saw: (p) => ((p / TAU) % 1) * 2 - 1, tri: (p) => 1 - 4 * Math.abs(((p / TAU) % 1) - 0.5)};
// add a tone: f(t) Hz, env(t) amplitude, from t0 for dur seconds
function tone(b, t0, dur, f, env, type = 'sine') {
  let ph = 0; const i0 = Math.round(t0 * SR), n = Math.round(dur * SR);
  for (let i = 0; i < n && i0 + i < b.length; i++) { const t = i / SR; ph += TAU * f(t, t / dur) / SR; b[i0 + i] += wave[type](ph) * env(t, t / dur); }
}
function noise(b, t0, dur, env, color = 'white') {
  const i0 = Math.round(t0 * SR), n = Math.round(dur * SR); let last = 0;
  for (let i = 0; i < n && i0 + i < b.length; i++) {
    let x = rnd() * 2 - 1;
    if (color === 'brown') { last = (last + 0.02 * x) / 1.02; x = last * 3.5; }
    b[i0 + i] += x * env(i / SR, i / n);
  }
}
// biquad filter in place over [t0, t0+dur] (whole buffer by default). f may be a function of u (0..1)
function filt(b, type, f, q = 0.7, t0 = 0, dur = null) {
  const i0 = Math.round(t0 * SR), n = dur == null ? b.length - i0 : Math.round(dur * SR);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < n && i0 + i < b.length; i++) {
    const fc = typeof f === 'function' ? f(i / n) : f;
    const w = TAU * Math.min(fc, SR * 0.45) / SR, al = Math.sin(w) / (2 * q), cw = Math.cos(w);
    let b0, b1, b2; const a0 = 1 + al, a1 = -2 * cw, a2 = 1 - al;
    if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2; }
    else if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2; }
    else { b0 = al; b1 = 0; b2 = -al; } // bandpass
    const x = b[i0 + i];
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y; b[i0 + i] = y;
  }
}
function pluck(b, t0, freq, dur, amp = 0.5, bright = 0.5) { // Karplus-Strong: pizzicato / bass
  const N = Math.max(2, Math.round(SR / freq)), ring = new Float32Array(N);
  for (let i = 0; i < N; i++) ring[i] = rnd() * 2 - 1;
  const i0 = Math.round(t0 * SR), n = Math.round(dur * SR);
  let idx = 0;
  for (let i = 0; i < n && i0 + i < b.length; i++) {
    const a = ring[idx], c = ring[(idx + 1) % N];
    ring[idx] = (a * (0.5 + bright * 0.5) + c * (0.5 - bright * 0.5)) * 0.996;
    b[i0 + i] += a * amp * Math.min(1, (n - i) / (0.02 * SR));
    idx = (idx + 1) % N;
  }
}
const dec = (k) => (t) => Math.exp(-t * k);
const adsr = (a, d, s, r, len) => (t) => (t < a ? t / a : t < a + d ? 1 - (1 - s) * (t - a) / d : t < len - r ? s : Math.max(0, s * (len - t) / r));
const norm = (b, peak = 0.89) => { let m = 0; for (const x of b) m = Math.max(m, Math.abs(x)); if (m > 0) for (let i = 0; i < b.length; i++) b[i] *= peak / m; return b; };
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
// a formant "voice" (placeholder): saw through 3 vowel formants with a pitch contour
function voice(b, t0, dur, pitch, vowel, env, rough = 0) {
  const V = {a: [800, 1150, 2900], o: [450, 800, 2830], u: [325, 700, 2700], e: [400, 1700, 2600], m: [250, 1000, 2500], h: [700, 1200, 2600]}[vowel];
  const src = buf(dur); tone(src, 0, dur, (t, u) => pitch(t, u) * (1 + rough * (rnd() - 0.5) * 0.1), env, 'saw');
  if (vowel === 'h') noise(src, 0, dur, (t, u) => env(t, u) * 0.6);
  const out = buf(dur);
  V.forEach((f, k) => { const c = Float32Array.from(src); filt(c, 'bp', f, 6 + k * 2); for (let i = 0; i < out.length; i++) out[i] += c[i] * [1, 0.6, 0.25][k]; });
  const i0 = Math.round(t0 * SR); for (let i = 0; i < out.length && i0 + i < b.length; i++) b[i0 + i] += out[i];
}

// ---------- the kit ----------
const K = {
  boing: () => { const b = buf(0.8); tone(b, 0, 0.8, (t) => 180 + 140 * Math.sin(TAU * 11 * t) * Math.exp(-t * 4) + 60 * Math.exp(-t * 6), dec(5)); return b; },
  pop: () => { const b = buf(0.18); tone(b, 0, 0.18, (t) => 900 - 3000 * t, dec(30)); return b; },
  pop2: () => { const b = buf(0.22); tone(b, 0, 0.22, (t) => 500 + 2600 * t, dec(22)); return b; },
  click: () => { const b = buf(0.08); noise(b, 0, 0.08, dec(120)); filt(b, 'bp', 3200, 2); tone(b, 0, 0.03, () => 1800, dec(200)); return b; },
  tap: () => { const b = buf(0.12); tone(b, 0, 0.12, () => 1200, dec(60)); noise(b, 0, 0.05, dec(150)); return b; },
  zip: () => { const b = buf(0.45); noise(b, 0, 0.45, adsr(0.05, 0.1, 0.6, 0.25, 0.45)); filt(b, 'bp', (u) => 600 + 5000 * u, 3); return b; },
  whoosh: () => { const b = buf(0.8); noise(b, 0, 0.8, (t, u) => Math.sin(Math.PI * u) ** 2); filt(b, 'bp', (u) => 300 + 1800 * Math.sin(Math.PI * u), 1.2); return b; },
  yoink: () => { const b = K.whoosh().slice(0, Math.round(0.4 * SR)); tone(b, 0.32, 0.08, (t) => 700 - 2500 * t, dec(40)); return b; },
  boom: () => { const b = buf(1.8); tone(b, 0, 1.8, (t) => 70 * Math.exp(-t * 1.5) + 32, dec(2.2)); noise(b, 0, 1.4, dec(4), 'brown'); filt(b, 'lp', 1400); return b; },
  bonk: () => { const b = buf(0.5); tone(b, 0, 0.5, () => 640, dec(18)); tone(b, 0, 0.5, () => 1720, (t) => 0.4 * Math.exp(-t * 30)); tone(b, 0.02, 0.4, (t) => 300 + 40 * Math.sin(TAU * 30 * t), (t) => 0.25 * Math.exp(-t * 9)); return b; },
  slide_down: () => { const b = buf(1.1); tone(b, 0, 1.1, (t, u) => 1500 * Math.pow(0.22, u) * (1 + 0.012 * Math.sin(TAU * 6 * t)), adsr(0.03, 0.1, 0.8, 0.2, 1.1)); return b; },
  slide_up: () => { const b = buf(0.7); tone(b, 0, 0.7, (t, u) => 380 * Math.pow(4, u), adsr(0.03, 0.1, 0.8, 0.15, 0.7)); return b; },
  stomp: () => { const b = buf(0.6); tone(b, 0, 0.6, (t) => 90 * Math.exp(-t * 6) + 40, dec(9)); noise(b, 0, 0.12, dec(40), 'brown'); filt(b, 'lp', 900); return b; },
  thump: () => { const b = buf(0.4); tone(b, 0, 0.4, (t) => 120 * Math.exp(-t * 10) + 50, dec(14)); return b; },
  flump: () => { const b = buf(0.7); noise(b, 0, 0.5, dec(9), 'brown'); filt(b, 'lp', 500); tone(b, 0.05, 0.6, (t) => 900 + 300 * Math.sin(TAU * 14 * t), (t) => 0.08 * Math.exp(-t * 6)); return b; },
  tv_off: () => { const b = buf(1.0); noise(b, 0, 0.04, dec(100)); tone(b, 0.02, 0.9, (t, u) => 1800 * Math.pow(0.05, u), (t, u) => 0.6 * (1 - u)); return b; },
  tv_on: () => { const b = buf(0.8); tone(b, 0, 0.08, () => 1500, dec(40)); tone(b, 0.05, 0.75, (t, u) => 60 + 40 * u, (t, u) => 0.3 * u, 'saw'); filt(b, 'lp', 1500); return b; },
  ticks: () => { const b = buf(2.0); for (let k = 0; k < 4; k++) { tone(b, k * 0.5, 0.05, () => (k % 2 ? 2400 : 2000), dec(160)); } return b; },
  squeak_steps: () => { const b = buf(2.0); for (let k = 0; k < 6; k++) tone(b, k * 0.32, 0.12, (t, u) => 1300 + 900 * Math.sin(Math.PI * u), (t, u) => Math.sin(Math.PI * u) * 0.6); return b; },
  tiptoe: () => { const b = buf(2.0); [0, 0.3, 0.6, 0.9, 1.2, 1.5].forEach((t, k) => pluck(b, t, mtof([67, 64, 67, 64, 69, 67][k]), 0.25, 0.6, 0.7)); return b; },
  mash: () => { const b = buf(1.5); for (let k = 0; k < 16; k++) { const t = k * 0.085 + rnd() * 0.02; noise(b, t, 0.03, dec(150)); tone(b, t, 0.02, () => 2200 + rnd() * 800, dec(250)); } filt(b, 'hp', 800); return b; },
  knuckles: () => { const b = buf(0.8); [0, 0.11, 0.19, 0.33, 0.42].forEach((t) => noise(b, t, 0.03, dec(200))); filt(b, 'bp', 2500, 1.5); return b; },
  stamp: () => { const b = buf(0.4); tone(b, 0, 0.4, (t) => 160 * Math.exp(-t * 8) + 80, dec(12)); noise(b, 0, 0.05, dec(80)); return b; },
  eye_pop: () => { const b = buf(0.7); tone(b, 0, 0.12, (t) => 400 + 4000 * t, dec(20)); tone(b, 0.1, 0.6, (t) => 520 + 120 * Math.sin(TAU * 18 * t) * Math.exp(-t * 6), (t) => 0.6 * Math.exp(-t * 6)); return b; },
  gulp: () => { const b = buf(0.5); tone(b, 0, 0.5, (t, u) => 260 + 400 * Math.sin(Math.PI * u) - 200 * u, (t, u) => Math.sin(Math.PI * u) * 0.7); filt(b, 'lp', 900); return b; },
  door_bang: () => { const b = buf(1.0); tone(b, 0, 0.15, (t) => 300 + 200 * Math.sin(TAU * 25 * t), (t) => 0.2); tone(b, 0.15, 0.85, (t) => 70 * Math.exp(-t * 5) + 45, dec(7)); noise(b, 0.15, 0.4, dec(18), 'brown'); filt(b, 'lp', 1600); return b; },
  door_creak: () => { const b = buf(1.2); tone(b, 0, 1.2, (t, u) => 180 + 120 * u + 25 * Math.sin(TAU * 9 * t), (t, u) => Math.sin(Math.PI * u) * 0.5, 'saw'); filt(b, 'bp', (u) => 900 + 500 * u, 4); return b; },
  steps_angry: () => { const b = buf(1.4); [0, 0.32, 0.64, 0.96].forEach((t, k) => { tone(b, t, 0.3, (x) => 85 * Math.exp(-x * 8) + 40, (x) => (0.55 + k * 0.15) * Math.exp(-x * 12)); noise(b, t, 0.06, (x) => 0.3 * Math.exp(-x * 60), 'brown'); }); filt(b, 'lp', 1000); return b; },
  scramble: () => { const b = buf(1.4); for (let k = 0; k < 18; k++) noise(b, k * 0.07 + rnd() * 0.03, 0.05, dec(70)); filt(b, 'bp', 1400, 0.8); return b; },
  record_scratch: () => { const b = buf(0.9); noise(b, 0, 0.9, (t, u) => (u < 0.35 ? 1 : 0.7) * (1 - u)); filt(b, 'bp', (u) => (u < 0.35 ? 400 + 3500 * (u / 0.35) : 3900 - 3300 * ((u - 0.35) / 0.65)), 5); return b; },
  sad_trombone: () => { const b = buf(2.2); [[62, 0, 0.4], [61, 0.42, 0.4], [60, 0.84, 0.4], [59, 1.26, 0.9]].forEach(([m, t, d], k) => tone(b, t, d, (x) => mtof(m - 12) * (1 + (k === 3 ? 0.03 * Math.sin(TAU * 6 * x) : 0)), adsr(0.04, 0.05, 0.8, 0.12, d), 'saw')); filt(b, 'lp', 1100, 1.2); return b; },
  dun_dun: () => { const b = buf(2.6); [[0, 0.45, 0.7], [0.55, 0.45, 0.8], [1.1, 1.5, 1]].forEach(([t, d, a]) => { for (const m of [36, 43, 48, 51]) tone(b, t, d, () => mtof(m), (x) => a * Math.exp(-x * (d > 1 ? 1.6 : 4)), 'saw'); tone(b, t, d, (x) => 55 * Math.exp(-x * 3) + 40, (x) => a * 1.5 * Math.exp(-x * 5)); }); filt(b, 'lp', 1800); return b; },
  sting: () => { const b = buf(1.5); for (const m of [40, 46, 52, 53, 59]) tone(b, 0, 1.5, (x) => mtof(m) * (1 + 0.004 * Math.sin(TAU * 7 * x)), (x) => Math.exp(-x * 2.2), 'saw'); noise(b, 0, 0.3, dec(14), 'brown'); filt(b, 'lp', 2600); return b; },
  mission_start: () => { const b = buf(1.2); [60, 64, 67, 72].forEach((m, k) => tone(b, k * 0.08, 0.2, () => mtof(m + 12), adsr(0.005, 0.05, 0.6, 0.08, 0.2), 'square')); tone(b, 0.34, 0.8, () => mtof(84), (x) => Math.exp(-x * 3), 'square'); tone(b, 0.34, 0.6, () => mtof(48), (x) => Math.exp(-x * 4), 'tri'); filt(b, 'lp', 5000); return b; },
  mission_done: () => { const b = buf(2.0); [[72, 0, 0.15], [72, 0.17, 0.15], [72, 0.34, 0.15], [76, 0.51, 0.3], [79, 0.85, 1.0]].forEach(([m, t, d]) => { tone(b, t, d, () => mtof(m), adsr(0.005, 0.05, 0.7, 0.1, d), 'square'); tone(b, t, d, () => mtof(m - 24), adsr(0.005, 0.05, 0.7, 0.1, d), 'tri'); }); filt(b, 'lp', 5000); return b; },
  game_car: () => { const b = buf(2.0); tone(b, 0, 2.0, (t, u) => 70 + 160 * u + 25 * Math.sin(TAU * 3 * t), adsr(0.1, 0.2, 0.8, 0.5, 2.0), 'saw'); tone(b, 0, 2.0, (t, u) => 140 + 320 * u, (t) => 0.3, 'square'); filt(b, 'lp', 1500); return b; },
  pot_bell: () => { const b = buf(1.2); [0, 0.22, 0.44].forEach((t) => { for (const [f, a] of [[880, 1], [1460, 0.6], [2310, 0.4], [3170, 0.25]]) tone(b, t, 0.7, () => f, (x) => a * Math.exp(-x * 7)); }); return b; },
  night_amb: () => { const b = buf(5.0); noise(b, 0, 5, () => 0.15, 'brown'); filt(b, 'lp', 600); for (let k = 0; k < 10; k++) tone(b, k * 0.5, 0.04, () => 2100, (x) => 0.25 * Math.exp(-x * 160)); for (let k = 0; k < 7; k++) tone(b, 0.3 + k * 0.7, 0.15, () => 4300 + 200 * Math.sin(k), (x, u) => 0.04 * Math.sin(Math.PI * u) * (Math.sin(TAU * 40 * x) > 0 ? 1 : 0)); return b; },
  // ---- voice placeholders (replace with ElevenLabs: they are only there so the mix never has a hole) ----
  kid_gasp: () => { const b = buf(0.6); voice(b, 0, 0.5, (t, u) => 420 + 200 * u, 'h', (t, u) => Math.sin(Math.PI * Math.min(1, u * 1.6)) * 0.8); return b; },
  kid_chuckle: () => { const b = buf(1.2); [0, 0.22, 0.44, 0.66].forEach((t, k) => voice(b, t, 0.16, () => 330 - k * 15, 'e', (x, u) => Math.sin(Math.PI * u))); return b; },
  kid_wail: () => { const b = buf(1.4); voice(b, 0, 1.4, (t, u) => 560 + 160 * Math.sin(Math.PI * u) + 18 * Math.sin(TAU * 7 * t), 'a', adsr(0.05, 0.2, 0.9, 0.3, 1.4), 1); return b; },
  kid_tantrum: () => { const b = buf(1.6); voice(b, 0, 0.7, (t, u) => 700 + 250 * Math.sin(Math.PI * u) + 30 * Math.sin(TAU * 11 * t), 'a', adsr(0.03, 0.1, 0.9, 0.1, 0.7), 2); voice(b, 0.75, 0.85, (t, u) => 760 - 200 * u + 30 * Math.sin(TAU * 11 * t), 'a', adsr(0.03, 0.1, 0.9, 0.3, 0.85), 2); return b; },
  kid_giggle: () => { const b = buf(1.0); [0, 0.14, 0.28, 0.42].forEach((t, k) => voice(b, t, 0.11, () => 620 - k * 20, 'e', (x, u) => Math.sin(Math.PI * u))); return b; },
  kid_whine: () => { const b = buf(1.2); voice(b, 0, 1.1, (t, u) => 480 + 140 * Math.sin(Math.PI * u * 1.2) + 12 * Math.sin(TAU * 8 * t), 'e', adsr(0.06, 0.2, 0.8, 0.3, 1.1)); return b; },
  mom_hmm: () => { const b = buf(0.7); voice(b, 0, 0.6, (t, u) => 230 - 60 * u, 'm', (t, u) => Math.sin(Math.PI * Math.min(1, u * 1.3)) * 0.9); return b; },
  mom_roar: () => { const b = buf(1.6); voice(b, 0, 1.6, (t, u) => 190 + 90 * u + 10 * Math.sin(TAU * 9 * t), 'a', adsr(0.1, 0.3, 1, 0.3, 1.6), 3); noise(b, 0, 1.6, (t, u) => 0.15 * u); return b; },
  mom_cackle: () => { const b = buf(1.5); [0, 0.18, 0.36, 0.54, 0.72].forEach((t, k) => voice(b, t, 0.14, () => 380 - k * 12, 'e', (x, u) => Math.sin(Math.PI * u))); return b; },
};

// ---------- the music bed: sneaky staccato pizzicato + bass + soft hat, 112 bpm, ~38 s, loopable ----------
function bed(sec = 38) {
  const b = buf(sec), beat = 60 / 112;
  const prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
  const mel = [0, 2, 1, 2, 0, 1, 2, 1];
  for (let bar = 0; bar * 4 * beat < sec; bar++) {
    const ch = prog[bar % 4], t0 = bar * 4 * beat;
    pluck(b, t0, mtof(ch[0] - 24), beat * 1.6, 0.9, 0.3);
    pluck(b, t0 + 2 * beat, mtof(ch[0] - 17), beat * 1.6, 0.7, 0.3);
    for (let e = 0; e < 8; e++) {
      const t = t0 + e * beat / 2;
      if ((bar + e) % 3 === 1) continue; // rests: sneaky, not wall-to-wall
      pluck(b, t, mtof(ch[mel[(e + bar) % 8]] + 12), beat * 0.35, 0.35, 0.75);
      noise(b, t + beat / 4, 0.03, (x) => 0.05 * Math.exp(-x * 120));
    }
  }
  filt(b, 'lp', 5200);
  return b;
}

function save(name, b) {
  norm(b, name === 'bed' ? 0.7 : 0.89);
  const wav = path.join(OUT, name + '.wav');
  const data = Buffer.alloc(44 + b.length * 2);
  data.write('RIFF', 0); data.writeUInt32LE(36 + b.length * 2, 4); data.write('WAVE', 8); data.write('fmt ', 12);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22); data.writeUInt32LE(SR, 24);
  data.writeUInt32LE(SR * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(b.length * 2, 40);
  for (let i = 0; i < b.length; i++) data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(b[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(wav, data);
  const mp3 = path.join(OUT, name + '.mp3');
  const r = run(FFMPEG, ['-y', '-v', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', name === 'bed' ? '128k' : '96k', mp3], {check: false});
  if (r.status === 0) fs.rmSync(wav);
}

const oi = process.argv.indexOf('--only');
const only = oi >= 0 ? new Set(process.argv[oi + 1].split(',')) : null;
let n = 0;
for (const [name, fn] of Object.entries(K)) { if (only && !only.has(name)) continue; seed = 12345 + name.length * 977; save(name, fn()); n++; }
if (!only || only.has('bed')) { seed = 777; save('bed', bed()); n++; }
console.log(`synthesized ${n} sounds into ${path.relative(process.cwd(), OUT) || OUT}`);
