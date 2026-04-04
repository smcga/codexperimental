import { SHADOW_VOLUMES_DEFAULTS, ShadowVolumesEffect } from "../shadowVolumes";
import { defineEffectManifest, numberControl, toggleControl } from "./shared";

export const shadow_volumesManifest = defineEffectManifest({
  key: "shadowVolumes",
  className: "ShadowVolumesEffect",
  sourcePath: "src/renderer/effects/shadowVolumes.ts",
  createEffect: () => new ShadowVolumesEffect(),
  debug: {
    title: "Shadow Volumes Controls",
    controls: [
      numberControl("count", "Count", SHADOW_VOLUMES_DEFAULTS.count, { min: 2, max: 14, step: 1 }),
      numberControl("seed", "Seed", SHADOW_VOLUMES_DEFAULTS.seed, { min: 0, max: 9999, step: 1 }),
      numberControl("speed", "Speed", SHADOW_VOLUMES_DEFAULTS.speed, { min: 0.15, max: 3, step: 0.01 }),
      numberControl("contrast", "Contrast", SHADOW_VOLUMES_DEFAULTS.contrast, { min: 0.2, max: 1.5, step: 0.01 }),
      numberControl("lightYawAmp", "Light Yaw Amp", SHADOW_VOLUMES_DEFAULTS.lightYawAmp, { min: 0.1, max: 2.5, step: 0.01 }),
      numberControl("lightHeight", "Light Height", SHADOW_VOLUMES_DEFAULTS.lightHeight, { min: 0.2, max: 2, step: 0.01 }),
      numberControl("shadowLength", "Shadow Length", SHADOW_VOLUMES_DEFAULTS.shadowLength, { min: 0.4, max: 3, step: 0.01 }),
      numberControl("perspective", "Perspective", SHADOW_VOLUMES_DEFAULTS.perspective, { min: 0.45, max: 1.8, step: 0.01 }),
      numberControl("groundGrid", "Ground Grid", SHADOW_VOLUMES_DEFAULTS.groundGrid, { min: 0, max: 1, step: 0.01 }),
      toggleControl("rotateOccluders", "Rotate Occluders", SHADOW_VOLUMES_DEFAULTS.rotateOccluders === 1),
      numberControl("accent", "Accent", SHADOW_VOLUMES_DEFAULTS.accent, { min: 0, max: 1, step: 0.01 }),
      numberControl("beatPunch", "Beat Punch", SHADOW_VOLUMES_DEFAULTS.beatPunch, { min: 0, max: 1, step: 0.01 }),
      numberControl("cameraDrift", "Camera Drift", SHADOW_VOLUMES_DEFAULTS.cameraDrift, { min: 0, max: 1, step: 0.01 }),
      numberControl("mobilePadding", "Mobile Padding", SHADOW_VOLUMES_DEFAULTS.mobilePadding, { min: 0, max: 0.24, step: 0.01 })
    ]
  },
  docs: {
    parameters:
      "`count`, `seed`, `speed`, `contrast`, `lightYawAmp`, `lightHeight`, `shadowLength`, `perspective`, `groundGrid`, `rotateOccluders`, `accent`, `beatPunch`, `cameraDrift`, `mobilePadding`",
    catalogNote: "Canvas faux-3D hard-shadow scene with deterministic silhouette projections.",
    description: "Canvas faux-3D hard-shadow scene with deterministic silhouette projections."
  }
});

export default shadow_volumesManifest;
