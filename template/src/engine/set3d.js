// Sets are described in 3D (cm) and projected through perspective cameras, then drawn as flat 2D fills
// with 8 px ink (the same pen as the characters). That gives real 3/4, low and high angles without any
// lighting model. A set is DATA: a list of items (see src/sets/livingRoom.js).
// World: x right, y up, z from the front wall (z = 0) to the back wall.
import * as THREE from 'three';
import {Pen, ellipsePts} from './draw.js';
import {C} from './palette.js';
import {RES} from './draw.js';

// draw layers, back to front. Characters are put on a layer per shot (e.g. 'behind' the couch or 'front').
export const LAYER_Z = {outside: 0, hall: 50, room: 100, door: 150, behind: 200, mid: 300, front: 400, fg: 500, top: 600, overlay: 700};

export class View {
  constructor({pos, target, fov = 55, roll = 0}) {
    const W = RES[0], H = RES[1];
    const cam = new THREE.PerspectiveCamera(fov, W / H, 1, 20000);
    cam.position.set(...pos);
    cam.up.set(Math.sin(roll), Math.cos(roll), 0);
    cam.lookAt(...target);
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
    this.cam = cam;
    this.pos = new THREE.Vector3(...pos);
    this.f = (H / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2));
    this.near = 5;
  }
  toCam(p) { return new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(this.cam.matrixWorldInverse); }
  projC(v) { return [(v.x / -v.z) * this.f, (v.y / -v.z) * this.f]; }
  pt(p) { const v = this.toCam(p); return v.z < -this.near ? this.projC(v) : null; }
  // clip a 3D polygon against the near plane, then project
  poly(pts3) {
    const vs = pts3.map(p => this.toCam(p));
    const out = [], n = vs.length, zN = -this.near;
    for (let i = 0; i < n; i++) {
      const a = vs[i], b = vs[(i + 1) % n];
      const ain = a.z <= zN, bin = b.z <= zN;
      if (ain) out.push(a);
      if (ain !== bin) { const t = (zN - a.z) / (b.z - a.z); out.push(a.clone().lerp(b, t)); }
    }
    return out.length >= 3 ? out.map(v => this.projC(v)) : null;
  }
  depth(p) { return -this.toCam(p).z; }
  front(center, normal) { return this.pos.clone().sub(new THREE.Vector3(...center)).dot(new THREE.Vector3(...normal)) > 0; }
  // screen position + px-per-cm at a world point (used to place 2D characters in the 3D set)
  place(p) { const v = this.toCam(p); const s = this.projC(v); return {x: s[0], y: s[1], k: this.f / -v.z}; }
}

export const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
const centroid = (pts) => pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length, a[2] + p[2] / pts.length], [0, 0, 0]);

function roundPoly(pts, r) {
  if (!r) return pts;
  const out = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const d1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const rr = Math.min(r, d1 * 0.4, d2 * 0.4);
    const a = [p1[0] + (p0[0] - p1[0]) * rr / d1, p1[1] + (p0[1] - p1[1]) * rr / d1];
    const b = [p1[0] + (p2[0] - p1[0]) * rr / d2, p1[1] + (p2[1] - p1[1]) * rr / d2];
    for (let k = 0; k <= 4; k++) { const t = k / 4; out.push([(1 - t) * (1 - t) * a[0] + 2 * t * (1 - t) * p1[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * t * (1 - t) * p1[1] + t * t * b[1]]); }
  }
  return out;
}
function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

// ---------- primitives ----------
export function quad(V, pen, pts3, color, o = {}) {
  if (o.normal && !V.front(o.center || centroid(pts3), o.normal)) return null;
  const pp = V.poly(pts3);
  if (!pp) return null;
  const holes = (o.holes || []).map(h => V.poly(h)).filter(Boolean);
  const m = pen.shape(roundPoly(pp, o.round || 0), color, {holes, w: o.w, line: o.line, wob: o.wob ?? 0.6});
  for (const h of holes) pen.line(h, {w: o.w});
  if (m && o.tag) m.userData.tag = o.tag;
  return m;
}
export function box(V, pen, [x0, y0, z0], [x1, y1, z1], color, o = {}) {
  const faces = [
    {n: [0, 1, 0], p: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], k: o.topK ?? 1.08},
    {n: [0, -1, 0], p: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], k: 0.7},
    {n: [0, 0, -1], p: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], k: o.frontK ?? 0.96},
    {n: [0, 0, 1], p: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], k: o.backK ?? 0.88},
    {n: [-1, 0, 0], p: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], k: 0.84},
    {n: [1, 0, 0], p: [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], k: 0.84},
  ].filter(f => V.front(centroid(f.p), f.n));
  faces.sort((a, b) => V.depth(centroid(b.p)) - V.depth(centroid(a.p)));
  for (const f of faces) quad(V, pen, f.p, shade(color, f.k), {round: o.round, w: o.w});
}
export function cylinder(V, pen, [cx, cz], r0, r1, y0, y1, color, o = {}) {
  const ring = (r, y) => ellipsePts(0, 0, r, r, 20).map(([a, b]) => V.pt([cx + a, y, cz + b])).filter(Boolean);
  const pts = [...ring(r0, y0), ...ring(r1, y1)];
  if (pts.length < 6) return;
  pen.shape(hull(pts), color, {wob: 0.6});
  if (V.pos.y > y1) { const top = ring(r1, y1); if (top.length > 8) pen.shape(top, shade(color, o.topK ?? 0.75), {wob: 0.4}); }
}
// textured quad (a TV/monitor/phone screen showing the screen render target)
export function screenMesh(V, [p00, p10, p11, p01], texture) {
  const N = 10, pos = [], uv = [], idx = [];
  const L = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
    const u = i / N, v = j / N;
    const s = V.pt(L(L(p00, p10, u), L(p01, p11, u), v));
    if (!s) return null; // off-camera: skip (projecting points behind the camera makes garbage wedges)
    pos.push(s[0], s[1], 0); uv.push(u, v);
  }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide}));
  m.userData.tag = 'screen';
  return m;
}

