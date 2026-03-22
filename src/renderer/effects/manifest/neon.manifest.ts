import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { NeonShapesEffect } from "../neonShapesEffect";

export const neonManifest = defineEffectManifest({
  key: "neon",
  className: "NeonShapesEffect",
  sourcePath: "src/renderer/effects/neonShapesEffect.ts",
  createEffect: () => new NeonShapesEffect(),
  debug: {
    title: "Neon Controls",
    controls: [
      numberControl("shapes", "Shapes", 4, { min: 1, max: 8, step: 1 }),
      numberControl("radius", "Radius", 30, { min: 10, max: 80, step: 1 }),
      numberControl("radiusStep", "Radius Step", 24, { min: 5, max: 60, step: 1 }),
      numberControl("speed", "Speed", 0.6, { min: 0, max: 2, step: 0.05 }),
      numberControl("glow", "Glow", 18, { min: 4, max: 40, step: 1 }),
      numberControl("lineWidth", "Line Width", 2, { min: 0.5, max: 6, step: 0.1 })
    ]
  },
  docs: {
    parameters: "`shapes`, `radius`, `radiusStep`, `speed`, `glow`, `lineWidth`",
    catalogNote: "",
    description: "Neon"
  }
});

export default neonManifest;
