import { describe, expect, it, vi } from "vitest";

import {
  buildPrismBloomPetals,
  computePrismBloomFocus,
  PRISM_BLOOM_DEFAULTS,
  PrismBloomEffect,
  prismBloomHash
} from "./prismBloomEffect";

const createCtx = () => {
  const gradient = { addColorStop: vi.fn() };
  return {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    globalCompositeOperation: "source-over",
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn()
  } as unknown as CanvasRenderingContext2D;
};

const makeAudio = () => ({
  bass: 0.35,
  mid: 0.28,
  treble: 0.42,
  rms: 0.31,
  beat: true,
  beatStrength: 0.4,
  impactStrength: 0,
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0)
});

describe("PrismBloomEffect", () => {
  it("keeps hash values deterministic and in range", () => {
    const sample = prismBloomHash(12.5);
    expect(sample).toBeGreaterThanOrEqual(0);
    expect(sample).toBeLessThan(1);
    expect(prismBloomHash(12.5)).toBe(sample);
  });

  it("builds deterministic petals with bounded properties", () => {
    const petals = buildPrismBloomPetals(3, 18);
    expect(petals).toHaveLength(18);
    expect(petals[0]).toEqual(buildPrismBloomPetals(3, 18)[0]);
    petals.forEach((petal) => {
      expect(petal.radius).toBeGreaterThanOrEqual(0.18);
      expect(petal.radius).toBeLessThanOrEqual(0.52);
      expect(petal.alpha).toBeGreaterThan(0.2);
    });
  });

  it("computes a bloom focus near the canvas center", () => {
    const focus = computePrismBloomFocus({ width: 640, height: 360, time: 1.5, flow: 0.6, energy: 0.5 });
    expect(focus.x).toBeGreaterThan(250);
    expect(focus.x).toBeLessThan(390);
    expect(focus.y).toBeGreaterThan(150);
    expect(focus.y).toBeLessThan(230);
    expect(focus.radius).toBeGreaterThan(60);
  });

  it("renders layered petals and dust without throwing", () => {
    const effect = new PrismBloomEffect();
    const ctx = createCtx();

    effect.render({
      ctx,
      width: 640,
      height: 360,
      time: 2.4,
      delta: 1 / 60,
      audio: makeAudio(),
      params: {
        bloom: 0.9,
        flow: 0.7,
        petalCount: 20,
        smear: 0.5,
        prismShift: 0.2,
        audioReact: 0.8,
        seed: 4
      }
    });

    expect((ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.ellipse as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("resets its cache for fresh reseeding", () => {
    const effect = new PrismBloomEffect();
    const ctx = createCtx();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0,
      delta: 1 / 60,
      audio: makeAudio(),
      params: { seed: 9 }
    });

    expect((effect as unknown as { cachedPetals: unknown[] }).cachedPetals.length).toBeGreaterThan(0);
    effect.reset();
    expect((effect as unknown as { cachedPetals: unknown[] }).cachedPetals).toEqual([]);
  });

  it("exposes stable defaults for docs and editor controls", () => {
    expect(PRISM_BLOOM_DEFAULTS.bloom).toBeGreaterThan(0);
    expect(PRISM_BLOOM_DEFAULTS.petalCount).toBeGreaterThanOrEqual(6);
    expect(PRISM_BLOOM_DEFAULTS.seed).toBe(3);
  });
});
