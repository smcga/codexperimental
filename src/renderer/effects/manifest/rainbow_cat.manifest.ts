import { defineEffectManifest, numberControl } from "./shared";
import { RainbowCatEffect } from "../rainbowCatEffect";

export const rainbow_catManifest = defineEffectManifest({
  key: "rainbow_cat",
  className: "RainbowCatEffect",
  sourcePath: "src/renderer/effects/rainbowCatEffect.ts",
  createEffect: () => new RainbowCatEffect(),
  debug: {
    title: "Rainbow Cat Controls",
    controls: [
      numberControl("speed", "Speed", 0.9, { min: 0.2, max: 2.5, step: 0.05 }),
      numberControl("rainbowLength", "Rainbow Length", 0.72, { min: 0.2, max: 1, step: 0.05 }),
      numberControl("bounce", "Bounce", 0.45, { min: 0, max: 1.2, step: 0.05 }),
      numberControl("sparkle", "Sparkle", 0.6, { min: 0, max: 1, step: 0.05 }),
      numberControl("trailAlpha", "Trail Alpha", 0.82, { min: 0.1, max: 1, step: 0.05 }),
      numberControl("catScale", "Cat Scale", 1, { min: 0.6, max: 1.8, step: 0.05 }),
      numberControl("starDensity", "Star Density", 0.65, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 999, step: 1 })
    ]
  },
  docs: {
    parameters: "`speed`, `rainbowLength`, `bounce`, `sparkle`, `trailAlpha`, `catScale`, `starDensity`, `seed`",
    catalogNote: "Synth-night rainbow cat silhouette with swishing tail, trotting paws, glitter stars, and a configurable six-colour trail.",
    description: "Synth-night rainbow cat silhouette with swishing tail, trotting paws, glitter stars, and a configurable six-colour trail."
  }
});

export default rainbow_catManifest;
