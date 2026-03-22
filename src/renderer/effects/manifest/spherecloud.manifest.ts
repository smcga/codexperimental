import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { SphereCloudEffect } from "../sphereCloudEffect";

export const spherecloudManifest = defineEffectManifest({
  key: "spherecloud",
  className: "SphereCloudEffect",
  sourcePath: "src/renderer/effects/sphereCloudEffect.ts",
  createEffect: () => new SphereCloudEffect(),
  debug: {
    title: "Sphere Cloud Controls",
    controls: [numberControl("speed", "Speed", 1.0, { min: 0, step: 0.05 })]
  },
  docs: {
    parameters: "`speed`",
    catalogNote: "",
    description: "Sphere Cloud"
  }
});

export default spherecloudManifest;
