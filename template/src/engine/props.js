// Hand props. drawProp(pen, name, x, y, rot, flip). The prop rides on the hand that holds it.
// Add your own here: a prop is just a function that draws flat shapes in hand-local units (+y = up the hand).
import {xf, tubePts, smooth, ellipsePts, rrectPts} from './draw.js';
import {drawPad} from './hands.js';
import {C} from './palette.js';

export const PROPS = {
  ladle(p, T) {
    p.shape(T(tubePts([[0, 0], [0, 120]], 14)), C.pot, {w: 6});
    p.shape(T(ellipsePts(0, 140, 30, 22, 32)), C.pot, {w: 6});
  },
  broom(p, T) {
    p.shape(T(tubePts([[0, -260], [0, 420]], 18)), C.broomHandle, {w: 7});
    p.shape(T([[-46, -250], [46, -250], [70, -360], [-70, -360]]), C.broomStraw, {w: 7, wob: 0.8});
    for (const u of [-30, 0, 30]) p.stroke(T([[u, -256], [u * 1.4, -354]]), {w: 4, smooth: false});
  },
  slipper(p, T) {
    p.shape(T(smooth([[-22, -10], [24, -6], [36, 110], [6, 150], [-30, 130], [-36, 40]], true, 8)), C.slipperSole, {w: 7});
    p.shape(T(smooth([[-40, 60], [40, 60], [36, 132], [0, 156], [-38, 132]], true, 8)), C.slipper, {w: 7});
    p.shape(T(ellipsePts(0, 124, 22, 18, 24)), '#f1d6da', {w: 6});
  },
  pot(p, T) {
    p.shape(T([[-110, 60], [110, 60], [96, -60], [-96, -60]]), C.pot, {w: 8, wob: 0.6});
    p.shape(T(smooth([[-122, 52], [122, 52], [122, 74], [-122, 74]], true, 4)), C.potDark, {w: 7});
    for (const u of [-60, 0, 60]) p.stroke(T([[u, 92], [u - 14, 130], [u + 6, 168], [u - 8, 200]]), {w: 5});
  },
  phone(p, T) { // a phone held upright; screen faces the viewer
    p.shape(T(rrectPts(-34, -10, 34, 120, 12)), '#2b2c30', {w: 6});
    p.shape(T(rrectPts(-26, 0, 26, 108, 6)), '#f4f7f6', {w: 4, tag: 'screen'});
  },
  gamebox(p, T) { // a plain game case (no logo, no real cover art)
    p.shape(T(rrectPts(-60, -6, 60, 150, 8)), '#3e5a7a', {w: 7});
    p.shape(T(rrectPts(-48, 8, 48, 136, 4)), '#e9e2c8', {w: 4});
  },
  cup(p, T) {
    p.shape(T([[-30, 0], [30, 0], [36, 80], [-36, 80]]), '#d9d2c2', {w: 6});
    p.stroke(T([[36, 64], [58, 56], [56, 24], [34, 20]]), {w: 6});
  },
};

export function drawProp(p, prop, x, y, rot = 0, flip = false) {
  if (prop === 'pad') return drawPad(p, {x, y, rot, s: 0.95});
  const fn = PROPS[prop];
  if (!fn) throw new Error(`Unknown prop "${prop}". Known: pad, ${Object.keys(PROPS).join(', ')}`);
  fn(p, (pts) => xf(pts, {x, y, rot, flip}));
}
