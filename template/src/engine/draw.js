// Drawing primitives: flat-fill shapes + constant-pixel-width ink outlines.
// Everything is unlit MeshBasicMaterial; outlines are Line2 with linewidth in screen pixels,
// so the line weight stays the same through camera zooms (format rule: ~8 px at 1080 wide).
import * as THREE from 'three';
import {Line2} from 'three/examples/jsm/lines/Line2.js';
import {LineGeometry} from 'three/examples/jsm/lines/LineGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';

export const INK = '#100d0c'; // near-black, slightly warm (measured median ink colour)
export const LINE_W = 8;      // 8 px at 1080 px wide (0.74% of the short side)
export const RES = [1080, 1920];
export function setResolution(w, h) { RES[0] = w; RES[1] = h; }

// ---------- deterministic randomness ----------
let seedCounter = 1;
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

// ---------- line materials (shared per width + resolution) ----------
const lineMatCache = new Map();
export function lineMat(width, res = RES, color = INK) {
  const key = `${width}|${res[0]}x${res[1]}|${color}`;
  if (!lineMatCache.has(key)) {
    // DoubleSide matters: a mirrored character (scale.x = -1) otherwise loses every outline (back-face culling).
    const m = new LineMaterial({color: new THREE.Color(color).getHex(), linewidth: width, worldUnits: false, side: THREE.DoubleSide});
    m.resolution.set(res[0], res[1]);
    m.userData.fixed = true;
    lineMatCache.set(key, m);
  }
  return lineMatCache.get(key);
}

// ---------- point helpers ----------
export function ellipsePts(cx, cy, rx, ry, n = 72, a0 = 0, a1 = Math.PI * 2) {
  const pts = [];
  const full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  const cnt = full ? n : n + 1;
  for (let i = 0; i < cnt; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}

export function rrectPts(x0, y0, x1, y1, r, n = 8) {
  const pts = [];
  r = Math.min(r, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2);
  const corners = [[x1 - r, y1 - r, 0], [x0 + r, y1 - r, Math.PI / 2], [x0 + r, y0 + r, Math.PI], [x1 - r, y0 + r, Math.PI * 1.5]];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (Math.PI / 2) * (i / n);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  }
  return pts;
}

// Catmull-Rom through control points (closed or open)
export function smooth(ctrl, closed = true, per = 10) {
  const v = ctrl.map(p => new THREE.Vector3(p[0], p[1], 0));
  const c = new THREE.CatmullRomCurve3(v, closed, 'centripetal');
  const n = Math.max(8, ctrl.length * per);
  return c.getPoints(n).map(p => [p.x, p.y]).slice(0, closed ? -1 : undefined);
}

// polyline offset to a closed tube outline (limbs, handles)
export function tubePts(path, w, per = 8) {
  const pts = path.length > 2 ? smooth(path, false, per) : path;
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
    const ww = (typeof w === 'function' ? w(i / (pts.length - 1)) : w) / 2;
    L.push([p[0] - dy * ww, p[1] + dx * ww]);
    R.push([p[0] + dy * ww, p[1] - dx * ww]);
  }
  const capPts = (c, from, to, ww) => {
    const out = [];
    const a0 = Math.atan2(from[1] - c[1], from[0] - c[0]);
    for (let i = 1; i < 8; i++) {
      const a = a0 - Math.PI * (i / 8);
      out.push([c[0] + Math.cos(a) * ww, c[1] + Math.sin(a) * ww]);
    }
    return out;
  };
  const wEnd = (typeof w === 'function' ? w(1) : w) / 2, wStart = (typeof w === 'function' ? w(0) : w) / 2;
  const end = pts[pts.length - 1], start = pts[0];
  return [...L, ...capPts(end, L[L.length - 1], R[R.length - 1], wEnd), ...R.reverse(), ...capPts(start, R[R.length - 1], L[0], wStart)];
}

// gentle low-frequency wobble so lines feel hand drawn but stay held (no boil between frames)
export function wobble(pts, amp = 1.2, seed = seedCounter++) {
  if (amp <= 0) return pts;
  const r = rng(seed * 7919);
  const ph1 = r() * 6.28, ph2 = r() * 6.28, f1 = 2 + Math.floor(r() * 3), f2 = 5 + Math.floor(r() * 4);
  const n = pts.length;
  return pts.map((p, i) => {
    const t = (i / n) * Math.PI * 2;
    const k = Math.sin(t * f1 + ph1) * 0.7 + Math.sin(t * f2 + ph2) * 0.3;
    const pa = pts[(i - 1 + n) % n], pb = pts[(i + 1) % n];
    const dx = pb[0] - pa[0], dy = pb[1] - pa[1];
    const len = Math.hypot(dx, dy) || 1;
    return [p[0] - (dy / len) * k * amp, p[1] + (dx / len) * k * amp];
  });
}

