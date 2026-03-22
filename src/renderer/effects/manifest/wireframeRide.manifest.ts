import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { WIREFRAME_RIDE_DEFAULTS, WireframeRideEffect } from "../wireframeRide";

export const wireframeRideManifest = defineEffectManifest({
  key: "wireframeRide",
  className: "WireframeRideEffect",
  sourcePath: "src/renderer/effects/wireframeRide.ts",
  createEffect: () => new WireframeRideEffect(),
  debug: {
    title: "Wireframe Ride (WebGL) Controls",
    controls: [
      numberControl("speed", "Speed", WIREFRAME_RIDE_DEFAULTS.speed, { min: 0.2, max: 3, step: 0.05 }),
      numberControl("gridWidth", "Grid Width", WIREFRAME_RIDE_DEFAULTS.gridWidth, { min: 20, max: 140, step: 1 }),
      numberControl("gridDepth", "Grid Depth", WIREFRAME_RIDE_DEFAULTS.gridDepth, { min: 40, max: 240, step: 1 }),
      numberControl("gridResX", "Grid Res X", WIREFRAME_RIDE_DEFAULTS.gridResX, { min: 40, max: 320, step: 1 }),
      numberControl("gridResZ", "Grid Res Z", WIREFRAME_RIDE_DEFAULTS.gridResZ, { min: 60, max: 360, step: 1 }),
      numberControl("amplitude", "Amplitude", WIREFRAME_RIDE_DEFAULTS.amplitude, { min: 0, max: 18, step: 0.1 }),
      numberControl("noiseFreq", "Noise Freq", WIREFRAME_RIDE_DEFAULTS.noiseFreq, { min: 0.02, max: 0.2, step: 0.01 }),
      numberControl("cameraHeight", "Camera Height", WIREFRAME_RIDE_DEFAULTS.cameraHeight, { min: 2, max: 24, step: 0.5 }),
      numberControl("fov", "FOV", WIREFRAME_RIDE_DEFAULTS.fov, { min: 40, max: 90, step: 1 }),
      numberControl("fog", "Fog", WIREFRAME_RIDE_DEFAULTS.fog, { min: 0, max: 1, step: 0.01 }),
      numberControl("neon", "Neon", WIREFRAME_RIDE_DEFAULTS.neon, { min: 0.4, max: 2.5, step: 0.05 }),
      numberControl("bassReactive", "Bass Reactive", WIREFRAME_RIDE_DEFAULTS.bassReactive, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("rmsReactive", "RMS Reactive", WIREFRAME_RIDE_DEFAULTS.rmsReactive, { min: 0, max: 1.5, step: 0.05 }),
      toggleControl("sun", "Sun", WIREFRAME_RIDE_DEFAULTS.sun === 1)
    ]
  },
  docs: {
    parameters: "`speed`, `gridWidth`, `gridDepth`, `gridResX`, `gridResZ`, `amplitude`, `noiseFreq`, `cameraHeight`, `fov`, `fog`, `neon`, `bassReactive`, `rmsReactive`, `sun`",
    catalogNote: "Falls back to `isogrid` when WebGL2 is unavailable.",
    description: "Falls back to `isogrid` when WebGL2 is unavailable."
  }
});

export default wireframeRideManifest;
