import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export type GodRaysStyle = "sunbreak" | "window" | "cathedral";

type GodRaysParams = {
  sourceX: number;
  sourceY: number;
  rayCount: number;
  spread: number;
  intensity: number;
  haze: number;
  occlusion: number;
  drift: number;
  pulse: number;
  warmth: number;
  dust: number;
  seed: number;
  style: GodRaysStyle;
  sourceDriftX: number;
  sourceDriftY: number;
  shadowBands: number;
};

type GodRayDescriptor = {
  angleOffset: number;
  width: number;
  intensity: number;
  length: number;
  flickerPhase: number;
};

type DustDescriptor = {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  depth: number;
};

export const GOD_RAYS_DEFAULTS = {
  sourceX: 0.5,
  sourceY: 0.2,
  rayCount: 24,
  spread: 0.55,
  intensity: 1,
  haze: 0.6,
  occlusion: 0.5,
  drift: 0.25,
  pulse: 0.35,
  warmth: 0.65,
  dust: 0.25,
  seed: 0,
  style: "sunbreak",
  sourceDriftX: 0,
  sourceDriftY: 0,
  shadowBands: 0.5
} as const;

const STYLE_SET = new Set<GodRaysStyle>(["sunbreak", "window", "cathedral"]);
const TAU = Math.PI * 2;

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const resolveGodRaysParams = (params: Record<string, unknown>, era: string | undefined): GodRaysParams => {
  const eraRayFactor = era === "8bit" || era === "16bit" ? 0.7 : 1;
  const eraHazeBoost = era === "future" ? 1.15 : era === "pcdemo" || era === "ps1" ? 1.05 : 0.9;

  const rawStyle = typeof params.style === "string" ? params.style : GOD_RAYS_DEFAULTS.style;
  const style = STYLE_SET.has(rawStyle as GodRaysStyle) ? (rawStyle as GodRaysStyle) : GOD_RAYS_DEFAULTS.style;

  return {
    sourceX: clamp(toNumber(params.sourceX, GOD_RAYS_DEFAULTS.sourceX), -0.5, 1.5),
    sourceY: clamp(toNumber(params.sourceY, GOD_RAYS_DEFAULTS.sourceY), -0.5, 1.2),
    rayCount: Math.round(clamp(toNumber(params.rayCount, GOD_RAYS_DEFAULTS.rayCount) * eraRayFactor, 8, 56)),
    spread: clamp(toNumber(params.spread, GOD_RAYS_DEFAULTS.spread), 0.1, 1),
    intensity: clamp(toNumber(params.intensity, GOD_RAYS_DEFAULTS.intensity), 0, 3),
    haze: clamp(toNumber(params.haze, GOD_RAYS_DEFAULTS.haze) * eraHazeBoost, 0, 1.2),
    occlusion: clamp(toNumber(params.occlusion, GOD_RAYS_DEFAULTS.occlusion), 0, 1),
    drift: clamp(toNumber(params.drift, GOD_RAYS_DEFAULTS.drift), 0, 2),
    pulse: clamp(toNumber(params.pulse, GOD_RAYS_DEFAULTS.pulse), 0, 1.5),
    warmth: clamp(toNumber(params.warmth, GOD_RAYS_DEFAULTS.warmth), 0, 1),
    dust: clamp(toNumber(params.dust, GOD_RAYS_DEFAULTS.dust), 0, 1),
    seed: Math.round(Math.abs(toNumber(params.seed, GOD_RAYS_DEFAULTS.seed))),
    style,
    sourceDriftX: clamp(toNumber(params.sourceDriftX, GOD_RAYS_DEFAULTS.sourceDriftX), -1, 1),
    sourceDriftY: clamp(toNumber(params.sourceDriftY, GOD_RAYS_DEFAULTS.sourceDriftY), -1, 1),
    shadowBands: clamp(toNumber(params.shadowBands, GOD_RAYS_DEFAULTS.shadowBands), 0, 1)
  };
};

