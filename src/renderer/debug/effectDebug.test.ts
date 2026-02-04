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

  it("provides defaults for lens wobbler controls", () => {
    expect(getEffectDebugDefaults("lens_wobbler")).toEqual({
      bufW: 240,
      bufH: 150,
      rotSpeed: 0.25,
      baseScale: 0.9,
      zoomAmp: 0.15,
      zoomSpeed: 0.6,
      scrollU: 30,
      scrollV: 18,
      lensRadius: 33,
      lensStrength: 0.75,
      invertRing: 1,
      wobble: 1,
      wobbleAmp: 6,
      wobbleFreq: 0.1,
      wobbleSpeed: 3,
      wobbleSlice: 2,
      audioReact: 0.7,
      beatKick: 0.7,
      seed: 0,
      lensPath: "circle"
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
