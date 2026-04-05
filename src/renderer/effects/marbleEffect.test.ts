import { describe, expect, it, vi } from "vitest";

import { createMarbleEffect, createPseudoNoise } from "./marbleEffect";
import { EffectRenderContext } from "./types";

const makeStubCtx = () => {
  let lastImageData: ImageData | null = null;
  const ctx = {
    createImageData: vi.fn((width: number, height: number) => ({
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4)
    })),
    putImageData: vi.fn((imageData: ImageData) => {
      lastImageData = imageData;
    })
  } as unknown as CanvasRenderingContext2D;

  return {
    ctx,
    getImageData: () => lastImageData
  };
};

const createRenderContext = (ctx: CanvasRenderingContext2D, audio: Record<string, number>, time = 8.5): EffectRenderContext =>
  ({
    ctx,
    width: 40,
    height: 24,
    time,
    delta: 1 / 60,
    audio: { ...audio },
    params: {}
  } as EffectRenderContext);

describe("createPseudoNoise", () => {
  it("stays normalized to -1..1", () => {
    const noise = createPseudoNoise(4);
    for (let i = 0; i < 50; i += 1) {
      const x = i * 0.13;
      const y = i * -0.07;
      const value = noise(x, y);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});

describe("createMarbleEffect", () => {
  it("renders deterministically for fixed inputs", () => {
    const audio = { bass: 0.3, mid: 0.4, rms: 0.2 };

    const run = () => {
      const effect = createMarbleEffect();
      const { ctx, getImageData } = makeStubCtx();
      effect.render(createRenderContext(ctx, audio));
      return Array.from(getImageData()!.data.slice(0, 24));
    };

    expect(run()).toEqual(run());
  });

  it("applies gentle audio brightness lift", () => {
    const effectLow = createMarbleEffect();
    const low = makeStubCtx();
    effectLow.render(createRenderContext(low.ctx, { bass: 0, mid: 0, rms: 0 }));

    const effectHigh = createMarbleEffect();
    const high = makeStubCtx();
    effectHigh.render(createRenderContext(high.ctx, { bass: 0, mid: 0, rms: 1 }));

    const lowPixel = low.getImageData()!.data[0] + low.getImageData()!.data[1] + low.getImageData()!.data[2];
    const highPixel = high.getImageData()!.data[0] + high.getImageData()!.data[1] + high.getImageData()!.data[2];

    expect(highPixel).toBeGreaterThan(lowPixel);
  });
});
