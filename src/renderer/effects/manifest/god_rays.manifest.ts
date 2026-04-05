import { GOD_RAYS_DEFAULTS, GodRaysEffect } from "../godRaysEffect";
import { defineEffectManifest, numberControl, selectControl } from "./shared";

export const god_raysManifest = defineEffectManifest({
  key: "god_rays",
  className: "GodRaysEffect",
  sourcePath: "src/renderer/effects/godRaysEffect.ts",
  createEffect: () => new GodRaysEffect(),
  debug: {
    title: "God Rays Controls",
    controls: [
      numberControl("sourceX", "Source X", GOD_RAYS_DEFAULTS.sourceX, { min: -0.5, max: 1.5, step: 0.01 }),
      numberControl("sourceY", "Source Y", GOD_RAYS_DEFAULTS.sourceY, { min: -0.5, max: 1.2, step: 0.01 }),
      numberControl("rayCount", "Ray Count", GOD_RAYS_DEFAULTS.rayCount, { min: 8, max: 56, step: 1 }),
      numberControl("spread", "Spread", GOD_RAYS_DEFAULTS.spread, { min: 0.1, max: 1, step: 0.01 }),
      numberControl("intensity", "Intensity", GOD_RAYS_DEFAULTS.intensity, { min: 0, max: 3, step: 0.01 }),
      numberControl("haze", "Haze", GOD_RAYS_DEFAULTS.haze, { min: 0, max: 1.2, step: 0.01 }),
      numberControl("occlusion", "Occlusion", GOD_RAYS_DEFAULTS.occlusion, { min: 0, max: 1, step: 0.01 }),
      numberControl("drift", "Drift", GOD_RAYS_DEFAULTS.drift, { min: 0, max: 2, step: 0.01 }),
      numberControl("pulse", "Pulse", GOD_RAYS_DEFAULTS.pulse, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("warmth", "Warmth", GOD_RAYS_DEFAULTS.warmth, { min: 0, max: 1, step: 0.01 }),
      numberControl("dust", "Dust", GOD_RAYS_DEFAULTS.dust, { min: 0, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", GOD_RAYS_DEFAULTS.seed, { min: 0, max: 9999, step: 1 }),
      selectControl("style", "Style", GOD_RAYS_DEFAULTS.style, [
        { label: "Sunbreak", value: "sunbreak" },
        { label: "Window", value: "window" },
        { label: "Cathedral", value: "cathedral" }
      ]),
      numberControl("sourceDriftX", "Source Drift X", GOD_RAYS_DEFAULTS.sourceDriftX, { min: -1, max: 1, step: 0.01 }),
      numberControl("sourceDriftY", "Source Drift Y", GOD_RAYS_DEFAULTS.sourceDriftY, { min: -1, max: 1, step: 0.01 }),
      numberControl("shadowBands", "Shadow Bands", GOD_RAYS_DEFAULTS.shadowBands, { min: 0, max: 1, step: 0.01 })
    ]
  },
  docs: {
    parameters:
      "`sourceX`, `sourceY`, `rayCount`, `spread`, `intensity`, `haze`, `occlusion`, `drift`, `pulse`, `warmth`, `dust`, `seed`, `style`, `sourceDriftX`, `sourceDriftY`, `shadowBands`",
    catalogNote:
      "Atmospheric volumetric-style shafts with drifting haze, procedural occluders, and style variants (`sunbreak`, `window`, `cathedral`).",
    description:
      "Atmospheric volumetric-style shafts with drifting haze, procedural occluders, and style variants (`sunbreak`, `window`, `cathedral`)."
  }
});

export default god_raysManifest;
