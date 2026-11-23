// Export the sound cues from the shot list to out/cues.json (absolute times), so the mix follows every edit.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, loadProject, findSound} from './lib.mjs';

const {project, T} = await loadProject();
const {exportCues} = await import(path.join(ROOT, 'src', 'engine', 'timeline.js'));
const J = exportCues(T);
J.bed = project.bed || 'bed';
J.bedGain = project.bedGain ?? -12;
const missing = [...new Set([J.bed, ...J.cues.map((c) => c[1])])].filter((n) => !findSound(n));
fs.mkdirSync(path.join(ROOT, 'out'), {recursive: true});
fs.writeFileSync(path.join(ROOT, 'out', 'cues.json'), JSON.stringify(J));
console.log(`${J.cues.length} cues over ${J.dur.toFixed(2)} s -> out/cues.json`);
if (missing.length) {
  console.error(`MISSING SOUNDS: ${missing.join(', ')}\n  fix: add them to sfx/manifest.json and run  npm run sfx:gen -- --only ${missing.join(',')}\n  or drop your own file at project/sfx/<name>.mp3, or use a name from sfx/synth/.`);
  process.exit(1);
}
