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

  it("provides defaults for wireframe ride controls", () => {
    expect(getEffectDebugDefaults("wireframeRide")).toEqual({
      speed: 1,
      gridWidth: 60,
      gridDepth: 120,
      gridResX: 160,
      gridResZ: 220,
      amplitude: 6,
      noiseFreq: 0.08,
      cameraHeight: 10,
      fov: 60,
      fog: 0.75,
      neon: 1,
      bassReactive: 0.6,
      rmsReactive: 0.35,
      sun: 1
    });
  });

  it("provides defaults for tree growth controls", () => {
    expect(getEffectDebugDefaults("treegrowth")).toEqual({
      speed: 0.18,
      levels: 6,
      trunkHeight: 0.45,
      branchScale: 0.72,
      branchAngle: 28,
      trunkWidth: 10,
      sway: 0.35,
      leafSize: 3,
      jitter: 0.25,
      seed: 0,
      growth: 1
    });
  });

  it("provides defaults for twister controls", () => {
    expect(getEffectDebugDefaults("twister")).toEqual({
      x: 0.5,
      baseWidth: 220,
      amplitude: 90,
      turns: 3,
      speed: 2.2,
      sliceH: 2,
      sat: 90,
      hueSpeed: 55,
      minWidthScale: 0.55,
      maxWidthScale: 1,
      minAlpha: 0.25,
      maxAlpha: 0.95,
      edgeShade: 0.35,
      background: "clear",
      trailFade: 0.08,
      texture: "solid",
      audioReact: 0.7,
      beatKick: 0.7
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
