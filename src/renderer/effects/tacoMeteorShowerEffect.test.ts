import { describe, expect, it } from "vitest";
import {
  buildTacoShells,
  computeTacoShellState,
  tacoHash01,
  TACO_METEOR_SHOWER_DEFAULTS
} from "./tacoMeteorShowerEffect";

describe("taco meteor shower helpers", () => {
  it("keeps deterministic hash values in [0, 1)", () => {
    const samples = [0, 1, 12.5, 99.01, 1234.567].map((value) => tacoHash01(value));
    samples.forEach((sample) => {
      expect(sample).toBeGreaterThanOrEqual(0);
      expect(sample).toBeLessThan(1);
    });
    expect(samples[2]).toBe(tacoHash01(12.5));
  });

  it("builds deterministic taco shell layouts", () => {
    const shells = buildTacoShells(7, 12);
    expect(shells).toHaveLength(12);
    expect(shells[0]).toMatchObject({
      lane: expect.any(Number),
      phaseOffset: expect.any(Number),
      collisionBand: expect.any(Number)
    });
    expect(shells[0]).toEqual(buildTacoShells(7, 12)[0]);
    expect(shells.every((shell) => shell.collisionBand >= 0.44 && shell.collisionBand <= 0.78)).toBe(true);
  });

  it("computes flight and collision states across the shell cycle", () => {
    const [shell] = buildTacoShells(3, 8);
    const inFlight = computeTacoShellState({
      width: 320,
      height: 180,
      time: 0.25,
      fallSpeed: 0.62,
      swirl: 0.7,
      burst: 0.78,
      shell,
      energy: 0.4
    });
    const postImpact = computeTacoShellState({
      width: 320,
      height: 180,
      time: 3.9,
      fallSpeed: 0.62,
      swirl: 0.7,
      burst: 0.78,
      shell,
      energy: 0.4
    });

    expect(inFlight.y).toBeLessThan(postImpact.y);
    expect(inFlight.collisionProgress).toBeGreaterThanOrEqual(0);
    expect(postImpact.collisionProgress).toBeGreaterThan(inFlight.collisionProgress);
    expect(postImpact.burstProgress).toBeGreaterThanOrEqual(postImpact.collisionProgress);
  });

  it("exposes stable defaults for docs/debug controls", () => {
    expect(TACO_METEOR_SHOWER_DEFAULTS.shellCount).toBeGreaterThanOrEqual(6);
    expect(TACO_METEOR_SHOWER_DEFAULTS.stardust).toBeGreaterThan(0);
    expect(TACO_METEOR_SHOWER_DEFAULTS.seed).toBe(7);
  });
});
