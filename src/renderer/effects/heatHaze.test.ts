import { describe, expect, it } from "vitest";
import { getRegionWeight, valueNoise1d } from "./heatHaze";

describe("HeatHaze helpers", () => {
  it("returns deterministic value noise for same seed", () => {
    expect(valueNoise1d(12.34, 7)).toBeCloseTo(valueNoise1d(12.34, 7), 8);
    expect(valueNoise1d(12.34, 7)).not.toBeCloseTo(valueNoise1d(12.34, 8), 4);
  });

  it("weights region according to mode", () => {
    const bottomTop = getRegionWeight(0.2, { region: "bottom", centerY: 0.75, height: 0.35, feather: 0.2 });
    const bottomLow = getRegionWeight(0.9, { region: "bottom", centerY: 0.75, height: 0.35, feather: 0.2 });
    expect(bottomLow).toBeGreaterThan(bottomTop);

    const bandCenter = getRegionWeight(0.5, { region: "band", centerY: 0.5, height: 0.2, feather: 0.15 });
    const bandEdge = getRegionWeight(0.1, { region: "band", centerY: 0.5, height: 0.2, feather: 0.15 });
    expect(bandCenter).toBeGreaterThan(0.8);
    expect(bandEdge).toBeLessThan(0.1);

    expect(getRegionWeight(0.1, { region: "full", centerY: 0.2, height: 0.2, feather: 0.2 })).toBe(1);
  });
});
