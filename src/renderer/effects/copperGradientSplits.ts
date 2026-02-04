import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type RegionMode = "bars" | "gradient" | "hamish";

type CopperRegion = {
  y0: number;
  y1: number;
  hueOffset: number;
  speedMul: number;
  barPhaseOffset: number;
  mode: RegionMode;
};

type RGB = { r: number; g: number; b: number };

const DEFAULTS = {
  scanStep: 2,
  gradientRowStep: 16,
  barCount: 10,
  speed: 0.7,
  barWobble: 28,
  barHueStep: 22,
  hueWobble: 18,
  saturation: 0.9,
  lightnessBase: 0.35,
  lightnessPeak: 0.68,
  splits: 3,
  hamish: true,
  hamishStrength: 0.35,
  paletteClamp: false,
  paletteClampSteps: 32,
  audioReact: 0.7,
  beatKick: 0.7
};

const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const clamp01 = (value: number): number => clamp(value, 0, 1);

const toFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toBoolean = (value: unknown, fallback: boolean): boolean => (typeof value === "boolean" ? value : fallback);

const hslToRgb = (h: number, s: number, l: number, out: RGB): void => {
  const hue = (((h % 360) + 360) % 360) / 360;
  const sat = clamp01(s);
  const lum = clamp01(l);
  const q = lum < 0.5 ? lum * (1 + sat) : lum + sat - lum * sat;
  const p = 2 * lum - q;

  const hue2rgb = (t: number): number => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };

  out.r = Math.round(hue2rgb(hue + 1 / 3) * 255);
  out.g = Math.round(hue2rgb(hue) * 255);
  out.b = Math.round(hue2rgb(hue - 1 / 3) * 255);
};

const applyPaletteClamp = (rgb: RGB, steps: number): void => {
  const clampedSteps = clamp(Math.round(steps), 2, 64);
  const step = 255 / (clampedSteps - 1);
  rgb.r = Math.round(Math.round(rgb.r / step) * step);
  rgb.g = Math.round(Math.round(rgb.g / step) * step);
  rgb.b = Math.round(Math.round(rgb.b / step) * step);
};

const getMode = (value: unknown): RegionMode => {
  if (value === "bars" || value === "gradient" || value === "hamish") {
    return value;
  }
  return "bars";
};

export class CopperGradientSplitsEffect implements Effect {
  private beatPulse = 0;
  private regions: CopperRegion[] = [];
  private gradientCache: Array<CanvasGradient | null> = [];
  private pattern: CanvasPattern | null = null;
  private rgb: RGB = { r: 0, g: 0, b: 0 };

  reset(): void {
    this.beatPulse = 0;
  }

