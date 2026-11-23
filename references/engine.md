# Engine reference: a short is a project/ folder

Everything visible is drawn with code in three.js (sets, characters, the screen and the game on it). Remotion only steps frames and encodes. The engine (`src/`) is generic; a new joke changes only `project/`:

```
project/
  index.js        the project object (below)
  characters.js   character defs + pose libraries   (characters-and-acting.md)
  shots.js        the shot list
  sfx/            optional sounds for this short only (name.mp3)
```

## project/index.js

```js
import {livingRoom} from '../src/sets/livingRoom.js';
export default {
  title: 'When you ...',
  size: [1080, 1920], fps: 30,
  palette: {accent: '#16c76a'},          // override any key of src/engine/palette.js
  lights: {},                            // optional extra/override light modes (draw.js LIGHT)
  hero: 'kid',                           // whose knees/hands appear in POV shots
  characters: {kid, mom},
  set: () => livingRoom({clock: {day: '12:30', night: '3:00'}}),   // a function, called after the palette is applied
  views: {couch3q: {pos, target, fov, fg: ['armL']}, ...},          // camera setups (camera.md)
  cards: {fire: {type: 'fire'}, clock: {type: 'clock', text: '3:00', sub: 'AM'}, white: {type: 'solid', color: '#fff'}},
  screens: {title: {text: 'GTA 6', sub: 'PRESS START'}, menu: {...}, banners: {...}, cards: {...}, money: '$ 4,250'},
  points: {kidHead: [-45, 120, 352]},   // extra named points for `npm run views`
  bed: 'bed', bedGain: -12,              // music bed name and level
  shots,
};
```

## A shot

```js
{id: 'C2', type: 'C', beat: 'obstacle', loop: 2, n: 'what happens (for notes)', d: 1.1,
 setup: 'couch3q',                 // a view name or a card name
 light: 'day',                     // day | afternoon | evening | night
 cam: {at: [x,y,z] | 'anchor', zoom: 1.9, x: 0, y: 0, dy: -60},
 move: 'push',                     // pull | push | shake | (none = static)
 shake: [[t, dur, amp]],           // small impact jolts inside the shot
 door: 1.55,                       // door angle (0 closed, 1.6 open, 2.9 flat against the wall); value, fn(t) or keys
 actors: [...],                    // array or fn(t) -> array
 screen: {state: 'drive', banner: 'missionStart'},   // value, fn(t) or keys
 pov: {lean: 1, mash: true},       // the hero's hands + controller overlay (POV shots); value, fn(t) or keys
 sfx: [[0.1, 'boing', -2]],        // [t, name, dB]
 duck: [0, 0.9], bed: 'night', still: 0.6}
```

`type`: C character · P screen POV · W wide · I insert · R rage card · T twist · B button. `beat`: premise · obstacle (+ `loop`) · rage · twist · button. `npm run check` reads both.

Any dynamic field can be a **value**, a **function of local time** `(t) => ...`, or a **key list** `[[t, value, ease?], ...]` (ease: io default, lin, out, in, back, snap, hold).

## An actor

```js
{who: 'kid',                    // a character id, 'hand' (floating hand) or 'prop' (a loose prop, e.g. a controller changing hands)
 at: 'seatL' | [x, y, z],       // HIPS position in the set (cm); in mode 'peek'/'head' it is the HEAD CENTRE. Value, fn(t) or keys
 ground: true,                  // `at` is a floor point: lift by the leg length (standing characters)
 scr: [x, y, scale],            // OR a fixed screen position (cards: the rage close-up)
 layer: 'front',                // outside | hall | room | door | behind | mid (couch) | front | fg | top | overlay; or keys
 pose: 'gloat' | ['gloat', {overrides}] | {fields},
 keys: [[0, 'sit'], [0.2, ['gloat', {head: {rot: 0.1}}]], [0.5, 'shock', 'hold']],   // acted keys, stepped at 12 fps
 alt: {fps: 12, poses: ['rageA', 'rageB']},    // two-drawing alternation
 walk: {t0, t1, path: [[x,0,z], ...], rate: 8},   // 4-drawing walk cycle along floor points
 with: {...} | (t) => ({...}),  // extra pose fields merged on top
 mash: true,                    // controller jitter
 idle: true | false | {blink: false, breathe: 0.5},
 from: 0.3, until: 1.25,        // visible only in this window of the shot
 unit: 0.27,                    // override the character's scale for this shot
 tag: 'glow', flipX: false}
// floating hand: {who: 'hand', at, layer, kind: 'grip', rot, flip, s, owner: 'kid' (whose skin colour)}
// loose prop:    {who: 'prop', prop: 'pad', at, layer, rot, s, flip}   (rot may be fn(t)/keys: a controller flying across)
// walk extras:   walk: {..., dir: 1 | -1, stride: 60}
```

### Layers: draw order, not depth

