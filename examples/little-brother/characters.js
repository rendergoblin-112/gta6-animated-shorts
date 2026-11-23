// "When you finally get GTA 6 but your little brother wants a turn": the cast.
// Hero: big brother, kid build, saturated red beanie = the ONE saturated thing in the room.
// Little brother: 'small' build, a single curl, muted dusty-blue striped tee (one colour block).

// ---------------- big brother (hero) ----------------
const K = {
  sit: {},
  happy: {expr: 'happy'},
  bounceUp: {expr: 'happy', dy: 55, sy: 1.08, sx: 0.95, armL: {e: [-150, 230], h: [-70, 220]}, armR: {e: [150, 230], h: [70, 220]}, pad: {y: 215},
    legL: {k: [-110, -20], f: [-190, -150]}, legR: {k: [-50, -10], f: [-120, -150]}},
  land: {expr: 'happy', dy: -8, sy: 0.86, sx: 1.12},
  gloat: {expr: 'grinEvil', lean: 0.06, head: {dy: -16, rot: -0.06}, pad: {x: -96, y: -36, rot: 0.35, s: 0.8},
    armL: {e: [-130, 120], h: [-30, 176], hand: 'steeple', hr: -0.15, hs: 1.25}, armR: {e: [130, 120], h: [30, 176], hand: 'steeple', hr: 0.15, hs: 1.25}},
  leanIn: {expr: 'concentrate', lean: 0.24, head: {dy: -10}, pad: {x: 10, y: 150, rot: 0.12},
    armL: {e: [-112, 168], h: [-44, 150]}, armR: {e: [104, 188], h: [62, 160]}},
  sneakyLean: {expr: 'sneaky', lean: 0.2, head: {dy: -6, rot: 0.08}, pad: {x: 10, y: 140, rot: 0.1},
    armL: {e: [-112, 160], h: [-44, 142]}, armR: {e: [104, 180], h: [62, 152]}},
  determined: {expr: 'determined', lean: 0.12, pad: {x: -96, y: -36, rot: 0.35, s: 0.8},
    armL: {e: [-120, 175], h: [-12, 215], hand: 'fist'}, armR: {e: [120, 175], h: [12, 215], hand: 'fist'}},
  knuckle: {expr: 'determined', lean: 0.12, pad: {x: -96, y: -36, rot: 0.35, s: 0.8}, sy: 0.97,
    armL: {e: [-110, 190], h: [-4, 250], hand: 'fist', hr: 0.4}, armR: {e: [110, 190], h: [4, 250], hand: 'fist', hr: -0.4}},
  mash: {expr: 'determined', lean: 0.26, head: {dy: -12}, pad: {x: 10, y: 160, rot: 0.1},
    armL: {e: [-110, 172], h: [-44, 160]}, armR: {e: [102, 190], h: [62, 168]}},
  shockJump: {expr: 'shock', dy: 70, sy: 1.16, sx: 0.88, pad: {y: 330, rot: 0.4},
    armL: {e: [-180, 230], h: [-215, 320], hand: 'open', hr: 0.5}, armR: {e: [180, 230], h: [215, 320], hand: 'open', hr: -0.5},
    legL: {k: [-120, 10], f: [-170, -150]}, legR: {k: [-40, 20], f: [-80, -140]}},
  shockLand: {expr: 'shockBlood', sy: 0.88, sx: 1.1, pad: {y: 100}},
  frozen: {expr: 'shockBlood', tsy: 0.92, tsx: 1.05, head: {dy: -24}, pad: {y: 90},
    armL: {e: [-96, 150], h: [-60, 104]}, armR: {e: [96, 150], h: [60, 104]}},
  // NEW for this joke
  annoyed: {expr: 'annoyed', look: [-0.9, 0.05], head: {rot: 0.08}},
  noA: {expr: 'annoyed', look: [-0.2, 0], head: {dx: -14, rot: 0.1}, lean: 0.03},
  noB: {expr: 'annoyed', look: [0.2, 0], head: {dx: 14, rot: -0.1}, lean: -0.03},
  // turns his back on the little brother, controller hugged to his chest
  shield: {expr: 'determined', turn: 0.35, lean: 0.12, look: [0.6, 0], pad: {x: 30, y: 196, rot: -0.3, s: 0.9},
    armL: {e: [-118, 128], h: [-10, 196], hand: 'grip', hr: -0.6}, armR: {e: [130, 140], h: [64, 206], hand: 'grip', hr: 0.6}, head: {rot: -0.08}},
  grabHead: {expr: 'panic', handsFront: true, pad: {x: -96, y: -36, rot: 0.35, s: 0.8}, sy: 1.06, sx: 0.96,
    armL: {e: [-215, 300], h: [-152, 372], hand: 'claw', hr: -1.3}, armR: {e: [215, 300], h: [152, 372], hand: 'claw', hr: 1.3}},
  blown: {expr: 'panic', lean: -0.55, dy: 10, sy: 1.12, sx: 0.92, pad: null,
    armL: {e: [-200, 260], h: [-260, 380], hand: 'open', hr: 0.6}, armR: {e: [200, 260], h: [260, 380], hand: 'open', hr: -0.6},
    legL: {k: [-150, 60], f: [-230, -60]}, legR: {k: [-90, 70], f: [-160, -50]}},
  flop: {expr: 'despair', lean: -0.5, dy: -24, tsy: 0.96, head: {rot: -0.25}, pad: null,
    armL: {e: [-160, 120], h: [-215, 10], hand: 'open', hr: 2.5}, armR: {e: [160, 105], h: [215, -10], hand: 'open', hr: -2.5},
    legL: {k: [-150, 10], f: [-260, -60]}, legR: {k: [-100, 20], f: [-200, -40]}},
  // waiting for hours: slumped, cheek on his fist, bags under the eyes
  slump: {expr: 'tired', lean: -0.12, pad: null, head: {rot: 0.22, dx: 10, dy: -10},
    armR: {e: [150, 140], h: [70, 262], hand: 'fist', hr: 0.3}, armL: {e: [-120, 110], h: [-150, 20], hand: 'open', hr: 2.8}},
  reach: {expr: 'eager', lean: 0.2, pad: null, armL: {e: [-190, 200], h: [-290, 230], hand: 'open', hr: 1.2}, armR: {e: [130, 190], h: [-60, 250], hand: 'open', hr: 0.8}},
  grabBack: {expr: 'happy', lean: 0.1, dy: 30, sy: 1.05, pad: {x: 0, y: 190}, armL: {e: [-130, 220], h: [-60, 200]}, armR: {e: [130, 220], h: [60, 200]}},
  scream: {expr: 'scream', handsFront: true, pad: null, sy: 1.08, sx: 0.95, head: {sy: 1.04},
    armL: {e: [-215, 300], h: [-152, 372], hand: 'claw', hr: -1.3}, armR: {e: [215, 300], h: [152, 372], hand: 'claw', hr: 1.3}},
  screamB: {expr: 'scream', handsFront: true, pad: null, sy: 1.02, sx: 1.0, head: {sy: 0.97, dx: 6},
    armL: {e: [-225, 290], h: [-158, 366], hand: 'claw', hr: -1.2}, armR: {e: [225, 290], h: [158, 366], hand: 'claw', hr: 1.2}},
};

