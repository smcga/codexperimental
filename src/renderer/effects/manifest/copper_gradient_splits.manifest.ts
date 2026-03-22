import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { CopperGradientSplitsEffect } from "../copperGradientSplits";

export const copper_gradient_splitsManifest = defineEffectManifest({
  key: "copper_gradient_splits",
  className: "CopperGradientSplitsEffect",
  sourcePath: "src/renderer/effects/copperGradientSplits.ts",
  createEffect: () => new CopperGradientSplitsEffect(),
  debug: {
    title: "Copper Gradient Splits Controls",
    controls: [
      numberControl("scanStep", "Scan Step", 2, { min: 1, max: 6, step: 1 }),
      numberControl("gradientRowStep", "Gradient Row Step", 16, { min: 4, max: 64, step: 1 }),
      numberControl("barCount", "Bar Count", 10, { min: 4, max: 24, step: 1 }),
      numberControl("speed", "Speed", 0.7, { min: 0, max: 3, step: 0.05 }),
      numberControl("barWobble", "Bar Wobble", 28, { min: 0, max: 80, step: 1 }),
      numberControl("barHueStep", "Bar Hue Step", 22, { min: 0, max: 120, step: 1 }),
      numberControl("hueWobble", "Hue Wobble", 18, { min: 0, max: 120, step: 1 }),
      numberControl("saturation", "Saturation", 0.9, { min: 0, max: 1, step: 0.05 }),
      numberControl("lightnessBase", "Lightness Base", 0.35, { min: 0, max: 1, step: 0.05 }),
      numberControl("lightnessPeak", "Lightness Peak", 0.68, { min: 0, max: 1, step: 0.05 }),
      numberControl("splits", "Splits", 3, { min: 1, max: 6, step: 1 }),
      toggleControl("hamish", "Hamish", true),
      numberControl("hamishStrength", "Hamish Strength", 0.35, { min: 0, max: 1, step: 0.05 }),
      toggleControl("paletteClamp", "Palette Clamp", false),
      numberControl("paletteClampSteps", "Palette Clamp Steps", 32, { min: 2, max: 64, step: 1 }),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("regions", "Regions Override (advanced)", 0)
    ]
  },
  docs: {
    parameters: "`scanStep`, `gradientRowStep`, `barCount`, `speed`, `barWobble`, `barHueStep`, `hueWobble`, `saturation`, `lightnessBase`, `lightnessPeak`, `splits`, `hamish`, `hamishStrength`, `paletteClamp`, `paletteClampSteps`, `audioReact`, `beatKick`",
    catalogNote: "Copper bar gradients with optional pseudo-high-colour splits.",
    description: "Copper bar gradients with optional pseudo-high-colour splits."
  }
});

export default copper_gradient_splitsManifest;
