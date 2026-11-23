// One rig for every character. A character is DATA (a def), a pose is DATA (P). Immediate mode:
// drawCharacter(pen, def, P) redraws the whole figure for one frame.
//
// Units: head width 300 (rx 150). Origin = hips. Arms and the controller are torso-local (they lean with
// the torso), legs are hip-local. +x = screen right, +y = up.
//
// def = {
//   build: 'kid' | 'small' | 'adult',     body template (proportions below)
//   face: {lashes, erx, ery, ey, my},     eye size/position overrides (see face.js FACE_DEFAULT)
//   hair: {style: 'cowlick'|'curl'|'tuft'|'bun'|'none', color},
//   outfit: {type: 'none'|'tee'|'striped'|'dress'|'apron'|'robe', color, stripe, sleeves},
//   acc: {type: 'headphones'|'cap'|'beanie'|'none', color},   the SIGNATURE prop (hero only: one saturated hue)
//   shoes, ears, defaults: {...pose fields every pose starts from}, poses: {name: P}
// }
// P (pose) = {mode: 'sit'|'stand'|'peek'|'head', turn (-1..1, 3/4 view), lean (rad), dx, dy, sx, sy, rot,
//   tsx, tsy (torso squash), expr, blink, look [x,y], head: {dx, dy, rot, s, sy},
//   armL/armR: {e: elbow [x,y], h: hand [x,y], hand: shape, hr: hand rot, hs: hand scale, flip, prop, pr, propBehind, hide},
//   legL/legR: {h: hip, k: knee, f: foot, hide}, pad: {x, y, rot, s} | null, handsFront, dust, acc, phones, curlers, feet}
import * as THREE from 'three';
import {ellipsePts, smooth, INK} from './draw.js';
import {C} from './palette.js';
import {drawFace, EXPR} from './face.js';
import {drawHand, limb, drawPad} from './hands.js';
import {drawProp} from './props.js';

const rot2 = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

// ---------- clip a convex-ish polygon to a horizontal band (for shirt stripes) ----------
function clipY(poly, y, keepAbove) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ain = keepAbove ? a[1] >= y : a[1] <= y, bin = keepAbove ? b[1] >= y : b[1] <= y;
    if (ain) out.push(a);
    if (ain !== bin) { const t = (y - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, y]); }
  }
  return out;
}
const band = (poly, y0, y1) => clipY(clipY(poly, y0, true), y1, false);

// ---------- body templates ----------
const KID_TORSO = [[-52, 250], [52, 250], [82, 140], [100, 12], [62, -16], [-62, -16], [-100, 12], [-82, 140]];
export const BUILDS = {
  kid: {
    shoulderY: 226, shoulderX: 60, headY: 356, headYSit: 356, armW: 30, legW: 38, footRx: 42,
    torso: KID_TORSO, legsOverTorsoSeated: true, ears: true,
    arms: {armL: {e: [-122, 150], h: [-64, 98], hand: 'grip', hr: -0.3}, armR: {e: [122, 150], h: [64, 98], hand: 'grip', hr: 0.3}},
    stand: {legL: {h: [-40, -4], k: [-46, -150], f: [-48, -296]}, legR: {h: [40, -4], k: [46, -150], f: [48, -296]}},
    // thighs along the seat toward the camera side, shins hanging, feet off the floor = clearly SITTING
    seated: (k) => ({legL: {h: [-46, -4], k: [-46 + k * 160 - 20, -50], f: [-46 + k * 160 - 30, -215]},
      legR: {h: [46, -4], k: [46 + k * 160 + 16, -44], f: [46 + k * 160 + 8, -210]}}),
  },
  small: { // a little sibling: shorter torso and legs, same head -> reads younger
    shoulderY: 186, shoulderX: 54, headY: 312, headYSit: 312, armW: 27, legW: 34, footRx: 36,
    torso: KID_TORSO.map(([x, y]) => [x * 0.9, y * 0.82]), legsOverTorsoSeated: true, ears: true,
    arms: {armL: {e: [-108, 128], h: [-58, 86], hand: 'grip', hr: -0.3}, armR: {e: [108, 128], h: [58, 86], hand: 'grip', hr: 0.3}},
    stand: {legL: {h: [-36, -4], k: [-40, -118], f: [-42, -232]}, legR: {h: [36, -4], k: [40, -118], f: [42, -232]}},
    seated: (k) => ({legL: {h: [-40, -4], k: [-40 + k * 130 - 16, -44], f: [-40 + k * 130 - 24, -170]},
      legR: {h: [40, -4], k: [40 + k * 130 + 12, -40], f: [40 + k * 130 + 6, -166]}}),
  },
  adult: { // standing feet at y = -160 (the skirt/robe covers the thighs)
    shoulderY: 292, shoulderX: 72, headY: 450, headYSit: 420, armW: 32, legW: 30, footRx: 42,
    torso: null, legsOverTorsoSeated: false, ears: false,
    arms: {armL: {e: [-150, 210], h: [-110, 150], hand: 'fist', hr: 0}, armR: {e: [150, 210], h: [110, 150], hand: 'fist', hr: 0}},
    stand: {legL: {h: [-40, -10], k: [-44, -86], f: [-46, -160]}, legR: {h: [40, -10], k: [44, -86], f: [46, -160]}},
    seated: (k) => ({legL: {h: [-50, -6], k: [-50 + k * 150, -50], f: [-60 + k * 150, -260]},
      legR: {h: [50, -6], k: [50 + k * 150, -50], f: [40 + k * 150, -260]}}),
  },
};
const ADULT_OUTFIT = {
  dress: [[-70, 310], [70, 310], [104, 220], [148, -20], [0, -32], [-148, -20], [-104, 220]],
  robe: [[-76, 316], [76, 316], [120, 220], [160, -30], [0, -44], [-160, -30], [-120, 220]],
  robeSit: [[-76, 300], [76, 300], [118, 160], [130, 0], [0, -20], [-130, 0], [-118, 160]],
};

