import { SDF_TEXT_DEFAULTS, SdfTextEffect } from "../sdfTextEffect";
import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";

export const sdf_textManifest = defineEffectManifest({
  key: "sdf_text",
  className: "SdfTextEffect",
  sourcePath: "src/renderer/effects/sdfTextEffect.ts",
  createEffect: () => new SdfTextEffect(),
  debug: {
    title: "SDF Text Controls",
    controls: [
      selectControl("text", "Text", SDF_TEXT_DEFAULTS.text, [{ label: "SDF TEXT", value: "SDF TEXT" }]),
      selectControl("fontFamily", "Font Family", SDF_TEXT_DEFAULTS.fontFamily, [{ label: "Arial", value: "Arial, sans-serif" }]),
      selectControl("fontWeight", "Font Weight", SDF_TEXT_DEFAULTS.fontWeight, [{ label: "Bold", value: "700" }]),
      numberControl("fontScale", "Font Scale", SDF_TEXT_DEFAULTS.fontScale, { min: 0.05, max: 0.8, step: 0.01 }),
      numberControl("lineGap", "Line Gap", SDF_TEXT_DEFAULTS.lineGap, { min: 0, max: 0.8, step: 0.01 }),
      selectControl("align", "Align", SDF_TEXT_DEFAULTS.align, [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" }
      ]),
      selectControl("verticalAlign", "Vertical", SDF_TEXT_DEFAULTS.verticalAlign, [
        { label: "Top", value: "top" },
        { label: "Middle", value: "middle" },
        { label: "Bottom", value: "bottom" }
      ]),
      numberControl("offsetX", "Offset X", SDF_TEXT_DEFAULTS.offsetX, { min: -1, max: 1, step: 0.01 }),
      numberControl("offsetY", "Offset Y", SDF_TEXT_DEFAULTS.offsetY, { min: -1, max: 1, step: 0.01 }),
      numberControl("softness", "Softness", SDF_TEXT_DEFAULTS.softness, { min: 0.01, max: 0.6, step: 0.01 }),
      numberControl("outlineWidth", "Outline Width", SDF_TEXT_DEFAULTS.outlineWidth, { min: 0, max: 0.8, step: 0.01 }),
      numberControl("glowWidth", "Glow Width", SDF_TEXT_DEFAULTS.glowWidth, { min: 0, max: 1.3, step: 0.01 }),
      numberControl("fillAlpha", "Fill Alpha", SDF_TEXT_DEFAULTS.fillAlpha, { min: 0, max: 1, step: 0.01 }),
      numberControl("outlineAlpha", "Outline Alpha", SDF_TEXT_DEFAULTS.outlineAlpha, { min: 0, max: 1, step: 0.01 }),
      numberControl("glowAlpha", "Glow Alpha", SDF_TEXT_DEFAULTS.glowAlpha, { min: 0, max: 1, step: 0.01 }),
      selectControl("fillColor", "Fill Color", SDF_TEXT_DEFAULTS.fillColor, [{ label: "White", value: "#ffffff" }]),
      selectControl("outlineColor", "Outline Color", SDF_TEXT_DEFAULTS.outlineColor, [{ label: "Cyan", value: "#7dd3fc" }]),
      selectControl("glowColor", "Glow Color", SDF_TEXT_DEFAULTS.glowColor, [{ label: "Blue", value: "#60a5fa" }]),
      selectControl("shadowColor", "Shadow Color", SDF_TEXT_DEFAULTS.shadowColor, [{ label: "Black", value: "#000000" }]),
      numberControl("pulse", "Pulse", SDF_TEXT_DEFAULTS.pulse, { min: 0, max: 1.5, step: 0.01 }),
      numberControl("wobble", "Wobble", SDF_TEXT_DEFAULTS.wobble, { min: 0, max: 1, step: 0.01 }),
      numberControl("glowPulse", "Glow Pulse", SDF_TEXT_DEFAULTS.glowPulse, { min: 0, max: 2, step: 0.01 }),
      numberControl("outlinePulse", "Outline Pulse", SDF_TEXT_DEFAULTS.outlinePulse, { min: 0, max: 2, step: 0.01 }),
      numberControl("chromaticAberration", "Chromatic", SDF_TEXT_DEFAULTS.chromaticAberration, { min: 0, max: 1, step: 0.01 }),
      numberControl("driftX", "Drift X", SDF_TEXT_DEFAULTS.driftX, { min: -2, max: 2, step: 0.01 }),
      numberControl("driftY", "Drift Y", SDF_TEXT_DEFAULTS.driftY, { min: -2, max: 2, step: 0.01 }),
      numberControl("audioGlow", "Audio Glow", SDF_TEXT_DEFAULTS.audioGlow, { min: 0, max: 2, step: 0.01 }),
      numberControl("audioScale", "Audio Scale", SDF_TEXT_DEFAULTS.audioScale, { min: 0, max: 0.3, step: 0.005 }),
      numberControl("audioOutline", "Audio Outline", SDF_TEXT_DEFAULTS.audioOutline, { min: 0, max: 1, step: 0.01 }),
      numberControl("beatFlash", "Beat Flash", SDF_TEXT_DEFAULTS.beatFlash, { min: 0, max: 1, step: 0.01 }),
      numberControl("fieldResolution", "Field Resolution", SDF_TEXT_DEFAULTS.fieldResolution, { min: 96, max: 512, step: 16 }),
      numberControl("maxFieldResolution", "Max Resolution", SDF_TEXT_DEFAULTS.maxFieldResolution, { min: 128, max: 512, step: 16 }),
      toggleControl("debugField", "Debug Field", SDF_TEXT_DEFAULTS.debugField)
    ]
  },
  docs: {
    parameters:
      "`text`, `fontFamily`, `fontWeight`, `fontScale`, `lineGap`, `align`, `verticalAlign`, `offsetX`, `offsetY`, `softness`, `outlineWidth`, `glowWidth`, `fillAlpha`, `outlineAlpha`, `glowAlpha`, `fillColor`, `outlineColor`, `glowColor`, `shadowColor`, `pulse`, `wobble`, `glowPulse`, `outlinePulse`, `chromaticAberration`, `driftX`, `driftY`, `audioGlow`, `audioScale`, `audioOutline`, `beatFlash`, `fieldResolution`, `maxFieldResolution`, `debugField`",
    catalogNote:
      "Runtime Canvas2D signed-distance-field style text for crisp hero typography with fill/outline/glow shaping and audio-reactive pulses.",
    description:
      "Runtime Canvas2D signed-distance-field style text for crisp hero typography with fill/outline/glow shaping and audio-reactive pulses. Example: {\"id\":\"title-card-sdf\",\"effect\":\"sdf_text\",\"start\":12,\"duration\":6,\"params\":{\"text\":\"BEYOND REALTIME\",\"fontScale\":0.24,\"fillColor\":\"#ffffff\",\"outlineColor\":\"#8b5cf6\",\"glowColor\":\"#22d3ee\",\"glowWidth\":0.28,\"audioGlow\":0.8,\"beatFlash\":0.5}}"
  }
});

export default sdf_textManifest;
