// Faces: parametric, redrawn every frame. Curved lids, 3/4 turn, blinks.
// Expressions are SWAPPED DRAWINGS: a preset changes on a key and is never tweened (format rule).
// Every character uses the same library; per-character eye size/position comes from def.face.
import {ellipsePts, INK} from './draw.js';
import {C} from './palette.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// lid edge height at normalised x (u in -1..1) for an eye centred at cy
function lidY(cy, ry, lid, tilt, curve, u, inner) {
  return cy + ry - 2 * ry * lid - tilt * 0.55 * ry * u * inner - curve * 0.45 * ry * (1 - u * u);
}

export function eye(p, cx, cy, rx, ry, o) {
  const inner = cx < o.faceX ? 1 : -1; // inner side points toward the nose
  if (o.squeeze) { // tantrum eyes: > <
    const k = inner;
    p.stroke([[cx - k * rx * 0.7, cy + ry * 0.45], [cx + k * rx * 0.55, cy], [cx - k * rx * 0.7, cy - ry * 0.45]], {w: 9, smooth: false});
    return;
  }
  if (o.blink) {
    const k = o.happy ? -1 : 1;
    p.stroke([[cx - rx * 0.85, cy - ry * 0.05], [cx, cy - ry * 0.05 - k * ry * 0.32], [cx + rx * 0.85, cy - ry * 0.05]], {w: 8});
    return;
  }
  const outline = ellipsePts(cx, cy, rx, ry, 64);
  p.shape(outline, o.blood ? C.bloodEye : C.eye, {wob: 0.5, line: false});
  const lx = clamp(o.look[0], -1, 1), ly = clamp(o.look[1], -1, 1);
  const pr = o.pr ?? Math.min(rx, ry) * 0.2;
  const px = cx + lx * (rx - pr - 6), py = cy + ly * (ry - pr - 6);
  if (o.blood) {
    [0.25, 1.15, 2.2, 3.3, 4.25, 5.35].forEach((a, i) => {
      const x0 = cx + Math.cos(a) * rx * 0.96, y0 = cy + Math.sin(a) * ry * 0.96;
      const x1 = cx + Math.cos(a + 0.15) * rx * 0.5, y1 = cy + Math.sin(a + 0.15) * ry * 0.5;
      const mx = (x0 + x1) / 2 + (i % 2 ? 4 : -4), my = (y0 + y1) / 2;
      p.stroke([[x0, y0], [mx, my], [x1, y1]], {w: 3, color: C.vein});
      p.stroke([[mx, my], [mx + Math.cos(a + 1.2) * rx * 0.18, my + Math.sin(a + 1.2) * ry * 0.18]], {w: 3, color: C.vein, smooth: false});
    });
  }
  if (!o.noPupil) {
    p.dot(px, py, pr, INK);
    if (o.shine) { // puppy-eye sparkle
      p.dot(px - pr * 0.35, py + pr * 0.38, pr * 0.32, '#ffffff');
      p.dot(px + pr * 0.38, py - pr * 0.3, pr * 0.15, '#ffffff');
    }
  }
  const N = 28;
  if (o.lid > 0.001) {
    const top = [], edge = [];
    for (let i = 0; i <= N; i++) {
      const u = -1 + (2 * i) / N;
      const x = cx + u * rx * 1.03;
      const yt = cy + ry * 1.04 * Math.sqrt(Math.max(0, 1 - u * u));
      const yl = Math.min(yt, lidY(cy, ry, o.lid, o.tilt || 0, o.curve || 0, u, inner));
      top.push([x, yt]); edge.push([x, yl]);
    }
    p.shape([...top, ...edge.reverse()], o.lidColor || C.char, {wob: 0, line: false});
  }
  if (o.lower > 0.001) {
    const bot = [], edge = [];
    for (let i = 0; i <= N; i++) {
      const u = -1 + (2 * i) / N;
      const x = cx + u * rx * 1.03;
      const yb = cy - ry * 1.04 * Math.sqrt(Math.max(0, 1 - u * u));
      const yl = Math.max(yb, cy - ry + 2 * ry * o.lower + (o.lowerCurve ?? 0.6) * 0.3 * ry * (1 - u * u));
      bot.push([x, yb]); edge.push([x, yl]);
    }
    p.shape([...bot, ...edge.reverse()], o.lidColor || C.char, {wob: 0, line: false});
  }
  // outline only the visible part of a lidded eye (a full ellipse outline reads as goggles)
  if ((o.lid || 0) > 0.001 || (o.lower || 0) > 0.001) {
    const N2 = 40, top = [], bot = [];
    for (let i = 0; i <= N2; i++) {
      const u = -1 + (2 * i) / N2, x = cx + u * rx, sq = Math.sqrt(Math.max(0, 1 - u * u));
      let yt = cy + ry * sq, yb = cy - ry * sq;
      if ((o.lid || 0) > 0.001) yt = Math.min(yt, lidY(cy, ry, o.lid, o.tilt || 0, o.curve || 0, u, inner));
      if ((o.lower || 0) > 0.001) yb = Math.max(yb, cy - ry + 2 * ry * o.lower + (o.lowerCurve ?? 0.6) * 0.3 * ry * (1 - u * u));
      if (yt > yb + 1) { top.push([x, yt]); bot.push([x, yb]); }
    }
    if (top.length > 2) p.line([...top, ...bot.reverse()], {w: 8});
  } else p.line(outline, {w: 8});
}

