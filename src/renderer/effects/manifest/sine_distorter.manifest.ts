import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { SINE_DISTORTER_DEFAULTS, SineDistorterEffect } from "../sineDistorter";

export const sine_distorterManifest = defineEffectManifest({
  key: "sine_distorter",
  className: "SineDistorterEffect",
  sourcePath: "src/renderer/effects/sineDistorter.ts",
  createEffect: () => new SineDistorterEffect(),
  debug: {
    title: "Sine Distorter Controls",
    controls: [
      selectControl("mode", "Mode", SINE_DISTORTER_DEFAULTS.mode, [
        { label: "Horizontal", value: "horizontal" },
        { label: "Vertical", value: "vertical" },
        { label: "Both", value: "both" }
      ]),
      numberControl("amp", "Amplitude", SINE_DISTORTER_DEFAULTS.amp, { min: 0, max: 80, step: 1 }),
      numberControl("freq", "Frequency", SINE_DISTORTER_DEFAULTS.freq, { min: 0, max: 0.2, step: 0.005 }),
      numberControl("speed", "Speed", SINE_DISTORTER_DEFAULTS.speed, { min: 0, max: 6, step: 0.05 }),
      numberControl("slice", "Slice Size", SINE_DISTORTER_DEFAULTS.slice, { min: 1, max: 8, step: 1 }),
      numberControl("phase", "Phase", SINE_DISTORTER_DEFAULTS.phase, { min: -6.28, max: 6.28, step: 0.05 }),
      numberControl("sourceScale", "Source Scale", SINE_DISTORTER_DEFAULTS.sourceScale, { min: 1, max: 3, step: 0.1 }),
      selectControl("edges", "Edges", SINE_DISTORTER_DEFAULTS.edges, [
        { label: "Wrap", value: "wrap" },
        { label: "Clamp", value: "clamp" }
      ]),
      selectControl("source", "Source", "logo", [
        { label: "Logo", value: "logo" },
        { label: "Scene", value: "scene" }
      ]),
      selectControl("logoText", "Logo Text", SINE_DISTORTER_DEFAULTS.logoText, [
        { label: "DISTORT", value: "DISTORT" },
        { label: "WAVE", value: "WAVE" },
        { label: "GLASS", value: "GLASS" }
      ]),
      numberControl("audioReact", "Audio React", SINE_DISTORTER_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatBoost", "Beat Boost", SINE_DISTORTER_DEFAULTS.beatBoost, { min: 0, max: 1, step: 0.05 }),
      numberControl("glow", "Glow", SINE_DISTORTER_DEFAULTS.glow, { min: 0, max: 0.3, step: 0.01 })
          ]
  },
  docs: {
    parameters: "`mode`, `amp`, `freq`, `speed`, `slice`, `phase`, `sourceScale`, `edges`, `source`, `logoText`, `audioReact`, `beatBoost`, `glow`",
    catalogNote: "Wavy glass distorter (scanline or column sine shifts).",
    description: "Wavy glass distorter (scanline or column sine shifts)."
  }
});

export default sine_distorterManifest;
