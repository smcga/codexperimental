import { SKYBOX_TRANSITION_DEFAULTS, SkyboxTransitionEffect } from "../skyboxTransition";
import { defineEffectManifest, numberControl, toggleControl } from "./shared";

export const skyboxTransitionManifest = defineEffectManifest({
  key: "skyboxTransition",
  className: "SkyboxTransitionEffect",
  sourcePath: "src/renderer/effects/skyboxTransition.ts",
  createEffect: () => new SkyboxTransitionEffect(),
  debug: {
    title: "Skybox Transition Controls",
    controls: [
      numberControl("speed", "Speed", SKYBOX_TRANSITION_DEFAULTS.speed, { min: 0.05, max: 3, step: 0.05 }),
      numberControl("intensity", "Intensity", SKYBOX_TRANSITION_DEFAULTS.intensity, { min: 0.3, max: 1.8, step: 0.05 }),
      numberControl("horizon", "Horizon", SKYBOX_TRANSITION_DEFAULTS.horizon, { min: 0.3, max: 0.85, step: 0.01 }),
      numberControl("cloudAmount", "Cloud Amount", SKYBOX_TRANSITION_DEFAULTS.cloudAmount, { min: 0, max: 1.2, step: 0.05 }),
      numberControl("starAmount", "Star Amount", SKYBOX_TRANSITION_DEFAULTS.starAmount, { min: 0, max: 1.2, step: 0.05 }),
      numberControl("silhouetteAmount", "Silhouette Amount", SKYBOX_TRANSITION_DEFAULTS.silhouetteAmount, { min: 0, max: 1.2, step: 0.05 }),
      numberControl("surrealness", "Surrealness", SKYBOX_TRANSITION_DEFAULTS.surrealness, { min: 0, max: 1.4, step: 0.05 }),
      numberControl("audioReactive", "Audio Reactive", SKYBOX_TRANSITION_DEFAULTS.audioReactive, { min: 0, max: 1, step: 0.05 }),
      toggleControl("loop", "Loop", SKYBOX_TRANSITION_DEFAULTS.loop),
      numberControl("phaseOffset", "Phase Offset", SKYBOX_TRANSITION_DEFAULTS.phaseOffset, { min: -1, max: 1, step: 0.01 })
    ]
  },
  docs: {
    parameters:
      "`speed`, `intensity`, `horizon`, `cloudAmount`, `starAmount`, `silhouetteAmount`, `surrealness`, `audioReactive`, `loop`, `phaseOffset`",
    catalogNote:
      "Evolving panoramic skybox backdrop that glides from day to surreal night with layered haze, silhouettes, and late-phase stars.",
    description:
      "Evolving panoramic skybox backdrop that glides from day to surreal night with layered haze, silhouettes, and late-phase stars."
  }
});

export default skyboxTransitionManifest;
