import { defineEffectManifest, numberControl } from "./shared";
import { WaterReflectionEffect } from "../waterReflectionEffect";

export const water_reflectionManifest = defineEffectManifest({
  key: "water_reflection",
  className: "WaterReflectionEffect",
  sourcePath: "src/renderer/effects/waterReflectionEffect.ts",
  createEffect: () => new WaterReflectionEffect(),
  debug: {
    title: "Water Reflection Controls",
    controls: [
      numberControl("rippleAmp", "Ripple Amplitude", 14, { min: 0, max: 48, step: 1 }),
      numberControl("rippleFreq", "Ripple Frequency", 2.4, { min: 0.2, max: 8, step: 0.1 }),
      numberControl("rippleSpeed", "Ripple Speed", 1.35, { min: 0, max: 6, step: 0.05 }),
      numberControl("shimmer", "Shimmer", 0.58, { min: 0, max: 1, step: 0.01 }),
      numberControl("chop", "Chop", 0.42, { min: 0, max: 1, step: 0.01 }),
      numberControl("tint", "Tint", 198, { min: 170, max: 230, step: 1 }),
      numberControl("opacity", "Opacity", 0.82, { min: 0.15, max: 1, step: 0.01 }),
      numberControl("audioReact", "Audio React", 0.35, { min: 0, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", 7, { min: 0, max: 999, step: 1 })
    ]
  },
  docs: {
    parameters: "`rippleAmp`, `rippleFreq`, `rippleSpeed`, `shimmer`, `chop`, `tint`, `opacity`, `audioReact`, `seed`",
    catalogNote:
      "Mirrors the current scene into the bottom third of the viewport with compressed reflections, shimmer bands, and ripple rings.",
    description:
      "Mirrors the current scene into the bottom third of the viewport with compressed reflections, shimmer bands, and ripple rings."
  }
});

export default water_reflectionManifest;
