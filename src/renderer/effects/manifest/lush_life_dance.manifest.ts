import { LushLifeDanceEffect } from "../lushLifeDanceEffect";
import { defineEffectManifest, numberControl } from "./shared";

export const lush_life_danceManifest = defineEffectManifest({
  key: "lush_life_dance",
  className: "LushLifeDanceEffect",
  sourcePath: "src/renderer/effects/lushLifeDanceEffect.ts",
  createEffect: () => new LushLifeDanceEffect(),
  debug: {
    title: "Lush Life Dance Controls",
    controls: [
      numberControl("bpm", "BPM", 120, { min: 60, max: 180, step: 1 }),
      numberControl("amplitude", "Amplitude", 1, { min: 0.4, max: 1.8, step: 0.01 }),
      numberControl("bounce", "Bounce", 0.7, { min: 0, max: 1.2, step: 0.01 }),
      numberControl("trail", "Trail", 0.28, { min: 0, max: 0.9, step: 0.01 }),
      numberControl("glow", "Glow", 0.55, { min: 0, max: 1, step: 0.01 }),
      numberControl("silhouetteScale", "Silhouette Scale", 1, { min: 0.5, max: 1.5, step: 0.01 }),
      numberControl("stageHue", "Stage Hue", 316, { min: 0, max: 360, step: 1 }),
      numberControl("accentHue", "Accent Hue", 186, { min: 0, max: 360, step: 1 }),
      numberControl("audioReactive", "Audio Reactive", 0.6, { min: 0, max: 1, step: 0.01 }),
      numberControl("hairHue", "Hair Hue", 48, { min: 0, max: 360, step: 1 }),
      numberControl("outfitHue", "Outfit Hue", 316, { min: 0, max: 360, step: 1 }),
      numberControl("metalHue", "Metal Hue", 200, { min: 0, max: 360, step: 1 }),
      numberControl("sparkle", "Sparkle", 0.65, { min: 0, max: 1, step: 0.01 }),
      numberControl("fashionDetail", "Fashion Detail", 0.75, { min: 0, max: 1, step: 0.01 })
    ]
  },
  docs: {
    description: "Concert-pop silhouette dance loop with stylized hair, outfit, sparkle, and stage lights.",
    parameters:
      "`bpm`, `amplitude`, `bounce`, `trail`, `glow`, `silhouetteScale`, `stageHue`, `accentHue`, `audioReactive`, `hairHue`, `outfitHue`, `metalHue`, `sparkle`, `fashionDetail`",
    catalogNote: "Stylized single-dancer choreography loop with pop-star silhouette styling and audio-reactive stage glow."
  }
});

export default lush_life_danceManifest;
