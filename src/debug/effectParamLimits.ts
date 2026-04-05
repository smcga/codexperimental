import { EffectParamControl } from "../renderer/effects/manifest";

export type EffectParamLimitOverride = {
  min?: number;
  max?: number;
};

export type EffectParamLimitsByEffect = Record<string, Record<string, EffectParamLimitOverride>>;

const toFiniteNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const sanitizeLimitOverride = (value: unknown): EffectParamLimitOverride | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as { min?: unknown; max?: unknown };
  const min = toFiniteNumber(candidate.min);
  const max = toFiniteNumber(candidate.max);
  if (min === undefined && max === undefined) {
    return null;
  }
  return { min, max };
};

export const sanitizeEffectParamLimits = (value: unknown): EffectParamLimitsByEffect => {
  if (!value || typeof value !== "object") {
    return {};
  }
  const raw = value as Record<string, unknown>;
  return Object.entries(raw).reduce<EffectParamLimitsByEffect>((effectsAcc, [effectName, controls]) => {
    if (!controls || typeof controls !== "object") {
      return effectsAcc;
    }
    const sanitizedControls = Object.entries(controls as Record<string, unknown>).reduce<Record<string, EffectParamLimitOverride>>(
      (controlsAcc, [controlKey, controlOverride]) => {
        const sanitized = sanitizeLimitOverride(controlOverride);
        if (!sanitized) {
          return controlsAcc;
        }
        controlsAcc[controlKey] = sanitized;
        return controlsAcc;
      },
      {}
    );
    if (Object.keys(sanitizedControls).length > 0) {
      effectsAcc[effectName] = sanitizedControls;
    }
    return effectsAcc;
  }, {});
};

export const applyLimitOverridesToControls = (
  controls: EffectParamControl[],
  overrides: Record<string, EffectParamLimitOverride> | undefined
): EffectParamControl[] =>
  controls.map((control) => {
    if (control.type !== "number") {
      return control;
    }
    const override = overrides?.[control.key];
    if (!override) {
      return control;
    }
    return {
      ...control,
      min: override.min,
      max: override.max
    };
  });

export const autoExpandDraftLimit = (limit: EffectParamLimitOverride, currentValue: number): EffectParamLimitOverride => {
  const next = { ...limit };
  if (next.min === undefined || currentValue < next.min) {
    next.min = currentValue;
  }
  if (next.max === undefined || currentValue > next.max) {
    next.max = currentValue;
  }
  return next;
};
