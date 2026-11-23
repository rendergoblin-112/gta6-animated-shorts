// The device screen (TV, monitor, phone), rendered into a render target and mapped onto the set's screen quad.
// Our own sunny coastal "game" built from flat shapes: palms, pastel buildings, a road, a coral convertible.
// ROCKSTAR-SAFE: plain hand-lettered "GTA 6" text only. No logo, no "VI", no Pricedown-style font, no real
// characters, no real place names, no game footage. See references/rockstar-safe.md.
//
// Everything written on the screen is project data (project.screens):
//   title:   {text, sub}                      sunset title with PRESS START blinking
//   menu:    {title, sub, button}             mission select
//   banners: {id: {lines: [...], stars, dim}} drawn OVER the driving world (MISSION START, PAUSED...)
//   cards:   {id: {bg, lines: [...], stars, confetti, button}}  full-screen states (THE END, LOADING...)
//   line = {text, y, size, color, stroke, rot, font}   (screen is 1024 x 576, y up)
import * as THREE from 'three';
import {Pen} from './draw.js';
import {C} from './palette.js';

export const GW = 1024, GH = 576;

function star(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return pts;
}
function palm(p, x, y, s, lean = 0.15) {
  const trunk = [[x, y], [x + 30 * s * lean * 4, y + 90 * s], [x + 50 * s * lean * 4, y + 190 * s]];
  p.tube(trunk, 16 * s, '#b07a4a', {w: 3.5});
  const top = trunk[2];
  for (const a of [-2.6, -1.9, -0.9, -0.2, 0.5, 1.2, 2.2]) {
    const len = 80 * s;
    const ex = top[0] + Math.cos(a + Math.PI / 2) * len * (Math.abs(a) > 1.5 ? 0.9 : 1);
    const ey = top[1] + Math.sin(a + Math.PI / 2) * len * 0.55 - 10 * s;
    const mx = (top[0] + ex) / 2, my = (top[1] + ey) / 2 + 18 * s;
    p.blob([top, [mx - 8 * s, my + 10 * s], [ex, ey], [mx + 8 * s, my - 6 * s]], '#36b56a', {w: 3.5});
  }
}
const writeLines = (p, lines = []) => {
  for (const l of lines) p.text(l.text, l.x ?? 512, l.y, l.size || 60, l.color || '#ffffff', {stroke: l.stroke ?? Math.max(3, Math.round((l.size || 60) / 12)), rot: l.rot || 0, font: l.font || 'Patrick Hand'});
};

export const DEFAULT_SCREENS = {
  title: {text: 'GTA 6', sub: 'PRESS START'},
  menu: {title: 'MISSION 1', sub: '"Beach Run"', button: 'START  >'},
  money: '$ 4,250',
  banners: {
    missionStart: {lines: [{text: 'MISSION 1', y: 420, size: 46}, {text: 'MISSION START', y: 350, size: 92, color: '#ffd23f', rot: -0.03}]},
    missionComplete: {lines: [{text: 'MISSION COMPLETE', y: 390, size: 84, color: '#9dff8a', rot: -0.02}], stars: 5},
  },
  cards: {},
};

