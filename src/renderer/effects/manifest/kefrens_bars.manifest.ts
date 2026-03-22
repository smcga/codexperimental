import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { KEFRENS_BARS_DEFAULTS, KefrensBarsEffect } from "../kefrensBars";

export const kefrens_barsManifest = defineEffectManifest({
  key: "kefrens_bars",
  className: "KefrensBarsEffect",
  sourcePath: "src/renderer/effects/kefrensBars.ts",
  createEffect: () => new KefrensBarsEffect(),
  debug: {
    title: "Kefrens Bars Controls",
    controls: [
      numberControl("barCount", "Bar Count", KEFRENS_BARS_DEFAULTS.barCount, { min: 1, max: 128, step: 1 }),
      numberControl("barWidth", "Bar Width", KEFRENS_BARS_DEFAULTS.barWidth, { min: 1, max: 160, step: 1 }),
      numberControl("amp", "Amplitude", KEFRENS_BARS_DEFAULTS.amp, { min: 0, max: 480, step: 1 }),
      numberControl("freq", "Frequency", KEFRENS_BARS_DEFAULTS.freq, { min: 0, max: 20, step: 0.1 }),
      numberControl("speed", "Speed", KEFRENS_BARS_DEFAULTS.speed, { min: -10, max: 10, step: 0.05 }),
      numberControl("phaseOffset", "Phase Offset", KEFRENS_BARS_DEFAULTS.phaseOffset, { min: -6.28, max: 6.28, step: 0.01 }),
      selectControl("palette", "Palette", KEFRENS_BARS_DEFAULTS.palette, [
        { label: "Rainbow", value: "rainbow" },
        { label: "Commodore 64", value: "c64" },
        { label: "Amiga", value: "amiga" }
      ])
          ]
  },
  docs: {
    parameters: "`barCount`, `barWidth`, `amp`, `freq`, `speed`, `phaseOffset`, `palette`",
    catalogNote: "`palette` supports `rainbow`, `c64`, or `amiga`.",
    description: "`palette` supports `rainbow`, `c64`, or `amiga`."
  }
});

export default kefrens_barsManifest;
