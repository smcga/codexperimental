import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type SpectrumAnalyzerParams = {
  bands: number;
  smoothing: number;
  curve: number;
  tilt: number;
  peakHold: number;
  grid: number;
  glow: number;
};

export const SPECTRUM_ANALYZER_DEFAULTS = {
  bands: 96,
  smoothing: 0.72,
  curve: 1.18,
  tilt: 0.18,
  peakHold: 0.78,
  grid: 0.55,
  glow: 0.85
} as const;

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const resolveSpectrumAnalyzerParams = (params: Record<string, unknown>): SpectrumAnalyzerParams => ({
  bands: clamp(Math.round(toNumber(params.bands, SPECTRUM_ANALYZER_DEFAULTS.bands)), 24, 192),
  smoothing: clamp(toNumber(params.smoothing, SPECTRUM_ANALYZER_DEFAULTS.smoothing), 0, 0.95),
  curve: clamp(toNumber(params.curve, SPECTRUM_ANALYZER_DEFAULTS.curve), 0.4, 2.5),
  tilt: clamp(toNumber(params.tilt, SPECTRUM_ANALYZER_DEFAULTS.tilt), -1, 1),
  peakHold: clamp(toNumber(params.peakHold, SPECTRUM_ANALYZER_DEFAULTS.peakHold), 0, 1),
  grid: clamp(toNumber(params.grid, SPECTRUM_ANALYZER_DEFAULTS.grid), 0, 1),
  glow: clamp(toNumber(params.glow, SPECTRUM_ANALYZER_DEFAULTS.glow), 0, 1)
});

const averageRange = (values: Uint8Array, start: number, end: number): number => {
  let sum = 0;
  let count = 0;
  for (let i = start; i <= end; i += 1) {
    sum += values[i] ?? 0;
    count += 1;
  }
  return count > 0 ? sum / count / 255 : 0;
};

export class SpectrumAnalyzerEffect implements Effect {
  private peaks: number[] = [];

  reset(): void {
    this.peaks = [];
  }

  render({ ctx, width, height, delta, audio, params }: EffectRenderContext): void {
    const config = resolveSpectrumAnalyzerParams(params as Record<string, unknown>);
    const insetX = width * 0.06;
    const insetTop = height * 0.08;
    const insetBottom = height * 0.12;
    const usableWidth = Math.max(1, width - insetX * 2);
    const usableHeight = Math.max(1, height - insetTop - insetBottom);

    ctx.fillStyle = "rgb(3, 7, 18)";
    ctx.fillRect(0, 0, width, height);

    const gridAlpha = (0.08 + config.grid * 0.2).toFixed(3);
    ctx.fillStyle = `rgba(120, 190, 255, ${gridAlpha})`;
    for (let row = 0; row <= 5; row += 1) {
      const y = insetTop + (usableHeight * row) / 5;
      ctx.fillRect(insetX, y, usableWidth, 1);
    }
    for (let column = 0; column <= 8; column += 1) {
      const x = insetX + (usableWidth * column) / 8;
      ctx.fillRect(x, insetTop, 1, usableHeight);
    }

    const spectrum = new Array<number>(config.bands).fill(0);
    const logMin = Math.log(1);
    const logMax = Math.log(audio.frequency.length);
    let smoothed = 0;

    for (let i = 0; i < config.bands; i += 1) {
      const startT = i / config.bands;
      const endT = (i + 1) / config.bands;
      const startIndex = clamp(Math.floor(Math.exp(logMin + (logMax - logMin) * startT)) - 1, 0, audio.frequency.length - 1);
      const endIndex = clamp(Math.ceil(Math.exp(logMin + (logMax - logMin) * endT)) - 1, startIndex, audio.frequency.length - 1);
      const raw = averageRange(audio.frequency, startIndex, endIndex);
      smoothed = smoothed * config.smoothing + raw * (1 - config.smoothing);

      const normX = i / Math.max(1, config.bands - 1);
      const tiltGain = 1 + config.tilt * (0.85 - normX * 1.1);
      const emphasis = 1 + audio.bass * (1 - normX) * 0.25 + audio.treble * normX * 0.18 + audio.mid * 0.08;
      spectrum[i] = clamp(Math.pow(clamp(smoothed * tiltGain * emphasis, 0, 1), config.curve), 0, 1);
    }

    if (this.peaks.length !== config.bands) {
      this.peaks = new Array<number>(config.bands).fill(0);
    }

    const peakDecay = delta * (0.18 + (1 - config.peakHold) * 2.2);
    for (let i = 0; i < config.bands; i += 1) {
      this.peaks[i] = Math.max(spectrum[i], this.peaks[i] - peakDecay);
    }

    ctx.beginPath();
    ctx.moveTo(insetX, height - insetBottom);
    for (let i = 0; i < config.bands; i += 1) {
      const x = insetX + (usableWidth * i) / Math.max(1, config.bands - 1);
      const y = insetTop + (1 - spectrum[i]) * usableHeight;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width - insetX, height - insetBottom);
    ctx.closePath();
    ctx.fillStyle = `rgba(60, 210, 255, ${(0.18 + config.glow * 0.18 + audio.rms * 0.12).toFixed(3)})`;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < config.bands; i += 1) {
      const x = insetX + (usableWidth * i) / Math.max(1, config.bands - 1);
      const y = insetTop + (1 - spectrum[i]) * usableHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = `rgba(110, 235, 255, ${(0.35 + config.glow * 0.25).toFixed(3)})`;
    ctx.lineWidth = 6 + config.glow * 8;
    ctx.stroke();
    ctx.strokeStyle = `rgba(220, 248, 255, ${(0.72 + audio.beatStrength * 0.18).toFixed(3)})`;
    ctx.lineWidth = 1.5 + config.glow * 1.5;
    ctx.stroke();

    const peakAlpha = clamp(0.45 + config.peakHold * 0.4 + audio.beatStrength * 0.15, 0, 1).toFixed(3);
    ctx.fillStyle = `rgba(255, 170, 96, ${peakAlpha})`;
    for (let i = 0; i < config.bands; i += 1) {
      const x = insetX + (usableWidth * i) / Math.max(1, config.bands - 1);
      const y = insetTop + (1 - this.peaks[i]) * usableHeight;
      const markerWidth = Math.max(2, usableWidth / config.bands * 0.75);
      ctx.fillRect(x - markerWidth * 0.5, y - 1, markerWidth, 2);
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(insetX, height - insetBottom, usableWidth, 2);
  }
}
