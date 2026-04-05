import { defineEffectManifest, numberControl, selectControl } from "./shared";
import { ParticleAttractorsEffect } from "../particleAttractors";

export const particleAttractorsManifest = defineEffectManifest({
  key: "particleAttractors",
  className: "ParticleAttractorsEffect",
  sourcePath: "src/renderer/effects/particleAttractors.ts",
  createEffect: () => new ParticleAttractorsEffect(),
  debug: {
    title: "Particle Attractors Controls",
    controls: [
      numberControl("count", "Count", 600, { min: 50, max: 3000, step: 10 }),
      numberControl("seed", "Seed", 1337, { min: 0, max: 999999, step: 1 }),
      numberControl("attractorCount", "Attractor Count", 2, { min: 1, max: 4, step: 1 }),
      numberControl("strength", "Strength", 1800, { min: 100, max: 6000, step: 10 }),
      numberControl("swirl", "Swirl", 0.65, { min: -2.5, max: 2.5, step: 0.01 }),
      numberControl("damping", "Damping", 0.985, { min: 0.85, max: 0.9999, step: 0.0005 }),
      numberControl("speedLimit", "Speed Limit", 240, { min: 30, max: 900, step: 1 }),
      numberControl("softening", "Softening", 24, { min: 2, max: 160, step: 1 }),
      numberControl("absorbRadius", "Absorb Radius", 10, { min: 0, max: 80, step: 1 }),
      selectControl("spawnMode", "Spawn Mode", "edges", [
        { label: "Edges", value: "edges" },
        { label: "Ring", value: "ring" },
        { label: "Random", value: "random" }
      ]),
      numberControl("trailAlpha", "Trail Alpha", 0.14, { min: 0.01, max: 0.6, step: 0.01 }),
      numberControl("particleSize", "Particle Size", 1.6, { min: 0.5, max: 4, step: 0.1 }),
      numberControl("glow", "Glow", 0.8, { min: 0, max: 2.5, step: 0.05 }),
      numberControl("motion", "Motion", 0.35, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("audioReactive", "Audio Reactive", 0.5, { min: 0, max: 1, step: 0.01 }),
      numberControl("beatPulse", "Beat Pulse", 0.7, { min: 0, max: 2, step: 0.01 }),
      selectControl("colorMode", "Color Mode", "era", [
        { label: "Mono", value: "mono" },
        { label: "Era", value: "era" },
        { label: "Heat", value: "heat" }
      ]),
      numberControl("backgroundFade", "Background Fade", 0.12, { min: 0, max: 0.5, step: 0.01 }),
      numberControl("vignette", "Vignette", 0.16, { min: 0, max: 0.6, step: 0.01 })
    ]
  },
  docs: {
    parameters:
      "`count`, `seed`, `attractorCount`, `strength`, `swirl`, `damping`, `speedLimit`, `softening`, `absorbRadius`, `spawnMode`, `trailAlpha`, `particleSize`, `glow`, `motion`, `audioReactive`, `beatPulse`, `colorMode`, `backgroundFade`, `vignette`",
    catalogNote:
      "Force-driven particle simulation with up to four gravity wells, swirling trajectories, and additive trail accumulation.",
    description:
      "Canvas2D gravity wells that pull and swirl particles into readable cosmic flow fields with tasteful audio pulse modulation."
  }
});

export default particleAttractorsManifest;
