import { GeneratedEffectParam } from "./effectIdeas";

export type GeneratedEffectParamValue = number | string;

const resolveNumericRange = (param: GeneratedEffectParam): { min: number; max: number } => {
  const fallbackDefault = typeof param.defaultValue === "number" ? param.defaultValue : 0;
  const min = param.min ?? Math.min(0, fallbackDefault);
  const max = param.max ?? Math.max(min + 1, fallbackDefault * 2 || 1);
  return { min, max: Math.max(min, max) };
};

const normalizeToggleValue = (value: unknown): number => Number(value) !== 0 ? 1 : 0;

export const getGeneratedEffectDefaultParams = (
  params: GeneratedEffectParam[] | undefined
): Record<string, GeneratedEffectParamValue> => {
  if (!params || params.length === 0) {
    return {};
  }
  return params.reduce<Record<string, GeneratedEffectParamValue>>((acc, param) => {
    if (!param.key) {
      return acc;
    }
    if (param.type === "toggle") {
      acc[param.key] = normalizeToggleValue(param.defaultValue);
      return acc;
    }
    if (param.type === "select") {
      const options = param.options ?? [];
      const fallback = options[0]?.value ?? "";
      const selected = typeof param.defaultValue === "string" && options.some((option) => option.value === param.defaultValue)
        ? param.defaultValue
        : fallback;
      acc[param.key] = selected;
      return acc;
    }
    acc[param.key] = typeof param.defaultValue === "number" ? param.defaultValue : 0;
    return acc;
  }, {});
};

export const getRandomGeneratedEffectParams = (
  params: GeneratedEffectParam[] | undefined,
  randomValue = Math.random
): Record<string, GeneratedEffectParamValue> => {
  if (!params || params.length === 0) {
    return {};
  }
  return params.reduce<Record<string, GeneratedEffectParamValue>>((acc, param) => {
    if (!param.key) {
      return acc;
    }
    if (param.type === "toggle") {
      acc[param.key] = randomValue() >= 0.5 ? 1 : 0;
      return acc;
    }
    if (param.type === "select") {
      const options = param.options ?? [];
      if (options.length === 0) {
        acc[param.key] = typeof param.defaultValue === "string" ? param.defaultValue : "";
        return acc;
      }
      const optionIndex = Math.min(options.length - 1, Math.floor(randomValue() * options.length));
      acc[param.key] = options[optionIndex]?.value ?? options[0].value;
      return acc;
    }
    const { min, max } = resolveNumericRange(param);
    const step = param.step ?? 0.01;
    const range = Math.max(0, max - min);
    const unrounded = min + randomValue() * range;
    const stepped = step > 0 ? Math.round((unrounded - min) / step) * step + min : unrounded;
    acc[param.key] = Number(stepped.toFixed(6));
    return acc;
  }, {});
};

export const applyCurrentValuesAsGeneratedDefaults = (
  params: GeneratedEffectParam[] | undefined,
  currentValues: Record<string, GeneratedEffectParamValue>
): GeneratedEffectParam[] => {
  if (!params || params.length === 0) {
    return [];
  }
  return params.map((param) => {
    const current = currentValues[param.key];
    if (param.type === "toggle") {
      return { ...param, defaultValue: normalizeToggleValue(current ?? param.defaultValue) };
    }
    if (param.type === "select") {
      const nextValue = typeof current === "string" ? current : typeof param.defaultValue === "string" ? param.defaultValue : "";
      return { ...param, defaultValue: nextValue };
    }
    const numeric = typeof current === "number" ? current : typeof param.defaultValue === "number" ? param.defaultValue : 0;
    return { ...param, defaultValue: numeric };
  });
};
