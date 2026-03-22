import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { COSMIC_VOYAGE_DEFAULTS, CosmicVoyageEffect } from "../cosmicVoyageEffect";

export const cosmic_voyageManifest = defineEffectManifest({
  key: "cosmic_voyage",
  className: "CosmicVoyageEffect",
  sourcePath: "src/renderer/effects/cosmicVoyageEffect.ts",
  createEffect: () => new CosmicVoyageEffect(),
  debug: {
    title: "Cosmic Voyage Controls",
    controls: [
      numberControl("speed", "Speed", COSMIC_VOYAGE_DEFAULTS.speed, { min: 0, max: 3, step: 0.05 }),
      numberControl("warp", "Warp", COSMIC_VOYAGE_DEFAULTS.warp, { min: 0, max: 2.4, step: 0.05 }),
      numberControl("starDensity", "Star Density", COSMIC_VOYAGE_DEFAULTS.starDensity, { min: 0.2, max: 2.5, step: 0.05 }),
      numberControl("galaxyGlow", "Galaxy Glow", COSMIC_VOYAGE_DEFAULTS.galaxyGlow, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("nebula", "Nebula", COSMIC_VOYAGE_DEFAULTS.nebula, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("asteroidDensity", "Asteroid Density", COSMIC_VOYAGE_DEFAULTS.asteroidDensity, { min: 0, max: 2, step: 0.05 }),
      numberControl("planetCount", "Planet Count", COSMIC_VOYAGE_DEFAULTS.planetCount, { min: 1, max: 8, step: 1 }),
      numberControl("parallax", "Parallax", COSMIC_VOYAGE_DEFAULTS.parallax, { min: 0, max: 1, step: 0.05 }),
      numberControl("bloom", "Bloom", COSMIC_VOYAGE_DEFAULTS.bloom, { min: 0, max: 1.6, step: 0.05 }),
      numberControl("seed", "Seed", COSMIC_VOYAGE_DEFAULTS.seed, { min: 0, max: 9999, step: 1 })
    ]
  },
  docs: {
    parameters: "`speed`, `warp`, `starDensity`, `galaxyGlow`, `nebula`, `asteroidDensity`, `planetCount`, `parallax`, `bloom`, `seed`",
    catalogNote: "Cinematic deep-space flythrough with layered galaxies, planets, and asteroid belts.",
    description: "Cinematic deep-space flythrough with layered galaxies, planets, and asteroid belts."
  }
});

export default cosmic_voyageManifest;
