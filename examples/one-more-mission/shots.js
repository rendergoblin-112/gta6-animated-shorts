// "When your mom says one more mission": the shot list. 28 shots, 36.17 s, 9:16.
// Every shot: id, type (C character / P screen POV / W wide / I insert / R rage card / T twist / B button),
// d (seconds), setup (camera view or card), light, cam framing + move, actors, screen, pov, door, sfx cues.
// beat: 'premise' | 'obstacle' | 'rage' | 'twist' | 'button' (read by `npm run check`); loop: which repeat of the obstacle.
import {q} from '../src/engine/anim.js';
import {DOOR} from '../src/sets/livingRoom.js';

const KH = [-45, 120, 352];           // the kid's head when seated on the left cushion
const KU = 0.17;                      // the kid's drawing scale (cm per unit), same as characters.js
const kid = (o) => ({who: 'kid', at: 'seatL', layer: 'front', ...o});
const momOn = (layer, o) => ({who: 'mom', layer, ground: true, idle: {breathe: 0.5}, ...o});
const robeSleeve = {sleeve: '#a594aa', cuff: '#cdbfd2'};

export const shots = [
  // ======== hook + premise ========
  {id: 'C1', type: 'C', n: 'kid bounces on the couch, eager (hook, pull-out)', d: 1.0, setup: 'couch3q', light: 'day', cam: {at: KH, zoom: 1.75, dy: -120}, move: 'pull',
    actors: [kid({keys: [[0, 'happy'], [0.12, 'bounceUp'], [0.3, 'land'], [0.45, 'bounceUp'], [0.62, 'land'], [0.8, ['sit', {expr: 'eager'}]]]})],
    sfx: [[0.1, 'boing', -2], [0.43, 'boing', -4]]},
  {id: 'P1', type: 'P', beat: 'premise', n: 'TV: "GTA 6" title -> press -> mission select', d: 1.75, setup: 'tvPov', light: 'day',
    screen: (t) => (t < 0.85 ? {state: 'title', blink: true} : {state: 'menu'}),
    pov: (t) => ({bounce: t < 0.5 ? (Math.floor(t * 6) % 2) * 16 : 0, press: t > 0.68 && t < 0.88}),
    sfx: [[0.7, 'click', 0], [0.85, 'zip', -3], [0.88, 'pop', -2]]},
  {id: 'C2', type: 'C', n: 'evil grin, steepled fingers (push-in)', d: 1.1, setup: 'couch3q', light: 'day', cam: {at: KH, zoom: 1.9, dy: -60}, move: 'push',
    actors: [kid({keys: [[0, ['sit', {expr: 'grinEvil'}]], [0.2, 'gloat'], [0.5, ['gloat', {armL: {h: [-24, 204]}, armR: {h: [24, 204]}}]], [0.75, 'gloat']]})],
    sfx: [[0.12, 'kid_chuckle', 0]]},
  {id: 'P2', type: 'P', n: 'TV: MISSION START, he leans in', d: 1.8, setup: 'tvPov', light: 'day',
    screen: (t) => ({state: 'drive', banner: t < 0.8 ? 'missionStart' : null}),
    pov: (t) => ({lean: t > 0.35 ? 1 : t / 0.35, mash: t > 0.8}),
    sfx: [[0, 'mission_start', -2], [0.35, 'zip', -6], [0.6, 'game_car', -6], [0.85, 'mash', -6]]},
  // ======== LOOP 1: dinner (day) ========
  {id: 'W1', type: 'W', beat: 'obstacle', loop: 1, n: 'HIGH ANGLE WIDE: he mashes; door bangs, mom walks in and stomps (dinner)', d: 2.2, setup: 'highCorner', light: 'day', cam: {x: 0, y: 160, zoom: 1.22},
    door: [[0, 0, 'hold'], [0.3, 0.9, 'hold'], [0.38, 1.55]],
    actors: [
      kid({pose: 'mash', mash: true}),
      momOn([[0, 'hall'], [0.78, 'behind']], {from: 0.3, until: 1.25, pose: ['dinnerWalk', {turn: 0.3}], walk: {t0: 0.3, t1: 1.25, path: [[195, 0, 820], [195, 0, 600], [205, 0, 470]]}}),
      momOn('behind', {from: 1.25, at: [205, 0, 470], keys: [[1.25, ['dinnerStompUp', {turn: 0.35}]], [1.42, ['dinnerStomp', {turn: 0.35}], 'hold'], [1.55, ['dinnerWalk', {turn: 0.35, expr: 'angry'}]],
        [1.65, ['dinnerBang', {turn: 0.35}]], [1.78, ['dinnerStomp', {turn: 0.35, dust: 0, sy: 1, sx: 1}]], [1.9, ['dinnerBang', {turn: 0.35}]], [2.02, ['dinnerStomp', {turn: 0.35, dust: 0, sy: 1, sx: 1}]]]}),
    ],
    shake: [[1.42, 0.2, 0.01]],
    sfx: [[0.3, 'door_bang', 0], [0.32, 'record_scratch', -2], [0.42, 'sting', 0], [0.5, 'steps_angry', -2], [1.42, 'stomp', 2], [1.66, 'pot_bell', 0], [1.95, 'mom_hmm', 2]], duck: [0.3, 2.2]},
  {id: 'C3', type: 'C', n: 'kid jumps out of his skin: eyes pop', d: 0.9, setup: 'couch3q', light: 'day', cam: {at: KH, zoom: 1.85, dy: -40},
    actors: [kid({idle: false, keys: [[0, ['mash', {expr: 'shock'}]], [0.08, 'shockJump'], [0.32, 'shockLand'], [0.44, ['sit', {expr: 'shockBlood'}]]]})],
    sfx: [[0.04, 'eye_pop', 0], [0.06, 'kid_gasp', 0], [0.32, 'boing', -6]], duck: [0, 0.9]},
  {id: 'P3', type: 'P', n: 'TV switched off', d: 1.3, setup: 'tvPov', light: 'day',
    screen: {state: 'drive', offAt: 0.3}, pov: (t) => ({drop: t > 0.45}),
    sfx: [[0.28, 'tv_off', 2], [0.55, 'sad_trombone', -2]]},
  {id: 'C4', type: 'C', n: 'kid flops back on the couch (slide whistle)', d: 1.0, setup: 'couch3q', light: 'day', cam: {at: KH, zoom: 1.6, dy: -160},
    actors: [kid({idle: {blink: false}, keys: [[0, ['sit', {expr: 'shockBlood'}]], [0.12, ['sit', {expr: 'despair', lean: -0.1, dy: 20, sy: 1.06}]], [0.34, 'flop'], [0.44, ['flop', {sy: 0.9, sx: 1.08}]], [0.56, 'flop']]})],
    sfx: [[0.02, 'slide_down', 0], [0.36, 'flump', 2]]},
  // ======== LOOP 2: chores (afternoon) ========
  {id: 'C5', type: 'C', n: 'kid sits up, cracks knuckles, grabs the pad (push-in)', d: 1.0, setup: 'couch3q', light: 'afternoon', cam: {at: KH, zoom: 1.85, dy: -60}, move: 'push',
    actors: [kid({keys: [[0, 'determined'], [0.16, 'knuckle'], [0.32, 'determined'], [0.45, 'knuckle'], [0.6, 'determined'], [0.78, ['leanIn', {expr: 'determined'}]]]})],
    sfx: [[0.12, 'knuckles', 0], [0.74, 'zip', -4]]},
  {id: 'P4', type: 'P', n: 'TV back on: MISSION START', d: 1.3, setup: 'tvPov', light: 'afternoon',
    screen: (t) => (t < 0.15 ? {state: 'off'} : {state: 'drive', banner: t < 0.85 ? 'missionRetry' : null}), pov: {lean: 1, mash: true},
    sfx: [[0, 'tv_on', 0], [0.15, 'mission_start', -2], [0.55, 'game_car', -6]]},
  {id: 'M2', type: 'C', beat: 'obstacle', loop: 2, n: '3/4 EYE LEVEL: mom marches out of the door with the broom and stomps; kid jumps (chores)', d: 1.5, setup: 'couch3q', light: 'afternoon', cam: {x: -170, y: 80, zoom: 1.0},
    door: 1.55,
    actors: [
      kid({until: 0.78, pose: 'mash'}),
      kid({from: 0.78, idle: false, keys: [[0.78, 'shockJump'], [0.95, 'shockLand'], [1.1, 'frozen']]}),
      momOn([[0, 'hall'], [0.3, 'behind']], {until: 0.6, pose: ['choresWalk', {turn: 0.3}], walk: {t0: 0, t1: 0.6, path: [[195, 0, 700], [195, 0, 600], [235, 0, 500]], rate: 12}}),
      momOn('behind', {from: 0.6, at: [235, 0, 500], keys: [[0.6, ['choresWalk', {turn: 0.3, legR: {k: [80, 30], f: [90, -70]}}]], [0.72, ['choresStomp', {turn: 0.3}], 'hold'], [0.85, ['chores', {turn: 0.3}]]]}),
    ],
    shake: [[0.72, 0.2, 0.012]],
    sfx: [[0, 'steps_angry', 0], [0.55, 'sting', 2], [0.72, 'stomp', 3], [0.78, 'boing', -2], [0.9, 'mom_hmm', 3]], duck: [0.5, 1.5]},
  {id: 'C6', type: 'C', n: 'kid grabs his head, bloodshot', d: 1.0, setup: 'couch3q', light: 'afternoon', cam: {at: KH, zoom: 1.75, dy: -20},
    actors: [kid({idle: false, keys: [[0, 'frozen'], [0.1, ['grabHead', {sy: 1.12, sx: 0.92}]], [0.22, 'grabHead'], [0.34, ['grabHead', {head: {dx: -8}}]], [0.46, ['grabHead', {head: {dx: 8}}]], [0.58, ['grabHead', {head: {dx: -8}}]], [0.7, 'grabHead']]})],
    sfx: [[0.06, 'kid_gasp', 0], [0.12, 'eye_pop', -4], [0.55, 'gulp', 0]]},
  {id: 'P5', type: 'P', n: 'TV switched off (record scratch)', d: 1.2, setup: 'tvPov', light: 'afternoon',
    screen: {state: 'drive', offAt: 0.25}, pov: (t) => ({drop: t > 0.4}),
    sfx: [[0.22, 'tv_off', 2], [0.25, 'record_scratch', 0]]},
  // ======== LOOP 3: bedtime (evening) ========
  {id: 'C7', type: 'C', n: 'kid leans in, sneaky (push-in)', d: 1.0, setup: 'couch3q', light: 'evening', cam: {at: KH, zoom: 1.9, dy: -50}, move: 'push',
    actors: [kid({keys: [[0, ['sit', {expr: 'sneaky'}]], [0.25, 'sneakyLean'], [0.6, ['sneakyLean', {look: [-0.9, 0.2]}]], [0.8, ['sneakyLean', {look: [-0.9, -0.1]}]]]})],
    sfx: [[0.2, 'zip', -4], [0.5, 'tiptoe', -6]]},
  {id: 'P6', type: 'P', n: 'TV: MISSION START', d: 1.1, setup: 'tvPov', light: 'evening',
    screen: (t) => ({state: 'drive', banner: t < 0.6 ? 'missionRetry' : null}), pov: {lean: 1, mash: true},
    sfx: [[0, 'mission_start', -3], [0.4, 'game_car', -6]]},
  {id: 'L1', type: 'C', beat: 'obstacle', loop: 3, n: 'LOW ANGLE: mom already looming behind the couch (robe, curlers, slipper); kid frozen', d: 1.3, setup: 'couchLow', light: 'evening', cam: {x: 110, y: -60, zoom: 0.95},
    actors: [
      kid({idle: {blink: false}, keys: [[0, ['frozen', {turn: -0.15}]], [0.6, ['frozen', {turn: -0.15, look: [0.6, 0.6]}]]]}),
      {who: 'mom', layer: 'behind', at: [-25, 0, 424], ground: true, unit: 0.27, keys: [[0, ['bedA', {turn: 0.25}]], [0.16, ['bedB', {turn: 0.25}]], [0.5, ['bedB', {turn: 0.25, lean: -0.04}]]]},
    ],
    sfx: [[0, 'sting', 3], [0.18, 'mom_hmm', 4], [0.7, 'gulp', 0]], duck: [0, 1.3]},
  {id: 'P7', type: 'P', n: 'TV switched off', d: 1.0, setup: 'tvPov', light: 'evening',
    screen: {state: 'drive', offAt: 0.2}, pov: (t) => ({drop: t > 0.35}),
    sfx: [[0.18, 'tv_off', 2], [0.3, 'thump', 0]]},
  // ======== LOOP 4 (quick) -> rage peak ========
  {id: 'C8', type: 'C', beat: 'obstacle', loop: 4, n: 'kid mashes START on the dead TV, bouncing', d: 0.8, setup: 'couch3q', light: 'evening', cam: {at: KH, zoom: 1.7, dy: -60},
    actors: [kid({idle: false, mash: true, keys: [[0, 'mash'], [0.16, ['mash', {dy: 40, sy: 1.06}]], [0.3, ['mash', {sy: 0.9, sx: 1.08}]], [0.46, ['mash', {dy: 40, sy: 1.06}]], [0.6, ['mash', {sy: 0.9, sx: 1.08}]]]})],
    sfx: [[0, 'mash', 0], [0.28, 'boing', -4], [0.58, 'boing', -4]]},
  {id: 'R1', type: 'R', beat: 'rage', n: 'MOM RAGE: fists up, fire, shake (rage peak)', d: 1.2, setup: 'fire', light: 'day', move: 'shake',
    actors: [{who: 'mom', layer: 'front', scr: [0, -860, 1.9], idle: false, alt: {fps: 12, poses: ['rageB', 'rageA']}}],
    sfx: [[0, 'boom', 3], [0.04, 'mom_roar', 4]], duck: [0, 1.2]},
  {id: 'C9', type: 'C', n: 'kid blown back, almost falls off the couch', d: 1.2, setup: 'couch3q', light: 'evening', cam: {at: KH, x: 170, zoom: 1.2, dy: -170}, shake: [[0, 0.25, 0.01]],
    actors: [kid({until: 0.3, idle: false, keys: [[0, 'blown'], [0.15, 'fallA']]}), kid({from: 0.3, idle: false, alt: {fps: 12, poses: ['fallB', 'fallA']}})],
    sfx: [[0, 'slide_down', 0], [0.12, 'scramble', 2], [0.95, 'bonk', 0]]},
  {id: 'P8', type: 'P', n: "mom's sleeve + hand snatches the controller", d: 1.2, setup: 'tvPov', light: 'evening',
    screen: {state: 'off'}, pov: (t) => ({snatch: t < 0.28 ? 1 : t < 0.5 ? 2 : 3, tremble: true, grabber: robeSleeve}),
    sfx: [[0.26, 'yoink', 2], [0.3, 'zip', -2], [0.7, 'gulp', -2]]},
  // ======== 3 AM ========
  {id: 'I1', type: 'I', n: 'clock: 3:00 AM', d: 1.3, setup: 'clock', light: 'night', move: 'push',
    sfx: [[0, 'night_amb', 4], [0.1, 'ticks', 0]], bed: 'night'},
  {id: 'C10', type: 'C', n: 'kid peeks round the doorway (push-in)', d: 1.3, setup: 'doorway', light: 'night', cam: {x: 110, y: 70, zoom: 1.9}, move: 'push', door: 2.9,
    actors: [{who: 'kid', layer: 'hall', at: [DOOR.x0 + 6, 104, 616], pose: 'peek'},
      {who: 'hand', layer: 'door', at: [DOOR.x0 - 2, 92, 598], kind: 'grip', rot: -1.6, flip: false}],
    sfx: [[0.05, 'door_creak', 0], [0.5, 'squeak_steps', -8]], bed: 'night'},
  {id: 'P9', type: 'P', n: 'his POV: the TV is on behind the couch; someone is playing', d: 2.0, setup: 'nightPov', light: 'night', door: 2.9,
    screen: (t) => ({state: 'drive', banner: t > 0.95 ? 'missionComplete' : null}),
    sfx: [[0.1, 'mash', -6], [0.95, 'mission_done', -2]], bed: 'night'},
  {id: 'C11', type: 'C', n: 'kid confused, scratches his head', d: 1.0, setup: 'doorway', light: 'night', cam: {x: 110, y: 70, zoom: 2.05}, door: 2.9,
    actors: (t) => [{who: 'kid', layer: 'hall', at: [DOOR.x0 + 6, 104, 616], pose: ['peek', {expr: 'confused'}]},
      {who: 'hand', layer: 'door', at: [DOOR.x0 - 2, 92, 598], kind: 'grip', rot: -1.6, flip: false},
      {who: 'hand', layer: 'top', at: [DOOR.x0 + 2, 128 + (Math.floor(q(t) * 6) % 2) * 1.2, 612], kind: 'claw', rot: 2.6, flip: true}],
    sfx: [[0.15, 'pop2', -4], [0.3, 'bonk', -10]], bed: 'night'},
  {id: 'I2', type: 'I', n: 'LOW ANGLE: kid tiptoes to the couch (squeaky sneak) ... dun dun DUN', d: 1.9, setup: 'behindLow', light: 'night', cam: {x: -150, y: 40, zoom: 1.2}, door: 2.9,
    screen: {state: 'drive'},
    actors: (t) => {
      const step = Math.floor(q(t) / 0.25); // a new drawing every 0.25 s
      return [{who: 'kid', layer: 'top', at: [190 - step * 18, 300 * KU, 455 - step * 3], pose: step % 2 ? ['tipB', {turn: -0.3}] : ['tipA', {turn: -0.3}], idle: {breathe: 0.4}}];
    },
    sfx: [[0, 'squeak_steps', 2], [0.55, 'dun_dun', 3]], bed: 'night'},
  // ======== TWIST (~92%) + button ========
  {id: 'T1', type: 'T', beat: 'twist', n: 'TWIST: mom is the one playing, in his headphones; he pops up; she raises one finger', d: 1.5, setup: 'couch3q', light: 'night', cam: {at: [40, 120, 380], zoom: 1.4, dy: -60}, move: 'pull', door: 2.9,
    actors: [
      {who: 'mom', layer: 'front', at: [-10, 62, 352], tag: 'glow', mash: true, keys: [[0, ['game', {turn: -0.3}], 'hold'], [0.5, ['game', {turn: -0.3, look: [0.7, 0.2]}], 'hold'], [0.78, ['finger', {turn: -0.3}]]]},
      {who: 'kid', from: 0.3, layer: 'behind', at: [118, 130, 414], tag: 'glow', idle: false, keys: [[0.3, ['peek', {turn: -0.2, expr: 'shock', head: {sy: 1.12}}], 'hold'], [0.42, ['peek', {turn: -0.2, expr: 'shock'}]]]},
      {who: 'hand', from: 0.3, layer: 'top', at: [96, 106, 406], kind: 'fist', tag: 'glow'},
      {who: 'hand', from: 0.3, layer: 'top', at: [140, 106, 406], kind: 'fist', flip: true, tag: 'glow'},
    ],
    sfx: [[0.05, 'mom_cackle', 0], [0.3, 'eye_pop', 0], [0.78, 'stamp', -2]], bed: 'twist'},
  {id: 'C12', type: 'B', beat: 'button', n: 'button: kid screams, grabs his head (shake)', d: 1.3, setup: 'couch3q', light: 'night', cam: {at: [100, 135, 412], zoom: 1.9, dy: -40}, move: 'shake', door: 2.9,
    actors: [
      {who: 'mom', layer: 'front', at: [-10, 62, 352], tag: 'glow', pose: ['finger', {turn: -0.3}]},
      {who: 'kid', layer: 'behind', at: [118, 134, 414], tag: 'glow', idle: false, alt: {fps: 12, poses: [['peek', {turn: -0.1, expr: 'scream', head: {sy: 0.97, dx: -4}}], ['peek', {turn: -0.1, expr: 'scream', head: {sy: 1.04, dx: 4}}]]}},
      {who: 'hand', layer: 'top', at: [94, 140, 414], kind: 'claw', rot: -1.3, tag: 'glow'},
      {who: 'hand', layer: 'top', at: [142, 140, 414], kind: 'claw', rot: 1.3, flip: true, tag: 'glow'},
    ],
    sfx: [[0, 'kid_wail', 4], [0, 'boom', -2]], bed: 'twist'},
];
