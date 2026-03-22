import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { PortraitGlowEffect } from "../portraitGlowEffect";

export const portraitManifest = defineEffectManifest({
  key: "portrait",
  className: "PortraitGlowEffect",
  sourcePath: "src/renderer/effects/portraitGlowEffect.ts",
  createEffect: () => new PortraitGlowEffect(),
  debug: {
    title: "Portrait Controls",
    controls: [
      numberControl("zoom", "Zoom", 1.05, { min: 0.5, step: 0.01 }),
      numberControl("drift", "Drift", 1.0, { min: 0, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`zoom`, `drift`",
    catalogNote: "",
    description: "Portrait"
  }
});

export default portraitManifest;
