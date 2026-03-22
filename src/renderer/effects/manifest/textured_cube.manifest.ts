import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { TEXTURED_CUBE_DEFAULTS, TexturedCubeEffect } from "../texturedCube";

export const textured_cubeManifest = defineEffectManifest({
  key: "textured_cube",
  className: "TexturedCubeEffect",
  sourcePath: "src/renderer/effects/texturedCube.ts",
  createEffect: () => new TexturedCubeEffect(),
  debug: {
    title: "Textured Cube Controls",
    controls: [
      numberControl("scale", "Scale", TEXTURED_CUBE_DEFAULTS.scale, { min: 1, max: 6, step: 1 }),
      numberControl("camDist", "Camera Distance", TEXTURED_CUBE_DEFAULTS.camDist, { min: 2.5, max: 8, step: 0.1 }),
      numberControl("focalMul", "Focal Multiplier", TEXTURED_CUBE_DEFAULTS.focalMul, { min: 0.4, max: 1.6, step: 0.05 }),
      numberControl("rotXSpeed", "Rotate X Speed", TEXTURED_CUBE_DEFAULTS.rotXSpeed, { min: 0, max: 2, step: 0.05 }),
      numberControl("rotYSpeed", "Rotate Y Speed", TEXTURED_CUBE_DEFAULTS.rotYSpeed, { min: 0, max: 2, step: 0.05 }),
      numberControl("rotZSpeed", "Rotate Z Speed", TEXTURED_CUBE_DEFAULTS.rotZSpeed, { min: 0, max: 2, step: 0.05 }),
      toggleControl("backfaceCull", "Backface Cull", Boolean(TEXTURED_CUBE_DEFAULTS.backfaceCull)),
      toggleControl("perspectiveCorrect", "Perspective Correct", Boolean(TEXTURED_CUBE_DEFAULTS.perspectiveCorrect)),
      toggleControl("edge", "Edge Highlight", Boolean(TEXTURED_CUBE_DEFAULTS.edge)),
      numberControl("edgeAlpha", "Edge Alpha", TEXTURED_CUBE_DEFAULTS.edgeAlpha, { min: 0, max: 1, step: 0.05 }),
      numberControl("shadeStrength", "Shade Strength", TEXTURED_CUBE_DEFAULTS.shadeStrength, { min: 0, max: 1.2, step: 0.05 }),
      numberControl("audioReact", "Audio React", TEXTURED_CUBE_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", TEXTURED_CUBE_DEFAULTS.beatKick, { min: 0, max: 1, step: 0.05 }),
      toggleControl("textureAnim", "Texture Animate", Boolean(TEXTURED_CUBE_DEFAULTS.textureAnim))
    ]
  },
  docs: {
    parameters: "`scale`, `camDist`, `focalMul`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `backfaceCull`, `perspectiveCorrect`, `edge`, `edgeAlpha`, `shadeStrength`, `audioReact`, `beatKick`, `textureAnim`",
    catalogNote: "Software-textured cube with optional affine/perspective mapping.",
    description: "Software-textured cube with optional affine/perspective mapping."
  }
});

export default textured_cubeManifest;
