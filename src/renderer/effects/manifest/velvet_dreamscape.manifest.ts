import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { VELVET_DREAMSCAPE_DEFAULTS, VelvetDreamscapeEffect } from "../velvetDreamscapeEffect";

export const velvet_dreamscapeManifest = defineEffectManifest({
  key: "velvet_dreamscape",
  className: "VelvetDreamscapeEffect",
  sourcePath: "src/renderer/effects/velvetDreamscapeEffect.ts",
  createEffect: () => new VelvetDreamscapeEffect(),
  debug: {
    title: "Velvet Dreamscape Controls",
    controls: [
      numberControl("bloom", "Bloom", VELVET_DREAMSCAPE_DEFAULTS.bloom, { min: 0, max: 1.6, step: 0.05 }),
      numberControl("flow", "Flow", VELVET_DREAMSCAPE_DEFAULTS.flow, { min: 0, max: 1.8, step: 0.05 }),
      numberControl("ribbonCount", "Ribbon Count", VELVET_DREAMSCAPE_DEFAULTS.ribbonCount, { min: 4, max: 24, step: 1 }),
      numberControl("grain", "Grain", VELVET_DREAMSCAPE_DEFAULTS.grain, { min: 0, max: 1, step: 0.05 }),
      numberControl("hueDrift", "Hue Drift", VELVET_DREAMSCAPE_DEFAULTS.hueDrift, { min: -1, max: 1, step: 0.05 }),
      numberControl("focus", "Focus", VELVET_DREAMSCAPE_DEFAULTS.focus, { min: 0, max: 1.2, step: 0.05 }),
      numberControl("audioReact", "Audio React", VELVET_DREAMSCAPE_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", VELVET_DREAMSCAPE_DEFAULTS.seed, { min: 0, max: 9999, step: 1 })
    ]
  },
  docs: {
    parameters: "`bloom`, `flow`, `ribbonCount`, `grain`, `hueDrift`, `focus`, `audioReact`, `seed`",
    catalogNote: "Layered silk ribbons, luminous blooms, and gallery grain for a tasteful AI-art statement shot.",
    description: "Layered silk ribbons, luminous blooms, and gallery grain for a tasteful AI-art statement shot."
  }
});

export default velvet_dreamscapeManifest;
