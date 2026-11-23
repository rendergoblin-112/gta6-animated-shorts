# Colour, light and the night look

## Palette rules (measured)

| Rule | Measured | Follows |
|---|---|---|
| **Muted, desaturated backgrounds** (grey-green, khaki, grey-blue) | mean HSV saturation median **41.8/255** (others 89) | ≤ 56: 11/19 · 9/10 · 5/5 |
| Mid-light exposure | mean luma **130/255** | |
| Warm-neutral balance | warm share 0.63 | |
| **Lighter on top, darker at the bottom** (light wall, darker floor) | top-third ÷ bottom-third luma **1.26** | > 1: 16/19 · 9/10 · 4/5 |
| No vignette | border ÷ centre luma ≥ 1 | 10/10 |
| **One saturated accent at 2–4% of the frame** (the hero's prop) | 9/10 palettes | |
| **Saturation spikes only at the emotional peak** (fire card behind the rage) | #f05a20 → #f7a23a | 3/10 |
| Screens are the brightest elements | #f4f7f6 white pages, saturated game art, #050505 black | 10/10 |
| Flat fills, no gradients, no shadows, ~290 colours per frame, contrast p95−p5 ≈ 189 | | |

Starter palette (in `src/engine/palette.js`; override in `project.palette`):

```
wall      #b6bca6  grey-khaki green      floor     #6f665b  darker bottom
couch     #8a7a6f  taupe                 character #e4e6df  off-white
ink       #100d0c  warm near-black       accent    ONE saturated hue (example: #16c76a green)
screen-on #f4f7f6                        fire card #f05a20 / #f7a23a / #ffd166
```

The engine has no lighting model. Colour management is off, tone mapping is off: the hex you write is the hex you get.

## Time of day = flat tints

Each shot has `light: 'day' | 'afternoon' | 'evening' | 'night'`. A tint multiplies the flat colours per layer tag: `bg` (the set), `char` (characters), `glow` (characters lit by a screen: put `tag: 'glow'` on the actor). The window sky and the cabinet clock change with the light. Time skips read through relighting plus the clock (12:30 → 4:45 → 9:10 → 3:00).

## The night look: dim and warm, NOT dark and blue

The first night pass went blue and dark: saturation ~110, luma ~65, contrast ~120. On a phone it was unreadable, and the measured shorts **never go dark**: they stay mid-light. The fix that worked:

```js
night: {bg:   [0.60, 0.57, 0.58,  0, 0, 0.01],   // room dimmed, a hair warm
        char: [0.86, 0.84, 0.84,  0, 0, 0],      // characters brighter than the room
        glow: [0.97, 0.94, 0.90,  0.01, 0, 0]}   // characters near the TV: almost day-bright, warm
```

- Keep the window sky a small dark blue patch: that alone says "night".
- Light the characters brighter than the room, and the ones by the screen brighter still (`tag: 'glow'`).
- Night saturation went from ~63 to ~43, close to the measured 42. Night luma ~100.
- `npm run metrics` flags stills with luma < 85 as **TOO DARK for a phone**. Shots that are mostly a dark wall plus half a head will still read slowly: give the night shots a bright subject (the TV, a lit face) and fill the frame with it.

- **Screens at night stay bright.** A dark navy "GAME COMPLETE" card inside a night room made the twist frame luma 68: the punchline would be the darkest frame of the film on a phone. A pale card (#fff3d6) with dark-outlined coloured text fixed it. Zoom in on the screen for a screen twist (`cam: {zoom: 1.3}`) so the text is phone-readable.

## Checking colour

`npm run metrics` prints, per still and as a median, the same metrics as the study: saturation, luma, contrast, top/bottom, flat-fill share, distinct colours, accent share. Targets are printed under the table. The example's 28 stills give median saturation 45.5, luma 128, contrast 195, top/bottom 1.30, flat 0.75.
