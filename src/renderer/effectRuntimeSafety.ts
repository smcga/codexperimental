import { clamp } from "../util/math";

const EFFECT_PARAM_ABS_CAP = 1_000;

export function sanitizeRuntimeEffectParams(
  params: Record<string, number>,
  controls: Array<{ key: string; min?: number; max?: number; type?: string }> = []
): Record<string, number> {
  const controlBounds = new Map(controls.map((control) => [control.key, control]));
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      const numeric = Number.isFinite(value) ? value : 0;
      const control = controlBounds.get(key);
      const min = control?.min ?? -EFFECT_PARAM_ABS_CAP;
      const max = control?.max ?? EFFECT_PARAM_ABS_CAP;
      return [key, clamp(numeric, min, max)];
    })
  );
}
