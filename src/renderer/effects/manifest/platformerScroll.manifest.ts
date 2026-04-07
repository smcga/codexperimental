import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { PLATFORMER_SCROLL_DEFAULTS, PlatformerScrollEffect } from "../platformerScroll";

export const platformerScrollManifest = defineEffectManifest({
  key: "platformerScroll",
  className: "PlatformerScrollEffect",
  sourcePath: "src/renderer/effects/platformerScroll.ts",
  createEffect: () => new PlatformerScrollEffect(),
  debug: {
    title: "Platformer Scroll Controls",
    controls: [
      numberControl("speed", "Speed", PLATFORMER_SCROLL_DEFAULTS.speed, { min: 0, max: 8, step: 0.05 }),
      numberControl("seed", "Seed", PLATFORMER_SCROLL_DEFAULTS.seed, { min: 0, max: 9999, step: 1 }),
      numberControl("tileSize", "Tile Size", PLATFORMER_SCROLL_DEFAULTS.tileSize, { min: 8, max: 64, step: 1 }),
      numberControl("groundRatio", "Ground Ratio", PLATFORMER_SCROLL_DEFAULTS.groundRatio, { min: 0.2, max: 0.3, step: 0.01 }),
      numberControl("parallaxFar", "Parallax Far", PLATFORMER_SCROLL_DEFAULTS.parallaxFar, { min: 0.05, max: 0.6, step: 0.01 }),
      numberControl("parallaxMid", "Parallax Mid", PLATFORMER_SCROLL_DEFAULTS.parallaxMid, { min: 0.15, max: 0.9, step: 0.01 }),
      numberControl("parallaxFront", "Parallax Front", PLATFORMER_SCROLL_DEFAULTS.parallaxFront, { min: 0.7, max: 1.4, step: 0.01 }),
      numberControl("audioReact", "Audio React", PLATFORMER_SCROLL_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", PLATFORMER_SCROLL_DEFAULTS.beatKick, { min: 0, max: 1, step: 0.05 }),
      numberControl("platformRate", "Platform Rate", PLATFORMER_SCROLL_DEFAULTS.platformRate, { min: 0, max: 1, step: 0.01 }),
      numberControl("platformMaxSteps", "Platform Max Steps", PLATFORMER_SCROLL_DEFAULTS.platformMaxSteps, { min: 1, max: 12, step: 1 })
    ]
  },
  docs: {
    parameters: "`speed`, `seed`, `tileSize`, `groundRatio`, `parallaxFar`, `parallaxMid`, `parallaxFront`, `audioReact`, `beatKick`, `platformRate`, `platformMaxSteps`",
    catalogNote: "Deterministic side-scrolling platformer parallax scene with looping platforms and a colorful neon astronaut mascot runner.",
    description: "Deterministic side-scrolling platformer parallax scene with looping platforms and a colorful neon astronaut mascot runner."
  }
});

export default platformerScrollManifest;
