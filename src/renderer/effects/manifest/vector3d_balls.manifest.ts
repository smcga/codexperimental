import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { VECTOR3D_BALLS_DEFAULTS, Vector3dBallsEffect } from "../vector3dBalls";

export const vector3d_ballsManifest = defineEffectManifest({
  key: "vector3d_balls",
  className: "Vector3dBallsEffect",
  sourcePath: "src/renderer/effects/vector3dBalls.ts",
  createEffect: () => new Vector3dBallsEffect(),
  debug: {
    title: "Vector 3D Balls Controls",
    controls: [
      selectControl("model", "Model", VECTOR3D_BALLS_DEFAULTS.model, [
        { label: "Cube", value: "cube" },
        { label: "Sphere", value: "sphere" },
        { label: "Torus", value: "torus" }
      ]),
      numberControl("pointCount", "Point Count", VECTOR3D_BALLS_DEFAULTS.pointCount, { min: 80, max: 2000, step: 1 }),
      toggleControl("wireframe", "Wireframe", VECTOR3D_BALLS_DEFAULTS.wireframe > 0),
      toggleControl("roundDots", "Round Dots", VECTOR3D_BALLS_DEFAULTS.roundDots > 0),
      numberControl("baseDotSize", "Base Dot Size", VECTOR3D_BALLS_DEFAULTS.baseDotSize, { min: 0.5, max: 6, step: 0.1 }),
      numberControl("dotDepthScale", "Dot Depth Scale", VECTOR3D_BALLS_DEFAULTS.dotDepthScale, { min: 0, max: 6, step: 0.1 }),
      numberControl("lineWidth", "Line Width", VECTOR3D_BALLS_DEFAULTS.lineWidth, { min: 0.5, max: 6, step: 0.1 }),
      numberControl("camDist", "Camera Distance", VECTOR3D_BALLS_DEFAULTS.camDist, { min: 2.4, max: 6, step: 0.05 }),
      numberControl("rotXSpeed", "Rot X Speed", VECTOR3D_BALLS_DEFAULTS.rotXSpeed, { min: 0, max: 2.5, step: 0.05 }),
      numberControl("rotYSpeed", "Rot Y Speed", VECTOR3D_BALLS_DEFAULTS.rotYSpeed, { min: 0, max: 2.5, step: 0.05 }),
      numberControl("rotZSpeed", "Rot Z Speed", VECTOR3D_BALLS_DEFAULTS.rotZSpeed, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("trail", "Trail", VECTOR3D_BALLS_DEFAULTS.trail, { min: 0, max: 0.85, step: 0.01 }),
      numberControl("stripeFreq", "Stripe Freq", VECTOR3D_BALLS_DEFAULTS.stripeFreq, { min: 1, max: 14, step: 0.1 }),
      numberControl("stripeSpeed", "Stripe Speed", VECTOR3D_BALLS_DEFAULTS.stripeSpeed, { min: -2, max: 2, step: 0.05 }),
      numberControl("stripeStrength", "Stripe Strength", VECTOR3D_BALLS_DEFAULTS.stripeStrength, { min: 0, max: 1, step: 0.05 }),
      selectControl("palette", "Palette", VECTOR3D_BALLS_DEFAULTS.palette, [
        { label: "C64", value: "c64" },
        { label: "Spectrum", value: "spectrum" },
        { label: "Rainbow", value: "rainbow" }
      ]),
      numberControl("audioReact", "Audio React", VECTOR3D_BALLS_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", VECTOR3D_BALLS_DEFAULTS.beatKick, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", VECTOR3D_BALLS_DEFAULTS.seed, { min: 0, max: 9999, step: 1 })
    ]
  },
  docs: {
    parameters: "`model`, `pointCount`, `wireframe`, `roundDots`, `baseDotSize`, `dotDepthScale`, `lineWidth`, `camDist`, `rotXSpeed`, `rotYSpeed`, `rotZSpeed`, `trail`, `stripeFreq`, `stripeSpeed`, `stripeStrength`, `palette`, `audioReact`, `beatKick`, `seed`",
    catalogNote: "`model` supports `cube`, `sphere`, `torus`. `palette` supports `c64`, `spectrum`, `rainbow`.",
    description: "`model` supports `cube`, `sphere`, `torus`. `palette` supports `c64`, `spectrum`, `rainbow`."
  }
});

export default vector3d_ballsManifest;
