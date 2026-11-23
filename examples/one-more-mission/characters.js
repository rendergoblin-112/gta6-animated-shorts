// "When your mom says one more mission": the cast. Characters are data + a pose library.
// Poses are body drawings (arms, legs, lean, squash) plus an expression name from src/engine/face.js.
// Read references/characters-and-acting.md before writing new ones.

// ---------------- the kid (hero): green headphones are the ONE saturated thing in the room ----------------
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
  shockJump: {expr: 'shock', dy: 70, sy: 1.16, sx: 0.88, pad: {y: 330, rot: 0.4},
    armL: {e: [-180, 230], h: [-215, 320], hand: 'open', hr: 0.5}, armR: {e: [180, 230], h: [215, 320], hand: 'open', hr: -0.5},
    legL: {k: [-120, 10], f: [-170, -150]}, legR: {k: [-40, 20], f: [-80, -140]}},
  shockLand: {expr: 'shockBlood', sy: 0.88, sx: 1.1, pad: {y: 100}},
  grabHead: {expr: 'panic', handsFront: true, pad: {x: -96, y: -36, rot: 0.35, s: 0.8}, sy: 1.06, sx: 0.96,
    armL: {e: [-215, 300], h: [-152, 372], hand: 'claw', hr: -1.3}, armR: {e: [215, 300], h: [152, 372], hand: 'claw', hr: 1.3}},
  flop: {expr: 'despair', lean: -0.5, dy: -24, tsy: 0.96, head: {rot: -0.25}, pad: {x: -60, y: 50, rot: 0.6},
    armL: {e: [-160, 120], h: [-215, 10], hand: 'open', hr: 2.5}, armR: {e: [160, 105], h: [215, -10], hand: 'open', hr: -2.5},
    legL: {k: [-150, 10], f: [-260, -60]}, legR: {k: [-100, 20], f: [-200, -40]}},
  frozen: {expr: 'shockBlood', tsy: 0.92, tsx: 1.05, head: {dy: -24}, pad: {y: 90},
    armL: {e: [-96, 150], h: [-60, 104]}, armR: {e: [96, 150], h: [60, 104]}},
  mash: {expr: 'determined', lean: 0.26, head: {dy: -12}, pad: {x: 10, y: 160, rot: 0.1},
    armL: {e: [-110, 172], h: [-44, 160]}, armR: {e: [102, 190], h: [62, 168]}},
  blown: {expr: 'panic', lean: -0.55, dy: 10, sy: 1.12, sx: 0.92, pad: null,
    armL: {e: [-200, 260], h: [-260, 380], hand: 'open', hr: 0.6}, armR: {e: [200, 260], h: [260, 380], hand: 'open', hr: -0.6},
    legL: {k: [-150, 60], f: [-230, -60]}, legR: {k: [-90, 70], f: [-160, -50]}},
  // almost falling off the couch: tipped over the front edge, legs in the air, one hand clinging (two drawings)
  fallA: {expr: 'panic', rot: -0.85, dx: 120, dy: -70, pad: null,
    armL: {e: [-210, 330], h: [-270, 440], hand: 'open', hr: 0.5}, armR: {e: [170, 110], h: [150, -10], hand: 'grip', hr: -2.4},
    legL: {k: [-80, 120], f: [-40, 290]}, legR: {k: [40, 110], f: [150, 230]}},
  fallB: {expr: 'panic', rot: -0.92, dx: 128, dy: -78, pad: null,
    armL: {e: [-240, 280], h: [-320, 360], hand: 'open', hr: 0.9}, armR: {e: [170, 110], h: [150, -10], hand: 'grip', hr: -2.4},
    legL: {k: [-40, 140], f: [40, 300]}, legR: {k: [60, 100], f: [200, 190]}},
  // tiptoe: two held drawings
  tipA: {mode: 'stand', expr: 'sneaky', acc: false, pad: null, lean: 0.12, look: [-0.9, 0.1],
    armL: {e: [-130, 140], h: [-104, 236], hand: 'open', hr: 2.9}, armR: {e: [130, 140], h: [110, 236], hand: 'open', hr: -2.9},
    legL: {k: [-110, -100], f: [-70, -190]}, legR: {k: [40, -150], f: [52, -292]}},
  tipB: {mode: 'stand', expr: 'sneaky', acc: false, pad: null, lean: 0.1, look: [-0.9, 0.1],
    armL: {e: [-130, 150], h: [-108, 246], hand: 'open', hr: 2.9}, armR: {e: [130, 130], h: [104, 226], hand: 'open', hr: -2.9},
    legL: {k: [-40, -150], f: [-52, -292]}, legR: {k: [100, -96], f: [70, -186]}},
  peek: {mode: 'peek', turn: -0.4, acc: false, expr: 'peek'},
};

