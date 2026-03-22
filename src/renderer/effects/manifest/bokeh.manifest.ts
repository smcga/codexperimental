import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { BokehEffect } from "../bokehEffect";

export const bokehManifest = defineEffectManifest({
  key: "bokeh",
  className: "BokehEffect",
  sourcePath: "src/renderer/effects/bokehEffect.ts",
  createEffect: () => new BokehEffect(),
  debug: {
    title: "Bokeh Controls",
    controls: [
      numberControl("count", "Count", 40, { min: 10, max: 120, step: 5 }),
      numberControl("speed", "Speed", 0.7, { min: 0, max: 2, step: 0.05 }),
      numberControl("radius", "Radius", 30, { min: 4, max: 80, step: 1 }),
      numberControl("alpha", "Alpha", 0.15, { min: 0.05, max: 0.8, step: 0.05 }),
      numberControl("hueShift", "Hue Shift", 0, { min: -180, max: 180, step: 5 })
    ]
  },
  docs: {
    parameters: "`count`, `speed`, `radius`, `alpha`, `hueShift`",
    catalogNote: "",
    description: "Bokeh"
  }
});

export default bokehManifest;