function brow(p, cx, cy, rx, ry, b, inner) {
  // b: {a: angle (+ = angry, inner end down; - = worried), y: lift, w: weight}
  const y = cy + ry + 22 + (b.y || 0);
  const a = b.a || 0;
  const xi = cx + inner * rx * 0.75, xo = cx - inner * rx * 0.85;
  const yi = y - a * 26, yo = y + a * 10;
  p.stroke([[xo, yo], [(xi + xo) / 2, (yi + yo) / 2 + 6 - Math.abs(a) * 4], [xi, yi]], {w: b.w || 10});
}

// ---------------- mouths ----------------
export const MOUTHS = ['line', 'smile', 'frown', 'o', 'open', 'grin', 'smirk', 'tongue', 'gritted', 'wobble', 'scream', 'pout'];
function mouth(p, m, x, y, s) {
  const t = m.type;
  const w = (m.w || 60) * s, h = (m.h || 40) * s;
  if (t === 'line') p.stroke([[x - w / 2, y + (m.c || 0)], [x, y], [x + w / 2, y + (m.c || 0)]], {w: 7});
  else if (t === 'smile') p.stroke([[x - w / 2, y + h * 0.4], [x, y - h * 0.15], [x + w / 2, y + h * 0.4]], {w: 7});
  else if (t === 'frown') p.stroke([[x - w / 2, y - h * 0.25], [x, y + h * 0.2], [x + w / 2, y - h * 0.25]], {w: 7});
  else if (t === 'o') p.ellipse(x, y, w * 0.4, h * 0.5, C.mouth, {w: 7});
  else if (t === 'pout') {
    p.blob([[x - w * 0.4, y - h * 0.1], [x, y + h * 0.25], [x + w * 0.4, y - h * 0.1], [x, y - h * 0.3]], C.mouth, {w: 6});
  } else if (t === 'open') {
    p.blob([[x - w / 2, y + h * 0.3], [x, y + h * 0.4], [x + w / 2, y + h * 0.3], [x + w * 0.32, y - h * 0.45], [x, y - h * 0.6], [x - w * 0.32, y - h * 0.45]], C.mouth);
    p.blob([[x - w * 0.24, y - h * 0.34], [x, y - h * 0.16], [x + w * 0.24, y - h * 0.34], [x, y - h * 0.54]], C.tongue, {w: 5});
  } else if (t === 'grin') {
    // evil grin: wide, flat-topped, corners hooked up into the cheeks, a tooth-row line and a few tooth gaps
    const top = [], bot = [], k = m.skew || 0;
    for (let i = 0; i <= 20; i++) {
      const u = i / 20, xx = x - w / 2 + w * u, e = (u - 0.5) * 2;
      const lift = h * 0.32 * Math.pow(Math.abs(e), 3) + k * e * h * 0.25;
      top.push([xx, y + lift]);
      bot.push([xx, y - h * 0.62 * (1 - e * e) + lift]);
    }
    p.shape([...top, ...bot.slice().reverse()], C.teeth, {wob: 0.3});
    p.stroke(top.map((q2, i) => [q2[0], q2[1] * 0.55 + bot[i][1] * 0.45]).slice(3, -3), {w: 5});
    for (const i of [6, 9, 12, 15]) p.stroke([[top[i][0], top[i][1] - 2], [bot[i][0], bot[i][1] + 2]], {w: 4, smooth: false});
    for (const s2 of [-1, 1]) {
      const c = s2 < 0 ? top[0] : top[20];
      p.stroke([[c[0] + s2 * 2, c[1] - 4], [c[0] + s2 * 16, c[1] + 16]], {w: 6, smooth: false});
    }
  } else if (t === 'smirk') {
    const k = m.side || 1;
    p.stroke([[x - k * w * 0.5, y - h * 0.05], [x, y - h * 0.12], [x + k * w * 0.45, y + h * 0.28], [x + k * w * 0.55, y + h * 0.42]], {w: 7});
    p.stroke([[x + k * w * 0.5, y + h * 0.5], [x + k * w * 0.62, y + h * 0.3]], {w: 5, smooth: false});
  } else if (t === 'tongue') {
    const k = m.side || 1;
    p.blob([[x + k * w * 0.05, y - h * 0.05], [x + k * w * 0.32, y - h * 0.08], [x + k * w * 0.36, y - h * 0.45], [x + k * w * 0.18, y - h * 0.5]], C.tongue, {w: 6});
    p.stroke([[x - w / 2, y + h * 0.05], [x, y - h * 0.08], [x + w / 2, y + h * 0.1]], {w: 7});
  } else if (t === 'gritted') {
    p.rrect(x - w / 2, y - h / 2, x + w / 2, y + h / 2, 10, C.teeth, {w: 7});
    p.stroke([[x - w / 2 + 4, y], [x + w / 2 - 4, y]], {w: 4, smooth: false});
    for (let i = 1; i < 5; i++) { const xx = x - w / 2 + (w * i) / 5; p.stroke([[xx, y - h / 2 + 3], [xx, y + h / 2 - 3]], {w: 4, smooth: false}); }
  } else if (t === 'wobble') {
    const pts = [];
    for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([x - w / 2 + w * u, y - Math.sin(u * Math.PI) * h * 0.25 + Math.sin(u * Math.PI * 5) * h * 0.12]); }
    p.stroke(pts, {w: 7});
  } else if (t === 'scream') {
    p.blob([[x - w * 0.5, y + h * 0.42], [x, y + h * 0.5], [x + w * 0.5, y + h * 0.42], [x + w * 0.42, y - h * 0.3], [x + w * 0.2, y - h * 0.55], [x - w * 0.2, y - h * 0.55], [x - w * 0.42, y - h * 0.3]], C.mouth);
    p.blob([[x - w * 0.3, y - h * 0.42], [x, y - h * 0.18], [x + w * 0.3, y - h * 0.42], [x, y - h * 0.56]], C.tongue, {w: 6});
    if (m.teeth !== false) {
      const strip = (y0, dir) => {
        const n = 7, out = [];
        for (let i = 0; i <= n; i++) { const u = i / n; out.push([x - w * 0.42 + w * 0.84 * u, y0 + dir * Math.sin(u * Math.PI) * h * 0.07]); }
        const zig = [];
        for (let i = 0; i < n; i++) { const a = out[i], b = out[i + 1]; zig.push(a, [(a[0] + b[0]) / 2, a[1] - dir * h * 0.15]); }
        zig.push(out[n]);
        p.shape([...zig, [out[n][0], y0 + dir * h * 0.03], [out[0][0], y0 + dir * h * 0.03]], C.teeth, {wob: 0, w: 5});
      };
      strip(y + h * 0.37, 1); strip(y - h * 0.37, -1);
    }
  }
}

