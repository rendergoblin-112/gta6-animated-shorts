# Characters and acting

## Proportions (measured, ±2.5% of frame)

Use these for **your own** characters. They are proportions, not a design.
- **Big round head**, slightly wider than tall (w:h ≈ 1.18). Head ≈ **32% of figure height**.
- **Two huge round eyes that touch**, each ~**37% of head width**, tiny black dot pupils (~20% of the eye), about 35% down from the top of the head. Nose = one short stroke. Mouth small and low. The face acts through eyes and mouth.
- **Off-white fill** (#d3d8d7–#f9faf2), tapered tube body, thin limbs, 4-finger cartoon hands.
- **One saturated signature prop on the hero** (headphones, cap, beanie…) covering **2–4% of the frame**, the only saturated thing in a room shot. Pick your own object and hue. The example uses green over-ear headphones (#16c76a).
- **Side characters** use the same head, eye and line rules plus **one muted colour block** (hair, a dress, a striped tee).
- Characters sit in the central 40–60% of the frame width, eye line at 25–45% of frame height (in 9:16, keep faces inside the central 4:5 band).

## A character is data

```js
// project/characters.js
export const hero = {
  build: 'kid',                    // 'kid' | 'small' (little sibling) | 'adult' (feet at -160, skirt/robe over thighs)
  unit: 0.17,                      // cm per drawing unit in the 3D set (kid 0.17, small ~0.15, adult 0.23)
  hair: {style: 'cowlick'},        // 'cowlick' | 'curl' | 'tuft' | 'bun' (+ color) | 'none'
  outfit: {type: 'none'},          // kid/small: 'none' | 'tee' | 'striped' (color, stripe) ; adult: 'dress' | 'apron' | 'robe' (color)
  acc: {type: 'headphones'},       // SIGNATURE: 'headphones' | 'cap' | 'beanie' | 'none' (color defaults to palette.accent)
  face: {lashes: false},           // optional eye geometry: erx, ery (eye radii), ey (eye height), my (mouth height), sep, lashes
  shoes: '#3b3734', skin: '#e4e6df', ears: true,
  defaults: {mode: 'sit', turn: -0.35, pad: {}},   // every pose starts from these (pad: {} = holds a controller)
  poses: {sit: {}, gloat: {...}, shock: {...}},
};
```

Units: head width 300, origin at the hips, +y up. Arms and the controller are torso-local (they lean with the torso), legs are hip-local.

**Builds have different body coordinates, so poses don't copy between builds unchanged.** Scale arm/hand y values by the shoulder ratio when you port a pose:

| | kid | small | adult |
|---|---|---|---|
| shoulder y | 226 | 186 | 292 |
| head centre y (standing / seated) | 356 / 356 | 312 / 312 | 450 / 420 |
| standing foot y | −296 | −232 | −160 (skirt covers thighs) |
| default arms (elbow / hand) | [±122,150] / [±64,98] grip | [±108,128] / [±58,86] grip | [±150,210] / [±110,150] fist |
| `unit` (cm per unit) | 0.17 | ~0.16 | 0.23 |

`examples/little-brother/characters.js` has a full `small` character (pleading, tugging, blocking the TV, tantrum, playing, offering, asleep); `examples/one-more-mission/characters.js` has a kid and an adult.

**What the rig can't draw yet** (stage around it): a back view (the face is always drawn; `turn` stops at ±1, so someone facing the TV has to be seen from the TV side), lying down (`rot` tilts the whole figure but `ground: true` assumes standing; place a lying character with `at` + `rot` by hand), clothing/hair follow-through, smear frames.

## A pose is data

| Field | Meaning |
|---|---|
| `mode` | `'sit'` (legs hang off the seat) · `'stand'` · `'peek'` / `'head'` (head only: peeking round a door, popping up behind a couch) |
| `turn` | −1…1, the 3/4 view: features slide, far eye narrows, far headphone cup hides. −0.35 = facing screen-left |
| `lean` | torso lean (radians). `dx, dy, sx, sy, rot` move/squash/rotate the whole figure |
| `tsx, tsy` | torso squash (breathing uses these) |
| `expr` | expression name (below). `look: [x, y]` overrides the pupils. `blink: true` |
| `head` | `{dx, dy, rot, s, sy}` head offset, tilt, scale, vertical squash |
| `armL / armR` | `{e: elbow [x,y], h: hand [x,y], hand: shape, hr: hand rotation, hs: hand scale, flip, prop, pr, propBehind, hide}` |
| `legL / legR` | `{h: hip, k: knee, f: foot, hide}` (defaults depend on mode and build) |
| `pad` | controller `{x, y, rot, s}`, or `null` for empty hands |
| `handsFront` | draw hands over the face (grabbing his head) |
| `outfit` | change outfit for this pose: `'apron'` or `{type: 'robe', color}` |
| `acc` | `false` hides the signature prop; `{type, color}` puts one on (the twist: mom wearing his headphones: `phones: true`) |
| `curlers`, `dust`, `feet: 'slippers'` | extras |

**Expressions** (`src/engine/face.js`, shared by everyone): neutral, eager, happy, sweet, concentrate, grinEvil, sneaky, smug, gamer, determined, peek, pleading (puppy eyes with sparkles), annoyed, confused, stern, huff, angry, furious, shock, shockBlood, panic, rage, scream, tantrum (eyes squeezed > <, tear streams), despair, tired, dizzy, asleep. Add new ones to `EXPR` in face.js: an expression is eye fields + a mouth (`line, smile, frown, o, open, grin, smirk, tongue, gritted, wobble, scream, pout`).

**Hand shapes**: open, claw, flat, fist, point, up (one finger up), grip, hold, steeple.
**Props** (`src/engine/props.js`): pad, ladle, broom, slipper, pot, phone, gamebox, cup. A prop is a small drawing function; add your own.

## How they act (so they're not stiff)

These came out of the fix rounds, each one after a side-by-side still check looked worse than the top shorts:

1. **Act with the whole body, not just the face.** Bounce on the couch with squash on landing, lean in when the mission starts, jump out of your skin (stretch up, then squash on landing), flop back, crack knuckles, grab the head and shake it, get blown back and nearly fall off the couch (legs in the air, one hand clinging). A face swap on a frozen body reads as clip-art.
2. **Every expression gets its own head tilt** (−0.16…+0.14 rad) and the characters sit in **3/4 (`turn` ≈ −0.35)**, not dead-frontal. Frontal + symmetric looked lifeless next to the references.
3. **Expressions are swapped drawings**, never tweened. Body poses are keyed and interpolated, but time is **stepped at 12 fps** (`track` in anim.js), so it reads as drawn-on-twos limited animation with many drawings.
4. **Idle life on everyone**: breathing, blinks and a tiny head fidget, stepped at 8 fps (`idle`, on by default). Turn it off (`idle: false`) for shock jumps and screams, which should snap.
5. **Two-drawing alternation** for frantic action: fists pumping, flailing, mashing, screaming (`alt: {fps: 12, poses: ['a', 'b']}` or `mash: true`).
6. **Entrances are performed**: the door bangs open, a 4-drawing walk cycle with body bob and arm swing brings the character in (`walk: {t0, t1, path}`), then a stomp with knee lift, squash, dust puffs and a camera jolt (`shake: [[t, 0.2, 0.01]]`). A character who just appears standing in the doorway reads as a pose swap.
7. **The obstacle gets closer each loop** (doorway → beside the couch → looming behind it → full-frame face) and **angrier** (brows are the anger meter: stern → angry → furious → rage).
8. **A seated character must read as sitting**: thighs along the seat toward the camera, shins hanging, feet just off the floor (the `'sit'` legs do this). Straight legs from the hips read as standing in front of the couch.
9. **Hands are real 4-finger hands** in shapes, not mittens. In POV shots the hero's hands and the whole controller must be in frame.
10. **The signature prop is a storytelling tool**: moving it to another character is a twist you can read in one frame.

## Traps hit while building (already fixed in the engine; don't reintroduce)

- A mirrored character (`flipX` / `scale.x = -1`) lost every outline: line materials need `side: DoubleSide`.
- One smoothed tube for a bent arm folds into pointy slivers: limbs are two inked segments.
- A fully outlined eye with a lid over it looks like goggles: only the visible part of a lidded eye is outlined.
- The cowlick showed through the headphone band: hair strokes are drawn after the band.
- A peeking head with its only visible eye half-lidded reads as a blank sleepy eye: use the `peek` expression (looks into the room) and show one full eye.
- A tiny character in a wide reads as a smudge. If the action matters, get closer or scale the character up (`unit`).
