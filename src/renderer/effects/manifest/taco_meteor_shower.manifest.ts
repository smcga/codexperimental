import { TacoMeteorShowerEffect } from "../tacoMeteorShowerEffect";
import { defineEffectManifest, numberControl } from "./shared";

export const taco_meteor_showerManifest = defineEffectManifest({
  key: "taco_meteor_shower",
  className: "TacoMeteorShowerEffect",
  sourcePath: "src/renderer/effects/tacoMeteorShowerEffect.ts",
  createEffect: () => new TacoMeteorShowerEffect(),
  debug: {
    title: "Taco Meteor Shower Controls",
    controls: [
      numberControl("shellCount", "Shell Count", 13, { min: 4, max: 28, step: 1 }),
      numberControl("swirl", "Swirl", 0.62, { min: 0, max: 1.4, step: 0.01 }),
      numberControl("trail", "Trail", 0.54, { min: 0, max: 1, step: 0.01 }),
      numberControl("toppingBurst", "Topping Burst", 0.68, { min: 0, max: 1.25, step: 0.01 }),
      numberControl("audioReact", "Audio React", 0.72, { min: 0, max: 1, step: 0.01 }),
      numberControl("hueShift", "Hue Shift", 0, { min: -180, max: 180, step: 1 }),
      numberControl("seed", "Seed", 7, { min: 0, max: 999, step: 1 })
    ]
  },
  docs: {
    parameters: "`shellCount`, `swirl`, `trail`, `toppingBurst`, `audioReact`, `hueShift`, `seed`",
    catalogNote: "Swirling taco shells descend like meteors, shedding glitter trails before splashing into avocado, cilantro, and salsa bursts.",
    description: "Swirling taco shells descend like meteors, shedding glitter trails before splashing into avocado, cilantro, and salsa bursts."
  }
});

export default taco_meteor_showerManifest;
