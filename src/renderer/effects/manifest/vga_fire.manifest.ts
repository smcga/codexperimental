import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { VgaFireEffect } from "../vgaFire";

export const vga_fireManifest = defineEffectManifest({
  key: "vga_fire",
  className: "VgaFireEffect",
  sourcePath: "src/renderer/effects/vgaFire.ts",
  createEffect: () => new VgaFireEffect(),
  debug: {
    title: "VGA Fire Controls",
    controls: [
      numberControl("fireW", "Fire Width", 160, { min: 40, max: 400, step: 1 }),
      numberControl("fireH", "Fire Height", 120, { min: 40, max: 300, step: 1 }),
      numberControl("stepsPerFrame", "Steps / frame", 1, { min: 1, max: 4, step: 1 }),
      numberControl("baseHeat", "Base Heat", 160, { min: 0, max: 255, step: 1 }),
      numberControl("sparkChance", "Spark Chance", 0.55, { min: 0, max: 1, step: 0.01 }),
      numberControl("decay", "Decay", 3, { min: 1, max: 8, step: 1 }),
      numberControl("wind", "Wind", 0, { min: -1, max: 1, step: 0.01 }),
      numberControl("windWave", "Wind Wave", 0.6, { min: 0, max: 2, step: 0.01 }),
      numberControl("turbulence", "Turbulence", 1.2, { min: 0, max: 3, step: 0.01 }),
      numberControl("gustOnBeat", "Gust on Beat", 0.8, { min: 0, max: 1, step: 0.01 }),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.05 }),
      selectControl("logoText", "Logo Text", "SMCGA", [
        { label: "SMCGA", value: "SMCGA" },
        { label: "FIRE", value: "FIRE" },
        { label: "OFF", value: "" }
      ]),
      numberControl("logoSize", "Logo Size", 48, { min: 10, max: 160, step: 1 }),
      numberControl("logoY", "Logo Y", 0),
      numberControl("scanlines", "Scanlines", 0.25, { min: 0, max: 1, step: 0.01 }),
      numberControl("glowStrength", "Glow Strength", 0.3, { min: 0, max: 2, step: 0.01 })
    ]
  },
  docs: {
    parameters: "`fireW`, `fireH`, `stepsPerFrame`, `baseHeat`, `sparkChance`, `decay`, `wind`, `windWave`, `turbulence`, `gustOnBeat`, `logoText`, `logoSize`, `logoY`, `audioReact`, `scanlines`, `glowStrength`",
    catalogNote: "Classic VGA/DOS fire with optional logo mask.",
    description: "Classic VGA/DOS fire with optional logo mask."
  }
});

export default vga_fireManifest;
