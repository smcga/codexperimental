import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { RasterBarsEffect } from "../rasterBars";

export const raster_barsManifest = defineEffectManifest({
  key: "raster_bars",
  className: "RasterBarsEffect",
  sourcePath: "src/renderer/effects/rasterBars.ts",
  createEffect: () => new RasterBarsEffect(),
  debug: {
    title: "Raster Bars Controls",
    controls: [
      numberControl("barCount", "Bar Count", 6, { min: 1, max: 24, step: 1 }),
      numberControl("barThickness", "Bar Thickness", 26, { min: 1, max: 120, step: 1 }),
      numberControl("speed", "Speed", 0.9, { min: 0, max: 4, step: 0.05 }),
      numberControl("waveAmp", "Wave Amp", 16, { min: 0, max: 120, step: 1 }),
      numberControl("waveFreq", "Wave Freq", 2.5, { min: 0, max: 16, step: 0.1 }),
      numberControl("splitStrength", "Split Strength", 0.65, { min: 0, max: 1, step: 0.05 }),
      numberControl("scanlineStep", "Scanline Step", 2, { min: 1, max: 6, step: 1 }),
      numberControl("audioReact", "Audio React", 0.7, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatThump", "Beat Thump", 0.6, { min: 0, max: 1, step: 0.05 }),
      numberControl("border", "Border", 0, { min: 0, max: 1, step: 1 }),
      numberControl("borderSize", "Border Size", 0.08, { min: 0, max: 0.5, step: 0.01 }),
      numberControl("orientation", "Orientation", 0, { min: 0, max: 1, step: 1 }),
      numberControl("palette", "Palette", 0, { min: 0, max: 8, step: 1 })
    ]
  },
  docs: {
    parameters: "`orientation`, `barCount`, `barThickness`, `speed`, `waveAmp`, `waveFreq`, `splitStrength`, `scanlineStep`, `border`, `borderSize`, `palette`, `audioReact`, `beatThump`",
    catalogNote: "`orientation` supports `horizontal` or `vertical`; `palette` supports `c64`, `atari`, `spectrum`, or `rainbow`.",
    description: "`orientation` supports `horizontal` or `vertical`; `palette` supports `c64`, `atari`, `spectrum`, or `rainbow`."
  }
});

export default raster_barsManifest;
