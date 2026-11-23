// Format check: tests the shot list against the measured numbers of the top GTA 6 cartoon shorts
// (references/format.md). Run it after every edit of project/shots.js. FAIL = fix before rendering.
import {loadProject, median} from './lib.mjs';

const {project, T} = await loadProject();
const S = T.shots, D = T.duration, N = S.length;
const rows = [];
const add = (status, rule, got, want) => rows.push({status, rule, got, want});
const band = (rule, v, lo, hi, {hardLo = lo, hardHi = hi, fmt = (x) => x.toFixed(2)} = {}) =>
  add(v >= lo && v <= hi ? 'PASS' : v >= hardLo && v <= hardHi ? 'WARN' : 'FAIL', rule, fmt(v), `${lo}-${hi}`);

band('length (s)', D, 33, 38, {hardLo: 23});
band('first shot (s)', S[0].d, 0.6, 1.1, {hardLo: 0.4, hardHi: 2.2});
const prem = S.find((s) => s.beat === 'premise');
if (prem) band('premise ("GTA 6" on screen) starts at (s)', prem.t0, 0, 1.1, {hardHi: 2.0}); else add('FAIL', 'premise shot', 'none', "mark the first screen shot with beat: 'premise'");
add(S[0].move === 'pull' ? 'PASS' : 'WARN', 'shot 1 pulls out on the character', S[0].move || 'static', "move: 'pull'");
band('average shot length (s)', D / N, 1.2, 2.1, {hardLo: 1.0, hardHi: 2.4});
band('hard cuts per 10 s', ((N - 1) / D) * 10, 4.5, 8.0, {hardLo: 3.5, hardHi: 9});
const isC = (s) => ['C', 'B', 'T'].includes(s.type), isP = (s) => s.type === 'P';
const cd = S.filter(isC).map((s) => s.d), pd = S.filter(isP).map((s) => s.d);
if (cd.length) band('median character shot (s)', median(cd), 0.87, 1.33, {hardLo: 0.7, hardHi: 1.6});
if (pd.length) band('median screen-POV shot (s)', median(pd), 1.23, 2.78, {hardLo: 1.0, hardHi: 3.2});
const longest = S.reduce((m, s) => (s.d > m.d ? s : m));
add(longest.d <= 4 ? 'PASS' : 'WARN', 'longest shot (s)', `${longest.d} (${longest.id})`, '<= 4');
const pairs = S.slice(1).map((s, i) => [S[i], s]);
const alt = pairs.filter(([a, b]) => (isC(a) || a.type === 'W') && isP(b) || isP(a) && (isC(b) || b.type === 'W')).length / pairs.length;
band('character<->screen alternation', alt, 0.6, 1, {hardLo: 0.4});
const moved = S.filter((s) => s.move).length;
band('static (locked-off) share', 1 - moved / N, 0.55, 0.8, {hardLo: 0.45, hardHi: 0.9});
for (const m of ['pull', 'push', 'shake']) add(S.some((s) => s.move === m) ? 'PASS' : 'FAIL', `at least one ${m}`, S.filter((s) => s.move === m).length, '>= 1');
band('shake share of shots', S.filter((s) => s.move === 'shake').length / N, 0, 0.1, {hardHi: 0.14});
const rage = S.find((s) => s.beat === 'rage');
if (rage) band('rage peak centre (fraction of runtime)', (rage.t0 + rage.d / 2) / D, 0.55, 0.7, {hardLo: 0.45, hardHi: 0.8}); else add('FAIL', 'rage peak', 'none', "beat: 'rage'");
const tw = S.find((s) => s.beat === 'twist');
if (tw) band('twist starts at (fraction of runtime)', tw.t0 / D, 0.88, 0.95, {hardLo: 0.85, hardHi: 0.97}); else add('FAIL', 'twist', 'none', "beat: 'twist' (~92%)");
const btn = S[N - 1];
add(btn.beat === 'button' ? 'PASS' : 'FAIL', 'last shot is the button (no end card, no outro)', btn.beat || btn.id, "beat: 'button'");
band('button length (s)', btn.d, 0.9, 1.5, {hardHi: 3});
const loops = new Set(S.filter((s) => s.beat === 'obstacle').map((s) => s.loop));
band('obstacle repeats', loops.size, 4, 7, {hardLo: 3, hardHi: 8, fmt: (x) => String(x)});
const silentShots = S.filter((s) => !(s.sfx && s.sfx.length)).map((s) => s.id);
add(silentShots.length ? 'FAIL' : 'PASS', 'every shot has a sound cue', silentShots.length ? silentShots.join(',') : 'all', 'sfx on every beat');
const ts = S.flatMap((s) => (s.sfx || []).map((c) => s.t0 + c[0])).sort((a, b) => a - b);
const gaps = [0, ...ts].map((t, i, a) => (i + 1 < a.length ? a[i + 1] - t : D - t));
band('longest gap between sound cues (s)', Math.max(...gaps), 0, 1.5, {hardHi: 2.2});
band('sound cues per second', ts.length / D, 0.8, 2.5, {hardLo: 0.6, hardHi: 3});
const bad = S.filter((s) => !s.type || !s.setup || !s.d);
if (bad.length) add('FAIL', 'shots missing id/type/setup/d', bad.map((s) => s.id || '?').join(','), 'all fields');

const w = Math.max(...rows.map((r) => r.rule.length));
console.log(`${project.title || 'project'}: ${N} shots, ${D.toFixed(2)} s\n`);
for (const r of rows) console.log(`${r.status === 'PASS' ? ' ok ' : r.status}  ${r.rule.padEnd(w)}  ${String(r.got).padEnd(14)} target ${r.want}`);
const fails = rows.filter((r) => r.status === 'FAIL').length, warns = rows.filter((r) => r.status === 'WARN').length;
console.log(`\n${fails} FAIL, ${warns} WARN, ${rows.length - fails - warns} ok`);
process.exit(fails ? 1 : 0);
