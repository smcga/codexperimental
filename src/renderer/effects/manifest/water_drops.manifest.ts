import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { WaterDropsEffect } from "../waterDropsEffect";

export const water_dropsManifest = defineEffectManifest({
  key: "water_drops",
  className: "WaterDropsEffect",
  sourcePath: "src/renderer/effects/waterDropsEffect.ts",
  createEffect: () => new WaterDropsEffect(),
  debug: {
    title: "Water Drops Controls",
    controls: [
      numberControl("dropCount", "Drop Count", 72, { min: 8, max: 280, step: 1 }),
      numberControl("minRadius", "Min Radius", 3, { min: 1, max: 80, step: 1 }),
      numberControl("maxRadius", "Max Radius", 18, { min: 2, max: 120, step: 1 }),
      numberControl("fallSpeed", "Fall Speed", 0.12, { min: 0, max: 1.2, step: 0.01 }),
      numberControl("distortion", "Distortion", 0.38, { min: 0, max: 1, step: 0.01 }),
      numberControl("trail", "Trail", 0.28, { min: 0, max: 1, step: 0.01 }),
      numberControl("audioReact", "Audio React", 0.25, { min: 0, max: 1, step: 0.01 }),
      numberControl("tint", "Tint", 205, { min: 170, max: 230, step: 1 }),
      numberControl("refraction", "Refraction", 0.85, { min: 0, max: 1, step: 0.01 }),
      numberControl("microDrops", "Micro Drops", 0.7, { min: 0, max: 1, step: 0.01 }),
      numberControl("rivulets", "Rivulets", 0.35, { min: 0, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 999, step: 1 })
    ]
  },
  docs: {
    parameters: "`dropCount`, `minRadius`, `maxRadius`, `fallSpeed`, `distortion`, `trail`, `audioReact`, `tint`, `refraction`, `microDrops`, `rivulets`, `seed`",
    catalogNote: "Layered wet-glass droplets with refractive cores, chromatic rims, sparkling micro-beads, and flowing rivulet streaks.",
    description: "Layered wet-glass droplets with refractive cores, chromatic rims, sparkling micro-beads, and flowing rivulet streaks."
  }
});

export default water_dropsManifest;
