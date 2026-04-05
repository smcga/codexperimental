import { POLAR_TUNNEL_DEFAULTS, PolarTunnelEffect } from "../polarTunnelEffect";
import { defineEffectManifest, numberControl } from "./shared";

export const polar_tunnelManifest = defineEffectManifest({
  key: "polar_tunnel",
  className: "PolarTunnelEffect",
  sourcePath: "src/renderer/effects/polarTunnelEffect.ts",
  createEffect: () => new PolarTunnelEffect(),
  debug: {
    title: "Polar Tunnel Controls",
    controls: [
      numberControl("rotateSpeed", "Rotate Speed", POLAR_TUNNEL_DEFAULTS.rotateSpeed, { min: -4, max: 4, step: 0.05 }),
      numberControl("wobbleFrequency", "Wobble Frequency", POLAR_TUNNEL_DEFAULTS.wobbleFrequency, { min: 0, max: 40, step: 0.5 }),
      numberControl("wobbleSpeed", "Wobble Speed", POLAR_TUNNEL_DEFAULTS.wobbleSpeed, { min: -8, max: 8, step: 0.05 }),
      numberControl("wobbleAmount", "Wobble Amount", POLAR_TUNNEL_DEFAULTS.wobbleAmount, { min: 0, max: 2, step: 0.01 }),
      numberControl("radialWobbleFrequency", "Radial Wobble Freq", POLAR_TUNNEL_DEFAULTS.radialWobbleFrequency, {
        min: 0,
        max: 24,
        step: 0.25
      }),
      numberControl("radialWobbleSpeed", "Radial Wobble Speed", POLAR_TUNNEL_DEFAULTS.radialWobbleSpeed, {
        min: -8,
        max: 8,
        step: 0.05
      }),
      numberControl("radialWobbleAmount", "Radial Wobble Amt", POLAR_TUNNEL_DEFAULTS.radialWobbleAmount, {
        min: 0,
        max: 0.2,
        step: 0.005
      }),
      numberControl("radialFrequency", "Radial Frequency", POLAR_TUNNEL_DEFAULTS.radialFrequency, { min: 1, max: 80, step: 0.5 }),
      numberControl("angularFrequency", "Angular Frequency", POLAR_TUNNEL_DEFAULTS.angularFrequency, {
        min: 0,
        max: 24,
        step: 0.25
      }),
      numberControl("colorCycles", "Color Cycles", POLAR_TUNNEL_DEFAULTS.colorCycles, { min: 0.5, max: 16, step: 0.1 }),
      numberControl("audioReact", "Audio React", POLAR_TUNNEL_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 })
    ]
  },
  docs: {
    parameters:
      "`rotateSpeed`, `wobbleFrequency`, `wobbleSpeed`, `wobbleAmount`, `radialWobbleFrequency`, `radialWobbleSpeed`, `radialWobbleAmount`, `radialFrequency`, `angularFrequency`, `colorCycles`, `audioReact`",
    catalogNote:
      "Center-relative polar tunnel with angle/radius wobble and a sine palette for demoscene-style concentric motion.",
    description:
      "Center-relative polar tunnel with angle/radius wobble and a sine palette for demoscene-style concentric motion."
  }
});

export default polar_tunnelManifest;
