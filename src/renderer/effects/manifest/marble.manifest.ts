import { createMarbleEffect } from "../marbleEffect";
import { defineEffectManifest, numberControl } from "./shared";

export const marbleManifest = defineEffectManifest({
  key: "marble",
  className: "MarbleEffect",
  sourcePath: "src/renderer/effects/marbleEffect.ts",
  createEffect: () => createMarbleEffect(),
  debug: {
    title: "Marble Controls",
    controls: [
      numberControl("scale", "Scale", 3, { min: 0.4, max: 8, step: 0.05 }),
      numberControl("veinScale", "Vein Scale", 2.5, { min: 0.2, max: 8, step: 0.05 }),
      numberControl("contrast", "Contrast", 1.2, { min: 0.2, max: 4, step: 0.05 }),
      numberControl("brightness", "Brightness", 1, { min: 0.2, max: 2.5, step: 0.05 }),
      numberControl("speed", "Speed", 0.15, { min: 0, max: 2, step: 0.01 }),
      numberControl("turbulence", "Turbulence", 0.8, { min: 0, max: 2.5, step: 0.05 }),
      numberControl("layers", "Layers", 4, { min: 1, max: 7, step: 1 })
    ]
  },
  docs: {
    parameters: "`scale`, `veinScale`, `contrast`, `brightness`, `speed`, `turbulence`, `layers`",
    catalogNote: "Audio subtly modulates turbulence, vein scale, and brightness.",
    description: "Animated marble veins using turbulent sine domain warping"
  }
});

export default marbleManifest;
