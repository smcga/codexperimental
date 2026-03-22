import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const MATRIX_RAIN_DEFAULTS = {
  speed: 1.1,
  density: 0.78,
  fontSize: 18,
  trail: 0.72,
  glow: 0.85,
  brightness: 0.9,
  jitter: 0.25,
  glyphSet: 0,
  seed: 1337
};

export const MATRIX_GLYPH_SETS = [
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&@*+=-",
  "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789",
  "日月火水木金土山川田人心手口目耳雨電空海風雲龍夜夢光影0123456789"
] as const;

export type MatrixRainResolvedParams = {
  speed: number;
  density: number;
  fontSize: number;
  trail: number;
  glow: number;
  brightness: number;
  jitter: number;
  glyphSet: number;
  seed: number;
};

const asFinite = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const hashMatrixValue = (value: number, seed: number): number => {
  const hashed = Math.sin(value * 127.1 + seed * 311.7) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

export const resolveMatrixRainParams = (params: Record<string, number>): MatrixRainResolvedParams => ({
  speed: clamp(asFinite(params.speed, MATRIX_RAIN_DEFAULTS.speed), 0.2, 4),
  density: clamp(asFinite(params.density, MATRIX_RAIN_DEFAULTS.density), 0.1, 1),
  fontSize: clamp(Math.round(asFinite(params.fontSize, MATRIX_RAIN_DEFAULTS.fontSize)), 10, 32),
  trail: clamp(asFinite(params.trail, MATRIX_RAIN_DEFAULTS.trail), 0.15, 1),
  glow: clamp(asFinite(params.glow, MATRIX_RAIN_DEFAULTS.glow), 0, 1.5),
  brightness: clamp(asFinite(params.brightness, MATRIX_RAIN_DEFAULTS.brightness), 0.25, 1.4),
  jitter: clamp(asFinite(params.jitter, MATRIX_RAIN_DEFAULTS.jitter), 0, 1),
  glyphSet: Math.abs(Math.round(asFinite(params.glyphSet, MATRIX_RAIN_DEFAULTS.glyphSet))),
  seed: Math.abs(Math.round(asFinite(params.seed, MATRIX_RAIN_DEFAULTS.seed)))
});

export const getMatrixGlyphBank = (glyphSet: number): string => MATRIX_GLYPH_SETS[glyphSet % MATRIX_GLYPH_SETS.length] ?? MATRIX_GLYPH_SETS[0];

export const isMatrixColumnActive = (column: number, seed: number, density: number): boolean =>
  hashMatrixValue(column * 1.918, seed) <= density;

export const getMatrixColumnCount = (width: number, fontSize: number): number => Math.max(1, Math.floor(width / Math.max(10, fontSize * 0.78)));

export const sampleMatrixGlyph = (column: number, row: number, time: number, glyphSet: number, seed: number): string => {
  const bank = getMatrixGlyphBank(glyphSet);
  const glyphTime = Math.floor(time * 14 + row * 0.9);
  const index = Math.floor(hashMatrixValue(column * 17 + row * 37 + glyphTime * 13, seed) * bank.length) % bank.length;
  return bank[index] ?? bank[0] ?? "0";
};

export class MatrixRainEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const resolved = resolveMatrixRainParams(params);
    const columnCount = getMatrixColumnCount(width, resolved.fontSize);
    const cellWidth = width / columnCount;
    const rowHeight = resolved.fontSize;
    const rowCount = Math.max(1, Math.ceil(height / rowHeight) + 2);
    const beatPulse = clamp((audio.beat ? 0.22 : 0) + (audio.rms ?? 0) * 0.65 + (audio.treble ?? 0) * 0.2, 0, 1);
    const fallRate = (8 + resolved.density * 12) * resolved.speed * (0.85 + beatPulse * 0.35);

    ctx.save();
    ctx.fillStyle = "rgba(0, 5, 0, 1)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = `rgba(18, 255, 110, ${0.05 + resolved.glow * 0.08 + beatPulse * 0.04})`;
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${resolved.fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let column = 0; column < columnCount; column += 1) {
      if (!isMatrixColumnActive(column, resolved.seed, resolved.density)) {
        continue;
      }

      const columnSeed = resolved.seed + column * 97;
      const speedScale = 0.65 + hashMatrixValue(column + 11, columnSeed) * 0.95 + beatPulse * 0.15;
      const trailRows = Math.max(6, Math.round(rowCount * (0.08 + resolved.trail * 0.22 + hashMatrixValue(column + 5, columnSeed) * 0.05)));
      const cycleLength = rowCount + trailRows + 6;
      const headRow = Math.floor((time * fallRate * speedScale + hashMatrixValue(column + 23, columnSeed) * cycleLength) % cycleLength) - trailRows;
      const xBase = (column + 0.5) * cellWidth;
      const x = xBase + Math.sin(time * 1.2 + columnSeed * 0.03) * resolved.jitter * cellWidth * 0.35;
      const startRow = Math.max(0, headRow - trailRows + 1);
      const endRow = Math.min(rowCount - 1, headRow);

      for (let row = startRow; row <= endRow; row += 1) {
        const distance = headRow - row;
        const life = 1 - distance / Math.max(1, trailRows);
        const shimmer = 0.82 + hashMatrixValue(row + column * 3, columnSeed) * 0.35;
        const alpha = clamp(Math.pow(Math.max(0, life), 1.45) * resolved.brightness * shimmer, 0, 1);
        const isHead = distance <= 0;
        const y = (row + 0.5) * rowHeight;
        const glyph = sampleMatrixGlyph(column, row, time + beatPulse * 0.5, resolved.glyphSet, columnSeed);
        const lightness = isHead ? 92 : 38 + life * 42;
        const saturation = isHead ? 30 : 90;

        ctx.shadowBlur = resolved.glow * (isHead ? 18 : 10) * (0.8 + beatPulse * 0.5);
        ctx.shadowColor = isHead ? "rgba(225, 255, 235, 0.9)" : `rgba(54, 255, 145, ${0.2 + alpha * 0.45})`;
        ctx.fillStyle = isHead
          ? `rgba(230, 255, 238, ${Math.max(alpha, 0.85)})`
          : `hsla(128, ${saturation}%, ${lightness}%, ${alpha})`;
        ctx.fillText(glyph, x, y);
      }
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    ctx.fillStyle = `rgba(0, 0, 0, ${0.08 + (1 - resolved.brightness / 1.4) * 0.08})`;
    for (let y = 0; y < height; y += 3) {
      ctx.fillRect(0, y, width, 1);
    }
    ctx.restore();
  }
}
