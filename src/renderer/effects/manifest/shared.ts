import { Effect } from "../types";

export type EffectParamValue = number | string;

export type EffectParamOption = {
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

export type EffectDocsConfig = {
  parameters: string;
  catalogNote: string;
  description: string;
};

export type EffectManifest = {
  key: string;
  className: string;
  sourcePath: string;
  createEffect: () => Effect;
  debug: EffectDebugConfig;
  docs: EffectDocsConfig;
  defaults?: () => Record<string, EffectParamValue>;
  coerceParams?: (overrides: Record<string, EffectParamValue>) => Record<string, EffectParamValue>;
};

export const defineEffectManifest = <T extends EffectManifest>(manifest: T): T => manifest;

export const numberControl = (
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

export const toggleControl = (key: string, label: string, defaultValue: boolean): EffectParamControl => ({
  key,
  label,
  type: "toggle",
  defaultValue: defaultValue ? 1 : 0
});

export const selectControl = (
  key: string,
  label: string,
  defaultValue: string,
  options: EffectParamOption[]
): EffectParamControl => ({
  key,
  label,
  type: "select",
  defaultValue,
  options
});
