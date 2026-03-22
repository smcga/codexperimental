import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { LissajousEffect } from "../lissajousEffect";

export const lissajousManifest = defineEffectManifest({
  key: "lissajous",
  className: "LissajousEffect",
  sourcePath: "src/renderer/effects/lissajousEffect.ts",
  createEffect: () => new LissajousEffect(),
  debug: {
    title: "Lissajous Controls",
    controls: [
      numberControl("points", "Points", 320, { min: 80, max: 800, step: 10 }),
      numberControl("speed", "Speed", 1, { min: 0, max: 3, step: 0.05 }),
      numberControl("a", "A Frequency", 3, { min: 1, max: 6, step: 0.1 }),
      numberControl("b", "B Frequency", 2, { min: 1, max: 6, step: 0.1 }),
      numberControl("radius", "Radius", 0.35, { min: 0.1, max: 0.5, step: 0.01 }),
      numberControl("lineWidth", "Line Width", 1.5, { min: 0.5, max: 6, step: 0.1 })
    ]
  },
  docs: {
    parameters: "`points`, `speed`, `a`, `b`, `radius`, `lineWidth`",
    catalogNote: "",
    description: "Lissajous"
  }
});

export default lissajousManifest;
