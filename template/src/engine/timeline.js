// Shot list -> frames, stills, sound cues. Pure JS (no three.js): imported by the renderer AND the Node tools,
// so the sound mix and the format check always follow the current edit.
export function buildTimeline(shots, fps = 30) {
  let acc = 0;
  const S = shots.map((s) => {
    const f0 = Math.round(acc * fps); acc += s.d; const f1 = Math.round(acc * fps);
    return Object.assign(s, {f0, f1, t0: f0 / fps});
  });
  const total = S[S.length - 1].f1;
  const shotAt = (frame) => { for (const s of S) if (frame >= s.f0 && frame < s.f1) return s; return S[S.length - 1]; };
  // one still per shot at 60% of its length (or s.still = fraction or [fractions])
  const stillFrames = [], stillNames = [];
  for (const s of S) {
    const fr = Array.isArray(s.still) ? s.still : [s.still ?? 0.6];
    fr.forEach((u, i) => { stillFrames.push(Math.min(s.f1 - 1, Math.round(s.f0 + (s.f1 - s.f0) * u))); stillNames.push(s.id + (fr.length > 1 ? '_' + i : '')); });
  }
  // acting key sheet: 3 frames per shot (start, middle, end) to check the performance, not just one pose
  const keyFrames = [];
  for (const s of S) for (const u of [0.12, 0.5, 0.88]) keyFrames.push(Math.min(s.f1 - 1, Math.round(s.f0 + (s.f1 - s.f0) * u)));
  return {shots: S, fps, total, duration: total / fps, shotAt, stillFrames, stillNames, keyFrames};
}

// sound cues: shot.sfx = [[t, name, dB], ...] (t local to the shot). shot.duck = [a, b] ducks the bed. shot.bed = mood.
export function exportCues(T) {
  const cues = [], ducks = [], beds = [];
  for (const s of T.shots) {
    for (const [t, name, db = 0] of s.sfx || []) cues.push([+(s.t0 + t).toFixed(3), name, db]);
    if (s.duck) ducks.push([+(s.t0 + s.duck[0]).toFixed(3), +(s.t0 + s.duck[1]).toFixed(3)]);
    beds.push([s.t0, s.bed || 'main']);
  }
  cues.sort((a, b) => a[0] - b[0]);
  return {dur: T.duration, cues, ducks, beds};
}
