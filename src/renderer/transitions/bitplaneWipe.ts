import { clamp, smoothstep } from "../../util/math";

export type BitplaneBandState = {
  index: number;
  x: number;
  width: number;
  progress: number;
  edgeGlow: number;
};

export type BitplaneWipeTransitionState = {
  bands: BitplaneBandState[];
  overlayAlpha: number;
};

const hash01 = (index: number): number => {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
};

export function computeBitplaneWipeTransitionState(
  progress: number,
  width: number,
  bandCount?: number
): BitplaneWipeTransitionState {
  const safeProgress = clamp(progress, 0, 1);
  const resolvedBandCount = Math.max(8, Math.min(32, bandCount ?? Math.round(width / 24)));
  const bandWidth = width / resolvedBandCount;
  const staggerWindow = 0.34;

  const bands = Array.from({ length: resolvedBandCount }, (_, index) => {
    const normalizedIndex = resolvedBandCount <= 1 ? 0 : index / (resolvedBandCount - 1);
    const jitter = (hash01(index) - 0.5) * 0.08;
    const delay = clamp(normalizedIndex * staggerWindow + jitter, 0, 0.58);
    const localProgress = clamp((safeProgress - delay) / Math.max(1e-6, 1 - delay), 0, 1);

    return {
      index,
      x: index * bandWidth,
      width: bandWidth,
      progress: smoothstep(0, 1, localProgress),
      edgeGlow: clamp(1 - Math.abs(localProgress - 0.5) * 2, 0, 1)
    };
  });

  return {
    bands,
    overlayAlpha: clamp(Math.exp(-Math.pow((safeProgress - 0.52) / 0.22, 2)) * 0.18, 0, 0.18)
  };
}
