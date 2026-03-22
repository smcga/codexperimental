import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { FireworksDisplayEffect } from "../fireworksDisplayEffect";

export const fireworks_displayManifest = defineEffectManifest({
  key: "fireworks_display",
  className: "FireworksDisplayEffect",
  sourcePath: "src/renderer/effects/fireworksDisplayEffect.ts",
  createEffect: () => new FireworksDisplayEffect(),
  debug: {
    title: "Fireworks Display Controls",
    controls: [
      numberControl("shellRate", "Shell Rate", 0.55, { min: 0.1, max: 1.5, step: 0.01 }),
      numberControl("burstSize", "Burst Size", 0.78, { min: 0.2, max: 1.4, step: 0.01 }),
      numberControl("glitter", "Glitter", 0.62, { min: 0, max: 1, step: 0.01 }),
      numberControl("trail", "Trail", 0.28, { min: 0, max: 0.92, step: 0.01 }),
      numberControl("gravity", "Gravity", 0.58, { min: 0.1, max: 1.2, step: 0.01 }),
      numberControl("hueShift", "Hue Shift", 0, { min: -180, max: 180, step: 1 }),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.01 }),
      numberControl("launchSpread", "Launch Spread", 0.82, { min: 0.2, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 999, step: 1 })
    ]
  },
  docs: {
    parameters: "`shellRate`, `burstSize`, `glitter`, `trail`, `gravity`, `hueShift`, `audioReact`, `launchSpread`, `seed`",
    catalogNote: "Audio-reactive fireworks with ember launch tails, deterministic shell timing, sparkling burst spokes, and smoky bloom rings.",
    description: "Audio-reactive fireworks with ember launch tails, deterministic shell timing, sparkling burst spokes, and smoky bloom rings."
  }
});

export default fireworks_displayManifest;
