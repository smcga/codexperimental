import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { PlasmaEffect } from "../plasmaEffect";

export const plasmaManifest = defineEffectManifest({
  key: "plasma",
  className: "PlasmaEffect",
  sourcePath: "src/renderer/effects/plasmaEffect.ts",
  createEffect: () => new PlasmaEffect(),
  debug: {
    title: "Plasma Controls",
    controls: [numberControl("speed", "Speed", 1.0, { min: 0, step: 0.05 })]
  },
  docs: {
    parameters: "`speed`",
    catalogNote: "",
    description: "Plasma"
  }
});

export default plasmaManifest;
