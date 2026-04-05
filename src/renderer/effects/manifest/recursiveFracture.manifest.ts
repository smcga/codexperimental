import { defineEffectManifest, numberControl, selectControl } from "./shared";
import { RECURSIVE_FRACTURE_DEFAULTS, RecursiveFractureEffect } from "../recursiveFracture";

export const recursiveFractureManifest = defineEffectManifest({
  key: "recursiveFracture",
  className: "RecursiveFractureEffect",
  sourcePath: "src/renderer/effects/recursiveFracture.ts",
  createEffect: () => new RecursiveFractureEffect(),
  debug: {
    title: "Recursive Fracture Controls",
    controls: [
      numberControl("seed", "Seed", RECURSIVE_FRACTURE_DEFAULTS.seed, { min: 0, max: 9999, step: 1 }),
      numberControl("shapeCount", "Shape Count", RECURSIVE_FRACTURE_DEFAULTS.shapeCount, { min: 1, max: 6, step: 1 }),
      numberControl("maxDepth", "Max Depth", RECURSIVE_FRACTURE_DEFAULTS.maxDepth, { min: 1, max: 8, step: 1 }),
      numberControl("splitBias", "Split Bias", RECURSIVE_FRACTURE_DEFAULTS.splitBias, { min: 0, max: 1, step: 0.01 }),
      numberControl("angleJitter", "Angle Jitter", RECURSIVE_FRACTURE_DEFAULTS.angleJitter, { min: 0, max: 1, step: 0.01 }),
      numberControl("gap", "Gap", RECURSIVE_FRACTURE_DEFAULTS.gap, { min: 0, max: 8, step: 0.1 }),
      numberControl("strokeWidth", "Stroke Width", RECURSIVE_FRACTURE_DEFAULTS.strokeWidth, { min: 0.2, max: 4, step: 0.05 }),
      numberControl("fillAlpha", "Fill Alpha", RECURSIVE_FRACTURE_DEFAULTS.fillAlpha, { min: 0, max: 1, step: 0.01 }),
      numberControl("lineAlpha", "Line Alpha", RECURSIVE_FRACTURE_DEFAULTS.lineAlpha, { min: 0, max: 1, step: 0.01 }),
      numberControl("progressSpeed", "Progress Speed", RECURSIVE_FRACTURE_DEFAULTS.progressSpeed, { min: 0.01, max: 0.8, step: 0.01 }),
      selectControl("progressMode", "Progress Mode", RECURSIVE_FRACTURE_DEFAULTS.progressMode, [
        { label: "Outward", value: "outward" },
        { label: "Inward", value: "inward" }
      ]),
      numberControl("beatPunch", "Beat Punch", RECURSIVE_FRACTURE_DEFAULTS.beatPunch, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("bassInfluence", "Bass Influence", RECURSIVE_FRACTURE_DEFAULTS.bassInfluence, { min: 0, max: 1, step: 0.01 }),
      numberControl("trebleDetail", "Treble Detail", RECURSIVE_FRACTURE_DEFAULTS.trebleDetail, { min: 0, max: 1, step: 0.01 }),
      selectControl("paletteMode", "Palette", RECURSIVE_FRACTURE_DEFAULTS.paletteMode, [
        { label: "Heat", value: "heat" },
        { label: "Era", value: "era" },
        { label: "Mono", value: "mono" }
      ]),
      numberControl("minFragmentSize", "Min Fragment", RECURSIVE_FRACTURE_DEFAULTS.minFragmentSize, { min: 8, max: 80, step: 1 })
    ]
  },
  docs: {
    parameters:
      "`seed`, `shapeCount`, `maxDepth`, `splitBias`, `angleJitter`, `gap`, `strokeWidth`, `fillAlpha`, `lineAlpha`, `progressSpeed`, `progressMode`, `beatPunch`, `bassInfluence`, `trebleDetail`, `paletteMode`, `minFragmentSize`",
    catalogNote:
      "Deterministic recursive subdivision panes; `progressMode` supports `outward`/`inward`, and `paletteMode` supports `mono`, `era`, or `heat`.",
    description:
      "Deterministic recursive subdivision panes; `progressMode` supports `outward`/`inward`, and `paletteMode` supports `mono`, `era`, or `heat`."
  }
});

export default recursiveFractureManifest;
