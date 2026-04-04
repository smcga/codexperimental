import { HeatHazeEffect } from "../heatHaze";
import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";

export const heat_hazeManifest = defineEffectManifest({
  key: "heat_haze",
  className: "HeatHazeEffect",
  sourcePath: "src/renderer/effects/heatHaze.ts",
  createEffect: () => new HeatHazeEffect(),
  debug: {
    title: "Heat Haze Controls",
    controls: [
      numberControl("intensity", "Intensity", 0.8, { min: 0, max: 2, step: 0.01 }),
      numberControl("speed", "Speed", 1, { min: 0, max: 3, step: 0.01 }),
      numberControl("scale", "Scale", 1, { min: 0.35, max: 3, step: 0.01 }),
      numberControl("drift", "Drift", 1, { min: 0, max: 2, step: 0.01 }),
      selectControl("region", "Region", "bottom", [
        { label: "Bottom", value: "bottom" },
        { label: "Band", value: "band" },
        { label: "Full", value: "full" }
      ]),
      numberControl("centerY", "Center Y", 0.75, { min: 0, max: 1, step: 0.01 }),
      numberControl("height", "Height", 0.35, { min: 0.05, max: 1, step: 0.01 }),
      numberControl("feather", "Feather", 0.2, { min: 0.01, max: 0.5, step: 0.01 }),
      numberControl("shimmer", "Shimmer", 0.6, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("blurHint", "Blur Hint", 0.15, { min: 0, max: 0.6, step: 0.01 }),
      numberControl("tint", "Tint", 0.08, { min: 0, max: 0.4, step: 0.01 }),
      toggleControl("audioReactive", "Audio Reactive", true),
      numberControl("beatBoost", "Beat Boost", 0.35, { min: 0, max: 1.2, step: 0.01 }),
      numberControl("bassInfluence", "Bass Influence", 0.25, { min: 0, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", 1, { min: 0, max: 999, step: 1 })
    ]
  },
  docs: {
    parameters:
      "`intensity`, `speed`, `scale`, `drift`, `region`, `centerY`, `height`, `feather`, `shimmer`, `blurHint`, `tint`, `audioReactive`, `beatBoost`, `bassInfluence`, `seed`",
    catalogNote:
      "Localized refractive hot-air shimmer using strip displacement with upward drift, turbulent micro-jitter, and optional warm glow.",
    description:
      "Localized refractive hot-air shimmer using strip displacement with upward drift, turbulent micro-jitter, and optional warm glow."
  }
});

export default heat_hazeManifest;
