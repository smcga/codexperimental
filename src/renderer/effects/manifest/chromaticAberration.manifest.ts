import { CHROMATIC_ABERRATION_DEFAULTS, ChromaticAberrationEffect } from "../chromaticAberration";
import { defineEffectManifest, numberControl, selectControl } from "./shared";

export const chromaticAberrationManifest = defineEffectManifest({
  key: "chromaticAberration",
  className: "ChromaticAberrationEffect",
  sourcePath: "src/renderer/effects/chromaticAberration.ts",
  createEffect: () => new ChromaticAberrationEffect(),
  debugPreview: "layer",
  debug: {
    title: "Chromatic Aberration Controls",
    controls: [
      numberControl("strength", "Strength", CHROMATIC_ABERRATION_DEFAULTS.strength, { min: 0, max: 0.05, step: 0.001 }),
      numberControl("falloff", "Falloff", CHROMATIC_ABERRATION_DEFAULTS.falloff, { min: 0.2, max: 4, step: 0.1 }),
      numberControl("angle", "Angle", CHROMATIC_ABERRATION_DEFAULTS.angle, { min: -3.14, max: 3.14, step: 0.01 }),
      numberControl("centerX", "Center X", CHROMATIC_ABERRATION_DEFAULTS.centerX, { min: 0, max: 1, step: 0.01 }),
      numberControl("centerY", "Center Y", CHROMATIC_ABERRATION_DEFAULTS.centerY, { min: 0, max: 1, step: 0.01 }),
      numberControl("sampleStep", "Sample Step", CHROMATIC_ABERRATION_DEFAULTS.sampleStep, { min: 1, max: 6, step: 1 }),
      numberControl("alpha", "Alpha", CHROMATIC_ABERRATION_DEFAULTS.alpha, { min: 0, max: 1, step: 0.01 }),
      numberControl("animate", "Animate", CHROMATIC_ABERRATION_DEFAULTS.animate, { min: 0, max: 4, step: 0.05 }),
      numberControl("edgeBoost", "Edge Boost", CHROMATIC_ABERRATION_DEFAULTS.edgeBoost, { min: 0, max: 3, step: 0.05 }),
      selectControl("mode", "Mode", CHROMATIC_ABERRATION_DEFAULTS.mode, [
        { label: "RGB", value: "rgb" },
        { label: "RG", value: "rg" },
        { label: "RB", value: "rb" },
        { label: "GB", value: "gb" }
      ])
    ]
  },
  docs: {
    parameters: "`strength`, `falloff`, `angle`, `centerX`, `centerY`, `sampleStep`, `alpha`, `animate`, `edgeBoost`, `mode`",
    catalogNote: "Screen-space channel offset effect for subtle lens fringing or stylized glitch looks.",
    description: "Post-process RGB channel separation that grows from center to edges."
  },
  defaults: () => ({ ...CHROMATIC_ABERRATION_DEFAULTS })
});

export default chromaticAberrationManifest;