  private ensurePattern(ctx: CanvasRenderingContext2D): void {
    if (this.pattern || typeof document === "undefined") {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 4;
    const patternCtx = canvas.getContext("2d");
    if (!patternCtx) {
      return;
    }

    const image = patternCtx.createImageData(4, 4);
    for (let i = 0; i < 16; i += 1) {
      const value = BAYER_4X4[i] / 15;
      const alpha = Math.round(value * 255);
      const index = i * 4;
      image.data[index] = 255;
      image.data[index + 1] = 255;
      image.data[index + 2] = 255;
      image.data[index + 3] = alpha;
    }
    patternCtx.putImageData(image, 0, 0);
    this.pattern = ctx.createPattern(canvas, "repeat");
  }

  private buildRegions(params: Record<string, unknown>): CopperRegion[] {
    const regionOverrides = params.regions;
    if (Array.isArray(regionOverrides) && regionOverrides.length) {
      const nextRegions: CopperRegion[] = [];
      regionOverrides.forEach((entry) => {
        if (typeof entry !== "object" || entry === null) {
          return;
        }
        const regionEntry = entry as Record<string, unknown>;
        const y0 = clamp01(toFiniteNumber(regionEntry.y0, 0));
        const y1 = clamp01(toFiniteNumber(regionEntry.y1, 1));
        if (y1 <= y0) {
          return;
        }
        nextRegions.push({
          y0,
          y1,
          hueOffset: toFiniteNumber(regionEntry.hueOffset, 0),
          speedMul: toFiniteNumber(regionEntry.speedMul, 1),
          barPhaseOffset: toFiniteNumber(regionEntry.barPhaseOffset, 0),
          mode: getMode(regionEntry.mode)
        });
      });

      if (nextRegions.length) {
        this.regions = nextRegions;
        return this.regions;
      }
    }

    const splits = clamp(Math.round(toFiniteNumber(params.splits, DEFAULTS.splits)), 1, 6);
    const hamishEnabled = toBoolean(params.hamish, DEFAULTS.hamish);
    const nextRegions: CopperRegion[] = [];

    if (splits === 1) {
      nextRegions.push({
        y0: 0,
        y1: 1,
        hueOffset: 0,
        speedMul: 1,
        barPhaseOffset: 0,
        mode: "bars"
      });
    } else if (splits === 3) {
      nextRegions.push({
        y0: 0,
        y1: 0.14,
        hueOffset: 10,
        speedMul: 1.6,
        barPhaseOffset: 0.4,
        mode: "gradient"
      });
      nextRegions.push({
        y0: 0.14,
        y1: 0.76,
        hueOffset: 80,
        speedMul: 1,
        barPhaseOffset: 0.9,
        mode: "bars"
      });
      nextRegions.push({
        y0: 0.76,
        y1: 1,
        hueOffset: 180,
        speedMul: 0.75,
        barPhaseOffset: 1.4,
        mode: hamishEnabled ? "hamish" : "gradient"
      });
    } else {
      for (let i = 0; i < splits; i += 1) {
        const y0 = i / splits;
        const y1 = (i + 1) / splits;
        let mode: RegionMode = i % 2 === 0 ? "bars" : "gradient";
        if (i === splits - 1 && hamishEnabled) {
          mode = "hamish";
        }
        nextRegions.push({
          y0,
          y1,
          hueOffset: i * 45,
          speedMul: 1.2 - i * 0.1,
          barPhaseOffset: i * 0.6,
          mode
        });
      }
    }

    this.regions = nextRegions;
    return this.regions;
  }

  private buildGradient(
    ctx: CanvasRenderingContext2D,
    width: number,
    yNorm: number,
    time: number,
    region: CopperRegion,
    settings: {
      barCount: number;
      speed: number;
      barWobble: number;
      barHueStep: number;
      hueWobble: number;
      saturation: number;
      lightnessBase: number;
      lightnessPeak: number;
      paletteClamp: boolean;
      paletteClampSteps: number;
      hamishStrength: number;
      beatPulse: number;
      beatKick: number;
      blockIndex: number;
    }
  ): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    const rgb = this.rgb;
    const timePhase = time * settings.speed * region.speedMul;
    const hueBase = timePhase * 45 + region.hueOffset + yNorm * 120 + settings.beatPulse * settings.beatKick * 28;
    const saturation = clamp01(settings.saturation + settings.beatPulse * 0.25);
    const lightnessBase = clamp01(settings.lightnessBase + settings.beatPulse * 0.1);
    const lightnessPeak = clamp01(settings.lightnessPeak + settings.beatPulse * 0.12);

    if (region.mode === "gradient") {
      const stops = 5;
      for (let i = 0; i < stops; i += 1) {
        const t = i / (stops - 1);
        const hue = hueBase + t * 80 + Math.sin(timePhase * 2 + yNorm * 6 + i) * settings.hueWobble;
        const lightness = clamp01(lightnessBase + (lightnessPeak - lightnessBase) * Math.sin(t * Math.PI));
        hslToRgb(hue, saturation, lightness, rgb);
        if (settings.paletteClamp) {
          applyPaletteClamp(rgb, settings.paletteClampSteps);
        }
        gradient.addColorStop(t, `rgb(${rgb.r},${rgb.g},${rgb.b})`);
      }
      return gradient;
    }

    const barCount = settings.barCount;
    const barSpacing = width / barCount;
    const ditherRow = settings.blockIndex % 4;

    for (let i = 0; i < barCount; i += 1) {
      const baseCenter = (i + 0.5) * barSpacing;
      const wobble =
        Math.sin(timePhase * 2.2 + i * 1.7 + yNorm * 6 + region.barPhaseOffset) * settings.barWobble;
      const center = baseCenter + wobble;
      const halfWidth = barSpacing * 0.46;
      const left = clamp(center - halfWidth, 0, width);
      const right = clamp(center + halfWidth, 0, width);

      const hue =
        hueBase +
        i * settings.barHueStep +
        Math.sin(timePhase * 1.4 + yNorm * 10 + i) * settings.hueWobble +
        region.barPhaseOffset * 12;

      let dither = 0;
      if (region.mode === "hamish") {
        const ditherIndex = (i % 4) + ditherRow * 4;
        dither = (BAYER_4X4[ditherIndex] / 15 - 0.5) * settings.hamishStrength * 0.18;
      }

      const edgeLightness = clamp01(lightnessBase * 0.75 + dither);
      const peakLightness = clamp01(lightnessPeak + dither * 1.4);

      hslToRgb(hue, saturation * 0.85, edgeLightness, rgb);
      if (settings.paletteClamp) {
        applyPaletteClamp(rgb, settings.paletteClampSteps);
      }
      gradient.addColorStop(left / width, `rgb(${rgb.r},${rgb.g},${rgb.b})`);

      hslToRgb(hue, saturation, peakLightness, rgb);
      if (settings.paletteClamp) {
        applyPaletteClamp(rgb, settings.paletteClampSteps);
      }
      gradient.addColorStop(clamp(center / width, 0, 1), `rgb(${rgb.r},${rgb.g},${rgb.b})`);

      hslToRgb(hue, saturation * 0.85, edgeLightness, rgb);
      if (settings.paletteClamp) {
        applyPaletteClamp(rgb, settings.paletteClampSteps);
      }
      gradient.addColorStop(right / width, `rgb(${rgb.r},${rgb.g},${rgb.b})`);
    }

    return gradient;
  }

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const paramBag = params as Record<string, unknown>;
    const dt = clamp(delta, 0, 0.05);
    const scanStep = clamp(Math.round(toFiniteNumber(paramBag.scanStep, DEFAULTS.scanStep)), 1, 6);
    const gradientRowStep = clamp(Math.round(toFiniteNumber(paramBag.gradientRowStep, DEFAULTS.gradientRowStep)), 4, 64);
    const barCount = clamp(Math.round(toFiniteNumber(paramBag.barCount, DEFAULTS.barCount)), 4, 24);
    const speed = Math.max(0, toFiniteNumber(paramBag.speed, DEFAULTS.speed));
    const barWobble = Math.max(0, toFiniteNumber(paramBag.barWobble, DEFAULTS.barWobble));
    const barHueStep = toFiniteNumber(paramBag.barHueStep, DEFAULTS.barHueStep);
    const hueWobble = toFiniteNumber(paramBag.hueWobble, DEFAULTS.hueWobble);
    const saturation = clamp01(toFiniteNumber(paramBag.saturation, DEFAULTS.saturation));
    const lightnessBase = clamp01(toFiniteNumber(paramBag.lightnessBase, DEFAULTS.lightnessBase));
    const lightnessPeak = clamp01(toFiniteNumber(paramBag.lightnessPeak, DEFAULTS.lightnessPeak));
    const hamishStrength = clamp01(toFiniteNumber(paramBag.hamishStrength, DEFAULTS.hamishStrength));
    const paletteClamp = toBoolean(paramBag.paletteClamp, DEFAULTS.paletteClamp);
    const paletteClampSteps = toFiniteNumber(paramBag.paletteClampSteps, DEFAULTS.paletteClampSteps);
    const audioReact = clamp01(toFiniteNumber(paramBag.audioReact, DEFAULTS.audioReact));
    const beatKick = clamp01(toFiniteNumber(paramBag.beatKick, DEFAULTS.beatKick));

