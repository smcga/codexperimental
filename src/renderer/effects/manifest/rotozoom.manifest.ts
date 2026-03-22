import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { RotozoomEffect } from "../rotozoomEffect";

export const rotozoomManifest = defineEffectManifest({
  key: "rotozoom",
  className: "RotozoomEffect",
  sourcePath: "src/renderer/effects/rotozoomEffect.ts",
  createEffect: () => new RotozoomEffect(),
  debug: {
    title: "Rotozoom Controls",
    controls: [numberControl("speed", "Speed", 1.0, { min: 0, step: 0.05 })]
  },
  docs: {
    parameters: "`speed`",
    catalogNote: "",
    description: "Rotozoom"
  }
});

export default rotozoomManifest;
