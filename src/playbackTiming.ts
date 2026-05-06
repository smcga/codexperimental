import { clamp } from "./util/math";

const MAX_LATENCY_COMPENSATION_SECONDS = 0.25;

export const clampLatencyCompensation = (seconds: number): number =>
  clamp(seconds, 0, MAX_LATENCY_COMPENSATION_SECONDS);

export const getDemoTimeFromAudio = (audioTime: number, audioOffset: number, latencyCompensation: number): number =>
  audioTime - clampLatencyCompensation(latencyCompensation) + audioOffset;

