// The living room set (couch facing a TV), as data. Units: cm. x right, y up, z from the TV wall (0) to the
// door wall (600). Called AFTER the project palette is applied, so palette changes reach the set.
// Copy this file to make a new set (bedroom, kitchen...): items are quads, boxes, cylinders, a screen, a clock.
import {C} from '../engine/palette.js';
import {shade} from '../engine/set3d.js';

export const ROOM = {x0: -330, x1: 330, z1: 600, h: 265};
export const DOOR = {x0: 150, x1: 240, h: 205, z: 599};
// named points (hips of a seated character, standing spots...). Shots can say at: 'seatL'.
export const ANCHORS = {
  seatL: [-45, 60, 352],      // left cushion (hero)
  seatR: [50, 60, 352],       // right cushion
  couchArmR: [118, 74, 352],
  behindCouch: [40, 0, 430],  // floor point behind the couch
  doorway: [195, 0, 600],     // floor point in the door
  hallway: [195, 0, 820],
  tvFront: [0, 0, 120],       // floor point between couch and TV
  tvCenter: [0, 125, 30],
  clock: [78, 39, 56.5],
};

export function livingRoom({clock = {day: '12:30', afternoon: '4:45', evening: '9:10', night: '3:00'}} = {}) {
  const R = ROOM, D = DOOR;
  const items = [];
  const Q = (layer, pts, color, o = {}) => items.push({t: 'quad', layer, pts, color, ...o});
  const B = (layer, a, b, color, o = {}) => items.push({t: 'box', layer, a, b, color, ...o});
  // outside: sky behind the window, hallway behind the door
  Q('outside', [[-345, 90, 160], [-345, 90, 340], [-345, 230, 340], [-345, 230, 160]], C.skyDay, {sky: true});
  Q('outside', [[D.x0 - 20, 0, 600], [D.x1 + 20, 0, 600], [D.x1 + 20, 0, 950], [D.x0 - 20, 0, 950]], shade(C.floor, 0.85));
  Q('outside', [[D.x0 - 20, 0, 950], [D.x1 + 20, 0, 950], [D.x1 + 20, 240, 950], [D.x0 - 20, 240, 950]], shade(C.hall, 1.1));
  Q('outside', [[D.x0 - 20, 0, 600], [D.x0 - 20, 0, 950], [D.x0 - 20, 240, 950], [D.x0 - 20, 240, 600]], C.hall, {normal: [1, 0, 0]});
  Q('outside', [[D.x1 + 20, 0, 600], [D.x1 + 20, 0, 950], [D.x1 + 20, 240, 950], [D.x1 + 20, 240, 600]], C.hall, {normal: [-1, 0, 0]});
  Q('outside', [[D.x0 - 20, 240, 600], [D.x1 + 20, 240, 600], [D.x1 + 20, 240, 950], [D.x0 - 20, 240, 950]], shade(C.hall, 0.9), {normal: [0, -1, 0]});
  // room shell (inward normals: a wall is only drawn when the camera is in front of it)
  Q('room', [[R.x0, R.h, 0], [R.x1, R.h, 0], [R.x1, R.h, R.z1], [R.x0, R.h, R.z1]], C.ceiling, {normal: [0, -1, 0]});
  Q('room', [[R.x0, 0, 0], [R.x1, 0, 0], [R.x1, R.h, 0], [R.x0, R.h, 0]], C.wall, {normal: [0, 0, 1]});
  Q('room', [[R.x0, 0, R.z1], [R.x1, 0, R.z1], [R.x1, R.h, R.z1], [R.x0, R.h, R.z1]], shade(C.wall, 0.97), {normal: [0, 0, -1],
    holes: [[[D.x0, 0, R.z1], [D.x1, 0, R.z1], [D.x1, D.h, R.z1], [D.x0, D.h, R.z1]]]});
  Q('room', [[R.x0, 0, 0], [R.x0, 0, R.z1], [R.x0, R.h, R.z1], [R.x0, R.h, 0]], shade(C.wall, 0.93), {normal: [1, 0, 0],
    holes: [[[R.x0, 100, 170], [R.x0, 100, 330], [R.x0, 220, 330], [R.x0, 220, 170]]]});
  Q('room', [[R.x1, 0, 0], [R.x1, 0, R.z1], [R.x1, R.h, R.z1], [R.x1, R.h, 0]], shade(C.wall, 0.91), {normal: [-1, 0, 0]});
  Q('room', [[R.x0, 0, 0], [R.x1, 0, 0], [R.x1, 0, R.z1], [R.x0, 0, R.z1]], C.floor, {normal: [0, 1, 0]});
  const boards = [];
  for (let z = 80; z < 600; z += 90) boards.push([[R.x0, 0.1, z], [R.x1, 0.1, z]]);
  items.push({t: 'lines', layer: 'room', segs: boards, w: 4, color: C.floorLine});
  // baseboards, door trim
  Q('room', [[R.x0, 0, 0.5], [R.x1, 0, 0.5], [R.x1, 12, 0.5], [R.x0, 12, 0.5]], C.wallTrim, {normal: [0, 0, 1]});
  Q('room', [[R.x0, 0, R.z1 - 0.5], [D.x0 - 8, 0, R.z1 - 0.5], [D.x0 - 8, 12, R.z1 - 0.5], [R.x0, 12, R.z1 - 0.5]], C.wallTrim, {normal: [0, 0, -1]});
  Q('room', [[D.x1 + 8, 0, R.z1 - 0.5], [R.x1, 0, R.z1 - 0.5], [R.x1, 12, R.z1 - 0.5], [D.x1 + 8, 12, R.z1 - 0.5]], C.wallTrim, {normal: [0, 0, -1]});
  Q('room', [[D.x0 - 10, 0, R.z1 - 1], [D.x0, 0, R.z1 - 1], [D.x0, D.h + 10, R.z1 - 1], [D.x0 - 10, D.h + 10, R.z1 - 1]], C.wallTrim, {normal: [0, 0, -1]});
  Q('room', [[D.x1, 0, R.z1 - 1], [D.x1 + 10, 0, R.z1 - 1], [D.x1 + 10, D.h + 10, R.z1 - 1], [D.x1, D.h + 10, R.z1 - 1]], C.wallTrim, {normal: [0, 0, -1]});
  Q('room', [[D.x0 - 10, D.h, R.z1 - 1], [D.x1 + 10, D.h, R.z1 - 1], [D.x1 + 10, D.h + 10, R.z1 - 1], [D.x0 - 10, D.h + 10, R.z1 - 1]], C.wallTrim, {normal: [0, 0, -1]});
  // window frame + curtains (left wall)
  Q('room', [[R.x0 + 1, 158, 170], [R.x0 + 1, 158, 330], [R.x0 + 1, 164, 330], [R.x0 + 1, 164, 170]], C.windowFrame, {normal: [1, 0, 0], w: 6});
  Q('room', [[R.x0 + 1, 100, 247], [R.x0 + 1, 100, 253], [R.x0 + 1, 220, 253], [R.x0 + 1, 220, 247]], C.windowFrame, {normal: [1, 0, 0], w: 6});
  for (const z of [140, 335]) Q('room', [[R.x0 + 3, 80, z], [R.x0 + 3, 80, z + 28], [R.x0 + 3, 235, z + 28], [R.x0 + 3, 235, z]], C.curtain, {normal: [1, 0, 0], round: 10});
  // picture on the door wall
  Q('room', [[-170, 115, R.z1 - 1], [-60, 115, R.z1 - 1], [-60, 185, R.z1 - 1], [-170, 185, R.z1 - 1]], C.frame, {normal: [0, 0, -1]});
  Q('room', [[-162, 123, R.z1 - 2], [-68, 123, R.z1 - 2], [-68, 177, R.z1 - 2], [-162, 177, R.z1 - 2]], C.pictureBg, {normal: [0, 0, -1], w: 5});
  Q('room', [[-162, 123, R.z1 - 3], [-130, 160, R.z1 - 3], [-110, 140, R.z1 - 3], [-85, 168, R.z1 - 3], [-68, 135, R.z1 - 3], [-68, 123, R.z1 - 3]], C.pictureHill, {normal: [0, 0, -1], w: 5});
  items.push({t: 'floorEllipse', layer: 'room', cx: -10, cz: 230, rx: 150, rz: 95, color: C.rug});
  // TV wall furniture
  B('room', [-125, 0, 4], [125, 52, 52], C.cabinet);
  B('room', [-30, 52, 18], [30, 58, 34], C.metal);
  B('room', [-104, 64, 22], [104, 186, 30], C.tvBezel, {topK: 1.3, frontK: 1});
  B('room', [-110, 4, 52], [-40, 30, 53], C.woodDark);
  B('room', [-100, 9, 50], [-56, 22, 54], C.console);
  B('room', [52, 30, 52], [104, 48, 56], '#262524');
  items.push({t: 'cyl', layer: 'room', c: [200, 30], r0: 22, r1: 26, y0: 0, y1: 40, color: C.plantPot});
  items.push({t: 'plant', layer: 'room', base: [200, 40, 30], leaves: [[-0.6, 70], [-0.2, 90], [0.25, 85], [0.6, 65]], color: C.plant});
  items.push({t: 'screen', layer: 'room', corners: [[-96, 70, 30.5], [96, 70, 30.5], [96, 180, 30.5], [-96, 180, 30.5]]});
  if (clock) items.push({t: 'clock', layer: 'room', at: ANCHORS.clock, size: 13, texts: clock, color: C.led});
  // floor lamp
  items.push({t: 'cyl', layer: 'room', c: [-210, 470], r0: 24, r1: 24, y0: 0, y1: 4, color: C.metal});
  items.push({t: 'tube', layer: 'room', a: [-210, 4, 470], b: [-210, 150, 470], w: 3, color: C.metal});
  items.push({t: 'cyl', layer: 'room', c: [-210, 470], r0: 34, r1: 22, y0: 140, y1: 185, color: C.lampShade, topK: 0.85});
  // the couch: depth-sorted pieces on the 'mid' layer; a view can lift a piece to 'fg' by name (fg: ['armL'])
  items.push({t: 'group', layer: 'mid', items: [
    {t: 'box', name: 'base', a: [-130, 10, 300], b: [130, 46, 402], color: C.couch, round: 8},
    {t: 'box', name: 'back', a: [-130, 46, 380], b: [130, 92, 404], color: C.couch, round: 10},
    {t: 'box', name: 'cushL', a: [-104, 46, 300], b: [-2, 60, 382], color: C.couchLight, round: 14},
    {t: 'box', name: 'cushR', a: [2, 46, 300], b: [104, 60, 382], color: C.couchLight, round: 14},
    {t: 'box', name: 'bcushL', a: [-104, 58, 366], b: [-2, 88, 382], color: C.couchLight, round: 14},
    {t: 'box', name: 'bcushR', a: [2, 58, 366], b: [104, 88, 382], color: C.couchLight, round: 14},
    {t: 'box', name: 'armL', a: [-134, 10, 298], b: [-104, 74, 404], color: C.couch, round: 12},
    {t: 'box', name: 'armR', a: [104, 10, 298], b: [134, 74, 404], color: C.couch, round: 12},
  ]});
  for (const [x, z] of [[-120, 310], [120, 310], [-120, 392], [120, 392]]) B('mid', [x - 4, 0, z - 4], [x + 4, 10, z + 4], C.woodDark);
  return {items, door: {...D, color: C.door}, anchors: ANCHORS, room: R};
}
