import { clamp } from "../util/math";
import { renderSettingsDefaults } from "./renderSettings";

export type QualityState = {
  qualityScale: number;
  autoQuality: boolean;
  emaFrameMs: number;
  lastAdjustmentMs: number;
};

const QUALITY_STEP = 0.05;
const QUALITY_ADJUST_INTERVAL_MS = 1000;

export function createQualityState(initialQuality: number, autoQuality: boolean): QualityState {
  return {
    qualityScale: clamp(
      initialQuality,
      renderSettingsDefaults.MIN_QUALITY_SCALE,
      renderSettingsDefaults.MAX_QUALITY_SCALE
    ),
    autoQuality,
    emaFrameMs: 0,
    lastAdjustmentMs: 0
  };
}

export function updateQualityState(state: QualityState, frameMs: number, nowMs: number): boolean {
  if (!state.autoQuality) {
    return false;
  }
  const alpha = 0.1;
  state.emaFrameMs = state.emaFrameMs === 0 ? frameMs : state.emaFrameMs * (1 - alpha) + frameMs * alpha;

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
  QUALITY_ADJUST_INTERVAL_MS
};
