import { describe, expect, it, vi } from "vitest";

import { RasterBarsEffect } from "./rasterBars";
import { EffectRenderContext } from "./types";

const createContext = () => {
  const fills: Array<{ x: number; y: number; width: number; height: number }> = [];
  const ctx = {
    fillRect: vi.fn((x: number, y: number, width: number, height: number) => {
      fills.push({ x, y, width, height });
    }),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    set fillStyle(_value: string) {},
    set globalCompositeOperation(_value: string) {},
    globalAlpha: 1
  } as unknown as CanvasRenderingContext2D;

  return { ctx, fills };
};

const createAudio = (): EffectRenderContext["audio"] =>
  ({ rms: 0, bass: 0, beat: false } as EffectRenderContext["audio"]);

describe("RasterBarsEffect", () => {
  it("draws a scanline for each step when border is disabled", () => {
    const effect = new RasterBarsEffect();
    const { ctx, fills } = createContext();

    effect.render({
      ctx,
      width: 100,
      height: 20,
      time: 0,
      delta: 0.016,
      audio: createAudio(),
      params: { scanlineStep: 4, splitStrength: 0 }
    });

    expect(fills).toHaveLength(5);
    fills.forEach((fill) => {
      expect(fill.width).toBe(100);
    });
  });

  it("limits drawing to border bands when enabled", () => {
    const effect = new RasterBarsEffect();
    const { ctx, fills } = createContext();

    effect.render({
      ctx,
      width: 100,
      height: 20,
      time: 0,
      delta: 0.016,
      audio: createAudio(),
      params: { scanlineStep: 2, splitStrength: 0, border: true, borderSize: 5 }
    });

    expect(fills).toHaveLength(6);
    fills.forEach((fill) => {
      expect(fill.width).toBe(100);
    });
  });
});
