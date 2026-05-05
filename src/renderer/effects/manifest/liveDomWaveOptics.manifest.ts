import { LiveDomWaveOpticsEffect } from "../liveDomWaveOpticsEffect";
import { defineEffectManifest, numberControl } from "./shared";

export const liveDomWaveOpticsManifest = defineEffectManifest({
  key: "liveDomWaveOptics",
  className: "LiveDomWaveOpticsEffect",
  sourcePath: "src/renderer/effects/liveDomWaveOpticsEffect.ts",
  createEffect: () => new LiveDomWaveOpticsEffect(),
  debug: {
    title: "Live DOM Wave Optics",
    controls: [
      numberControl("geometryDensity", "Geometry Density", 1, { min: 0.25, max: 2, step: 0.01 }),
      numberControl("diffraction", "Diffraction", 0.75, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("dispersion", "Dispersion", 0.8, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("causticStrength", "Caustic Strength", 0.9, { min: 0, max: 2, step: 0.01 }),
      numberControl("interference", "Interference", 0.7, { min: 0, max: 2, step: 0.01 }),
      numberControl("refraction", "Refraction", 0.6, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("gloss", "Gloss", 0.5, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("animationSpeed", "Animation Speed", 1, { min: 0, max: 3, step: 0.01 }),
      numberControl("audioReactive", "Audio Reactive", 0.35, { min: 0, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", 7, { min: 0, max: 9999, step: 1 })
    ]
  },
  docs: {
    parameters:
      "`geometryDensity`, `diffraction`, `dispersion`, `causticStrength`, `interference`, `refraction`, `gloss`, `animationSpeed`, `audioReactive`, `seed`",
    catalogNote:
      "Live-DOM-inspired faux wave-optics pass that layers diffraction tinting, caustic pulses, interference bands, and refractive panel drift.",
    description:
      "Procedural approximation of optical diffraction/caustic behavior over a synthetic DOM-like panel lattice; designed as an art-direction stand-in for physically-accurate live DOM light transport."
  }
});

export default liveDomWaveOpticsManifest;
