import { CausticsEffect } from "../causticsEffect";
import { defineEffectManifest, numberControl } from "./shared";

export const causticsManifest = defineEffectManifest({
  key: "caustics",
  className: "CausticsEffect",
  sourcePath: "src/renderer/effects/causticsEffect.ts",
  createEffect: () => new CausticsEffect(),
  debug: {
    title: "Caustics Controls",
    controls: [
      numberControl("scale", "Scale", 1, { min: 0.35, max: 3, step: 0.01 }),
      numberControl("speed", "Speed", 1, { min: 0, max: 3, step: 0.01 }),
      numberControl("intensity", "Intensity", 1, { min: 0, max: 3, step: 0.01 }),
      numberControl("contrast", "Contrast", 1, { min: 0.2, max: 3, step: 0.01 }),
      numberControl("warp", "Warp", 0.45, { min: 0, max: 2, step: 0.01 }),
      numberControl("detail", "Detail", 0.55, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("background", "Background", 0.08, { min: 0, max: 1, step: 0.01 }),
      numberControl("glow", "Glow", 0.42, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("seed", "Seed", 1, { min: 0, max: 9999, step: 1 }),
      numberControl("audioReactive", "Audio Reactive", 0.35, { min: 0, max: 1, step: 0.01 }),
      numberControl("driftX", "Drift X", 0.015, { min: -1, max: 1, step: 0.001 }),
      numberControl("driftY", "Drift Y", 0.01, { min: -1, max: 1, step: 0.001 })
    ]
  },
  docs: {
    parameters:
      "`scale`, `speed`, `intensity`, `contrast`, `warp`, `detail`, `background`, `color`, `glow`, `seed`, `audioReactive`, `driftX`, `driftY`",
    catalogNote: "Animated refractive caustic web with converging bright filaments and soft glow bloom.",
    description:
      "Procedural water/glass caustics rendered on a low-resolution buffer with warped intersecting ridges, evolving bright convergence patches, and optional bloom glow."
  }
});

export default causticsManifest;
