import { clamp } from "../../util/math";
import {
  EffectDebugConfig,
  EffectParamControl,
  EffectParamOption,
  EffectParamValue,
  getEffectManifest
} from "../effects/manifest";

export type { EffectDebugConfig, EffectParamControl, EffectParamValue };

export function getEffectDebugConfig(effectName: string | null): EffectDebugConfig | null {
  if (!effectName) {
    return null;
  }
  return getEffectManifest(effectName)?.debug ?? {
    title: `${effectName} Controls`,
    controls: []
  };
}

export function getEffectDebugDefaults(effectName: string): Record<string, EffectParamValue> {
  const manifest = getEffectManifest(effectName);
  if (!manifest) {
    return {};
  }
  if (manifest.defaults) {
    return manifest.defaults();
  }
  return manifest.debug.controls.reduce<Record<string, EffectParamValue>>((acc, control) => {
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

const coerceFromControls = (
  controls: EffectParamControl[],
  defaults: Record<string, EffectParamValue>,
  overrides: Record<string, EffectParamValue>
): Record<string, EffectParamValue> =>
  controls.reduce<Record<string, EffectParamValue>>((acc, control) => {
    const value = overrides[control.key];
    if (control.type === "select") {
      acc[control.key] = coerceSelectValue(value, control.options ?? [], String(defaults[control.key] ?? control.defaultValue));
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

export function coerceEffectParams(
  effectName: string,
  overrides: Record<string, EffectParamValue>
): Record<string, EffectParamValue> {
  const manifest = getEffectManifest(effectName);
  if (!manifest) {
    return {};
  }
  if (manifest.coerceParams) {
    return manifest.coerceParams(overrides);
  }
  const defaults = getEffectDebugDefaults(effectName);
  if (manifest.debug.controls.length === 0) {
    return { ...defaults };
  }
  return coerceFromControls(manifest.debug.controls, defaults, overrides);
}
