# Camera

## Moves (measured over 178 shots of the top shorts)

The moves are digital moves on a held drawing, not a dolly.

| Move | Share | Size | Duration | Easing | Engine |
|---|---|---|---|---|---|
| **Static** | **66%** | < 3% zoom, < 6% pan | ~1.45 s | none | (no `move`) |
| **Pull-out** | 12% | −12% scale | ~1.17 s | fast start, long settle (easeOutQuad) | `move: 'pull'` (zoom ×1.136 → ×1) |
| **Push-in** | 10% | +11.8% | ~1.12 s | near-linear, soft middle | `move: 'push'` |
| **Shake** | 6% | RMS 1.8% of frame width, ≥ 4 direction flips | ~0.98 s | random per frame | `move: 'shake'` (±3.1% uniform) |
| Pan/tilt | 6% | ~10% of width | ~1.47 s | ease-out | (frame it with `cam.x/y`) |

Rules:
- **≥ 55% of shots locked off.**
- **At least one push-in, one pull-out and one shake** per short.
- **Shakes ≤ 10% of shots, only at the rage peak and the button.** Small impact jolts (a stomp) use `shake: [[t, 0.2, 0.01]]`; they don't count as shake shots.
- **Pull-outs on the opening shot and on the reveal (twist). Push-ins on realisation, gloating and sneaky faces.**
- Hard cuts only.

## Angles (the 3D set gives you real ones)

Sets are 3D (cm) and projected through perspective cameras, then drawn flat with 8 px ink. A **view** is a camera setup:

```js
views: {
  couch3q:  {pos: [-160, 112, 70], target: [5, 82, 380], fov: 64, fg: ['armL']}, // 3/4 on the couch: most character shots
  tvPov:    {pos: [0, 118, 340], target: [0, 80, 0], fov: 74},                   // the hero's eyes looking at the TV
  couchLow: {pos: [40, 52, 225], target: [0, 175, 430], fov: 72},                // LOW angle: someone looming over the couch
  highCorner: {pos: [-120, 240, 60], target: [60, 40, 400], fov: 62},            // HIGH angle wide: door + couch + hero in one frame
  doorway:  {pos: [-150, 110, 420], target: [190, 100, 600], fov: 54},           // 3/4 on the door: peeking
  nightPov: {pos: [190, 140, 575], target: [40, 60, 250], fov: 62},              // from the door toward couch + TV
  behindLow: {pos: [310, 40, 595], target: [-20, 80, 250], fov: 66},             // low, behind the couch: sneaking
}
```

`fg: ['armL']` lifts a named set piece onto the foreground layer for that view (the couch arm in front of the hero). Each shot then frames inside its view with `cam: {at: [x,y,z] | 'anchor', zoom, x, y, dy}`.

Use a mix: the measured shorts are drawn from oblique angles with perspective. An all-frontal film reads stiff and "vector clip-art".

## Framing in 9:16

- Couch shots show the **whole seated hero, head to dangling feet**, so the body acting has room.
- POV shots stack TV, cabinet, controller and knees vertically.
- Wides use the height for the door and hallway, or floor and ceiling.
- Keep faces and the screen inside the central 4:5 band.
- Avoid big empty floor areas in wides (bottom 30–40% of a frame with nothing in it): reframe with `cam.y/zoom`.

## Aim cameras with numbers before rendering

`npm run views` prints where every set anchor (and `project.points`) lands in every view at zoom 1: screen x/y (frame is x ±540, y ±960) and px-per-cm `k`. Anything `OFF FRAME` or `behind camera` won't be seen. Add your own points to `project.points` (a character's head, a peek spot) and check them.

## Traps hit while building

- The TV overflowed the frame in POV shots → widen the fov (62 → 74).
- An open door leaf swung toward the camera and hid the peeking hero → hinge on the far jamb, open flat against the wall (`door: 2.9`).
- Projecting the screen from points behind the camera made garbage wedges → the engine skips an off-camera screen.
- A low angle hid the looming parent up to the eyes behind the couch back → lower the couch back, raise the camera a little, scale the character for that one shot (`unit`).
- Several cameras put people off-frame → check with `npm run views` first.
