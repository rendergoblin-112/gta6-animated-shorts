// Rename Remotion's element-XX images so every frame says which shot it is:
//   stills: NN_<shotId>.png      keys (--keys): NN_<shotId>_a|b|c.jpeg (start / middle / end of the shot)
import fs from 'node:fs';
import path from 'node:path';
import {loadProject, ls} from './lib.mjs';

const dir = process.argv[2] || 'out/stills';
const keys = process.argv.includes('--keys');
const {T} = await loadProject();
const names = keys ? T.shots.flatMap((s) => ['a', 'b', 'c'].map((k) => `${s.id}_${k}`)) : T.stillNames;
const files = ls(dir, /^element-\d+\.(png|jpe?g)$/);
for (const old of ls(dir, /^\d+_.+\.(png|jpe?g)$/)) fs.rmSync(old); // frames from an older edit
files.forEach((f, i) => fs.renameSync(f, path.join(dir, `${String(i).padStart(2, '0')}_${names[i] || 'x'}${path.extname(f)}`)));
console.log(`named ${files.length} ${keys ? 'key frames' : 'stills'} in ${dir}`);
