import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { PRISM_BLOOM_DEFAULTS, PrismBloomEffect } from "../prismBloomEffect";

export const prism_bloomManifest = defineEffectManifest({
  key: "prism_bloom",
  className: "PrismBloomEffect",
  sourcePath: "src/renderer/effects/prismBloomEffect.ts",
  createEffect: () => new PrismBloomEffect(),
  debug: {
    title: "Prism Bloom Controls",
    controls: [
      numberControl("bloom", "Bloom", PRISM_BLOOM_DEFAULTS.bloom, { min: 0, max: 1.4, step: 0.05 }),
      numberControl("flow", "Flow", PRISM_BLOOM_DEFAULTS.flow, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("petalCount", "Petal Count", PRISM_BLOOM_DEFAULTS.petalCount, { min: 6, max: 36, step: 1 }),
      numberControl("smear", "Smear", PRISM_BLOOM_DEFAULTS.smear, { min: 0, max: 1.1, step: 0.05 }),
      numberControl("prismShift", "Prism Shift", PRISM_BLOOM_DEFAULTS.prismShift, { min: -1, max: 1, step: 0.05 }),
      numberControl("vignette", "Vignette", PRISM_BLOOM_DEFAULTS.vignette, { min: 0, max: 1, step: 0.05 }),
      numberControl("audioReact", "Audio React", PRISM_BLOOM_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", PRISM_BLOOM_DEFAULTS.seed, { min: 0, max: 9999, step: 1 })
    ]
  },
  docs: {
    parameters: "`bloom`, `flow`, `petalCount`, `smear`, `prismShift`, `vignette`, `audioReact`, `seed`",
    catalogNote: "Painterly prism petals and spectral bloom clouds for a tasteful AI-art showcase beat.",
    description: "Painterly prism petals and spectral bloom clouds for a tasteful AI-art showcase beat."
  }
});

export default prism_bloomManifest;
