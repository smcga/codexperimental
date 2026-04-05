import { SoftShadowsEffect } from "../softShadowsEffect";
import { defineEffectManifest, numberControl, selectControl } from "./shared";

export const soft_shadowsManifest = defineEffectManifest({
  key: "soft_shadows",
  className: "SoftShadowsEffect",
  sourcePath: "src/renderer/effects/softShadowsEffect.ts",
  createEffect: () => new SoftShadowsEffect(),
  debug: {
    title: "Soft Shadows Controls",
    controls: [
      numberControl("count", "Caster Count", 3, { min: 1, max: 6, step: 1 }),
      numberControl("lightAngle", "Light Angle", 0.8, { min: -3.14, max: 3.14, step: 0.01 }),
      numberControl("lightSweep", "Light Sweep", 0.35, { min: 0, max: 1, step: 0.01 }),
      numberControl("height", "Height", 0.32, { min: 0.05, max: 0.9, step: 0.01 }),
      numberControl("shadowLength", "Shadow Length", 1.2, { min: 0.2, max: 2.2, step: 0.01 }),
      numberControl("softness", "Softness", 0.6, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("contactHardness", "Contact Hardness", 0.7, { min: 0, max: 1, step: 0.01 }),
      numberControl("passCount", "Pass Count", 6, { min: 1, max: 12, step: 1 }),
      numberControl("objectSize", "Object Size", 0.12, { min: 0.05, max: 0.25, step: 0.01 }),
      numberControl("motion", "Motion", 0.4, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("floorGlow", "Floor Glow", 0.2, { min: 0, max: 1, step: 0.01 }),
      numberControl("audioReactive", "Audio Reactive", 0.35, { min: 0, max: 1, step: 0.01 }),
      selectControl("palette", "Palette", "studio", [
        { label: "Studio", value: "studio" },
        { label: "Sunset", value: "sunset" },
        { label: "Mono", value: "mono" }
      ])
    ]
  },
  docs: {
    parameters:
      "`count`, `lightAngle`, `lightSweep`, `height`, `shadowLength`, `softness`, `contactHardness`, `passCount`, `objectSize`, `motion`, `floorGlow`, `audioReactive`, `palette`",
    catalogNote: "Layered faux-PCF floor shadows with contact hardening and smooth penumbra falloff.",
    description: "Canvas2D soft-shadow stage with floating casters and deterministic multi-pass penumbra rendering."
  }
});

export default soft_shadowsManifest;
