// Shared helpers for the Node tools: load the project + timeline, run ffmpeg, read images as RGB.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FFMPEG = process.env.FFMPEG || 'ffmpeg';
export const FFPROBE = process.env.FFPROBE || 'ffprobe';

export async function loadProject() {
  const project = (await import(path.join(ROOT, 'project', 'index.js'))).default;
  const {buildTimeline} = await import(path.join(ROOT, 'src', 'engine', 'timeline.js'));
  return {project, T: buildTimeline(project.shots, project.fps || 30)};
}

export function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {encoding: opts.binary ? 'buffer' : 'utf8', maxBuffer: 1 << 30, ...opts});
  if (r.error) throw new Error(`${cmd} failed to start: ${r.error.message}${cmd === FFMPEG ? ' (is ffmpeg installed and on PATH? set FFMPEG=/path/to/ffmpeg)' : ''}`);
  if (opts.check !== false && r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 6).join(' ')} ... exited ${r.status}\n${String(r.stderr).slice(-1500)}`);
  return r;
}

// decode an image to raw RGB at w x h (default keeps aspect 9:16 -> 360x640)
export function readRGB(file, w = 360, h = 640) {
  const r = run(FFMPEG, ['-v', 'error', '-i', file, '-vf', `scale=${w}:${h}:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], {binary: true});
  return {w, h, data: r.stdout};
}

// sound lookup order: your project's own files > ElevenLabs kit > synthesized kit
export function findSound(name) {
  for (const p of [['project', 'sfx', name + '.mp3'], ['project', 'sfx', name + '.wav'], ['sfx', 'eleven', name + '.mp3'],
    ['sfx', 'synth', name + '.mp3'], ['sfx', 'synth', name + '.wav']].map((x) => path.join(ROOT, ...x))) if (fs.existsSync(p)) return p;
  return null;
}

export const ls =(dir, re) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => re.test(f)).sort().map((f) => path.join(dir, f)) : []);
export const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
