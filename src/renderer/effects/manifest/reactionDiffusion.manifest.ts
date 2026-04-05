import { defineEffectManifest, numberControl, toggleControl } from "./shared";
import { ReactionDiffusionEffect } from "../reactionDiffusion";

export const reactionDiffusionManifest = defineEffectManifest({
  key: "reactionDiffusion",
  className: "ReactionDiffusionEffect",
  sourcePath: "src/renderer/effects/reactionDiffusion.ts",
  createEffect: () => new ReactionDiffusionEffect(),
  debug: {
    title: "Reaction Diffusion Controls",
    controls: [
      numberControl("scale", "Scale", 1, { min: 0.5, max: 3, step: 0.05 }),
      numberControl("simScale", "Simulation Scale", 0.25, { min: 0.08, max: 0.7, step: 0.01 }),
      numberControl("feed", "Feed", 0.042, { min: 0.01, max: 0.09, step: 0.001 }),
      numberControl("kill", "Kill", 0.06, { min: 0.03, max: 0.09, step: 0.001 }),
      numberControl("diffA", "Diffusion A", 1, { min: 0.2, max: 1.6, step: 0.01 }),
      numberControl("diffB", "Diffusion B", 0.5, { min: 0.1, max: 1.2, step: 0.01 }),
      numberControl("steps", "Substeps", 6, { min: 1, max: 18, step: 1 }),
      numberControl("seed", "Seed", 1, { min: 0, max: 999999, step: 1 }),
      numberControl("contrast", "Contrast", 1.4, { min: 0.4, max: 3.2, step: 0.05 }),
      numberControl("brightness", "Brightness", 1, { min: 0.2, max: 2.5, step: 0.05 }),
      toggleControl("invert", "Invert", false),
      numberControl("paletteMix", "Palette Mix", 0.35, { min: 0, max: 1, step: 0.01 }),
      numberControl("audioReactivity", "Audio Reactivity", 0.2, { min: 0, max: 1, step: 0.01 }),
      numberControl("beatPulse", "Beat Pulse", 0.15, { min: 0, max: 1, step: 0.01 }),
      numberControl("drift", "Drift", 0.05, { min: 0, max: 0.5, step: 0.01 }),
      numberControl("reseedCue", "Reseed Cue", 0, { min: 0, max: 1, step: 1 })
    ]
  },
  docs: {
    parameters:
      "`scale`, `simScale`, `feed`, `kill`, `diffA`, `diffB`, `steps`, `seed`, `contrast`, `brightness`, `invert`, `paletteMix`, `audioReactivity`, `beatPulse`, `drift`, `reseedCue`",
    catalogNote: "Gray–Scott reaction-diffusion field with restrained audio modulation and era-aware output shaping.",
    description: "Reaction Diffusion"
  }
});

export default reactionDiffusionManifest;
