import { clamp } from "../../util/math";
import { NEON_ALLEY_DEFAULTS } from "../effects/gl/neonAlleyEffect";
import { DEFAULT_FLYOVER_PARAMS, coerceFlyoverParams } from "./flyoverDebug";

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
