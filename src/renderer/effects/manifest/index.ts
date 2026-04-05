export type { EffectDebugConfig, EffectDocsConfig, EffectManifest, EffectParamControl, EffectParamOption, EffectParamValue } from "./shared";
import { generatedEffectManifests } from "./generated";
import { Effect } from "../types";
import { EffectDebugConfig, EffectManifest } from "./shared";

const sortByRegistryKey = (left: EffectManifest, right: EffectManifest): number =>
  left.key < right.key ? -1 : left.key > right.key ? 1 : 0;

export const effectManifests = [...generatedEffectManifests].sort(sortByRegistryKey);
const runtimeManifests = new Map<string, EffectManifest>();

const getAllEffectManifests = (): EffectManifest[] =>
  [...effectManifests, ...runtimeManifests.values()].sort(sortByRegistryKey);

export const registerRuntimeEffectManifest = (manifest: EffectManifest): void => {
  runtimeManifests.set(manifest.key, manifest);
};

export const clearRuntimeEffectManifests = (): void => {
  runtimeManifests.clear();
};

export const getEffectManifests = (): EffectManifest[] => getAllEffectManifests();

export const getEffectManifest = (effectName: string | null): EffectManifest | null => {
  if (!effectName) {
    return null;
  }
  return getAllEffectManifests().find((manifest) => manifest.key === effectName) ?? null;
};

export const getEffectRegistryKeys = (): string[] => getAllEffectManifests().map((manifest) => manifest.key);

export const createEffectRegistry = (): Record<string, Effect> =>
  Object.fromEntries(getAllEffectManifests().map((manifest) => [manifest.key, manifest.createEffect()]));

export const getManifestDebugConfig = (effectName: string | null): EffectDebugConfig | null => {
  const manifest = getEffectManifest(effectName);
  if (!manifest) {
    return null;
  }
  return manifest.debug;
};
