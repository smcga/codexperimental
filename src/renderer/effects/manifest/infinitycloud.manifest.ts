import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { InfinityCloudEffect } from "../infinityCloudEffect";

export const infinitycloudManifest = defineEffectManifest({
  key: "infinitycloud",
  className: "InfinityCloudEffect",
  sourcePath: "src/renderer/effects/infinityCloudEffect.ts",
  createEffect: () => new InfinityCloudEffect(),
  debug: {
    title: "Infinity Cloud Controls",
    controls: [numberControl("speed", "Speed", 1.0, { min: 0, step: 0.05 })]
  },
  docs: {
    parameters: "`speed`",
    catalogNote: "",
    description: "Infinity Cloud"
  }
});

export default infinitycloudManifest;
