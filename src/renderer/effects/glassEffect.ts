import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type GlassParams = {
  paneCount: number;
  bevel: number;
  wobble: number;
  shimmer: number;
  frost: number;
  tint: number;
  crackle: number;
  refraction: number;
  audioReact: number;
  seed: number;
};

type Point = {
  x: number;
  y: number;
};

export const GLASS_DEFAULTS = {
  paneCount: 14,
  bevel: 0.34,
  wobble: 0.45,
  shimmer: 0.55,
  frost: 0.42,
  tint: 198,
  crackle: 0.48,
  refraction: 0.68,
  audioReact: 0.35,
  seed: 0
} as const;

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const glassHash = (value: number): number => {
  const hashed = Math.sin(value * 127.1 + 311.7) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

export const resolveGlassParams = (params: Record<string, unknown>): GlassParams => ({
  paneCount: Math.round(clamp(toNumber(params.paneCount, GLASS_DEFAULTS.paneCount), 4, 36)),
  bevel: clamp(toNumber(params.bevel, GLASS_DEFAULTS.bevel), 0, 1),
  wobble: clamp(toNumber(params.wobble, GLASS_DEFAULTS.wobble), 0, 1),
  shimmer: clamp(toNumber(params.shimmer, GLASS_DEFAULTS.shimmer), 0, 1),
  frost: clamp(toNumber(params.frost, GLASS_DEFAULTS.frost), 0, 1),
  tint: clamp(toNumber(params.tint, GLASS_DEFAULTS.tint), 170, 230),
  crackle: clamp(toNumber(params.crackle, GLASS_DEFAULTS.crackle), 0, 1),
  refraction: clamp(toNumber(params.refraction, GLASS_DEFAULTS.refraction), 0, 1),
  audioReact: clamp(toNumber(params.audioReact, GLASS_DEFAULTS.audioReact), 0, 1),
  seed: toNumber(params.seed, GLASS_DEFAULTS.seed)
});

const polarPoint = (cx: number, cy: number, radius: number, angle: number): Point => ({
  x: cx + Math.cos(angle) * radius,
  y: cy + Math.sin(angle) * radius
});

const drawPolygon = (ctx: CanvasRenderingContext2D, points: Point[]): void => {
  if (points.length === 0) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
};

const midpoint = (a: Point, b: Point, pull: number): Point => ({
  x: a.x + (b.x - a.x) * pull,
  y: a.y + (b.y - a.y) * pull
});

export class GlassEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const config = resolveGlassParams(params as Record<string, unknown>);
    const beatPulse = audio.beat ? 1 : 0;
    const audioDrive = audio.rms * config.audioReact + beatPulse * 0.18 + audio.treble * config.shimmer * 0.12;
    const tintA = `hsla(${config.tint}, 55%, 55%, 0.18)`;
    const tintB = `hsla(${(config.tint + 22) % 360}, 48%, 12%, 0.94)`;

    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, tintA);
    background.addColorStop(0.5, "rgba(14, 18, 28, 0.92)");
    background.addColorStop(1, tintB);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < config.paneCount; i += 1) {
      const seed = config.seed * 1000 + i * 19.37;
      const cx = glassHash(seed + 1.1) * width;
      const cy = glassHash(seed + 2.7) * height;
      const baseRadius = (Math.min(width, height) * 0.09) + glassHash(seed + 4.9) * Math.min(width, height) * 0.18;
      const points: Point[] = [];
      const sides = 3 + Math.floor(glassHash(seed + 8.3) * 4);
      const wobble = config.wobble * (8 + glassHash(seed + 11.7) * 28);
      const spin = time * (0.08 + glassHash(seed + 13.2) * 0.18) * (0.4 + config.shimmer);

      for (let p = 0; p < sides; p += 1) {
        const angle = spin + (p / sides) * Math.PI * 2;
        const radius = baseRadius + (glassHash(seed + p * 7.3) - 0.5) * wobble;
        points.push(polarPoint(cx, cy, radius, angle));
      }

      drawPolygon(ctx, points);
      const paneFill = ctx.createLinearGradient(cx - baseRadius, cy - baseRadius, cx + baseRadius, cy + baseRadius);
      const paneAlpha = clamp(0.08 + config.refraction * 0.16 + audioDrive * 0.08, 0.08, 0.3);
      paneFill.addColorStop(0, `hsla(${config.tint}, 65%, 78%, ${paneAlpha.toFixed(3)})`);
      paneFill.addColorStop(0.45, `hsla(${(config.tint + 18) % 360}, 55%, 42%, ${(paneAlpha * 0.65).toFixed(3)})`);
      paneFill.addColorStop(1, `hsla(${(config.tint + 36) % 360}, 70%, 88%, ${(paneAlpha * 0.9).toFixed(3)})`);
      ctx.fillStyle = paneFill;
      ctx.fill();

      ctx.lineWidth = 1 + config.bevel * 3 + glassHash(seed + 16.1) * 1.3;
      ctx.strokeStyle = `rgba(220, 240, 255, ${(0.22 + config.bevel * 0.4 + audioDrive * 0.08).toFixed(3)})`;
      ctx.stroke();

      ctx.beginPath();
      const innerPull = clamp(0.18 + config.bevel * 0.44, 0.12, 0.62);
      const a = points[0];
      const b = points[1 % points.length];
      const c = points[2 % points.length];
      const start = midpoint(a, b, innerPull);
      const mid = midpoint(b, c, innerPull * 0.85);
      const end = midpoint(c, a, innerPull * 0.6);
      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(b.x, b.y, mid.x, mid.y);
      ctx.quadraticCurveTo(cx, cy, end.x, end.y);
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.16 + config.shimmer * 0.42 + audioDrive * 0.08).toFixed(3)})`;
      ctx.lineWidth = Math.max(0.8, config.bevel * 2.4);
      ctx.stroke();

      if (config.crackle > 0.02) {
        const crackSegments = 1 + Math.floor(config.crackle * 4 + glassHash(seed + 18.4) * 2);
        for (let crack = 0; crack < crackSegments; crack += 1) {
          const startIndex = crack % points.length;
          const startPoint = points[startIndex];
          const bendAngle = spin + crack * 1.7 + glassHash(seed + crack * 3.1) * 0.8;
          const bendRadius = baseRadius * (0.28 + glassHash(seed + crack * 5.9) * 0.36);
          const bendPoint = polarPoint(cx, cy, bendRadius, bendAngle);
          const endPoint = midpoint(startPoint, { x: cx, y: cy }, 0.65 + glassHash(seed + crack * 4.2) * 0.18);
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.quadraticCurveTo(bendPoint.x, bendPoint.y, endPoint.x, endPoint.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${(0.06 + config.crackle * 0.2).toFixed(3)})`;
          ctx.lineWidth = 0.7 + glassHash(seed + crack * 9.4) * 0.8;
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const frostPasses = Math.floor(22 + config.frost * 48);
    for (let i = 0; i < frostPasses; i += 1) {
      const seed = config.seed * 4000 + i * 13.17;
      const x = glassHash(seed + 3.1) * width;
      const y = glassHash(seed + 4.7) * height;
      const rx = 10 + glassHash(seed + 5.9) * 34 * (0.4 + config.frost);
      const ry = 4 + glassHash(seed + 6.4) * 18 * (0.5 + config.frost);
      const alpha = clamp(0.02 + config.frost * 0.06 + audioDrive * 0.015, 0.02, 0.09);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, glassHash(seed + 7.1) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const causticCount = Math.floor(3 + config.refraction * 8);
    for (let i = 0; i < causticCount; i += 1) {
      const seed = config.seed * 7000 + i * 23.11;
      const x0 = glassHash(seed + 1.2) * width;
      const y0 = glassHash(seed + 2.8) * height;
      const x1 = clamp(x0 + (glassHash(seed + 3.6) - 0.5) * width * 0.7, 0, width);
      const y1 = clamp(y0 + (glassHash(seed + 4.4) - 0.5) * height * 0.4, 0, height);
      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${(0.04 + config.refraction * 0.05).toFixed(3)})`);
      gradient.addColorStop(0.5, `hsla(${(config.tint + 28) % 360}, 70%, 72%, ${(0.08 + config.shimmer * 0.12 + audioDrive * 0.04).toFixed(3)})`);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1 + config.refraction * 8 * (0.3 + glassHash(seed + 5.5));
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) * 0.5, y0 - height * 0.08 * config.shimmer, x1, y1);
      ctx.stroke();
    }
  }
}
