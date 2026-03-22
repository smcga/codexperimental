import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { DEFAULT_FLYOVER_PARAMS, coerceFlyoverParams } from "../../debug/flyoverDebug";
import { FlyoverEffect } from "../flyoverEffect";

export const flyoverManifest = defineEffectManifest({
  key: "flyover",
  className: "FlyoverEffect",
  sourcePath: "src/renderer/effects/flyoverEffect.ts",
  createEffect: () => new FlyoverEffect(),
  debug: {
    title: "Flyover Controls",
    controls: [
      numberControl("speed", "Speed", DEFAULT_FLYOVER_PARAMS.speed, { min: 0, step: 0.05 }),
      numberControl("horizon", "Horizon", DEFAULT_FLYOVER_PARAMS.horizon, { min: 0, max: 1, step: 0.01 }),
      numberControl("seaDetail", "Sea Detail", DEFAULT_FLYOVER_PARAMS.seaDetail, { min: 0.5, step: 0.1 }),
      numberControl("waveSpeed", "Wave Speed", DEFAULT_FLYOVER_PARAMS.waveSpeed, { min: 0, step: 0.05 }),
      numberControl("waveIntensity", "Wave Intensity", DEFAULT_FLYOVER_PARAMS.waveIntensity, { min: 0, step: 0.05 }),
      numberControl("islandCount", "Island Count", DEFAULT_FLYOVER_PARAMS.islandCount, { min: 1, step: 1 }),
      numberControl("islandSeed", "Island Seed", DEFAULT_FLYOVER_PARAMS.islandSeed, { step: 1 }),
      numberControl("fog", "Fog", DEFAULT_FLYOVER_PARAMS.fog, { min: 0, max: 1, step: 0.05 }),
      selectControl("palette", "Palette", DEFAULT_FLYOVER_PARAMS.palette, [
        { label: "Day", value: "day" },
        { label: "Sunset", value: "sunset" },
        { label: "Night", value: "night" }
      ]),
      numberControl("audioReactive", "Audio Reactive", DEFAULT_FLYOVER_PARAMS.audioReactive, {
        min: 0,
        max: 1,
        step: 0.05
      })
    ]
  },
  defaults: () => ({ ...DEFAULT_FLYOVER_PARAMS }),
  coerceParams: (overrides) => coerceFlyoverParams(overrides as Partial<typeof DEFAULT_FLYOVER_PARAMS>) as Record<string, number | string>,
  docs: {
    parameters: "`speed`, `horizon`, `seaDetail`, `waveSpeed`, `waveIntensity`, `islandCount`, `islandSeed`, `fog`, `palette`, `audioReactive`",
    catalogNote: "`palette` supports `day`, `sunset`, `night`.",
    description: "`palette` supports `day`, `sunset`, `night`."
  }
});

export default flyoverManifest;
