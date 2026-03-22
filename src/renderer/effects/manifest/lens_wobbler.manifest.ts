import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { LensWobblerEffect } from "../lensWobbler";

export const lens_wobblerManifest = defineEffectManifest({
  key: "lens_wobbler",
  className: "LensWobblerEffect",
  sourcePath: "src/renderer/effects/lensWobbler.ts",
  createEffect: () => new LensWobblerEffect(),
  debug: {
    title: "Lens Wobbler Controls",
    controls: [
      numberControl("bufW", "Buffer Width", 240, { min: 120, max: 480, step: 4 }),
      numberControl("bufH", "Buffer Height", 150, { min: 90, max: 360, step: 2 }),
      numberControl("rotSpeed", "Rotation Speed", 0.25, { min: 0, max: 2, step: 0.01 }),
      numberControl("baseScale", "Base Scale", 0.9, { min: 0.4, max: 1.6, step: 0.01 }),
      numberControl("zoomAmp", "Zoom Amplitude", 0.15, { min: 0, max: 0.6, step: 0.01 }),
      numberControl("zoomSpeed", "Zoom Speed", 0.6, { min: 0, max: 3, step: 0.05 }),
      numberControl("scrollU", "Scroll U", 30, { min: -120, max: 120, step: 1 }),
      numberControl("scrollV", "Scroll V", 18, { min: -120, max: 120, step: 1 }),
      numberControl("lensRadius", "Lens Radius", 33, { min: 10, max: 120, step: 1 }),
      numberControl("lensStrength", "Lens Strength", 0.75, { min: 0, max: 1.5, step: 0.05 }),
      toggleControl("invertRing", "Invert Ring", true),
      toggleControl("wobble", "Wobble", true),
      numberControl("wobbleAmp", "Wobble Amplitude", 6, { min: 0, max: 16, step: 0.5 }),
      numberControl("wobbleFreq", "Wobble Frequency", 0.1, { min: 0, max: 0.4, step: 0.01 }),
      numberControl("wobbleSpeed", "Wobble Speed", 3.0, { min: 0, max: 8, step: 0.1 }),
      numberControl("wobbleSlice", "Wobble Slice", 2, { min: 1, max: 8, step: 1 }),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 999, step: 1 }),
      selectControl("lensPath", "Lens Path", "circle", [
        { label: "Circle", value: "circle" },
        { label: "Lissajous", value: "lissajous" }
      ])
          ]
  },
  docs: {
    parameters: "`bufW`, `bufH`, `rotSpeed`, `baseScale`, `zoomAmp`, `zoomSpeed`, `scrollU`, `scrollV`, `lensRadius`, `lensStrength`, `invertRing`, `wobble`, `wobbleAmp`, `wobbleFreq`, `wobbleSpeed`, `wobbleSlice`, `audioReact`, `beatKick`, `seed`, `lensPath`",
    catalogNote: "Bubble lens warp with optional jelly wobble.",
    description: "Bubble lens warp with optional jelly wobble."
  }
});

export default lens_wobblerManifest;
