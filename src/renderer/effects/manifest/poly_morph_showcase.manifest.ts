import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { PolyMorphShowcaseEffect } from "../polyMorphShowcase";

export const poly_morph_showcaseManifest = defineEffectManifest({
  key: "poly_morph_showcase",
  className: "PolyMorphShowcaseEffect",
  sourcePath: "src/renderer/effects/polyMorphShowcase.ts",
  createEffect: () => new PolyMorphShowcaseEffect(),
  debug: {
    title: "Poly Morph Showcase Controls",
    controls: [
      numberControl("lat", "Latitude Segments", 16, { min: 8, max: 28, step: 1 }),
      numberControl("lon", "Longitude Segments", 24, { min: 12, max: 40, step: 1 }),
      numberControl("morphSpeed", "Morph Speed", 0.08, { min: 0, max: 0.3, step: 0.01 }),
      numberControl("styleSpeed", "Style Speed", 0.1, { min: 0, max: 0.5, step: 0.01 }),
      selectControl("style", "Style", "auto", [
        { label: "Auto", value: "auto" },
        { label: "Solid", value: "solid" },
        { label: "Glenz", value: "glenz" },
        { label: "Shaded", value: "shaded" }
      ]),
      numberControl("camDist", "Camera Distance", 3.6, { min: 2.5, max: 6, step: 0.1 }),
      numberControl("focalMul", "Focal Multiplier", 0.9, { min: 0.5, max: 1.2, step: 0.05 }),
      numberControl("rotXSpeed", "Rotate X Speed", 0.5, { min: -2, max: 2, step: 0.05 }),
      numberControl("rotYSpeed", "Rotate Y Speed", 0.8, { min: -2, max: 2, step: 0.05 }),
      numberControl("rotZSpeed", "Rotate Z Speed", 0.2, { min: -2, max: 2, step: 0.05 }),
      numberControl("sat", "Saturation", 85, { min: 0, max: 100, step: 1 }),
      numberControl("baseHue", "Base Hue", 200, { min: 0, max: 360, step: 5 }),
      numberControl("hueSpeed", "Hue Speed", 25, { min: -90, max: 90, step: 1 }),
      numberControl("solidAlpha", "Solid Alpha", 0.9, { min: 0, max: 1, step: 0.05 }),
      numberControl("glenzAlpha", "Glenz Alpha", 0.13, { min: 0, max: 0.4, step: 0.01 }),
      numberControl("shadedAlpha", "Shaded Alpha", 0.95, { min: 0, max: 1, step: 0.05 }),
      toggleControl("edge", "Edge Overlay", true),
      numberControl("edgeAlpha", "Edge Alpha", 0.18, { min: 0, max: 0.6, step: 0.01 }),
      toggleControl("sortSolid", "Sort Solid Faces", true),
      toggleControl("sortShaded", "Sort Shaded Faces", true),
      toggleControl("sortGlenz", "Sort Glenz Faces", false),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 999, step: 1 })
          ]
  },
  docs: {
    parameters: "`lat`, `lon`, `morphSpeed`, `styleSpeed`, `style`, `camDist`, `focalMul`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `sat`, `baseHue`, `hueSpeed`, `solidAlpha`, `glenzAlpha`, `shadedAlpha`, `edge`, `edgeAlpha`, `sortSolid`, `sortShaded`, `sortGlenz`, `audioReact`, `beatKick`, `seed`",
    catalogNote: "`style` supports `auto`, `solid`, `glenz`, `shaded`.",
    description: "`style` supports `auto`, `solid`, `glenz`, `shaded`."
  }
});

export default poly_morph_showcaseManifest;
