// Side-by-side still check: two images at the same height, labelled. This is the core of the still check:
// put YOUR still next to the frame you are aiming for (your own previous short, your own sketch, an earlier
// version) and fix whatever looks worse BEFORE rendering. See references/still-check.md.
//   node tools/pair.mjs out/compare/01_hook.jpg aim.png out/stills/00_C1.png ["AIM"] ["OURS"] [--h 760]
import {FFMPEG, run} from './lib.mjs';
import {label} from './sheet.mjs';

const a = process.argv.slice(2);
const hi = a.indexOf('--h'); const h = hi >= 0 ? +a.splice(hi, 2)[1] : 760;
const [out, left, right, la = 'AIM', lb = 'OURS'] = a;
if (!out || !left || !right) { console.error('usage: pair.mjs out.jpg left.png right.png [labelLeft] [labelRight] [--h 760]'); process.exit(1); }
const fc = `[0]scale=-2:${h}${label(la, 22)}[a];[1]scale=-2:${h}${label(lb, 22)}[b];[a]pad=iw+10:ih:0:0:color=0x1e1e1e[a2];[a2][b]hstack=inputs=2[out]`;
run(FFMPEG, ['-y', '-v', 'error', '-i', left, '-i', right, '-filter_complex', fc, '-map', '[out]', '-frames:v', '1', '-q:v', '3', out]);
console.log('saved', out);
