import { describe, expect, it, vi } from "vitest";

import { BoidsSimulationEffect, hashFloat, wrap } from "./boidsSimulationEffect";

const createAudio = (overrides: Record<string, number | boolean> = {}) => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.15,
  bass: 0.25,
  mid: 0.1,
  treble: 0.2,
  beat: false,
  beatStrength: 0,
  impactStrength: 0,
  ...overrides
});

const createContext = () =>
  ({
    fillStyle: "",
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn()
  }) as unknown as CanvasRenderingContext2D;

describe("boidsSimulationEffect helpers", () => {
  it("hashFloat is deterministic and bounded", () => {
    const a = hashFloat(12.34);
    const b = hashFloat(12.34);
    const c = hashFloat(99.1);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
    expect(a).toBe(b);
    expect(c).not.toBe(a);
  });

  it("wrap loops values into range", () => {
    expect(wrap(12, 10)).toBe(2);
    expect(wrap(-1, 10)).toBe(9);
    expect(wrap(3, 0)).toBe(0);
  });
});

describe("BoidsSimulationEffect", () => {
  it("renders boids and reseeds when params change", () => {
    const effect = new BoidsSimulationEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0,
      delta: 0.016,
      audio: createAudio(),
      params: { count: 20, seed: 1 }
    });

    const firstCount = (effect as unknown as { boids: Array<unknown> }).boids.length;
    expect(firstCount).toBe(20);
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.1,
      delta: 0.016,
      audio: createAudio({ beat: true, beatStrength: 0.7 }),
      params: { count: 36, seed: 1 }
    });

    const secondCount = (effect as unknown as { boids: Array<unknown> }).boids.length;
    expect(secondCount).toBe(36);

    effect.reset();
    const resetCount = (effect as unknown as { boids: Array<unknown> }).boids.length;
    expect(resetCount).toBe(0);
  });
});
