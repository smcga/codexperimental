import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const TEXTMODE_CHARSET_DEFAULTS = {
  cols: 64,
  rows: 36,
  glyphSet: 0,
  mode: 0,
  speed: 1,
  palette: 0,
  scanlines: 0.2,
  seed: 1
};

export const GLYPH_RAMPS = [" .:-=+*#%@", " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$", " ░▒▓█"];

const PALETTES: Array<{ background: string; low: string; high: string; glow: string }> = [
  { background: "#05070f", low: "#44f5ff", high: "#ffffff", glow: "rgba(68,245,255,0.25)" },
  { background: "#140509", low: "#ff7b39", high: "#fff0be", glow: "rgba(255,123,57,0.22)" },
  { background: "#06140b", low: "#54ff8e", high: "#eafff3", glow: "rgba(84,255,142,0.24)" },
  { background: "#0f0818", low: "#cb7dff", high: "#ffe7ff", glow: "rgba(203,125,255,0.24)" }
];

export type TextmodeResolvedParams = {
  cols: number;
  rows: number;
  glyphSet: number;
  mode: number;
  speed: number;
  palette: number;
  scanlines: number;
  seed: number;
};

const toFinite = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

export const getGlyphRamp = (glyphSet: number): string => GLYPH_RAMPS[Math.abs(Math.round(glyphSet)) % GLYPH_RAMPS.length];

export const pickGlyphFromIntensity = (intensity: number, ramp: string): string => {
  const safeRamp = ramp.length > 0 ? ramp : " ";
  const normalized = clamp(intensity, 0, 1);
  const index = Math.round(normalized * (safeRamp.length - 1));
  return safeRamp[index] ?? " ";
};

export const resolveTextmodeCharsetParams = (params: Record<string, number>): TextmodeResolvedParams => ({
  cols: clamp(Math.round(toFinite(params.cols, TEXTMODE_CHARSET_DEFAULTS.cols)), 12, 180),
  rows: clamp(Math.round(toFinite(params.rows, TEXTMODE_CHARSET_DEFAULTS.rows)), 8, 120),
  glyphSet: Math.abs(Math.round(toFinite(params.glyphSet, TEXTMODE_CHARSET_DEFAULTS.glyphSet))),
  mode: Math.abs(Math.round(toFinite(params.mode, TEXTMODE_CHARSET_DEFAULTS.mode))),
  speed: clamp(toFinite(params.speed, TEXTMODE_CHARSET_DEFAULTS.speed), 0, 6),
  palette: Math.abs(Math.round(toFinite(params.palette, TEXTMODE_CHARSET_DEFAULTS.palette))),
  scanlines: clamp(toFinite(params.scanlines, TEXTMODE_CHARSET_DEFAULTS.scanlines), 0, 1),
  seed: Math.abs(Math.round(toFinite(params.seed, TEXTMODE_CHARSET_DEFAULTS.seed)))
});

const hash2 = (x: number, y: number, seed: number): number => {
  const n = Math.sin((x + seed * 17.13) * 127.1 + (y + seed * 11.9) * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

export const sampleTextmodeIntensity = (
  xNorm: number,
  yNorm: number,
  time: number,
  params: TextmodeResolvedParams,
  bass: number,
  treble: number
): number => {
  const mode = params.mode % 3;
  const t = time * (0.2 + params.speed * 0.8);
  const swirl = Math.sin((xNorm * 8.2 + t * 1.7) + Math.cos(yNorm * 6.5 - t * 1.1));
  const rings = Math.sin(Math.hypot(xNorm - 0.5, yNorm - 0.5) * 24 - t * 4.2);
  const noise = hash2(xNorm * params.cols, yNorm * params.rows, params.seed);

  if (mode === 1) {
    return clamp(0.5 + 0.45 * rings + 0.25 * (noise - 0.5) + bass * 0.2, 0, 1);
  }
  if (mode === 2) {
    const bars = 0.5 + 0.5 * Math.sin((xNorm * 20 + t * 3.5) + Math.sin(yNorm * 10 - t));
    return clamp(bars * 0.75 + noise * 0.25 + treble * 0.25, 0, 1);
  }
  return clamp(0.5 + 0.35 * swirl + 0.2 * (noise - 0.5) + bass * 0.15 + treble * 0.1, 0, 1);
};

export const generateTextmodeGlyphGrid = (
  cols: number,
  rows: number,
  time: number,
  params: TextmodeResolvedParams,
  bass: number,
  treble: number
): string[] => {
  const ramp = getGlyphRamp(params.glyphSet);
  const grid: string[] = [];
  for (let y = 0; y < rows; y += 1) {
    let row = "";
    for (let x = 0; x < cols; x += 1) {
      const xNorm = cols > 1 ? x / (cols - 1) : 0;
      const yNorm = rows > 1 ? y / (rows - 1) : 0;
      const intensity = sampleTextmodeIntensity(xNorm, yNorm, time, params, bass, treble);
      row += pickGlyphFromIntensity(intensity, ramp);
    }
    grid.push(row);
  }
  return grid;
};

export class TextmodeCharsetEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const resolved = resolveTextmodeCharsetParams(params);
    const palette = PALETTES[resolved.palette % PALETTES.length];
    const cols = resolved.cols;
    const rows = resolved.rows;
    const glyphGrid = generateTextmodeGlyphGrid(cols, rows, time, resolved, clamp(audio.bass ?? 0, 0, 1), clamp(audio.treble ?? 0, 0, 1));

    const cellW = width / cols;
    const cellH = height / rows;
    const fontSize = Math.max(6, Math.min(cellW, cellH) * 0.95);

    ctx.save();
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = palette.glow;
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${fontSize}px "Cascadia Code", "Consolas", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let y = 0; y < rows; y += 1) {
      const row = glyphGrid[y] ?? "";
      for (let x = 0; x < cols; x += 1) {
        const glyph = row[x] ?? " ";
        const xNorm = cols > 1 ? x / (cols - 1) : 0;
        const yNorm = rows > 1 ? y / (rows - 1) : 0;
        const intensity = sampleTextmodeIntensity(xNorm, yNorm, time, resolved, clamp(audio.bass ?? 0, 0, 1), clamp(audio.treble ?? 0, 0, 1));
        const alpha = 0.2 + intensity * 0.8;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillText(glyph, (x + 0.5) * cellW, (y + 0.5) * cellH);
      }
    }

    if (resolved.scanlines > 0.001) {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.08 * resolved.scanlines})`;
      for (let y = 0; y < height; y += 2) {
        ctx.fillRect(0, y, width, 1);
      }
    }

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, palette.low);
    gradient.addColorStop(1, palette.high);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