export function xf(pts, {x = 0, y = 0, s = 1, sx = s, sy = s, rot = 0, flip = false} = {}) {
  const c = Math.cos(rot), si = Math.sin(rot);
  return pts.map(([a, b]) => {
    const ax = (flip ? -a : a) * sx, by = b * sy;
    return [x + ax * c - by * si, y + ax * si + by * c];
  });
}

// ---------- Pen: draws into a group with an auto-incrementing z (painter's order) ----------
export class Pen {
  constructor(group, opts = {}) {
    this.g = group;
    this.zc = opts.zc || {z: 0};
    this.res = opts.res || RES;
    this.light = opts.light || null; // colour -> lit colour (immediate-mode characters)
    this.lw = opts.lw || LINE_W;
    this.wob = opts.wob ?? 1.0;
  }
  sub(name, opts = {}) {
    const g = new THREE.Group();
    g.name = name;
    if (opts.tag) g.userData.lightTag = opts.tag;
    this.g.add(g);
    return new Pen(g, {zc: this.zc, res: this.res, lw: opts.lw || this.lw, wob: this.wob, light: this.light});
  }
  child(group) { return new Pen(group, {zc: this.zc, res: this.res, lw: this.lw, wob: this.wob, light: this.light}); }
  nz() { this.zc.z += 0.02; return this.zc.z; }
  seed() { this.zc.seed = (this.zc.seed || 0) + 1; return this.zc.seed + (this.zc.base || 0); }
  // immediate mode: throw away last frame's drawing (dispose GPU buffers) and restart counters
  clear() {
    const kill = (o) => {
      for (const c of [...o.children]) {
        kill(c);
        if (c.geometry) c.geometry.dispose();
        if (c.material && !c.material.userData.fixed) { if (c.material.map) c.material.map.dispose(); c.material.dispose(); }
        o.remove(c);
      }
    };
    kill(this.g);
    this.zc.z = 0; this.zc.seed = 0;
  }

  fill(pts, color, opts = {}) {
    const shape = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
    if (opts.holes) for (const h of opts.holes) shape.holes.push(new THREE.Path(h.map(p => new THREE.Vector2(p[0], p[1]))));
    const geo = new THREE.ShapeGeometry(shape, 1);
    const lit = this.light ? this.light(color, opts.tag) : color;
    const mat = new THREE.MeshBasicMaterial({color: new THREE.Color(lit), side: THREE.DoubleSide,
      transparent: opts.opacity != null && opts.opacity < 1, opacity: opts.opacity ?? 1});
    const m = new THREE.Mesh(geo, mat);
    m.userData.base = new THREE.Color(color);
    if (opts.tag) m.userData.tag = opts.tag;
    m.position.z = this.nz();
    this.g.add(m);
    return m;
  }
  line(pts, opts = {}) {
    const closed = opts.closed ?? true;
    const arr = [];
    const p2 = closed ? [...pts, pts[0]] : pts;
    for (const p of p2) arr.push(p[0], p[1], 0);
    const geo = new LineGeometry();
    geo.setPositions(arr);
    const l = new Line2(geo, lineMat(opts.w ?? this.lw, this.res, opts.color || INK));
    l.computeLineDistances();
    l.position.z = (opts.z ?? this.zc.z) + 0.01;
    if (opts.z == null) this.zc.z += 0.001;
    this.g.add(l);
    return l;
  }
  // filled + outlined closed shape
  shape(pts, color, opts = {}) {
    const w = opts.wob ?? this.wob;
    const p = w > 0 ? wobble(pts, w, opts.seed ?? this.seed()) : pts;
    const m = color ? this.fill(p, color, opts) : null;
    if (opts.line !== false) this.line(p, {w: opts.w, closed: true});
    return m;
  }
  stroke(pts, opts = {}) {
    const p = opts.smooth === false ? pts : (pts.length > 2 ? smooth(pts, false, 8) : pts);
    this.nz();
    return this.line(p, {closed: false, w: opts.w, color: opts.color});
  }
  ellipse(cx, cy, rx, ry, color, opts = {}) { return this.shape(ellipsePts(cx, cy, rx, ry, opts.n || 72), color, opts); }
  rrect(x0, y0, x1, y1, r, color, opts = {}) { return this.shape(rrectPts(x0, y0, x1, y1, r), color, opts); }
  rect(x0, y0, x1, y1, color, opts = {}) {
    return this.shape([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], color, {wob: 0, ...opts});
  }
  blob(ctrl, color, opts = {}) { return this.shape(smooth(ctrl, true, opts.per || 10), color, opts); }
  tube(path, w, color, opts = {}) { return this.shape(tubePts(path, w), color, opts); }
  dot(cx, cy, r, color = INK) { return this.fill(ellipsePts(cx, cy, r, r, 24), color); }

