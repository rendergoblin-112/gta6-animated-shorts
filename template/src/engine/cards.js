// Flat (non-3D) setups: the rage card and inserts. A shot uses one with setup: '<card id>'.
// project.cards = {fire: {type: 'fire'}, clock: {type: 'clock', text: '3:00', sub: 'AM'}, ...}
//   fire:  the flat flame card behind the rage close-up (the one saturation spike allowed, at the rage peak)
//   clock: a close insert of a digital clock on the cabinet, with the bottom of the dark TV above (time-skip insert)
//   solid: a plain colour card ({color}) for a quick insert or a gag background
import * as THREE from 'three';
import {Pen} from './draw.js';
import {C} from './palette.js';
import {LAYER_Z} from './set3d.js';

function flatSetup(scene, name) {
  const root = new THREE.Group(); root.name = name; scene.add(root);
  const L = {};
  for (const [k, z] of Object.entries(LAYER_Z)) { const g = new THREE.Group(); g.position.z = z; root.add(g); L[k] = new Pen(g, {zc: {z: 0}}); }
  return {name, root, L, V: null};
}

const BUILDERS = {
  fire(s, cfg) {
    const bg = s.L.outside;
    bg.rect(-800, -1200, 800, 1200, cfg.c1 || C.fire1, {line: false}).userData.tag = 'fixed';
    s.flames = [];
    for (let v = 0; v < 2; v++) { // two flame drawings alternating at 8 fps
      const fp = bg.sub('fl' + v);
      const tongues = (y0, h, col, seed, n = 8) => {
        const pts = [[-800, -1200]];
        for (let i = 0; i <= n * 2; i++) {
          const x = -800 + (1600 * i) / (n * 2), up = i % 2 === 1;
          pts.push([x + (up ? (v ? 24 : -24) : 0), y0 + (up ? h * (1 + 0.35 * Math.sin(i * 12.9 + seed * 3.1 + v * 2.2)) : 0)]);
        }
        pts.push([800, -1200]);
        const m = fp.shape(pts, col, {wob: 0}); if (m) m.userData.tag = 'fixed';
      };
      tongues(-420, 520, cfg.c2 || C.fire2, 1); tongues(-760, 380, cfg.c3 || C.fire3, 2);
      for (const sd of [-1, 1]) {
        const pts = [[sd * 800, -1200], [sd * 800, 1200]];
        for (let i = 0; i < 10; i++) pts.push([sd * (400 + ((i + v) % 2) * 170), 1100 - i * 230]);
        pts.push([sd * 450, -1200]);
        const m = fp.shape(pts, cfg.c2 || C.fire2, {wob: 0}); if (m) m.userData.tag = 'fixed';
      }
      s.flames.push(fp.g);
    }
  },
  clock(s, cfg) {
    const p = s.L.room;
    p.rect(-800, -1200, 800, 1200, C.cabinet, {line: false});
    p.rect(-800, 520, 800, 1200, C.wall, {line: false});
    p.rect(-800, 500, 800, 540, C.woodDark);
    p.rrect(-700, 640, 700, 1300, 14, C.tvBezel);
    const glow = p.rect(-660, 680, 660, 1300, cfg.glow || '#26333f', {w: 6}); glow.userData.tag = 'screen';
    p.rrect(-420, -150, 420, 230, 30, '#262524');
    p.text(cfg.text || '3:00', -40, 40, 250, C.led, {font: 'Patrick Hand'});
    if (cfg.sub) p.text(cfg.sub, 300, -40, 80, C.led, {font: 'Patrick Hand'});
    p.stroke([[-760, -420], [760, -420]], {w: 7, smooth: false});
    p.ellipse(0, -620, 26, 26, C.woodDark, {w: 7});
  },
  solid(s, cfg) {
    s.L.outside.rect(-800, -1200, 800, 1200, cfg.color || C.wall, {line: false}).userData.tag = cfg.fixed ? 'fixed' : undefined;
  },
};

export function buildCard(scene, name, cfg) {
  const s = flatSetup(scene, name);
  const b = BUILDERS[cfg.type];
  if (!b) throw new Error(`card "${name}": unknown type "${cfg.type}" (fire | clock | solid)`);
  b(s, cfg);
  return s;
}
