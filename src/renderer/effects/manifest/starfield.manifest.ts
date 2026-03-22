import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { StarfieldEffect } from "../starfieldEffect";

export const starfieldManifest = defineEffectManifest({
  key: "starfield",
  className: "StarfieldEffect",
  sourcePath: "src/renderer/effects/starfieldEffect.ts",
  createEffect: () => new StarfieldEffect(),
  debug: {
    title: "Starfield Controls",
    controls: [
      numberControl("speed", "Speed", 1.0, { min: 0, step: 0.05 }),
      numberControl("warp", "Warp", 0.3, { min: 0, max: 1, step: 0.05 }),
      numberControl("turnRate", "Turn Rate", 0.7, { min: 0, step: 0.05 }),
      numberControl("turnStrength", "Turn Strength", 0.35, { min: 0, max: 1, step: 0.05 }),
      numberControl("drift", "Drift", 0.14, { min: 0, max: 1, step: 0.01 }),
      numberControl("sparkle", "Sparkle", 0.55, { min: 0, max: 2, step: 0.05 }),
      numberControl("colorShift", "Color Shift", 0, { min: -1, max: 1, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`speed`, `warp`, `turnRate`, `turnStrength`, `drift`, `sparkle`, `colorShift`",
    catalogNote: "Warp/turn adjust flight feel; drift/sparkle/colorShift add richer motion and chroma variation.",
    description: "Warp/turn adjust flight feel; drift/sparkle/colorShift add richer motion and chroma variation."
  }
});

export default starfieldManifest;