// ---------- head ----------
function accOf(def, P) {
  if (P.acc === false || P.phones === false) return null;
  if (P.acc && typeof P.acc === 'object') return P.acc;
  if (P.phones === true) return {type: 'headphones', color: C.accent};
  const a = def.acc;
  return a && a.type !== 'none' ? {color: C.accent, ...a} : null;
}

export function drawHead(p, def, P) {
  const turn = P.turn || 0, at = Math.abs(turn), sg = Math.sign(turn) || 1;
  const hair = def.hair || {style: 'none'};
  const bulky = hair.style === 'bun';
  const acc = accOf(def, P);
  const phones = acc && acc.type === 'headphones';
  const base = EXPR[P.expr];
  if (!base) throw new Error(`Unknown expression "${P.expr}". Known: ${Object.keys(EXPR).join(', ')}`);
  const spec = P.look ? {...base, look: P.look} : base;
  const rx = 150 * (1 - 0.05 * at);
  const hx = -turn * 26;
  const bandRx = bulky ? 176 : 168 - 8 * at, bandRy = bulky ? 162 : 140, off = bulky ? hx : -turn * 34;
  const cupX = (s) => s * (bandRx + 4) + off;
  // far headphone cup, mostly hidden behind the skull
  if (phones && turn !== 0) { const x = cupX(sg) - sg * 26 * at; p.rrect(x - 22, -52, x + 22, 72, 20, acc.color, {wob: 0.3}); }
  // ears
  const ears = def.ears ?? BUILDS[def.build || 'kid'].ears;
  if (ears && !phones) for (const s of [-1, 1]) p.ellipse(s * (rx - 4) - turn * 26, 6, 20, 28, C.char, {w: 7});
  // back hair (bun)
  if (hair.style === 'bun') {
    p.ellipse(hx, 196, 98, 84, hair.color, {wob: 1.5});
    p.blob([[-166, 0], [-170, 90], [-120, 150], [0, 168], [120, 150], [170, 90], [166, 0], [150, -40], [-150, -40]].map(([a, b]) => [a + hx * 0.6, b]), hair.color);
  }
  p.shape(ellipsePts(0, 0, rx, 127, 96), def.skin || C.char, {wob: 1.0});
  if (hair.style === 'bun') {
    p.blob([[-158, 40], [-150, 104], [-90, 146], [0, 160], [90, 146], [150, 104], [158, 40], [120, 92], [40, 120], [10, 98], [-40, 124], [-120, 96]].map(([a, b]) => [a + hx * 0.5, b]), hair.color);
  }
  if (P.curlers) {
    for (const [x, y, r] of [[-110, 120, -0.6], [-40, 158, -0.2], [40, 158, 0.2], [110, 120, 0.6], [0, 250, 0]]) {
      const c = Math.cos(r), s = Math.sin(r);
      p.shape([[-26, -14], [26, -14], [26, 14], [-26, 14]].map(([u, v]) => [x + hx * 0.6 + u * c - v * s, y + u * s + v * c]), C.curler, {w: 6, wob: 0});
    }
  }
  drawFace(p, spec, {turn, blink: P.blink, face: def.face});
  // signature accessory (front parts)
  if (phones) {
    const bandPts = [];
    for (let i = 0; i <= 24; i++) { const a = Math.PI * (0.06 + 0.88 * (i / 24)); bandPts.push([Math.cos(a) * bandRx + off, 18 + Math.sin(a) * bandRy]); }
    p.tube(bandPts.reverse(), 30, acc.color, {wob: 0.4});
    for (const s of (turn === 0 ? [-1, 1] : [-sg])) {
      const x = cupX(s) + (turn !== 0 ? s * -10 * at : 0);
      p.rrect(x - s * 24 - 20, -42, x - s * 24 + 20, 62, 16, C.phonesPad, {wob: 0.3});
      p.rrect(x - 22, -52, x + 22, 72, 20, acc.color, {wob: 0.3});
    }
  } else if (acc && acc.type === 'cap') {
    // hats sit ABOVE the brows (brows reach y ~ 135 on bulging-eye expressions): never cover the eyes
    const ox = -turn * 30;
    p.blob([[-128 + ox, 118], [-104 + ox, 186], [0 + ox, 214], [104 + ox, 186], [128 + ox, 118]], acc.color, {wob: 0.5});
    const d = turn <= 0 ? -1 : 1; // brim points the way the head turns
    p.blob([[d * 30 + ox, 126], [d * 200 + ox, 118], [d * 206 + ox, 102], [d * 30 + ox, 108]], acc.color, {wob: 0.4});
    p.dot(ox, 212, 10, acc.color);
  } else if (acc && acc.type === 'beanie') {
    const ox = -turn * 26;
    p.blob([[-124 + ox, 136], [-106 + ox, 198], [0 + ox, 226], [106 + ox, 198], [124 + ox, 136]], acc.color, {wob: 0.6});
    p.rrect(-134 + ox, 122, 134 + ox, 156, 14, acc.color, {wob: 0.3});
    p.ellipse(ox, 240, 24, 20, acc.color, {wob: 0.4});
  }
  // hair strokes on top (after the band: a cowlick sticks up out of headphones)
  const cx = -turn * 20, y0 = phones ? 164 : 122;
  if (acc && !phones) return; // a hat covers the hair strokes
  if (hair.style === 'cowlick') {
    p.stroke([[cx - 8, y0], [cx - 20, y0 + 30], [cx - 42, y0 + 44]], {w: 8});
    p.stroke([[cx + 8, y0], [cx + 14, y0 + 28], [cx + 34, y0 + 38]], {w: 8});
  } else if (hair.style === 'curl') {
    const pts = [];
    for (let i = 0; i <= 18; i++) { const a = -Math.PI / 2 + i * 0.42, r = 6 + i * 1.7; pts.push([cx + Math.cos(a) * r, y0 + 34 + Math.sin(a) * r]); }
    p.stroke([[cx, y0 - 4], [cx + 2, y0 + 16], ...pts.reverse()], {w: 8});
  } else if (hair.style === 'tuft') {
    for (const [a, l] of [[-0.5, 34], [0, 42], [0.5, 34]]) p.stroke([[cx + a * 16, y0], [cx + Math.sin(a) * l, y0 + Math.cos(a) * l]], {w: 8, smooth: false});
  }
}

