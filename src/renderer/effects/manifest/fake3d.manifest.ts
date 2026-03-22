import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { Fake3DEffect } from "../fake3dEffect";

export const fake3dManifest = defineEffectManifest({
  key: "fake3d",
  className: "Fake3DEffect",
  sourcePath: "src/renderer/effects/fake3dEffect.ts",
  createEffect: () => new Fake3DEffect(),
  debug: {
    title: "Fake 3D Controls",
    controls: [numberControl("speed", "Speed", 1.0, { min: 0, step: 0.05 })]
  },
  docs: {
    parameters: "`speed`",
    catalogNote: "",
    description: "Fake 3D"
  }
});

export default fake3dManifest;
