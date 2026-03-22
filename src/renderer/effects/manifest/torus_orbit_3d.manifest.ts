import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { TORUS_ORBIT_3D_DEFAULTS, TorusOrbit3dEffect } from "../torusOrbit3d";

export const torus_orbit_3dManifest = defineEffectManifest({
  key: "torus_orbit_3d",
  className: "TorusOrbit3dEffect",
  sourcePath: "src/renderer/effects/torusOrbit3d.ts",
  createEffect: () => new TorusOrbit3dEffect(),
  debug: {
    title: "Torus Orbit 3D Controls",
    controls: [
      numberControl("ringCount", "Ring Count", TORUS_ORBIT_3D_DEFAULTS.ringCount, { min: 3, max: 24, step: 1 }),
      numberControl("pointsPerRing", "Points Per Ring", TORUS_ORBIT_3D_DEFAULTS.pointsPerRing, { min: 8, max: 240, step: 1 }),
      numberControl("majorRadius", "Major Radius", TORUS_ORBIT_3D_DEFAULTS.majorRadius, { min: 0.2, max: 1.8, step: 0.01 }),
      numberControl("minorRadius", "Minor Radius", TORUS_ORBIT_3D_DEFAULTS.minorRadius, { min: 0.05, max: 1.2, step: 0.01 }),
      numberControl("spinSpeed", "Spin Speed", TORUS_ORBIT_3D_DEFAULTS.spinSpeed, { min: -4, max: 4, step: 0.05 }),
      numberControl("wobbleSpeed", "Wobble Speed", TORUS_ORBIT_3D_DEFAULTS.wobbleSpeed, { min: -3, max: 3, step: 0.05 }),
      numberControl("depth", "Depth", TORUS_ORBIT_3D_DEFAULTS.depth, { min: 2, max: 8, step: 0.05 }),
      numberControl("glow", "Glow", TORUS_ORBIT_3D_DEFAULTS.glow, { min: 0, max: 1, step: 0.05 }),
      selectControl("palette", "Palette", TORUS_ORBIT_3D_DEFAULTS.palette, [
        { label: "Teal", value: "teal" },
        { label: "Violet", value: "violet" },
        { label: "Amber", value: "amber" }
      ]),
      numberControl("audioReact", "Audio React", TORUS_ORBIT_3D_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`ringCount`, `pointsPerRing`, `majorRadius`, `minorRadius`, `spinSpeed`, `wobbleSpeed`, `depth`, `glow`, `palette`, `audioReact`",
    catalogNote: "Orbiting 3D torus points; `palette` supports `teal`, `violet`, or `amber`.",
    description: "Orbiting 3D torus points; `palette` supports `teal`, `violet`, or `amber`."
  }
});

export default torus_orbit_3dManifest;