const buildRays = (count: number, style: GodRaysStyle, seed: number): GodRayDescriptor[] => {
  const rng = mulberry32(seed * 7919 + count * 37 + style.length * 101);
  const rays: GodRayDescriptor[] = [];
  for (let i = 0; i < count; i += 1) {
    const u = count <= 1 ? 0.5 : i / (count - 1);
    const centerBias = 1 - Math.abs(u * 2 - 1);
    const styleLength = style === "cathedral" ? 1.25 : style === "window" ? 0.88 : 1;
    rays.push({
      angleOffset: (u - 0.5) * 2,
      width: lerp(0.012, 0.07, Math.pow(rng(), 1.4)),
      intensity: lerp(0.35, 1, Math.pow(centerBias, 0.45)) * lerp(0.7, 1.2, rng()),
      length: lerp(0.9, 1.3, rng()) * styleLength,
      flickerPhase: rng() * TAU
    });
  }
  return rays;
};

const buildDust = (seed: number, count: number): DustDescriptor[] => {
  const rng = mulberry32(seed * 1231 + count * 13 + 17);
  return new Array(count).fill(0).map(() => ({
    x: rng(),
    y: rng(),
    size: lerp(0.6, 2.8, rng()),
    speed: lerp(0.01, 0.06, rng()),
    phase: rng() * TAU,
    depth: lerp(0.3, 1.1, rng())
  }));
};

export class GodRaysEffect implements Effect {
  private cacheKey = "";

  private rays: GodRayDescriptor[] = [];

  private dust: DustDescriptor[] = [];

  render({ ctx, width, height, time, audio, params, era }: EffectRenderContext): void {
    const cfg = resolveGodRaysParams(params as Record<string, unknown>, era);
    const driftTime = time * (0.08 + cfg.drift * 0.4);
    const sourceX = (cfg.sourceX + Math.sin(driftTime * 0.71) * cfg.sourceDriftX * 0.12) * width;
    const sourceY = (cfg.sourceY + Math.cos(driftTime * 0.59) * cfg.sourceDriftY * 0.12) * height;

    this.ensureCache(cfg, width, height);

    const audioLift = clamp(audio.rms * 0.8 + audio.treble * 0.45 + (audio.beat ? 0.22 : 0), 0, 1.4);
    const pulse = 1 + cfg.pulse * audioLift;

    const warmR = Math.round(lerp(170, 255, cfg.warmth));
    const warmG = Math.round(lerp(190, 228, cfg.warmth));
    const warmB = Math.round(lerp(255, 176, cfg.warmth));

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, `rgb(${Math.round(warmR * 0.09)}, ${Math.round(warmG * 0.1)}, ${Math.round(warmB * 0.14)})`);
    bg.addColorStop(0.55, `rgb(${Math.round(warmR * 0.14)}, ${Math.round(warmG * 0.14)}, ${Math.round(warmB * 0.16)})`);
    bg.addColorStop(1, `rgb(${Math.round(warmR * 0.05)}, ${Math.round(warmG * 0.06)}, ${Math.round(warmB * 0.08)})`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    this.drawHaze(ctx, width, height, sourceX, sourceY, cfg, pulse, warmR, warmG, warmB, driftTime);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const ray of this.rays) {
      const spreadRadians = cfg.spread * (Math.PI * 0.65);
      const styleAngleBias = cfg.style === "window" ? 0.08 : cfg.style === "cathedral" ? -0.03 : 0;
      const angle = Math.PI / 2 + styleAngleBias + ray.angleOffset * spreadRadians + Math.sin(driftTime * 0.7 + ray.flickerPhase) * cfg.drift * 0.045;
      const rayLength = Math.hypot(width, height) * ray.length;
      const endX = sourceX + Math.cos(angle) * rayLength;
      const endY = sourceY + Math.sin(angle) * rayLength;
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);
      const startWidth = ray.width * width * 0.12;
      const endWidth = ray.width * width * (0.8 + cfg.occlusion * 0.65);
      const rayAlpha = clamp(0.03 + cfg.intensity * ray.intensity * 0.085 * pulse, 0, 0.45);

