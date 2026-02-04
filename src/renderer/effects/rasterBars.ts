import { clamp, lerp, smoothstep } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type PaletteName = "c64" | "atari" | "spectrum" | "rainbow";

type RGB = { r: number; g: number; b: number };

type Palette = Array<[number, number, number]>;

const C64_PALETTE: Palette = [
  [0, 0, 0],
  [255, 255, 255],
  [136, 0, 0],
  [170, 255, 238],
  [204, 68, 204],
  [0, 204, 85],
  [0, 0, 170],
  [238, 238, 119],
  [221, 136, 85],
  [102, 68, 0],
  [255, 119, 119],
  [51, 51, 51],
  [119, 119, 119],
  [170, 255, 102],
  [0, 136, 255],
  [187, 187, 187]
];

const ATARI_PALETTE: Palette = [
  [32, 24, 64],
  [64, 32, 128],
  [96, 64, 192],
  [120, 100, 224],
  [32, 96, 160],
  [48, 144, 192],
  [72, 184, 216],
  [104, 224, 232],
  [120, 96, 40],
  [168, 128, 56],
  [216, 168, 72],
  [248, 200, 96],
  [120, 40, 40],
  [176, 64, 72],
  [224, 96, 120],
  [248, 136, 168]
];

const SPECTRUM_PALETTE: Palette = [
  [0, 0, 0],
  [0, 0, 205],
  [205, 0, 0],
  [205, 0, 205],
  [0, 205, 0],
  [0, 205, 205],
  [205, 205, 0],
  [205, 205, 205],
  [0, 0, 0],
  [0, 0, 255],
  [255, 0, 0],
  [255, 0, 255],
  [0, 255, 0],
  [0, 255, 255],
  [255, 255, 0],
  [255, 255, 255]
];

const PALETTES: Record<Exclude<PaletteName, "rainbow">, Palette> = {
  c64: C64_PALETTE,
  atari: ATARI_PALETTE,
  spectrum: SPECTRUM_PALETTE
};

const clamp01 = (value: number): number => clamp(value, 0, 1);

