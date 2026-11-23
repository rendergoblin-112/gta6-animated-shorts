// 4-finger cartoon hands (3 fingers + thumb) in several shapes, limbs, and the game controller.
// Local units: palm ~56 wide. +y local = the direction the fingers point. Transform with {x, y, rot, s, flip}.
// Shapes: open, claw, flat, fist, point, up (one finger up), grip, hold, steeple.
import {xf, tubePts, smooth, ellipsePts} from './draw.js';
import {C} from './palette.js';

function finger(base, dir, len, bend = 0) {
  const a = Math.atan2(dir[1], dir[0]);
  const mid = [base[0] + Math.cos(a) * len * 0.55, base[1] + Math.sin(a) * len * 0.55];
  const tip = [mid[0] + Math.cos(a + bend) * len * 0.5, mid[1] + Math.sin(a + bend) * len * 0.5];
  return [base, mid, tip];
}

export const HAND_SHAPES = ['open', 'claw', 'flat', 'fist', 'point', 'up', 'grip', 'hold', 'steeple'];

export function drawHand(p, kind, {x = 0, y = 0, rot = 0, s = 1, flip = false, color = C.char} = {}) {
  const T = (pts) => xf(pts, {x, y, s, rot, flip});
  const tube = (path, w) => p.shape(T(tubePts(path, w)), color, {w: 7, wob: 0.3});
  const palm = (pts) => p.shape(T(smooth(pts, true, 8)), color, {w: 7, wob: 0.3});
  const crease = (pts) => p.stroke(T(pts), {w: 4, smooth: pts.length > 2});
  const W = 17;
  if (kind === 'open' || kind === 'claw' || kind === 'flat') {
    const bend = kind === 'claw' ? -0.9 : 0;
    const fingers = kind === 'flat'
      ? [[[-14, 18], [-0.25, 1], 40], [[0, 22], [0, 1], 44], [[14, 18], [0.25, 1], 40]]
      : [[[-16, 16], [-0.55, 1], 40], [[0, 22], [0, 1], 46], [[16, 16], [0.55, 1], 40]];
    for (const [b, d, l] of fingers) tube(finger(b, d, l, bend * Math.sign(d[0] || 1)), W);
    tube(finger([-22, -6], [-1, 0.35], 30, kind === 'claw' ? 0.8 : 0), W); // thumb
    palm([[-26, 18], [0, 26], [26, 18], [28, -10], [14, -28], [-14, -28], [-28, -10]]);
  } else if (kind === 'steeple') {
    for (const [b, e] of [[[0, 18], [26, 64]], [[8, 10], [30, 50]], [[10, 0], [30, 36]]]) tube([b, e], W);
    palm([[-26, 20], [4, 28], [16, 12], [20, -14], [8, -28], [-18, -28], [-28, -6]]);
  } else { // fist, point, up, grip, hold
    if (kind === 'point') tube([[16, 6], [50, 8], [70, 10]], W);
    if (kind === 'up') tube([[4, 18], [4, 52], [2, 70]], W);
    palm([[-28, 22], [0, 28], [26, 22], [30, -4], [20, -26], [-20, -26], [-30, -4]]);
    if (kind !== 'up') { crease([[-20, 10], [-4, 12]]); crease([[-20, -4], [-2, -2]]); crease([[-18, -16], [-2, -14]]); }
    else { crease([[-20, 2], [-4, 4]]); crease([[-18, -12], [-2, -10]]); }
    if (kind === 'grip' || kind === 'hold') tube([[-8, 20], [12, 30], [26, 24]], 18);
    else tube([[-22, -2], [-2, -10], [16, -6]], 18);
  }
}

// A limb: shoulder -> elbow -> wrist. Two straight inked segments with the lower drawn over the joint:
// one smoothed tube folds into pointy slivers when the joint bends sharply.
export function limb(p, a, b, c, w, color = C.char, opts = {}) {
  const v1 = [b[0] - a[0], b[1] - a[1]], v2 = [c[0] - b[0], c[1] - b[1]];
  const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / ((Math.hypot(...v1) * Math.hypot(...v2)) || 1);
  if (cos > 0.75) return p.shape(tubePts([a, b, c], w), color, {w: opts.lw ?? 8, wob: 0.4});
  p.shape(tubePts([a, b], w), color, {w: opts.lw ?? 8, wob: 0.3});
  return p.shape(tubePts([b, c], w * 0.94), color, {w: opts.lw ?? 8, wob: 0.3});
}

export function drawPad(p, {x = 0, y = 0, rot = 0, s = 1} = {}) {
  const T = (pts) => xf(pts, {x, y, s, rot});
  p.shape(T(smooth([[-96, 28], [96, 28], [112, -8], [92, -34], [56, -20], [-56, -20], [-92, -34], [-112, -8]], true, 10)), C.pad, {w: 7});
  p.shape(T(ellipsePts(0, 12, 10, 4, 16)), C.accent, {line: false, tag: 'screen'});
  p.shape(T(ellipsePts(40, 6, 7, 7, 16)), C.padBtn, {w: 4});
  p.shape(T(ellipsePts(-40, 6, 7, 7, 16)), C.padBtn, {w: 4});
}
