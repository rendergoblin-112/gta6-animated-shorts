// Where do key world points land in each camera view? Frame is x -540..540, y -960..960 (9:16), k = px per cm.
// Use it to aim cameras BEFORE rendering: anything outside the frame or 'behind' is off-camera.
//   node tools/views.mjs              (all views x set anchors + project.points)
//   node tools/views.mjs couch3q      (one view)
import path from 'node:path';
import {ROOT, loadProject} from './lib.mjs';

const {project} = await loadProject();
const draw = await import(path.join(ROOT, 'src', 'engine', 'draw.js'));
const [W, H] = project.size || [1080, 1920];
draw.setResolution(W, H);
const {setPalette} = await import(path.join(ROOT, 'src', 'engine', 'palette.js'));
if (project.palette) setPalette(project.palette);
const {View} = await import(path.join(ROOT, 'src', 'engine', 'set3d.js'));
const set = typeof project.set === 'function' ? project.set() : project.set;
const PTS = {...(set.anchors || {}), ...(project.points || {})};
const only = process.argv[2];
for (const [name, v] of Object.entries(project.views)) {
  if (only && name !== only) continue;
  const V = new View(v);
  console.log(`${name}:`);
  for (const [k, p] of Object.entries(PTS)) {
    const r = V.place(p);
    const inside = r.k > 0 && Math.abs(r.x) <= W / 2 && Math.abs(r.y) <= H / 2;
    console.log(`  ${k.padEnd(14)} ${r.k > 0 ? `(${r.x.toFixed(0)}, ${r.y.toFixed(0)})  k ${r.k.toFixed(2)}` : 'behind camera'}${r.k > 0 && !inside ? '  OFF FRAME' : ''}`);
  }
}
