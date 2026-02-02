import { describe, expect, it } from "vitest";
import { coerceEffectParams, getEffectDebugDefaults } from "./effectDebug";

describe("effect debug params", () => {
  it("provides defaults for known effects", () => {
    expect(getEffectDebugDefaults("starfield")).toEqual({
      speed: 1,
      warp: 0.3,
      turnRate: 0.7,
      turnStrength: 0.35
    });
  });

  it("coerces numeric params based on control constraints", () => {
    const params = coerceEffectParams("starfield", {
      speed: -1,
      warp: 2,
      turnRate: 1.5,
      turnStrength: -0.5
    });
    expect(params).toEqual({
      speed: 0,
      warp: 1,
      turnRate: 1.5,
      turnStrength: 0
    });
  });

  it("coerces toggle params to numeric values", () => {
    const params = coerceEffectParams("chess", { showHighlights: 0 });
    expect(params.showHighlights).toBe(0);
  });

  it("coerces flyover palette choices", () => {
    const params = coerceEffectParams("flyover", { palette: "night" });
    expect(params.palette).toBe("night");
  });

  it("provides defaults for newly tunable effects", () => {
    expect(getEffectDebugDefaults("blobs")).toEqual({
      count: 6,
      radius: 0.12,
      orbit: 0.25,
      speed: 0.6,
      glow: 0.8
    });
  });

  it("clamps equalizer params within control bounds", () => {
    const params = coerceEffectParams("equalizer", {
      bars: 200,
      barWidth: 2,
      height: 0.1,
      bassBoost: -5,
      alpha: 2
    });
    expect(params).toEqual({
      bars: 128,
      barWidth: 1,
      height: 0.2,
      bassBoost: 0,
      alpha: 1
    });
  });
});
