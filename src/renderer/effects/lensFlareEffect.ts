import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const LENS_FLARE_DEFAULTS = {
  intensity: 1.0,
  haloRadius: 0.18,
  ghostCount: 6,
  ghostSpread: 1.2,
  streakStrength: 0.5,
  ringStrength: 0.35,
  chromatic: 0.3,
  audioReactive: 0.6,
  shimmer: 0.25,
  bgDim: 0.0,
  blendBias: 1.0,
  seed: 0
} as const;

type LensFlareResolvedParams = {
  intensity: number;
  sourceX?: number;
  sourceY?: number;
  haloRadius: number;
  ghostCount: number;
  ghostSpread: number;
  streakStrength: number;
  ringStrength: number;
  chromatic: number;
  audioReactive: number;
  shimmer: number;
  bgDim: number;
  blendBias: number;
  seed: number;
};

const lensFlareHash = (value: number): number => {
  const s = Math.sin(value * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

const resolveOptionalNormalized = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? clamp(value, 0, 1) : undefined;

const resolveNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const resolveLensFlareParams = (params: Record<string, unknown>): LensFlareResolvedParams => ({
  intensity: clamp(resolveNumber(params.intensity, LENS_FLARE_DEFAULTS.intensity), 0, 4),
  sourceX: resolveOptionalNormalized(params.sourceX),
  sourceY: resolveOptionalNormalized(params.sourceY),
  haloRadius: clamp(resolveNumber(params.haloRadius, LENS_FLARE_DEFAULTS.haloRadius), 0.05, 0.8),
  ghostCount: clamp(Math.round(resolveNumber(params.ghostCount, LENS_FLARE_DEFAULTS.ghostCount)), 2, 12),
  ghostSpread: clamp(resolveNumber(params.ghostSpread, LENS_FLARE_DEFAULTS.ghostSpread), 0.3, 2.4),
  streakStrength: clamp(resolveNumber(params.streakStrength, LENS_FLARE_DEFAULTS.streakStrength), 0, 2),
  ringStrength: clamp(resolveNumber(params.ringStrength, LENS_FLARE_DEFAULTS.ringStrength), 0, 1.5),
  chromatic: clamp(resolveNumber(params.chromatic, LENS_FLARE_DEFAULTS.chromatic), 0, 1.2),
  audioReactive: clamp(resolveNumber(params.audioReactive, LENS_FLARE_DEFAULTS.audioReactive), 0, 1),
  shimmer: clamp(resolveNumber(params.shimmer, LENS_FLARE_DEFAULTS.shimmer), 0, 1),
  bgDim: clamp(resolveNumber(params.bgDim, LENS_FLARE_DEFAULTS.bgDim), 0, 1),
  blendBias: clamp(resolveNumber(params.blendBias, LENS_FLARE_DEFAULTS.blendBias), 0, 2),
  seed: resolveNumber(params.seed, LENS_FLARE_DEFAULTS.seed)
});

export const resolveLensFlareSource = (
  width: number,
  height: number,
  time: number,
  treble: number,
  beatStrength: number,
  audioReactive: number,
  sourceX?: number,
  sourceY?: number
): { nx: number; ny: number; x: number; y: number } => {
  const reactiveOffset = (treble * 0.035 + beatStrength * 0.05) * audioReactive;
  const nx = clamp(sourceX ?? (0.52 + Math.sin(time * 0.17) * 0.42 + Math.sin(time * 0.53) * reactiveOffset), -0.15, 1.15);
  const ny = clamp(sourceY ?? (0.46 + Math.sin(time * 0.11 + 1.1) * 0.33 + Math.cos(time * 0.31) * reactiveOffset), -0.15, 1.15);
  return {
    nx,
    ny,
    x: nx * width,
    y: ny * height
  };
};

export const computeLensFlareGhostScalar = (index: number, count: number, spread: number): number => {
  const ratio = count <= 1 ? 0 : index / (count - 1);
  const mirrored = -0.32 + ratio * (spread * 2.15 + 0.62);
  return mirrored;
};

const drawRadialGlow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  inner: string,
  outer: string,
  alpha: number
): void => {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, radius));
  gradient.addColorStop(0, inner);
  gradient.addColorStop(1, outer);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(1, radius), 0, Math.PI * 2);
  ctx.fill();
};

const drawRing = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  thickness: number,
  color: string,
  alpha: number
): void => {
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = Math.max(1, thickness);
  ctx.beginPath();
  ctx.arc(x, y, Math.max(1, radius), 0, Math.PI * 2);
  ctx.stroke();
};

const drawGhost = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  hue: number,
  alpha: number
): void => {
  drawRadialGlow(
    ctx,
    x,
    y,
    radius,
    `hsla(${hue}, 90%, 76%, 0.9)`,
    `hsla(${(hue + 36) % 360}, 95%, 55%, 0.0)`,
    alpha
  );
};

export class LensFlareEffect implements Effect {
  private beatPulse = 0;

