import { BillboardForestEffect, BILLBOARD_FOREST_DEFAULTS } from "../billboardForest";
import { defineEffectManifest, numberControl, selectControl } from "./shared";

export const billboard_forestManifest = defineEffectManifest({
  key: "billboard_forest",
  className: "BillboardForestEffect",
  sourcePath: "src/renderer/effects/billboardForest.ts",
  createEffect: () => new BillboardForestEffect(),
  debug: {
    title: "Billboard Forest Controls",
    controls: [
      numberControl("treeCount", "Tree Count", BILLBOARD_FOREST_DEFAULTS.treeCount, { min: 80, max: 520, step: 10 }),
      numberControl("speed", "Speed", BILLBOARD_FOREST_DEFAULTS.speed, { min: 0.1, max: 3, step: 0.05 }),
      numberControl("spread", "Spread", BILLBOARD_FOREST_DEFAULTS.spread, { min: 0.4, max: 1.8, step: 0.05 }),
      numberControl("depth", "Depth", BILLBOARD_FOREST_DEFAULTS.depth, { min: 0.5, max: 2.2, step: 0.05 }),
      numberControl("fog", "Fog", BILLBOARD_FOREST_DEFAULTS.fog, { min: 0, max: 1, step: 0.05 }),
      numberControl("sway", "Sway", BILLBOARD_FOREST_DEFAULTS.sway, { min: 0, max: 1.2, step: 0.05 }),
      numberControl("trunkHeight", "Trunk Height", BILLBOARD_FOREST_DEFAULTS.trunkHeight, { min: 0.65, max: 1.5, step: 0.05 }),
      numberControl("canopySize", "Canopy Size", BILLBOARD_FOREST_DEFAULTS.canopySize, { min: 0.7, max: 1.5, step: 0.05 }),
      selectControl("palette", "Palette", BILLBOARD_FOREST_DEFAULTS.palette, [
        { label: "Day", value: "day" },
        { label: "Dusk", value: "dusk" },
        { label: "Night", value: "night" },
        { label: "Neon", value: "neon" }
      ]),
      numberControl("seed", "Seed", BILLBOARD_FOREST_DEFAULTS.seed, { min: 0, max: 9999, step: 1 }),
      numberControl("layers", "Layers", BILLBOARD_FOREST_DEFAULTS.layers, { min: 1, max: 6, step: 1 }),
      numberControl("groundMist", "Ground Mist", BILLBOARD_FOREST_DEFAULTS.groundMist, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatPulse", "Beat Pulse", BILLBOARD_FOREST_DEFAULTS.beatPulse, { min: 0, max: 1, step: 0.05 }),
      numberControl("tilt", "Tilt", BILLBOARD_FOREST_DEFAULTS.tilt, { min: -0.6, max: 0.6, step: 0.05 }),
      numberControl("parallax", "Parallax", BILLBOARD_FOREST_DEFAULTS.parallax, { min: 0, max: 1, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`treeCount`, `speed`, `spread`, `depth`, `fog`, `sway`, `trunkHeight`, `canopySize`, `palette`, `seed`, `layers`, `groundMist`, `beatPulse`, `tilt`, `parallax`",
    catalogNote: "Canvas2D faux-3D billboard forest flythrough with seeded trees, palette moods, and atmospheric fog.",
    description: "Canvas2D faux-3D billboard forest flythrough with seeded trees, palette moods, and atmospheric fog."
  }
});

export default billboard_forestManifest;
