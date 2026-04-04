import { createEffectRegistry } from "./manifest";

export { effectManifests, getEffectManifest, getEffectManifests, getEffectRegistryKeys } from "./manifest";
export { ExplosionBurstEffect } from "./explosionBurst";

export const effectRegistry = createEffectRegistry();

export function resetEffects(): void {
  Object.values(effectRegistry).forEach((effect) => {
    effect.reset?.();
  });
}
