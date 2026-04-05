import { MOVING_SHADOW_MAP_DEFAULTS, MovingShadowMapEffect } from "../movingShadowMap";
import { defineEffectManifest, numberControl, selectControl } from "./shared";

export const moving_shadow_mapManifest = defineEffectManifest({
  key: "moving_shadow_map",
  className: "MovingShadowMapEffect",
  sourcePath: "src/renderer/effects/movingShadowMap.ts",
  createEffect: () => new MovingShadowMapEffect(),
  debug: {
    title: "Moving Shadow Map Controls",
    controls: [
      numberControl("seed", "Seed", MOVING_SHADOW_MAP_DEFAULTS.seed, { min: 0, max: 9999, step: 1 }),
      numberControl("objectCount", "Object Count", MOVING_SHADOW_MAP_DEFAULTS.objectCount, { min: 4, max: 8, step: 1 }),
      numberControl("lightCount", "Light Count", MOVING_SHADOW_MAP_DEFAULTS.lightCount, { min: 1, max: 2, step: 1 }),
      numberControl("lightSpeed", "Light Speed", MOVING_SHADOW_MAP_DEFAULTS.lightSpeed, { min: 0.1, max: 3, step: 0.05 }),
      numberControl("lightHeightMin", "Light Height Min", MOVING_SHADOW_MAP_DEFAULTS.lightHeightMin, { min: 0.8, max: 7, step: 0.05 }),
      numberControl("lightHeightMax", "Light Height Max", MOVING_SHADOW_MAP_DEFAULTS.lightHeightMax, { min: 1.2, max: 9, step: 0.05 }),
      numberControl("shadowLength", "Shadow Length", MOVING_SHADOW_MAP_DEFAULTS.shadowLength, { min: 0.4, max: 3, step: 0.05 }),
      numberControl("shadowSoftness", "Shadow Softness", MOVING_SHADOW_MAP_DEFAULTS.shadowSoftness, { min: 0, max: 1, step: 0.05 }),
      numberControl("floorGrid", "Floor Grid", MOVING_SHADOW_MAP_DEFAULTS.floorGrid, { min: 0, max: 1, step: 1 }),
      selectControl("paletteMode", "Palette", MOVING_SHADOW_MAP_DEFAULTS.paletteMode, [
        { label: "Dusk", value: "dusk" },
        { label: "Mono", value: "mono" },
        { label: "Neon", value: "neon" }
      ]),
      numberControl("contrast", "Contrast", MOVING_SHADOW_MAP_DEFAULTS.contrast, { min: 0.6, max: 1.8, step: 0.05 }),
      numberControl("haze", "Haze", MOVING_SHADOW_MAP_DEFAULTS.haze, { min: 0, max: 1, step: 0.05 }),
      numberControl("orbitRadius", "Orbit Radius", MOVING_SHADOW_MAP_DEFAULTS.orbitRadius, { min: 1.8, max: 8, step: 0.05 })
    ]
  },
  docs: {
    parameters:
      "`seed`, `objectCount`, `lightCount`, `lightSpeed`, `lightHeightMin`, `lightHeightMax`, `shadowLength`, `shadowSoftness`, `floorGrid`, `paletteMode`, `contrast`, `haze`, `orbitRadius`, `colorA`, `colorB`, `lightColor`",
    catalogNote: "Canvas2D faux-3D scene with orbiting lights and projected moving shadows.",
    description: "Canvas2D faux-3D scene with orbiting lights and projected moving shadows."
  }
});

export default moving_shadow_mapManifest;
