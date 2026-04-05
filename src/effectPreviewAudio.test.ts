import { describe, expect, it } from "vitest";

import {
  EFFECT_PREVIEW_AUDIO_LOOP_END_TIME,
  EFFECT_PREVIEW_AUDIO_LOOP_START_TIME,
  EFFECT_PREVIEW_AUDIO_START_TIME,
  EffectPreviewAudioController,
  getEffectPreviewLoopTime
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

  it("reports the start anchor before audio is initialized", () => {
    const controller = new EffectPreviewAudioController("/song.mp3");
    expect(controller.getPlaybackTime()).toBe(EFFECT_PREVIEW_AUDIO_START_TIME);
  });

  it("returns silent audio features before playback is initialized", () => {
    const controller = new EffectPreviewAudioController("/song.mp3");
    const features = controller.getFeatures();
    expect(features.rms).toBe(0);
    expect(features.bass).toBe(0);
    expect(features.beat).toBe(false);
  });
});
