// The engine: plays a project (characters + set + camera views + screens + shot list) one frame at a time.
// Static camera setups are projected once; characters are redrawn every frame (immediate mode).
// Nothing in here is specific to one joke. A new short = a new project/ folder.
import * as THREE from 'three';
import {Pen, applyLight, litColor, rng, xf, setResolution, setLights, RES} from './draw.js';
import {C, setPalette} from './palette.js';
import {buildSetup, skyColor} from './set3d.js';
import {buildScreen, setScreen} from './screen.js';
import {buildCard} from './cards.js';
import {drawCharacter, BUILDS, walkPose} from './character.js';
import {drawHand, drawPad} from './hands.js';
import {drawProp} from './props.js';
import {resolve, merge, track, idle, q, flip2} from './anim.js';
import {buildTimeline} from './timeline.js';

const easeOutQuad = (x) => 1 - (1 - x) * (1 - x);
const smoothstep = (x) => x * x * (3 - 2 * x);

export class Engine {
  constructor(canvas, project) {
    const [W, H] = project.size || [1080, 1920];
    setResolution(W, H);
    if (project.palette) setPalette(project.palette);
    if (project.lights) setLights(project.lights);
    this.W = W; this.H = H; this.project = project;
    THREE.ColorManagement.enabled = false; // hex in = hex out
    const r = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true});
    r.setPixelRatio(1); r.setSize(W, H, false);
    r.outputColorSpace = THREE.LinearSRGBColorSpace; r.toneMapping = THREE.NoToneMapping;
    this.r = r;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(C.wall);
    this.cam = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 5000);
    this.T = buildTimeline(project.shots, project.fps || 30);
    this.chars = project.characters;
    this.hero = project.hero || Object.keys(this.chars)[0];
    this.screen = buildScreen(project.screens || {});
    const set = typeof project.set === 'function' ? project.set() : project.set;
    this.set = set;
    this.anchors = set.anchors || {};
    this.setups = {};
    let ox = 0;
    for (const [k, v] of Object.entries(project.views)) {
      const s = buildSetup(this.scene, k, v, set, this.screen.rt.texture);
      s.root.position.x = ox; s.ox = ox; ox += 4000;
      this.setups[k] = s;
    }
    for (const [k, cfg] of Object.entries(project.cards || {})) {
      const s = buildCard(this.scene, k, cfg);
      s.root.position.x = ox; s.ox = ox; ox += 4000;
      this.setups[k] = s;
    }
    for (const s of Object.values(this.setups)) { // a dynamic (per-frame) pen on top of every static layer
      s.dyn = {};
      for (const [k, pen] of Object.entries(s.L)) {
        const g = new THREE.Group(); g.position.z = 30; g.userData.noLight = true; pen.g.add(g);
        s.dyn[k] = new Pen(g, {zc: {z: 0}});
      }
    }
  }

  lightFn(mode, tag) { return (c, t) => litColor(c, mode, t || tag || 'char'); }
  pt(at) {
    if (typeof at === 'string') { const p = this.anchors[at]; if (!p) throw new Error(`unknown anchor "${at}". Known: ${Object.keys(this.anchors).join(', ')}`); return p; }
    return at;
  }
  // a pose reference: 'name' | {fields} | ['name', {overrides}]
  pose(def, v) {
    if (v == null) return {};
    if (typeof v === 'string') { const p = def.poses && def.poses[v]; if (!p) throw new Error(`pose "${v}" not found for character`); return p; }
    if (Array.isArray(v)) return merge(this.pose(def, v[0]), v[1]);
    return v;
  }

  actorState(a, t, shot) {
    const def = this.chars[a.who];
    if (!def) throw new Error(`shot ${shot.id}: unknown character "${a.who}"`);
    let P;
    if (a.keys) P = track(a.keys.map(([kt, v, e]) => [kt, this.pose(def, v), e]), t);
    else if (a.alt) P = this.pose(def, a.alt.poses[Math.floor(q(t, a.alt.fps || 12) * (a.alt.fps || 12)) % a.alt.poses.length]);
    else P = this.pose(def, resolve(a.P ?? a.pose, t));
    let at = a.at != null ? this.pt(resolve(a.at, t)) : null;
    let ground = a.ground;
    if (a.walk) { // walk along floor points with the 4-drawing cycle, stepped
      const w = a.walk, rate = w.rate || 8;
      const u = Math.min(1, Math.max(0, (q(t, rate) - w.t0) / (w.t1 - w.t0)));
      const path = w.path.map((p) => this.pt(p));
      const seg = u * (path.length - 1), i = Math.min(path.length - 2, Math.floor(seg)), f = seg - i;
      at = path[i].map((v, k) => v + (path[i + 1][k] - v) * f);
      if (u < 1) {
        const wp = walkPose(def.build, Math.floor(q(t, rate) * rate), w.dir || 1, w.stride || 60);
        P = merge(P, {legL: wp.legL, legR: wp.legR, dy: (P.dy || 0) + wp.bob});
        if (P.armR && P.armR.h) P = merge(P, {armR: {h: [P.armR.h[0] + wp.armSwing * 0.5, P.armR.h[1]]}});
      }
      ground = true;
    }
    if (a.with) P = merge(P, resolve(a.with, t));
    if (a.mash) P = merge(P, {pad: {rot: ((P.pad && P.pad.rot) || 0) + flip2(t, 12) * 0.07}});
    if (a.idle !== false) P = idle(P, t, a.who + shot.id, a.idle || {});
    if (at && ground) {
      const B = BUILDS[def.build || 'kid'];
      at = [at[0], at[1] + -B.stand.legL.f[1] * (a.unit ?? def.unit ?? 0.17), at[2]];
    }
    return {def, P, at};
  }

  drawActor(s, a, t, shot) {
    if (a.from != null && t < a.from) return;
    if (a.until != null && t >= a.until) return;
    const mode = shot.light;
    const layerName = resolve(a.layer, t) || 'front';
    const layer = s.dyn[layerName];
    if (!layer) throw new Error(`shot ${shot.id}: unknown layer "${layerName}"`);
    const loose = a.who === 'hand' || a.who === 'prop';   // a floating hand or a loose prop (a controller changing hands)
    let def = null, P = {}, at = a.at != null ? this.pt(resolve(a.at, t)) : null;
    if (!loose) ({def, P, at} = this.actorState(a, t, shot));
    let x, y, k;
    const unit = a.unit ?? (def && def.unit) ?? 0.17;
    if (a.scr) [x, y, k] = a.scr;
    else { if (!s.V) throw new Error(`shot ${shot.id}: actors on a card need scr: [x, y, scale]`); const pl = s.V.place(at); x = pl.x; y = pl.y; k = pl.k * unit; }
    const g = new THREE.Group();
    g.position.set(x + (P.dx || 0) * k, y + (P.dy || 0) * k, 0);
    g.scale.set(k * (P.sx || 1) * (a.flipX ? -1 : 1), k * (P.sy || 1), 1);
    g.rotation.z = P.rot || 0;
    layer.g.add(g);
    const pen = new Pen(g, {zc: layer.zc, light: this.lightFn(mode, a.tag)});
    if (a.who === 'hand') {
      const hero = this.chars[a.owner || this.hero];
      drawHand(pen, a.kind || 'open', {rot: resolve(a.rot, t) || 0, flip: a.flip, s: a.s || 1, color: (hero && hero.skin) || C.char});
    } else if (a.who === 'prop') {
      const g2 = new THREE.Group(); g2.scale.set(a.s || 1, a.s || 1, 1); g.add(g2);
      drawProp(pen.child(g2), a.prop || 'pad', 0, 0, resolve(a.rot, t) || 0, !!a.flip);
    } else drawCharacter(pen, def, P);
  }

  // POV overlay: the hero's knees, hands and controller seen from his own eyes (+ optional grabbing arm)
  drawPov(s, o, t, mode) {
    const hero = this.chars[this.hero] || {};
    const skin = hero.skin || C.char;
    const pen = new Pen(s.dyn.overlay.g, {zc: s.dyn.overlay.zc, light: this.lightFn(mode, 'char')});
    const lean = o.lean || 0, b = o.bounce || 0;
    const sc = 1 + 0.14 * lean, oy = 40 * lean + b - (o.drop ? 80 : 0);
    if (o.knees !== false) for (const sd of [-1, 1]) pen.ellipse(sd * 330, -960 + b * 0.5, 210, 170, skin);
    const jit = o.mash ? flip2(t, 12) * 8 : 0;
    const padY = -560 + oy;
    const snatch = o.snatch || 0;
    const holding = !o.empty && (snatch === 0 || snatch === 1);
    if (holding) {
      drawPad(pen, {x: 0, y: padY + jit, s: 3.0 * sc, rot: o.drop ? -0.1 : 0});
      for (const sd of [-1, 1]) {
        const hx = sd * 285 * sc, hy = padY + 10 + (sd > 0 ? jit : -jit);
        pen.tube([[sd * 600, -1060], [sd * 430, -820], [hx + sd * 40, hy - 60]], 84, skin);
        drawHand(pen, 'grip', {x: hx, y: hy, s: 2.7 * sc, rot: sd * -0.75, flip: sd > 0, color: skin});
      }
      if (o.press) drawHand(pen, 'point', {x: 200, y: padY + 120, s: 2.4, rot: -2.4, flip: false, color: skin});
    } else {
      const tr = o.tremble ? flip2(t, 12) * 8 : 0;
      for (const sd of [-1, 1]) {
        pen.tube([[sd * 600, -1060], [sd * 430, -820], [sd * 300, -600 + tr]], 84, skin);
        drawHand(pen, 'open', {x: sd * 290, y: -540 + tr, s: 2.8, rot: sd * -0.35, flip: sd > 0, color: skin});
      }
    }
    if (o.poke > 0 && holding) { // someone else's arm reaches in and presses a button on the hero's controller
      const gr = {sleeve: C.robe, cuff: '#cdbfd2', from: 'right', width: 160, handScale: 2.6, ...(o.grabber || {})};
      const mp = new Pen(s.dyn.top.g, {zc: s.dyn.top.zc, light: this.lightFn(mode, 'char')});
      const sd = gr.from === 'left' ? -1 : 1, u = Math.min(1, o.poke);
      const tip = [sd * 40, padY + 40 + jit];                       // a face button
      const start = [sd * 760, padY + 700];
      const wrist = [start[0] + (tip[0] + sd * 150 - start[0]) * u, start[1] + (tip[1] + 130 - start[1]) * u];
      const elbow = [(start[0] + wrist[0]) / 2 + sd * 60, (start[1] + wrist[1]) / 2 + 80];
      mp.tube([[sd * 820, start[1] + 300], elbow, wrist], gr.width, gr.sleeve);
      const dir = Math.atan2(tip[1] - wrist[1], tip[0] - wrist[0]);
      mp.shape(xf([[-30, -gr.width * 0.54], [30, -gr.width * 0.54], [30, gr.width * 0.54], [-30, gr.width * 0.54]], {x: wrist[0], y: wrist[1], rot: dir}), gr.cuff, {w: 7});
      drawHand(mp, 'point', {x: wrist[0] + Math.cos(dir) * 40, y: wrist[1] + Math.sin(dir) * 40, s: gr.handScale, rot: dir + (sd > 0 ? Math.PI : 0), flip: sd > 0, color: gr.skin || C.char});
    }
    if (snatch === 1 || snatch === 2) { // someone else's sleeve + 4-finger hand clamps the controller, then pulls it away
      const gr = {sleeve: C.robe, cuff: '#cdbfd2', from: 'right', ...(o.grabber || {})};
      const mp = new Pen(s.dyn.top.g, {zc: s.dyn.top.zc, light: this.lightFn(mode, 'char')});
      const grab = snatch === 1, sd = gr.from === 'left' ? -1 : 1;
      const wrist = grab ? [sd * 150, padY + 150] : [sd * 300, 260];
      const elbow = grab ? [sd * 430, 420] : [sd * 520, 700];
      const w = gr.width || 260;
      mp.tube([[sd * 760, 1150], elbow, wrist], w, gr.sleeve);
      mp.stroke([[elbow[0] + sd * 60, elbow[1] + 160], [elbow[0] + sd * 10, elbow[1] + 40], [elbow[0] - sd * 10, elbow[1] - 30]], {w: 6});
      const dir = Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]);
      const cx = wrist[0] - Math.cos(dir) * 30, cy = wrist[1] - Math.sin(dir) * 30;
      mp.shape(xf([[-40, -w * 0.54], [40, -w * 0.54], [40, w * 0.54], [-40, w * 0.54]], {x: cx, y: cy, rot: dir}), gr.cuff, {w: 7});
      if (!grab) drawPad(mp, {x: wrist[0] - sd * 40, y: wrist[1] - 200, s: 2.7, rot: sd * 0.55});
      const hx = wrist[0] + Math.cos(dir) * 70, hy = wrist[1] + Math.sin(dir) * 70;
      drawHand(mp, grab ? 'claw' : 'grip', {x: hx, y: hy, s: gr.handScale || 3.5, rot: dir - Math.PI / 2, flip: sd > 0, color: gr.skin || C.char});
    }
  }

  frame(f) {
    const shot = this.T.shotAt(f);
    const t = (f - shot.f0) / this.T.fps, d = (shot.f1 - shot.f0) / this.T.fps;
    const s = this.setups[shot.setup];
    if (!s) throw new Error(`shot ${shot.id}: unknown setup "${shot.setup}". Views: ${Object.keys(this.setups).join(', ')}`);
    for (const x of Object.values(this.setups)) x.root.visible = x === s;
    for (const pen of Object.values(s.dyn)) pen.clear();
    const light = shot.light || 'day';
    if (s.lit !== light) {
      applyLight(s.root, light);
      if (s.sky) s.sky.material.color.set(skyColor(light));
      if (s.clockTexts) for (const [k, g] of Object.entries(s.clockTexts)) g.visible = k === light;
      s.lit = light;
    }
    if (s.flames) { const v = Math.floor(t * 8) % 2; s.flames.forEach((g, i) => (g.visible = i === v)); }
    if (s.drawDoor) s.drawDoor(new Pen(s.dyn.door.g, {zc: s.dyn.door.zc, light: this.lightFn(light, 'bg')}), resolve(shot.door ?? 0, t));
    const actors = resolve(shot.actors, t) || [];
    for (const a of actors) this.drawActor(s, a, t, shot);
    if (shot.pov) this.drawPov(s, resolve(shot.pov, t) || {}, t, light);
    // The screen is visible in many shots. A shot without `screen` inherits the state the previous screen shot
    // ENDED on, so stills/keys (rendered out of order) show the same thing as the continuous render.
    let scr = resolve(shot.screen, t), st = t;
    if (!scr) {
      const i = this.T.shots.indexOf(shot);
      for (let j = i - 1; j >= 0 && !scr; j--) { const p = this.T.shots[j]; if (p.screen) { st = p.d; scr = resolve(p.screen, p.d); } }
      scr = scr || {state: 'title'};
    }
    if (scr) {
      setScreen(this.screen, {t: st, ...scr});
      this.r.setRenderTarget(this.screen.rt); this.r.render(this.screen.scene, this.screen.cam); this.r.setRenderTarget(null);
    }
    // camera framing + moves (measured: pull-out -12% easeOutQuad, push-in +11.8% soft-linear, shake 1.8% RMS)
    const c = resolve(shot.cam, t) || {};
    let cx = c.x || 0, cy = c.y || 0;
    if (c.at && s.V) { const pl = s.V.place(this.pt(c.at)); cx += pl.x; cy += pl.y; }
    cy += c.dy || 0;
    const z0 = c.zoom || 1, u = Math.min(1, t / Math.max(0.001, d));
    let zoom = z0, ox = 0, oy = 0;
    if (shot.move === 'pull') zoom = z0 * (1 + 0.136 * (1 - easeOutQuad(u)));
    if (shot.move === 'push') zoom = z0 * (1 + 0.118 * (0.5 * u + 0.5 * smoothstep(u)));
    const shakeAmp = (amp) => { const rr = rng(f * 2654435761 + 7); ox += (rr() * 2 - 1) * amp * this.W / zoom; oy += (rr() * 2 - 1) * amp * this.W / zoom; };
    if (shot.move === 'shake') shakeAmp(0.031);
    for (const [t0, dur, amp] of shot.shake || []) if (t >= t0 && t < t0 + dur) shakeAmp(amp * 2);
    this.cam.zoom = zoom;
    this.cam.position.set(s.ox + cx + ox, cy + oy, 2000);
    this.cam.updateProjectionMatrix();
    this.r.render(this.scene, this.cam);
    return shot;
  }
}
