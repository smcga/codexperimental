import { describe, expect, it, vi } from "vitest";

import { Effect, EffectRenderContext } from "../../types";
import { ImpossibleCorridorEffect } from "../impossibleCorridorEffect";

const baseAudio = {
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  beat: false,
  beatStrength: 0
};

describe("impossible corridor fallback", () => {
  it("uses fallback when WebGL2 is unavailable", () => {
    const fallbackRender = vi.fn();
    const fallback: Effect = {
      render: fallbackRender
    };

    const effect = new ImpossibleCorridorEffect({
      fallback,
      baseFactory: () => null
    });

    const context: EffectRenderContext = {
      ctx: { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D,
      width: 1280,
      height: 720,
      time: 1,
      delta: 0.016,
      audio: baseAudio,
      params: {}
    };

    expect(() => effect.render(context)).not.toThrow();
    expect(fallbackRender).toHaveBeenCalledTimes(1);
    const [payload] = fallbackRender.mock.calls[0];
    expect(payload.width).toBe(1280);
    expect(payload.height).toBe(720);
    expect(payload.time).toBe(1);
    expect(payload.audio).toBe(baseAudio);
  });
});