  render({ ctx, width, height, time, delta, audio, params, era }: EffectRenderContext): void {
    const resolved = resolveLensFlareParams(params as Record<string, unknown>);
    const minDim = Math.min(width, height);
    const source = resolveLensFlareSource(
      width,
      height,
      time,
      audio.treble,
      audio.beatStrength,
      resolved.audioReactive,
      resolved.sourceX,
      resolved.sourceY
    );

    if (audio.beat) {
      this.beatPulse = Math.max(this.beatPulse, 0.55 + audio.beatStrength * 0.65);
    }
    this.beatPulse = Math.max(0, this.beatPulse - delta * 3.4);

    const eraName = era ?? "pcdemo";
    const retro8 = eraName === "8bit";
    const retro16 = eraName === "16bit";
    const ps1 = eraName === "ps1";
    const future = eraName === "future";

    const eraGhostMult = retro8 ? 0.5 : retro16 ? 0.7 : 1;
    const eraRingMult = retro8 ? 0.25 : retro16 ? 0.55 : ps1 ? 1.1 : future ? 1.2 : 1;
    const eraStreakMult = retro8 ? 0.08 : retro16 ? 0.35 : ps1 ? 0.7 : future ? 1.25 : 1;
    const ghostCount = clamp(Math.round(resolved.ghostCount * eraGhostMult), 2, 12);

    const audioLift = 1 + (audio.rms * 0.2 + audio.beatStrength * 0.35) * resolved.audioReactive;
    const shimmerPhase = Math.sin(time * 1.9 + resolved.seed * 0.17) * 0.5 + 0.5;
    const shimmer = 1 + resolved.shimmer * (shimmerPhase * 0.18 + audio.treble * 0.22);
    const baseIntensity = resolved.intensity * audioLift * (1 + this.beatPulse * 0.22);
    const finalIntensity = baseIntensity * resolved.blendBias;

    const sx = source.x;
    const sy = source.y;
    const cx = width * 0.5;
    const cy = height * 0.5;
    const dx = cx - sx;
    const dy = cy - sy;
    const axisLength = Math.max(1, Math.hypot(dx, dy));
    const nx = dx / axisLength;
    const ny = dy / axisLength;

    ctx.save();

    if (resolved.bgDim > 0.001) {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000";
      ctx.globalAlpha = clamp(resolved.bgDim * 0.45, 0, 0.7);
      ctx.fillRect(0, 0, width, height);
    }

    ctx.globalCompositeOperation = "screen";

    const coreRadius = minDim * resolved.haloRadius * (0.4 + this.beatPulse * 0.04) * shimmer;
    drawRadialGlow(ctx, sx, sy, coreRadius * 0.48, "hsla(50, 100%, 92%, 1)", "hsla(45, 100%, 70%, 0)", 0.85 * finalIntensity);
    drawRadialGlow(
      ctx,
      sx,
      sy,
      coreRadius * 1.5,
      future ? "hsla(200, 100%, 72%, 0.36)" : "hsla(35, 95%, 62%, 0.32)",
      "hsla(15, 100%, 45%, 0)",
      0.55 * finalIntensity
    );

    const ringBase = coreRadius * 0.78 * (1 + this.beatPulse * 0.08);
    const chroma = retro8 ? 0 : resolved.chromatic * (future ? 1.35 : 1);
    const ringCount = retro8 ? 1 : retro16 ? 1 : 3;
    for (let i = 0; i < ringCount; i += 1) {
      const r = ringBase * (1.05 + i * 0.42);
      const alpha = (0.16 - i * 0.04) * resolved.ringStrength * eraRingMult * finalIntensity;
      if (alpha <= 0.001) {
        continue;
      }
      const shift = chroma * (i + 1) * 3;
      drawRing(ctx, sx, sy, r, coreRadius * 0.02, `hsla(${195 + shift}, 95%, 72%, 0.5)`, alpha * 0.85);
      drawRing(ctx, sx, sy, r * (1 + chroma * 0.015), coreRadius * 0.016, `hsla(${22 - shift}, 95%, 68%, 0.45)`, alpha * 0.8);
    }

    for (let i = 0; i < ghostCount; i += 1) {
      const scalar = computeLensFlareGhostScalar(i, ghostCount, resolved.ghostSpread);
      const gx = sx + dx * scalar;
      const gy = sy + dy * scalar;
      const hash = lensFlareHash(i * 17.13 + resolved.seed * 0.73);
      const size = minDim * (0.018 + hash * 0.06) * (1 - Math.min(0.6, Math.abs(scalar - 1.0) * 0.22));
      const hue = 190 + hash * 120 + (future ? 30 : 0);
      const alpha = (0.14 + hash * 0.2) * finalIntensity * (0.95 + Math.sin(time * (1.1 + hash)) * resolved.shimmer * 0.12);
      drawGhost(ctx, gx, gy, size, hue % 360, alpha * (retro8 ? 0.5 : 1));
    }

    const streakStrength = resolved.streakStrength * eraStreakMult;
    if (streakStrength > 0.01) {
      const streakLen = width * (0.24 + streakStrength * 0.75 + audio.treble * resolved.audioReactive * 0.2);
      const streakHalfH = Math.max(2, minDim * 0.006 + streakStrength * 2.8);
      const angle = retro8 ? 0 : Math.atan2(ny, nx) * (ps1 ? 0.16 : 0.11);

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);
      const gradient = ctx.createLinearGradient(-streakLen, 0, streakLen, 0);
      gradient.addColorStop(0, "hsla(0, 0%, 100%, 0)");
      gradient.addColorStop(0.5, future ? "hsla(208, 100%, 80%, 0.65)" : "hsla(45, 100%, 78%, 0.55)");
      gradient.addColorStop(1, "hsla(0, 0%, 100%, 0)");
      ctx.fillStyle = gradient;
      ctx.globalAlpha = finalIntensity * streakStrength * (0.35 + audio.treble * 0.35);
      ctx.fillRect(-streakLen, -streakHalfH, streakLen * 2, streakHalfH * 2);
      ctx.restore();
    }

    ctx.restore();
  }

  reset(): void {
    this.beatPulse = 0;
  }
}
