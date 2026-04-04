import { defineEffectManifest, numberControl } from "./shared";
import { UV_UNWRAP_DEFAULTS, UvUnwrapEffect } from "../uvUnwrapEffect";

export const uv_unwrapManifest = defineEffectManifest({
  key: "uv_unwrap",
  className: "UvUnwrapEffect",
  sourcePath: "src/renderer/effects/uvUnwrapEffect.ts",
  createEffect: () => new UvUnwrapEffect(),
  debug: {
    title: "UV Unwrap Controls",
    controls: [
      numberControl("unwrap", "Unwrap", UV_UNWRAP_DEFAULTS.unwrap, { min: 0, max: 1, step: 0.01 }),
      numberControl("uvScale", "UV Scale", UV_UNWRAP_DEFAULTS.uvScale, { min: 1, max: 3.5, step: 0.01 }),
      numberControl("cameraDist", "Camera Distance", UV_UNWRAP_DEFAULTS.cameraDist, { min: 2.2, max: 6, step: 0.01 }),
      numberControl("rotationSpeed", "Rotation Speed", UV_UNWRAP_DEFAULTS.rotationSpeed, { min: -2, max: 2, step: 0.01 }),
      numberControl("edgeStrength", "Edge Strength", UV_UNWRAP_DEFAULTS.edgeStrength, { min: 0.2, max: 2.5, step: 0.01 }),
      numberControl("explode", "Explode", UV_UNWRAP_DEFAULTS.explode, { min: 0, max: 1, step: 0.01 })
    ]
  },
  docs: {
    parameters: "`unwrap`, `uvScale`, `cameraDist`, `rotationSpeed`, `edgeStrength`, `explode`",
    catalogNote: "Faux-3D cube that morphs into a UV cross layout with seam-forward edge rendering.",
    description: "Faux-3D cube that morphs into a UV cross layout with seam-forward edge rendering."
  }
});

export default uv_unwrapManifest;
