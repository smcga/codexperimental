import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { MetaballsEffect } from "../metaballs";

export const metaballsManifest = defineEffectManifest({
  key: "metaballs",
  className: "MetaballsEffect",
  sourcePath: "src/renderer/effects/metaballs.ts",
  createEffect: () => new MetaballsEffect(),
  debug: {
    title: "Metaballs Controls",
    controls: [
      numberControl("bufW", "Buffer Width", 240, { min: 120, max: 480, step: 10 }),
      numberControl("bufH", "Buffer Height", 180, { min: 90, max: 360, step: 10 }),
      numberControl("count", "Ball Count", 6, { min: 2, max: 12, step: 1 }),
      numberControl("baseRadius", "Base Radius", 34, { min: 8, max: 80, step: 1 }),
      numberControl("radiusVar", "Radius Variance", 10, { min: 0, max: 30, step: 1 }),
      numberControl("baseThreshold", "Base Threshold", 1.2, { min: 0.5, max: 2, step: 0.02 }),
      numberControl("edgeSoftness", "Edge Softness", 0.08, { min: 0.01, max: 0.2, step: 0.01 }),
      numberControl("normalZ", "Normal Z", 220, { min: 40, max: 400, step: 5 }),
      numberControl("ambient", "Ambient", 0.15, { min: 0, max: 1, step: 0.05 }),
      numberControl("diffuse", "Diffuse", 1, { min: 0, max: 2, step: 0.05 }),
      numberControl("specStrength", "Specular Strength", 0.35, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("shininess", "Shininess", 24, { min: 1, max: 64, step: 1 }),
      numberControl("rimStrength", "Rim Strength", 0.25, { min: 0, max: 1.5, step: 0.05 }),
      selectControl("palette", "Palette", "chrome", [
        { label: "Chrome", value: "chrome" },
        { label: "Neon", value: "neon" }
      ]),
      numberControl("hueSpeed", "Hue Speed", 22, { min: 0, max: 60, step: 1 }),
      toggleControl("smoothing", "Smoothing", true),
      numberControl("glow", "Glow", 0.25, { min: 0, max: 1, step: 0.05 }),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", 1, { min: 0, max: 999, step: 1 })
    ]
  },
  docs: {
    parameters: "`bufW`, `bufH`, `count`, `baseRadius`, `radiusVar`, `baseThreshold`, `edgeSoftness`, `normalZ`, `ambient`, `diffuse`, `specStrength`, `shininess`, `rimStrength`, `palette`, `hueSpeed`, `smoothing`, `glow`, `audioReact`, `beatKick`, `seed`",
    catalogNote: "Implicit surface metaballs with chrome/neon lighting; `palette` supports `chrome` or `neon`.",
    description: "Implicit surface metaballs with chrome/neon lighting; `palette` supports `chrome` or `neon`."
  }
});

export default metaballsManifest;