// ---------- body ----------
export function poseOf(def, P0 = {}) {
  const B = BUILDS[def.build || 'kid'];
  const d = def.defaults || {};
  const P = {mode: 'sit', turn: 0, lean: 0, tsx: 1, tsy: 1, expr: 'neutral', blink: false, look: null, dust: 0, ...d, ...P0};
  P.head = {dx: 0, dy: 0, rot: 0, ...(d.head || {}), ...(P0.head || {})};
  for (const k of ['armL', 'armR']) P[k] = {...B.arms[k], ...(d[k] || {}), ...(P0[k] || {})};
  const padDef = 'pad' in P0 ? P0.pad : d.pad;
  P.pad = padDef ? {x: 0, y: 92, rot: 0, s: 0.95, ...(d.pad || {}), ...padDef} : null;
  const legs = P.mode === 'stand' ? B.stand : B.seated(P.turn);
  for (const k of ['legL', 'legR']) P[k] = {...legs[k], ...(d[k] || {}), ...(P0[k] || {})};
  return P;
}

export function drawCharacter(pen, def, P0) {
  const B = BUILDS[def.build || 'kid'];
  const P = poseOf(def, P0);
  const p = pen;
  const skin = def.skin || C.char;
  // a pose may change the outfit: outfit: 'apron' | {type: 'robe', color}
  const outfit = {type: 'none', ...(def.outfit || {}), ...(typeof P.outfit === 'string' ? {type: P.outfit} : (P.outfit || {}))};
  const T = (pt) => rot2([pt[0] * P.tsx, pt[1] * P.tsy], P.lean);
  const turnC = 1 - 0.22 * Math.abs(P.turn);
  const shoulder = (s) => T([s * B.shoulderX * turnC + P.turn * 10, B.shoulderY]);
  const far = P.turn < 0 ? 1 : -1;
  const arm = (s) => (s < 0 ? P.armL : P.armR);
  const sleeve = outfit.sleeves || (outfit.type === 'robe' ? outfit.color : skin);
  const drawArm = (s) => { const a = arm(s); if (!a.hide) limb(p, shoulder(s), T(a.e), T(a.h), B.armW, sleeve); };
  const drawHandOf = (s) => {
    const a = arm(s); if (a.hide) return;
    const [hx, hy] = T(a.h);
    const rot = (a.hr || 0) + P.lean;
    if (a.prop && a.propBehind) drawProp(p, a.prop, hx, hy, (a.pr || 0) + P.lean, s > 0);
    drawHand(p, a.hand || 'fist', {x: hx, y: hy, rot, s: a.hs || (def.build === 'adult' ? 1.05 : 1), flip: a.flip ?? (s > 0), color: skin});
    if (a.prop && !a.propBehind) drawProp(p, a.prop, hx, hy, (a.pr || 0) + P.lean, s > 0);
  };
  const drawLeg = (k) => {
    const L = P[k]; if (L.hide) return;
    limb(p, L.h, L.k, L.f, B.legW, skin);
    if (P.feet === 'slippers') p.blob([[L.f[0] - 36, L.f[1] - 26], [L.f[0] + 40, L.f[1] - 22], [L.f[0] + 44, L.f[1] + 4], [L.f[0] - 26, L.f[1] + 10]], C.slipper, {w: 7});
    else {
      const dir = Math.sign(L.f[0] - L.k[0] || P.turn || 1);
      p.ellipse(L.f[0] + dir * 10, L.f[1] - 8, B.footRx, 20, def.shoes || C.shoe, {w: 7});
    }
  };
  const drawTorso = () => {
    if (B.torso) { // kid / small: tapered tube torso, optional shirt colour block + stripes
      const pts = smooth(B.torso, true, 10).map(T);
      const col = outfit.type === 'tee' || outfit.type === 'striped' ? outfit.color : skin;
      p.shape(pts, col, {line: false});
      if (outfit.type === 'striped') {
        const ys = B.torso.map(q => q[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
        const raw = smooth(B.torso, true, 10);
        for (let y = y0 + 34; y < y1 - 20; y += 58) {
          const b = band(raw, y, y + 26);
          if (b.length > 2) p.shape(b.map(T), outfit.stripe || C.char, {line: false, wob: 0});
        }
      }
      p.line(pts, {w: 8});
    } else { // adult: dress / apron / robe
      const sit = P.mode === 'sit';
      const type = outfit.type === 'none' ? 'dress' : outfit.type;
      const shape = sit ? ADULT_OUTFIT.robeSit : (type === 'robe' ? ADULT_OUTFIT.robe : ADULT_OUTFIT.dress);
      p.shape(smooth(shape, true, 10).map(T), outfit.color || C.robe);
      if (type === 'robe' || sit) {
        p.stroke([[-50, 310], [8, 140], [20, -30]].map(T), {w: 7});
        p.stroke([[50, 310], [8, 140]].map(T), {w: 7});
        if (!sit) p.shape(smooth([[-112, 140], [112, 140], [112, 164], [-112, 164]], true, 4).map(T), outfit.color, {w: 6});
      } else {
        p.stroke([[-40, 310], [0, 270], [40, 310]].map(T), {w: 6});
        if (type === 'apron') {
          p.shape(smooth([[-62, 240], [62, 240], [96, 20], [0, 8], [-96, 20]], true, 10).map(T), outfit.apron || '#ecebe2');
          p.stroke([[-56, 240], [-40, 308]].map(T), {w: 6}); p.stroke([[56, 240], [40, 308]].map(T), {w: 6});
        }
      }
    }
  };

  if (P.mode !== 'peek' && P.mode !== 'head') {
    const legOrder = P.turn < 0 ? ['legR', 'legL'] : ['legL', 'legR'];
    if (P.turn !== 0) drawArm(far);
    if (P.mode === 'stand') { drawLeg(legOrder[0]); drawLeg(legOrder[1]); drawTorso(); }
    else if (B.legsOverTorsoSeated) { drawTorso(); drawLeg(legOrder[0]); drawLeg(legOrder[1]); }
    else { drawLeg(legOrder[0]); drawLeg(legOrder[1]); drawTorso(); }
    if (P.dust > 0) { // stomp: dust puffs + impact ticks at the lower foot
      const f = P.legL.f[1] < P.legR.f[1] ? P.legL.f : P.legR.f;
      for (const s of [-1, 1]) {
        p.blob([[f[0] + s * 60, f[1] - 10], [f[0] + s * 110, f[1] + 20], [f[0] + s * 150, f[1] - 4], [f[0] + s * 110, f[1] - 30]], '#d9d4c4', {w: 6});
        p.stroke([[f[0] + s * 70, f[1] + 40], [f[0] + s * 120, f[1] + 90]], {w: 6, smooth: false});
      }
    }
    if (P.pad) { const [px, py] = T([P.pad.x, P.pad.y]); drawPad(p, {x: px, y: py, rot: (P.pad.rot || 0) + P.lean, s: P.pad.s || 0.95}); }
    if (P.turn === 0) drawArm(far);
    drawArm(-far);
    if (!P.handsFront) { drawHandOf(far); drawHandOf(-far); }
  }
  // head in its own transformed group
  const hg = new THREE.Group();
  const hc = (P.mode === 'peek' || P.mode === 'head') ? [P.head.dx, P.head.dy]
    : T([P.head.dx, (P.mode === 'sit' ? B.headYSit : B.headY) + P.head.dy]);
  hg.position.set(hc[0], hc[1], 0);
  hg.rotation.z = (P.head.rot || 0) + P.lean * 0.6;
  hg.scale.set(P.head.s || 1, (P.head.s || 1) * (P.head.sy || 1), 1);
  pen.g.add(hg);
  drawHead(pen.child(hg), def, P);
  if (P.handsFront && P.mode !== 'peek' && P.mode !== 'head') { drawHandOf(far); drawHandOf(-far); }
}

// 4-drawing walk cycle (contact / passing / contact / passing). Returns leg overrides + body bob + arm swing.
export function walkPose(build, phase, dir = 1, stride = 60) {
  const B = BUILDS[build] || BUILDS.adult;
  const ph = ((phase % 4) + 4) % 4;
  const bob = ph % 2 ? 14 : 0;
  const a = ph === 0 ? 1 : ph === 2 ? -1 : 0;
  const L = B.stand.legL, R = B.stand.legR;
  const lift = Math.abs(L.f[1]) * 0.25;
  return {
    bob, armSwing: a * 40 * dir,
    legL: {h: L.h, k: [L.k[0] + a * stride * 0.6 * dir, L.k[1] + (ph === 3 ? lift * 0.75 : 0)], f: [L.f[0] + a * stride * dir, L.f[1] + (ph === 3 ? lift : 0)]},
    legR: {h: R.h, k: [R.k[0] - a * stride * 0.6 * dir, R.k[1] + (ph === 1 ? lift * 0.75 : 0)], f: [R.f[0] - a * stride * dir, R.f[1] + (ph === 1 ? lift : 0)]},
  };
}
export {INK};
