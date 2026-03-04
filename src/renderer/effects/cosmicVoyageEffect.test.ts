import { describe, expect, it, vi } from "vitest";

import { COSMIC_VOYAGE_DEFAULTS, CosmicVoyageEffect, cosmicHash01 } from "./cosmicVoyageEffect";

const createCtx = () => {
  const gradient = { addColorStop: vi.fn() };
  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn()
  } as unknown as CanvasRenderingContext2D;
  return ctx;
};

const makeAudio = () => ({ bass: 0.4, treble: 0.35, beatStrength: 0.3, rms: 0.25, mid: 0.2 });

describe("CosmicVoyageEffect", () => {
  it("exposes stable defaults for docs and UI controls", () => {
    expect(COSMIC_VOYAGE_DEFAULTS.speed).toBeGreaterThan(0);
    expect(COSMIC_VOYAGE_DEFAULTS.planetCount).toBeGreaterThanOrEqual(1);
    expect(COSMIC_VOYAGE_DEFAULTS.seed).toBe(7);
  });

  it("produces deterministic hash values in [0, 1)", () => {
    const a = cosmicHash01(42.125);
    const b = cosmicHash01(42.125);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
    expect(b).toBe(a);
  });

  it("renders galaxies, stars, planets and asteroids without throwing", () => {
    const effect = new CosmicVoyageEffect();
    const ctx = createCtx();

    effect.render({
      ctx,
      width: 640,
      height: 360,
      time: 1.2,
      delta: 1 / 60,
      audio: makeAudio(),
      params: {
        speed: 1.3,
        warp: 0.9,
        starDensity: 1.1,
        asteroidDensity: 0.8,
        planetCount: 3,
        seed: 11
      }
    });

    expect((ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("supports reset by clearing its internal cache", () => {
    const effect = new CosmicVoyageEffect();
    const ctx = createCtx();
    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0,
      delta: 1 / 60,
      audio: makeAudio(),
      params: { seed: 2 }
    });

    expect((effect as unknown as { cache: unknown }).cache).not.toBeNull();
    effect.reset();
    expect((effect as unknown as { cache: unknown }).cache).toBeNull();
  });
});
