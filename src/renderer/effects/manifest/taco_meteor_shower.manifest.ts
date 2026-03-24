import { defineEffectManifest, numberControl } from "./shared";
import { TacoMeteorShowerEffect } from "../tacoMeteorShowerEffect";

export const taco_meteor_showerManifest = defineEffectManifest({
  key: "taco_meteor_shower",
  className: "TacoMeteorShowerEffect",
  sourcePath: "src/renderer/effects/tacoMeteorShowerEffect.ts",
  createEffect: () => new TacoMeteorShowerEffect(),
  debug: {
    title: "Taco Meteor Shower Controls",
    controls: [
      numberControl("shellCount", "Shell Count", 16, { min: 6, max: 32, step: 1 }),
      numberControl("swirl", "Swirl", 0.68, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("trail", "Trail", 0.72, { min: 0, max: 1, step: 0.01 }),
      numberControl("toppingBurst", "Topping Burst", 0.74, { min: 0, max: 1.4, step: 0.01 }),
      numberControl("salsaChaos", "Salsa Chaos", 0.58, { min: 0, max: 1.3, step: 0.01 }),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.01 }),
      numberControl("colorHeat", "Color Heat", 0.36, { min: 0, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", 7, { min: 0, max: 999, step: 1 })
    ]
  },
  docs: {
    parameters: "`shellCount`, `swirl`, `trail`, `toppingBurst`, `salsaChaos`, `audioReact`, `colorHeat`, `seed`",
    catalogNote: "Luminescent taco shells spiral like meteors, then burst into avocado, cilantro, salsa, and golden shell shards on impact.",
    description: "Luminescent taco shells spiral like meteors, trail glittering stardust, and explode into avocado, cilantro, salsa, and shell shards in sync with the music."
  }
});

export default taco_meteor_showerManifest;
