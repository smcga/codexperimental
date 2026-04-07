import { describe, expect, it, vi } from "vitest";

import {
  EFFECT_PREVIEW_AUDIO_SRC,
  EffectPreviewAudioController,
  EFFECT_PREVIEW_AUDIO_VOLUME
} from "./effectPreviewAudio";

describe("effect preview audio loop", () => {
  it("uses the dedicated loop source asset", () => {
    expect(EFFECT_PREVIEW_AUDIO_SRC).toBe("/songloop.ogg");
  });

  it("keeps preview volume tuned for background monitoring", () => {
    expect(EFFECT_PREVIEW_AUDIO_VOLUME).toBeCloseTo(0.2, 6);
  });

  it("reports synthetic timeline position before audio is initialized", () => {
    const controller = new EffectPreviewAudioController(EFFECT_PREVIEW_AUDIO_SRC);
    expect(controller.getPlaybackTime()).toBe(0);
  });

  it("advances synthetic timeline time while running", () => {
    const controller = new EffectPreviewAudioController(EFFECT_PREVIEW_AUDIO_SRC);
    const nowSpy = vi.spyOn(performance, "now");
    // @ts-expect-error private field access for deterministic timeline clock test
    controller.timelineRunning = true;
    // @ts-expect-error private field access for deterministic timeline clock test
    controller.timelineLastTickMs = 1000;

    nowSpy.mockReturnValueOnce(1550);
    const elapsed = controller.getPlaybackTime();
    expect(elapsed).toBeCloseTo(0.55, 4);
    nowSpy.mockRestore();
  });
});
