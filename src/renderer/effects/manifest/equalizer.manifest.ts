import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { EqualizerEffect } from "../equalizerEffect";

export const equalizerManifest = defineEffectManifest({
  key: "equalizer",
  className: "EqualizerEffect",
  sourcePath: "src/renderer/effects/equalizerEffect.ts",
  createEffect: () => new EqualizerEffect(),
  debug: {
    title: "Equalizer Controls",
    controls: [
      numberControl("bars", "Bars", 48, { min: 8, max: 128, step: 1 }),
      numberControl("barWidth", "Bar Width", 0.8, { min: 0.2, max: 1, step: 0.05 }),
      numberControl("height", "Height", 0.8, { min: 0.2, max: 1, step: 0.05 }),
      numberControl("bassBoost", "Bass Boost", 10, { min: 0, max: 60, step: 1 }),
      numberControl("alpha", "Alpha", 0.8, { min: 0.1, max: 1, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`bars`, `barWidth`, `height`, `bassBoost`, `alpha`",
    catalogNote: "",
    description: "Equalizer"
  }
});

export default equalizerManifest;