const hslToRgb = (h: number, s: number, l: number, out: RGB): void => {
  const hue = ((h % 1) + 1) % 1;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

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

const paletteSample = (paletteName: PaletteName, palette: Palette | null, u: number, out: RGB): void => {
  const phase = ((u % 1) + 1) % 1;
  if (paletteName === "rainbow" || !palette) {
    hslToRgb(phase, 0.85, 0.55, out);
    return;
  }
  const scaled = phase * palette.length;
  const index = Math.floor(scaled) % palette.length;
  const next = (index + 1) % palette.length;
  const t = scaled - index;
  const c0 = palette[index];
  const c1 = palette[next];
  out.r = Math.round(lerp(c0[0], c1[0], t));
  out.g = Math.round(lerp(c0[1], c1[1], t));
  out.b = Math.round(lerp(c0[2], c1[2], t));
};

const resolvePaletteName = (params: Record<string, unknown>): PaletteName => {
  const paletteParam = params.palette;
  if (paletteParam === "c64" || paletteParam === "atari" || paletteParam === "spectrum" || paletteParam === "rainbow") {
    return paletteParam;
  }
  return "c64";
};

const resolveOrientation = (params: Record<string, unknown>): "horizontal" | "vertical" => {
  return params.orientation === "vertical" ? "vertical" : "horizontal";
};

export class RasterBarsEffect implements Effect {
  private thump = 0;

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const paramBag = params as Record<string, unknown>;
    const orientation = resolveOrientation(paramBag);
    const barCount = clamp(Math.round((params.barCount ?? 10) as number), 3, 40);
    const barThickness = Math.max(2, (params.barThickness ?? 18) as number);
    const speed = Math.max(0, (params.speed ?? 0.8) as number);
    const waveAmp = Math.max(0, (params.waveAmp ?? 22) as number);
    const waveFreq = Math.max(0.1, (params.waveFreq ?? 1.2) as number);
    const splitStrength = clamp01((params.splitStrength ?? 0.65) as number);
    const scanlineStep = clamp(Math.round((params.scanlineStep ?? 2) as number), 1, 4);
    const border = Boolean(paramBag.border ?? false);
    const borderSize = Math.max(0, (params.borderSize ?? 48) as number);
    const paletteName = resolvePaletteName(paramBag);
    const audioReact = clamp01((params.audioReact ?? 0.7) as number);
    const beatThump = clamp01((params.beatThump ?? 0.6) as number);

    const palette = paletteName === "rainbow" ? null : PALETTES[paletteName];

    const bass =
      ((audio as { bands?: { bass?: number } }).bands?.bass ?? audio?.bass ?? 0) *
      audioReact;
    const rms = (audio?.rms ?? 0) * audioReact;
    const energy = clamp01(rms + bass);
    const beat = audio?.beat ?? false;

    if (beat) {
      this.thump = 1;
    } else {
      const decay = Math.max(0, delta) * 6;
      this.thump = Math.max(0, this.thump - decay);
    }

    const thickness = barThickness * (1 + beatThump * 0.35 * this.thump);
    const baseBrightness = 1 + 0.5 * energy + 0.35 * this.thump;

    const isVertical = orientation === "vertical";
    const span = isVertical ? width : height;
    const step = scanlineStep;

    if (!border) {
      ctx.clearRect(0, 0, width, height);
    }

    const ranges: Array<[number, number]> = border
      ? [
          [0, Math.min(borderSize, span)],
          [Math.max(0, span - borderSize), span]
        ]
      : [[0, span]];

    const color: RGB = { r: 0, g: 0, b: 0 };
    const timeSec = time;

    const drawScanlines = (offsetX: number, offsetY: number, alpha: number, tint: "none" | "red" | "green" | "blue") => {
      if (alpha < 0.001) {
        return;
      }
      if (alpha < 1) {
        ctx.globalAlpha = alpha;
      }
      ranges.forEach(([start, end]) => {
        for (let pos = start; pos < end; pos += step) {
          const u = pos / span;
          const splitPhase = splitStrength * Math.sin(u * 12 + timeSec * 2.3);
          const wobble = waveAmp * Math.sin(timeSec * speed * 2 + u * waveFreq * 8 + splitPhase * 2);
          const shifted = pos + wobble;
          const barIndex = Math.floor(shifted / thickness);
          const baseU = barIndex / barCount + timeSec * speed * 0.12 + splitPhase * 0.08;
          paletteSample(paletteName, palette, baseU, color);

          const withinBar = ((shifted / thickness) % 1 + 1) % 1;
          const edge = smoothstep(0.0, 0.15, withinBar) * (1 - smoothstep(0.85, 1.0, withinBar));
          const brightness = baseBrightness * (0.35 + 0.65 * edge);

          const r = clamp(Math.round(color.r * brightness), 0, 255);
          const g = clamp(Math.round(color.g * brightness), 0, 255);
          const b = clamp(Math.round(color.b * brightness), 0, 255);

          if (tint === "red") {
            ctx.fillStyle = `rgb(${r},0,0)`;
          } else if (tint === "green") {
            ctx.fillStyle = `rgb(0,${g},0)`;
          } else if (tint === "blue") {
            ctx.fillStyle = `rgb(0,0,${b})`;
          } else {
            ctx.fillStyle = `rgb(${r},${g},${b})`;
          }

          if (isVertical) {
            ctx.fillRect(pos + offsetX, offsetY, step, height);
          } else {
            ctx.fillRect(offsetX, pos + offsetY, width, step);
          }
        }
      });
      if (alpha < 1) {
        ctx.globalAlpha = 1;
      }
    };

    drawScanlines(0, 0, 1, "none");

    if (splitStrength > 0.01) {
      const overlayStep = Math.max(6, step * 4);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const overlayAlpha = 0.16 * splitStrength;
      ranges.forEach(([start, end]) => {
        for (let pos = start; pos < end; pos += overlayStep) {
          const u = pos / span;
          const splitPhase = splitStrength * Math.sin(u * 10 + timeSec * 2.7);
          const wobble = waveAmp * Math.sin(timeSec * speed * 2 + u * waveFreq * 6 + splitPhase * 1.5);
          const shifted = pos + wobble;
          const barIndex = Math.floor(shifted / thickness);
          const baseU = barIndex / barCount + timeSec * speed * 0.12 + splitPhase * 0.1;
          paletteSample(paletteName, palette, baseU, color);

          const offset = splitStrength * 8 * Math.sin(timeSec * 3 + pos * 0.05);
          const offsetX = isVertical ? 0 : offset;
          const offsetY = isVertical ? offset : 0;

          const r = clamp(Math.round(color.r * baseBrightness), 0, 255);
          const g = clamp(Math.round(color.g * baseBrightness), 0, 255);
          const b = clamp(Math.round(color.b * baseBrightness), 0, 255);

          ctx.globalAlpha = overlayAlpha;
          if (isVertical) {
            ctx.fillStyle = `rgb(${r},0,0)`;
            ctx.fillRect(pos + offsetX, offsetY, overlayStep, height);
            ctx.fillStyle = `rgb(0,${g},0)`;
            ctx.fillRect(pos - offsetX, -offsetY, overlayStep, height);
            ctx.fillStyle = `rgb(0,0,${b})`;
            ctx.fillRect(pos, 0, overlayStep, height);
          } else {
            ctx.fillStyle = `rgb(${r},0,0)`;
            ctx.fillRect(offsetX, pos + offsetY, width, overlayStep);
            ctx.fillStyle = `rgb(0,${g},0)`;
            ctx.fillRect(-offsetX, pos - offsetY, width, overlayStep);
            ctx.fillStyle = `rgb(0,0,${b})`;
            ctx.fillRect(0, pos, width, overlayStep);
          }
        }
      });
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  reset(): void {
    this.thump = 0;
  }
}