      const grad = ctx.createLinearGradient(sourceX, sourceY, endX, endY);
      grad.addColorStop(0, `rgba(${warmR}, ${warmG}, ${warmB}, ${(rayAlpha * 1.2).toFixed(3)})`);
      grad.addColorStop(0.35, `rgba(${warmR}, ${warmG}, ${warmB}, ${(rayAlpha * 0.62).toFixed(3)})`);
      grad.addColorStop(1, `rgba(${warmR}, ${warmG}, ${warmB}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(sourceX + perpX * startWidth, sourceY + perpY * startWidth);
      ctx.lineTo(endX + perpX * endWidth, endY + perpY * endWidth);
      ctx.lineTo(endX - perpX * endWidth, endY - perpY * endWidth);
      ctx.lineTo(sourceX - perpX * startWidth, sourceY - perpY * startWidth);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    this.drawOcclusion(ctx, width, height, sourceX, sourceY, cfg, driftTime);
    this.drawSourceGlow(ctx, sourceX, sourceY, width, cfg, pulse, warmR, warmG, warmB, audio.bass);
    this.drawDust(ctx, width, height, cfg, time, warmR, warmG, warmB);
  }

  private ensureCache(cfg: GodRaysParams, width: number, height: number): void {
    const key = `${width}x${height}|${cfg.rayCount}|${cfg.style}|${cfg.seed}|${cfg.dust}`;
    if (key === this.cacheKey) {
      return;
    }
    this.cacheKey = key;
    this.rays = buildRays(cfg.rayCount, cfg.style, cfg.seed);
    this.dust = buildDust(cfg.seed, Math.round(60 + cfg.dust * 120));
  }

  private drawHaze(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    sourceX: number,
    sourceY: number,
    cfg: GodRaysParams,
    pulse: number,
    warmR: number,
    warmG: number,
    warmB: number,
    driftTime: number
  ): void {
    const hazeAlpha = clamp(0.06 + cfg.haze * 0.28 * pulse, 0.02, 0.42);
    const haze = ctx.createRadialGradient(sourceX, sourceY, width * 0.02, sourceX, sourceY, Math.max(width, height) * 0.95);
    haze.addColorStop(0, `rgba(${warmR}, ${warmG}, ${warmB}, ${(hazeAlpha * 0.95).toFixed(3)})`);
    haze.addColorStop(0.45, `rgba(${warmR}, ${warmG}, ${warmB}, ${(hazeAlpha * 0.45).toFixed(3)})`);
    haze.addColorStop(1, `rgba(${warmR}, ${warmG}, ${warmB}, 0)`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);

    const bands = cfg.style === "cathedral" ? 5 : 3;
    for (let i = 0; i < bands; i += 1) {
      const y = height * (0.22 + i * 0.2) + Math.sin(driftTime * (0.5 + i * 0.16) + i) * (14 + cfg.drift * 28);
      const band = ctx.createLinearGradient(0, y - 45, 0, y + 45);
      band.addColorStop(0, "rgba(0, 0, 0, 0)");
      band.addColorStop(0.5, `rgba(${warmR}, ${warmG}, ${warmB}, ${(0.03 + cfg.haze * 0.06).toFixed(3)})`);
      band.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, y - 60, width, 120);
    }
  }

  private drawOcclusion(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    sourceX: number,
    sourceY: number,
    cfg: GodRaysParams,
    driftTime: number
  ): void {
    const occAlpha = clamp(cfg.occlusion * (0.22 + cfg.shadowBands * 0.24), 0, 0.5);
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = `rgba(0, 0, 0, ${occAlpha.toFixed(3)})`;

    if (cfg.style === "window") {
      const slatCount = Math.round(6 + cfg.occlusion * 8);
      const slatSpacing = width / Math.max(1, slatCount);
      for (let i = -1; i <= slatCount + 1; i += 1) {
        const sway = Math.sin(driftTime * 0.8 + i * 0.9) * width * 0.01;
        const x = i * slatSpacing + sway;
        const slatWidth = slatSpacing * (0.3 + cfg.shadowBands * 0.4);
        ctx.fillRect(x, 0, slatWidth, height);
      }
    } else {
      const blobCount = Math.round(5 + cfg.occlusion * 8 + (cfg.style === "cathedral" ? 3 : 0));
      for (let i = 0; i < blobCount; i += 1) {
        const phase = i * 1.17 + cfg.seed * 0.37;
        const x = sourceX + Math.sin(phase + driftTime * 0.7) * width * (0.15 + (i % 3) * 0.05);
        const y = sourceY + height * (0.08 + i / Math.max(1, blobCount) * 0.7) + Math.cos(phase * 0.7 + driftTime * 0.5) * 20;
        const radius = width * (0.05 + ((i * 13) % 7) * 0.01 + cfg.occlusion * 0.08);
        const ellipseY = radius * (cfg.style === "cathedral" ? 1.6 : 1.2);
        ctx.beginPath();
        ctx.ellipse(x, y, radius, ellipseY, phase * 0.4, 0, TAU);
        ctx.fill();
      }
    }

    if (cfg.shadowBands > 0.01) {
      const bandCount = Math.round(4 + cfg.shadowBands * 10);
      for (let i = 0; i < bandCount; i += 1) {
        const t = i / Math.max(1, bandCount - 1);
        const y = lerp(sourceY + height * 0.08, height * 0.98, t) + Math.sin(driftTime * 0.6 + t * 7.2) * 10;
        const h = 8 + cfg.shadowBands * 20;
        ctx.fillRect(0, y, width, h);
      }
    }

    ctx.restore();
  }

  private drawSourceGlow(
    ctx: CanvasRenderingContext2D,
    sourceX: number,
    sourceY: number,
    width: number,
    cfg: GodRaysParams,
    pulse: number,
    warmR: number,
    warmG: number,
    warmB: number,
    bass: number
  ): void {
    const base = width * (0.04 + cfg.intensity * 0.03 + bass * cfg.pulse * 0.025);
    const outer = base * (6 + cfg.haze * 3 + (cfg.style === "cathedral" ? 1.2 : 0));

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const halo = ctx.createRadialGradient(sourceX, sourceY, base * 0.4, sourceX, sourceY, outer);
    halo.addColorStop(0, `rgba(${warmR}, ${warmG}, ${warmB}, ${(0.25 * pulse).toFixed(3)})`);
    halo.addColorStop(0.35, `rgba(${warmR}, ${warmG}, ${warmB}, ${(0.14 * pulse).toFixed(3)})`);
    halo.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(sourceX - outer, sourceY - outer, outer * 2, outer * 2);

    const core = ctx.createRadialGradient(sourceX, sourceY, 0, sourceX, sourceY, base * 1.3);
    core.addColorStop(0, `rgba(255, 255, 255, ${(0.72 * pulse).toFixed(3)})`);
    core.addColorStop(0.3, `rgba(${warmR}, ${warmG}, ${warmB}, ${(0.38 * pulse).toFixed(3)})`);
    core.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = core;
    ctx.fillRect(sourceX - base * 1.5, sourceY - base * 1.5, base * 3, base * 3);

    ctx.restore();
  }

  private drawDust(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cfg: GodRaysParams,
    time: number,
    warmR: number,
    warmG: number,
    warmB: number
  ): void {
    if (cfg.dust <= 0.001) {
      return;
    }
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const mote of this.dust) {
      const x = ((mote.x + Math.sin(time * mote.speed + mote.phase) * 0.03 + time * mote.speed * 0.04) % 1 + 1) % 1;
      const y = ((mote.y + Math.cos(time * mote.speed * 0.6 + mote.phase) * 0.02 + time * mote.speed * 0.02) % 1 + 1) % 1;
      const px = x * width;
      const py = y * height;
      const alpha = clamp((0.04 + cfg.dust * 0.1) * mote.depth, 0.01, 0.18);
      ctx.fillStyle = `rgba(${warmR}, ${warmG}, ${warmB}, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(px, py, mote.size, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  reset(): void {
    this.cacheKey = "";
    this.rays = [];
    this.dust = [];
  }
}
