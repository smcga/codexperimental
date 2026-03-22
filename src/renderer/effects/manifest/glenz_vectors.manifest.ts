import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { GLENZ_VECTORS_DEFAULTS, GlenzVectorsEffect } from "../glenzVectors";

export const glenz_vectorsManifest = defineEffectManifest({
  key: "glenz_vectors",
  className: "GlenzVectorsEffect",
  sourcePath: "src/renderer/effects/glenzVectors.ts",
  createEffect: () => new GlenzVectorsEffect(),
  debug: {
    title: "Glenz Vectors Controls",
    controls: [
      selectControl("model", "Model", GLENZ_VECTORS_DEFAULTS.model, [
        { label: "Cube", value: "cube" },
        { label: "Octa", value: "octa" },
        { label: "Icosa", value: "icosa" }
      ]),
      numberControl("instances", "Instances", GLENZ_VECTORS_DEFAULTS.instances, { min: 1, max: 6, step: 1 }),
      numberControl("camDist", "Camera Distance", GLENZ_VECTORS_DEFAULTS.camDist, { min: 2.2, max: 6.5, step: 0.1 }),
      numberControl("focal", "Focal Length", 0, { min: 0, max: 1200, step: 10 }),
      numberControl("rotXSpeed", "Rotate X Speed", GLENZ_VECTORS_DEFAULTS.rotXSpeed, { min: 0, max: 2.5, step: 0.05 }),
      numberControl("rotYSpeed", "Rotate Y Speed", GLENZ_VECTORS_DEFAULTS.rotYSpeed, { min: 0, max: 2.5, step: 0.05 }),
      numberControl("rotZSpeed", "Rotate Z Speed", GLENZ_VECTORS_DEFAULTS.rotZSpeed, { min: 0, max: 2.0, step: 0.05 }),
      numberControl("baseHue", "Base Hue", GLENZ_VECTORS_DEFAULTS.baseHue, { min: 0, max: 360, step: 5 }),
      numberControl("hueSpeed", "Hue Speed", GLENZ_VECTORS_DEFAULTS.hueSpeed, { min: -120, max: 120, step: 1 }),
      numberControl("sat", "Saturation", GLENZ_VECTORS_DEFAULTS.sat, { min: 0, max: 100, step: 1 }),
      numberControl("lightness", "Lightness", GLENZ_VECTORS_DEFAULTS.lightness, { min: 0, max: 100, step: 1 }),
      numberControl("faceAlpha", "Face Alpha", GLENZ_VECTORS_DEFAULTS.faceAlpha, { min: 0, max: 0.6, step: 0.01 }),
      toggleControl("edge", "Edges", GLENZ_VECTORS_DEFAULTS.edge),
      numberControl("edgeAlpha", "Edge Alpha", GLENZ_VECTORS_DEFAULTS.edgeAlpha, { min: 0, max: 1, step: 0.01 }),
      numberControl("lineWidth", "Line Width", GLENZ_VECTORS_DEFAULTS.lineWidth, { min: 0.5, max: 6, step: 0.1 }),
      numberControl("trailFade", "Trail Fade", GLENZ_VECTORS_DEFAULTS.trailFade, { min: 0, max: 1, step: 0.02 }),
      selectControl("sortFaces", "Sort Faces", GLENZ_VECTORS_DEFAULTS.sortFaces, [
        { label: "None", value: "none" },
        { label: "Back to Front", value: "backToFront" }
      ]),
      numberControl("audioReact", "Audio React", GLENZ_VECTORS_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", GLENZ_VECTORS_DEFAULTS.beatKick, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", GLENZ_VECTORS_DEFAULTS.seed, { min: 0, max: 999, step: 1 })
          ]
  },
  docs: {
    parameters: "`model`, `instances`, `camDist`, `focal`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `baseHue`, `hueSpeed`, `sat`, `lightness`, `faceAlpha`, `edge`, `edgeAlpha`, `lineWidth`, `trailFade`, `sortFaces`, `audioReact`, `beatKick`, `seed`",
    catalogNote: "`model` supports `cube`, `octa`, `icosa`; `sortFaces` supports `none` or `backToFront`.",
    description: "`model` supports `cube`, `octa`, `icosa`; `sortFaces` supports `none` or `backToFront`."
  }
});

export default glenz_vectorsManifest;
