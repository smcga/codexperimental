import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { DOT_TUNNEL_DEFAULTS, DotTunnelEffect } from "../dotTunnel";

export const dotTunnelManifest = defineEffectManifest({
  key: "dotTunnel",
  className: "DotTunnelEffect",
  sourcePath: "src/renderer/effects/dotTunnel.ts",
  createEffect: () => new DotTunnelEffect(),
  debug: {
    title: "Dot Tunnel Controls",
    controls: [
      numberControl("ringCount", "Ring Count", DOT_TUNNEL_DEFAULTS.ringCount, { min: 8, max: 180, step: 1 }),
      numberControl("dotsPerRing", "Dots Per Ring", DOT_TUNNEL_DEFAULTS.dotsPerRing, { min: 6, max: 160, step: 1 }),
      numberControl("fov", "FOV", DOT_TUNNEL_DEFAULTS.fov, { min: 40, max: 125, step: 1 }),
      numberControl("speed", "Speed", DOT_TUNNEL_DEFAULTS.speed, { min: 0.05, max: 3.5, step: 0.05 }),
      numberControl("twist", "Twist", DOT_TUNNEL_DEFAULTS.twist, { min: -4, max: 4, step: 0.05 }),
      numberControl("palette", "Palette", DOT_TUNNEL_DEFAULTS.palette, { min: 0, max: 12, step: 1 }),
      numberControl("glow", "Glow", DOT_TUNNEL_DEFAULTS.glow, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("seed", "Seed", DOT_TUNNEL_DEFAULTS.seed, { min: 0, max: 9999, step: 1 })
    ]
  },
  docs: {
    parameters: "`ringCount`, `dotsPerRing`, `fov`, `speed`, `twist`, `palette`, `glow`, `seed`",
    catalogNote: "Depth-sorted sprite/ring tunnel; `palette` selects built-in color ramps.",
    description: "Depth-sorted sprite/ring tunnel; `palette` selects built-in color ramps."
  }
});

export default dotTunnelManifest;
