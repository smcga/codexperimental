import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { ENVMAP_DONUT_DEFAULTS, EnvmapDonutEffect } from "../envmapDonut";

export const envmap_donutManifest = defineEffectManifest({
  key: "envmap_donut",
  className: "EnvmapDonutEffect",
  sourcePath: "src/renderer/effects/envmapDonut.ts",
  createEffect: () => new EnvmapDonutEffect(),
  debug: {
    title: "Envmap Donut Controls",
    controls: [
      numberControl("bufW", "Buffer Width", ENVMAP_DONUT_DEFAULTS.bufW, { min: 120, max: 320, step: 4 }),
      numberControl("bufH", "Buffer Height", ENVMAP_DONUT_DEFAULTS.bufH, { min: 90, max: 240, step: 4 }),
      numberControl("segmentsU", "Segments U", ENVMAP_DONUT_DEFAULTS.segmentsU, { min: 16, max: 128, step: 1 }),
      numberControl("segmentsV", "Segments V", ENVMAP_DONUT_DEFAULTS.segmentsV, { min: 12, max: 96, step: 1 }),
      numberControl("R", "Major Radius", ENVMAP_DONUT_DEFAULTS.R, { min: 0.6, max: 2.0, step: 0.05 }),
      numberControl("r", "Minor Radius", ENVMAP_DONUT_DEFAULTS.r, { min: 0.25, max: 1.0, step: 0.05 }),
      numberControl("camDist", "Camera Distance", ENVMAP_DONUT_DEFAULTS.camDist, { min: 2.0, max: 5.0, step: 0.1 }),
      numberControl("focalMul", "Focal Multiplier", ENVMAP_DONUT_DEFAULTS.focalMul, { min: 0.6, max: 2.0, step: 0.05 }),
      numberControl("rotXSpeed", "Rotate X", ENVMAP_DONUT_DEFAULTS.rotXSpeed, { min: 0, max: 2.0, step: 0.05 }),
      numberControl("rotYSpeed", "Rotate Y", ENVMAP_DONUT_DEFAULTS.rotYSpeed, { min: 0, max: 2.0, step: 0.05 }),
      numberControl("rotZSpeed", "Rotate Z", ENVMAP_DONUT_DEFAULTS.rotZSpeed, { min: 0, max: 2.0, step: 0.05 }),
      numberControl("fresnelStrength", "Fresnel", ENVMAP_DONUT_DEFAULTS.fresnelStrength, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("specStrength", "Specular", ENVMAP_DONUT_DEFAULTS.specStrength, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("shininess", "Shininess", ENVMAP_DONUT_DEFAULTS.shininess, { min: 2, max: 64, step: 1 }),
      numberControl("chromeDesat", "Chrome Desat", ENVMAP_DONUT_DEFAULTS.chromeDesat, { min: 0, max: 1, step: 0.01 }),
      toggleControl("backfaceCull", "Backface Cull", ENVMAP_DONUT_DEFAULTS.backfaceCull),
      toggleControl("scanlines", "Scanlines", ENVMAP_DONUT_DEFAULTS.scanlines),
      toggleControl("edge", "Edge Overlay", ENVMAP_DONUT_DEFAULTS.edge),
      numberControl("audioReact", "Audio React", ENVMAP_DONUT_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", ENVMAP_DONUT_DEFAULTS.beatKick, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", ENVMAP_DONUT_DEFAULTS.seed, { min: 0, max: 50, step: 1 })
          ]
  },
  docs: {
    parameters: "`bufW`, `bufH`, `segmentsU`, `segmentsV`, `R`, `r`, `camDist`, `focalMul`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `fresnelStrength`, `specStrength`, `shininess`, `chromeDesat`, `backfaceCull`, `scanlines`, `edge`, `audioReact`, `beatKick`, `seed`",
    catalogNote: "Software environment-mapped chrome torus.",
    description: "Software environment-mapped chrome torus."
  }
});

export default envmap_donutManifest;