    const bass =
      ((audio as { bands?: { bass?: number } }).bands?.bass ?? audio?.bass ?? 0) *
      audioReact;
    const rms = (audio?.rms ?? 0) * audioReact;
    const energy = clamp01(rms + bass);

    if (audio?.beat) {
      this.beatPulse = 1;
    } else {
      this.beatPulse = Math.max(0, this.beatPulse - dt * 5);
    }

    const dynamicWobble = barWobble * (1 + beatKick * 0.4 * this.beatPulse);
    const dynamicSaturation = clamp01(saturation + energy * 0.15);
    const dynamicPeak = clamp01(lightnessPeak + energy * 0.12);

    const regions = this.buildRegions(paramBag);
    const regionCount = regions.length;

    ctx.clearRect(0, 0, width, height);

    this.ensurePattern(ctx);
    const totalBlocks = Math.ceil(height / gradientRowStep);
    if (this.gradientCache.length !== totalBlocks) {
      this.gradientCache = new Array(totalBlocks).fill(null);
    }

    let regionIndex = 0;
    let activeRegion = regions[0];

    for (let blockIndex = 0, yBlock = 0; yBlock < height; blockIndex += 1, yBlock += gradientRowStep) {
      const yMid = Math.min(height - 1, yBlock + gradientRowStep * 0.5);
      const yNorm = yMid / height;

      while (regionIndex < regionCount - 1 && yNorm >= regions[regionIndex].y1) {
        regionIndex += 1;
      }
      activeRegion = regions[regionIndex];

      const gradient = this.buildGradient(ctx, width, yNorm, time, activeRegion, {
        barCount,
        speed,
        barWobble: dynamicWobble,
        barHueStep,
        hueWobble,
        saturation: dynamicSaturation,
        lightnessBase,
        lightnessPeak: dynamicPeak,
        paletteClamp,
        paletteClampSteps,
        hamishStrength,
        beatPulse: this.beatPulse,
        beatKick,
        blockIndex
      });
      this.gradientCache[blockIndex] = gradient;

      const yEnd = Math.min(height, yBlock + gradientRowStep);
      ctx.fillStyle = gradient;
      for (let y = yBlock; y < yEnd; y += scanStep) {
        ctx.fillRect(0, y, width, Math.min(scanStep, yEnd - y));
      }

      if (activeRegion.mode === "hamish" && hamishStrength > 0.01 && this.pattern) {
        ctx.save();
        ctx.globalAlpha = 0.18 * hamishStrength;
        ctx.globalCompositeOperation = "overlay";
        ctx.fillStyle = this.pattern;
        ctx.fillRect(0, yBlock, width, yEnd - yBlock);
        ctx.restore();
      }
    }
  }
}