// ---------------- the expression library ----------------
// Eye fields: look [x,y] (-1..1), pr pupil radius, lid/lidL/lidR 0..1, tilt (+ angry slant), curve, lower (cheek push),
// bulge, blood, shine, squeeze, blinkHappy, closed. Extras: brows/browsL/browsR, cheeks, bags, tears, stream, sweat, anger, blush.
const E = (eyes, mouthSpec, extra = {}) => ({...eyes, mouth: mouthSpec, ...extra});
export const EXPR = {
  // calm / want
  neutral:     E({look: [0.1, -0.05]}, {type: 'line', w: 40, c: 4}),
  eager:       E({look: [0, 0.25], ey: 6, ryk: 1.06, brows: {a: -0.3, y: 6}}, {type: 'open', w: 70, h: 58}),
  happy:       E({blinkHappy: true, brows: {a: -0.3, y: 4}}, {type: 'open', w: 78, h: 60}),
  sweet:       E({blinkHappy: true, brows: {a: -0.4, y: 8}, blush: true}, {type: 'smile', w: 56, h: 30}),
  concentrate: E({look: [-0.2, 0.15], lid: 0.28, curve: 0.2, brows: {a: 0.35}}, {type: 'tongue', w: 50, h: 40, side: -1}),
  // scheming / gloat (push-in on these)
  grinEvil:    E({look: [-0.35, -0.15], pr: 9, lid: 0.5, tilt: 0.9, curve: -0.35, lower: 0.2, brows: {a: 0.75, w: 12}, cheeks: true}, {type: 'grin', w: 186, h: 60}),
  sneaky:      E({look: [-0.8, -0.35], pr: 10, lid: 0.42, tilt: 0.35, curve: -0.1, lower: 0.16, browsL: {a: 0.45}, browsR: {a: -0.7, y: 16}}, {type: 'smirk', w: 64, h: 30, side: -1}),
  smug:        E({look: [0.6, 0.1], blood: true, lid: 0.52, tilt: 0.3, curve: -0.2, lower: 0.15, bags: true, brows: {a: 0.3}}, {type: 'grin', w: 130, h: 38, skew: 0.4}),
  gamer:       E({pr: 6, blood: true, look: [0, 0.1], ryk: 1.06, bags: true}, {type: 'grin', w: 170, h: 52}),
  determined:  E({look: [-0.15, 0], lid: 0.34, tilt: 0.9, brows: {a: 0.7, w: 12}}, {type: 'gritted', w: 86, h: 30}),
  peek:        E({look: [-0.8, 0.05], lid: 0.3, tilt: 0.2, browsL: {a: 0.2}}, {type: 'smirk', w: 50, h: 24, side: -1}),
  // the obstacle arrives
  pleading:    E({look: [0, 0.35], pr: 22, shine: true, ryk: 1.08, brows: {a: -0.85, y: 14}}, {type: 'pout', w: 40, h: 26}),
  annoyed:     E({look: [-0.6, 0], lid: 0.5, tilt: 0.1, brows: {a: 0.25, w: 11}}, {type: 'line', w: 52, c: -6}),
  confused:    E({look: [-0.5, 0.1], lidL: 0.55, browsR: {a: -0.7, y: 16}, browsL: {a: 0.4}}, {type: 'wobble', w: 46, h: 24}),
  stern:       E({look: [0.2, 0.05], lid: 0.3, tilt: 0.55, brows: {a: 0.35, w: 12}}, {type: 'line', w: 46, c: -3}),
  huff:        E({look: [0.1, 0], lid: 0.45, tilt: 1.2, brows: {a: 1.0, w: 15}, anger: true}, {type: 'frown', w: 60, h: 30}),
  angry:       E({look: [0.15, 0], lid: 0.38, tilt: 1.0, brows: {a: 0.8, w: 14}, anger: true}, {type: 'gritted', w: 88, h: 32}),
  furious:     E({look: [0.05, -0.05], lid: 0.42, tilt: 1.4, brows: {a: 1.1, w: 16}, anger: true}, {type: 'scream', w: 100, h: 74}),
  // shock (bulging, bloodshot eyes: 5/5 top shorts have this close-up in the first 5 s)
  shock:       E({bulge: true, pr: 6}, {type: 'o', w: 40, h: 40}),
  shockBlood:  E({bulge: true, blood: true, pr: 6, sweat: true}, {type: 'wobble', w: 60, h: 34}),
  panic:       E({bulge: true, blood: true, pr: 5, sweat: true, brows: {a: -0.7, y: 18}}, {type: 'scream', w: 110, h: 90}),
  // rage / button
  rage:        E({pr: 5, blood: true, lid: 0.3, tilt: 1.6, ryk: 0.78, brows: {a: 1.3, w: 18}, anger: true}, {type: 'scream', w: 175, h: 135}),
  scream:      E({bulge: true, blood: true, pr: 5, brows: {a: 0.9, w: 13}}, {type: 'scream', w: 160, h: 125}),
  tantrum:     E({squeeze: true, brows: {a: 0.9, w: 13}, stream: true, anger: true}, {type: 'scream', w: 170, h: 130, teeth: false}),
  despair:     E({look: [0, -0.4], lid: 0.32, tilt: -1.0, tears: true, brows: {a: -0.8}}, {type: 'wobble', w: 58, h: 34}),
  // low energy
  tired:       E({look: [0, -0.1], lid: 0.56, curve: 0.15, bags: true, brows: {a: -0.25, y: -4}}, {type: 'line', w: 40, c: -2}),
  dizzy:       E({look: [0.4, 0.4], lid: 0.45, curve: 0.3, brows: {a: -0.4}}, {type: 'wobble', w: 50, h: 30}),
  asleep:      E({closed: true, brows: {a: -0.1, y: -2}}, {type: 'o', w: 22, h: 20}),
};
export const KID_EXPR = EXPR, MOM_EXPR = EXPR; // backwards-compatible names

