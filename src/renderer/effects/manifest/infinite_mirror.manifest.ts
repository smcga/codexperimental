import { InfiniteMirrorEffect, INFINITE_MIRROR_DEFAULTS } from "../infiniteMirror";
import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";

export const infinite_mirrorManifest = defineEffectManifest({
  key: "infiniteMirror",
  className: "InfiniteMirrorEffect",
  sourcePath: "src/renderer/effects/infiniteMirror.ts",
  createEffect: () => new InfiniteMirrorEffect(),
  debug: {
    title: "Infinite Mirror Controls",
    controls: [
      numberControl("depth", "Depth", INFINITE_MIRROR_DEFAULTS.depth, { min: 1, max: 48, step: 1 }),
      numberControl("scale", "Scale", INFINITE_MIRROR_DEFAULTS.scale, { min: 0.6, max: 0.98, step: 0.01 }),
      numberControl("rotation", "Rotation", INFINITE_MIRROR_DEFAULTS.rotation, { min: -1.5, max: 1.5, step: 0.01 }),
      numberControl("twist", "Twist", INFINITE_MIRROR_DEFAULTS.twist, { min: -0.5, max: 0.5, step: 0.01 }),
      numberControl("offsetX", "Offset X", INFINITE_MIRROR_DEFAULTS.offsetX, { min: -0.5, max: 0.5, step: 0.01 }),
      numberControl("offsetY", "Offset Y", INFINITE_MIRROR_DEFAULTS.offsetY, { min: -0.5, max: 0.5, step: 0.01 }),
      numberControl("pulse", "Pulse", INFINITE_MIRROR_DEFAULTS.pulse, { min: 0, max: 2, step: 0.01 }),
      numberControl("glow", "Glow", INFINITE_MIRROR_DEFAULTS.glow, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("softness", "Softness", INFINITE_MIRROR_DEFAULTS.softness, { min: 0, max: 0.5, step: 0.01 }),
      numberControl("vignette", "Vignette", INFINITE_MIRROR_DEFAULTS.vignette, { min: 0, max: 1, step: 0.01 }),
      numberControl("monochrome", "Monochrome", INFINITE_MIRROR_DEFAULTS.monochrome, { min: 0, max: 1, step: 0.01 }),
      toggleControl("mirrorFrames", "Mirror Frames", true),
      selectControl("baseScene", "Base Scene", INFINITE_MIRROR_DEFAULTS.baseScene, [
        { label: "Grid", value: "grid" },
        { label: "Rings", value: "rings" },
        { label: "Checker", value: "checker" },
        { label: "Bars", value: "bars" },
        { label: "Void", value: "void" }
      ]),
      numberControl("symmetry", "Symmetry", INFINITE_MIRROR_DEFAULTS.symmetry, { min: 0, max: 1, step: 0.01 }),
      numberControl("strobeOnBeat", "Strobe Beat", INFINITE_MIRROR_DEFAULTS.strobeOnBeat, { min: 0, max: 1, step: 0.01 }),
      numberControl("feedbackMix", "Feedback Mix", INFINITE_MIRROR_DEFAULTS.feedbackMix, { min: 0.3, max: 0.98, step: 0.01 })
    ]
  },
  docs: {
    description: "Self-referential portal recursion using a persistent feedback canvas and procedural base scenes.",
    parameters:
      "`depth`, `scale`, `rotation`, `twist`, `offsetX`, `offsetY`, `pulse`, `glow`, `softness`, `vignette`, `monochrome`, `mirrorFrames`, `baseScene`, `symmetry`, `strobeOnBeat`, `feedbackMix`",
    catalogNote: "Deeper recursion and glow increase cost; mobile safety is handled by adaptive effective depth clamping."
  }
});

export default infinite_mirrorManifest;
