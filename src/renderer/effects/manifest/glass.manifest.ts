import { GlassEffect } from "../glassEffect";
import { defineEffectManifest, numberControl } from "./shared";

export const glassManifest = defineEffectManifest({
  key: "glass",
  className: "GlassEffect",
  sourcePath: "src/renderer/effects/glassEffect.ts",
  createEffect: () => new GlassEffect(),
  debug: {
    title: "Glass Controls",
    controls: [
      numberControl("paneCount", "Pane Count", 14, { min: 4, max: 36, step: 1 }),
      numberControl("bevel", "Bevel", 0.34, { min: 0, max: 1, step: 0.01 }),
      numberControl("wobble", "Wobble", 0.45, { min: 0, max: 1, step: 0.01 }),
      numberControl("shimmer", "Shimmer", 0.55, { min: 0, max: 1, step: 0.01 }),
      numberControl("frost", "Frost", 0.42, { min: 0, max: 1, step: 0.01 }),
      numberControl("tint", "Tint", 198, { min: 170, max: 230, step: 1 }),
      numberControl("crackle", "Crackle", 0.48, { min: 0, max: 1, step: 0.01 }),
      numberControl("refraction", "Refraction", 0.68, { min: 0, max: 1, step: 0.01 }),
      numberControl("audioReact", "Audio React", 0.35, { min: 0, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 999, step: 1 })
    ]
  },
  docs: {
    parameters: "`paneCount`, `bevel`, `wobble`, `shimmer`, `frost`, `tint`, `crackle`, `refraction`, `audioReact`, `seed`",
    catalogNote: "Layered crystalline panes with frosted bloom, beveled highlights, and hairline crack refractions.",
    description: "Layered crystalline panes with frosted bloom, beveled highlights, and hairline crack refractions."
  }
});

export default glassManifest;
