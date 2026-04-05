import { defineEffectManifest, numberControl, selectControl } from "./shared";
import { TILING_MORPH_DEFAULTS, TilingMorphEffect } from "../tilingMorph";

export const tilingMorphManifest = defineEffectManifest({
  key: "tilingMorph",
  className: "TilingMorphEffect",
  sourcePath: "src/renderer/effects/tilingMorph.ts",
  createEffect: () => new TilingMorphEffect(),
  debug: {
    title: "Tiling Morph Controls",
    controls: [
      numberControl("scale", "Scale", TILING_MORPH_DEFAULTS.scale, { min: 0.35, max: 3, step: 0.01 }),
      numberControl("morphSpeed", "Morph Speed", TILING_MORPH_DEFAULTS.morphSpeed, { min: 0.1, max: 4, step: 0.01 }),
      numberControl("morphAmount", "Morph Amount", TILING_MORPH_DEFAULTS.morphAmount, { min: 0, max: 1, step: 0.01 }),
      numberControl("rotationSpeed", "Rotation Speed", TILING_MORPH_DEFAULTS.rotationSpeed, { min: -1, max: 1, step: 0.01 }),
      numberControl("lineWidth", "Line Width", TILING_MORPH_DEFAULTS.lineWidth, { min: 0.25, max: 8, step: 0.05 }),
      numberControl("fillAlpha", "Fill Alpha", TILING_MORPH_DEFAULTS.fillAlpha, { min: 0, max: 1, step: 0.01 }),
      numberControl("paletteShift", "Palette Shift", TILING_MORPH_DEFAULTS.paletteShift, { min: -2, max: 2, step: 0.01 }),
      numberControl("audioReactive", "Audio Reactive", TILING_MORPH_DEFAULTS.audioReactive, { min: 0, max: 1, step: 0.01 }),
      numberControl("cellJitter", "Cell Jitter", TILING_MORPH_DEFAULTS.cellJitter, { min: 0, max: 0.45, step: 0.01 }),
      numberControl("roundedness", "Roundedness", TILING_MORPH_DEFAULTS.roundedness, { min: 0, max: 1, step: 0.01 }),
      numberControl("contrast", "Contrast", TILING_MORPH_DEFAULTS.contrast, { min: 0.5, max: 2.5, step: 0.01 }),
      numberControl("seed", "Seed", TILING_MORPH_DEFAULTS.seed, { min: 0, max: 9999, step: 1 }),
      numberControl("backgroundAlpha", "Background Alpha", TILING_MORPH_DEFAULTS.backgroundAlpha, { min: 0, max: 1, step: 0.01 }),
      selectControl("mode", "Mode", TILING_MORPH_DEFAULTS.mode, [
        { label: "Palette", value: "palette" },
        { label: "Mono", value: "mono" },
        { label: "Neon", value: "neon" }
      ])
    ]
  },
  docs: {
    parameters:
      "`scale`, `morphSpeed`, `morphAmount`, `rotationSpeed`, `lineWidth`, `fillAlpha`, `paletteShift`, `audioReactive`, `cellJitter`, `roundedness`, `contrast`, `seed`, `backgroundAlpha`, `mode`",
    catalogNote:
      "Seam-safe lattice tiling morph that cycles square, diamond, skewed, and rounded-interlocking phases; `mode` supports `mono`, `palette`, `neon`.",
    description:
      "Seam-safe lattice tiling morph that cycles square, diamond, skewed, and rounded-interlocking phases; `mode` supports `mono`, `palette`, `neon`."
  }
});

export default tilingMorphManifest;
