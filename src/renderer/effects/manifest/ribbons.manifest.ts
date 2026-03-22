import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { RibbonEffect } from "../ribbonEffect";

export const ribbonsManifest = defineEffectManifest({
  key: "ribbons",
  className: "RibbonEffect",
  sourcePath: "src/renderer/effects/ribbonEffect.ts",
  createEffect: () => new RibbonEffect(),
  debug: {
    title: "Ribbon Controls",
    controls: [
      numberControl("count", "Count", 5, { min: 1, max: 12, step: 1 }),
      numberControl("speed", "Speed", 0.8, { min: 0, step: 0.05 }),
      numberControl("amplitude", "Amplitude", 0.15, { min: 0.05, max: 0.4, step: 0.01 }),
      numberControl("audioBoost", "Audio Boost", 0.2, { min: 0, max: 0.5, step: 0.01 }),
      numberControl("offset", "Offset", 0.3, { min: 0, max: 0.8, step: 0.01 }),
      numberControl("spacing", "Spacing", 0.08, { min: 0, max: 0.3, step: 0.01 }),
      numberControl("thickness", "Thickness", 2, { min: 0.5, max: 6, step: 0.1 })
    ]
  },
  docs: {
    parameters: "`count`, `speed`, `amplitude`, `audioBoost`, `offset`, `spacing`, `thickness`",
    catalogNote: "",
    description: "Ribbon"
  }
});

export default ribbonsManifest;
