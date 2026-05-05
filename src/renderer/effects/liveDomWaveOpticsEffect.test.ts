import { describe, expect, it, vi } from "vitest";

import {
  LIVE_DOM_WAVE_OPTICS_DEFAULTS,
  LiveDomWaveOpticsEffect,
  resolveLiveDomWaveOpticsParams
} from "./liveDomWaveOpticsEffect";

const createCtx = () =>
  ({
    fillStyle: "",
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn()
  }) as unknown as CanvasRenderingContext2D;

describe("LiveDomWaveOpticsEffect", () => {
  it("keeps stable defaults", () => {
    expect(LIVE_DOM_WAVE_OPTICS_DEFAULTS.seed).toBe(7);
    expect(LIVE_DOM_WAVE_OPTICS_DEFAULTS.diffraction).toBeGreaterThan(0);
  });

  it("clamps parameter ranges", () => {
    const resolved = resolveLiveDomWaveOpticsParams({ geometryDensity: 99, diffraction: -2, seed: "bad" });
    expect(resolved.geometryDensity).toBe(2);
    expect(resolved.diffraction).toBe(0);
    expect(resolved.seed).toBe(7);
  });

  it("renders without throwing", () => {
    const effect = new LiveDomWaveOpticsEffect();
    const ctx = createCtx();
    effect.render({
      ctx,
      width: 640,
      height: 360,
      time: 1.5,
      delta: 1 / 60,
      audio: { rms: 0.2, bass: 0.3, treble: 0.4, mid: 0.25, beat: true, beatStrength: 0.5 },
      params: { geometryDensity: 1.2, seed: 2 }
    });
    expect((ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(5);
  });
});