export const bro = {
  build: 'kid', unit: 0.17,
  hair: {style: 'none'},              // the beanie covers the top of the head
  outfit: {type: 'none'},
  acc: {type: 'beanie'},              // colour = palette.accent (saturated red)
  defaults: {mode: 'sit', turn: -0.35, pad: {}},
  poses: K,
};

// ---------------- little brother ----------------
const clasp = {armL: {e: [-92, 120], h: [-16, 192], hand: 'fist', hr: -0.4}, armR: {e: [92, 120], h: [16, 192], hand: 'fist', hr: 0.4}, handsFront: true};
const L = {
  stand: {mode: 'stand', expr: 'neutral', pad: null},
  plead: {mode: 'stand', expr: 'pleading', pad: null, head: {rot: 0.12}, ...clasp},
  pleadB: {mode: 'stand', expr: 'pleading', pad: null, head: {rot: -0.06, dy: -6}, lean: 0.04, sy: 0.97, ...clasp},
  walk: {mode: 'stand', expr: 'pleading', pad: null, armL: {e: [-100, 120], h: [-104, 40], hand: 'open', hr: 0.2}, armR: {e: [100, 120], h: [104, 40], hand: 'open', hr: -0.2}},
  // tugging the hero's arm (he reaches toward screen-right)
  tug: {mode: 'stand', expr: 'pleading', pad: null, lean: 0.12, turn: 0.3, head: {rot: -0.1},
    armL: {e: [40, 150], h: [200, 170], hand: 'grip', hr: -1.4}, armR: {e: [130, 120], h: [230, 150], hand: 'grip', hr: -1.6}},
  tugB: {mode: 'stand', expr: 'pleading', pad: null, lean: -0.06, turn: 0.3, head: {rot: 0.06}, sy: 0.96,
    armL: {e: [30, 140], h: [170, 160], hand: 'grip', hr: -1.4}, armR: {e: [120, 110], h: [200, 140], hand: 'grip', hr: -1.6}},
  // standing in front of the TV, arms out wide
  block: {mode: 'stand', expr: 'pleading', pad: null, armL: {e: [-170, 200], h: [-270, 270], hand: 'open', hr: 0.7}, armR: {e: [170, 200], h: [270, 270], hand: 'open', hr: -0.7}},
  blockB: {mode: 'stand', expr: 'pleading', pad: null, dy: 10, sy: 1.03, head: {rot: 0.1}, armL: {e: [-175, 215], h: [-280, 300], hand: 'open', hr: 0.6}, armR: {e: [175, 215], h: [280, 300], hand: 'open', hr: -0.6}},
  lipQuiver: {mode: 'head', expr: 'pleading', look: [0, 0.2], head: {sy: 0.98}},
  // the rage peak: tantrum, two alternating drawings
  tantrumA: {mode: 'stand', expr: 'tantrum', turn: 0, pad: null, armL: {e: [-200, 260], h: [-180, 420], hand: 'fist'}, armR: {e: [190, 220], h: [230, 330], hand: 'fist'},
    legL: {k: [-60, -60], f: [-40, -150]}, head: {rot: 0.1}},
  tantrumB: {mode: 'stand', expr: 'tantrum', turn: 0, pad: null, armL: {e: [-190, 220], h: [-230, 330], hand: 'fist'}, armR: {e: [200, 260], h: [180, 420], hand: 'fist'},
    legR: {k: [60, -60], f: [40, -150]}, head: {rot: -0.1}},
  // playing, hours later
  play: {mode: 'sit', expr: 'gamer', turn: 0.2, pad: {y: 70}},
  playB: {mode: 'sit', expr: 'gamer', turn: 0.2, pad: {y: 74, rot: 0.06}, head: {rot: 0.04}},
  grabbed: {mode: 'sit', expr: 'grinEvil', turn: 0.2, pad: {y: 120}, armL: {e: [-100, 150], h: [-50, 120]}, armR: {e: [100, 150], h: [50, 120]}},
  offer: {mode: 'sit', expr: 'sweet', turn: 0.35, lean: 0.1, head: {rot: -0.14}, pad: {x: 210, y: 236, rot: 0.3, s: 1.15},
    armL: {e: [60, 170], h: [150, 236], hand: 'grip', hr: -0.9}, armR: {e: [180, 170], h: [262, 250], hand: 'grip', hr: 0.5}},
  asleep: {mode: 'sit', expr: 'asleep', turn: 0.2, lean: -0.18, head: {rot: 0.3}, pad: null,
    armL: {e: [-110, 100], h: [-80, 20], hand: 'open', hr: 2.6}, armR: {e: [110, 100], h: [80, 20], hand: 'open', hr: -2.6}},
};

export const lil = {
  build: 'small', unit: 0.16,
  hair: {style: 'curl'},
  outfit: {type: 'striped', color: '#8fa3b8', stripe: '#d6dde4'},
  acc: {type: 'none'},
  face: {erx: 60, ery: 68},           // slightly bigger eyes than his brother: reads younger
  defaults: {mode: 'stand', turn: 0.25},
  poses: L,
};
