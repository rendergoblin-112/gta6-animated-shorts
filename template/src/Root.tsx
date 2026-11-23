import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
// @ts-ignore
import {buildTimeline} from './engine/timeline.js';
// @ts-ignore
import project from './project.js';

const fps = project.fps || 30;
const [W, H] = project.size || [1080, 1920];
const T = buildTimeline(project.shots, fps);

// Main   = the short
// Stills = one frame per shot (60% in) -> check these side by side BEFORE any full render
// Keys   = 3 frames per shot (start / middle / end) -> check the acting, not just one pose
export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Film} durationInFrames={T.total} fps={fps} width={W} height={H} />
    <Composition id="Stills" component={Film} durationInFrames={T.stillFrames.length} fps={fps} width={W} height={H}
      defaultProps={{frames: T.stillFrames}} />
    <Composition id="Keys" component={Film} durationInFrames={T.keyFrames.length} fps={fps} width={W} height={H}
      defaultProps={{frames: T.keyFrames}} />
  </>
);
