import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { TreeGrowthEffect } from "../treeGrowthEffect";

export const treegrowthManifest = defineEffectManifest({
  key: "treegrowth",
  className: "TreeGrowthEffect",
  sourcePath: "src/renderer/effects/treeGrowthEffect.ts",
  createEffect: () => new TreeGrowthEffect(),
  debug: {
    title: "Tree Growth Controls",
    controls: [
      numberControl("speed", "Speed", 0.18, { min: 0, max: 1, step: 0.01 }),
      numberControl("levels", "Levels", 6, { min: 3, max: 9, step: 1 }),
      numberControl("trunkHeight", "Trunk Height", 0.45, { min: 0.25, max: 0.65, step: 0.01 }),
      numberControl("branchScale", "Branch Scale", 0.72, { min: 0.5, max: 0.85, step: 0.01 }),
      numberControl("branchAngle", "Branch Angle", 28, { min: 10, max: 60, step: 1 }),
      numberControl("trunkWidth", "Trunk Width", 10, { min: 4, max: 24, step: 0.5 }),
      numberControl("sway", "Sway", 0.35, { min: 0, max: 1.2, step: 0.01 }),
      numberControl("leafSize", "Leaf Size", 3, { min: 0, max: 10, step: 0.5 }),
      numberControl("jitter", "Jitter", 0.25, { min: 0, max: 0.6, step: 0.01 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 10, step: 0.1 }),
      numberControl("growth", "Growth Override", 1, { min: 0, max: 1, step: 0.01 })
    ]
  },
  docs: {
    parameters: "`speed`, `levels`, `trunkHeight`, `branchScale`, `branchAngle`, `trunkWidth`, `sway`, `leafSize`, `jitter`, `seed`, `growth`",
    catalogNote: "`growth` overrides the automatic growth cycle (0-1).",
    description: "`growth` overrides the automatic growth cycle (0-1)."
  }
});

export default treegrowthManifest;
