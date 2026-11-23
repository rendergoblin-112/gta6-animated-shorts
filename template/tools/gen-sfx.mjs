// Generate our own sound effects with ElevenLabs from sfx/manifest.json (or regenerate the shipped ones).
// The API key is read ONLY from the environment: export ELEVENLABS_API_KEY=...  (never commit it).
//   node tools/gen-sfx.mjs --only boing,kid_whine        generate these names
//   node tools/gen-sfx.mjs --missing                      every name the shot list uses that has no file yet
//   node tools/gen-sfx.mjs --add name "prompt" 1.2        add a new effect to the manifest and generate it
//   options: --max N (budget cap), --force (overwrite), --dry (print only), --out project/sfx (default sfx/eleven)
// Optional: --cmd /path/to/wrapper (or SFX_CMD=...) -> runs `wrapper "<prompt>" out.mp3 <seconds>` instead of calling the API
// (music: `wrapper --music "<prompt>" out.mp3 <seconds>`), for people who already have their own ElevenLabs wrapper.
// Every call is appended to SOUND_LOG.md (time, file, seconds, prompt, result).
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, loadProject} from './lib.mjs';

const a = process.argv.slice(2);
const flag = (k) => { const i = a.indexOf(k); if (i < 0) return null; a.splice(i, 1); return true; };
const opt = (k) => { const i = a.indexOf(k); if (i < 0) return null; const v = a[i + 1]; a.splice(i, 2); return v; };
const force = flag('--force'), dry = flag('--dry'), missing = flag('--missing');
const cmdOpt = opt('--cmd');
const max = +(opt('--max') || 999), only = opt('--only'), outDir = path.resolve(ROOT, opt('--out') || 'sfx/eleven');
const addI = a.indexOf('--add');
const MF = path.join(ROOT, 'sfx', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(MF, 'utf8'));
if (addI >= 0) {
  const [name, prompt, secs] = a.slice(addI + 1, addI + 4);
  if (!name || !prompt) { console.error('--add name "prompt" [seconds]'); process.exit(1); }
  manifest[name] = {seconds: +(secs || 1), prompt};
  fs.writeFileSync(MF, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`added "${name}" to sfx/manifest.json`);
}
let names = [];
if (only) names = only.split(',');
else if (addI >= 0) names = [a[addI + 1]];
else if (missing) {
  const {project} = await loadProject();
  const used = new Set(['bed']);
  for (const s of project.shots) for (const c of s.sfx || []) used.add(c[1]);
  names = [...used].filter((n) => !fs.existsSync(path.join(outDir, n + '.mp3')) && !fs.existsSync(path.join(ROOT, 'project', 'sfx', n + '.mp3')));
} else { console.error('say which: --only a,b | --missing | --add name "prompt" secs'); process.exit(1); }

const key = process.env.ELEVENLABS_API_KEY, cmd = cmdOpt || process.env.SFX_CMD;
if (!key && !cmd && !dry) { console.error('Set ELEVENLABS_API_KEY in your environment (or SFX_CMD). Without a key the synthesized kit in sfx/synth is used.'); process.exit(1); }
fs.mkdirSync(outDir, {recursive: true});
const LOG = path.join(ROOT, 'SOUND_LOG.md');
if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, '# SOUND_LOG\n\nEvery generated sound effect (ElevenLabs).\n\n| # | Time | File | Seconds | Prompt | Result |\n|---|---|---|---|---|---|\n');
let n = 0;
for (const name of names) {
  const m = manifest[name];
  if (!m) { console.log(`skip ${name}: not in sfx/manifest.json (use --add ${name} "prompt" secs)`); continue; }
  const dst = path.join(outDir, name + '.mp3');
  if (fs.existsSync(dst) && !force) { console.log(`skip ${name}: exists`); continue; }
  if (n >= max) { console.log(`budget reached (--max ${max}); stopping`); break; }
  n++;
  if (dry) { console.log(`[dry] ${name} (${m.seconds}s): ${m.prompt}`); continue; }
  let ok = false, err = '';
  try {
    if (cmd) {
      const r = spawnSync(cmd, m.kind === 'music' ? ['--music', m.prompt, dst, String(m.seconds)] : [m.prompt, dst, String(m.seconds)], {encoding: 'utf8'});
      ok = r.status === 0 && fs.existsSync(dst); err = (r.stderr || '').slice(-200);
    } else {
      const music = m.kind === 'music';
      const res = await fetch(music ? 'https://api.elevenlabs.io/v1/music' : 'https://api.elevenlabs.io/v1/sound-generation', {
        method: 'POST', headers: {'xi-api-key': key, 'Content-Type': 'application/json'},
        body: JSON.stringify(music ? {prompt: m.prompt, music_length_ms: Math.round(m.seconds * 1000)} : {text: m.prompt, duration_seconds: m.seconds, prompt_influence: 0.5}),
      });
      if (!res.ok) err = `HTTP ${res.status} ${(await res.text()).slice(0, 160)}`;
      else { fs.writeFileSync(dst, Buffer.from(await res.arrayBuffer())); ok = true; }
    }
  } catch (e) { err = e.message; }
  fs.appendFileSync(LOG, `| ${n} | ${new Date().toISOString().slice(11, 19)} | ${path.relative(ROOT, dst)} | ${m.seconds} | ${m.prompt.replace(/\|/g, '/')} | ${ok ? 'ok' : 'FAILED: ' + err.replace(/[|\n]/g, ' ')} |\n`);
  console.log(`${name}: ${ok ? 'ok' : 'FAILED ' + err}`);
}
