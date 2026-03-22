import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { SynthwaveSunsetEffect } from "../synthwaveSunset";

export const synthwaveSunsetManifest = defineEffectManifest({
  key: "synthwaveSunset",
  className: "SynthwaveSunsetEffect",
  sourcePath: "src/renderer/effects/synthwaveSunset.ts",
  createEffect: () => new SynthwaveSunsetEffect(),
  debug: {
    title: "Synthwave Sunset Controls",
    controls: [
      numberControl("horizon", "Horizon", 0.52, { min: 0.35, max: 0.75, step: 0.01 }),
      numberControl("sunRadius", "Sun Radius", 0.25, { min: 0.1, max: 0.5, step: 0.01 }),
      numberControl("stripeHeight", "Stripe Height", 6, { min: 2, max: 16, step: 1 }),
      numberControl("stripeGap", "Stripe Gap", 4, { min: 1, max: 12, step: 1 }),
      numberControl("seaSpeed", "Sea Speed", 1.0, { min: 0, max: 3, step: 0.05 }),
      numberControl("starCount", "Star Count", 200, { min: 0, max: 500, step: 10 }),
      numberControl("glow", "Glow", 0.35, { min: 0, max: 1, step: 0.05 }),
      numberControl("scanlines", "Scanlines", 0.25, { min: 0, max: 1, step: 0.05 }),
      numberControl("audioReactive", "Audio Reactive", 0.3, { min: 0, max: 1, step: 0.05 })
      ]
  },
  docs: {
    parameters: "`horizon`, `sunRadius`, `stripeHeight`, `stripeGap`, `seaSpeed`, `starCount`, `glow`, `scanlines`, `audioReactive`",
    catalogNote: "",
    description: "Synthwave Sunset"
  }
});

export default synthwaveSunsetManifest;