// ---------- build one camera setup of a set ----------
// set = {items: [...], door?: {x0, x1, h, z, color}, anchors: {...}}; view = {pos, target, fov, fg: [item names drawn on the fg layer]}
export function buildSetup(parent, name, viewDef, set, screenTex) {
  const V = new View(viewDef);
  const root = new THREE.Group(); root.name = 'setup_' + name; parent.add(root);
  const L = {};
  for (const [k, z] of Object.entries(LAYER_Z)) {
    const g = new THREE.Group(); g.name = k; g.position.z = z; root.add(g);
    L[k] = new Pen(g, {zc: {z: 0}});
  }
  const fgSet = new Set(viewDef.fg || []);
  const out = {name, V, root, L, clockTexts: {}, sky: null};
  const layerOf = (it, dflt = 'room') => (it.name && fgSet.has(it.name) ? L.fg : L[it.layer || dflt]);
  const col = (c) => (c && c[0] !== '#' && C[c] ? C[c] : c); // colours may be palette keys

  const draw = (it) => {
    const pen = layerOf(it);
    switch (it.t) {
      case 'quad': { const m = quad(V, pen, it.pts, col(it.color), it); if (it.sky && m) { m.userData.tag = 'fixed'; out.sky = m; } break; }
      case 'box': box(V, pen, it.a, it.b, col(it.color), it); break;
      case 'cyl': cylinder(V, pen, it.c, it.r0, it.r1, it.y0, it.y1, col(it.color), it); break;
      case 'floorEllipse': {
        const pp = V.poly(ellipsePts(0, 0, it.rx, it.rz, 40).map(([a, b]) => [it.cx + a, it.y || 0.3, it.cz + b]));
        if (pp) pen.shape(pp, col(it.color), {wob: 1.2});
        break;
      }
      case 'lines': for (const [a3, b3] of it.segs) { const a = V.pt(a3), b = V.pt(b3); if (a && b) pen.stroke([a, b], {w: it.w || 4, color: col(it.color), smooth: false}); } break;
      case 'tube': { const a = V.pt(it.a), b = V.pt(it.b); if (a && b) pen.tube([a, b], Math.max(6, it.w * V.place(it.a).k), col(it.color)); break; }
      case 'plant': {
        const [bx, by, bz] = it.base;
        for (const [ang, len] of it.leaves) {
          const b = V.pt(it.base), t = V.pt([bx + Math.sin(ang) * len, by + Math.cos(ang) * len, bz]);
          if (b && t) { const k = V.place(it.base).k; pen.blob([b, [(b[0] + t[0]) / 2 - 22 * k * Math.cos(ang), (b[1] + t[1]) / 2 + 14 * k], t, [(b[0] + t[0]) / 2 + 22 * k * Math.cos(ang), (b[1] + t[1]) / 2 - 10 * k]], col(it.color)); }
        }
        break;
      }
      case 'screen': { const scr = screenMesh(V, it.corners, screenTex); if (scr) { scr.position.z = 5; pen.g.add(scr); } break; }
      case 'clock': { // digits that change with the light (time of day), placed at a world point
        const cl = V.place(it.at);
        if (cl.k > 0) for (const [mode, txt] of Object.entries(it.texts)) {
          const g = pen.sub('clock_' + mode); g.text(txt, cl.x, cl.y, it.size * cl.k, col(it.color) || C.led, {res: 6});
          out.clockTexts[mode] = g.g;
        }
        break;
      }
      case 'group': { // depth-sorted group (pieces of one piece of furniture)
        const items = it.items.slice().sort((a, b) => V.depth(centroid([b.a, b.b])) - V.depth(centroid([a.a, a.b])));
        for (const s of items) draw({layer: it.layer, ...s});
        break;
      }
      default: throw new Error('unknown set item type ' + it.t);
    }
  };
  for (const it of set.items) draw(it);

  root.userData.view = V;
  const D = set.door;
  if (D) {
    // door leaf: angle 0 = closed, 1.6 = open into the room, ~2.9 = flat against the wall. Hinge at x1.
    out.drawDoor = (pen, ang) => {
      const hx = D.x1, z = D.z, wdt = D.x1 - D.x0;
      const ex = hx - Math.cos(ang) * wdt, ez = z - Math.sin(ang) * wdt;
      const pp = V.poly([[hx, 0, z], [ex, 0, ez], [ex, D.h, ez], [hx, D.h, z]]);
      if (pp) pen.shape(pp, col(D.color) || C.door, {wob: 0.5});
      const kn = V.pt([hx - Math.cos(ang) * (wdt - 12), 100, z - Math.sin(ang) * (wdt - 12)]);
      if (kn) pen.dot(kn[0], kn[1], 7, C.metal);
    };
  }
  return out;
}

export function skyColor(mode) {
  return {day: C.skyDay, afternoon: C.skyAfternoon, evening: C.skyEvening, night: C.skyNight}[mode] || C.skyDay;
}
