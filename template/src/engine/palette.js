// Default palette: a muted, warm-neutral room plus the shared character colours.
// Projects override or add keys with setPalette() (see project/index.js -> palette).
// Rule: the ONLY saturated colour in a room shot is the hero's signature prop (C.accent), 2-4% of the frame.
export const C = {
  // room (muted: mean saturation of the frame should stay <= ~56/255)
  wall: '#b6bca6', wallTrim: '#9fa48f', ceiling: '#c9cab6',
  floor: '#6f665b', floorLine: '#5f574d', rug: '#8a8073',
  couch: '#8a7a6f', couchLight: '#9a8b7f', couchDark: '#6d6058',
  wood: '#8b7461', woodDark: '#6e5b4c',
  windowFrame: '#dcd9cc', curtain: '#a39a86',
  skyDay: '#cfdcd8', skyAfternoon: '#e3d2ad', skyEvening: '#56607a', skyNight: '#2a3044',
  hall: '#5e6158', door: '#8f7a68', lampShade: '#d9cfb6', metal: '#4a4744',
  plant: '#7e8f78', plantPot: '#a58e78', frame: '#6e5b4c', pictureBg: '#c9cdb8', pictureHill: '#9aa58e',
  tvBezel: '#1c1b1a', tvOff: '#0b0b0b', cabinet: '#8b7461', console: '#3a3a3c', led: '#ff4b3a',
  // characters (shared)
  char: '#e4e6df',      // off-white skin/body (measured range #d3d8d7..#f9faf2)
  eye: '#fbfbf6', bloodEye: '#f5d9d3', vein: '#c8443a',
  mouth: '#5e2a2a', tongue: '#d48a82', teeth: '#fbfbf6', tear: '#9fd2ea', blush: '#e9b8b0',
  shoe: '#3b3734', pad: '#3d4146', padBtn: '#6a6f75', phonesPad: '#3a3c3e',
  accent: '#16c76a',    // the hero's signature colour (one saturated hue). Change it per project.
  // props
  pot: '#9aa0a2', potDark: '#7c8284', broomHandle: '#7b6250', broomStraw: '#c8b27d',
  slipper: '#d7a9b0', slipperSole: '#8f6f74', robe: '#a594aa', curler: '#e0b9c0', steam: '#ffffff',
  // rage card: the one allowed saturation spike, behind the rage peak only
  fire1: '#f05a20', fire2: '#f7a23a', fire3: '#ffd166',
};
export function setPalette(extra = {}) { Object.assign(C, extra); }
