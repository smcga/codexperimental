import { describe, expect, it, vi } from "vitest";

import { LightningEffect, createRng } from "./lightningEffect";

const createAudio = (beat = false) => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  beat,
  beatStrength: beat ? 0.8 : 0,
  impactStrength: 0
});

const createContext = () =>
  ({
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    set lineCap(_value: CanvasLineCap) {},
    set lineJoin(_value: CanvasLineJoin) {},
    set lineWidth(_value: number) {},
    set strokeStyle(_value: string) {},
    set fillStyle(_value: string) {},
    set globalCompositeOperation(_value: GlobalCompositeOperation) {}
  }) as unknown as CanvasRenderingContext2D;

describe("LightningEffect", () => {
  it("creates deterministic RNG output", () => {
    const rng = createRng(12345);
    expect(rng()).toBeCloseTo(0.9797, 4);
    expect(rng()).toBeCloseTo(0.3067, 3);
    expect(rng()).toBeCloseTo(0.4842, 4);
  });

  it("renders a flash when triggered by beat", () => {
    const effect = new LightningEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 1,
      delta: 0.016,
      audio: createAudio(true),
      params: { trigger: "beat", bolt: 0 } as unknown as Record<string, number>
    });

    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("does not flash when random chance is zero", () => {
    const effect = new LightningEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 2,
      delta: 0.016,
      audio: createAudio(false),
      params: { trigger: "random", chancePerSecond: 0 } as unknown as Record<string, number>
    });

    expect(ctx.fillRect).not.toHaveBeenCalled();
  });
});
