import { SpectrumAnalyzerEffect } from "../spectrumAnalyzerEffect";
import { defineEffectManifest, numberControl } from "./shared";

export const spectrum_analyzerManifest = defineEffectManifest({
  key: "spectrum_analyzer",
  className: "SpectrumAnalyzerEffect",
  sourcePath: "src/renderer/effects/spectrumAnalyzerEffect.ts",
  createEffect: () => new SpectrumAnalyzerEffect(),
  debug: {
    title: "Spectrum Analyzer Controls",
    controls: [
      numberControl("bands", "Bands", 96, { min: 24, max: 192, step: 1 }),
      numberControl("smoothing", "Smoothing", 0.72, { min: 0, max: 0.95, step: 0.01 }),
      numberControl("curve", "Curve", 1.18, { min: 0.4, max: 2.5, step: 0.01 }),
      numberControl("tilt", "Tilt", 0.18, { min: -1, max: 1, step: 0.01 }),
      numberControl("peakHold", "Peak Hold", 0.78, { min: 0, max: 1, step: 0.01 }),
      numberControl("grid", "Grid", 0.55, { min: 0, max: 1, step: 0.01 }),
      numberControl("glow", "Glow", 0.85, { min: 0, max: 1, step: 0.01 })
    ]
  },
  docs: {
    parameters: "`bands`, `smoothing`, `curve`, `tilt`, `peakHold`, `grid`, `glow`",
    catalogNote: "Parametric-EQ-style spectrum trace with log-spaced bins and peak-hold markers.",
    description: "Parametric-EQ-style spectrum analyzer"
  }
});

export default spectrum_analyzerManifest;
