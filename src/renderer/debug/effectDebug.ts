import { clamp } from "../../util/math";
import { NEON_ALLEY_DEFAULTS } from "../effects/gl/neonAlleyEffect";
import { SPACE_HANGAR_DEFAULTS } from "../effects/gl/spaceHangarEffect";
import { DEFAULT_FLYOVER_PARAMS, coerceFlyoverParams } from "./flyoverDebug";
import { WIREFRAME_RIDE_DEFAULTS } from "../effects/wireframeRide";
import { BORDER_MULTIPLEX_DEFAULTS } from "../effects/borderMultiplexEffect";
import { SINE_DISTORTER_DEFAULTS } from "../effects/sineDistorter";
import { GLENZ_VECTORS_DEFAULTS } from "../effects/glenzVectors";
import { BUMPMAP_PLANE_DEFAULTS } from "../effects/bumpmapPlane";

export type EffectParamValue = number | string;

type EffectParamOption = {
  label: string;
  value: string;
};

export type EffectParamControl = {
  key: string;
  label: string;
  type: "number" | "select" | "toggle";
  defaultValue: EffectParamValue;
  min?: number;
  max?: number;
  step?: number;
  options?: EffectParamOption[];
};

export type EffectDebugConfig = {
  title: string;
  controls: EffectParamControl[];
};

const numberControl = (
  key: string,
  label: string,
  defaultValue: number,
  options: { min?: number; max?: number; step?: number } = {}
): EffectParamControl => ({
  key,
  label,
  type: "number",
  defaultValue,
  min: options.min,
  max: options.max,
  step: options.step
});

const toggleControl = (key: string, label: string, defaultValue: boolean): EffectParamControl => ({
  key,
  label,
  type: "toggle",
  defaultValue: defaultValue ? 1 : 0
});

const selectControl = (key: string, label: string, defaultValue: string, options: EffectParamOption[]): EffectParamControl => ({
  key,
  label,
  type: "select",
  defaultValue,
  options
});

