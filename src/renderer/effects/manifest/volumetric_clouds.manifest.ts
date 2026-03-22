import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { VOLUMETRIC_CLOUDS_DEFAULTS, VolumetricCloudsEffect } from "../volumetricCloudsEffect";

export const volumetric_cloudsManifest = defineEffectManifest({
  key: "volumetric_clouds",
  className: "VolumetricCloudsEffect",
  sourcePath: "src/renderer/effects/volumetricCloudsEffect.ts",
  createEffect: () => new VolumetricCloudsEffect(),
  debug: {
    title: "Volumetric Clouds Controls",
    controls: [
      numberControl("density", "Density", VOLUMETRIC_CLOUDS_DEFAULTS.density, { min: 0.15, max: 1, step: 0.01 }),
      numberControl("layers", "Layers", VOLUMETRIC_CLOUDS_DEFAULTS.layers, { min: 2, max: 8, step: 1 }),
      numberControl("windSpeed", "Wind Speed", VOLUMETRIC_CLOUDS_DEFAULTS.windSpeed, { min: -2, max: 2, step: 0.05 }),
      numberControl("cloudScale", "Cloud Scale", VOLUMETRIC_CLOUDS_DEFAULTS.cloudScale, { min: 0.4, max: 2.5, step: 0.05 }),
      numberControl("detail", "Detail", VOLUMETRIC_CLOUDS_DEFAULTS.detail, { min: 0.1, max: 1, step: 0.05 }),
      numberControl("sunlight", "Sunlight", VOLUMETRIC_CLOUDS_DEFAULTS.sunlight, { min: 0, max: 1, step: 0.05 }),
      numberControl("haze", "Haze", VOLUMETRIC_CLOUDS_DEFAULTS.haze, { min: 0, max: 0.8, step: 0.01 }),
      numberControl("audioReact", "Audio React", VOLUMETRIC_CLOUDS_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`density`, `layers`, `windSpeed`, `cloudScale`, `detail`, `sunlight`, `haze`, `audioReact`",
    catalogNote: "Layered procedural cloudscape with parallax and soft haze.",
    description: "Layered procedural cloudscape with parallax and soft haze."
  }
});

export default volumetric_cloudsManifest;
