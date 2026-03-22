import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { EffectEvolution } from "../effectEvolution";

export const effect_evolutionManifest = defineEffectManifest({
  key: "effect_evolution",
  className: "EffectEvolution",
  sourcePath: "src/renderer/effects/effectEvolution.ts",
  createEffect: () => new EffectEvolution(),
  debug: {
    title: "Effect Evolution Controls",
    controls: [
      numberControl("density", "Density", 1, { min: 0.4, max: 2.5, step: 0.05 }),
      numberControl("motion", "Motion", 0.6, { min: 0, max: 1, step: 0.05 }),
      numberControl("warp", "Warp", 0.4, { min: 0, max: 1, step: 0.05 }),
      numberControl("trail", "Trail", 0.15, { min: 0, max: 0.92, step: 0.01 }),
      numberControl("seed", "Seed", 13, { min: 0, max: 9999, step: 1 })
    ]
  },
  docs: {
    parameters: "`density`, `motion`, `warp`, `trail`, `seed`",
    catalogNote: "Reinterprets the same lattice across eras.",
    description: "Reinterprets the same lattice across eras."
  }
});

export default effect_evolutionManifest;
