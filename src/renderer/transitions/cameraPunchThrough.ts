import { clamp } from "../../util/math";

export type CameraPunchThroughTransitionState = {
  fromZoom: number;
  fromAlpha: number;
  fromPanY: number;
  toZoom: number;
  toAlpha: number;
  streakAlpha: number;
  streakLength: number;
  ringAlpha: number;
  bloomAlpha: number;
  bloomRadius: number;
  impactAlpha: number;
};

const smoothstep = (edge0: number, edge1: number, value: number): number => {
  const t = clamp((value - edge0) / Math.max(1e-6, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export function computeCameraPunchThroughTransitionState(progress: number): CameraPunchThroughTransitionState {
  const safeProgress = clamp(progress, 0, 1);
  const launch = Math.pow(safeProgress, 1.35);
  const handoff = smoothstep(0.56, 0.9, safeProgress);
  const impact = smoothstep(0.72, 0.96, safeProgress);
  const streakEnvelope = smoothstep(0.04, 0.22, safeProgress) * (1 - smoothstep(0.74, 0.94, safeProgress));
  const ringEnvelope = (1 - smoothstep(0.68, 0.94, safeProgress)) * 0.32;
  const bloom = Math.exp(-Math.pow((safeProgress - 0.7) / 0.16, 2));

  return {
    fromZoom: 1 + launch * 3.8,
    fromAlpha: clamp(1 - smoothstep(0.36, 0.78, safeProgress), 0, 1),
    fromPanY: -launch * 10,
    toZoom: 2.2 - handoff * 1.2,
    toAlpha: clamp(smoothstep(0.52, 0.84, safeProgress), 0, 1),
    streakAlpha: clamp(streakEnvelope * 0.9, 0, 1),
    streakLength: 0.22 + launch * 0.85,
    ringAlpha: clamp(ringEnvelope, 0, 1),
    bloomAlpha: clamp(bloom * 0.9, 0, 1),
    bloomRadius: 0.14 + launch * 0.72,
    impactAlpha: clamp(impact, 0, 1)
  };
}
