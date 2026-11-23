// "When your mom says one more mission": the whole project. The engine reads only this object.
import {livingRoom} from '../src/sets/livingRoom.js';
import {kid, mom} from './characters.js';
import {shots} from './shots.js';

export default {
  title: 'When your mom says one more mission',
  size: [1080, 1920],   // 9:16. (The top shorts were 4:5 / 2:3; keep all action inside the central band.)
  fps: 30,
  palette: {accent: '#16c76a'},   // the kid's green headphones: the only saturated thing in the room
  hero: 'kid',                    // whose knees/hands appear in the screen POV shots
  characters: {kid, mom},
  set: () => livingRoom({clock: {day: '12:30', afternoon: '4:45', evening: '9:10', night: '3:00'}}),
  // camera setups (cm, world space of the set). fg = set pieces drawn in front of the characters in this view.
  views: {
    couch3q: {pos: [-160, 112, 70], target: [5, 82, 380], fov: 64, fg: ['armL']},   // 3/4 on the couch (most C shots)
    couchLow: {pos: [40, 52, 225], target: [0, 175, 430], fov: 72},                 // low angle looking up at whoever looms
    tvPov: {pos: [0, 118, 340], target: [0, 80, 0], fov: 74},                       // the hero's eyes -> the TV
    doorway: {pos: [-150, 110, 420], target: [190, 100, 600], fov: 54},             // 3/4 on the door
    nightPov: {pos: [190, 140, 575], target: [40, 60, 250], fov: 62},               // from the door toward the couch + TV
    behindLow: {pos: [310, 40, 595], target: [-20, 80, 250], fov: 66},              // low angle behind the couch
    highCorner: {pos: [-120, 240, 60], target: [60, 40, 400], fov: 62},             // high angle: door, couch and kid in one frame
  },
  cards: {fire: {type: 'fire'}, clock: {type: 'clock', text: '3:00', sub: 'AM'}},
  screens: {
    title: {text: 'GTA 6', sub: 'PRESS START'},
    menu: {title: 'MISSION 1', sub: '"Beach Run"', button: 'START  >'},
    banners: {
      missionStart: {lines: [{text: 'MISSION 1', y: 420, size: 46}, {text: 'MISSION START', y: 350, size: 92, color: '#ffd23f', rot: -0.03}]},
      missionRetry: {lines: [{text: 'MISSION 1  (again)', y: 420, size: 46}, {text: 'MISSION START', y: 350, size: 92, color: '#ffd23f', rot: -0.03}]},
      missionComplete: {lines: [{text: 'MISSION 47', y: 470, size: 44}, {text: 'MISSION COMPLETE', y: 390, size: 84, color: '#9dff8a', rot: -0.02}], stars: 5},
    },
  },
  shots,
};