// face geometry defaults (head width 300); override per character in def.face
export const FACE_DEFAULT = {erx: 56, ery: 64, ey: 38, my: -78, sep: 56, lashes: false};

// draw a face. spec: preset object. opt: {turn, blink, face}
export function drawFace(p, spec, {turn = 0, blink = false, face = {}} = {}) {
  const F = {...FACE_DEFAULT, ...face};
  const fx = turn * 40;
  const ERX = F.erx, ERY = F.ery * (spec.ryk || 1);
  const EY = F.ey + (spec.ey || 0);
  const bulge = spec.bulge ? 1.2 : 1;
  const sep = F.sep * (1 - 0.16 * Math.abs(turn)) * (spec.bulge ? 1.08 : 1);
  const closed = blink || spec.closed;
  for (const [side, cx0] of [[-1, fx - sep], [1, fx + sep]]) {
    const far = turn !== 0 && Math.sign(turn) === side;
    const sx = far ? 1 - 0.2 * Math.abs(turn) : 1;
    const rx = ERX * bulge * sx, ry = ERY * bulge;
    const lidV = side < 0 ? (spec.lidL ?? spec.lid ?? 0) : (spec.lidR ?? spec.lid ?? 0);
    eye(p, cx0, EY + (spec.bulge ? 10 : 0), rx, ry, {
      faceX: fx, look: spec.look || [0, 0], pr: spec.pr, blood: spec.blood, lid: lidV, tilt: spec.tilt, curve: spec.curve,
      lower: spec.lower, blink: closed || spec.blinkHappy, happy: spec.blinkHappy, shine: spec.shine, squeeze: spec.squeeze,
    });
    const b = side < 0 ? (spec.browsL || spec.brows) : (spec.browsR || spec.brows);
    const inner = cx0 < fx ? 1 : -1;
    if (b) brow(p, cx0, EY, rx, ry * (spec.bulge ? 1.1 : 1), b, inner);
    if (F.lashes && !closed && !spec.squeeze) {
      const ox = cx0 - inner * rx * 0.92, oy = EY + ry * 0.45;
      p.stroke([[ox, oy], [ox - inner * 18, oy + 14]], {w: 6, smooth: false});
      p.stroke([[ox + inner * 4, oy - 16], [ox - inner * 20, oy - 12]], {w: 6, smooth: false});
    }
    if (spec.cheeks) p.stroke([[cx0 - rx * 0.6, EY - ry - 6], [cx0, EY - ry - 18], [cx0 + rx * 0.6, EY - ry - 6]], {w: 5});
    if (spec.bags) p.stroke([[cx0 - rx * 0.7, EY - ry - 4], [cx0, EY - ry - 14], [cx0 + rx * 0.7, EY - ry - 4]], {w: 5});
    if (spec.blush) p.ellipse(cx0 - inner * rx * 0.2, EY - ry - 22, 26, 13, C.blush, {line: false, wob: 0});
    if (spec.tears && !closed) {
      const tx = cx0 + inner * -rx * 0.3, ty = EY - ry * 0.7;
      p.blob([[tx - 9, ty], [tx, ty + 10], [tx + 9, ty], [tx + 7, ty - 70], [tx, ty - 82], [tx - 7, ty - 70]], C.tear, {w: 5});
    }
    if (spec.stream) { // tantrum: two tear streams shooting out sideways
      const sx0 = cx0 - inner * rx * 0.6, sy0 = EY - ry * 0.1;
      p.tube([[sx0, sy0], [sx0 - inner * 60, sy0 + 26], [sx0 - inner * 120, sy0 - 10], [sx0 - inner * 150, sy0 - 90]], 22, C.tear, {w: 5});
    }
  }
  const nx = fx * 1.25;
  p.stroke([[nx - 2, -22], [nx + 8 + turn * 6, -36], [nx - 4, -42]], {w: 6});
  if (spec.mouth) mouth(p, spec.mouth, fx * 1.1 + (spec.mouth.dx || 0), F.my + (spec.mouth.dy || 0), 1);
  if (spec.sweat) p.blob([[150, 90], [161, 64], [150, 54], [139, 64]].map(([a, b]) => [a - turn * 30, b]), C.tear, {w: 5});
  if (spec.anger) {
    const ax = 100 - turn * 20, ay = 112;
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const c = Math.cos(a), s = Math.sin(a);
      const q = (u, v) => [ax + u * c - v * s, ay + u * s + v * c];
      p.stroke([q(8, 22), q(10, 10), q(22, 8)], {w: 7, color: C.vein});
    }
  }
}
