import { describe, expect, it, vi } from "vitest";

import { RainEffect, hashFloat } from "./rainEffect";

const createAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  beat: false,
  beatStrength: 0,
  impactStrength: 0
});

const createContext = () => {
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    set lineCap(_value: CanvasLineCap) {},
    set lineWidth(_value: number) {},
    set strokeStyle(_value: string) {}
  } as unknown as CanvasRenderingContext2D;

  return ctx;
};

describe("RainEffect", () => {
  it("produces stable hash values", () => {
    expect(hashFloat(12.5)).toBeCloseTo(0.8502, 4);
    expect(hashFloat(42.25)).toBeCloseTo(0.8819, 4);
  });

  it("skips rendering when intensity is zero", () => {
    const effect = new RainEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 200,
      height: 100,
      time: 1,
      delta: 0.016,
      audio: createAudio(),
      params: { intensity: 0 }
    });

    expect(ctx.stroke).not.toHaveBeenCalled();
  });
});
