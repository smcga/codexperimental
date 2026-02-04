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
    expect(getEffectDebugDefaults("metaballs")).toEqual({
      bufW: 240,
      bufH: 180,
      count: 6,
      baseRadius: 34,
      radiusVar: 10,
      baseThreshold: 1.2,
      edgeSoftness: 0.08,
      normalZ: 220,
      ambient: 0.15,
      diffuse: 1,
      specStrength: 0.35,
      shininess: 24,
      rimStrength: 0.25,
      palette: "chrome",
      hueSpeed: 22,
      smoothing: 1,
      glow: 0.25,
      audioReact: 0.7,
      beatKick: 0.7,
      seed: 1
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

  it("provides defaults for sine distorter controls", () => {
    expect(getEffectDebugDefaults("sine_distorter")).toEqual({
      mode: "horizontal",
      amp: 28,
      freq: 0.06,
      speed: 2,
      slice: 2,
      phase: 0,
      sourceScale: 1,
      edges: "wrap",
      source: "logo",
      logoText: "DISTORT",
      audioReact: 0.7,
      beatBoost: 0.55,
      glow: 0.08
          });
  });
  
  it("provides defaults for glenz vectors controls", () => {
    expect(getEffectDebugDefaults("glenz_vectors")).toEqual({
      model: "octa",
      instances: 2,
      camDist: 3,
      focal: 0,
      rotXSpeed: 0.6,
      rotYSpeed: 0.85,
      rotZSpeed: 0.25,
      baseHue: 200,
      hueSpeed: 35,
      sat: 85,
      lightness: 55,
      faceAlpha: 0.1,
      edge: 1,
      edgeAlpha: 0.22,
      lineWidth: 2,
      trailFade: 0,
      sortFaces: "none",
      audioReact: 0.7,
      beatKick: 0.7,
      seed: 0
    });
  });
  
  it("provides defaults for raymarch fractal controls", () => {
    expect(getEffectDebugDefaults("raymarch_fractal")).toEqual({
      quality: 1,
      fractal: "mandelbulb",
      cameraRadius: 4,
      cameraHeight: 0,
      cameraOrbitSpeed: 0.2,
      paletteSpeed: 0.15,
      audioReact: 0.6,
      beatKick: 0.5,
      fractalScale: 1
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

  it("provides defaults for bumpmap plane controls", () => {
    expect(getEffectDebugDefaults("bumpmap_plane")).toEqual({
      bufW: 240,
      bufH: 180,
      bumpStrength: 0.035,
      ambient: 0.2,
      diffuseStrength: 1.05,
      specStrength: 0.35,
      shininess: 24,
      lightZ: 120,
      lightSpeed: 1,
      embossText: "BUMP",
      embossStrength: 70,
      animateBumps: 1,
      waveAmp: 18,
      waveFreqX: 0.08,
      waveFreqY: 0.06,
      baseHue: 200,
      paletteMode: "ramp",
      scanlines: 0,
      audioReact: 0.7,
      beatKick: 0.7,
      seed: 0
    });
  });
});
