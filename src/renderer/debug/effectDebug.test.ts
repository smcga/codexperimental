import { describe, expect, it } from "vitest";
import { coerceEffectParams, getEffectDebugConfig, getEffectDebugDefaults } from "./effectDebug";
import { getRegistryEffectNames } from "../effects/effectsDocGenerator";

describe("effect debug params", () => {
  it("provides defaults for known effects", () => {
    expect(getEffectDebugDefaults("starfield")).toEqual({
      speed: 1,
      warp: 0.3,
      turnRate: 0.7,
      turnStrength: 0.35,
      drift: 0.14,
      sparkle: 0.55,
      colorShift: 0
    });
  });

  it("coerces numeric params based on control constraints", () => {
    const params = coerceEffectParams("starfield", {
      speed: -1,
      warp: 2,
      turnRate: 1.5,
      turnStrength: -0.5,
      drift: -1,
      sparkle: 3,
      colorShift: 2
    });
    expect(params).toEqual({
      speed: 0,
      warp: 1,
      turnRate: 1.5,
      turnStrength: 0,
      drift: 0,
      sparkle: 2,
      colorShift: 1
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

  it("provides defaults for tetris matrix controls", () => {
    expect(getEffectDebugDefaults("tetris_matrix")).toEqual({
      speed: 1,
      level: 8,
      glow: 0.78,
      contrast: 0.88,
      ghost: 1,
      seed: 1989
    });
  });

  it("coerces tetris matrix params based on control constraints", () => {
    const params = coerceEffectParams("tetris_matrix", {
      speed: 0,
      level: 30,
      glow: -1,
      contrast: 5,
      ghost: -0.5,
      seed: 10001
    });

    expect(params).toEqual({
      speed: 0.35,
      level: 20,
      glow: 0,
      contrast: 1.3,
      ghost: 0,
      seed: 9999
    });
  });

  it("provides defaults for velvet dreamscape controls", () => {
    expect(getEffectDebugDefaults("velvet_dreamscape")).toEqual({
      bloom: 0.78,
      flow: 0.62,
      ribbonCount: 11,
      grain: 0.32,
      hueDrift: 0.08,
      focus: 0.58,
      audioReact: 0.68,
      seed: 5
    });
  });

  it("coerces velvet dreamscape params based on control constraints", () => {
    const params = coerceEffectParams("velvet_dreamscape", {
      bloom: -1,
      flow: 3,
      ribbonCount: 99,
      grain: -0.2,
      hueDrift: 4,
      focus: 9,
      audioReact: 2,
      seed: 10000
    });

    expect(params).toEqual({
      bloom: 0,
      flow: 1.8,
      ribbonCount: 24,
      grain: 0,
      hueDrift: 1,
      focus: 1.2,
      audioReact: 1,
      seed: 9999
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

  it("provides defaults for road drive controls", () => {
    expect(getEffectDebugDefaults("roadDrive")).toEqual({
      speed: 1,
      roadWidth: 8,
      laneDashLength: 2.8,
      laneGap: 2.2,
      fog: 0.68,
      glow: 1,
      cameraBob: 0.22,
      curveStrength: 1.6,
      curveFrequency: 0.06,
      bassReactive: 0.85,
      rmsReactive: 0.45
    });
  });

  it("provides defaults for rain controls", () => {
    expect(getEffectDebugDefaults("rain")).toEqual({
      intensity: 0.5,
      wind: 0.1,
      speed: 1,
      streakLength: 1,
      splash: 0,
      hue: 205,
      storm: 0.5,
      turbulence: 0.35,
      mist: 0.35,
      seed: 0
    });
  });

  it("coerces rain params based on control constraints", () => {
    const params = coerceEffectParams("rain", {
      intensity: -1,
      wind: 2,
      speed: -2,
      streakLength: 99,
      splash: true,
      hue: 500,
      storm: -0.4,
      turbulence: 2,
      mist: -0.2,
      seed: 1000
    });

    expect(params).toEqual({
      intensity: 0,
      wind: 1,
      speed: 0,
      streakLength: 2.5,
      splash: 1,
      hue: 360,
      storm: 0,
      turbulence: 1,
      mist: 0,
      seed: 999
    });
  });

  it("provides defaults for rainbow cat controls", () => {
    expect(getEffectDebugDefaults("rainbow_cat")).toEqual({
      speed: 0.9,
      rainbowLength: 0.72,
      bounce: 0.45,
      sparkle: 0.6,
      trailAlpha: 0.82,
      catScale: 1,
      starDensity: 0.65,
      seed: 0
    });
  });

  it("coerces rainbow cat params based on control constraints", () => {
    const params = coerceEffectParams("rainbow_cat", {
      speed: 0,
      rainbowLength: 2,
      bounce: -1,
      sparkle: 3,
      trailAlpha: 0,
      catScale: 5,
      starDensity: -1,
      seed: 1200
    });

    expect(params).toEqual({
      speed: 0.2,
      rainbowLength: 1,
      bounce: 0,
      sparkle: 1,
      trailAlpha: 0.1,
      catScale: 1.8,
      starDensity: 0,
      seed: 999
    });
  });

  it("provides defaults for water drops controls", () => {
    expect(getEffectDebugDefaults("water_drops")).toEqual({
      dropCount: 72,
      minRadius: 3,
      maxRadius: 18,
      fallSpeed: 0.12,
      distortion: 0.38,
      trail: 0.28,
      audioReact: 0.25,
      tint: 205,
      refraction: 0.85,
      microDrops: 0.7,
      rivulets: 0.35,
      seed: 0
    });
  });

  it("coerces water drops params based on control constraints", () => {
    const params = coerceEffectParams("water_drops", {
      dropCount: 2,
      minRadius: 0,
      maxRadius: 500,
      fallSpeed: -3,
      distortion: 2,
      trail: -1,
      audioReact: 5,
      tint: 999,
      refraction: -4,
      microDrops: 5,
      rivulets: -2,
      seed: 1200
    });

    expect(params).toEqual({
      dropCount: 8,
      minRadius: 1,
      maxRadius: 120,
      fallSpeed: 0,
      distortion: 1,
      trail: 0,
      audioReact: 1,
      tint: 230,
      refraction: 0,
      microDrops: 1,
      rivulets: 0,
      seed: 999
    });
  });

  it("provides defaults for tree growth controls", () => {
    expect(getEffectDebugDefaults("treegrowth")).toEqual({
      speed: 0.12,
      levels: 8,
      trunkHeight: 0.52,
      branchScale: 0.69,
      branchAngle: 23,
      trunkWidth: 8,
      sway: 0.22,
      leafSize: 2.2,
      jitter: 0.16,
      seed: 0,
      growth: -1
    });
  });

  it("provides defaults for envmap donut controls", () => {
    expect(getEffectDebugDefaults("envmap_donut")).toEqual({
      bufW: 240,
      bufH: 180,
      segmentsU: 64,
      segmentsV: 32,
      R: 1.2,
      r: 0.55,
      camDist: 3.4,
      focalMul: 1.2,
      rotXSpeed: 0.35,
      rotYSpeed: 0.75,
      rotZSpeed: 0.15,
      fresnelStrength: 0.35,
      specStrength: 0.45,
      shininess: 24,
      chromeDesat: 0.35,
      backfaceCull: 1,
      scanlines: 0,
      edge: 0,
      audioReact: 0.7,
      beatKick: 0.7,
      seed: 0
    });
  });
  it("provides defaults for voxel landscape controls", () => {
    expect(getEffectDebugDefaults("voxel_landscape")).toEqual({
      bufW: 320,
      bufH: 200,
      speed: 70,
      turnRate: 0.15,
      turnWobble: 0.1,
      camH: 110,
      heightBob: 6,
      beatBump: 10,
      fov: 1,
      horizon: 90,
      scale: 120,
      maxDist: 900,
      stepBase: 2,
      stepGrow: 80,
      fogStrength: 0.75,
      audioReact: 0.7,
      beatKick: 0.7,
      scanlines: 0,
      seed: 1337
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
  it("provides defaults for textured cube controls", () => {
    expect(getEffectDebugDefaults("textured_cube")).toEqual({
      scale: 3,
      camDist: 4,
      focalMul: 0.9,
      rotXSpeed: 0.5,
      rotYSpeed: 0.8,
      rotZSpeed: 0.15,
      backfaceCull: 1,
      perspectiveCorrect: 0,
      edge: 1,
      edgeAlpha: 0.25,
      shadeStrength: 0.55,
      audioReact: 0.7,
      beatKick: 0.7,
      textureAnim: 0
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
  it("provides defaults for shadebobs + bobs controls", () => {
    expect(getEffectDebugDefaults("shadebobs_bobs")).toEqual({
      mode: "hybrid",
      shadeCount: 28,
      bobCount: 40,
      shadeScale: 2,
      blobRadius: 70,
      trailFade: 0.12,
      blend: "lighter",
      hueSpeed: 40,
      steer: 40,
      maxSpeed: 220,
      spriteSize: 48,
      boingCheckers: 1,
      bobAlpha: 0.95,
      fastBlob: 0,
      audioReact: 0.7,
      beatPulseStrength: 0.7,
      dirtyRects: 0,
      seed: 0
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

  it("clamps spectrum analyzer params within control bounds", () => {
    const params = coerceEffectParams("spectrum_analyzer", {
      bands: 400,
      smoothing: -1,
      curve: 99,
      tilt: -4,
      peakHold: 9,
      grid: -2,
      glow: 3
    });
    expect(params).toEqual({
      bands: 192,
      smoothing: 0,
      curve: 2.5,
      tilt: -1,
      peakHold: 1,
      grid: 0,
      glow: 1
    });
  });

  it("provides defaults for poly morph showcase controls", () => {
    expect(getEffectDebugDefaults("poly_morph_showcase")).toEqual({
      lat: 16,
      lon: 24,
      morphSpeed: 0.08,
      styleSpeed: 0.1,
      style: "auto",
      camDist: 3.6,
      focalMul: 0.9,
      rotXSpeed: 0.5,
      rotYSpeed: 0.8,
      rotZSpeed: 0.2,
      sat: 85,
      baseHue: 200,
      hueSpeed: 25,
      solidAlpha: 0.9,
      glenzAlpha: 0.13,
      shadedAlpha: 0.95,
      edge: 1,
      edgeAlpha: 0.18,
      sortSolid: 1,
      sortShaded: 1,
      sortGlenz: 0,
      audioReact: 0.7,
      beatKick: 0.7,
      seed: 0
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
  it("provides defaults for greets wall controls", () => {
    expect(getEffectDebugDefaults("greets_wall")).toEqual({
      layout: "grid",
      transitionStyle: "slide",
      cycleSeconds: 1.5,
      columns: 3,
      padding: 0.08,
      highlightPulse: 0.65,
      beatPulseDecay: 2.2,
      audioReact: 0.45,
      title: "GREETS",
      names: "Fairlight|TRSI|Spaceballs|CNCD|Mercury|TBL"
    });
  });

  it("provides defaults for doodle greetz wall controls", () => {
    expect(getEffectDebugDefaults("doodle_greetz_wall")).toEqual({
      layout: "grid",
      transitionStyle: "slide",
      cycleSeconds: 1.5,
      columns: 3,
      padding: 0.08,
      highlightPulse: 0.65,
      beatPulseDecay: 2.2,
      audioReact: 0.45,
      title: "DOODLE GREETZ WALL"
    });
  });

  it("provides defaults for taco meteor shower controls", () => {
    expect(getEffectDebugDefaults("taco_meteor_shower")).toEqual({
      shellCount: 16,
      fallSpeed: 0.62,
      swirl: 0.7,
      burst: 0.78,
      stardust: 0.72,
      toppingSpread: 0.7,
      audioReact: 0.68,
      seed: 7
    });
  });

  it("provides defaults for textmode charset controls", () => {
    expect(getEffectDebugDefaults("textmode_charset")).toEqual({
      cols: 64,
      rows: 36,
      glyphSet: 0,
      mode: 0,
      speed: 1,
      palette: 0,
      scanlines: 0.2,
      seed: 1
    });
  });

  it("clamps textmode charset controls to editor bounds", () => {
    const params = coerceEffectParams("textmode_charset", {
      cols: 1,
      rows: 999,
      glyphSet: -2,
      mode: 99,
      speed: -4,
      palette: 40,
      scanlines: -3,
      seed: -7
    });

    expect(params).toEqual({
      cols: 12,
      rows: 120,
      glyphSet: 0,
      mode: 8,
      speed: 0,
      palette: 8,
      scanlines: 0,
      seed: 0
    });
  });

  it("exposes at least one debug control for every registered effect", () => {
    const missing = getRegistryEffectNames().filter((effectName) => {
      const config = getEffectDebugConfig(effectName);
      return !config || config.controls.length === 0;
    });

    expect(missing).toEqual([]);
  });

});