export const kid = {
  build: 'kid', unit: 0.17,
  hair: {style: 'cowlick'},
  outfit: {type: 'none'},
  acc: {type: 'headphones'},          // colour = palette.accent
  defaults: {mode: 'sit', turn: -0.35, pad: {}},
  poses: K,
};

// ---------------- mom: same head/eye/line rules + colour blocks (aubergine bun, mustard dress) ----------------
const robe = {type: 'robe', color: '#a594aa'};
const potArm = {e: [-150, 190], h: [-128, 120], hand: 'grip', prop: 'pot', propBehind: true, hr: 0};
const M = {
  dinnerWalk: {outfit: 'apron', expr: 'stern', armL: potArm, armR: {e: [150, 200], h: [150, 110], hand: 'fist', prop: 'ladle', pr: 0.2}},
  dinnerStompUp: {outfit: 'apron', expr: 'huff', armL: potArm, armR: {e: [180, 300], h: [190, 400], hand: 'fist', prop: 'ladle', pr: 0.3},
    legR: {h: [40, -10], k: [80, 30], f: [90, -70]}, lean: -0.05},
  dinnerStomp: {outfit: 'apron', expr: 'angry', dust: 1, sy: 0.9, sx: 1.08, armL: potArm, armR: {e: [190, 320], h: [190, 440], hand: 'fist', prop: 'ladle', pr: 0.5}},
  dinnerBang: {outfit: 'apron', expr: 'angry', armL: potArm, armR: {e: [130, 230], h: [40, 160], hand: 'fist', prop: 'ladle', pr: 2.4}},
  choresWalk: {expr: 'angry', armL: {e: [-160, 200], h: [-150, 130], hand: 'fist', prop: 'broom'}, armR: {e: [150, 200], h: [140, 110], hand: 'fist'}},
  choresStomp: {expr: 'angry', dust: 1, sy: 0.9, sx: 1.08, armL: {e: [-170, 220], h: [-150, 150], hand: 'fist', prop: 'broom'},
    armR: {e: [200, 330], h: [300, 330], hand: 'point', hr: 0, flip: false}},
  chores: {expr: 'furious', armL: {e: [-170, 220], h: [-150, 150], hand: 'fist', prop: 'broom'}, armR: {e: [200, 330], h: [310, 340], hand: 'point', hr: 0.05, flip: false}},
  bedA: {outfit: robe, curlers: true, expr: 'angry', armL: {e: [-190, 320], h: [-200, 430], hand: 'fist', prop: 'slipper', pr: 0.2}, armR: {e: [180, 250], h: [120, 200], hand: 'fist'}},
  bedB: {outfit: robe, curlers: true, expr: 'furious', lean: 0.08, armL: {e: [-220, 400], h: [-230, 560], hand: 'fist', prop: 'slipper', pr: 0.4},
    armR: {e: [210, 330], h: [320, 300], hand: 'point', hr: -0.2, flip: false}},
  rageA: {outfit: robe, curlers: true, expr: 'rage', turn: 0, armL: {e: [-250, 380], h: [-230, 560], hand: 'fist'}, armR: {e: [250, 380], h: [230, 560], hand: 'fist'}},
  rageB: {outfit: robe, curlers: true, expr: 'rage', turn: 0, armL: {e: [-260, 360], h: [-250, 530], hand: 'fist'}, armR: {e: [240, 400], h: [210, 590], hand: 'fist'}},
  game: {mode: 'sit', expr: 'gamer', curlers: true, phones: true, outfit: robe, feet: 'slippers', pad: {x: 0, y: 120},
    armL: {e: [-140, 180], h: [-62, 124], hand: 'grip', hr: -0.3}, armR: {e: [140, 180], h: [62, 124], hand: 'grip', hr: 0.3}},
  finger: {mode: 'sit', expr: 'smug', curlers: true, phones: true, outfit: robe, feet: 'slippers', pad: {x: -30, y: 118, rot: -0.1},
    armL: {e: [-140, 180], h: [-70, 124], hand: 'grip', hr: -0.3}, armR: {e: [200, 250], h: [215, 400], hand: 'up', hr: 0}},
};

export const mom = {
  build: 'adult', unit: 0.23,
  face: {erx: 54, ery: 60, ey: 30, my: -80, lashes: true},
  hair: {style: 'bun', color: '#5a3f47'},
  outfit: {type: 'dress', color: '#bea361'},
  acc: {type: 'none'},
  defaults: {mode: 'stand', turn: -0.25},
  poses: M,
};
