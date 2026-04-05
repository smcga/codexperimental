import { defineEffectManifest, numberControl } from "./shared";
import { LensFlareEffect } from "../lensFlareEffect";

export const lens_flareManifest = defineEffectManifest({
  key: "lens_flare",
  className: "LensFlareEffect",
  sourcePath: "src/renderer/effects/lensFlareEffect.ts",
  createEffect: () => new LensFlareEffect(),
  debug: {
    title: "Lens Flare Controls",
    controls: [
      numberControl("intensity", "Intensity", 1.0, { min: 0, max: 4, step: 0.05 }),
      numberControl("sourceX", "Source X", 0.52, { min: 0, max: 1, step: 0.01 }),
      numberControl("sourceY", "Source Y", 0.46, { min: 0, max: 1, step: 0.01 }),
      numberControl("haloRadius", "Halo Radius", 0.18, { min: 0.05, max: 0.8, step: 0.01 }),
      numberControl("ghostCount", "Ghost Count", 6, { min: 2, max: 12, step: 1 }),
      numberControl("ghostSpread", "Ghost Spread", 1.2, { min: 0.3, max: 2.4, step: 0.05 }),
      numberControl("streakStrength", "Streak Strength", 0.5, { min: 0, max: 2, step: 0.05 }),
      numberControl("ringStrength", "Ring Strength", 0.35, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("chromatic", "Chromatic", 0.3, { min: 0, max: 1.2, step: 0.05 }),
      numberControl("audioReactive", "Audio Reactive", 0.6, { min: 0, max: 1, step: 0.05 }),
      numberControl("shimmer", "Shimmer", 0.25, { min: 0, max: 1, step: 0.05 }),
      numberControl("bgDim", "Background Dim", 0.0, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 999, step: 1 }),
      numberControl("blendBias", "Blend Bias", 1.0, { min: 0, max: 2, step: 0.05 })
    ]
  },
  docs: {
    parameters:
      "`intensity`, `sourceX`, `sourceY`, `haloRadius`, `ghostCount`, `ghostSpread`, `streakStrength`, `ringStrength`, `chromatic`, `audioReactive`, `shimmer`, `bgDim`, `seed`, `blendBias`",
    catalogNote: "Cinematic optical flare with centered ghost chains, soft rings, and an optional anamorphic streak.",
    description: "Cinematic lens flare"
  }
});

export default lens_flareManifest;
