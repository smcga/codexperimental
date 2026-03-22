import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { BlobsEffect } from "../blobsEffect";

export const blobsManifest = defineEffectManifest({
  key: "blobs",
  className: "BlobsEffect",
  sourcePath: "src/renderer/effects/blobsEffect.ts",
  createEffect: () => new BlobsEffect(),
  debug: {
    title: "Blobs Controls",
    controls: [
      numberControl("count", "Count", 6, { min: 1, max: 12, step: 1 }),
      numberControl("radius", "Radius", 0.12, { min: 0.05, max: 0.3, step: 0.01 }),
      numberControl("orbit", "Orbit", 0.25, { min: 0, max: 0.6, step: 0.01 }),
      numberControl("speed", "Speed", 0.6, { min: 0, step: 0.05 }),
      numberControl("glow", "Glow", 0.8, { min: 0, max: 1.5, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`count`, `radius`, `orbit`, `speed`, `glow`",
    catalogNote: "",
    description: "Blobs"
  }
});

export default blobsManifest;
