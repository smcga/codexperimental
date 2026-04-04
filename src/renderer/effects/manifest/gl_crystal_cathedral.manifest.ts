import { defineEffectManifest, numberControl } from "./shared";
import { CRYSTAL_CATHEDRAL_DEFAULTS, CrystalCathedralEffect } from "../gl/crystalCathedralEffect";

export const gl_crystal_cathedralManifest = defineEffectManifest({
  key: "gl_crystal_cathedral",
  className: "CrystalCathedralEffect",
  sourcePath: "src/renderer/effects/gl/crystalCathedralEffect.ts",
  createEffect: () => new CrystalCathedralEffect(),
  debug: {
    title: "Crystal Cathedral (WebGL) Controls",
    controls: [
      numberControl("speed", "Speed", CRYSTAL_CATHEDRAL_DEFAULTS.speed, { min: 0.1, max: 2, step: 0.05 }),
      numberControl("quality", "Quality", CRYSTAL_CATHEDRAL_DEFAULTS.quality, { min: 1, max: 3, step: 1 }),
      numberControl("exposure", "Exposure", CRYSTAL_CATHEDRAL_DEFAULTS.exposure, { min: 0.5, max: 2, step: 0.05 }),
      numberControl("hueShift", "Hue Shift", CRYSTAL_CATHEDRAL_DEFAULTS.hueShift, { min: 0, max: 1, step: 0.01 }),
      numberControl("crystalDensity", "Crystal Density", CRYSTAL_CATHEDRAL_DEFAULTS.crystalDensity, {
        min: 0.2,
        max: 1.4,
        step: 0.01
      }),
      numberControl("symmetry", "Symmetry", CRYSTAL_CATHEDRAL_DEFAULTS.symmetry, { min: 0, max: 1, step: 0.01 }),
      numberControl("reflectivity", "Reflectivity", CRYSTAL_CATHEDRAL_DEFAULTS.reflectivity, {
        min: 0,
        max: 1,
        step: 0.01
      }),
      numberControl("fog", "Fog", CRYSTAL_CATHEDRAL_DEFAULTS.fog, { min: 0, max: 1, step: 0.01 }),
      numberControl("glow", "Glow", CRYSTAL_CATHEDRAL_DEFAULTS.glow, { min: 0, max: 2, step: 0.01 }),
      numberControl("audioReact", "Audio React", CRYSTAL_CATHEDRAL_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.01 }),
      numberControl("beatKick", "Beat Kick", CRYSTAL_CATHEDRAL_DEFAULTS.beatKick, { min: 0, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", CRYSTAL_CATHEDRAL_DEFAULTS.seed, { min: 0, max: 9999, step: 1 }),
      numberControl("facetSharpness", "Facet Sharpness", CRYSTAL_CATHEDRAL_DEFAULTS.facetSharpness, {
        min: 0.1,
        max: 1.5,
        step: 0.01
      })
    ]
  },
  docs: {
    parameters:
      "`speed`, `quality`, `exposure`, `hueShift`, `crystalDensity`, `symmetry`, `reflectivity`, `fog`, `glow`, `audioReact`, `beatKick`, `seed`, `facetSharpness`",
    catalogNote:
      "Primary: `future`/`pcdemo`; secondary `ps1` at low quality with harsher forms. Fallback draws layered Canvas2D arches, mirrored floor gradients, and fog glows.",
    description:
      "Raymarched crystalline cathedral with reflective floor, repeating arches, and audio-reactive emissive geometry. Falls back to a stylised Canvas2D cathedral pass when WebGL2 is unavailable."
  }
});

export default gl_crystal_cathedralManifest;
