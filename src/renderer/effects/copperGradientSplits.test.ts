import { describe, expect, it, vi } from "vitest";

import { CopperGradientSplitsEffect } from "./copperGradientSplits";
import { EffectRenderContext } from "./types";

const createContext = () => {
  const fills: Array<{ x: number; y: number; width: number; height: number }> = [];
  const gradients: Array<CanvasGradient> = [];
  const ctx = {
    fillRect: vi.fn((x: number, y: number, width: number, height: number) => {
      fills.push({ x, y, width, height });
    }),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    createLinearGradient: vi.fn(() => {
      const gradient = { addColorStop: vi.fn() } as unknown as CanvasGradient;
      gradients.push(gradient);
      return gradient;
    }),
    set fillStyle(_value: string | CanvasGradient | CanvasPattern) {},
    set globalCompositeOperation(_value: GlobalCompositeOperation) {},
    globalAlpha: 1
  } as unknown as CanvasRenderingContext2D;

  return { ctx, fills, gradients };
};

const createAudio = (beat = false): EffectRenderContext["audio"] =>
  ({ rms: 0, bass: 0, beat } as EffectRenderContext["audio"]);

describe("CopperGradientSplitsEffect", () => {
  it("draws scanlines for each block using cached gradients", () => {
    const effect = new CopperGradientSplitsEffect();
    const { ctx, fills, gradients } = createContext();

    effect.render({
      ctx,
      width: 120,
      height: 32,
      time: 0,
      delta: 0.016,
      audio: createAudio(),
      params: { scanStep: 4, gradientRowStep: 16, splits: 1, hamish: false }
    });

    expect(gradients).toHaveLength(2);
    expect(fills).toHaveLength(8);
    fills.forEach((fill) => {
      expect(fill.width).toBe(120);
    });
  });

  it("decays beat pulse over time", () => {
    const effect = new CopperGradientSplitsEffect();
    const { ctx } = createContext();

    effect.render({
      ctx,
      width: 80,
      height: 20,
      time: 0,
      delta: 0.016,
      audio: createAudio(true),
      params: { splits: 1, hamish: false }
    });

    const afterBeat = (effect as unknown as { beatPulse: number }).beatPulse;

    effect.render({
      ctx,
      width: 80,
      height: 20,
      time: 0.2,
      delta: 0.05,
      audio: createAudio(false),
      params: { splits: 1, hamish: false }
    });

    const afterDecay = (effect as unknown as { beatPulse: number }).beatPulse;

    expect(afterBeat).toBeGreaterThan(afterDecay);
  });
});
