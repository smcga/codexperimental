import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { BUMPMAP_PLANE_DEFAULTS, BumpmapPlaneEffect } from "../bumpmapPlane";

export const bumpmap_planeManifest = defineEffectManifest({
  key: "bumpmap_plane",
  className: "BumpmapPlaneEffect",
  sourcePath: "src/renderer/effects/bumpmapPlane.ts",
  createEffect: () => new BumpmapPlaneEffect(),
  debug: {
    title: "Bumpmap Plane Controls",
    controls: [
      numberControl("bufW", "Buffer Width", BUMPMAP_PLANE_DEFAULTS.bufW, { min: 120, max: 480, step: 10 }),
      numberControl("bufH", "Buffer Height", BUMPMAP_PLANE_DEFAULTS.bufH, { min: 90, max: 360, step: 10 }),
      numberControl("bumpStrength", "Bump Strength", BUMPMAP_PLANE_DEFAULTS.bumpStrength, { min: 0, max: 0.1, step: 0.005 }),
      numberControl("ambient", "Ambient", BUMPMAP_PLANE_DEFAULTS.ambient, { min: 0, max: 1, step: 0.05 }),
      numberControl("diffuseStrength", "Diffuse Strength", BUMPMAP_PLANE_DEFAULTS.diffuseStrength, { min: 0, max: 2, step: 0.05 }),
      numberControl("specStrength", "Spec Strength", BUMPMAP_PLANE_DEFAULTS.specStrength, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("shininess", "Shininess", BUMPMAP_PLANE_DEFAULTS.shininess, { min: 2, max: 80, step: 1 }),
      numberControl("lightZ", "Light Height", BUMPMAP_PLANE_DEFAULTS.lightZ, { min: 40, max: 240, step: 5 }),
      numberControl("lightSpeed", "Light Speed", BUMPMAP_PLANE_DEFAULTS.lightSpeed, { min: 0, max: 3, step: 0.05 }),
      selectControl("embossText", "Emboss Text", BUMPMAP_PLANE_DEFAULTS.embossText, [
        { label: "BUMP", value: "BUMP" },
        { label: "SMCGA", value: "SMCGA" },
        { label: "Off", value: "" }
      ]),
      numberControl("embossStrength", "Emboss Strength", BUMPMAP_PLANE_DEFAULTS.embossStrength, { min: 0, max: 200, step: 5 }),
      toggleControl("animateBumps", "Animate Bumps", BUMPMAP_PLANE_DEFAULTS.animateBumps),
      numberControl("waveAmp", "Wave Amp", BUMPMAP_PLANE_DEFAULTS.waveAmp, { min: 0, max: 40, step: 1 }),
      numberControl("waveFreqX", "Wave Freq X", BUMPMAP_PLANE_DEFAULTS.waveFreqX, { min: 0, max: 0.3, step: 0.01 }),
      numberControl("waveFreqY", "Wave Freq Y", BUMPMAP_PLANE_DEFAULTS.waveFreqY, { min: 0, max: 0.3, step: 0.01 }),
      numberControl("baseHue", "Base Hue", BUMPMAP_PLANE_DEFAULTS.baseHue, { min: 0, max: 360, step: 5 }),
      selectControl("paletteMode", "Palette Mode", BUMPMAP_PLANE_DEFAULTS.paletteMode, [
        { label: "Ramp", value: "ramp" },
        { label: "HSL", value: "hsl" }
      ]),
      toggleControl("scanlines", "Scanlines", BUMPMAP_PLANE_DEFAULTS.scanlines),
      numberControl("audioReact", "Audio React", BUMPMAP_PLANE_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", BUMPMAP_PLANE_DEFAULTS.beatKick, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", BUMPMAP_PLANE_DEFAULTS.seed, { min: 0, max: 999, step: 1 })
    ]
  },
  docs: {
    parameters: "`bufW`, `bufH`, `bumpStrength`, `ambient`, `diffuseStrength`, `specStrength`, `shininess`, `lightZ`, `lightSpeed`, `embossText`, `embossStrength`, `animateBumps`, `waveAmp`, `waveFreqX`, `waveFreqY`, `baseHue`, `paletteMode`, `scanlines`, `audioReact`, `beatKick`, `seed`",
    catalogNote: "CPU bump-mapped plane with moving light and optional embossed text.",
    description: "CPU bump-mapped plane with moving light and optional embossed text."
  }
});

export default bumpmap_planeManifest;
