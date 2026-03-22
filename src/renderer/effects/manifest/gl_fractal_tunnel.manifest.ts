import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { FractalTunnelEffect } from "../gl/fractalTunnelEffect";

export const gl_fractal_tunnelManifest = defineEffectManifest({
  key: "gl_fractal_tunnel",
  className: "FractalTunnelEffect",
  sourcePath: "src/renderer/effects/gl/fractalTunnelEffect.ts",
  createEffect: () => new FractalTunnelEffect(),
  debug: {
    title: "Fractal Tunnel (WebGL) Controls",
    controls: [
      numberControl("quality", "Quality", 2, { min: 1, max: 3, step: 1 }),
      numberControl("warp", "Warp", 1.1, { min: 0, max: 2, step: 0.05 }),
      numberControl("hueShift", "Hue Shift", 0.15, { min: 0, max: 1, step: 0.01 }),
      numberControl("exposure", "Exposure", 1.2, { min: 0.5, max: 2, step: 0.05 }),
      numberControl("seed", "Seed", 7, { step: 1 })
    ]
  },
  docs: {
    parameters: "`quality`, `warp`, `hueShift`, `exposure`, `seed`",
    catalogNote: "Falls back to `tunnel` when WebGL2 is unavailable.",
    description: "Falls back to `tunnel` when WebGL2 is unavailable."
  }
});

export default gl_fractal_tunnelManifest;
