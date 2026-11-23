import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {loadFont as loadPatrick} from '@remotion/google-fonts/PatrickHand';
import {loadFont as loadMarker} from '@remotion/google-fonts/PermanentMarker';
// @ts-ignore
import {Engine} from './engine/engine.js';
// @ts-ignore
import project from './project.js';

const f1 = loadPatrick();
const f2 = loadMarker();
const [W, H] = project.size || [1080, 1920];

let enginePromise: Promise<any> | null = null;
let engineCanvas: HTMLCanvasElement | null = null;

async function getEngine(canvas: HTMLCanvasElement) {
  if (!enginePromise || engineCanvas !== canvas) {
    engineCanvas = canvas;
    enginePromise = (async () => {
      await Promise.all([f1.waitUntilDone(), f2.waitUntilDone()]);
      await document.fonts.load('40px "Patrick Hand"');
      await document.fonts.load('40px "Permanent Marker"');
      return new Engine(canvas, project);
    })();
  }
  return enginePromise;
}

// Remotion is only the frame stepper + encoder: the engine renders frame n deterministically.
export const Film: React.FC<{frames?: number[]}> = ({frames}) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const h = delayRender('three frame ' + frame);
    const f = frames ? frames[frame] : frame;
    getEngine(ref.current!).then((e) => {
      e.frame(f);
      continueRender(h);
    }).catch((err) => { console.error(err); throw err; });
  }, [frame, frames]);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <canvas ref={ref} width={W} height={H} style={{width: W, height: H}} />
    </AbsoluteFill>
  );
};
