import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { GAME_OF_LIFE_DEFAULTS, GameOfLifeEffect } from "../gameOfLifeEffect";

export const game_of_lifeManifest = defineEffectManifest({
  key: "gameOfLife",
  className: "GameOfLifeEffect",
  sourcePath: "src/renderer/effects/gameOfLifeEffect.ts",
  createEffect: () => new GameOfLifeEffect(),
  debug: {
    title: "Game Of Life Controls",
    controls: [
      numberControl("cellSize", "Cell Size", GAME_OF_LIFE_DEFAULTS.cellSize, { min: 4, max: 24, step: 1 }),
      numberControl("stepRate", "Step Rate", GAME_OF_LIFE_DEFAULTS.stepRate, { min: 1, max: 30, step: 0.5 }),
      numberControl("seed", "Seed", 1337, { min: 0, max: 999999, step: 1 }),
      numberControl("density", "Density", GAME_OF_LIFE_DEFAULTS.density, { min: 0.01, max: 0.9, step: 0.01 }),
      toggleControl("wrap", "Wrap", GAME_OF_LIFE_DEFAULTS.wrap),
      selectControl("paletteMode", "Palette", GAME_OF_LIFE_DEFAULTS.paletteMode, [
        { label: "Mono", value: "mono" },
        { label: "Heat", value: "heat" },
        { label: "Era", value: "era" }
      ]),
      toggleControl("gridLines", "Grid Lines", GAME_OF_LIFE_DEFAULTS.gridLines),
      numberControl("fadeTrails", "Fade Trails", GAME_OF_LIFE_DEFAULTS.fadeTrails, { min: 0, max: 1, step: 0.01 }),
      numberControl("gliderRate", "Glider Rate", GAME_OF_LIFE_DEFAULTS.gliderRate, { min: 0, max: 1, step: 0.01 }),
      selectControl("patternMode", "Pattern Mode", GAME_OF_LIFE_DEFAULTS.patternMode, [
        { label: "Random", value: "random" },
        { label: "Curated", value: "curated" },
        { label: "Mixed", value: "mixed" }
      ]),
      numberControl("burstOnBeat", "Burst On Beat", GAME_OF_LIFE_DEFAULTS.burstOnBeat, { min: 0, max: 1, step: 0.01 }),
      numberControl("survivalTint", "Survival Tint", GAME_OF_LIFE_DEFAULTS.survivalTint, { min: 0, max: 1, step: 0.01 }),
      toggleControl("safeFit", "Safe Fit", GAME_OF_LIFE_DEFAULTS.safeFit)
    ]
  },
  docs: {
    parameters:
      "`cellSize`, `stepRate`, `seed`, `density`, `wrap`, `paletteMode`, `gridLines`, `fadeTrails`, `gliderRate`, `patternMode`, `burstOnBeat`, `survivalTint`, `safeFit`",
    catalogNote:
      "Conway-style cellular automata with deterministic seeding, curated pattern inserts, optional wrap, and restrained beat-triggered bursts/gliders.",
    description:
      "Conway-style cellular automata with deterministic seeding, curated pattern inserts, optional wrap, and restrained beat-triggered bursts/gliders."
  }
});

export default game_of_lifeManifest;
