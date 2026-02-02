import { describe, expect, it } from "vitest";

import { computeBands, computeRms, createBeatDetector } from "./features";

describe("audio feature helpers", () => {
  it("computes RMS from time-domain samples", () => {
    const buffer = new Uint8Array([128, 128, 128, 128]);
    expect(computeRms(buffer)).toBe(0);

    const loudBuffer = new Uint8Array([0, 255]);
    const rms = computeRms(loudBuffer);
    expect(rms).toBeGreaterThan(0.9);
  });

  it("computes band energy from frequency data", () => {
    const frequency = new Uint8Array([0, 255, 128, 64]);
    const bands = computeBands(frequency, 8000, {
      bass: [0, 900],
      mid: [1000, 1900],
      treble: [2000, 2900]
    });

    expect(bands.bass).toBe(0);
    expect(bands.mid).toBe(1);
    expect(bands.treble).toBeCloseTo(128 / 255, 4);
  });

  it("detects beats with cooldown", () => {
    const detector = createBeatDetector();
    expect(detector(0, 0)).toEqual({ beat: false, strength: 0 });
    const firstBeat = detector(0.3, 0.1);
    expect(firstBeat.beat).toBe(true);
    const secondBeat = detector(0.3, 0.05);
    expect(secondBeat.beat).toBe(false);
  });
});
