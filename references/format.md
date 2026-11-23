# The format, by the numbers

Measured on 19 animated GTA 6 cartoon shorts: 28,361 frames at 30 fps, every frame run through a cut, camera, colour and hold analysis, plus 350 shots checked by eye. The 10 best-performing shorts (all the ones in the tens of millions of views) share one template, and that template is the default here. Counts are written **all 19 / top 10 / top 5**.

Nothing from those shorts ships with this skill. Only the numbers do.

## The format in one paragraph

A vertical, flat, hand-drawn-looking 2D short, **33–38 s long**, with **no subtitles** and almost no words. A blank-faced character wants GTA 6. A screen (TV, phone, laptop) is shown in POV. The film **cuts between the character's face and the screen about every 1.3 s**. **One obstacle repeats 4–7 times**, getting worse each time. The character (or the obstacle) hits a **shaking rage close-up about 60% of the way in**. A fake success follows, then the **twist lands at ~92% of the runtime**, then a **~1.3 s reaction**, then a hard end. Muted colours, no shading, thick near-black outlines, and **one small saturated signature colour** on the hero.

## Length, frame, structure

| Rule | Measured | Follows |
|---|---|---|
| Length **33–38 s** (allowed 23–38) | top-10 median 33.8 s; top 5 are 32.8–37.5 s. Others median 67.5 s | ≤38 s: 12/19 · 10/10 · 5/5 |
| Vertical | top 2 are 4:5 (720×900), next 3 are 2:3, newest are 9:16 | 10/19 · 10/10 · 5/5 |
| **Story starts on frame 1**: no logo, no black, no title | intro 0 s | 17/19 · 10/10 · 5/5 |
| **No outro**: no end card, no credits; it ends on the reaction | top-10 outro median 0 s. Others median 6 s | 13/19 · 10/10 · 5/5 |
| One location (couch, desk or bed) plus the device POV | by eye | 10/10 |

This engine renders **1080×1920 (9:16)** at 30 fps. Keep the important action inside the central 4:5 band (roughly y −675…+675) so a 4:5 crop still works.

## Hook (first 3 seconds)

| Rule | Measured | Follows |
|---|---|---|
| **First shot ≤ 2.2 s, aim for 0.6–1.1 s** | top-10 median 1.10 s. Shorter first shot went with more views (ρ = −0.88, n = 10; partly confounded by upload age) | 13/19 · 10/10 · 5/5 |
| **Premise readable by 1.1 s, never later than 2 s**: "GTA 6" on a screen | top-10 median 1.06 s; top 5: 0.6–1.1 s | 10/19 · 7/10 · 5/5 |
| Shot 1 = the character already reacting (mouth open), camera moving (usually a pull-out) | zoom on shot 1: 11/19 · 8/10 · 5/5 | |
| Shot 2 = the screen POV with GTA 6 on it | 7/10 | |
| No spoken words in the hook | 8/10 | |

Recipe: `0.0–1.0 s` eager character, pull-out −12% ease-out → cut → `1.0–3.0 s` screen shows "GTA 6" → cut back to the reaction.

## Cuts and timing

| Rule | Measured | Follows |
|---|---|---|
| Average shot **1.3–1.8 s**, median shot ~1.3 s | top-10 ASL median 1.74 s, median shot 1.30 s. Pooled: 4% < 0.5 s, 22% 0.5–1 s, **47% 1–2 s**, 21% 2–4 s, 6% ≥ 4 s | ASL 1.2–2.1: 10/19 · 10/10 · 5/5 |
| **≥ 5 hard cuts per 10 s** | top-10 median 5.4. Others 2.6 | ≥4.5: 10/19 · 9/10 · 4/5 |
| **≥ 7 visual beats per 10 s** (cuts + big changes inside a shot, e.g. the screen flips) | top-10 median 7.7; correlated with views ρ = +0.64 | ≥6: 10/19 · 10/10 · 5/5 |
| **Alternate character (C) and screen (P) shots** | share of adjacent pairs that are C↔P: median **0.78**. Mix 47% C / 47% P | ≥0.65: 8/19 · 8/10 · 5/5 |
| Reaction shots shorter than screen shots | C median **1.07 s** (p25 0.87, p75 1.33); P median **1.93 s** (p25 1.23, p75 2.78) | pooled |
| Keep the pace level | median shot by quarter: 1.43 / 1.30 / 1.53 / 1.17 s | pooled |
| Hard cuts only. No dissolves, no wipes | none seen on any top-10 shot sheet | 10/10 |
| Time cards ("5 HOURS LATER") are rare and short | 2/10, 1.8–2.5 s | |

