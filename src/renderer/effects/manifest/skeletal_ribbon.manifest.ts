import { SkeletalRibbonEffect, SKELETAL_RIBBON_DEFAULTS } from "../skeletalRibbon";
import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";

export const skeletal_ribbonManifest = defineEffectManifest({
  key: "skeletal_ribbon",
  className: "SkeletalRibbonEffect",
  sourcePath: "src/renderer/effects/skeletalRibbon.ts",
  createEffect: () => new SkeletalRibbonEffect(),
  debug: {
    title: "Skeletal Ribbon Controls",
    controls: [
      numberControl("boneCount", "Bone Count", SKELETAL_RIBBON_DEFAULTS.boneCount, { min: 8, max: 32, step: 1 }),
      numberControl("length", "Length", SKELETAL_RIBBON_DEFAULTS.length, { min: 80, max: 700, step: 1 }),
      numberControl("thickness", "Thickness", SKELETAL_RIBBON_DEFAULTS.thickness, { min: 2, max: 56, step: 0.5 }),
      numberControl("waveAmp", "Wave Amp", SKELETAL_RIBBON_DEFAULTS.waveAmp, { min: 0, max: 2, step: 0.01 }),
      numberControl("waveFreq", "Wave Freq", SKELETAL_RIBBON_DEFAULTS.waveFreq, { min: 0.05, max: 6, step: 0.01 }),
      numberControl("stiffness", "Stiffness", SKELETAL_RIBBON_DEFAULTS.stiffness, { min: 0.05, max: 1, step: 0.01 }),
      numberControl("audioInfluence", "Audio Influence", SKELETAL_RIBBON_DEFAULTS.audioInfluence, { min: 0, max: 2, step: 0.01 }),
      selectControl("colorMode", "Color Mode", SKELETAL_RIBBON_DEFAULTS.colorMode, [
        { label: "Mono", value: "mono" },
        { label: "Gradient", value: "gradient" }
      ]),
      numberControl("hueShift", "Hue Shift", SKELETAL_RIBBON_DEFAULTS.hueShift, { min: -1, max: 1, step: 0.01 }),
      numberControl("glow", "Glow", SKELETAL_RIBBON_DEFAULTS.glow, { min: 0, max: 1, step: 0.01 }),
      toggleControl("debugSkeleton", "Debug Skeleton", SKELETAL_RIBBON_DEFAULTS.debugSkeleton)
    ]
  },
  docs: {
    parameters:
      "`boneCount`, `length`, `thickness`, `waveAmp`, `waveFreq`, `stiffness`, `audioInfluence`, `colorMode`, `hueShift`, `glow`, `debugSkeleton`",
    catalogNote: "Articulated spine/tentacle ribbon driven by chained bone kinematics with beat-reactive pulse thickness.",
    description: "Articulated spine/tentacle ribbon driven by chained bone kinematics with beat-reactive pulse thickness."
  }
});

export default skeletal_ribbonManifest;