const EFFECT_DEBUG_CONFIGS: Record<string, EffectDebugConfig> = {
  starfield: {
    title: "Starfield Controls",
    controls: [
      numberControl("speed", "Speed", 1.0, { min: 0, step: 0.05 }),
      numberControl("warp", "Warp", 0.3, { min: 0, max: 1, step: 0.05 }),
      numberControl("turnRate", "Turn Rate", 0.7, { min: 0, step: 0.05 }),
      numberControl("turnStrength", "Turn Strength", 0.35, { min: 0, max: 1, step: 0.05 })
    ]
  },
  plasma: {
    title: "Plasma Controls",
    controls: [numberControl("speed", "Speed", 1.0, { min: 0, step: 0.05 })]
  },
  tunnel: {
    title: "Tunnel Controls",
    controls: [numberControl("speed", "Speed", 1.1, { min: 0, step: 0.05 })]
  },
  rotozoom: {
    title: "Rotozoom Controls",
    controls: [numberControl("speed", "Speed", 1.0, { min: 0, step: 0.05 })]
  },
  blobs: {
    title: "Blobs Controls",
    controls: [
      numberControl("count", "Count", 6, { min: 1, max: 12, step: 1 }),
      numberControl("radius", "Radius", 0.12, { min: 0.05, max: 0.3, step: 0.01 }),
      numberControl("orbit", "Orbit", 0.25, { min: 0, max: 0.6, step: 0.01 }),
      numberControl("speed", "Speed", 0.6, { min: 0, step: 0.05 }),
      numberControl("glow", "Glow", 0.8, { min: 0, max: 1.5, step: 0.05 })
    ]
  },
  metaballs: {
    title: "Metaballs Controls",
    controls: [
      numberControl("bufW", "Buffer Width", 240, { min: 120, max: 480, step: 10 }),
      numberControl("bufH", "Buffer Height", 180, { min: 90, max: 360, step: 10 }),
      numberControl("count", "Ball Count", 6, { min: 2, max: 12, step: 1 }),
      numberControl("baseRadius", "Base Radius", 34, { min: 8, max: 80, step: 1 }),
      numberControl("radiusVar", "Radius Variance", 10, { min: 0, max: 30, step: 1 }),
      numberControl("baseThreshold", "Base Threshold", 1.2, { min: 0.5, max: 2, step: 0.02 }),
      numberControl("edgeSoftness", "Edge Softness", 0.08, { min: 0.01, max: 0.2, step: 0.01 }),
      numberControl("normalZ", "Normal Z", 220, { min: 40, max: 400, step: 5 }),
      numberControl("ambient", "Ambient", 0.15, { min: 0, max: 1, step: 0.05 }),
      numberControl("diffuse", "Diffuse", 1, { min: 0, max: 2, step: 0.05 }),
      numberControl("specStrength", "Specular Strength", 0.35, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("shininess", "Shininess", 24, { min: 1, max: 64, step: 1 }),
      numberControl("rimStrength", "Rim Strength", 0.25, { min: 0, max: 1.5, step: 0.05 }),
      selectControl("palette", "Palette", "chrome", [
        { label: "Chrome", value: "chrome" },
        { label: "Neon", value: "neon" }
      ]),
      numberControl("hueSpeed", "Hue Speed", 22, { min: 0, max: 60, step: 1 }),
      toggleControl("smoothing", "Smoothing", true),
      numberControl("glow", "Glow", 0.25, { min: 0, max: 1, step: 0.05 }),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", 1, { min: 0, max: 999, step: 1 })
    ]
  },
  ribbons: {
    title: "Ribbon Controls",
    controls: [
      numberControl("count", "Count", 5, { min: 1, max: 12, step: 1 }),
      numberControl("speed", "Speed", 0.8, { min: 0, step: 0.05 }),
      numberControl("amplitude", "Amplitude", 0.15, { min: 0.05, max: 0.4, step: 0.01 }),
      numberControl("audioBoost", "Audio Boost", 0.2, { min: 0, max: 0.5, step: 0.01 }),
      numberControl("offset", "Offset", 0.3, { min: 0, max: 0.8, step: 0.01 }),
      numberControl("spacing", "Spacing", 0.08, { min: 0, max: 0.3, step: 0.01 }),
      numberControl("thickness", "Thickness", 2, { min: 0.5, max: 6, step: 0.1 })
    ]
  },
  lissajous: {
    title: "Lissajous Controls",
    controls: [
      numberControl("points", "Points", 320, { min: 80, max: 800, step: 10 }),
      numberControl("speed", "Speed", 1, { min: 0, max: 3, step: 0.05 }),
      numberControl("a", "A Frequency", 3, { min: 1, max: 6, step: 0.1 }),
      numberControl("b", "B Frequency", 2, { min: 1, max: 6, step: 0.1 }),
      numberControl("radius", "Radius", 0.35, { min: 0.1, max: 0.5, step: 0.01 }),
      numberControl("lineWidth", "Line Width", 1.5, { min: 0.5, max: 6, step: 0.1 })
    ]
  },
  glitch: {
    title: "Glitch Controls",
    controls: [
      numberControl("sparkles", "Sparkles", 60, { min: 10, max: 200, step: 5 }),
      numberControl("sparkleSize", "Sparkle Size", 2, { min: 1, max: 6, step: 0.5 }),
      numberControl("sliceCount", "Slice Count", 3, { min: 1, max: 10, step: 1 }),
      numberControl("sliceBoost", "Slice Boost", 10, { min: 0, max: 20, step: 1 }),
      numberControl("sliceHeight", "Slice Height", 4, { min: 1, max: 12, step: 1 }),
      numberControl("sliceVariance", "Slice Variance", 18, { min: 0, max: 30, step: 1 }),
      numberControl("offset", "Offset", 0.08, { min: 0, max: 0.3, step: 0.01 }),
      numberControl("shake", "Shake", 4, { min: 0, max: 10, step: 0.1 }),
      numberControl("maxShake", "Max Shake", 5, { min: 0.5, max: 12, step: 0.1 })
    ]
  },
  bokeh: {
    title: "Bokeh Controls",
    controls: [
      numberControl("count", "Count", 40, { min: 10, max: 120, step: 5 }),
      numberControl("speed", "Speed", 0.7, { min: 0, max: 2, step: 0.05 }),
      numberControl("radius", "Radius", 30, { min: 4, max: 80, step: 1 }),
      numberControl("alpha", "Alpha", 0.15, { min: 0.05, max: 0.8, step: 0.05 }),
      numberControl("hueShift", "Hue Shift", 0, { min: -180, max: 180, step: 5 })
    ]
  },
  fractal: {
    title: "Fractal Controls",
    controls: [
      numberControl("iterations", "Iterations", 600, { min: 200, max: 1400, step: 50 }),
      numberControl("trebleBoost", "Treble Boost", 400, { min: 0, max: 800, step: 25 }),
      numberControl("speed", "Speed", 1, { min: 0, max: 3, step: 0.05 }),
      numberControl("scale", "Scale", 0.25, { min: 0.1, max: 0.4, step: 0.01 }),
      numberControl("alpha", "Alpha", 0.1, { min: 0.05, max: 0.8, step: 0.05 })
    ]
  },
  feedback: {
    title: "Feedback Controls",
    controls: [
      numberControl("scale", "Scale", 0.02, { min: 0, max: 0.2, step: 0.005 }),
      numberControl("wobble", "Wobble", 0.01, { min: 0, max: 0.05, step: 0.005 }),
      numberControl("rotation", "Rotation", 0.02, { min: 0, max: 0.1, step: 0.005 }),
      numberControl("trail", "Trail", 0.96, { min: 0.85, max: 0.99, step: 0.01 }),
      numberControl("glow", "Glow", 0.2, { min: 0.05, max: 0.6, step: 0.05 })
    ]
  },
  equalizer: {
    title: "Equalizer Controls",
    controls: [
      numberControl("bars", "Bars", 48, { min: 8, max: 128, step: 1 }),
      numberControl("barWidth", "Bar Width", 0.8, { min: 0.2, max: 1, step: 0.05 }),
      numberControl("height", "Height", 0.8, { min: 0.2, max: 1, step: 0.05 }),
      numberControl("bassBoost", "Bass Boost", 10, { min: 0, max: 60, step: 1 }),
      numberControl("alpha", "Alpha", 0.8, { min: 0.1, max: 1, step: 0.05 })
    ]
  },
  isogrid: {
    title: "Isogrid Controls",
    controls: [
      numberControl("opacity", "Opacity", 0.2, { min: 0.05, max: 0.8, step: 0.05 }),
      numberControl("lineWidth", "Line Width", 1, { min: 0.5, max: 4, step: 0.1 }),
      numberControl("spacing", "Spacing", 18, { min: 8, max: 40, step: 1 }),
      numberControl("wave", "Wave", 8, { min: 0, max: 20, step: 1 }),
      numberControl("speed", "Speed", 0.8, { min: 0, max: 3, step: 0.05 })
    ]
  },
  neon: {
    title: "Neon Controls",
    controls: [
      numberControl("shapes", "Shapes", 4, { min: 1, max: 8, step: 1 }),
      numberControl("radius", "Radius", 30, { min: 10, max: 80, step: 1 }),
      numberControl("radiusStep", "Radius Step", 24, { min: 5, max: 60, step: 1 }),
      numberControl("speed", "Speed", 0.6, { min: 0, max: 2, step: 0.05 }),
      numberControl("glow", "Glow", 18, { min: 4, max: 40, step: 1 }),
      numberControl("lineWidth", "Line Width", 2, { min: 0.5, max: 6, step: 0.1 })
    ]
  },
  particles: {
    title: "Particle Field Controls",
    controls: [
      numberControl("trail", "Trail", 0.2, { min: 0, max: 0.6, step: 0.05 }),
      numberControl("burst", "Burst", 24, { min: 4, max: 80, step: 1 }),
      numberControl("burstAudio", "Burst Audio", 20, { min: 0, max: 60, step: 1 }),
      numberControl("force", "Force", 1, { min: 0.2, max: 4, step: 0.1 }),
      numberControl("forceAudio", "Force Audio", 2, { min: 0, max: 6, step: 0.1 })
    ]
  },
  border_multiplex: {
    title: "Border Multiplex Controls",
    controls: [
      numberControl("hwSprites", "HW Sprites", BORDER_MULTIPLEX_DEFAULTS.hwSprites, { min: 4, max: 16, step: 1 }),
      numberControl("totalSprites", "Total Sprites", BORDER_MULTIPLEX_DEFAULTS.totalSprites, { min: 16, max: 160, step: 1 }),
      numberControl("bandHeight", "Band Height", BORDER_MULTIPLEX_DEFAULTS.bandHeight, { min: 12, max: 64, step: 1 }),
      numberControl("spriteSize", "Sprite Size", BORDER_MULTIPLEX_DEFAULTS.spriteSize, { min: 6, max: 24, step: 1 }),
      numberControl("speed", "Speed", BORDER_MULTIPLEX_DEFAULTS.speed, { min: 20, max: 200, step: 1 }),
      numberControl("rasterJitter", "Raster Jitter", BORDER_MULTIPLEX_DEFAULTS.rasterJitter, { min: 0, max: 6, step: 0.1 }),
      numberControl("borderMaskStrength", "Border Mask", BORDER_MULTIPLEX_DEFAULTS.borderMaskStrength, { min: 0, max: 1, step: 0.05 }),
      numberControl("audioReact", "Audio React", BORDER_MULTIPLEX_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", BORDER_MULTIPLEX_DEFAULTS.seed, { min: 0, max: 999, step: 1 })
    ]
  },
  fluid: {
    title: "Fluid Simulation Controls",
    controls: [
      numberControl("speed", "Speed", 1, { min: 0, max: 3, step: 0.05 }),
      numberControl("dissipation", "Dissipation", 0.985, { min: 0.9, max: 0.999, step: 0.001 }),
      numberControl("splatCount", "Splat Count", 3, { min: 0, max: 8, step: 1 }),
      numberControl("splatSize", "Splat Size", 6, { min: 2, max: 12, step: 0.5 }),
      numberControl("turbulence", "Turbulence", 1.1, { min: 0, max: 3, step: 0.05 }),
      numberControl("hueShift", "Hue Shift", 0, { min: -180, max: 180, step: 5 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 999, step: 1 })
    ]
  },
  finale: {
    title: "Finale Controls",
    controls: [
      numberControl("trail", "Trail", 0.4, { min: 0.05, max: 0.8, step: 0.05 }),
      numberControl("starSpeed", "Star Speed", 1.2, { min: 0, max: 4, step: 0.05 }),
      numberControl("starWarp", "Star Warp", 0.9, { min: 0, max: 2, step: 0.05 }),
      numberControl("starTurn", "Star Turn", 0.35, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("particleCount", "Particle Count", 40, { min: 10, max: 120, step: 1 }),
      numberControl("particleForce", "Particle Force", 3, { min: 0.5, max: 6, step: 0.1 }),
      numberControl("bars", "Bars", 32, { min: 8, max: 64, step: 1 }),
      numberControl("barHeight", "Bar Height", 0.6, { min: 0.2, max: 1, step: 0.05 })
    ]
  },
  proper3d: {
    title: "Proper 3D Controls",
    controls: [numberControl("speed", "Speed", 1.0, { min: 0, step: 0.05 })]
  },
  fake3d: {
    title: "Fake 3D Controls",
    controls: [numberControl("speed", "Speed", 1.0, { min: 0, step: 0.05 })]
  },
  portrait: {
    title: "Portrait Controls",
    controls: [
      numberControl("zoom", "Zoom", 1.05, { min: 0.5, step: 0.01 }),
      numberControl("drift", "Drift", 1.0, { min: 0, step: 0.05 })
    ]
  },
  sphere3d: {
    title: "Sphere Controls",
    controls: [numberControl("speed", "Speed", 1.0, { min: 0, step: 0.05 })]
  },
  spherecloud: {
    title: "Sphere Cloud Controls",
    controls: [numberControl("speed", "Speed", 1.0, { min: 0, step: 0.05 })]
  },
  infinitycloud: {
    title: "Infinity Cloud Controls",
    controls: [numberControl("speed", "Speed", 1.0, { min: 0, step: 0.05 })]
  },
  chess: {
    title: "Chess Controls",
    controls: [
      numberControl("speed", "Speed", 1.0, { min: 0.1, step: 0.05 }),
      toggleControl("showHighlights", "Show Highlights", true),
      numberControl("startTime", "Start Time", 0, { min: 0, step: 0.1 })
    ]
  },
  flyover: {
    title: "Flyover Controls",
    controls: [
      numberControl("speed", "Speed", DEFAULT_FLYOVER_PARAMS.speed, { min: 0, step: 0.05 }),
      numberControl("horizon", "Horizon", DEFAULT_FLYOVER_PARAMS.horizon, { min: 0, max: 1, step: 0.01 }),
      numberControl("seaDetail", "Sea Detail", DEFAULT_FLYOVER_PARAMS.seaDetail, { min: 0.5, step: 0.1 }),
      numberControl("waveSpeed", "Wave Speed", DEFAULT_FLYOVER_PARAMS.waveSpeed, { min: 0, step: 0.05 }),
      numberControl("waveIntensity", "Wave Intensity", DEFAULT_FLYOVER_PARAMS.waveIntensity, { min: 0, step: 0.05 }),
      numberControl("islandCount", "Island Count", DEFAULT_FLYOVER_PARAMS.islandCount, { min: 1, step: 1 }),
      numberControl("islandSeed", "Island Seed", DEFAULT_FLYOVER_PARAMS.islandSeed, { step: 1 }),
      numberControl("fog", "Fog", DEFAULT_FLYOVER_PARAMS.fog, { min: 0, max: 1, step: 0.05 }),
      selectControl("palette", "Palette", DEFAULT_FLYOVER_PARAMS.palette, [
        { label: "Day", value: "day" },
        { label: "Sunset", value: "sunset" },
        { label: "Night", value: "night" }
      ]),
      numberControl("audioReactive", "Audio Reactive", DEFAULT_FLYOVER_PARAMS.audioReactive, {
        min: 0,
        max: 1,
        step: 0.05
      })
    ]
  },
  synthwaveSunset: {
    title: "Synthwave Sunset Controls",
    controls: [
      numberControl("horizon", "Horizon", 0.52, { min: 0.35, max: 0.75, step: 0.01 }),
      numberControl("sunRadius", "Sun Radius", 0.25, { min: 0.1, max: 0.5, step: 0.01 }),
      numberControl("stripeHeight", "Stripe Height", 6, { min: 2, max: 16, step: 1 }),
      numberControl("stripeGap", "Stripe Gap", 4, { min: 1, max: 12, step: 1 }),
      numberControl("seaSpeed", "Sea Speed", 1.0, { min: 0, max: 3, step: 0.05 }),
      numberControl("starCount", "Star Count", 200, { min: 0, max: 500, step: 10 }),
      numberControl("glow", "Glow", 0.35, { min: 0, max: 1, step: 0.05 }),
      numberControl("scanlines", "Scanlines", 0.25, { min: 0, max: 1, step: 0.05 }),
      numberControl("audioReactive", "Audio Reactive", 0.3, { min: 0, max: 1, step: 0.05 })
      ]
  },
  gl_fractal_tunnel: {
    title: "Fractal Tunnel (WebGL) Controls",
    controls: [
      numberControl("quality", "Quality", 2, { min: 1, max: 3, step: 1 }),
      numberControl("warp", "Warp", 1.1, { min: 0, max: 2, step: 0.05 }),
      numberControl("hueShift", "Hue Shift", 0.15, { min: 0, max: 1, step: 0.01 }),
      numberControl("exposure", "Exposure", 1.2, { min: 0.5, max: 2, step: 0.05 }),
      numberControl("seed", "Seed", 7, { step: 1 })
    ]
  },
  neon_alley: {
    title: "Neon Alley (WebGL) Controls",
    controls: [
      numberControl("quality", "Quality", NEON_ALLEY_DEFAULTS.quality, { min: 1, max: 3, step: 1 }),
      numberControl("speed", "Speed", NEON_ALLEY_DEFAULTS.speed, { min: 0.2, max: 1.6, step: 0.05 }),
      numberControl("exposure", "Exposure", NEON_ALLEY_DEFAULTS.exposure, { min: 0.6, max: 2, step: 0.05 }),
      numberControl("hueShift", "Hue Shift", NEON_ALLEY_DEFAULTS.hueShift, { min: 0, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", NEON_ALLEY_DEFAULTS.seed, { step: 1 })
    ]
  },
  space_hangar: {
    title: "Space Hangar (WebGL) Controls",
    controls: [
      numberControl("quality", "Quality", SPACE_HANGAR_DEFAULTS.quality, { min: 1, max: 3, step: 1 }),
      numberControl("speed", "Speed", SPACE_HANGAR_DEFAULTS.speed, { min: 0.2, max: 2, step: 0.05 }),
      numberControl("exposure", "Exposure", SPACE_HANGAR_DEFAULTS.exposure, { min: 0.6, max: 2, step: 0.05 }),
      numberControl("hueShift", "Hue Shift", SPACE_HANGAR_DEFAULTS.hueShift, { min: 0, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", SPACE_HANGAR_DEFAULTS.seed, { step: 1 })
    ]
  },
  wireframeRide: {
    title: "Wireframe Ride (WebGL) Controls",
    controls: [
      numberControl("speed", "Speed", WIREFRAME_RIDE_DEFAULTS.speed, { min: 0.2, max: 3, step: 0.05 }),
      numberControl("gridWidth", "Grid Width", WIREFRAME_RIDE_DEFAULTS.gridWidth, { min: 20, max: 140, step: 1 }),
      numberControl("gridDepth", "Grid Depth", WIREFRAME_RIDE_DEFAULTS.gridDepth, { min: 40, max: 240, step: 1 }),
      numberControl("gridResX", "Grid Res X", WIREFRAME_RIDE_DEFAULTS.gridResX, { min: 40, max: 320, step: 1 }),
      numberControl("gridResZ", "Grid Res Z", WIREFRAME_RIDE_DEFAULTS.gridResZ, { min: 60, max: 360, step: 1 }),
      numberControl("amplitude", "Amplitude", WIREFRAME_RIDE_DEFAULTS.amplitude, { min: 0, max: 18, step: 0.1 }),
      numberControl("noiseFreq", "Noise Freq", WIREFRAME_RIDE_DEFAULTS.noiseFreq, { min: 0.02, max: 0.2, step: 0.01 }),
      numberControl("cameraHeight", "Camera Height", WIREFRAME_RIDE_DEFAULTS.cameraHeight, { min: 2, max: 24, step: 0.5 }),
      numberControl("fov", "FOV", WIREFRAME_RIDE_DEFAULTS.fov, { min: 40, max: 90, step: 1 }),
      numberControl("fog", "Fog", WIREFRAME_RIDE_DEFAULTS.fog, { min: 0, max: 1, step: 0.01 }),
      numberControl("neon", "Neon", WIREFRAME_RIDE_DEFAULTS.neon, { min: 0.4, max: 2.5, step: 0.05 }),
      numberControl("bassReactive", "Bass Reactive", WIREFRAME_RIDE_DEFAULTS.bassReactive, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("rmsReactive", "RMS Reactive", WIREFRAME_RIDE_DEFAULTS.rmsReactive, { min: 0, max: 1.5, step: 0.05 }),
      toggleControl("sun", "Sun", WIREFRAME_RIDE_DEFAULTS.sun === 1)
    ]
  },
  glenz_vectors: {
    title: "Glenz Vectors Controls",
    controls: [
      selectControl("model", "Model", GLENZ_VECTORS_DEFAULTS.model, [
        { label: "Cube", value: "cube" },
        { label: "Octa", value: "octa" },
        { label: "Icosa", value: "icosa" }
      ]),
      numberControl("instances", "Instances", GLENZ_VECTORS_DEFAULTS.instances, { min: 1, max: 6, step: 1 }),
      numberControl("camDist", "Camera Distance", GLENZ_VECTORS_DEFAULTS.camDist, { min: 2.2, max: 6.5, step: 0.1 }),
      numberControl("focal", "Focal Length", 0, { min: 0, max: 1200, step: 10 }),
      numberControl("rotXSpeed", "Rotate X Speed", GLENZ_VECTORS_DEFAULTS.rotXSpeed, { min: 0, max: 2.5, step: 0.05 }),
      numberControl("rotYSpeed", "Rotate Y Speed", GLENZ_VECTORS_DEFAULTS.rotYSpeed, { min: 0, max: 2.5, step: 0.05 }),
      numberControl("rotZSpeed", "Rotate Z Speed", GLENZ_VECTORS_DEFAULTS.rotZSpeed, { min: 0, max: 2.0, step: 0.05 }),
      numberControl("baseHue", "Base Hue", GLENZ_VECTORS_DEFAULTS.baseHue, { min: 0, max: 360, step: 5 }),
      numberControl("hueSpeed", "Hue Speed", GLENZ_VECTORS_DEFAULTS.hueSpeed, { min: -120, max: 120, step: 1 }),
      numberControl("sat", "Saturation", GLENZ_VECTORS_DEFAULTS.sat, { min: 0, max: 100, step: 1 }),
      numberControl("lightness", "Lightness", GLENZ_VECTORS_DEFAULTS.lightness, { min: 0, max: 100, step: 1 }),
      numberControl("faceAlpha", "Face Alpha", GLENZ_VECTORS_DEFAULTS.faceAlpha, { min: 0, max: 0.6, step: 0.01 }),
      toggleControl("edge", "Edges", GLENZ_VECTORS_DEFAULTS.edge),
      numberControl("edgeAlpha", "Edge Alpha", GLENZ_VECTORS_DEFAULTS.edgeAlpha, { min: 0, max: 1, step: 0.01 }),
      numberControl("lineWidth", "Line Width", GLENZ_VECTORS_DEFAULTS.lineWidth, { min: 0.5, max: 6, step: 0.1 }),
      numberControl("trailFade", "Trail Fade", GLENZ_VECTORS_DEFAULTS.trailFade, { min: 0, max: 1, step: 0.02 }),
      selectControl("sortFaces", "Sort Faces", GLENZ_VECTORS_DEFAULTS.sortFaces, [
        { label: "None", value: "none" },
        { label: "Back to Front", value: "backToFront" }
      ]),
      numberControl("audioReact", "Audio React", GLENZ_VECTORS_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", GLENZ_VECTORS_DEFAULTS.beatKick, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", GLENZ_VECTORS_DEFAULTS.seed, { min: 0, max: 999, step: 1 })
          ]
  },
  
  raymarch_fractal: {
    title: "Raymarch Fractal (WebGL) Controls",
    controls: [
      numberControl("quality", "Quality", 1.0, { min: 0.5, max: 1.5, step: 0.05 }),
      selectControl("fractal", "Fractal", "mandelbulb", [
        { label: "Mandelbulb", value: "mandelbulb" },
        { label: "Mandelbox", value: "mandelbox" }
      ]),
      numberControl("cameraRadius", "Camera Radius", 4.0, { min: 2, max: 8, step: 0.05 }),
      numberControl("cameraHeight", "Camera Height", 0.0, { min: -2, max: 2, step: 0.05 }),
      numberControl("cameraOrbitSpeed", "Camera Orbit Speed", 0.2, { min: 0, max: 1, step: 0.01 }),
      numberControl("paletteSpeed", "Palette Speed", 0.15, { min: 0, max: 0.6, step: 0.01 }),
      numberControl("audioReact", "Audio React", 0.6, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", 0.5, { min: 0, max: 1, step: 0.05 }),
      numberControl("fractalScale", "Fractal Scale", 1.0, { min: 0.4, max: 2.2, step: 0.05 })
    ]
  },
  treegrowth: {
    title: "Tree Growth Controls",
    controls: [
      numberControl("speed", "Speed", 0.18, { min: 0, max: 1, step: 0.01 }),
      numberControl("levels", "Levels", 6, { min: 3, max: 9, step: 1 }),
      numberControl("trunkHeight", "Trunk Height", 0.45, { min: 0.25, max: 0.65, step: 0.01 }),
      numberControl("branchScale", "Branch Scale", 0.72, { min: 0.5, max: 0.85, step: 0.01 }),
      numberControl("branchAngle", "Branch Angle", 28, { min: 10, max: 60, step: 1 }),
      numberControl("trunkWidth", "Trunk Width", 10, { min: 4, max: 24, step: 0.5 }),
      numberControl("sway", "Sway", 0.35, { min: 0, max: 1.2, step: 0.01 }),
      numberControl("leafSize", "Leaf Size", 3, { min: 0, max: 10, step: 0.5 }),
      numberControl("jitter", "Jitter", 0.25, { min: 0, max: 0.6, step: 0.01 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 10, step: 0.1 }),
      numberControl("growth", "Growth Override", 1, { min: 0, max: 1, step: 0.01 })
    ]
  },
  sine_distorter: {
    title: "Sine Distorter Controls",
    controls: [
      selectControl("mode", "Mode", SINE_DISTORTER_DEFAULTS.mode, [
        { label: "Horizontal", value: "horizontal" },
        { label: "Vertical", value: "vertical" },
        { label: "Both", value: "both" }
      ]),
      numberControl("amp", "Amplitude", SINE_DISTORTER_DEFAULTS.amp, { min: 0, max: 80, step: 1 }),
      numberControl("freq", "Frequency", SINE_DISTORTER_DEFAULTS.freq, { min: 0, max: 0.2, step: 0.005 }),
      numberControl("speed", "Speed", SINE_DISTORTER_DEFAULTS.speed, { min: 0, max: 6, step: 0.05 }),
      numberControl("slice", "Slice Size", SINE_DISTORTER_DEFAULTS.slice, { min: 1, max: 8, step: 1 }),
      numberControl("phase", "Phase", SINE_DISTORTER_DEFAULTS.phase, { min: -6.28, max: 6.28, step: 0.05 }),
      numberControl("sourceScale", "Source Scale", SINE_DISTORTER_DEFAULTS.sourceScale, { min: 1, max: 3, step: 0.1 }),
      selectControl("edges", "Edges", SINE_DISTORTER_DEFAULTS.edges, [
        { label: "Wrap", value: "wrap" },
        { label: "Clamp", value: "clamp" }
      ]),
      selectControl("source", "Source", "logo", [
        { label: "Logo", value: "logo" },
        { label: "Scene", value: "scene" }
      ]),
      selectControl("logoText", "Logo Text", SINE_DISTORTER_DEFAULTS.logoText, [
        { label: "DISTORT", value: "DISTORT" },
        { label: "WAVE", value: "WAVE" },
        { label: "GLASS", value: "GLASS" }
      ]),
      numberControl("audioReact", "Audio React", SINE_DISTORTER_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatBoost", "Beat Boost", SINE_DISTORTER_DEFAULTS.beatBoost, { min: 0, max: 1, step: 0.05 }),
      numberControl("glow", "Glow", SINE_DISTORTER_DEFAULTS.glow, { min: 0, max: 0.3, step: 0.01 })
          ]
  },
  bumpmap_plane: {
    title: "Bumpmap Plane Controls",
    controls: [
      numberControl("bufW", "Buffer Width", BUMPMAP_PLANE_DEFAULTS.bufW, { min: 120, max: 480, step: 10 }),
      numberControl("bufH", "Buffer Height", BUMPMAP_PLANE_DEFAULTS.bufH, { min: 90, max: 360, step: 10 }),
      numberControl("bumpStrength", "Bump Strength", BUMPMAP_PLANE_DEFAULTS.bumpStrength, { min: 0, max: 0.1, step: 0.005 }),
      numberControl("ambient", "Ambient", BUMPMAP_PLANE_DEFAULTS.ambient, { min: 0, max: 1, step: 0.05 }),
      numberControl("diffuseStrength", "Diffuse Strength", BUMPMAP_PLANE_DEFAULTS.diffuseStrength, { min: 0, max: 2, step: 0.05 }),
      numberControl("specStrength", "Spec Strength", BUMPMAP_PLANE_DEFAULTS.specStrength, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("shininess", "Shininess", BUMPMAP_PLANE_DEFAULTS.shininess, { min: 2, max: 80, step: 1 }),
      numberControl("lightZ", "Light Height", BUMPMAP_PLANE_DEFAULTS.lightZ, { min: 40, max: 240, step: 5 }),
      numberControl("lightSpeed", "Light Speed", BUMPMAP_PLANE_DEFAULTS.lightSpeed, { min: 0, max: 3, step: 0.05 }),
      selectControl("embossText", "Emboss Text", BUMPMAP_PLANE_DEFAULTS.embossText, [
        { label: "BUMP", value: "BUMP" },
        { label: "SMCGA", value: "SMCGA" },
        { label: "Off", value: "" }
      ]),
      numberControl("embossStrength", "Emboss Strength", BUMPMAP_PLANE_DEFAULTS.embossStrength, { min: 0, max: 200, step: 5 }),
      toggleControl("animateBumps", "Animate Bumps", BUMPMAP_PLANE_DEFAULTS.animateBumps),
      numberControl("waveAmp", "Wave Amp", BUMPMAP_PLANE_DEFAULTS.waveAmp, { min: 0, max: 40, step: 1 }),
      numberControl("waveFreqX", "Wave Freq X", BUMPMAP_PLANE_DEFAULTS.waveFreqX, { min: 0, max: 0.3, step: 0.01 }),
      numberControl("waveFreqY", "Wave Freq Y", BUMPMAP_PLANE_DEFAULTS.waveFreqY, { min: 0, max: 0.3, step: 0.01 }),
      numberControl("baseHue", "Base Hue", BUMPMAP_PLANE_DEFAULTS.baseHue, { min: 0, max: 360, step: 5 }),
      selectControl("paletteMode", "Palette Mode", BUMPMAP_PLANE_DEFAULTS.paletteMode, [
        { label: "Ramp", value: "ramp" },
        { label: "HSL", value: "hsl" }
      ]),
      toggleControl("scanlines", "Scanlines", BUMPMAP_PLANE_DEFAULTS.scanlines),
      numberControl("audioReact", "Audio React", BUMPMAP_PLANE_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", BUMPMAP_PLANE_DEFAULTS.beatKick, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", BUMPMAP_PLANE_DEFAULTS.seed, { min: 0, max: 999, step: 1 })
    ]
  }
};

export function getEffectDebugConfig(effectName: string | null): EffectDebugConfig | null {
  if (!effectName) {
    return null;
  }
  return EFFECT_DEBUG_CONFIGS[effectName] ?? {
    title: `${effectName} Controls`,
    controls: []
  };
}

export function getEffectDebugDefaults(effectName: string): Record<string, EffectParamValue> {
  if (effectName === "flyover") {
    return { ...DEFAULT_FLYOVER_PARAMS };
  }
  const config = getEffectDebugConfig(effectName);
  if (!config) {
    return {};
  }
  return config.controls.reduce<Record<string, EffectParamValue>>((acc, control) => {
    acc[control.key] = control.defaultValue;
    return acc;
  }, {});
}

const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

const coerceSelectValue = (value: unknown, options: EffectParamOption[], fallback: string): string => {
  const candidate = typeof value === "string" ? value : "";
  return options.some((option) => option.value === candidate) ? candidate : fallback;
};

const coerceToggleValue = (value: unknown, fallback: number): number => {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (typeof value === "number") {
    return value !== 0 ? 1 : 0;
  }
  return fallback;
};

const clampIfNeeded = (value: number, min?: number, max?: number): number => {
  if (min !== undefined && max !== undefined) {
    return clamp(value, min, max);
  }
  if (min !== undefined) {
    return Math.max(min, value);
  }
  if (max !== undefined) {
    return Math.min(max, value);
  }
  return value;
};

export function coerceEffectParams(
  effectName: string,
  overrides: Record<string, EffectParamValue>
): Record<string, EffectParamValue> {
  if (effectName === "flyover") {
    return coerceFlyoverParams(overrides);
  }
  const defaults = getEffectDebugDefaults(effectName);
  const config = getEffectDebugConfig(effectName);
  if (!config || config.controls.length === 0) {
    return { ...defaults };
  }
  return config.controls.reduce<Record<string, EffectParamValue>>((acc, control) => {
    const value = overrides[control.key];
    if (control.type === "select") {
      acc[control.key] = coerceSelectValue(
        value,
        control.options ?? [],
        String(defaults[control.key] ?? control.defaultValue)
      );
      return acc;
    }
    if (control.type === "toggle") {
      acc[control.key] = coerceToggleValue(value, Number(defaults[control.key] ?? control.defaultValue));
      return acc;
    }
    const base = toNumber(value, Number(defaults[control.key] ?? control.defaultValue));
    acc[control.key] = clampIfNeeded(base, control.min, control.max);
    return acc;
  }, {});
}
