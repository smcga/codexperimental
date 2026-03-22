import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { ShadebobsBobsEffect } from "../shadebobsBobs";

export const shadebobs_bobsManifest = defineEffectManifest({
  key: "shadebobs_bobs",
  className: "ShadebobsBobsEffect",
  sourcePath: "src/renderer/effects/shadebobsBobs.ts",
  createEffect: () => new ShadebobsBobsEffect(),
  debug: {
    title: "Shadebobs + Bobs Controls",
    controls: [
      selectControl("mode", "Mode", "hybrid", [
        { label: "Hybrid", value: "hybrid" },
        { label: "Shadebobs", value: "shadebobs" },
        { label: "Bobs", value: "bobs" }
      ]),
      numberControl("shadeCount", "Shade Count", 28, { min: 4, max: 80, step: 1 }),
      numberControl("bobCount", "Bob Count", 40, { min: 4, max: 140, step: 1 }),
      numberControl("shadeScale", "Shade Scale", 2, { min: 1, max: 3, step: 1 }),
      numberControl("blobRadius", "Blob Radius", 70, { min: 20, max: 160, step: 1 }),
      numberControl("trailFade", "Trail Fade", 0.12, { min: 0, max: 0.5, step: 0.01 }),
      selectControl("blend", "Blend Mode", "lighter", [
        { label: "Lighter", value: "lighter" },
        { label: "Screen", value: "screen" }
      ]),
      numberControl("hueSpeed", "Hue Speed", 40, { min: 0, max: 120, step: 1 }),
      numberControl("steer", "Steer", 40, { min: 0, max: 120, step: 1 }),
      numberControl("maxSpeed", "Max Speed", 220, { min: 60, max: 400, step: 5 }),
      numberControl("spriteSize", "Sprite Size", 48, { min: 16, max: 96, step: 1 }),
      toggleControl("boingCheckers", "Boing Checkers", true),
      numberControl("bobAlpha", "Bob Alpha", 0.95, { min: 0.1, max: 1, step: 0.01 }),
      toggleControl("fastBlob", "Fast Blob", false),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatPulseStrength", "Beat Pulse", 0.7, { min: 0, max: 1, step: 0.05 }),
      toggleControl("dirtyRects", "Dirty Rects", false),
      numberControl("seed", "Seed", 0, { min: 0, max: 20, step: 0.1 })
          ]
  },
  docs: {
    parameters: "`mode`, `shadeCount`, `bobCount`, `shadeScale`, `blobRadius`, `trailFade`, `blend`, `hueSpeed`, `steer`, `maxSpeed`, `spriteSize`, `boingCheckers`, `bobAlpha`, `fastBlob`, `audioReact`, `beatPulseStrength`, `dirtyRects`, `seed`",
    catalogNote: "Amiga-style bobs mixed with shadebobs interference.",
    description: "Amiga-style bobs mixed with shadebobs interference."
  }
});

export default shadebobs_bobsManifest;
