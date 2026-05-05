import { clamp } from "../util/math";
import { renderSettingsDefaults } from "./renderSettings";

export type QualityState = {
  qualityScale: number;
  autoQuality: boolean;
  emaFrameMs: number;
  lastAdjustmentMs: number;
  frameOverrunStreak: number;
  complexityScale: number;
};

const QUALITY_STEP = 0.05;
const QUALITY_ADJUST_INTERVAL_MS = 1000;
const FRAME_OVERRUN_MS = 24;
const FRAME_OVERRUN_STREAK_FOR_DEGRADE = 3;
const COMPLEXITY_STEP = 0.1;
const MIN_COMPLEXITY_SCALE = 0.5;

export function createQualityState(initialQuality: number, autoQuality: boolean): QualityState {
  return {
    qualityScale: clamp(
      initialQuality,
      renderSettingsDefaults.MIN_QUALITY_SCALE,
      renderSettingsDefaults.MAX_QUALITY_SCALE
    ),
    autoQuality,
    emaFrameMs: 0,
    lastAdjustmentMs: 0,
    frameOverrunStreak: 0,
    complexityScale: 1
  };
}

export function updateQualityState(state: QualityState, frameMs: number, nowMs: number): boolean {
  if (!state.autoQuality) {
    return false;
  }
  const alpha = 0.1;
  state.emaFrameMs = state.emaFrameMs === 0 ? frameMs : state.emaFrameMs * (1 - alpha) + frameMs * alpha;
  state.frameOverrunStreak = frameMs > FRAME_OVERRUN_MS ? state.frameOverrunStreak + 1 : 0;

  if (state.frameOverrunStreak >= FRAME_OVERRUN_STREAK_FOR_DEGRADE) {
    state.frameOverrunStreak = 0;
    state.complexityScale = clamp(state.complexityScale - COMPLEXITY_STEP, MIN_COMPLEXITY_SCALE, 1);
  } else if (frameMs < 16.5) {
    state.complexityScale = clamp(state.complexityScale + COMPLEXITY_STEP * 0.25, MIN_COMPLEXITY_SCALE, 1);
  }

  if (nowMs - state.lastAdjustmentMs < QUALITY_ADJUST_INTERVAL_MS) {
    return false;
  }

  if (state.emaFrameMs > 18 && state.qualityScale > renderSettingsDefaults.MIN_QUALITY_SCALE) {
    state.qualityScale = clamp(
      state.qualityScale - QUALITY_STEP,
      renderSettingsDefaults.MIN_QUALITY_SCALE,
      renderSettingsDefaults.MAX_QUALITY_SCALE
    );
    state.lastAdjustmentMs = nowMs;
    return true;
  }

  if (state.emaFrameMs < 14 && state.qualityScale < renderSettingsDefaults.MAX_QUALITY_SCALE) {
    state.qualityScale = clamp(
      state.qualityScale + QUALITY_STEP,
      renderSettingsDefaults.MIN_QUALITY_SCALE,
      renderSettingsDefaults.MAX_QUALITY_SCALE
    );
    state.lastAdjustmentMs = nowMs;
    return true;
  }

  return false;
}

export const qualityControllerDefaults = {
  QUALITY_STEP,
  QUALITY_ADJUST_INTERVAL_MS,
  FRAME_OVERRUN_MS,
  FRAME_OVERRUN_STREAK_FOR_DEGRADE,
  COMPLEXITY_STEP,
  MIN_COMPLEXITY_SCALE
};