## Camera (details in camera.md)

66% of shots are locked off. Pull-out 12% of shots (−12% scale, easeOutQuad, ~1.2 s). Push-in 10% (+11.8%, near-linear, ~1.1 s). Shake 6% (RMS 1.8% of frame width, ~1 s, at the rage peak). At least one of each per short; shakes ≤ 10% of shots.

## The joke (details in joke-writing.md)

| Beat | Time in a ~35 s short |
|---|---|
| Want | 0–1 s |
| Premise on screen | 0.6–3 s |
| First shock (bulging eyes) | ~3 s (5/5 top shorts have it in the first 5 s) |
| Progress + gloat (evil grin, push-in) | 4–10 s |
| **Obstacle loop**: same obstacle 4–7× (median 4) | 10–25 s |
| **Rage peak** (scream close-up + shake) | 0.55–0.70 of runtime (median 0.6) |
| Collapse / insert | ~25–28 s |
| Fake success | ~27–31 s |
| **Twist** | **~92% of runtime** (≥ 85%: 14/19 · 7/10 · 5/5) |
| **Button** | last **0.9–1.5 s** (median 1.45 s; shorter went with more views, ρ = −0.76) |

## Words

| Rule | Measured | Follows |
|---|---|---|
| **≤ 25 spoken words**; most top shorts have none | word counts: 0 (×5), 2, 15, 22, 46 | 12/19 · 9/10 · 5/5 |
| If there is voice: short wordless or shouted interjections | 4/10 voiced | |
| **No burned-in subtitles** | by eye on all 350 shots | **19/19** |
| All text lives inside the scene (screens, store pages, countdowns, clocks), hand-lettered, no caption box | 11/19 · 10/10 · 5/5 | |

## Drawing

| Rule | Measured | Follows |
|---|---|---|
| Outline **0.7–0.9% of the short side ≈ 8 px at 1080** | median 0.74% | 14/19 · 10/10 · 5/5 (thicker went with more views, ρ = +0.52) |
| Ink near-black, slightly warm: **#100d0c** | max channel ≤ 35 | 10/10 |
| Flat fills, no gradients, no cast shadows | flat-fill share 0.74 (others 0.64) | ≥0.70: 13/19 · 10/10 · 5/5 |
| Few colours | ~290 distinct 4-bit colours per frame | |
| High contrast | luma p95−p5 = 189/255 | ≥175: 12/19 · 10/10 · 5/5 |
| **Limited animation: hold drawings** | ≥ 40% of runtime in holds ≥ 0.5 s (median 48%) | 9/19 · 8/10 · 5/5 |
| ≤ 10 new images per second | median 7.9/s | |

This engine deliberately departs on holds: characters breathe and blink on 8 fps steps and act on 12 fps steps, so nobody is ever frozen. It still reads as limited animation. If you want the measured look exactly, set `idle: false` and use fewer keys.

## Colour (details in colour-and-night.md)

Muted backgrounds (mean saturation ~42/255), mid-light exposure (luma ~130), lighter top than bottom (1.26), no vignette, one saturated accent at 2–4% of the frame, saturation spikes only at the rage peak (fire card), screens are the brightest things.

## Sound (details in sound.md)

Integrated loudness −16 to −9 LUFS (aim −14). A continuous bed: near-zero silence (≤ 5% of 33 ms windows below −45 dBFS). About 0.8 audio hits per second in the measured shorts; this skill goes denser (~2/s, a sound on every action) because it reads funnier on a silent-film-style short.

## How far to trust these numbers

- 10 of 19 shorts, and all of the top 7, are from one creator. The rules describe that winning template, not every creator.
- All correlations are Spearman on n = 10 or 19, 23 metrics, no correction. Treat them as hints.
- Upload age confounds views: the newest uploads had longer first shots and 9:16 frames *and* fewer views.
- The same animation got about **62× the views** re-uploaded with a "When you…" title. Title and timing can matter more than any visual metric.
- Audio was measured by level only (nobody listened). Words-per-second, caption absence and text position were checked by eye.
- `npm run check` encodes these targets. FAIL means outside what the top shorts do; WARN means at the edge.
