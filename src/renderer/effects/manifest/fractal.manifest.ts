import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { FractalEffect } from "../fractalEffect";

export const fractalManifest = defineEffectManifest({
  key: "fractal",
  className: "FractalEffect",
  sourcePath: "src/renderer/effects/fractalEffect.ts",
  createEffect: () => new FractalEffect(),
  debug: {
    title: "Fractal Controls",
    controls: [
      numberControl("iterations", "Iterations", 600, { min: 200, max: 1400, step: 50 }),
      numberControl("trebleBoost", "Treble Boost", 400, { min: 0, max: 800, step: 25 }),
      numberControl("speed", "Speed", 1, { min: 0, max: 3, step: 0.05 }),
      numberControl("scale", "Scale", 0.25, { min: 0.1, max: 0.4, step: 0.01 }),
      numberControl("alpha", "Alpha", 0.1, { min: 0.05, max: 0.8, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`iterations`, `trebleBoost`, `speed`, `scale`, `alpha`",
    catalogNote: "",
    description: "Fractal"
  }
});

export default fractalManifest;
