import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { AmigaShowcaseEffect } from "../amigaShowcase";

export const amiga_showcaseManifest = defineEffectManifest({
  key: "amiga_showcase",
  className: "AmigaShowcaseEffect",
  sourcePath: "src/renderer/effects/amigaShowcase.ts",
  createEffect: () => new AmigaShowcaseEffect(),
  debug: {
    title: "Amiga Showcase Controls",
    controls: [
      numberControl("audioReact", "Audio React", 0.6, { min: 0, max: 1, step: 0.05 }),
      numberControl("barCount", "Bar Count", 4, { min: 1, max: 12, step: 1 }),
      numberControl("barSaturation", "Bar Saturation", 0.85, { min: 0, max: 1, step: 0.05 }),
      numberControl("barSpeed", "Bar Speed", 1.3, { min: 0, max: 4, step: 0.05 }),
      numberControl("barWaveAmp", "Bar Wave Amp", 28, { min: 0, max: 120, step: 1 }),
      numberControl("barWaveFreq", "Bar Wave Freq", 4.5, { min: 0, max: 12, step: 0.1 }),
      numberControl("bobCount", "Bob Count", 9, { min: 1, max: 64, step: 1 }),
      numberControl("bobIntensity", "Bob Intensity", 0.45, { min: 0, max: 1, step: 0.05 }),
      numberControl("bobRadius", "Bob Radius", 42, { min: 1, max: 160, step: 1 }),
      numberControl("bobTrail", "Bob Trail", 0.12, { min: 0, max: 1, step: 0.01 }),
      toggleControl("glenz", "Glenz", true),
      numberControl("twistAmp", "Twist Amp", 1.8, { min: 0, max: 5, step: 0.05 }),
      numberControl("twistHueSpeed", "Twist Hue Speed", 65, { min: 0, max: 180, step: 1 }),
      numberControl("twistSlices", "Twist Slices", 24, { min: 1, max: 96, step: 1 }),
      numberControl("twistSpeed", "Twist Speed", 0.85, { min: 0, max: 4, step: 0.05 }),
      numberControl("twistWidth", "Twist Width", 0.28, { min: 0.05, max: 0.8, step: 0.01 }),
      numberControl("twistX", "Twist X", 0.5, { min: 0, max: 1, step: 0.01 })
    ]
  },
  docs: {
    parameters: "`barCount`, `barSpeed`, `barWaveAmp`, `barWaveFreq`, `barSaturation`, `bobCount`, `bobRadius`, `bobTrail`, `bobIntensity`, `twistWidth`, `twistAmp`, `twistSpeed`, `twistSlices`, `twistHueSpeed`, `twistX`, `glenz`, `audioReact`",
    catalogNote: "",
    description: "Amiga Showcase"
  }
});

export default amiga_showcaseManifest;
