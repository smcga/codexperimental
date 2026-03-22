import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { GlitchEffect } from "../glitchEffect";

export const glitchManifest = defineEffectManifest({
  key: "glitch",
  className: "GlitchEffect",
  sourcePath: "src/renderer/effects/glitchEffect.ts",
  createEffect: () => new GlitchEffect(),
  debug: {
    title: "Glitch Controls",
    controls: [
      numberControl("sparkles", "Sparkles", 60, { min: 10, max: 200, step: 5 }),
      numberControl("sparkleSize", "Sparkle Size", 2, { min: 1, max: 6, step: 0.5 }),
      numberControl("sliceCount", "Slice Count", 3, { min: 1, max: 10, step: 1 }),
      numberControl("sliceBoost", "Slice Boost", 10, { min: 0, max: 20, step: 1 }),
      numberControl("sliceHeight", "Slice Height", 4, { min: 1, max: 12, step: 1 }),
      numberControl("sliceVariance", "Slice Variance", 18, { min: 0, max: 30, step: 1 }),
      numberControl("offset", "Offset", 0.08, { min: 0, max: 0.3, step: 0.01 }),
      numberControl("shake", "Shake", 4, { min: 0, max: 10, step: 0.1 }),
      numberControl("maxShake", "Max Shake", 5, { min: 0.5, max: 12, step: 0.1 })
    ]
  },
  docs: {
    parameters: "`sparkles`, `sparkleSize`, `sliceCount`, `sliceBoost`, `sliceHeight`, `sliceVariance`, `offset`, `shake`, `maxShake`",
    catalogNote: "",
    description: "Glitch"
  }
});

export default glitchManifest;
