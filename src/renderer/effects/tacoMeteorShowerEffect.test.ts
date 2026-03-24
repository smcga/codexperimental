import { describe, expect, it, vi } from "vitest";

import {
  buildTacoMeteors,
  buildTacoPalette,
  computeTacoMeteorState,
  TacoMeteorShowerEffect,
  tacoMeteorHash,
  TACO_METEOR_SHOWER_DEFAULTS
} from "./tacoMeteorShowerEffect";

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
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    save: vi.fn(),
    restore: vi.fn()
  } as unknown as CanvasRenderingContext2D;
};

const makeAudio = () => ({
  bass: 0.42,
  mid: 0.31,
  treble: 0.54,
  rms: 0.38,
  beat: true,
  beatStrength: 0.48,
  impactStrength: 0,
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0)
});

describe("TacoMeteorShowerEffect", () => {
  it("keeps hash output deterministic and in range", () => {
    const sample = tacoMeteorHash(12.5);
    expect(sample).toBeGreaterThanOrEqual(0);
    expect(sample).toBeLessThan(1);
    expect(tacoMeteorHash(12.5)).toBe(sample);
  });

  it("builds deterministic meteors and palette colors", () => {
    const meteors = buildTacoMeteors(7, 16);
    const palette = buildTacoPalette(280, 0.35);

    expect(meteors).toHaveLength(16);
    expect(meteors[0]).toEqual(buildTacoMeteors(7, 16)[0]);
    expect(meteors[0]?.lane).toBeGreaterThan(0);
    expect(meteors[0]?.lane).toBeLessThan(1);
    expect(palette.shell).toContain("hsla(");
    expect(palette.salsa).toContain("hsla(");
  });

  it("computes a falling state that approaches the impact zone", () => {
    const meteor = buildTacoMeteors(7, 16)[0];
    const state = computeTacoMeteorState({
      width: 640,
      height: 360,
      time: 1.8,
      descriptor: meteor,
      swirl: 0.7,
      trail: 0.6,
      energy: 0.5
    });

    expect(state.y).toBeGreaterThan(-120);
    expect(state.y).toBeLessThan(320);
    expect(state.trailLength).toBeGreaterThan(20);
    expect(state.shellWidth).toBeGreaterThan(10);
    expect(state.impactY).toBeGreaterThan(250);
  });

  it("renders shells, trails, and topping bursts without throwing", () => {
    const effect = new TacoMeteorShowerEffect();
    const ctx = createCtx();

    effect.render({
      ctx,
      width: 640,
      height: 360,
      time: 2.8,
      delta: 1 / 60,
      audio: makeAudio(),
      params: {
        shellCount: 18,
        swirl: 0.84,
        trail: 0.8,
        toppingBurst: 0.92,
        salsaChaos: 0.7,
        audioReact: 0.85,
        colorHeat: 0.42,
        seed: 9
      }
    });

    expect((ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.quadraticCurveTo as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.ellipse as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.translate as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("resets cached meteor descriptors", () => {
    const effect = new TacoMeteorShowerEffect();
    const ctx = createCtx();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.4,
      delta: 1 / 60,
      audio: makeAudio(),
      params: { seed: 11, shellCount: 10 }
    });

    expect((effect as unknown as { cachedMeteors: unknown[] }).cachedMeteors.length).toBe(10);
    effect.reset();
    expect((effect as unknown as { cachedMeteors: unknown[] }).cachedMeteors).toEqual([]);
  });

  it("exposes stable defaults for docs and controls", () => {
    expect(TACO_METEOR_SHOWER_DEFAULTS.shellCount).toBeGreaterThanOrEqual(6);
    expect(TACO_METEOR_SHOWER_DEFAULTS.audioReact).toBeGreaterThan(0);
    expect(TACO_METEOR_SHOWER_DEFAULTS.seed).toBe(7);
  });
});
