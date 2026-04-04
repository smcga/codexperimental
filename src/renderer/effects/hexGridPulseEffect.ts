import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type HexGridPulseEra = "8bit" | "16bit" | "ps1" | "pcdemo" | "future";

type HexGridPulseEraStyle = {
  contrast: number;
  shade: number;
  motion: number;
  color: number;
  glow: number;
  quantize: number;
};

export const HEX_GRID_PULSE_DEFAULTS = {
  cellSize: 24,
  speed: 1,
  waveScale: 1.1,
  rippleStrength: 0.45,
  pulseStrength: 0.55,
  lineWidth: 1.2,
  fillAlpha: 0.52,
  glowAlpha: 0.35,
  audioReactive: 0.5,
  paletteMix: 0.65,
  invert: 0
} as const;

const SQRT3 = Math.sqrt(3);
const TAU = Math.PI * 2;

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const normalizeEra = (era?: string): HexGridPulseEra => {
  if (era === "8bit" || era === "16bit" || era === "ps1" || era === "pcdemo" || era === "future") {
    return era;
  }
  return "16bit";
};

export const resolveHexGridPulseEraStyle = (era?: string): HexGridPulseEraStyle => {
  switch (normalizeEra(era)) {
    case "8bit":
      return { contrast: 1.28, shade: 0.45, motion: 0.72, color: 0.35, glow: 0.2, quantize: 4 };
    case "16bit":
      return { contrast: 1.12, shade: 0.7, motion: 0.86, color: 0.55, glow: 0.35, quantize: 0 };
    case "ps1":
      return { contrast: 1.02, shade: 0.9, motion: 1, color: 0.7, glow: 0.55, quantize: 0 };
    case "pcdemo":
      return { contrast: 1, shade: 1, motion: 1.08, color: 0.88, glow: 0.75, quantize: 0 };
    case "future":
      return { contrast: 0.98, shade: 1.12, motion: 1.2, color: 1, glow: 1, quantize: 0 };
  }
};

export const resolveHexGridPulseParams = (params: Record<string, unknown>) => ({
  cellSize: clamp(toNumber(params.cellSize, HEX_GRID_PULSE_DEFAULTS.cellSize), 8, 96),
  speed: clamp(toNumber(params.speed, HEX_GRID_PULSE_DEFAULTS.speed), 0, 4),
  waveScale: clamp(toNumber(params.waveScale, HEX_GRID_PULSE_DEFAULTS.waveScale), 0.1, 4),
  rippleStrength: clamp(toNumber(params.rippleStrength, HEX_GRID_PULSE_DEFAULTS.rippleStrength), 0, 1.5),
  pulseStrength: clamp(toNumber(params.pulseStrength, HEX_GRID_PULSE_DEFAULTS.pulseStrength), 0, 1.5),
  lineWidth: clamp(toNumber(params.lineWidth, HEX_GRID_PULSE_DEFAULTS.lineWidth), 0, 8),
  fillAlpha: clamp(toNumber(params.fillAlpha, HEX_GRID_PULSE_DEFAULTS.fillAlpha), 0, 1),
  glowAlpha: clamp(toNumber(params.glowAlpha, HEX_GRID_PULSE_DEFAULTS.glowAlpha), 0, 1),
  audioReactive: clamp(toNumber(params.audioReactive, HEX_GRID_PULSE_DEFAULTS.audioReactive), 0, 1),
  paletteMix: clamp(toNumber(params.paletteMix, HEX_GRID_PULSE_DEFAULTS.paletteMix), 0, 1),
  invert: toNumber(params.invert, HEX_GRID_PULSE_DEFAULTS.invert) >= 0.5 ? 1 : 0
});

export const sampleHexGridPulseWave = (
  gx: number,
  gy: number,
  radius: number,
  time: number,
  speed: number,
  waveScale: number,
  rippleStrength: number
): number => {
  const waveA = Math.sin(gx * waveScale * 0.82 + gy * waveScale * 0.58 - time * speed * 1.7);
  const waveB = Math.sin(gx * waveScale * -0.66 + gy * waveScale * 0.93 + time * speed * 1.32);
  const radialRipple = Math.sin(radius * waveScale * 0.12 - time * speed * 2.1) * rippleStrength;
  return (waveA + waveB) * 0.5 + radialRipple;
};

const drawHexPath = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + radius * 0.5, y + radius * SQRT3 * 0.5);
  ctx.lineTo(x - radius * 0.5, y + radius * SQRT3 * 0.5);
  ctx.lineTo(x - radius, y);
  ctx.lineTo(x - radius * 0.5, y - radius * SQRT3 * 0.5);
  ctx.lineTo(x + radius * 0.5, y - radius * SQRT3 * 0.5);
  ctx.closePath();
};

