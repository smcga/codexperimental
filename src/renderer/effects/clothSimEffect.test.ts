import { describe, expect, it, vi } from "vitest";

import { ClothSimEffect, ClothSimulation, averageConstraintStretch, resolveClothSimParams } from "./clothSimEffect";

const createAudio = (overrides: Record<string, number | boolean> = {}) => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.12,
  bass: 0.2,
  mid: 0.16,
  treble: 0.18,
  beat: false,
  beatStrength: 0,
  impactStrength: 0,
  ...overrides
});

const createContext = () =>
  ({
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    strokeRect: vi.fn()
  }) as unknown as CanvasRenderingContext2D;

describe("clothSimEffect physics", () => {
  it("keeps pinned particles pinned", () => {
    const params = resolveClothSimParams({ cols: 10, rows: 8, pinMode: "corners" }, false);
    const sim = new ClothSimulation();
    sim.init(320, 180, params);

    const pinned = sim.particles.filter((particle) => particle.pinned);
    sim.integrate(1 / 60, params, { gravity: 1, wind: 0.6, flutter: 0.5, beatKick: 0.3, time: 1.2, mid: 0.2, treble: 0.1 });
    sim.solveConstraints(params.iterations, params.stiffness);

    pinned.forEach((particle) => {
      expect(Math.abs(particle.x - particle.pinX)).toBeLessThan(1e-6);
      expect(Math.abs(particle.y - particle.pinY)).toBeLessThan(1e-6);
    });
  });

  it("constraint solving keeps average stretch bounded", () => {
    const params = resolveClothSimParams({ cols: 14, rows: 10, iterations: 5, stiffness: 0.92 }, false);
    const sim = new ClothSimulation();
    sim.init(420, 260, params);

    for (let i = 0; i < sim.particles.length; i += 1) {
      const particle = sim.particles[i];
      if (particle.pinned) {
        continue;
      }
      particle.x += ((i % 5) - 2) * 3.2;
      particle.y += ((i % 7) - 3) * 2.4;
    }

    for (let i = 0; i < 12; i += 1) {
      sim.solveConstraints(params.iterations, params.stiffness);
    }

    expect(averageConstraintStretch(sim)).toBeLessThan(0.09);
  });
});

describe("ClothSimEffect integration", () => {
  it("clamps large delta updates to avoid explosive displacement", () => {
    const effect = new ClothSimEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 360,
      height: 220,
      time: 0,
      delta: 1 / 60,
      audio: createAudio(),
      params: { cols: 12, rows: 9 }
    });

    const sim = (effect as unknown as { sim: ClothSimulation }).sim;
    const baseline = sim.particles.map((particle) => ({ x: particle.x, y: particle.y }));

    effect.render({
      ctx,
      width: 360,
      height: 220,
      time: 1,
      delta: 1.5,
      audio: createAudio({ bass: 1, beat: true, beatStrength: 1 }),
      params: { cols: 12, rows: 9, wind: 1.2, audioReactive: 1 }
    });

    let maxMove = 0;
    sim.particles.forEach((particle, index) => {
      const moved = Math.hypot(particle.x - baseline[index].x, particle.y - baseline[index].y);
      maxMove = Math.max(maxMove, moved);
    });

    expect(maxMove).toBeLessThan(120);
  });

  it("reinitializes topology when grid params change", () => {
    const effect = new ClothSimEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0,
      delta: 1 / 60,
      audio: createAudio(),
      params: { cols: 10, rows: 7 }
    });

    const firstCount = (effect as unknown as { sim: ClothSimulation }).sim.particles.length;
    expect(firstCount).toBe(70);

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.2,
      delta: 1 / 60,
      audio: createAudio(),
      params: { cols: 16, rows: 9 }
    });

    const secondCount = (effect as unknown as { sim: ClothSimulation }).sim.particles.length;
    expect(secondCount).toBe(144);
  });
});
