import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type KefrensPaletteName = "rainbow" | "c64" | "amiga";

type RgbColor = { r: number; g: number; b: number };

type KefrensBarsParams = {
  barCount: number;
  barWidth: number;
  amp: number;
  freq: number;
  speed: number;
  phaseOffset: number;
  palette: KefrensPaletteName;
};

const TAU = Math.PI * 2;

export const KEFRENS_BARS_DEFAULTS = {
  barCount: 18,
  barWidth: 12,
  amp: 64,
  freq: 2.2,
  speed: 1.4,
  phaseOffset: 0.55,
  palette: "rainbow"
} as const;

const C64_BARS: Array<[number, number, number]> = [
  [238, 238, 119],
  [170, 255, 102],
  [0, 136, 255],
  [170, 255, 238],
  [204, 68, 204],
  [255, 119, 119],
  [221, 136, 85]
];

const AMIGA_BARS: Array<[number, number, number]> = [
  [53, 27, 110],
  [88, 49, 176],
  [121, 89, 214],
  [92, 162, 255],
  [84, 225, 214],
  [130, 248, 150],
  [255, 230, 112]
];

const PALETTES: Record<Exclude<KefrensPaletteName, "rainbow">, Array<[number, number, number]>> = {
  c64: C64_BARS,
  amiga: AMIGA_BARS
};

const clamp01 = (value: number): number => clamp(value, 0, 1);

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolvePalette = (value: unknown): KefrensPaletteName => {
  if (value === "c64" || value === "amiga" || value === "rainbow") {
    return value;
  }
  return KEFRENS_BARS_DEFAULTS.palette;
};

export const resolveKefrensBarsParams = (params: Record<string, unknown>): KefrensBarsParams => ({
  barCount: clamp(Math.round(toNumber(params.barCount, KEFRENS_BARS_DEFAULTS.barCount)), 1, 128),
  barWidth: clamp(toNumber(params.barWidth, KEFRENS_BARS_DEFAULTS.barWidth), 1, 160),
  amp: clamp(toNumber(params.amp, KEFRENS_BARS_DEFAULTS.amp), 0, 480),
  freq: clamp(toNumber(params.freq, KEFRENS_BARS_DEFAULTS.freq), 0, 20),
  speed: clamp(toNumber(params.speed, KEFRENS_BARS_DEFAULTS.speed), -10, 10),
  phaseOffset: clamp(toNumber(params.phaseOffset, KEFRENS_BARS_DEFAULTS.phaseOffset), -TAU, TAU),
  palette: resolvePalette(params.palette)
});

const hslToRgb = (h: number, s: number, l: number, out: RgbColor): void => {
  const hue = ((h % 1) + 1) % 1;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const hueToChannel = (t: number): number => {
    let temp = t;
    if (temp < 0) {
      temp += 1;
    }
    if (temp > 1) {
      temp -= 1;
    }
    if (temp < 1 / 6) {
      return p + (q - p) * 6 * temp;
    }
    if (temp < 1 / 2) {
      return q;
    }
    if (temp < 2 / 3) {
      return p + (q - p) * (2 / 3 - temp) * 6;
    }
    return p;
  };

  out.r = Math.round(hueToChannel(hue + 1 / 3) * 255);
  out.g = Math.round(hueToChannel(hue) * 255);
  out.b = Math.round(hueToChannel(hue - 1 / 3) * 255);
};

const sampleColor = (paletteName: KefrensPaletteName, phase: number, out: RgbColor): void => {
  const colorPhase = ((phase % 1) + 1) % 1;
  if (paletteName === "rainbow") {
    hslToRgb(colorPhase, 0.9, 0.55, out);
    return;
  }

  const palette = PALETTES[paletteName];
  const index = Math.floor(colorPhase * palette.length) % palette.length;
  const [r, g, b] = palette[index];
  out.r = r;
  out.g = g;
  out.b = b;
};

export class KefrensBarsEffect implements Effect {
  render({ ctx, width, height, time, params }: EffectRenderContext): void {
    const config = resolveKefrensBarsParams(params as Record<string, unknown>);
    const centerX = width * 0.5;
    const barSpan = height + config.barWidth * 2;
    const spacing = barSpan / config.barCount;

    ctx.clearRect(0, 0, width, height);

    const color: RgbColor = { r: 0, g: 0, b: 0 };
    for (let i = 0; i < config.barCount; i += 1) {
      const y = i * spacing - config.barWidth;
      const barPhase = i * config.phaseOffset;
      const wobble = Math.sin(time * config.speed + (i / config.barCount) * config.freq * TAU + barPhase) * config.amp;
      const x = centerX + wobble;
      const left = x - width * 0.65;
      const colorPhase = i / config.barCount + time * config.speed * 0.08;

      sampleColor(config.palette, colorPhase, color);

      const shade = 0.75 + 0.25 * Math.cos(time * config.speed + barPhase);
      const alpha = clamp01(0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * config.speed + barPhase * 0.8)));
      const r = clamp(Math.round(color.r * shade), 0, 255);
      const g = clamp(Math.round(color.g * shade), 0, 255);
      const b = clamp(Math.round(color.b * shade), 0, 255);

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
      ctx.fillRect(left, y, width * 1.3, config.barWidth);
    }
  }
}
