import { describe, expect, it, vi } from "vitest";

import { createMulberry32, ExplosionBurstEffect, resolveExplosionCounts } from "./explosionBurst";

const createAudio = (beatStrength = 0) => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  beat: beatStrength > 0,
  beatStrength,
  impactStrength: 0
});

const createContext = () => {
  const gradient = { addColorStop: vi.fn() } as unknown as CanvasGradient;
  return {
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    createRadialGradient: vi.fn(() => gradient),
    set fillStyle(_value: string | CanvasGradient) {},
    set strokeStyle(_value: string | CanvasGradient) {},
    set lineWidth(_value: number) {},
    set globalCompositeOperation(_value: GlobalCompositeOperation) {}
  } as unknown as CanvasRenderingContext2D;
};

describe("ExplosionBurstEffect", () => {
  it("generates deterministic random values", () => {
    const rngA = createMulberry32(42);
    const rngB = createMulberry32(42);

    expect([rngA(), rngA(), rngA()]).toEqual([rngB(), rngB(), rngB()]);
  });

  it("caps total particle counts", () => {
    const counts = resolveExplosionCounts(300, 300, 300);
    expect(counts.fire + counts.smoke + counts.debris).toBeLessThanOrEqual(400);
  });

  it("renders explosion phases and can reset", () => {
    const effect = new ExplosionBurstEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.05,
      delta: 0.016,
      audio: createAudio(0.8),
      params: {
        startTime: 0,
        seed: 7,
        duration: 5,
        particleCount: 120,
        smokeCount: 80,
        debrisCount: 40
      }
    });

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();

    effect.reset?.();

    expect(() =>
      effect.render({
        ctx,
        width: 320,
        height: 180,
        time: 0.06,
        delta: 0.016,
        audio: createAudio(0),
        params: {
          startTime: 0,
          seed: 7
        }
      })
    ).not.toThrow();
  });
});
