import { defineEffectManifest, numberControl } from "./shared";
import { TreeGrowthEffect } from "../treeGrowthEffect";

export const treegrowthManifest = defineEffectManifest({
  key: "treegrowth",
  className: "TreeGrowthEffect",
  sourcePath: "src/renderer/effects/treeGrowthEffect.ts",
  createEffect: () => new TreeGrowthEffect(),
  debug: {
    title: "Tree Growth Controls",
    controls: [
      numberControl("speed", "Speed", 0.12, { min: 0, max: 1, step: 0.01 }),
      numberControl("levels", "Levels", 8, { min: 4, max: 10, step: 1 }),
      numberControl("trunkHeight", "Trunk Height", 0.52, { min: 0.25, max: 0.72, step: 0.01 }),
      numberControl("branchScale", "Branch Scale", 0.69, { min: 0.45, max: 0.86, step: 0.01 }),
      numberControl("branchAngle", "Branch Angle", 23, { min: 8, max: 55, step: 1 }),
      numberControl("trunkWidth", "Trunk Width", 8, { min: 2, max: 24, step: 0.5 }),
      numberControl("sway", "Sway", 0.22, { min: 0, max: 1.2, step: 0.01 }),
      numberControl("leafSize", "Leaf Size", 2.2, { min: 0, max: 10, step: 0.1 }),
      numberControl("jitter", "Jitter", 0.16, { min: 0, max: 0.65, step: 0.01 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 10, step: 0.1 }),
      numberControl("growth", "Growth Override (-1 = auto)", -1, { min: -1, max: 1, step: 0.01 })
    ]
  },
  docs: {
    parameters: "`speed`, `levels`, `trunkHeight`, `branchScale`, `branchAngle`, `trunkWidth`, `sway`, `leafSize`, `jitter`, `seed`, `growth`",
    catalogNote: "Tree structure grows continuously across years while foliage cycles by season; set `growth` to `-1` for auto or `0-1` to override.",
    description: "Tree structure grows continuously across years while foliage cycles by season; set `growth` to `-1` for auto or `0-1` to override."
  }
});

export default treegrowthManifest;
