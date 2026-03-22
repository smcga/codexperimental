import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { ExplicitPixelsEffect } from "../explicitPixelsEffect";

export const explicitpixelsManifest = defineEffectManifest({
  key: "explicitpixels",
  className: "ExplicitPixelsEffect",
  sourcePath: "src/renderer/effects/explicitPixelsEffect.ts",
  createEffect: () => new ExplicitPixelsEffect(),
  debug: {
    title: "Explicit Pixels Controls",
    controls: [
      selectControl("mode", "Mode", "explicit", [
        { label: "Explicit", value: "explicit" },
        { label: "Procedural", value: "procedural" }
      ]),
      numberControl("speed", "Speed", 1, { min: 0, max: 3, step: 0.05 }),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 2, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`mode`, `speed`, `audioReact`",
    catalogNote: "`mode` supports `explicit` (generated wall of byte assignments) or `procedural` (loop-driven animation).",
    description: "`mode` supports `explicit` (generated wall of byte assignments) or `procedural` (loop-driven animation)."
  }
});

export default explicitpixelsManifest;
