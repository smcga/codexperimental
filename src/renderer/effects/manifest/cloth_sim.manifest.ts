import { ClothSimEffect } from "../clothSimEffect";
import { defineEffectManifest, numberControl, selectControl } from "./shared";

export const cloth_simManifest = defineEffectManifest({
  key: "cloth_sim",
  className: "ClothSimEffect",
  sourcePath: "src/renderer/effects/clothSimEffect.ts",
  createEffect: () => new ClothSimEffect(),
  debug: {
    title: "Cloth Sim Controls",
    controls: [
      numberControl("width", "Cloth Width", 0.74, { min: 0.2, max: 1, step: 0.01 }),
      numberControl("height", "Cloth Height", 0.58, { min: 0.2, max: 1, step: 0.01 }),
      numberControl("cols", "Columns", 24, { min: 8, max: 52, step: 1 }),
      numberControl("rows", "Rows", 16, { min: 6, max: 36, step: 1 }),
      numberControl("gravity", "Gravity", 0.58, { min: 0, max: 2, step: 0.01 }),
      numberControl("damping", "Damping", 0.984, { min: 0.85, max: 0.999, step: 0.001 }),
      numberControl("stiffness", "Stiffness", 0.9, { min: 0.35, max: 1, step: 0.01 }),
      numberControl("iterations", "Iterations", 4, { min: 1, max: 10, step: 1 }),
      numberControl("wind", "Wind", 0.58, { min: 0, max: 2, step: 0.01 }),
      numberControl("flutter", "Flutter", 0.35, { min: 0, max: 1.4, step: 0.01 }),
      numberControl("audioReactive", "Audio Reactive", 0.62, { min: 0, max: 1, step: 0.01 }),
      selectControl("pinMode", "Pin Mode", "corners", [
        { label: "Corners", value: "corners" },
        { label: "Top", value: "top" }
      ]),
      numberControl("driftX", "Drift X", 0, { min: -1, max: 1, step: 0.01 }),
      numberControl("driftY", "Drift Y", -0.1, { min: -1, max: 1, step: 0.01 }),
      numberControl("shading", "Shading", 0.8, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("seamAlpha", "Seam Alpha", 0.24, { min: 0, max: 0.7, step: 0.01 }),
      selectControl("paletteMode", "Palette", "era", [
        { label: "Era", value: "era" },
        { label: "Mono", value: "mono" },
        { label: "Neon", value: "neon" }
      ]),
      numberControl("backgroundAlpha", "Background Alpha", 0.18, { min: 0, max: 1, step: 0.01 }),
      numberControl("mobileQuality", "Mobile Quality", 0.82, { min: 0.35, max: 1, step: 0.01 }),
      selectControl("obstacle", "Obstacle", "none", [
        { label: "None", value: "none" },
        { label: "Sphere", value: "sphere" },
        { label: "Pillar", value: "pillar" }
      ]),
      numberControl("obstacleSize", "Obstacle Size", 0.18, { min: 0.08, max: 0.45, step: 0.01 })
    ]
  },
  docs: {
    parameters:
      "`width`, `height`, `cols`, `rows`, `gravity`, `damping`, `stiffness`, `iterations`, `wind`, `flutter`, `audioReactive`, `pinMode`, `driftX`, `driftY`, `shading`, `seamAlpha`, `paletteMode`, `backgroundAlpha`, `mobileQuality`, `obstacle`, `obstacleSize`",
    catalogNote:
      "Canvas2D verlet cloth mesh with pinned anchors, gust-driven folds, beat billows, and era-aware shading that can run as base or composited layer.",
    description:
      "Canvas2D verlet cloth mesh with pinned anchors, gust-driven folds, beat billows, and era-aware shading that can run as base or composited layer."
  }
});

export default cloth_simManifest;
