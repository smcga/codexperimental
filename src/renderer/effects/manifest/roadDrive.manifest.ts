import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { ROAD_DRIVE_DEFAULTS, RoadDriveEffect } from "../roadDrive";

export const roadDriveManifest = defineEffectManifest({
  key: "roadDrive",
  className: "RoadDriveEffect",
  sourcePath: "src/renderer/effects/roadDrive.ts",
  createEffect: () => new RoadDriveEffect(),
  debug: {
    title: "Road Drive (WebGL) Controls",
    controls: [
      numberControl("speed", "Speed", ROAD_DRIVE_DEFAULTS.speed, { min: 0.2, max: 3.2, step: 0.05 }),
      numberControl("roadWidth", "Road Width", ROAD_DRIVE_DEFAULTS.roadWidth, { min: 4, max: 20, step: 0.25 }),
      numberControl("laneDashLength", "Lane Dash Length", ROAD_DRIVE_DEFAULTS.laneDashLength, { min: 0.4, max: 10, step: 0.1 }),
      numberControl("laneGap", "Lane Gap", ROAD_DRIVE_DEFAULTS.laneGap, { min: 0.2, max: 10, step: 0.1 }),
      numberControl("fog", "Fog", ROAD_DRIVE_DEFAULTS.fog, { min: 0, max: 1, step: 0.01 }),
      numberControl("glow", "Glow", ROAD_DRIVE_DEFAULTS.glow, { min: 0.1, max: 2.5, step: 0.05 }),
      numberControl("cameraBob", "Camera Bob", ROAD_DRIVE_DEFAULTS.cameraBob, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("curveStrength", "Curve Strength", ROAD_DRIVE_DEFAULTS.curveStrength, { min: 0, max: 6, step: 0.05 }),
      numberControl("curveFrequency", "Curve Frequency", ROAD_DRIVE_DEFAULTS.curveFrequency, { min: 0.015, max: 0.2, step: 0.005 }),
      numberControl("bassReactive", "Bass Reactive", ROAD_DRIVE_DEFAULTS.bassReactive, { min: 0, max: 2, step: 0.05 }),
      numberControl("rmsReactive", "RMS Reactive", ROAD_DRIVE_DEFAULTS.rmsReactive, { min: 0, max: 2, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`speed`, `roadWidth`, `laneDashLength`, `laneGap`, `fog`, `glow`, `cameraBob`, `curveStrength`, `curveFrequency`, `bassReactive`, `rmsReactive`",
    catalogNote: "Falls back to `isogrid` when WebGL2 is unavailable.",
    description: "Falls back to `isogrid` when WebGL2 is unavailable."
  }
});

export default roadDriveManifest;
