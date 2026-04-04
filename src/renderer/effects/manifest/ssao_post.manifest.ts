import { SSAO_POST_DEFAULTS, SsaoPostEffect } from "../ssaoPostEffect";
import { defineEffectManifest, numberControl } from "./shared";

export const ssao_postManifest = defineEffectManifest({
  key: "ssao_post",
  className: "SsaoPostEffect",
  sourcePath: "src/renderer/effects/ssaoPostEffect.ts",
  createEffect: () => new SsaoPostEffect(),
  debug: {
    title: "SSAO Post Controls",
    controls: [
      numberControl("radius", "Radius", SSAO_POST_DEFAULTS.radius, { min: 1, max: 20, step: 1 }),
      numberControl("intensity", "Intensity", SSAO_POST_DEFAULTS.intensity, { min: 0, max: 1.2, step: 0.01 }),
      numberControl("bias", "Bias", SSAO_POST_DEFAULTS.bias, { min: -1, max: 1, step: 0.01 }),
      numberControl("samples", "Samples", SSAO_POST_DEFAULTS.samples, { min: 1, max: 8, step: 1 }),
      numberControl("luminanceInfluence", "Luminance Influence", SSAO_POST_DEFAULTS.luminanceInfluence, {
        min: 0,
        max: 1,
        step: 0.01
      }),
      numberControl("edgeBoost", "Edge Boost", SSAO_POST_DEFAULTS.edgeBoost, { min: 0, max: 2, step: 0.01 })
    ]
  },
  docs: {
    parameters: "`radius`, `intensity`, `bias`, `samples`, `luminanceInfluence`, `edgeBoost`",
    catalogNote: "Single-pass SSAO-style post shading with WebGL2 path and Canvas2D fallback.",
    description: "Single-pass SSAO-style post shading with WebGL2 path and Canvas2D fallback."
  }
});

export default ssao_postManifest;
