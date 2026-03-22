import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { TunnelEffect } from "../tunnelEffect";

export const tunnelManifest = defineEffectManifest({
  key: "tunnel",
  className: "TunnelEffect",
  sourcePath: "src/renderer/effects/tunnelEffect.ts",
  createEffect: () => new TunnelEffect(),
  debug: {
    title: "Tunnel Controls",
    controls: [numberControl("speed", "Speed", 1.1, { min: 0, step: 0.05 })]
  },
  docs: {
    parameters: "`speed`",
    catalogNote: "",
    description: "Tunnel"
  }
});

export default tunnelManifest;
