import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { RaytraceSpheresEffect } from "../raytraceSpheres";

export const raytrace_spheresManifest = defineEffectManifest({
  key: "raytrace_spheres",
  className: "RaytraceSpheresEffect",
  sourcePath: "src/renderer/effects/raytraceSpheres.ts",
  createEffect: () => new RaytraceSpheresEffect(),
  debug: {
    title: "Raytrace Spheres Controls",
    controls: [
      numberControl("quality", "Quality", 2, { min: 1, max: 3, step: 1 }),
      numberControl("bufW", "Buffer Width", 0),
      numberControl("bufH", "Buffer Height", 0),
      numberControl("sphereCount", "Sphere Count", 3, { min: 1, max: 8, step: 1 }),
      numberControl("cellSize", "Cell Size", 2, { min: 1, max: 6, step: 1 }),
      toggleControl("adaptive", "Adaptive", true),
      numberControl("refineThreshold", "Refine Threshold", 120, { min: 20, max: 255, step: 1 }),
      toggleControl("refineGrow", "Refine Grow", true),
      numberControl("aa", "Antialiasing", 1, { min: 0, max: 2, step: 1 }),
      selectControl("aaMode", "AA Mode", "refinedOnly", [
        { label: "Refined only", value: "refinedOnly" },
        { label: "Full", value: "full" }
      ]),
      toggleControl("outputSmoothing", "Output Smoothing", false),
      toggleControl("forceAA", "Force AA", false),
      numberControl("seed", "Seed", 1337, { min: 0, max: 9999, step: 1 }),
      numberControl("fov", "FOV", 60, { min: 35, max: 90, step: 1 }),
      numberControl("audioReact", "Audio React", 0.6, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("maxDepth", "Max Depth", 2, { min: 1, max: 3, step: 1 }),
      numberControl("ambient", "Ambient", 0.12, { min: 0.05, max: 0.4, step: 0.01 }),
      numberControl("diffuseStrength", "Diffuse Strength", 1, { min: 0.2, max: 2, step: 0.05 }),
      numberControl("specStrength", "Spec Strength", 0.45, { min: 0, max: 2, step: 0.05 }),
      numberControl("shininess", "Shininess", 48, { min: 8, max: 96, step: 1 }),
      numberControl("floorReflect", "Floor Reflect", 0.55, { min: 0, max: 0.9, step: 0.01 }),
      toggleControl("scanlines", "Scanlines", false)
    ]
  },
  docs: {
    parameters: "`quality`, `bufW`, `bufH`, `sphereCount`, `maxDepth`, `floorReflect`, `shininess`, `diffuseStrength`, `specStrength`, `ambient`, `fov`, `cellSize`, `adaptive`, `refineThreshold`, `refineGrow`, `aa`, `aaMode`, `outputSmoothing`, `forceAA`, `audioReact`, `beatKick`, `scanlines`, `seed`",
    catalogNote: "Low-res software raytraced spheres with reflections.",
    description: "Low-res software raytraced spheres with reflections."
  }
});

export default raytrace_spheresManifest;
