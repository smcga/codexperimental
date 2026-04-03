import { defineEffectManifest, numberControl } from "./shared";
import { MATRIX_RAIN_DEFAULTS, MatrixRainEffect } from "../matrixRainEffect";

export const matrix_rainManifest = defineEffectManifest({
  key: "matrix_rain",
  className: "MatrixRainEffect",
  sourcePath: "src/renderer/effects/matrixRainEffect.ts",
  createEffect: () => new MatrixRainEffect(),
  debug: {
    title: "Matrix Rain Controls",
    controls: [
      numberControl("speed", "Speed", MATRIX_RAIN_DEFAULTS.speed, { min: 0.2, max: 4, step: 0.05 }),
      numberControl("density", "Density", MATRIX_RAIN_DEFAULTS.density, { min: 0.1, max: 1, step: 0.05 }),
      numberControl("fontSize", "Font Size", MATRIX_RAIN_DEFAULTS.fontSize, { min: 8, max: 28, step: 1 }),
      numberControl("trail", "Trail", MATRIX_RAIN_DEFAULTS.trail, { min: 0.2, max: 1, step: 0.05 }),
      numberControl("glow", "Glow", MATRIX_RAIN_DEFAULTS.glow, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("brightness", "Brightness", MATRIX_RAIN_DEFAULTS.brightness, { min: 0.25, max: 1.4, step: 0.05 }),
      numberControl("jitter", "Jitter", MATRIX_RAIN_DEFAULTS.jitter, { min: 0, max: 1, step: 0.05 }),
      numberControl("glyphSet", "Glyph Set", MATRIX_RAIN_DEFAULTS.glyphSet, { min: 0, max: 2, step: 1 }),
      numberControl("seed", "Seed", MATRIX_RAIN_DEFAULTS.seed, { min: 0, max: 9999, step: 1 })
    ]
  },
  docs: {
    parameters: "`speed`, `density`, `fontSize`, `trail`, `glow`, `brightness`, `jitter`, `glyphSet`, `seed`",
    catalogNote: "Matrix-style falling code rain tuned for slower, smoother descent with smaller glyphs and subtle default jitter.",
    description: "Matrix-style falling code rain tuned for slower, smoother descent with smaller glyphs and subtle default jitter."
  }
});

export default matrix_rainManifest;
