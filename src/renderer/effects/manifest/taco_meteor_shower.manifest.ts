import { defineEffectManifest, numberControl } from "./shared";
import { TacoMeteorShowerEffect, TACO_METEOR_SHOWER_DEFAULTS } from "../tacoMeteorShowerEffect";

export const taco_meteor_showerManifest = defineEffectManifest({
  key: "taco_meteor_shower",
  className: "TacoMeteorShowerEffect",
  sourcePath: "src/renderer/effects/tacoMeteorShowerEffect.ts",
  createEffect: () => new TacoMeteorShowerEffect(),
  debug: {
    title: "Taco Meteor Shower Controls",
    controls: [
      numberControl("shellCount", "Shell Count", TACO_METEOR_SHOWER_DEFAULTS.shellCount, { min: 6, max: 32, step: 1 }),
      numberControl("fallSpeed", "Fall Speed", TACO_METEOR_SHOWER_DEFAULTS.fallSpeed, { min: 0.2, max: 1.6, step: 0.05 }),
      numberControl("swirl", "Swirl", TACO_METEOR_SHOWER_DEFAULTS.swirl, { min: 0, max: 1.4, step: 0.05 }),
      numberControl("burst", "Burst", TACO_METEOR_SHOWER_DEFAULTS.burst, { min: 0.2, max: 1.4, step: 0.05 }),
      numberControl("stardust", "Stardust", TACO_METEOR_SHOWER_DEFAULTS.stardust, { min: 0, max: 1.4, step: 0.05 }),
      numberControl("toppingSpread", "Topping Spread", TACO_METEOR_SHOWER_DEFAULTS.toppingSpread, { min: 0.2, max: 1.4, step: 0.05 }),
      numberControl("audioReact", "Audio React", TACO_METEOR_SHOWER_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", TACO_METEOR_SHOWER_DEFAULTS.seed, { min: 0, max: 9999, step: 1 })
    ]
  },
  docs: {
    parameters: "`shellCount`, `fallSpeed`, `swirl`, `burst`, `stardust`, `toppingSpread`, `audioReact`, `seed`",
    catalogNote: "Luminescent taco shells cascade like meteors, shed sparkling stardust, and splat into avocado/cilantro/salsa confetti.",
    description: "Luminescent taco shells cascade like meteors, shed sparkling stardust, and splat into avocado/cilantro/salsa confetti."
  }
});

export default taco_meteor_showerManifest;
