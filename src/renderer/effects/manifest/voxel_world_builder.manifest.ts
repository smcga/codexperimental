import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { VOXEL_WORLD_BUILDER_DEFAULTS, VoxelWorldBuilderEffect } from "../VoxelWorldBuilder";

export const voxel_world_builderManifest = defineEffectManifest({
  key: "voxel_world_builder",
  className: "VoxelWorldBuilderEffect",
  sourcePath: "src/renderer/effects/VoxelWorldBuilder.ts",
  createEffect: () => new VoxelWorldBuilderEffect(),
  debug: {
    title: "Voxel World Builder Controls",
    controls: [
      numberControl("buildProgress", "Build Progress", VOXEL_WORLD_BUILDER_DEFAULTS.buildProgress, {
        min: 0,
        max: 1,
        step: 0.01
      }),
      numberControl("cityDensity", "City Density", VOXEL_WORLD_BUILDER_DEFAULTS.cityDensity, {
        min: 0,
        max: 1,
        step: 0.01
      }),
      numberControl("glow", "Glow", VOXEL_WORLD_BUILDER_DEFAULTS.glow, { min: 0, max: 2, step: 0.01 }),
      numberControl("cameraLift", "Camera Lift", VOXEL_WORLD_BUILDER_DEFAULTS.cameraLift, {
        min: -0.25,
        max: 1.5,
        step: 0.01
      }),
      numberControl("seed", "Seed", VOXEL_WORLD_BUILDER_DEFAULTS.seed, { min: 0, max: 9999, step: 1 })
    ]
  },
  docs: {
    parameters: "`buildProgress`, `cityDensity`, `glow`, `cameraLift`, `seed`",
    catalogNote: "WebGL2 instanced voxel city assembler (64x64 cubes); falls back to Canvas2D isometric voxels when WebGL2 is unavailable.",
    description: "WebGL2 instanced voxel city assembler (64x64 cubes); falls back to Canvas2D isometric voxels when WebGL2 is unavailable."
  }
});

export default voxel_world_builderManifest;
