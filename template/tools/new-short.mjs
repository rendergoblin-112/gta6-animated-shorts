#!/usr/bin/env node
// Make a working folder for a new short: a copy of the engine template + a starter project.
//   node <skill>/template/tools/new-short.mjs <dest-folder> [--from one-more-mission]
// Then: cd <dest-folder> && npm install && npm run sfx:synth && npm run check
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.resolve(here, '..');
const EXAMPLES = path.resolve(TEMPLATE, '..', 'examples');
const args = process.argv.slice(2);
const dest = args.find((a) => !a.startsWith('--'));
const fromIdx = args.indexOf('--from');
const from = fromIdx >= 0 ? args[fromIdx + 1] : 'one-more-mission';
if (!dest) { console.error('usage: new-short.mjs <dest-folder> [--from <example>]'); process.exit(1); }
const D = path.resolve(dest);
if (fs.existsSync(path.join(D, 'project'))) { console.error(`${D}/project already exists; refusing to overwrite`); process.exit(1); }
const skip = new Set(['node_modules', 'out', 'project', '.DS_Store']);
const copy = (a, b) => {
  fs.mkdirSync(b, {recursive: true});
  for (const e of fs.readdirSync(a, {withFileTypes: true})) {
    if (skip.has(e.name)) continue;
    const s = path.join(a, e.name), t = path.join(b, e.name);
    if (e.isDirectory()) copy(s, t); else fs.copyFileSync(s, t);
  }
};
copy(TEMPLATE, D);
const ex = path.join(EXAMPLES, from);
if (!fs.existsSync(ex)) { console.error(`no example "${from}" in ${EXAMPLES}`); process.exit(1); }
fs.mkdirSync(path.join(D, 'project'), {recursive: true});
copy(ex, path.join(D, 'project'));
fs.rmSync(path.join(D, 'tools', 'new-short.mjs'));
console.log(`created ${D}\n  engine: src/   your short: project/ (started from examples/${from})\nnext: cd ${dest} && npm install && npm run sfx:synth && npm run check`);
