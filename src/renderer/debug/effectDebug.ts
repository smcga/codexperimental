import { clamp } from "../../util/math";
import { NEON_ALLEY_DEFAULTS } from "../effects/gl/neonAlleyEffect";
import { SPACE_HANGAR_DEFAULTS } from "../effects/gl/spaceHangarEffect";
import { DEFAULT_FLYOVER_PARAMS, coerceFlyoverParams } from "./flyoverDebug";
import { WIREFRAME_RIDE_DEFAULTS } from "../effects/wireframeRide";
import { ROAD_DRIVE_DEFAULTS } from "../effects/roadDrive";
import { BORDER_MULTIPLEX_DEFAULTS } from "../effects/borderMultiplexEffect";
import { ENVMAP_DONUT_DEFAULTS } from "../effects/envmapDonut";
import { VOXEL_LANDSCAPE_DEFAULTS } from "../effects/voxelLandscape";
import { TEXTURED_CUBE_DEFAULTS } from "../effects/texturedCube";
import { SINE_DISTORTER_DEFAULTS } from "../effects/sineDistorter";
import { GLENZ_VECTORS_DEFAULTS } from "../effects/glenzVectors";
import { BUMPMAP_PLANE_DEFAULTS } from "../effects/bumpmapPlane";
import { FRACTAL_ZOOMER_DEFAULTS } from "../effects/fractalZoomer";
import { KEFRENS_BARS_DEFAULTS } from "../effects/kefrensBars";
import { GREETS_WALL_DEFAULTS } from "../effects/greetsWall";
import { TEXTMODE_CHARSET_DEFAULTS } from "../effects/textmodeCharset";
import { DOT_TUNNEL_DEFAULTS } from "../effects/dotTunnel";
import { PLATFORMER_SCROLL_DEFAULTS } from "../effects/platformerScroll";
import { VECTOR3D_BALLS_DEFAULTS } from "../effects/vector3dBalls";
import { IMPOSSIBLE_CORRIDOR_DEFAULTS } from "../effects/gl/impossibleCorridorEffect";
import { MOIRE_GRID_DEFAULTS } from "../effects/moireGridEffect";

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
      numberControl("turnStrength", "Turn Strength", 0.35, { min: 0, max: 1, step: 0.05 }),
      numberControl("drift", "Drift", 0.14, { min: 0, max: 1, step: 0.01 }),
      numberControl("sparkle", "Sparkle", 0.55, { min: 0, max: 2, step: 0.05 }),
      numberControl("colorShift", "Color Shift", 0, { min: -1, max: 1, step: 0.05 })
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
  rain: {
    title: "Rain Controls",
    controls: [
      numberControl("intensity", "Intensity", 0.5, { min: 0, max: 1, step: 0.05 }),
      numberControl("wind", "Wind", 0.1, { min: -1, max: 1, step: 0.05 }),
      numberControl("speed", "Speed", 1, { min: 0, max: 3, step: 0.05 }),
      numberControl("streakLength", "Streak Length", 1, { min: 0.25, max: 2.5, step: 0.05 }),
      toggleControl("splash", "Splash", false),
      numberControl("hue", "Hue", 205, { min: 0, max: 360, step: 1 }),
      numberControl("storm", "Storm", 0.5, { min: 0, max: 1, step: 0.05 }),
      numberControl("turbulence", "Turbulence", 0.35, { min: 0, max: 1, step: 0.05 }),
      numberControl("mist", "Mist", 0.35, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 999, step: 1 })
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
  textured_cube: {
    title: "Textured Cube Controls",
    controls: [
      numberControl("scale", "Scale", TEXTURED_CUBE_DEFAULTS.scale, { min: 1, max: 6, step: 1 }),
      numberControl("camDist", "Camera Distance", TEXTURED_CUBE_DEFAULTS.camDist, { min: 2.5, max: 8, step: 0.1 }),
      numberControl("focalMul", "Focal Multiplier", TEXTURED_CUBE_DEFAULTS.focalMul, { min: 0.4, max: 1.6, step: 0.05 }),
      numberControl("rotXSpeed", "Rotate X Speed", TEXTURED_CUBE_DEFAULTS.rotXSpeed, { min: 0, max: 2, step: 0.05 }),
      numberControl("rotYSpeed", "Rotate Y Speed", TEXTURED_CUBE_DEFAULTS.rotYSpeed, { min: 0, max: 2, step: 0.05 }),
      numberControl("rotZSpeed", "Rotate Z Speed", TEXTURED_CUBE_DEFAULTS.rotZSpeed, { min: 0, max: 2, step: 0.05 }),
      toggleControl("backfaceCull", "Backface Cull", Boolean(TEXTURED_CUBE_DEFAULTS.backfaceCull)),
      toggleControl("perspectiveCorrect", "Perspective Correct", Boolean(TEXTURED_CUBE_DEFAULTS.perspectiveCorrect)),
      toggleControl("edge", "Edge Highlight", Boolean(TEXTURED_CUBE_DEFAULTS.edge)),
      numberControl("edgeAlpha", "Edge Alpha", TEXTURED_CUBE_DEFAULTS.edgeAlpha, { min: 0, max: 1, step: 0.05 }),
      numberControl("shadeStrength", "Shade Strength", TEXTURED_CUBE_DEFAULTS.shadeStrength, { min: 0, max: 1.2, step: 0.05 }),
      numberControl("audioReact", "Audio React", TEXTURED_CUBE_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", TEXTURED_CUBE_DEFAULTS.beatKick, { min: 0, max: 1, step: 0.05 }),
      toggleControl("textureAnim", "Texture Animate", Boolean(TEXTURED_CUBE_DEFAULTS.textureAnim))
    ]
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
  voxel_landscape: {
    title: "Voxel Landscape Controls",
    controls: [
      numberControl("bufW", "Buffer Width", VOXEL_LANDSCAPE_DEFAULTS.bufW, { min: 128, max: 512, step: 16 }),
      numberControl("bufH", "Buffer Height", VOXEL_LANDSCAPE_DEFAULTS.bufH, { min: 96, max: 384, step: 8 }),
      numberControl("speed", "Speed", VOXEL_LANDSCAPE_DEFAULTS.speed, { min: 0, max: 200, step: 1 }),
      numberControl("turnRate", "Turn Rate", VOXEL_LANDSCAPE_DEFAULTS.turnRate, { min: 0, max: 1, step: 0.01 }),
      numberControl("turnWobble", "Turn Wobble", VOXEL_LANDSCAPE_DEFAULTS.turnWobble, { min: 0, max: 0.5, step: 0.01 }),
      numberControl("camH", "Camera Height", VOXEL_LANDSCAPE_DEFAULTS.camH, { min: 40, max: 180, step: 1 }),
      numberControl("heightBob", "Height Bob", VOXEL_LANDSCAPE_DEFAULTS.heightBob, { min: 0, max: 20, step: 0.5 }),
      numberControl("beatBump", "Beat Bump", VOXEL_LANDSCAPE_DEFAULTS.beatBump, { min: 0, max: 30, step: 0.5 }),
      numberControl("fov", "FOV", VOXEL_LANDSCAPE_DEFAULTS.fov, { min: 0.5, max: 1.6, step: 0.01 }),
      numberControl("horizon", "Horizon", VOXEL_LANDSCAPE_DEFAULTS.bufH * 0.45, { min: 40, max: 180, step: 1 }),
      numberControl("scale", "Scale", VOXEL_LANDSCAPE_DEFAULTS.scale, { min: 60, max: 200, step: 1 }),
      numberControl("maxDist", "Max Distance", VOXEL_LANDSCAPE_DEFAULTS.maxDist, { min: 200, max: 1400, step: 10 }),
      numberControl("stepBase", "Step Base", VOXEL_LANDSCAPE_DEFAULTS.stepBase, { min: 1, max: 6, step: 1 }),
      numberControl("stepGrow", "Step Grow", VOXEL_LANDSCAPE_DEFAULTS.stepGrow, { min: 20, max: 160, step: 5 }),
      numberControl("fogStrength", "Fog Strength", VOXEL_LANDSCAPE_DEFAULTS.fogStrength, { min: 0, max: 1, step: 0.05 }),
      numberControl("audioReact", "Audio React", VOXEL_LANDSCAPE_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", VOXEL_LANDSCAPE_DEFAULTS.beatKick, { min: 0, max: 1, step: 0.05 }),
      toggleControl("scanlines", "Scanlines", false),
      numberControl("seed", "Seed", VOXEL_LANDSCAPE_DEFAULTS.seed, { min: 0, max: 9999, step: 1 })
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
  roadDrive: {
    title: "Road Drive (WebGL) Controls",
    controls: [
      numberControl("speed", "Speed", ROAD_DRIVE_DEFAULTS.speed, { min: 0.2, max: 3.2, step: 0.05 }),
      numberControl("roadWidth", "Road Width", ROAD_DRIVE_DEFAULTS.roadWidth, { min: 4, max: 20, step: 0.25 }),
      numberControl("laneDashLength", "Lane Dash Length", ROAD_DRIVE_DEFAULTS.laneDashLength, { min: 0.4, max: 10, step: 0.1 }),
      numberControl("laneGap", "Lane Gap", ROAD_DRIVE_DEFAULTS.laneGap, { min: 0.2, max: 10, step: 0.1 }),
      numberControl("fog", "Fog", ROAD_DRIVE_DEFAULTS.fog, { min: 0, max: 1, step: 0.01 }),
      numberControl("glow", "Glow", ROAD_DRIVE_DEFAULTS.glow, { min: 0.1, max: 2.5, step: 0.05 }),
      numberControl("cameraBob", "Camera Bob", ROAD_DRIVE_DEFAULTS.cameraBob, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("curveStrength", "Curve Strength", ROAD_DRIVE_DEFAULTS.curveStrength, { min: 0, max: 6, step: 0.05 }),
      numberControl("curveFrequency", "Curve Frequency", ROAD_DRIVE_DEFAULTS.curveFrequency, { min: 0.015, max: 0.2, step: 0.005 }),
      numberControl("bassReactive", "Bass Reactive", ROAD_DRIVE_DEFAULTS.bassReactive, { min: 0, max: 2, step: 0.05 }),
      numberControl("rmsReactive", "RMS Reactive", ROAD_DRIVE_DEFAULTS.rmsReactive, { min: 0, max: 2, step: 0.05 })
    ]
  },
  shadebobs_bobs: {
    title: "Shadebobs + Bobs Controls",
    controls: [
      selectControl("mode", "Mode", "hybrid", [
        { label: "Hybrid", value: "hybrid" },
        { label: "Shadebobs", value: "shadebobs" },
        { label: "Bobs", value: "bobs" }
      ]),
      numberControl("shadeCount", "Shade Count", 28, { min: 4, max: 80, step: 1 }),
      numberControl("bobCount", "Bob Count", 40, { min: 4, max: 140, step: 1 }),
      numberControl("shadeScale", "Shade Scale", 2, { min: 1, max: 3, step: 1 }),
      numberControl("blobRadius", "Blob Radius", 70, { min: 20, max: 160, step: 1 }),
      numberControl("trailFade", "Trail Fade", 0.12, { min: 0, max: 0.5, step: 0.01 }),
      selectControl("blend", "Blend Mode", "lighter", [
        { label: "Lighter", value: "lighter" },
        { label: "Screen", value: "screen" }
      ]),
      numberControl("hueSpeed", "Hue Speed", 40, { min: 0, max: 120, step: 1 }),
      numberControl("steer", "Steer", 40, { min: 0, max: 120, step: 1 }),
      numberControl("maxSpeed", "Max Speed", 220, { min: 60, max: 400, step: 5 }),
      numberControl("spriteSize", "Sprite Size", 48, { min: 16, max: 96, step: 1 }),
      toggleControl("boingCheckers", "Boing Checkers", true),
      numberControl("bobAlpha", "Bob Alpha", 0.95, { min: 0.1, max: 1, step: 0.01 }),
      toggleControl("fastBlob", "Fast Blob", false),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatPulseStrength", "Beat Pulse", 0.7, { min: 0, max: 1, step: 0.05 }),
      toggleControl("dirtyRects", "Dirty Rects", false),
      numberControl("seed", "Seed", 0, { min: 0, max: 20, step: 0.1 })
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
  
  fractal_zoomer: {
    title: "Fractal Zoomer Controls",
    controls: [
      selectControl("setType", "Set", FRACTAL_ZOOMER_DEFAULTS.setType, [
        { label: "Mandelbrot", value: "mandelbrot" },
        { label: "Julia", value: "julia" },
        { label: "Burning Ship", value: "burningShip" }
      ]),
      numberControl("zoom", "Zoom", FRACTAL_ZOOMER_DEFAULTS.zoom, { min: 0.4, max: 8, step: 0.05 }),
      numberControl("centerX", "Center X", FRACTAL_ZOOMER_DEFAULTS.centerX, { min: -2.5, max: 1.5, step: 0.01 }),
      numberControl("centerY", "Center Y", FRACTAL_ZOOMER_DEFAULTS.centerY, { min: -1.8, max: 1.8, step: 0.01 }),
      numberControl("iterations", "Iterations", FRACTAL_ZOOMER_DEFAULTS.iterations, { min: 24, max: 600, step: 1 }),
      numberControl("paletteSpeed", "Palette Speed", FRACTAL_ZOOMER_DEFAULTS.paletteSpeed, { min: 0, max: 2, step: 0.01 }),
      numberControl("audioReact", "Audio React", FRACTAL_ZOOMER_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 })
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
  greets_wall: {
    title: "Greets Wall Controls",
    controls: [
      selectControl("layout", "Layout", GREETS_WALL_DEFAULTS.layout, [
        { label: "Grid", value: "grid" },
        { label: "Carousel", value: "carousel" }
      ]),
      selectControl("transitionStyle", "Transition", GREETS_WALL_DEFAULTS.transitionStyle, [
        { label: "Slide", value: "slide" },
        { label: "Fade", value: "fade" },
        { label: "Pop", value: "pop" }
      ]),
      numberControl("cycleSeconds", "Cycle Seconds", GREETS_WALL_DEFAULTS.cycleSeconds, { min: 0.35, max: 6, step: 0.05 }),
      numberControl("columns", "Columns", GREETS_WALL_DEFAULTS.columns, { min: 1, max: 8, step: 1 }),
      numberControl("padding", "Padding", GREETS_WALL_DEFAULTS.padding, { min: 0.02, max: 0.18, step: 0.01 }),
      numberControl("highlightPulse", "Highlight Pulse", GREETS_WALL_DEFAULTS.highlightPulse, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("beatPulseDecay", "Beat Decay", GREETS_WALL_DEFAULTS.beatPulseDecay, { min: 0.2, max: 8, step: 0.1 }),
      numberControl("audioReact", "Audio React", GREETS_WALL_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      selectControl("title", "Title", "GREETS", [{ label: "GREETS", value: "GREETS" }]),
      selectControl("names", "Names", "Fairlight|TRSI|Spaceballs|CNCD|Mercury|TBL", [
        { label: "Default Names", value: "Fairlight|TRSI|Spaceballs|CNCD|Mercury|TBL" }
      ])
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
  envmap_donut: {
    title: "Envmap Donut Controls",
    controls: [
      numberControl("bufW", "Buffer Width", ENVMAP_DONUT_DEFAULTS.bufW, { min: 120, max: 320, step: 4 }),
      numberControl("bufH", "Buffer Height", ENVMAP_DONUT_DEFAULTS.bufH, { min: 90, max: 240, step: 4 }),
      numberControl("segmentsU", "Segments U", ENVMAP_DONUT_DEFAULTS.segmentsU, { min: 16, max: 128, step: 1 }),
      numberControl("segmentsV", "Segments V", ENVMAP_DONUT_DEFAULTS.segmentsV, { min: 12, max: 96, step: 1 }),
      numberControl("R", "Major Radius", ENVMAP_DONUT_DEFAULTS.R, { min: 0.6, max: 2.0, step: 0.05 }),
      numberControl("r", "Minor Radius", ENVMAP_DONUT_DEFAULTS.r, { min: 0.25, max: 1.0, step: 0.05 }),
      numberControl("camDist", "Camera Distance", ENVMAP_DONUT_DEFAULTS.camDist, { min: 2.0, max: 5.0, step: 0.1 }),
      numberControl("focalMul", "Focal Multiplier", ENVMAP_DONUT_DEFAULTS.focalMul, { min: 0.6, max: 2.0, step: 0.05 }),
      numberControl("rotXSpeed", "Rotate X", ENVMAP_DONUT_DEFAULTS.rotXSpeed, { min: 0, max: 2.0, step: 0.05 }),
      numberControl("rotYSpeed", "Rotate Y", ENVMAP_DONUT_DEFAULTS.rotYSpeed, { min: 0, max: 2.0, step: 0.05 }),
      numberControl("rotZSpeed", "Rotate Z", ENVMAP_DONUT_DEFAULTS.rotZSpeed, { min: 0, max: 2.0, step: 0.05 }),
      numberControl("fresnelStrength", "Fresnel", ENVMAP_DONUT_DEFAULTS.fresnelStrength, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("specStrength", "Specular", ENVMAP_DONUT_DEFAULTS.specStrength, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("shininess", "Shininess", ENVMAP_DONUT_DEFAULTS.shininess, { min: 2, max: 64, step: 1 }),
      numberControl("chromeDesat", "Chrome Desat", ENVMAP_DONUT_DEFAULTS.chromeDesat, { min: 0, max: 1, step: 0.01 }),
      toggleControl("backfaceCull", "Backface Cull", ENVMAP_DONUT_DEFAULTS.backfaceCull),
      toggleControl("scanlines", "Scanlines", ENVMAP_DONUT_DEFAULTS.scanlines),
      toggleControl("edge", "Edge Overlay", ENVMAP_DONUT_DEFAULTS.edge),
      numberControl("audioReact", "Audio React", ENVMAP_DONUT_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", ENVMAP_DONUT_DEFAULTS.beatKick, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", ENVMAP_DONUT_DEFAULTS.seed, { min: 0, max: 50, step: 1 })
          ]
  },
  lens_wobbler: {
    title: "Lens Wobbler Controls",
    controls: [
      numberControl("bufW", "Buffer Width", 240, { min: 120, max: 480, step: 4 }),
      numberControl("bufH", "Buffer Height", 150, { min: 90, max: 360, step: 2 }),
      numberControl("rotSpeed", "Rotation Speed", 0.25, { min: 0, max: 2, step: 0.01 }),
      numberControl("baseScale", "Base Scale", 0.9, { min: 0.4, max: 1.6, step: 0.01 }),
      numberControl("zoomAmp", "Zoom Amplitude", 0.15, { min: 0, max: 0.6, step: 0.01 }),
      numberControl("zoomSpeed", "Zoom Speed", 0.6, { min: 0, max: 3, step: 0.05 }),
      numberControl("scrollU", "Scroll U", 30, { min: -120, max: 120, step: 1 }),
      numberControl("scrollV", "Scroll V", 18, { min: -120, max: 120, step: 1 }),
      numberControl("lensRadius", "Lens Radius", 33, { min: 10, max: 120, step: 1 }),
      numberControl("lensStrength", "Lens Strength", 0.75, { min: 0, max: 1.5, step: 0.05 }),
      toggleControl("invertRing", "Invert Ring", true),
      toggleControl("wobble", "Wobble", true),
      numberControl("wobbleAmp", "Wobble Amplitude", 6, { min: 0, max: 16, step: 0.5 }),
      numberControl("wobbleFreq", "Wobble Frequency", 0.1, { min: 0, max: 0.4, step: 0.01 }),
      numberControl("wobbleSpeed", "Wobble Speed", 3.0, { min: 0, max: 8, step: 0.1 }),
      numberControl("wobbleSlice", "Wobble Slice", 2, { min: 1, max: 8, step: 1 }),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 999, step: 1 }),
      selectControl("lensPath", "Lens Path", "circle", [
        { label: "Circle", value: "circle" },
        { label: "Lissajous", value: "lissajous" }
      ])
          ]
  },
  poly_morph_showcase: {
    title: "Poly Morph Showcase Controls",
    controls: [
      numberControl("lat", "Latitude Segments", 16, { min: 8, max: 28, step: 1 }),
      numberControl("lon", "Longitude Segments", 24, { min: 12, max: 40, step: 1 }),
      numberControl("morphSpeed", "Morph Speed", 0.08, { min: 0, max: 0.3, step: 0.01 }),
      numberControl("styleSpeed", "Style Speed", 0.1, { min: 0, max: 0.5, step: 0.01 }),
      selectControl("style", "Style", "auto", [
        { label: "Auto", value: "auto" },
        { label: "Solid", value: "solid" },
        { label: "Glenz", value: "glenz" },
        { label: "Shaded", value: "shaded" }
      ]),
      numberControl("camDist", "Camera Distance", 3.6, { min: 2.5, max: 6, step: 0.1 }),
      numberControl("focalMul", "Focal Multiplier", 0.9, { min: 0.5, max: 1.2, step: 0.05 }),
      numberControl("rotXSpeed", "Rotate X Speed", 0.5, { min: -2, max: 2, step: 0.05 }),
      numberControl("rotYSpeed", "Rotate Y Speed", 0.8, { min: -2, max: 2, step: 0.05 }),
      numberControl("rotZSpeed", "Rotate Z Speed", 0.2, { min: -2, max: 2, step: 0.05 }),
      numberControl("sat", "Saturation", 85, { min: 0, max: 100, step: 1 }),
      numberControl("baseHue", "Base Hue", 200, { min: 0, max: 360, step: 5 }),
      numberControl("hueSpeed", "Hue Speed", 25, { min: -90, max: 90, step: 1 }),
      numberControl("solidAlpha", "Solid Alpha", 0.9, { min: 0, max: 1, step: 0.05 }),
      numberControl("glenzAlpha", "Glenz Alpha", 0.13, { min: 0, max: 0.4, step: 0.01 }),
      numberControl("shadedAlpha", "Shaded Alpha", 0.95, { min: 0, max: 1, step: 0.05 }),
      toggleControl("edge", "Edge Overlay", true),
      numberControl("edgeAlpha", "Edge Alpha", 0.18, { min: 0, max: 0.6, step: 0.01 }),
      toggleControl("sortSolid", "Sort Solid Faces", true),
      toggleControl("sortShaded", "Sort Shaded Faces", true),
      toggleControl("sortGlenz", "Sort Glenz Faces", false),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 999, step: 1 })
          ]
  },
  kefrens_bars: {
    title: "Kefrens Bars Controls",
    controls: [
      numberControl("barCount", "Bar Count", KEFRENS_BARS_DEFAULTS.barCount, { min: 1, max: 128, step: 1 }),
      numberControl("barWidth", "Bar Width", KEFRENS_BARS_DEFAULTS.barWidth, { min: 1, max: 160, step: 1 }),
      numberControl("amp", "Amplitude", KEFRENS_BARS_DEFAULTS.amp, { min: 0, max: 480, step: 1 }),
      numberControl("freq", "Frequency", KEFRENS_BARS_DEFAULTS.freq, { min: 0, max: 20, step: 0.1 }),
      numberControl("speed", "Speed", KEFRENS_BARS_DEFAULTS.speed, { min: -10, max: 10, step: 0.05 }),
      numberControl("phaseOffset", "Phase Offset", KEFRENS_BARS_DEFAULTS.phaseOffset, { min: -6.28, max: 6.28, step: 0.01 }),
      selectControl("palette", "Palette", KEFRENS_BARS_DEFAULTS.palette, [
        { label: "Rainbow", value: "rainbow" },
        { label: "Commodore 64", value: "c64" },
        { label: "Amiga", value: "amiga" }
      ])
          ]
  },
  twister: {
    title: "Twister Controls",
    controls: [
      numberControl("x", "Center X (0-1 or px)", 0.5, { min: 0, max: 1, step: 0.01 }),
      numberControl("baseWidth", "Base Width", 220, { min: 40, max: 600, step: 5 }),
      numberControl("amplitude", "Amplitude", 90, { min: 0, max: 240, step: 5 }),
      numberControl("turns", "Turns", 3, { min: 0.5, max: 8, step: 0.1 }),
      numberControl("speed", "Speed", 2.2, { min: 0, max: 6, step: 0.05 }),
      numberControl("sliceH", "Slice Height", 2, { min: 1, max: 8, step: 1 }),
      numberControl("sat", "Saturation", 90, { min: 0, max: 100, step: 1 }),
      numberControl("hueSpeed", "Hue Speed", 55, { min: 0, max: 180, step: 1 }),
      numberControl("minWidthScale", "Min Width Scale", 0.55, { min: 0.1, max: 1, step: 0.01 }),
      numberControl("maxWidthScale", "Max Width Scale", 1.0, { min: 0.1, max: 1.5, step: 0.01 }),
      numberControl("minAlpha", "Min Alpha", 0.25, { min: 0.05, max: 1, step: 0.01 }),
      numberControl("maxAlpha", "Max Alpha", 0.95, { min: 0.05, max: 1, step: 0.01 }),
      numberControl("edgeShade", "Edge Shade", 0.35, { min: 0, max: 1, step: 0.01 }),
      selectControl("background", "Background", "clear", [
        { label: "Clear", value: "clear" },
        { label: "Fade", value: "fade" }
      ]),
      numberControl("trailFade", "Trail Fade", 0.08, { min: 0, max: 0.3, step: 0.01 }),
      selectControl("texture", "Texture", "solid", [
        { label: "Solid", value: "solid" },
        { label: "Pattern", value: "pattern" }
      ]),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", 0.7, { min: 0, max: 1, step: 0.05 })
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
  amiga_showcase: {
    title: "Amiga Showcase Controls",
    controls: [
      numberControl("audioReact", "Audio React", 0.6, { min: 0, max: 1, step: 0.05 }),
      numberControl("barCount", "Bar Count", 4, { min: 1, max: 12, step: 1 }),
      numberControl("barSaturation", "Bar Saturation", 0.85, { min: 0, max: 1, step: 0.05 }),
      numberControl("barSpeed", "Bar Speed", 1.3, { min: 0, max: 4, step: 0.05 }),
      numberControl("barWaveAmp", "Bar Wave Amp", 28, { min: 0, max: 120, step: 1 }),
      numberControl("barWaveFreq", "Bar Wave Freq", 4.5, { min: 0, max: 12, step: 0.1 }),
      numberControl("bobCount", "Bob Count", 9, { min: 1, max: 64, step: 1 }),
      numberControl("bobIntensity", "Bob Intensity", 0.45, { min: 0, max: 1, step: 0.05 }),
      numberControl("bobRadius", "Bob Radius", 42, { min: 1, max: 160, step: 1 }),
      numberControl("bobTrail", "Bob Trail", 0.12, { min: 0, max: 1, step: 0.01 }),
      toggleControl("glenz", "Glenz", true),
      numberControl("twistAmp", "Twist Amp", 1.8, { min: 0, max: 5, step: 0.05 }),
      numberControl("twistHueSpeed", "Twist Hue Speed", 65, { min: 0, max: 180, step: 1 }),
      numberControl("twistSlices", "Twist Slices", 24, { min: 1, max: 96, step: 1 }),
      numberControl("twistSpeed", "Twist Speed", 0.85, { min: 0, max: 4, step: 0.05 }),
      numberControl("twistWidth", "Twist Width", 0.28, { min: 0.05, max: 0.8, step: 0.01 }),
      numberControl("twistX", "Twist X", 0.5, { min: 0, max: 1, step: 0.01 })
    ]
  },
  copper_gradient_splits: {
    title: "Copper Gradient Splits Controls",
    controls: [
      numberControl("scanStep", "Scan Step", 2, { min: 1, max: 6, step: 1 }),
      numberControl("gradientRowStep", "Gradient Row Step", 16, { min: 4, max: 64, step: 1 }),
      numberControl("barCount", "Bar Count", 10, { min: 4, max: 24, step: 1 }),
      numberControl("speed", "Speed", 0.7, { min: 0, max: 3, step: 0.05 }),
      numberControl("barWobble", "Bar Wobble", 28, { min: 0, max: 80, step: 1 }),
      numberControl("barHueStep", "Bar Hue Step", 22, { min: 0, max: 120, step: 1 }),
      numberControl("hueWobble", "Hue Wobble", 18, { min: 0, max: 120, step: 1 }),
      numberControl("saturation", "Saturation", 0.9, { min: 0, max: 1, step: 0.05 }),
      numberControl("lightnessBase", "Lightness Base", 0.35, { min: 0, max: 1, step: 0.05 }),
      numberControl("lightnessPeak", "Lightness Peak", 0.68, { min: 0, max: 1, step: 0.05 }),
      numberControl("splits", "Splits", 3, { min: 1, max: 6, step: 1 }),
      toggleControl("hamish", "Hamish", true),
      numberControl("hamishStrength", "Hamish Strength", 0.35, { min: 0, max: 1, step: 0.05 }),
      toggleControl("paletteClamp", "Palette Clamp", false),
      numberControl("paletteClampSteps", "Palette Clamp Steps", 32, { min: 2, max: 64, step: 1 }),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("regions", "Regions Override (advanced)", 0)
    ]
  },
  dotTunnel: {
    title: "Dot Tunnel Controls",
    controls: [
      numberControl("ringCount", "Ring Count", DOT_TUNNEL_DEFAULTS.ringCount, { min: 8, max: 180, step: 1 }),
      numberControl("dotsPerRing", "Dots Per Ring", DOT_TUNNEL_DEFAULTS.dotsPerRing, { min: 6, max: 160, step: 1 }),
      numberControl("fov", "FOV", DOT_TUNNEL_DEFAULTS.fov, { min: 40, max: 125, step: 1 }),
      numberControl("speed", "Speed", DOT_TUNNEL_DEFAULTS.speed, { min: 0.05, max: 3.5, step: 0.05 }),
      numberControl("twist", "Twist", DOT_TUNNEL_DEFAULTS.twist, { min: -4, max: 4, step: 0.05 }),
      numberControl("palette", "Palette", DOT_TUNNEL_DEFAULTS.palette, { min: 0, max: 12, step: 1 }),
      numberControl("glow", "Glow", DOT_TUNNEL_DEFAULTS.glow, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("seed", "Seed", DOT_TUNNEL_DEFAULTS.seed, { min: 0, max: 9999, step: 1 })
    ]
  },
  moire_grid: {
    title: "Moire Grid Controls",
    controls: [
      numberControl("spacing", "Spacing", MOIRE_GRID_DEFAULTS.spacing, { min: 6, max: 80, step: 1 }),
      numberControl("lineWidth", "Line Width", MOIRE_GRID_DEFAULTS.lineWidth, { min: 0.5, max: 12, step: 0.1 }),
      numberControl("speed", "Speed", MOIRE_GRID_DEFAULTS.speed, { min: -6, max: 6, step: 0.05 }),
      numberControl("warp", "Warp", MOIRE_GRID_DEFAULTS.warp, { min: 0, max: 120, step: 1 }),
      numberControl("intensity", "Intensity", MOIRE_GRID_DEFAULTS.intensity, { min: 0.1, max: 1, step: 0.05 }),
      selectControl("palette", "Palette", MOIRE_GRID_DEFAULTS.palette, [
        { label: "Cyan", value: "cyan" },
        { label: "Magenta", value: "magenta" },
        { label: "Amber", value: "amber" }
      ]),
      numberControl("audioReact", "Audio React", MOIRE_GRID_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 })
    ]
  },
  effect_evolution: {
    title: "Effect Evolution Controls",
    controls: [
      numberControl("density", "Density", 1, { min: 0.4, max: 2.5, step: 0.05 }),
      numberControl("motion", "Motion", 0.6, { min: 0, max: 1, step: 0.05 }),
      numberControl("warp", "Warp", 0.4, { min: 0, max: 1, step: 0.05 }),
      numberControl("trail", "Trail", 0.15, { min: 0, max: 0.92, step: 0.01 }),
      numberControl("seed", "Seed", 13, { min: 0, max: 9999, step: 1 })
    ]
  },
  gl_impossible_corridor: {
    title: "Impossible Corridor Controls",
    controls: [
      numberControl("quality", "Quality", IMPOSSIBLE_CORRIDOR_DEFAULTS.quality, { min: 1, max: 3, step: 1 }),
      numberControl("warp", "Warp", IMPOSSIBLE_CORRIDOR_DEFAULTS.warp, { min: 0, max: 2, step: 0.05 }),
      numberControl("hueShift", "Hue Shift", IMPOSSIBLE_CORRIDOR_DEFAULTS.hueShift, { min: 0, max: 1, step: 0.01 }),
      numberControl("exposure", "Exposure", IMPOSSIBLE_CORRIDOR_DEFAULTS.exposure, { min: 0.5, max: 2, step: 0.05 }),
      numberControl("seed", "Seed", IMPOSSIBLE_CORRIDOR_DEFAULTS.seed, { min: 0, max: 9999, step: 1 }),
      numberControl("speed", "Speed", IMPOSSIBLE_CORRIDOR_DEFAULTS.speed, { min: 0.1, max: 2, step: 0.05 }),
      numberControl("internalScale", "Internal Scale", 0.8, { min: 0.4, max: 1.2, step: 0.05 })
    ]
  },
  lightning: {
    title: "Lightning Controls",
    controls: [
      numberControl("chancePerSecond", "Chance / second", 0.25, { min: 0, max: 3, step: 0.05 }),
      numberControl("cooldown", "Cooldown", 1.5, { min: 0, max: 5, step: 0.05 }),
      numberControl("flashDuration", "Flash Duration", 0.12, { min: 0.05, max: 2, step: 0.01 }),
      numberControl("branches", "Branches", 1, { min: 1, max: 8, step: 1 }),
      toggleControl("bolt", "Bolt", true),
      numberControl("trigger", "Trigger", 0, { min: 0, max: 1, step: 1 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 9999, step: 1 })
    ]
  },
  physics_pile: {
    title: "Physics Pile Controls",
    controls: [
      numberControl("count", "Count", 18, { min: 5, max: 120, step: 1 }),
      numberControl("restitution", "Restitution", 0.25, { min: 0, max: 1, step: 0.01 }),
      numberControl("friction", "Friction", 0.6, { min: 0, max: 1, step: 0.01 }),
      numberControl("gravity", "Gravity", 900, { min: 0, max: 2400, step: 10 }),
      numberControl("kickImpulse", "Kick Impulse", 250, { min: 0, max: 3000, step: 10 }),
      numberControl("beatImpulse", "Beat Impulse", 250, { min: 0, max: 3000, step: 10 }),
      numberControl("kickRadius", "Kick Radius", 240, { min: 1, max: 1000, step: 1 }),
      numberControl("scatterAngleDeg", "Scatter Angle", 25, { min: 0, max: 180, step: 1 }),
      numberControl("scatterJitter", "Scatter Jitter", 0.35, { min: 0, max: 1, step: 0.01 }),
      numberControl("kickUpBias", "Kick Up Bias", 0.35, { min: 0, max: 1, step: 0.01 }),
      numberControl("kickTorque", "Kick Torque", 35, { min: 0, max: 360, step: 1 }),
      numberControl("loosenDuration", "Loosen Duration", 0.18, { min: 0, max: 5, step: 0.01 }),
      numberControl("loosenFrictionMult", "Loosen Friction Mult", 0.25, { min: 0, max: 1, step: 0.01 }),
      numberControl("loosenRestitutionAdd", "Loosen Restitution Add", 0.35, { min: 0, max: 1, step: 0.01 }),
      numberControl("loosenPosCorrMult", "Loosen Position Correction Mult", 0.35, { min: 0, max: 1, step: 0.01 }),
      numberControl("loosenExtraSlop", "Loosen Extra Slop", 1.5, { min: 0, max: 10, step: 0.1 }),
      numberControl("maxLinVel", "Max Linear Velocity", 1800, { min: 0, max: 5000, step: 10 }),
      numberControl("maxAngVel", "Max Angular Velocity", 18, { min: 0, max: 360, step: 1 }),
      numberControl("kickOriginY", "Kick Origin Y", 0),
      numberControl("sepBiasDeg", "Separation Bias", 10, { min: 0, max: 180, step: 1 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 9999, step: 1 }),
      numberControl("trail", "Trail", 0.2, { min: 0, max: 1, step: 0.01 }),
      numberControl("shatter", "Shatter", 0, { min: 0, max: 1, step: 0.01 }),
      numberControl("wreckingCue", "Wrecking Cue", 0, { min: 0, max: 1, step: 0.01 })
    ]
  },
  platformerScroll: {
    title: "Platformer Scroll Controls",
    controls: [
      numberControl("speed", "Speed", PLATFORMER_SCROLL_DEFAULTS.speed, { min: 0, max: 8, step: 0.05 }),
      numberControl("seed", "Seed", PLATFORMER_SCROLL_DEFAULTS.seed, { min: 0, max: 9999, step: 1 }),
      numberControl("tileSize", "Tile Size", PLATFORMER_SCROLL_DEFAULTS.tileSize, { min: 8, max: 64, step: 1 }),
      numberControl("groundRatio", "Ground Ratio", PLATFORMER_SCROLL_DEFAULTS.groundRatio, { min: 0.2, max: 0.3, step: 0.01 }),
      numberControl("parallaxFar", "Parallax Far", PLATFORMER_SCROLL_DEFAULTS.parallaxFar, { min: 0.05, max: 0.6, step: 0.01 }),
      numberControl("parallaxMid", "Parallax Mid", PLATFORMER_SCROLL_DEFAULTS.parallaxMid, { min: 0.15, max: 0.9, step: 0.01 }),
      numberControl("parallaxFront", "Parallax Front", PLATFORMER_SCROLL_DEFAULTS.parallaxFront, { min: 0.7, max: 1.4, step: 0.01 }),
      numberControl("audioReact", "Audio React", PLATFORMER_SCROLL_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", PLATFORMER_SCROLL_DEFAULTS.beatKick, { min: 0, max: 1, step: 0.05 }),
      numberControl("platformRate", "Platform Rate", PLATFORMER_SCROLL_DEFAULTS.platformRate, { min: 0, max: 1, step: 0.01 }),
      numberControl("platformMaxSteps", "Platform Max Steps", PLATFORMER_SCROLL_DEFAULTS.platformMaxSteps, { min: 1, max: 12, step: 1 })
    ]
  },
  raster_bars: {
    title: "Raster Bars Controls",
    controls: [
      numberControl("barCount", "Bar Count", 6, { min: 1, max: 24, step: 1 }),
      numberControl("barThickness", "Bar Thickness", 26, { min: 1, max: 120, step: 1 }),
      numberControl("speed", "Speed", 0.9, { min: 0, max: 4, step: 0.05 }),
      numberControl("waveAmp", "Wave Amp", 16, { min: 0, max: 120, step: 1 }),
      numberControl("waveFreq", "Wave Freq", 2.5, { min: 0, max: 16, step: 0.1 }),
      numberControl("splitStrength", "Split Strength", 0.65, { min: 0, max: 1, step: 0.05 }),
      numberControl("scanlineStep", "Scanline Step", 2, { min: 1, max: 6, step: 1 }),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatThump", "Beat Thump", 0.6, { min: 0, max: 1, step: 0.05 }),
      numberControl("border", "Border", 0, { min: 0, max: 1, step: 1 }),
      numberControl("borderSize", "Border Size", 0.08, { min: 0, max: 0.5, step: 0.01 }),
      numberControl("orientation", "Orientation", 0, { min: 0, max: 1, step: 1 }),
      numberControl("palette", "Palette", 0, { min: 0, max: 8, step: 1 })
    ]
  },
  raytrace_spheres: {
    title: "Raytrace Spheres Controls",
    controls: [
      numberControl("quality", "Quality", 2, { min: 1, max: 3, step: 1 }),
      numberControl("bufW", "Buffer Width", 0),
      numberControl("bufH", "Buffer Height", 0),
      numberControl("sphereCount", "Sphere Count", 3, { min: 1, max: 8, step: 1 }),
      numberControl("cellSize", "Cell Size", 2, { min: 1, max: 6, step: 1 }),
      toggleControl("adaptive", "Adaptive", true),
      numberControl("refineThreshold", "Refine Threshold", 120, { min: 20, max: 255, step: 1 }),
      toggleControl("refineGrow", "Refine Grow", true),
      numberControl("aa", "Antialiasing", 1, { min: 0, max: 2, step: 1 }),
      selectControl("aaMode", "AA Mode", "refinedOnly", [
        { label: "Refined only", value: "refinedOnly" },
        { label: "Full", value: "full" }
      ]),
      toggleControl("outputSmoothing", "Output Smoothing", false),
      toggleControl("forceAA", "Force AA", false),
      numberControl("seed", "Seed", 1337, { min: 0, max: 9999, step: 1 }),
      numberControl("fov", "FOV", 60, { min: 35, max: 90, step: 1 }),
      numberControl("audioReact", "Audio React", 0.6, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("maxDepth", "Max Depth", 2, { min: 1, max: 3, step: 1 }),
      numberControl("ambient", "Ambient", 0.12, { min: 0.05, max: 0.4, step: 0.01 }),
      numberControl("diffuseStrength", "Diffuse Strength", 1, { min: 0.2, max: 2, step: 0.05 }),
      numberControl("specStrength", "Spec Strength", 0.45, { min: 0, max: 2, step: 0.05 }),
      numberControl("shininess", "Shininess", 48, { min: 8, max: 96, step: 1 }),
      numberControl("floorReflect", "Floor Reflect", 0.55, { min: 0, max: 0.9, step: 0.01 }),
      toggleControl("scanlines", "Scanlines", false)
    ]
  },
  sine_scroller_logo: {
    title: "Sine Scroller Logo Controls",
    controls: [
      numberControl("audioReact", "Audio React", 0.72, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatBoost", "Beat Boost", 0.58, { min: 0, max: 1, step: 0.05 }),
      selectControl("message", "Message", "  CODEX CREW :: 68000 INSIDE :: STAY TUNED   ", [
        { label: "Default", value: "  CODEX CREW :: 68000 INSIDE :: STAY TUNED   " },
        { label: "ALT", value: "  OPENAI PRESENTS :: RETRO FUTURE :: GREETS!   " }
      ]),
      numberControl("fontSize", "Font Size", 42, { min: 8, max: 160, step: 1 }),
      numberControl("speed", "Speed", 140, { min: 0, max: 600, step: 1 }),
      numberControl("waveAmp", "Wave Amp", 24, { min: 0, max: 120, step: 1 }),
      numberControl("waveSpeed", "Wave Speed", 5.2, { min: 0, max: 20, step: 0.1 }),
      numberControl("wavePhaseStep", "Wave Phase Step", 0.32, { min: 0, max: 2, step: 0.01 }),
      numberControl("scrollerX", "Scroller X", 0),
      numberControl("scrollerY", "Scroller Y", 0),
      selectControl("logoText", "Logo Text", "SMCGA", [
        { label: "SMCGA", value: "SMCGA" },
        { label: "CODEX", value: "CODEX" }
      ]),
      numberControl("logoFontSize", "Logo Font Size", 86, { min: 8, max: 240, step: 1 }),
      numberControl("logoY", "Logo Y", 136, { min: 0, max: 600, step: 1 }),
      numberControl("scanlineStep", "Scanline Step", 2, { min: 1, max: 6, step: 1 }),
      numberControl("logoWaveAmp", "Logo Wave Amp", 7, { min: 0, max: 80, step: 1 }),
      numberControl("logoWaveSpeed", "Logo Wave Speed", 2.4, { min: 0, max: 20, step: 0.1 }),
      numberControl("logoWaveFreq", "Logo Wave Freq", 0.036, { min: 0, max: 1, step: 0.001 }),
      toggleControl("layer2", "Layer 2", true),
      numberControl("layer2FontSize", "Layer2 Font Size", 24, { min: 8, max: 120, step: 1 }),
      numberControl("layer2Speed", "Layer2 Speed", 175, { min: 0, max: 600, step: 1 }),
      numberControl("layer2Y", "Layer2 Y", 0)
    ]
  },
  vector3d_balls: {
    title: "Vector 3D Balls Controls",
    controls: [
      selectControl("model", "Model", VECTOR3D_BALLS_DEFAULTS.model, [
        { label: "Cube", value: "cube" },
        { label: "Sphere", value: "sphere" },
        { label: "Torus", value: "torus" }
      ]),
      numberControl("pointCount", "Point Count", VECTOR3D_BALLS_DEFAULTS.pointCount, { min: 80, max: 2000, step: 1 }),
      toggleControl("wireframe", "Wireframe", VECTOR3D_BALLS_DEFAULTS.wireframe > 0),
      toggleControl("roundDots", "Round Dots", VECTOR3D_BALLS_DEFAULTS.roundDots > 0),
      numberControl("baseDotSize", "Base Dot Size", VECTOR3D_BALLS_DEFAULTS.baseDotSize, { min: 0.5, max: 6, step: 0.1 }),
      numberControl("dotDepthScale", "Dot Depth Scale", VECTOR3D_BALLS_DEFAULTS.dotDepthScale, { min: 0, max: 6, step: 0.1 }),
      numberControl("lineWidth", "Line Width", VECTOR3D_BALLS_DEFAULTS.lineWidth, { min: 0.5, max: 6, step: 0.1 }),
      numberControl("camDist", "Camera Distance", VECTOR3D_BALLS_DEFAULTS.camDist, { min: 2.4, max: 6, step: 0.05 }),
      numberControl("rotXSpeed", "Rot X Speed", VECTOR3D_BALLS_DEFAULTS.rotXSpeed, { min: 0, max: 2.5, step: 0.05 }),
      numberControl("rotYSpeed", "Rot Y Speed", VECTOR3D_BALLS_DEFAULTS.rotYSpeed, { min: 0, max: 2.5, step: 0.05 }),
      numberControl("rotZSpeed", "Rot Z Speed", VECTOR3D_BALLS_DEFAULTS.rotZSpeed, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("trail", "Trail", VECTOR3D_BALLS_DEFAULTS.trail, { min: 0, max: 0.85, step: 0.01 }),
      numberControl("stripeFreq", "Stripe Freq", VECTOR3D_BALLS_DEFAULTS.stripeFreq, { min: 1, max: 14, step: 0.1 }),
      numberControl("stripeSpeed", "Stripe Speed", VECTOR3D_BALLS_DEFAULTS.stripeSpeed, { min: -2, max: 2, step: 0.05 }),
      numberControl("stripeStrength", "Stripe Strength", VECTOR3D_BALLS_DEFAULTS.stripeStrength, { min: 0, max: 1, step: 0.05 }),
      selectControl("palette", "Palette", VECTOR3D_BALLS_DEFAULTS.palette, [
        { label: "C64", value: "c64" },
        { label: "Spectrum", value: "spectrum" },
        { label: "Rainbow", value: "rainbow" }
      ]),
      numberControl("audioReact", "Audio React", VECTOR3D_BALLS_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", VECTOR3D_BALLS_DEFAULTS.beatKick, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", VECTOR3D_BALLS_DEFAULTS.seed, { min: 0, max: 9999, step: 1 })
    ]
  },
  vga_fire: {
    title: "VGA Fire Controls",
    controls: [
      numberControl("fireW", "Fire Width", 160, { min: 40, max: 400, step: 1 }),
      numberControl("fireH", "Fire Height", 120, { min: 40, max: 300, step: 1 }),
      numberControl("stepsPerFrame", "Steps / frame", 1, { min: 1, max: 4, step: 1 }),
      numberControl("baseHeat", "Base Heat", 160, { min: 0, max: 255, step: 1 }),
      numberControl("sparkChance", "Spark Chance", 0.55, { min: 0, max: 1, step: 0.01 }),
      numberControl("decay", "Decay", 3, { min: 1, max: 8, step: 1 }),
      numberControl("wind", "Wind", 0, { min: -1, max: 1, step: 0.01 }),
      numberControl("windWave", "Wind Wave", 0.6, { min: 0, max: 2, step: 0.01 }),
      numberControl("turbulence", "Turbulence", 1.2, { min: 0, max: 3, step: 0.01 }),
      numberControl("gustOnBeat", "Gust on Beat", 0.8, { min: 0, max: 1, step: 0.01 }),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.05 }),
      selectControl("logoText", "Logo Text", "SMCGA", [
        { label: "SMCGA", value: "SMCGA" },
        { label: "FIRE", value: "FIRE" },
        { label: "OFF", value: "" }
      ]),
      numberControl("logoSize", "Logo Size", 48, { min: 10, max: 160, step: 1 }),
      numberControl("logoY", "Logo Y", 0),
      numberControl("scanlines", "Scanlines", 0.25, { min: 0, max: 1, step: 0.01 }),
      numberControl("glowStrength", "Glow Strength", 0.3, { min: 0, max: 2, step: 0.01 })
    ]
  },
  textmode_charset: {
    title: "Textmode Charset Controls",
    controls: [
      numberControl("cols", "Columns", TEXTMODE_CHARSET_DEFAULTS.cols, { min: 12, max: 180, step: 1 }),
      numberControl("rows", "Rows", TEXTMODE_CHARSET_DEFAULTS.rows, { min: 8, max: 120, step: 1 }),
      numberControl("glyphSet", "Glyph Set", TEXTMODE_CHARSET_DEFAULTS.glyphSet, { min: 0, max: 8, step: 1 }),
      numberControl("mode", "Mode", TEXTMODE_CHARSET_DEFAULTS.mode, { min: 0, max: 8, step: 1 }),
      numberControl("speed", "Speed", TEXTMODE_CHARSET_DEFAULTS.speed, { min: 0, max: 6, step: 0.05 }),
      numberControl("palette", "Palette", TEXTMODE_CHARSET_DEFAULTS.palette, { min: 0, max: 8, step: 1 }),
      numberControl("scanlines", "Scanlines", TEXTMODE_CHARSET_DEFAULTS.scanlines, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", TEXTMODE_CHARSET_DEFAULTS.seed, { min: 0, max: 999, step: 1 })
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
