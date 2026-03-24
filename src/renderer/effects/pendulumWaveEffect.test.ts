import { describe, expect, it, vi } from "vitest";

import {
  buildPendulumRig,
  PendulumWaveEffect,
  PENDULUM_WAVE_DEFAULTS,
  pendulumWaveHash,
  stepPendulumRig
} from "./pendulumWaveEffect";

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
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn()
  } as unknown as CanvasRenderingContext2D;
};

const makeAudio = (beat = false) => ({
  bass: 0.42,
  mid: 0.31,
  treble: 0.28,
  rms: 0.36,
  beat,
  beatStrength: beat ? 0.6 : 0,
  impactStrength: 0,
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0)
});

describe("PendulumWaveEffect", () => {
  it("keeps hash values deterministic and in range", () => {
    const sample = pendulumWaveHash(9.25);
    expect(sample).toBeGreaterThanOrEqual(0);
    expect(sample).toBeLessThan(1);
    expect(pendulumWaveHash(9.25)).toBe(sample);
  });

  it("builds a deterministic pendulum rig within expected bounds", () => {
    const rig = buildPendulumRig({ width: 640, height: 360, count: 9, spread: 0.75, bobRadius: 1, seed: 12 });
    expect(rig).toHaveLength(9);
    expect(rig[0]).toEqual(buildPendulumRig({ width: 640, height: 360, count: 9, spread: 0.75, bobRadius: 1, seed: 12 })[0]);
    rig.forEach((bob) => {
      expect(bob.anchorY).toBeCloseTo(43.2, 4);
      expect(bob.length).toBeGreaterThan(70);
      expect(bob.length).toBeLessThan(170);
      expect(bob.radius).toBeGreaterThan(9);
    });
  });

  it("steps the pendulum rig while keeping values finite and moving", () => {
    const rig = buildPendulumRig({ width: 800, height: 450, count: 8, spread: 0.8, bobRadius: 1, seed: 5 });
    const startingAngles = rig.map((bob) => bob.angle);

    const maxDeltas = startingAngles.map(() => 0);
    for (let i = 0; i < 120; i += 1) {
      stepPendulumRig({ rig, dt: 1 / 120, gravity: 0.9, damping: 0.12, coupling: 0.5, sway: 0.6, drive: 0.03, time: i / 120 });
      rig.forEach((bob, index) => {
        maxDeltas[index] = Math.max(maxDeltas[index], Math.abs(bob.angle - startingAngles[index]));
      });
    }

    rig.forEach((bob, index) => {
      expect(Number.isFinite(bob.angle)).toBe(true);
      expect(Number.isFinite(bob.velocity)).toBe(true);
      expect(maxDeltas[index]).toBeGreaterThan(0.05);
    });
  });

  it("keeps swinging across debug-style renders even without beats", () => {
    const effect = new PendulumWaveEffect();
    const ctx = createCtx();

    effect.render({
      ctx,
      width: 640,
      height: 360,
      time: 0,
      delta: 1 / 60,
      audio: makeAudio(false),
      params: { seed: 5, sway: 0.6, audioReact: 0.4 }
    });

    const initialAngles = (effect as unknown as { rig: Array<{ angle: number }> }).rig.map((bob) => bob.angle);

    for (let frame = 1; frame <= 90; frame += 1) {
      effect.render({
        ctx,
        width: 640,
        height: 360,
        time: frame / 60,
        delta: 1 / 60,
        audio: makeAudio(false),
        params: { seed: 5, sway: 0.6, audioReact: 0.4 }
      });
    }

    const laterAngles = (effect as unknown as { rig: Array<{ angle: number }> }).rig.map((bob) => bob.angle);
    const maxAngleDelta = laterAngles.reduce((max, angle, index) => Math.max(max, Math.abs(angle - initialAngles[index])), 0);

    expect(maxAngleDelta).toBeGreaterThan(0.12);
  });

  it("renders strings and weighted bobs without throwing", () => {
    const effect = new PendulumWaveEffect();
    const ctx = createCtx();

    effect.render({
      ctx,
      width: 640,
      height: 360,
      time: 1.2,
      delta: 1 / 60,
      audio: makeAudio(true),
      params: {
        count: 10,
        spread: 0.82,
        gravity: 0.9,
        coupling: 0.48,
        trail: 0.24,
        seed: 8
      }
    });

    expect((ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.lineTo as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("resets cached rig state for a fresh rebuild", () => {
    const effect = new PendulumWaveEffect();
    const ctx = createCtx();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0,
      delta: 1 / 60,
      audio: makeAudio(),
      params: { seed: 3 }
    });

    expect((effect as unknown as { rig: unknown[] }).rig.length).toBeGreaterThan(0);
    effect.reset();
    expect((effect as unknown as { rig: unknown[] }).rig).toEqual([]);
  });

  it("exposes stable defaults for docs and controls", () => {
    expect(PENDULUM_WAVE_DEFAULTS.count).toBeGreaterThanOrEqual(5);
    expect(PENDULUM_WAVE_DEFAULTS.spread).toBeGreaterThan(0.3);
    expect(PENDULUM_WAVE_DEFAULTS.seed).toBe(7);
  });
});
