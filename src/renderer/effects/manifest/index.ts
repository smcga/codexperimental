export type { EffectDebugConfig, EffectDocsConfig, EffectManifest, EffectParamControl, EffectParamOption, EffectParamValue } from "./shared";
import { generatedEffectManifests } from "./generated";
import { Effect } from "../types";
import { EffectDebugConfig, EffectManifest } from "./shared";

const sortByRegistryKey = (left: EffectManifest, right: EffectManifest): number => left.key.localeCompare(right.key);

export const effectManifests = [...generatedEffectManifests].sort(sortByRegistryKey);

export const getEffectManifests = (): EffectManifest[] => effectManifests;

export const getEffectManifest = (effectName: string | null): EffectManifest | null => {
  if (!effectName) {
    return null;
  }
  return effectManifests.find((manifest) => manifest.key === effectName) ?? null;
};

export const getEffectRegistryKeys = (): string[] => effectManifests.map((manifest) => manifest.key);

export const createEffectRegistry = (): Record<string, Effect> =>
  Object.fromEntries(effectManifests.map((manifest) => [manifest.key, manifest.createEffect()]));

export const getManifestDebugConfig = (effectName: string | null): EffectDebugConfig | null => {
  const manifest = getEffectManifest(effectName);
  if (!manifest) {
    return null;
  }
  return manifest.debug;
};
