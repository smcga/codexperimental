import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { Proper3DEffect } from "../proper3dEffect";

export const proper3dManifest = defineEffectManifest({
  key: "proper3d",
  className: "Proper3DEffect",
  sourcePath: "src/renderer/effects/proper3dEffect.ts",
  createEffect: () => new Proper3DEffect(),
  debug: {
    title: "Proper 3D Controls",
    controls: [numberControl("speed", "Speed", 1.0, { min: 0, step: 0.05 })]
  },
  docs: {
    parameters: "`speed`",
    catalogNote: "",
    description: "Proper 3D"
  }
});

export default proper3dManifest;