export function buildScreen(cfg = {}) {
  const S = {...DEFAULT_SCREENS, ...cfg, banners: {...DEFAULT_SCREENS.banners, ...(cfg.banners || {})}, cards: {...(cfg.cards || {})}};
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');
  const cam = new THREE.OrthographicCamera(0, GW, GH, 0, -100, 1000);
  cam.position.z = 500;
  const rt = new THREE.WebGLRenderTarget(GW, GH, {samples: 4});
  const root = new THREE.Group(); scene.add(root);
  const P = new Pen(root, {zc: {z: 0}, res: [GW, GH], lw: 5, wob: 0.5});
  const G = {scene, cam, rt, groups: {}, banners: {}, cards: {}};

  // title (sunset)
  const title = P.sub('title');
  title.rect(0, 250, GW, GH, '#ffbe73', {line: false});
  title.rect(0, 180, GW, 250, '#ff9a72', {line: false});
  title.ellipse(512, 250, 120, 120, '#fff0a8', {w: 5});
  title.rect(0, 0, GW, 200, '#4fc4d6', {line: false});
  for (const y of [150, 110, 60]) title.stroke([[200 + y, y], [520 + y, y]], {w: 4, color: '#9fe6ee', smooth: false});
  palm(title, 90, 0, 1.6, 0.2); palm(title, 900, 0, 1.4, -0.25); palm(title, 980, 0, 1.0, -0.15);
  title.text(S.title.text, 512, 340, 150, '#ffffff', {font: 'Permanent Marker', stroke: 9, rot: -0.04});
  const press = title.sub('press');
  press.text(S.title.sub, 512, 175, 40, '#ffffff', {stroke: 5});
  G.press = press.g; G.groups.title = title.g;

  // mission select
  const menu = P.sub('menu');
  menu.rect(0, 0, GW, GH, '#2c2f45', {line: false});
  menu.rect(0, 0, GW, 160, '#4fc4d6', {line: false});
  palm(menu, 90, 0, 1.6, 0.2); palm(menu, 930, 0, 1.4, -0.25);
  menu.text(S.menu.title, 512, 400, 90, '#ffd23f', {stroke: 7});
  if (S.menu.sub) menu.text(S.menu.sub, 512, 320, 44, '#ffffff', {stroke: 4});
  menu.rrect(372, 196, 652, 266, 16, '#ff6f61', {w: 5});
  menu.text(S.menu.button, 512, 232, 54, '#ffffff', {stroke: 4});
  G.groups.menu = menu.g;

  // driving world
  const drive = P.sub('drive');
  drive.rect(0, 300, GW, GH, '#86d4f2', {line: false});
  drive.ellipse(860, 480, 46, 46, '#fff3b0', {w: 5});
  for (const [x, y] of [[160, 470], [420, 520], [640, 455]]) drive.blob([[x - 60, y], [x - 30, y + 26], [x + 10, y + 30], [x + 50, y + 18], [x + 64, y], [x, y - 8]], '#ffffff', {w: 4});
  drive.rect(0, 296, 360, 318, '#36bcd4', {w: 4});
  const bcols = ['#f6a5c0', '#9fe3c9', '#ffe08a', '#c9b3f0', '#ffc09f', '#a5d8ff'];
  let bx = 560;
  [[70, 120], [60, 170], [90, 100], [56, 150], [80, 130], [70, 90]].forEach(([w, h], i) => {
    drive.rect(bx, 300, bx + w, 300 + h, bcols[i % bcols.length], {w: 4});
    for (let wy = 320; wy < 300 + h - 18; wy += 28) for (let wx = bx + 12; wx < bx + w - 14; wx += 22) drive.rect(wx, wy, wx + 10, wy + 14, '#ffffff', {w: 2.5});
    bx += w + 6;
  });
  drive.rect(0, 0, GW, 300, '#f3e2ad', {line: false});
  drive.shape([[552, 300], [GW, 300], [GW, 0], [860, 0]], '#8fd47a', {wob: 0});
  drive.shape([[160, 0], [860, 0], [536, 300], [488, 300]], '#686c76', {wob: 0});
  drive.stroke([[200, 0], [492, 300]], {w: 4, color: '#ffffff', smooth: false});
  drive.stroke([[820, 0], [532, 300]], {w: 4, color: '#ffffff', smooth: false});
  G.phases = [];
  for (let ph = 0; ph < 4; ph++) { // 4 stepped drawings of the road dashes + palms (8 fps)
    const g = drive.sub('phase' + ph);
    for (let k = 0; k < 6; k++) {
      const u = (k + ph / 4) / 6, d = Math.pow(1 - u, 2.2);
      const y0 = 300 - d * 300, d1 = Math.pow(1 - Math.min(1, u + 0.06), 2.2), y1 = 300 - d1 * 300;
      const w0 = 4 + d * 22, w1 = 4 + d1 * 22;
      if (y0 < 0) continue;
      g.shape([[512 - w0 / 2, y0], [512 + w0 / 2, y0], [512 + w1 / 2, y1], [512 - w1 / 2, y1]], '#ffffff', {line: false, wob: 0});
    }
    for (let k = 0; k < 3; k++) {
      const u = (k + ph / 4) / 3, d = Math.pow(1 - u, 2.0), y = 300 - d * 300, xoff = 40 + d * 520, s = 0.25 + d * 1.4;
      if (y < -40) continue;
      palm(g, 512 - xoff - 30 * s, y, s, 0.15); palm(g, 512 + xoff + 30 * s, y, s, -0.15);
    }
    G.phases.push(g.g);
  }
  const car = drive.sub('car'); // our design: coral convertible from behind, round-headed driver
  car.ellipse(400, 46, 36, 40, '#2a2a2e', {w: 5});
  car.ellipse(624, 46, 36, 40, '#2a2a2e', {w: 5});
  car.blob([[352, 60], [672, 60], [690, 120], [650, 160], [374, 160], [334, 120]], '#ff6f61', {w: 5});
  car.ellipse(512, 196, 38, 34, C.char, {w: 5});
  car.rrect(380, 150, 644, 176, 10, '#ffd0c8', {w: 5});
  car.rrect(370, 104, 420, 128, 8, '#ffe66d', {w: 4});
  car.rrect(604, 104, 654, 128, 8, '#ffe66d', {w: 4});
  car.rrect(470, 80, 554, 104, 6, '#ffffff', {w: 4});
  G.car = car.g;
  drive.ellipse(86, 86, 64, 64, '#23262b', {w: 5}); // minimap
  drive.stroke([[50, 40], [86, 86], [130, 120]], {w: 6, color: '#8a8f99'});
  drive.stroke([[40, 110], [120, 70]], {w: 6, color: '#8a8f99'});
  drive.shape([[86, 102], [98, 76], [86, 82], [74, 76]], '#ffffff', {w: 3, wob: 0});
  if (S.money) drive.text(S.money, 920, 540, 40, '#9dff8a', {stroke: 4});
  G.groups.drive = drive.g;

  // banners over the driving world
  for (const [id, b] of Object.entries(S.banners)) {
    const g = P.sub('banner_' + id);
    if (b.dim) g.rect(0, 0, GW, GH, '#000000', {line: false, opacity: 0.45});
    writeLines(g, b.lines);
    if (b.stars) for (let i = 0; i < b.stars; i++) g.shape(star(512 - (b.stars - 1) * 40 + i * 80, b.starsY ?? 300, 30), '#ffd23f', {w: 4, wob: 0});
    if (b.button) { g.rrect(372, (b.button.y ?? 150) - 36, 652, (b.button.y ?? 150) + 36, 16, b.button.color || '#ff6f61', {w: 5}); g.text(b.button.text, 512, b.button.y ?? 150, 50, '#ffffff', {stroke: 4}); }
    G.banners[id] = g.g;
  }
  // full-screen cards
  for (const [id, c] of Object.entries(S.cards)) {
    const g = P.sub('card_' + id);
    g.rect(0, 0, GW, GH, c.bg || '#1d2036', {line: false});
    if (c.confetti) {
      const cols = ['#ffd23f', '#ff6f61', '#9fe3c9', '#a5d8ff', '#f6a5c0'];
      for (let i = 0; i < 40; i++) { const x = (i * 197) % GW, y = (i * 113 + 40) % GH; g.rect(x, y, x + 14, y + 22, cols[i % cols.length], {line: false}); }
    }
    writeLines(g, c.lines);
    if (c.stars) for (let i = 0; i < c.stars; i++) g.shape(star(512 - (c.stars - 1) * 40 + i * 80, c.starsY ?? 200, 30), '#ffd23f', {w: 4, wob: 0});
    if (c.button) { g.rrect(372, (c.button.y ?? 110) - 36, 652, (c.button.y ?? 110) + 36, 16, c.button.color || '#ff6f61', {w: 5}); g.text(c.button.text, 512, c.button.y ?? 110, 50, '#ffffff', {stroke: 4}); }
    G.cards[id] = g.g;
  }

  // off + CRT collapse
  const off = P.sub('off');
  off.rect(0, 0, GW, GH, '#0a0a0a', {line: false});
  G.groups.off = off.g;
  const crt = P.sub('crt');
  G.crtLine = crt.rect(-0.5, -0.5, 0.5, 0.5, '#ffffff', {line: false});
  G.groups.crt = crt.g;
  G.root = root;
  return G;
}

