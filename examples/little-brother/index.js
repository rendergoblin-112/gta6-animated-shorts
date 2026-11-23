// "When you finally get GTA 6 but your little brother wants a turn"
import {livingRoom} from '../src/sets/livingRoom.js';
import {bro, lil} from './characters.js';
import {shots} from './shots.js';

export default {
  title: 'When you finally get GTA 6 but your little brother wants a turn',
  size: [1080, 1920],
  fps: 30,
  palette: {accent: '#e8322e'},   // the hero's red beanie: the only saturated thing in the room
  hero: 'bro',
  characters: {bro, lil},
  set: () => livingRoom({clock: {day: '12:30', afternoon: '4:45', evening: '8:20', night: '11:58'}}),
  views: {
    couch3q: {pos: [-160, 112, 70], target: [5, 82, 380], fov: 64, fg: ['armL']},
    tvPov: {pos: [0, 118, 340], target: [0, 80, 0], fov: 74},
    highCorner: {pos: [-120, 240, 60], target: [60, 40, 400], fov: 62},
    couchLow: {pos: [40, 52, 225], target: [0, 175, 430], fov: 72},
    twoShot: {pos: [0, 120, 120], target: [0, 70, 380], fov: 60},          // straight on the couch: both brothers side by side
  },
  points: {broHead: [-45, 120, 352], lilSeatHead: [50, 112, 352], lilTv: [0, 0, 235], doorFloor: [195, 0, 560],
    lilStop: [140, 0, 440], endA: [175, 0, 350], endB: [180, 0, 300], endC: [165, 0, 260], lilTug: [5, 0, 300], lilFace: [30, 128, 318], lilFace2: [-5, 124, 300]},
  cards: {fire: {type: 'fire'}, clock: {type: 'clock', text: '11:58', sub: 'PM'}},
  screens: {
    title: {text: 'GTA 6', sub: 'PRESS START'},
    menu: {title: 'MISSION 1', sub: '"Sunset Drive"', button: 'START  >'},
    money: '$ 0',
    banners: {
      missionStart: {lines: [{text: 'MISSION 1', y: 420, size: 46}, {text: 'MISSION START', y: 350, size: 92, color: '#ffd23f', rot: -0.03}]},
      missionRetry: {lines: [{text: 'MISSION 1  (again)', y: 420, size: 46}, {text: 'MISSION START', y: 350, size: 92, color: '#ffd23f', rot: -0.03}]},
      paused: {dim: true, lines: [{text: 'PAUSED', y: 330, size: 120, color: '#ffffff', rot: -0.02}], button: {text: 'RESUME', y: 180}},
    },
    cards: {
      loading: {bg: '#4a5080', lines: [{text: 'LOADING...', y: 300, size: 120, color: '#ffffff'}]},
      complete: {bg: '#fff3d6', confetti: true, stars: 5, starsY: 150,
        lines: [{text: 'GAME COMPLETE', y: 430, size: 104, color: '#ff6f61', rot: -0.03}, {text: '100%', y: 280, size: 200, color: '#36c46a', rot: -0.02}]},
    },
  },
  shots,
};
