import { HexGridPulseEffect } from "../hexGridPulseEffect";
import { defineEffectManifest, numberControl, toggleControl } from "./shared";

export const hexGridPulseManifest = defineEffectManifest({
  key: "hexGridPulse",
  className: "HexGridPulseEffect",
  sourcePath: "src/renderer/effects/hexGridPulseEffect.ts",
  createEffect: () => new HexGridPulseEffect(),
  debug: {
    title: "Hex Grid Pulse Controls",
    controls: [
      numberControl("cellSize", "Cell Size", 24, { min: 8, max: 96, step: 1 }),
      numberControl("speed", "Speed", 1, { min: 0, max: 4, step: 0.05 }),
      numberControl("waveScale", "Wave Scale", 1.1, { min: 0.1, max: 4, step: 0.05 }),
      numberControl("rippleStrength", "Ripple Strength", 0.45, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("pulseStrength", "Pulse Strength", 0.55, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("lineWidth", "Line Width", 1.2, { min: 0, max: 8, step: 0.1 }),
      numberControl("fillAlpha", "Fill Alpha", 0.52, { min: 0, max: 1, step: 0.01 }),
      numberControl("glowAlpha", "Glow Alpha", 0.35, { min: 0, max: 1, step: 0.01 }),
      numberControl("audioReactive", "Audio Reactive", 0.5, { min: 0, max: 1, step: 0.01 }),
      numberControl("paletteMix", "Palette Mix", 0.65, { min: 0, max: 1, step: 0.01 }),
      toggleControl("invert", "Invert", false)
    ]
  },
  docs: {
    parameters:
      "`cellSize`, `speed`, `waveScale`, `rippleStrength`, `pulseStrength`, `lineWidth`, `fillAlpha`, `glowAlpha`, `audioReactive`, `paletteMix`, `invert`",
    catalogNote:
      "Hexagonal lattice with travelling waves, radial ripples, and controlled audio-reactive pulse highlights across eras.",
    description: "Hex grid pulse lattice"
  }
});

export default hexGridPulseManifest;
