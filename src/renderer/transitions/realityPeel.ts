import { clamp, lerp, smoothstep } from "../../util/math";

export type RealityPeelTransitionState = {
  foldX: number;
  foldY: number;
  peelDepth: number;
  curlBackX: number;
  curlLiftY: number;
  flapLeftX: number;
  flapBottomY: number;
  shadowAlpha: number;
  undersideAlpha: number;
  highlightAlpha: number;
  creaseAlpha: number;
  revealAlpha: number;
  flapProgress: number;
};

export function computeRealityPeelTransitionState(
  progress: number,
  width: number,
  height: number
): RealityPeelTransitionState {
  const safeProgress = clamp(progress, 0, 1);
  const peel = smoothstep(0.02, 0.98, safeProgress);
  const settle = 1 - smoothstep(0.88, 1, safeProgress);
  const foldX = lerp(width, width * 0.56, peel);
  const foldY = lerp(height * 0.02, height * 0.76, peel);
  const peelDepth = lerp(height * 0.04, height * 0.26, peel);
  const curlBackX = lerp(width * 0.01, width * 0.14, peel);
  const curlLiftY = lerp(height * 0.01, height * 0.08, peel) * settle;
  const flapLeftX = foldX - curlBackX;
  const flapBottomY = foldY + curlLiftY;
  const shadowAlpha = clamp(0.06 + peel * 0.26, 0, 0.32) * settle;
  const undersideAlpha = clamp(0.12 + peel * 0.42, 0, 0.54);
  const highlightAlpha = clamp(0.08 + (1 - Math.abs(peel - 0.58) / 0.58) * 0.34, 0, 0.4);
  const creaseAlpha = clamp(0.18 + peel * 0.44, 0, 0.6);
  const revealAlpha = clamp(0.2 + smoothstep(0.08, 0.46, safeProgress) * 0.8, 0, 1);

  return {
    foldX,
    foldY,
    peelDepth,
    curlBackX,
    curlLiftY,
    flapLeftX,
    flapBottomY,
    shadowAlpha,
    undersideAlpha,
    highlightAlpha,
    creaseAlpha,
    revealAlpha,
    flapProgress: peel
  };
}
