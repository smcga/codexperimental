import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export type TextmodeCharsetMode = "plasma" | "noise" | "ripple";
export type TextmodeCharsetPalette = "green" | "amber" | "ice";

export type TextmodeCharsetParams = {
  cols: number;
  rows: number;
  glyphSet: string;
  mode: TextmodeCharsetMode;
  speed: number;
  palette: TextmodeCharsetPalette;
  scanlines: boolean;
  seed: number;
};

export const TEXTMODE_CHARSET_DEFAULTS: TextmodeCharsetParams = {
  cols: 72,
  rows: 40,
  glyphSet: "classic",
  mode: "plasma",
  speed: 1,
  palette: "green",
  scanlines: true,
  seed: 1
};

const GLYPH_SET_PRESETS: Record<string, string> = {
  classic: " .:-=+*#%@",
  dense: " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  blocks: " ░▒▓█"
};

const PALETTES: Record<TextmodeCharsetPalette, { bg: string; fg: string; glow: string }> = {
  green: {
    bg: "#031005",
    fg: "#88ff99",
    glow: "rgba(120, 255, 150, 0.35)"
  },
  amber: {
    bg: "#140b02",
    fg: "#ffcd73",
    glow: "rgba(255, 180, 70, 0.32)"
  },
  ice: {
    bg: "#040917",
    fg: "#9ad8ff",
    glow: "rgba(90, 185, 255, 0.34)"
  }
};

const resolveNumberParam = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveStringParam = (value: unknown, fallback: string): string =>
  typeof value === "string" ? value : fallback;

const resolveBooleanParam = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return fallback;
};

const hash = (x: number, y: number, seed: number): number => {
  let t = (x * 374761393 + y * 668265263 + seed * 374761) >>> 0;
  t = (t ^ (t >>> 13)) * 1274126177;
  t = (t ^ (t >>> 16)) >>> 0;
  return t / 4294967295;
};

const mapIntensityToGlyph = (intensity: number, ramp: string): string => {
  const clamped = clamp(intensity, 0, 1);
  const index = Math.min(ramp.length - 1, Math.floor(clamped * (ramp.length - 1)));
  return ramp[index] ?? " ";
};

export const resolveGlyphRamp = (glyphSet: string): string => {
  const preset = GLYPH_SET_PRESETS[glyphSet.trim().toLowerCase()];
  const source = preset ?? glyphSet;
  const normalized = source.length > 0 ? source : GLYPH_SET_PRESETS.classic;
  const deduped = [...new Set([...normalized])].join("");
  return deduped.length > 1 ? deduped : GLYPH_SET_PRESETS.classic;
};

export const coerceTextmodeCharsetParams = (
  params: Record<string, unknown>
): TextmodeCharsetParams => {
  const cols = Math.round(clamp(resolveNumberParam(params.cols, TEXTMODE_CHARSET_DEFAULTS.cols), 8, 240));
  const rows = Math.round(clamp(resolveNumberParam(params.rows, TEXTMODE_CHARSET_DEFAULTS.rows), 6, 160));
  const modeValue = resolveStringParam(params.mode, TEXTMODE_CHARSET_DEFAULTS.mode);
  const paletteValue = resolveStringParam(params.palette, TEXTMODE_CHARSET_DEFAULTS.palette);
  const speed = clamp(resolveNumberParam(params.speed, TEXTMODE_CHARSET_DEFAULTS.speed), 0, 4);
  const seed = Math.round(clamp(resolveNumberParam(params.seed, TEXTMODE_CHARSET_DEFAULTS.seed), 0, 9999));

  return {
    cols,
    rows,
    glyphSet: resolveStringParam(params.glyphSet, TEXTMODE_CHARSET_DEFAULTS.glyphSet),
    mode:
      modeValue === "noise" || modeValue === "ripple"
        ? modeValue
        : TEXTMODE_CHARSET_DEFAULTS.mode,
    speed,
    palette:
      paletteValue === "amber" || paletteValue === "ice"
        ? paletteValue
        : TEXTMODE_CHARSET_DEFAULTS.palette,
    scanlines: resolveBooleanParam(params.scanlines, TEXTMODE_CHARSET_DEFAULTS.scanlines),
    seed
  };
};

const sampleIntensity = (
  mode: TextmodeCharsetMode,
  nx: number,
  ny: number,
  time: number,
  speed: number,
  seed: number,
  audioBoost: number
): number => {
  if (mode === "noise") {
    const t = time * (0.6 + speed * 0.7);
    const jitter = hash(Math.floor(nx * 320 + t * 23), Math.floor(ny * 220 - t * 17), seed);
    return clamp(jitter * (0.88 + audioBoost * 0.2), 0, 1);
  }

  if (mode === "ripple") {
    const dx = nx - 0.5;
    const dy = ny - 0.5;
    const dist = Math.hypot(dx, dy);
    const ripple = 0.5 + 0.5 * Math.sin(dist * 38 - time * (3 + speed * 5));
    const shimmer = hash(Math.floor(nx * 400), Math.floor(ny * 320), seed) * 0.15;
    return clamp(ripple + shimmer + audioBoost * 0.25, 0, 1);
  }

  const warp = Math.sin((nx * 10 + time * (1 + speed * 2)) + Math.sin(ny * 6 - time * speed));
  const swirl = Math.cos((ny * 12 - time * (1.5 + speed)) + Math.sin(nx * 5 + time));
  const value = (warp + swirl) * 0.25 + 0.5 + audioBoost * 0.2;
  return clamp(value, 0, 1);
};

export class TextmodeCharsetEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const config = coerceTextmodeCharsetParams(params as Record<string, unknown>);
    const palette = PALETTES[config.palette];
    const ramp = resolveGlyphRamp(config.glyphSet);
    const cellW = width / config.cols;
    const cellH = height / config.rows;
    const fontSize = Math.max(8, Math.floor(Math.min(cellW, cellH) * 1.22));
    const audioBoost = clamp(audio.rms * 2 + audio.bass * 0.6, 0, 1);

    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = palette.fg;

    for (let row = 0; row < config.rows; row += 1) {
      const y = (row + 0.5) * cellH;
      const ny = (row + 0.5) / config.rows;
      for (let col = 0; col < config.cols; col += 1) {
        const x = (col + 0.5) * cellW;
        const nx = (col + 0.5) / config.cols;
        const intensity = sampleIntensity(
          config.mode,
          nx,
          ny,
          time,
          config.speed,
          config.seed,
          audioBoost
        );
        const glyph = mapIntensityToGlyph(intensity, ramp);
        if (glyph !== " ") {
          ctx.fillText(glyph, x, y);
        }
      }
    }

    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = palette.glow;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    if (config.scanlines) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
      for (let y = 1; y < height; y += 2) {
        ctx.fillRect(0, y, width, 1);
      }
      ctx.restore();
    }
  }
}
