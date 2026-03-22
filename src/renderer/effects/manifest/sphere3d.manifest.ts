import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { SphereEffect } from "../sphereEffect";

export const sphere3dManifest = defineEffectManifest({
  key: "sphere3d",
  className: "SphereEffect",
  sourcePath: "src/renderer/effects/sphereEffect.ts",
  createEffect: () => new SphereEffect(),
  debug: {
    title: "Sphere Controls",
    controls: [numberControl("speed", "Speed", 1.0, { min: 0, step: 0.05 })]
  },
  docs: {
    parameters: "`speed`",
    catalogNote: "",
    description: "Sphere"
  }
});

export default sphere3dManifest;
