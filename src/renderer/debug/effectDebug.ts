import { clamp } from "../../util/math";
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
    controls: []
  },
  ribbons: {
    title: "Ribbon Controls",
    controls: []
  },
  lissajous: {
    title: "Lissajous Controls",
    controls: []
  },
  glitch: {
    title: "Glitch Controls",
    controls: []
  },
  bokeh: {
    title: "Bokeh Controls",
    controls: []
  },
  fractal: {
    title: "Fractal Controls",
    controls: []
  },
  feedback: {
    title: "Feedback Controls",
    controls: []
  },
  equalizer: {
    title: "Equalizer Controls",
    controls: []
  },
  isogrid: {
    title: "Isogrid Controls",
    controls: []
  },
  neon: {
    title: "Neon Controls",
    controls: []
  },
  particles: {
    title: "Particle Field Controls",
    controls: []
  },
  finale: {
    title: "Finale Controls",
    controls: []
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
