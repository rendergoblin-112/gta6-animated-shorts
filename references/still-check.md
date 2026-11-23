# The still check (before ANY full render)

A full render is minutes; a still set is ~40 seconds. Every problem in the example was found on stills, side by side, and fixed before the video was rendered. Do rounds until a round finds nothing.

## The loop

1. `npm run check`: 0 FAIL on the format numbers.
2. `npm run stills`: one still per shot at 60% of the shot → `out/stills/NN_<shotId>.png`.
3. `npm run sheet -- out/sheet_r0.jpg --cols 10 --w 200 out/stills`: **look at the sheet** (open the image). Does it read as a story left to right? Is every shot a clear picture?
4. **Side by side.** For each shot that matters (hook, gloat, first shock, each obstacle arrival, rage, twist, button, every screen POV), put your still next to the frame you're aiming for:
   `npm run pair -- out/compare/r1_hook.jpg aim/hook.png out/stills/00_C1.png AIM OURS`
   The "aim" frame must be **your own material**: your previous short, a sketch, an earlier version (`ba_` = before/after). Never put other creators' frames in the repo or ship them; if you look at a reference for yourself, keep it outside the project and only write down what is worse.
5. **Write down what looks worse** and fix it in the project files. Typical findings (all real, from the example):
   - the hero looks like he's *standing in front of* the couch, not sitting on it
   - hands or the controller cut off at the bottom of a POV shot
   - an insert frames nothing (the clock was hidden behind the TV bezel)
   - a character cut off at the frame edge, or too small to read
   - dead-frontal symmetric faces (give 3/4 turn + per-expression head tilt)
   - a prop that reads as a blob (the slipper read as a pink blob → sole + toe + pom-pom)
   - a mouth hidden behind furniture in the button shot
   - a grabbing arm that reads as a grey stick
   - the night section too dark/blue to read
6. `npm run keys` + `npm run sheet -- out/keys_r1.jpg --cols 9 --w 160 out/keys`: **acting key sheet**, 3 frames per shot (start / middle / end). Stills show poses; keys show whether the performance actually happens (an entrance that is invisible because the character is behind the couch the whole time, a jump that never leaves the seat).
7. `npm run metrics`: colour/contrast/luma per still against the measured medians. Fix TOO DARK and TOO SATURATED flags.
8. `npm run views`: if anyone is off-frame, re-aim the view.
9. Log the round in `BUILD_NOTES.md`: what was wrong → what you changed. Then go back to 2.

## Only then render

```bash
npm run render          # wrap in your render lock if several renders share a machine, e.g. renderlock npm run render
npm run mix && npm run mux -- out/short.mp4
```

## Final check (on the video itself)

Extract frames from the finished mp4 and make one last sheet: the encode, the cut timing and the audio sync are only provable on the real file.

```bash
mkdir -p out/final && ffmpeg -v error -i out/short.mp4 -vf fps=1 out/final/f_%02d.png
npm run sheet -- out/final_overview.jpg --cols 9 --w 160 out/final
```

Then write the honest comparison: what still looks worse than the shorts you are aiming at, in plain words. It is the most useful part of the notes for the next short.
