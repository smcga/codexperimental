import { describe, expect, it } from "vitest";

import {
  EFFECT_PREVIEW_AUDIO_LOOP_END_TIME,
  EFFECT_PREVIEW_AUDIO_LOOP_START_TIME,
  EFFECT_PREVIEW_AUDIO_START_TIME,
  EffectPreviewAudioController,
  getEffectPreviewLoopTime,
  shouldRestartEffectPreviewLoop
} from "./effectPreviewAudio";

describe("effect preview audio loop", () => {
  it("starts from the requested anchor timestamp", () => {
    expect(EFFECT_PREVIEW_AUDIO_START_TIME).toBeCloseTo(312.85, 3);
  });

  it("keeps playback time unchanged before loop end", () => {
    const sampleTime = EFFECT_PREVIEW_AUDIO_LOOP_END_TIME - 0.05;
    expect(getEffectPreviewLoopTime(sampleTime)).toBe(sampleTime);
  });

  it("rewinds to loop start when loop end is reached", () => {
    expect(getEffectPreviewLoopTime(EFFECT_PREVIEW_AUDIO_LOOP_END_TIME)).toBe(EFFECT_PREVIEW_AUDIO_LOOP_START_TIME);
    expect(getEffectPreviewLoopTime(EFFECT_PREVIEW_AUDIO_LOOP_END_TIME + 4)).toBe(EFFECT_PREVIEW_AUDIO_LOOP_START_TIME);
  });

  it("restarts playback only when looping from a paused end state", () => {
    expect(shouldRestartEffectPreviewLoop(EFFECT_PREVIEW_AUDIO_LOOP_END_TIME, true)).toBe(true);
    expect(shouldRestartEffectPreviewLoop(EFFECT_PREVIEW_AUDIO_LOOP_END_TIME, false)).toBe(false);
    expect(shouldRestartEffectPreviewLoop(EFFECT_PREVIEW_AUDIO_LOOP_END_TIME - 0.1, true)).toBe(false);
  });

  it("reports the start anchor before audio is initialized", () => {
    const controller = new EffectPreviewAudioController("/song.mp3");
    expect(controller.getPlaybackTime()).toBe(EFFECT_PREVIEW_AUDIO_START_TIME);
  });
});
