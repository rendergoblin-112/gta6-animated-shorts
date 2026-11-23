// Stepped animation helpers. Keys are interpolated (inbetweens) but time is quantised to STEP fps,
// so motion reads as limited animation drawn on twos, with many drawings. Pure JS (no three.js):
// the Node tools import this too.
export const STEP = 12;
export const q = (t, fps = STEP) => Math.floor(t * fps + 1e-6) / fps;
// alternate between two drawings at `fps` (thumb mashing, fists pumping, flames): 0 or 1
export const flip2 = (t, fps = 12) => Math.floor(q(t, fps) * fps) % 2;

const isNum = (v) => typeof v === 'number';
export function lerpDeep(a, b, u) {
  if (isNum(a) && isNum(b)) return a + (b - a) * u;
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every(isNum)) return a.map((v, i) => v + (b[i] - v) * u);
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) {
    const out = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in a)) out[k] = b[k];
      else if (!(k in b)) out[k] = a[k];
      else out[k] = lerpDeep(a[k], b[k], u);
    }
    return out;
  }
  return u < 1 ? a : b; // non-numeric values (expression names, hand shapes) switch on the key: swapped drawings
}
export function merge(...objs) {
  const out = {};
  for (const o of objs) {
    if (!o) continue;
    for (const [k, v] of Object.entries(o)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) out[k] = merge(out[k], v);
      else out[k] = v;
    }
  }
  return out;
}
export const EASE = {lin: (u) => u, out: (u) => 1 - (1 - u) * (1 - u), in: (u) => u * u, io: (u) => u * u * (3 - 2 * u),
  snap: (u) => (u < 0.5 ? 0 : 1), back: (u) => 1 + 2.7 * Math.pow(u - 1, 3) + 1.7 * Math.pow(u - 1, 2)};
// keys: [[t, value, easeToNext?], ...]  ('hold' = no inbetweens to the next key: a straight swap)
export function track(keys, t, fps = STEP) {
  const tq = q(t, fps);
  if (tq <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a, e = 'io'] = keys[i], [t1, b] = keys[i + 1];
    if (tq >= t0 && tq < t1) {
      if (e === 'hold') return a;
      const u = (tq - t0) / (t1 - t0);
      return lerpDeep(a, b, EASE[e](u));
    }
  }
  return keys[keys.length - 1][1];
}
export const isKeyList = (f) => Array.isArray(f) && f.length > 0 &&
  f.every(k => Array.isArray(k) && isNum(k[0]) && (k.length === 2 || (k.length === 3 && typeof k[2] === 'string')));
// A shot field can be a value, a function of local time t, or a key list [[t, value], ...].
export function resolve(field, t) {
  if (typeof field === 'function') return field(t);
  if (isKeyList(field)) return track(field, t);
  return field;
}
// deterministic hash for idle variety
const h = (s) => { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) >>> 0; return (x % 1000) / 1000; };
const NO_BLINK = new Set(['shock', 'shockBlood', 'panic', 'scream', 'rage', 'happy', 'tantrum', 'sweet', 'asleep', 'pleading']);
// idle life: breathing, blinks, tiny head fidget. Stepped at 8 fps so a held pose still reads alive.
export function idle(P, t, key = 'x', {blink = true, breathe = 1, fidget = 1} = {}) {
  const ti = q(t, 8), ph = h(key);
  const br = Math.sin((ti / 1.7 + ph) * Math.PI * 2);
  const period = 2.1 + ph * 0.9;
  const bl = blink && ((ti / period + ph) % 1) < 0.075;
  return merge(P, {
    tsy: (P.tsy ?? 1) * (1 + 0.018 * br * breathe),
    tsx: (P.tsx ?? 1) * (1 - 0.008 * br * breathe),
    blink: P.blink || (bl && !NO_BLINK.has(P.expr)),
    head: {rot: ((P.head && P.head.rot) || 0) + fidget * 0.025 * Math.sin((ti / 2.9 + ph * 3) * Math.PI * 2)},
  });
}