Characters are flat drawings placed in a 3D set, so **you choose what is in front** with `layer`. Back to front: `outside` (sky, hallway seen through the door) · `hall` · `room` (walls, floor, TV wall furniture) · `door` (the door leaf) · `behind` (someone behind the couch) · `mid` (**the couch**) · `front` (someone sitting on or in front of the couch) · `fg` (set pieces a view lifts forward with `fg: [...]`, and anyone who must cover them) · `top` · `overlay` (the POV hands). Inside one layer, actors draw in array order: **put the farther actor first** (two kids on the couch: the one farther from the camera first). The same actor can need a different layer per view (in front of the TV in `tvPov` = `front`; walking in from the hallway = keys `[[0, 'hall'], [0.5, 'behind']]`).

### livingRoom anchors (cm)

| Anchor | Point | Note |
|---|---|---|
| `seatL` | [-45, 60, 352] | left cushion hips (the hero). In `couch3q` this appears on the **screen-right**: world +x is screen-left in that view |
| `seatR` | [50, 60, 352] | right cushion hips |
| `couchArmR` | [118, 74, 352] | |
| `behindCouch` | [40, 0, 430] | floor (use `ground: true`) |
| `doorway`, `hallway` | [195, 0, 600], [195, 0, 820] | floor |
| `tvFront` | [0, 0, 120] | floor between couch and TV |
| `tvCenter`, `clock` | [0, 125, 30], [78, 39, 56.5] | |

Head point of a seated character (for `cam.at`): `[x, seatY + headYSit × unit, z]`. Kid: headYSit 356, unit 0.17 → seatL head ≈ [-45, 120, 352]. Small: 312 × 0.16 → seatR head ≈ [50, 110, 352].

## The POV overlay (the hero's own hands and controller)

`pov: {...}` on a screen shot draws the hero's knees, arms, hands and controller over the frame.

| Field | Effect |
|---|---|
| `lean` 0..1 | leans in toward the screen (bigger, higher) |
| `bounce` px | bounces the hands (excited) |
| `mash: true` | thumbs mash: the controller jitters at 12 fps |
| `press: true` | a pointing thumb presses a button |
| `drop: true` | hands sink (defeat) |
| `empty: true` | no controller: open hands (`tremble: true` shakes them) |
| `knees: false` | hide the knees |
| `poke` 0..1 | someone else's arm reaches in and presses a button (0 = out of frame, 1 = finger on the button) |
| `snatch` 1 / 2 / 3 | someone's hand clamps the controller / pulls it away / gone (hero left with trembling open hands) |
| `grabber` | the other arm for poke/snatch: `{sleeve, cuff, skin, from: 'left' or 'right', width, handScale}`. Defaults are adult-sized (width 260, handScale 3.5); a small child: width ~150, handScale ~2.6 |

## The screen (TV / phone)

States: `'title'` (sunset + `screens.title.text`, PRESS START blinks with `blink: true`), `'menu'`, `'drive'` (the sunny road, car, minimap, cash), `'off'`, `'card'` (`card: 'id'`, full-screen). `banner: 'id'` overlays a banner on drive or card. `offAt: t` switches the TV off with a CRT collapse. Banners and cards are data:

```js
banners: {paused: {dim: true, lines: [{text: 'PAUSED', y: 330, size: 110, color: '#ffffff'}], button: {text: 'RESUME', y: 190}}},
cards:   {theEnd: {bg: '#1d2036', confetti: true, stars: 5, lines: [{text: '100% COMPLETE', y: 360, size: 96, color: '#9dff8a'}]}},
```

The screen is 1024×576 with y up. A line is `{text, y, x (default 512), size, color, stroke, rot, font}`; banners/cards also take `stars`, `starsY`, `button: {text, y, color}`, `dim` (banners), `confetti` (cards). `money: null` hides the cash counter on the drive screen. Hand-lettered fonts only (rockstar-safe.md).

**A shot without `screen` shows the state the previous screen shot ended on** (deterministic, so stills match the video). Give `screen` to any shot where the TV is visible and should show something else.

## Sets

`src/sets/livingRoom.js` is the shipped set: couch facing a TV, a door to a hallway, a window, a lamp, a plant, a clock. A set is a list of items: `quad` (with `normal` = only drawn when facing the camera, `holes`), `box`, `cyl`, `floorEllipse`, `lines`, `tube`, `plant`, `screen` (shows the screen render target), `clock` (digits per light mode), `group` (depth-sorted pieces with `name`s a view can lift to `fg`). Colours are hex or palette keys. Copy the file to build a bedroom or a desk.

## Commands

| Command | What |
|---|---|
| `npm run check` | format numbers vs the measured shorts |
| `npm run stills` / `npm run keys` | still per shot / 3 acting keys per shot |
| `npm run sheet -- out.jpg --cols N --w PX <folder or images>` | contact sheet |
| `npm run pair -- out.jpg aim.png ours.png AIM OURS` | side-by-side |
| `npm run metrics` | colour metrics vs measured medians |
| `npm run views [view]` | where anchors land in each camera |
| `npm run sfx:synth` / `npm run sfx:gen -- ...` | build the synthesized kit / generate ElevenLabs effects |
| `npm run mix` | export cues + mix to out/mix.wav (+ loudness/silence/gap report) |
| `npm run render` | full video to out/video.mp4 |
| `npm run mux -- out/short.mp4` | video + mix → final file |
| `npm run studio` | Remotion studio for scrubbing |
