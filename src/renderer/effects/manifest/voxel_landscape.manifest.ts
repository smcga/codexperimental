import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { VOXEL_LANDSCAPE_DEFAULTS, VoxelLandscapeEffect } from "../voxelLandscape";

export const voxel_landscapeManifest = defineEffectManifest({
  key: "voxel_landscape",
  className: "VoxelLandscapeEffect",
  sourcePath: "src/renderer/effects/voxelLandscape.ts",
  createEffect: () => new VoxelLandscapeEffect(),
  debug: {
    title: "Voxel Landscape Controls",
    controls: [
      numberControl("bufW", "Buffer Width", VOXEL_LANDSCAPE_DEFAULTS.bufW, { min: 128, max: 512, step: 16 }),
      numberControl("bufH", "Buffer Height", VOXEL_LANDSCAPE_DEFAULTS.bufH, { min: 96, max: 384, step: 8 }),
      numberControl("speed", "Speed", VOXEL_LANDSCAPE_DEFAULTS.speed, { min: 0, max: 200, step: 1 }),
      numberControl("turnRate", "Turn Rate", VOXEL_LANDSCAPE_DEFAULTS.turnRate, { min: 0, max: 1, step: 0.01 }),
      numberControl("turnWobble", "Turn Wobble", VOXEL_LANDSCAPE_DEFAULTS.turnWobble, { min: 0, max: 0.5, step: 0.01 }),
      numberControl("camH", "Camera Height", VOXEL_LANDSCAPE_DEFAULTS.camH, { min: 40, max: 180, step: 1 }),
      numberControl("heightBob", "Height Bob", VOXEL_LANDSCAPE_DEFAULTS.heightBob, { min: 0, max: 20, step: 0.5 }),
      numberControl("beatBump", "Beat Bump", VOXEL_LANDSCAPE_DEFAULTS.beatBump, { min: 0, max: 30, step: 0.5 }),
      numberControl("fov", "FOV", VOXEL_LANDSCAPE_DEFAULTS.fov, { min: 0.5, max: 1.6, step: 0.01 }),
      numberControl("horizon", "Horizon", VOXEL_LANDSCAPE_DEFAULTS.bufH * 0.45, { min: 40, max: 180, step: 1 }),
      numberControl("scale", "Scale", VOXEL_LANDSCAPE_DEFAULTS.scale, { min: 60, max: 200, step: 1 }),
      numberControl("maxDist", "Max Distance", VOXEL_LANDSCAPE_DEFAULTS.maxDist, { min: 200, max: 1400, step: 10 }),
      numberControl("stepBase", "Step Base", VOXEL_LANDSCAPE_DEFAULTS.stepBase, { min: 1, max: 6, step: 1 }),
      numberControl("stepGrow", "Step Grow", VOXEL_LANDSCAPE_DEFAULTS.stepGrow, { min: 20, max: 160, step: 5 }),
      numberControl("fogStrength", "Fog Strength", VOXEL_LANDSCAPE_DEFAULTS.fogStrength, { min: 0, max: 1, step: 0.05 }),
      numberControl("audioReact", "Audio React", VOXEL_LANDSCAPE_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", VOXEL_LANDSCAPE_DEFAULTS.beatKick, { min: 0, max: 1, step: 0.05 }),
      toggleControl("scanlines", "Scanlines", false),
      numberControl("seed", "Seed", VOXEL_LANDSCAPE_DEFAULTS.seed, { min: 0, max: 9999, step: 1 })
    ]
  },
  docs: {
    parameters: "`bufW`, `bufH`, `speed`, `turnRate`, `turnWobble`, `camH`, `heightBob`, `beatBump`, `fov`, `horizon`, `scale`, `maxDist`, `stepBase`, `stepGrow`, `fogStrength`, `audioReact`, `beatKick`, `scanlines`, `seed`",
    catalogNote: "Heightfield voxel landscape flyover with portrait-aware camera framing.",
    description: "Heightfield voxel landscape flyover with portrait-aware camera framing."
  }
});

export default voxel_landscapeManifest;
