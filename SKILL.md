---
name: gta6-animated-shorts
description: Turn a one-line joke into a ~35-second vertical 2D cartoon short in the measured format of the top GTA 6 cartoon shorts (flat hand-drawn look, thick ink, one repeated obstacle, rage peak, twist at ~92%, short button, a sound on every beat), drawn entirely with code in three.js and encoded with Remotion. Use when the user says "make a GTA 6 cartoon short", "animated short", "cartoon short about GTA 6", "turn this joke into a short", "make a short like 'When you...'", or wants a new joke animated with this engine, its characters, camera angles, night look, sound cues or still check.
---

# GTA 6 animated shorts

Type a joke, get a short. Everything on screen is drawn with code (three.js): the room, the characters, the TV and the game on it. Remotion steps frames and encodes. The engine is generic: **a new joke = a new `project/` folder** (characters, shot list, screen texts), not new engine code.

`SKILL_DIR` below means the folder this SKILL.md is in.

## Read first (in this order, as you reach each step)

| File | When |
|---|---|
| `references/joke-writing.md` | step 1: the beat sheet |
| `references/format.md` | the measured numbers every rule comes from |
| `references/characters-and-acting.md` | step 3: designing and posing characters |
| `references/camera.md` | step 4: views, angles, moves |
| `references/colour-and-night.md` | step 4: palette, time of day, the night look |
| `references/engine.md` | steps 3–5: the exact data format (shots, actors, screens, sets) |
| `references/sound.md` | step 6: cue sheet and mix |
| `references/still-check.md` | step 7: the side-by-side check before rendering |
| `references/rockstar-safe.md` | always: what may never appear |
| `examples/one-more-mission/` | a complete project: kid + mom (adult build), 28 shots, 7 camera views |
| `examples/little-brother/` | a complete project: two kids (kid + `small` build), POV poke/snatch, someone blocking the TV, screen cards, 27 shots |

## Requirements

Node 18+ and ffmpeg on PATH (`FFMPEG=/path/to/ffmpeg` if not). An ElevenLabs key is optional: without it, the synthesized sound kit is used.

## Workflow

### 1. Write the beat sheet (no code yet)
Fill the table in `references/joke-writing.md` for the user's joke: want, premise on screen by ~1 s, gloat, **one obstacle repeated 4 times (getting closer, angrier and faster)**, rage peak at ~0.6, fallout, setup, **twist at ~92% that undercuts the want**, a 1.3 s button. Title it "When you…". Pick the hero's **signature prop and colour** (one saturated hue) and design side characters as the same rig plus one muted colour block. Show the user the beat sheet in a few lines and continue unless they object.

### 2. Make a working folder
```bash
node SKILL_DIR/template/tools/new-short.mjs ./<slug> --from one-more-mission   # or --from little-brother (closest cast wins)
cd <slug> && npm install
npm run sfx:synth          # builds the sound kit (sfx/synth/)
```
This copies the engine plus the example project into `<slug>/project/`. You will rewrite the three project files.

### 3. Cast: `project/characters.js`
Defs + pose libraries (`references/characters-and-acting.md`). Start from the example poses (`bounceUp`, `land`, `gloat`, `leanIn`, `mash`, `shockJump`, `shockLand`, `frozen`, `grabHead`, `flop`, `fallA/B`, `tipA/B`, `peek`; the little-brother example adds `plead`, `tug`, `block`, `tantrumA/B`, `offer`, `asleep`, `shield`, `slump`, `scream`) and add what the joke needs. Builds: `kid`, `small` (little sibling), `adult`; they have different body coordinates (table in the reference), so scale ported poses. Whole-body acting, 3/4 turn, a head tilt per expression, two-drawing alternation for frantic moments.

### 4. Set, views, screens: `project/index.js`
Use `livingRoom` (couch + TV + door) unless the joke needs another room (copy `src/sets/livingRoom.js`). Pick 5–7 views mixing 3/4, low, high and POV (`references/camera.md`). Put every on-screen word in `screens` (title, menu, banners, cards). Rockstar-safe: plain hand-lettered "GTA 6", no logos.

### 5. Shot list: `project/shots.js`
One entry per shot with `type`, `beat` (`premise`, `obstacle` + `loop`, `rage`, `twist`, `button`), duration, setup, light, camera, actors, screen/POV, **and its sound cues** (`references/sound.md` cue sheet: every action and reaction gets one). Then:
```bash
npm run check              # must end with 0 FAIL; fix WARNs unless you have a reason
```

### 6. Sound
The synthesized kit covers every name in `references/sound.md`. For new effects or real voices: add them to `sfx/manifest.json` and run `npm run sfx:gen -- --missing --max N` with `ELEVENLABS_API_KEY` in the environment (never in a file). Calls are logged to `SOUND_LOG.md`.

### 7. Still check: stills first, always (`references/still-check.md`)
```bash
npm run stills && npm run sheet -- out/sheet_r1.jpg --cols 10 --w 200 out/stills
```
Open the sheet and look. Put key stills side by side with what you're aiming for (`npm run pair`), run `npm run keys && npm run sheet -- out/keys_r1.jpg --cols 9 --w 160 out/keys` and look at the acting, `npm run metrics` for colour, `npm run views` for framing. Fix, log the round in `BUILD_NOTES.md`, repeat until a round finds nothing.

### 8. Render, mix, mux
```bash
npm run render             # wrap in a render lock if the machine is shared (e.g. `renderlock npm run render`)
npm run mix                # must report ~-14 LUFS, <= 5% silent windows, longest gap <= 1.5 s
npm run mux -- out/short.mp4
```

### 9. Final check and honest notes
Extract 1 fps frames from the mp4, sheet them, look. Write in `BUILD_NOTES.md`: the shot list, each choice and the rule it follows, every fix round, and **what still looks worse** than the shorts you're aiming at. Tell the user the file path, the length, and the honest weak spots.

## Non-negotiables

- 33–38 s, 9:16, story from frame 1, ends on the button: no logo, no end card.
- Premise ("GTA 6" on a screen) readable by ~1 s. Hard cuts only. ~1.3 s per shot.
- One obstacle, 4–7 repeats. Rage peak 0.55–0.7 with the only shake shots. Twist ≥ 0.88. Button 0.9–1.5 s.
- No dialogue, no subtitles; text only on screens/clocks. Wordless voice sounds are fine.
- Flat fills, 8 px warm-black ink, muted room, **one** saturated accent (2–4% of frame), fire card only at the rage peak, night dim and warm.
- Stills before any full render. Rockstar-safe rules. Nothing from other creators.
