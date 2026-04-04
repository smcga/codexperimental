import { VoronoiCellsEffect } from "../voronoiCells";
import { defineEffectManifest, numberControl, selectControl } from "./shared";

export const voronoi_cellsManifest = defineEffectManifest({
  key: "voronoi_cells",
  className: "VoronoiCellsEffect",
  sourcePath: "src/renderer/effects/voronoiCells.ts",
  createEffect: () => new VoronoiCellsEffect(),
  debug: {
    title: "Voronoi Cells Controls",
    controls: [
      numberControl("cellCount", "Cell Count", 24, { min: 6, max: 96, step: 1 }),
      numberControl("drift", "Drift", 0.55, { min: 0, max: 2, step: 0.01 }),
      numberControl("speed", "Speed", 1, { min: 0, max: 3, step: 0.01 }),
      numberControl("lineWidth", "Line Width", 1.5, { min: 0.25, max: 5, step: 0.05 }),
      numberControl("lineAlpha", "Line Alpha", 0.9, { min: 0, max: 1, step: 0.01 }),
      numberControl("fillAlpha", "Fill Alpha", 0.7, { min: 0, max: 1, step: 0.01 }),
      numberControl("contrast", "Contrast", 1, { min: 0.4, max: 2.5, step: 0.01 }),
      numberControl("jitter", "Jitter", 0.12, { min: 0, max: 1.5, step: 0.01 }),
      selectControl("paletteMode", "Palette", "era", [
        { label: "Era", value: "era" },
        { label: "Mono", value: "mono" },
        { label: "Neon", value: "neon" },
        { label: "Heat", value: "heat" }
      ]),
      numberControl("beatPulse", "Beat Pulse", 0.55, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("shade", "Shade", 0.45, { min: 0, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", 1, { min: 0, max: 9999, step: 1 }),
      numberControl("pixelStep", "Pixel Step", 4, { min: 2, max: 12, step: 1 }),
      numberControl("chromatic", "Chromatic", 0.2, { min: 0, max: 1, step: 0.01 })
    ]
  },
  docs: {
    parameters: "`cellCount`, `drift`, `speed`, `lineWidth`, `lineAlpha`, `fillAlpha`, `contrast`, `jitter`, `paletteMode`, `beatPulse`, `shade`, `seed`, `pixelStep`, `chromatic`",
    catalogNote:
      "Animated Voronoi-style cellular mosaic with era-aware palette bias; `paletteMode` supports `mono`, `neon`, `heat`, or `era`.",
    description:
      "Animated Voronoi-style cellular mosaic with era-aware palette bias; `paletteMode` supports `mono`, `neon`, `heat`, or `era`."
  }
});

export default voronoi_cellsManifest;
