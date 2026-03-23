import { describe, expect, it, vi } from "vitest";

import {
  buildTacoMeteorShells,
  computeTacoMeteorPose,
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
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn()
  } as unknown as CanvasRenderingContext2D;
};

const makeAudio = () => ({
  bass: 0.28,
  mid: 0.42,
  treble: 0.33,
  rms: 0.37,
  beat: true,
  beatStrength: 0.48,
  impactStrength: 0,
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0)
});

describe("TacoMeteorShowerEffect", () => {
  it("keeps hash values deterministic and in range", () => {
    const sample = tacoMeteorHash(9.25);
    expect(sample).toBeGreaterThanOrEqual(0);
    expect(sample).toBeLessThan(1);
    expect(tacoMeteorHash(9.25)).toBe(sample);
  });

  it("builds deterministic shell metadata with bounded values", () => {
    const shells = buildTacoMeteorShells(7, 13);
    expect(shells).toHaveLength(13);
    expect(shells[0]).toEqual(buildTacoMeteorShells(7, 13)[0]);
    shells.forEach((shell) => {
      expect(shell.depth).toBeGreaterThanOrEqual(0.72);
      expect(shell.depth).toBeLessThanOrEqual(1.28);
      expect(shell.radius).toBeGreaterThanOrEqual(0.035);
      expect(shell.radius).toBeLessThanOrEqual(0.085);
    });
  });

  it("computes a meteor pose that advances down the scene and gains a burst phase", () => {
    const shell = buildTacoMeteorShells(7, 5)[2];
    const pose = computeTacoMeteorPose({
      shell,
      width: 640,
      height: 360,
      time: 2.4,
      swirl: 0.6,
      energy: 0.55
    });

    expect(pose.y).toBeGreaterThan(-100);
    expect(pose.y).toBeLessThan(420);
    expect(pose.scale).toBeGreaterThan(0.5);
    expect(pose.progress).toBeGreaterThanOrEqual(0);
    expect(pose.progress).toBeLessThan(1);
    expect(pose.burstProgress).toBeGreaterThanOrEqual(0);
    expect(pose.burstProgress).toBeLessThanOrEqual(1);
  });

  it("renders taco shells, trails, and topping splashes without throwing", () => {
    const effect = new TacoMeteorShowerEffect();
    const ctx = createCtx();

    effect.render({
      ctx,
      width: 640,
      height: 360,
      time: 3.1,
      delta: 1 / 60,
      audio: makeAudio(),
      params: {
        shellCount: 14,
        swirl: 0.8,
        trail: 0.65,
        toppingBurst: 0.85,
        audioReact: 0.9,
        seed: 11
      }
    });

    expect((ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.ellipse as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.lineTo as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("resets cached shells for reseeding", () => {
    const effect = new TacoMeteorShowerEffect();
    const ctx = createCtx();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.5,
      delta: 1 / 60,
      audio: makeAudio(),
      params: { seed: 4 }
    });

    expect((effect as unknown as { cachedShells: unknown[] }).cachedShells.length).toBeGreaterThan(0);
    effect.reset();
    expect((effect as unknown as { cachedShells: unknown[] }).cachedShells).toEqual([]);
  });

  it("exposes stable defaults for docs and editor controls", () => {
    expect(TACO_METEOR_SHOWER_DEFAULTS.shellCount).toBeGreaterThanOrEqual(4);
    expect(TACO_METEOR_SHOWER_DEFAULTS.audioReact).toBeLessThanOrEqual(1);
    expect(TACO_METEOR_SHOWER_DEFAULTS.seed).toBe(7);
  });
});