// state: 'title' | 'menu' | 'drive' | 'off' | 'card'; banner: banner id | null; card: card id
// offAt: local time the screen switches off (CRT collapse over 0.2 s). Everything steps at 8 fps (limited animation).
export function setScreen(G, {state = 'drive', banner = null, card = null, t = 0, offAt = null, blink = false} = {}) {
  for (const g of Object.values(G.groups)) g.visible = false;
  for (const g of Object.values(G.banners)) g.visible = false;
  for (const g of Object.values(G.cards)) g.visible = false;
  let st = state;
  if (offAt != null && t >= offAt) st = 'off';
  if (st === 'title') { G.groups.title.visible = true; G.press.visible = !blink || Math.floor(t * 3) % 2 === 0; }
  if (st === 'menu') G.groups.menu.visible = true;
  if (st === 'card') {
    if (!G.cards[card]) throw new Error(`screen card "${card}" is not defined in project.screens.cards`);
    G.cards[card].visible = true;
  }
  if (st === 'drive') {
    G.groups.drive.visible = true;
    const ph = Math.floor(t * 8) % 4;
    G.phases.forEach((g, i) => (g.visible = i === ph));
    G.car.position.y = Math.floor(t * 8) % 2 ? 2 : 0;
  }
  if (banner && (st === 'drive' || st === 'card')) {
    if (!G.banners[banner]) throw new Error(`screen banner "${banner}" is not defined in project.screens.banners`);
    G.banners[banner].visible = true;
  }
  if (st === 'off') {
    G.groups.off.visible = true;
    const dt = offAt != null ? t - offAt : 99;
    if (dt < 0.2) {
      G.groups.crt.visible = true;
      const k = dt / 0.2;
      const w = k < 0.5 ? GW : GW * (1 - (k - 0.5) * 2) + 8;
      const h = k < 0.5 ? GH * (1 - k * 2) + 6 : 6;
      G.crtLine.scale.set(w, h, 1);
      G.crtLine.position.set(GW / 2, GH / 2, G.crtLine.position.z);
    }
  }
}
