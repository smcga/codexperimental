import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { TwisterEffect } from "../twister";

export const twisterManifest = defineEffectManifest({
  key: "twister",
  className: "TwisterEffect",
  sourcePath: "src/renderer/effects/twister.ts",
  createEffect: () => new TwisterEffect(),
  debug: {
    title: "Twister Controls",
    controls: [
      numberControl("x", "Center X (0-1 or px)", 0.5, { min: 0, max: 1, step: 0.01 }),
      numberControl("baseWidth", "Base Width", 220, { min: 40, max: 600, step: 5 }),
      numberControl("amplitude", "Amplitude", 90, { min: 0, max: 240, step: 5 }),
      numberControl("turns", "Turns", 3, { min: 0.5, max: 8, step: 0.1 }),
      numberControl("speed", "Speed", 2.2, { min: 0, max: 6, step: 0.05 }),
      numberControl("sliceH", "Slice Height", 2, { min: 1, max: 8, step: 1 }),
      numberControl("sat", "Saturation", 90, { min: 0, max: 100, step: 1 }),
      numberControl("hueSpeed", "Hue Speed", 55, { min: 0, max: 180, step: 1 }),
      numberControl("minWidthScale", "Min Width Scale", 0.55, { min: 0.1, max: 1, step: 0.01 }),
      numberControl("maxWidthScale", "Max Width Scale", 1.0, { min: 0.1, max: 1.5, step: 0.01 }),
      numberControl("minAlpha", "Min Alpha", 0.25, { min: 0.05, max: 1, step: 0.01 }),
      numberControl("maxAlpha", "Max Alpha", 0.95, { min: 0.05, max: 1, step: 0.01 }),
      numberControl("edgeShade", "Edge Shade", 0.35, { min: 0, max: 1, step: 0.01 }),
      selectControl("background", "Background", "clear", [
        { label: "Clear", value: "clear" },
        { label: "Fade", value: "fade" }
      ]),
      numberControl("trailFade", "Trail Fade", 0.08, { min: 0, max: 0.3, step: 0.01 }),
      selectControl("texture", "Texture", "solid", [
        { label: "Solid", value: "solid" },
        { label: "Pattern", value: "pattern" }
      ]),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", 0.7, { min: 0, max: 1, step: 0.05 })
          ]
  },
  docs: {
    parameters: "`x`, `baseWidth`, `amplitude`, `turns`, `speed`, `sliceH`, `sat`, `hueSpeed`, `minWidthScale`, `maxWidthScale`, `minAlpha`, `maxAlpha`, `edgeShade`, `background`, `trailFade`, `texture`, `audioReact`, `beatKick`",
    catalogNote: "`x` accepts pixels or normalized 0-1; `background` supports `clear` or `fade`; `texture` supports `solid` or `pattern`.",
    description: "`x` accepts pixels or normalized 0-1; `background` supports `clear` or `fade`; `texture` supports `solid` or `pattern`."
  }
});

export default twisterManifest;
