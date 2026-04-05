import { describe, expect, it } from "vitest";

import { clampAttractorCount, computeAttractorAccel, respawnParticleInBounds } from "./particleAttractors";

describe("particleAttractors helpers", () => {
  it("clamps attractor count to 1..4", () => {
    expect(clampAttractorCount(-2)).toBe(1);
    expect(clampAttractorCount(2.2)).toBe(2);
    expect(clampAttractorCount(8)).toBe(4);
  });

  it("clamps softened force acceleration", () => {
    const accel = computeAttractorAccel(
      10,
      10,
      [
        { x: 11, y: 10, strength: 1 },
        { x: 9, y: 9, strength: 1 }
      ],
      15000,
      1,
      0.5,
      120
    );

    const magnitude = Math.hypot(accel.ax, accel.ay);
    expect(magnitude).toBeLessThanOrEqual(120.0001);
  });

  it("respawns in bounds for random spawn mode", () => {
    const positionsX = new Float32Array(1);
    const positionsY = new Float32Array(1);
    const velocitiesX = new Float32Array(1);
    const velocitiesY = new Float32Array(1);
    const ages = new Float32Array(1);
    const maxAges = new Float32Array(1);

    respawnParticleInBounds(
      0,
      320,
      180,
      "random",
      160,
      90,
      () => 0.5,
      positionsX,
      positionsY,
      velocitiesX,
      velocitiesY,
      ages,
      maxAges
    );

    expect(positionsX[0]).toBeGreaterThanOrEqual(0);
    expect(positionsX[0]).toBeLessThanOrEqual(320);
    expect(positionsY[0]).toBeGreaterThanOrEqual(0);
    expect(positionsY[0]).toBeLessThanOrEqual(180);
    expect(ages[0]).toBe(0);
    expect(maxAges[0]).toBeGreaterThan(0);
  });
});