export class HexGridPulseEffect implements Effect {
  render({ ctx, width, height, time, audio, params, era }: EffectRenderContext): void {
    const cfg = resolveHexGridPulseParams(params as Record<string, unknown>);
    const style = resolveHexGridPulseEraStyle(era);
    const cellRadius = cfg.cellSize;
    const colStep = cellRadius * 1.5;
    const rowStep = cellRadius * SQRT3;

    const centerX = width * 0.5;
    const centerY = height * 0.5;

    const rms = clamp(audio.rms, 0, 1);
    const bass = clamp(audio.bass, 0, 1);
    const treble = clamp(audio.treble, 0, 1);
    const beatBurst = audio.beat ? 0.28 + clamp(audio.beatStrength, 0, 1) * 0.6 : 0;
    const audioDrive = (rms * 0.9 + bass * 1.1 + treble * 0.45 + beatBurst) * cfg.audioReactive;

    const invertSign = cfg.invert > 0 ? -1 : 1;
    const backgroundLightness = cfg.invert > 0 ? 12 : 7;
    ctx.fillStyle = `hsl(228 35% ${backgroundLightness}%)`;
    ctx.fillRect(0, 0, width, height);

    const overscan = cellRadius * 2;
    const minCol = Math.floor((-overscan) / colStep) - 1;
    const maxCol = Math.ceil((width + overscan) / colStep) + 1;

    ctx.lineWidth = cfg.lineWidth;

    for (let col = minCol; col <= maxCol; col += 1) {
      const cellX = col * colStep;
      const rowOffset = (col & 1) !== 0 ? rowStep * 0.5 : 0;
      const minRow = Math.floor((-overscan - rowOffset) / rowStep) - 1;
      const maxRow = Math.ceil((height + overscan - rowOffset) / rowStep) + 1;

      for (let row = minRow; row <= maxRow; row += 1) {
        const cellY = row * rowStep + rowOffset;

        const fromCenterX = (cellX - centerX) / Math.max(1, width);
        const fromCenterY = (cellY - centerY) / Math.max(1, height);
        const radiusNorm = Math.hypot(fromCenterX, fromCenterY);

        const wave = sampleHexGridPulseWave(
          col,
          row,
          radiusNorm * Math.min(width, height),
          time,
          cfg.speed * style.motion,
          cfg.waveScale,
          cfg.rippleStrength + bass * cfg.audioReactive * 0.45
        );

        const pulse = Math.sin(TAU * (time * cfg.speed * 0.22 + wave * 0.28 + radiusNorm * 0.75));
        const pulseAmount = (0.5 + 0.5 * pulse) * (0.5 + cfg.pulseStrength * 0.5);
        let intensity = clamp((0.52 + wave * 0.36 + audioDrive * 0.35) * style.contrast, 0, 1.3);

        if (style.quantize > 0) {
          intensity = Math.round(intensity * style.quantize) / style.quantize;
        }

        const drift = Math.sin((fromCenterX - fromCenterY) * 4 + time * cfg.speed * 0.7);
        const hueOffset = cfg.paletteMix * style.color * (wave * 24 + drift * 18 + treble * 20);
        const baseHue = cfg.invert > 0 ? 312 : 198;
        const hue = baseHue + invertSign * hueOffset;
        const saturation = 62 + cfg.paletteMix * 28;
        const lightness = clamp((16 + intensity * 44 * style.shade) * (cfg.invert > 0 ? 0.8 : 1), 6, 88);
        const fillAlpha = clamp(cfg.fillAlpha * (0.65 + intensity * 0.7), 0.04, 1);

        const innerScale = clamp(0.62 + pulseAmount * cfg.pulseStrength * 0.46, 0.35, 1.25);
        const innerRadius = cellRadius * innerScale;

        drawHexPath(ctx, cellX, cellY, innerRadius);
        ctx.fillStyle = `hsla(${hue.toFixed(2)} ${saturation.toFixed(1)}% ${lightness.toFixed(1)}% / ${fillAlpha.toFixed(3)})`;
        ctx.fill();

        const strokeAlpha = clamp((0.22 + intensity * 0.45) * (cfg.invert > 0 ? 0.6 : 1), 0.08, 0.9);
        ctx.strokeStyle = `hsla(${(hue + 10).toFixed(2)} 90% ${(lightness + 16).toFixed(1)}% / ${strokeAlpha.toFixed(3)})`;
        ctx.stroke();

        const glow = clamp(cfg.glowAlpha * style.glow * (0.4 + treble * 0.5 + intensity * 0.5), 0, 1);
        if (glow > 0.01) {
          drawHexPath(ctx, cellX, cellY, innerRadius * clamp(0.62 + pulseAmount * 0.26, 0.45, 0.95));
          ctx.fillStyle = `hsla(${(hue + 24).toFixed(2)} 100% ${(lightness + 20).toFixed(1)}% / ${glow.toFixed(3)})`;
          ctx.fill();
        }
      }
    }
  }
}
