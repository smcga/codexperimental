import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { RainEffect } from "../rainEffect";

export const rainManifest = defineEffectManifest({
  key: "rain",
  className: "RainEffect",
  sourcePath: "src/renderer/effects/rainEffect.ts",
  createEffect: () => new RainEffect(),
  debug: {
    title: "Rain Controls",
    controls: [
      numberControl("intensity", "Intensity", 0.5, { min: 0, max: 1, step: 0.05 }),
      numberControl("wind", "Wind", 0.1, { min: -1, max: 1, step: 0.05 }),
      numberControl("speed", "Speed", 1, { min: 0, max: 3, step: 0.05 }),
      numberControl("streakLength", "Streak Length", 1, { min: 0.25, max: 2.5, step: 0.05 }),
      toggleControl("splash", "Splash", false),
      numberControl("hue", "Hue", 205, { min: 0, max: 360, step: 1 }),
      numberControl("storm", "Storm", 0.5, { min: 0, max: 1, step: 0.05 }),
      numberControl("turbulence", "Turbulence", 0.35, { min: 0, max: 1, step: 0.05 }),
      numberControl("mist", "Mist", 0.35, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 999, step: 1 })
    ]
  },
  docs: {
    parameters: "`intensity`, `wind`, `speed`, `streakLength`, `splash`, `hue`, `storm`, `turbulence`, `mist`, `seed`",
    catalogNote: "`storm` controls downpour density/velocity, `turbulence` adds sideways sway, and `mist` controls near-ground fog bands.",
    description: "`storm` controls downpour density/velocity, `turbulence` adds sideways sway, and `mist` controls near-ground fog bands."
  }
});

export default rainManifest;
