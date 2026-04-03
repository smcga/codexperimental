import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

const SPEED_MIN = 0.2;
const SPEED_MAX = 4;
const FALL_SPEED_MIN_PX = 12;
const FALL_SPEED_MAX_PX = 95;

export const MATRIX_RAIN_DEFAULTS = {
  speed: 0.9,
  density: 0.66,
  fontSize: 13,
  trail: 0.84,
  glow: 0.7,
  brightness: 0.92,
  jitter: 0.03,
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
  speed: clamp(asFinite(params.speed, MATRIX_RAIN_DEFAULTS.speed), SPEED_MIN, SPEED_MAX),
  density: clamp(asFinite(params.density, MATRIX_RAIN_DEFAULTS.density), 0.1, 1),
  fontSize: clamp(Math.round(asFinite(params.fontSize, MATRIX_RAIN_DEFAULTS.fontSize)), 8, 28),
  trail: clamp(asFinite(params.trail, MATRIX_RAIN_DEFAULTS.trail), 0.2, 1),
  glow: clamp(asFinite(params.glow, MATRIX_RAIN_DEFAULTS.glow), 0, 1.5),
  brightness: clamp(asFinite(params.brightness, MATRIX_RAIN_DEFAULTS.brightness), 0.25, 1.4),
  jitter: clamp(asFinite(params.jitter, MATRIX_RAIN_DEFAULTS.jitter), 0, 1),
  glyphSet: Math.abs(Math.round(asFinite(params.glyphSet, MATRIX_RAIN_DEFAULTS.glyphSet))),
  seed: Math.abs(Math.round(asFinite(params.seed, MATRIX_RAIN_DEFAULTS.seed)))
});

export const getMatrixGlyphBank = (glyphSet: number): string => MATRIX_GLYPH_SETS[glyphSet % MATRIX_GLYPH_SETS.length] ?? MATRIX_GLYPH_SETS[0];

export const isMatrixColumnActive = (column: number, seed: number, density: number): boolean =>
  hashMatrixValue(column * 1.918, seed) <= density;

export const getMatrixColumnCount = (width: number, fontSize: number): number => Math.max(1, Math.floor(width / Math.max(8, fontSize * 0.75)));

export const resolveBaseFallSpeed = (speed: number): number => {
  const normalized = clamp((speed - SPEED_MIN) / (SPEED_MAX - SPEED_MIN), 0, 1);
  return FALL_SPEED_MIN_PX + normalized * (FALL_SPEED_MAX_PX - FALL_SPEED_MIN_PX);
};

export const sampleMatrixGlyph = (column: number, row: number, streamTime: number, glyphSet: number, seed: number): string => {
  const bank = getMatrixGlyphBank(glyphSet);
  const symbolTick = Math.floor(streamTime * 0.9 + row * 0.35);
  const index = Math.floor(hashMatrixValue(column * 17 + row * 37 + symbolTick * 11, seed) * bank.length) % bank.length;
  return bank[index] ?? bank[0] ?? "0";
};

export class MatrixRainEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const resolved = resolveMatrixRainParams(params);
    const columnCount = getMatrixColumnCount(width, resolved.fontSize);
    const cellWidth = width / columnCount;
    const rowHeight = resolved.fontSize * 1.05;
    const beatPulse = clamp((audio.beat ? 0.2 : 0) + (audio.rms ?? 0) * 0.4 + (audio.treble ?? 0) * 0.08, 0, 1);
    const baseFallSpeed = resolveBaseFallSpeed(resolved.speed) * (1 + beatPulse * 0.12);

    ctx.save();
    ctx.fillStyle = "rgba(0, 4, 0, 1)";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = `rgba(20, 255, 120, ${0.04 + resolved.glow * 0.055 + beatPulse * 0.03})`;
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${resolved.fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const glyphStreamTime = time * (0.45 + resolved.speed * 0.22);

    for (let column = 0; column < columnCount; column += 1) {
      if (!isMatrixColumnActive(column, resolved.seed, resolved.density)) {
        continue;
      }

      const columnSeed = resolved.seed + column * 101;
      const speedScale = 0.86 + hashMatrixValue(column + 2, columnSeed) * 0.42 + beatPulse * 0.06;
      const columnFallSpeed = baseFallSpeed * speedScale;
      const trailRows = Math.max(8, Math.round(8 + resolved.trail * 20 + hashMatrixValue(column + 5, columnSeed) * 8));
      const trailLengthPx = trailRows * rowHeight;
      const cycleLength = height + trailLengthPx + rowHeight * 4;
      const cycleOffset = hashMatrixValue(column + 17, columnSeed) * cycleLength;
      const headY = (time * columnFallSpeed + cycleOffset) % cycleLength - trailLengthPx;
      const x = (column + 0.5) * cellWidth + Math.sin(time * 0.35 + columnSeed * 0.014) * resolved.jitter * cellWidth * 0.12;

      for (let trailIndex = 0; trailIndex < trailRows; trailIndex += 1) {
        const y = headY - trailIndex * rowHeight;
        if (y < -rowHeight || y > height + rowHeight) {
          continue;
        }

        const life = 1 - trailIndex / Math.max(1, trailRows - 1);
        const shimmer = 0.9 + hashMatrixValue(trailIndex + column * 3.7, columnSeed) * 0.16;
        const alpha = clamp(Math.pow(life, 1.55) * resolved.brightness * shimmer, 0, 1);
        const isHead = trailIndex === 0;
        const rowSample = Math.floor(y / rowHeight);
        const glyph = sampleMatrixGlyph(column, rowSample, glyphStreamTime + beatPulse * 0.15, resolved.glyphSet, columnSeed);

        ctx.shadowBlur = resolved.glow * (isHead ? 15 : 8) * (0.86 + beatPulse * 0.34);
        ctx.shadowColor = isHead ? "rgba(235, 255, 242, 0.9)" : `rgba(48, 255, 138, ${0.14 + alpha * 0.35})`;
        ctx.fillStyle = isHead
          ? `rgba(232, 255, 240, ${Math.max(alpha, 0.8)})`
          : `hsla(126, 92%, ${32 + life * 42}%, ${alpha})`;
        ctx.fillText(glyph, x, y);
      }
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    ctx.fillStyle = `rgba(0, 0, 0, ${0.05 + (1 - resolved.brightness / 1.4) * 0.06})`;
    for (let y = 0; y < height; y += 3) {
      ctx.fillRect(0, y, width, 1);
    }
    ctx.restore();
  }
}