  // hand-lettered text as a canvas texture plane (text lives inside the scene: no caption boxes)
  text(str, x, y, size, color, opts = {}) {
    const font = opts.font || 'Patrick Hand';
    const scale = opts.res || 3;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const fpx = size * scale;
    ctx.font = `${opts.weight || ''} ${fpx}px "${font}"`;
    const lines = String(str).split('\n');
    const wmax = Math.max(...lines.map(l => ctx.measureText(l).width));
    const lh = fpx * (opts.lh || 1.05);
    const pad = fpx * 0.35 + (opts.stroke || 0) * scale;
    c.width = Math.ceil(wmax + pad * 2);
    c.height = Math.ceil(lh * lines.length + pad * 2);
    ctx.font = `${opts.weight || ''} ${fpx}px "${font}"`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    lines.forEach((l, i) => {
      const ty = pad + lh * (i + 0.5);
      if (opts.stroke) {
        ctx.strokeStyle = opts.strokeColor || INK;
        ctx.lineWidth = opts.stroke * scale * 2;
        ctx.strokeText(l, c.width / 2, ty);
      }
      ctx.fillStyle = color;
      ctx.fillText(l, c.width / 2, ty);
    });
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    tex.colorSpace = THREE.NoColorSpace;
    const w = c.width / scale, h = c.height / scale;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false}));
    m.userData.tag = 'screen';
    let ax = x;
    if (opts.align === 'left') ax = x + w / 2 - pad / scale;
    if (opts.align === 'right') ax = x - w / 2 + pad / scale;
    m.position.set(ax, y, this.nz());
    if (opts.rot) m.rotation.z = opts.rot;
    this.g.add(m);
    return m;
  }
}

// ---------- lighting: flat tints baked into fill colours (no lighting model, no shadows) ----------
// mode -> tag -> [mulR, mulG, mulB, addR, addG, addB]. 'bg' = sets, 'char' = characters, 'glow' = characters lit by a screen.
// Night is DIM AND WARM, not blue: the measured format never goes dark (see references/colour-and-night.md).
export const LIGHT = {
  day:       {bg: [1, 1, 1, 0, 0, 0], char: [1, 1, 1, 0, 0, 0], glow: [1, 1, 1, 0, 0, 0]},
  afternoon: {bg: [1.0, 0.975, 0.93, 0.01, 0.005, 0], char: [1.0, 0.985, 0.955, 0, 0, 0], glow: [1.0, 0.985, 0.955, 0, 0, 0]},
  evening:   {bg: [0.82, 0.78, 0.74, 0, 0, 0], char: [0.95, 0.92, 0.88, 0, 0, 0], glow: [0.95, 0.92, 0.88, 0, 0, 0]},
  night:     {bg: [0.60, 0.57, 0.58, 0, 0, 0.01], char: [0.86, 0.84, 0.84, 0, 0, 0], glow: [0.97, 0.94, 0.90, 0.01, 0, 0]},
};
export function setLights(extra = {}) { Object.assign(LIGHT, extra); }

export function litColor(color, mode, tag = 'char') {
  if (tag === 'screen' || tag === 'fixed') return color;
  const L = LIGHT[mode] || LIGHT.day;
  const k = L[tag] || L.char;
  const b = new THREE.Color(color);
  b.setRGB(Math.min(1, b.r * k[0] + k[3]), Math.min(1, b.g * k[1] + k[4]), Math.min(1, b.b * k[2] + k[5]));
  return b;
}

export function applyLight(root, mode) {
  const L = LIGHT[mode] || LIGHT.day;
  const walk = (o, tag) => {
    if (o.userData.noLight) return;
    const t = o.userData.lightTag || tag;
    if (o.isMesh && !o.isLine2 && o.userData.base) {
      const mt = o.userData.tag || t;
      if (mt === 'screen' || mt === 'fixed') o.material.color.copy(o.userData.base);
      else {
        const k = L[mt] || L.bg;
        const b = o.userData.base;
        o.material.color.setRGB(Math.min(1, b.r * k[0] + k[3]), Math.min(1, b.g * k[1] + k[4]), Math.min(1, b.b * k[2] + k[5]));
      }
    }
    for (const c of o.children) walk(c, t);
  };
  walk(root, 'bg');
}
