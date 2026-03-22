import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { IsoGridEffect } from "../isoGridEffect";

export const isogridManifest = defineEffectManifest({
  key: "isogrid",
  className: "IsoGridEffect",
  sourcePath: "src/renderer/effects/isoGridEffect.ts",
  createEffect: () => new IsoGridEffect(),
  debug: {
    title: "Isogrid Controls",
    controls: [
      numberControl("opacity", "Opacity", 0.2, { min: 0.05, max: 0.8, step: 0.05 }),
      numberControl("lineWidth", "Line Width", 1, { min: 0.5, max: 4, step: 0.1 }),
      numberControl("spacing", "Spacing", 18, { min: 8, max: 40, step: 1 }),
      numberControl("wave", "Wave", 8, { min: 0, max: 20, step: 1 }),
      numberControl("speed", "Speed", 0.8, { min: 0, max: 3, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`opacity`, `lineWidth`, `spacing`, `wave`, `speed`",
    catalogNote: "",
    description: "Isogrid"
  }
});

export default isogridManifest;
