import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { TETRIS_MATRIX_DEFAULTS, TetrisMatrixEffect } from "../tetrisMatrixEffect";

export const tetris_matrixManifest = defineEffectManifest({
  key: "tetris_matrix",
  className: "TetrisMatrixEffect",
  sourcePath: "src/renderer/effects/tetrisMatrixEffect.ts",
  createEffect: () => new TetrisMatrixEffect(),
  debug: {
    title: "Tetris Matrix Controls",
    controls: [
      numberControl("speed", "Speed", TETRIS_MATRIX_DEFAULTS.speed, { min: 0.35, max: 3, step: 0.05 }),
      numberControl("level", "Level", TETRIS_MATRIX_DEFAULTS.level, { min: 1, max: 20, step: 1 }),
      numberControl("glow", "Glow", TETRIS_MATRIX_DEFAULTS.glow, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("contrast", "Contrast", TETRIS_MATRIX_DEFAULTS.contrast, { min: 0.35, max: 1.3, step: 0.05 }),
      numberControl("ghost", "Ghost", TETRIS_MATRIX_DEFAULTS.ghost, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", TETRIS_MATRIX_DEFAULTS.seed, { min: 0, max: 9999, step: 1 })
    ]
  },
  docs: {
    parameters: "`speed`, `level`, `glow`, `contrast`, `ghost`, `seed`",
    catalogNote: "Self-playing falling-block match with full pentomino sets (all 12 five-cell shapes), a clearer side-panel HUD, top-out game-over restarts, chunky monochrome shading, and a dot-matrix handheld screen vibe.",
    description: "Self-playing falling-block match with full pentomino sets (all 12 five-cell shapes), a clearer side-panel HUD, top-out game-over restarts, chunky monochrome shading, and a dot-matrix handheld screen vibe."
  }
});

export default tetris_matrixManifest;
