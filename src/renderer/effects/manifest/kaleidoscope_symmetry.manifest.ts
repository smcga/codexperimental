import { KaleidoscopeSymmetryEffect, KALEIDOSCOPE_SYMMETRY_DEFAULTS } from "../kaleidoscopeSymmetry";
import { defineEffectManifest, numberControl, toggleControl } from "./shared";

export const kaleidoscope_symmetryManifest = defineEffectManifest({
  key: "kaleidoscope_symmetry",
  className: "KaleidoscopeSymmetryEffect",
  sourcePath: "src/renderer/effects/kaleidoscopeSymmetry.ts",
  createEffect: () => new KaleidoscopeSymmetryEffect(),
  debug: {
    title: "Kaleidoscope Symmetry Controls",
    controls: [
      numberControl("slices", "Slices", KALEIDOSCOPE_SYMMETRY_DEFAULTS.slices, { min: 3, max: 24, step: 1 }),
      numberControl("rotationSpeed", "Rotation Speed", KALEIDOSCOPE_SYMMETRY_DEFAULTS.rotationSpeed, { min: -1, max: 1, step: 0.01 }),
      numberControl("radialZoom", "Radial Zoom", KALEIDOSCOPE_SYMMETRY_DEFAULTS.radialZoom, { min: 0.45, max: 2.8, step: 0.01 }),
      toggleControl("mirror", "Mirror", true),
      numberControl("patternScale", "Pattern Scale", KALEIDOSCOPE_SYMMETRY_DEFAULTS.patternScale, { min: 0.35, max: 3, step: 0.01 }),
      numberControl("patternWarp", "Pattern Warp", KALEIDOSCOPE_SYMMETRY_DEFAULTS.patternWarp, { min: 0, max: 1.6, step: 0.01 }),
      numberControl("centreX", "Centre X", KALEIDOSCOPE_SYMMETRY_DEFAULTS.centreX, { min: 0, max: 1, step: 0.01 }),
      numberControl("centreY", "Centre Y", KALEIDOSCOPE_SYMMETRY_DEFAULTS.centreY, { min: 0, max: 1, step: 0.01 }),
      numberControl("colorShift", "Color Shift", KALEIDOSCOPE_SYMMETRY_DEFAULTS.colorShift, { min: 0, max: 1, step: 0.01 }),
      numberControl("glow", "Glow", KALEIDOSCOPE_SYMMETRY_DEFAULTS.glow, { min: 0, max: 1, step: 0.01 }),
      numberControl("audioReactive", "Audio Reactive", KALEIDOSCOPE_SYMMETRY_DEFAULTS.audioReactive, { min: 0, max: 1, step: 0.01 }),
      numberControl("bassInfluence", "Bass Influence", KALEIDOSCOPE_SYMMETRY_DEFAULTS.bassInfluence, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("trebleInfluence", "Treble Influence", KALEIDOSCOPE_SYMMETRY_DEFAULTS.trebleInfluence, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("spinOnBeat", "Spin On Beat", KALEIDOSCOPE_SYMMETRY_DEFAULTS.spinOnBeat, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("ringDensity", "Ring Density", KALEIDOSCOPE_SYMMETRY_DEFAULTS.ringDensity, { min: 0.2, max: 1.2, step: 0.01 })
    ]
  },
  docs: {
    parameters:
      "`slices`, `rotationSpeed`, `radialZoom`, `mirror`, `patternScale`, `patternWarp`, `centreX`, `centreY`, `colorShift`, `glow`, `audioReactive`, `bassInfluence`, `trebleInfluence`, `spinOnBeat`, `ringDensity`",
    catalogNote: "Radial kaleidoscope wedges with mirrored folding and procedural source animation.",
    description: "Kaleidoscope Symmetry"
  }
});

export default kaleidoscope_symmetryManifest;
