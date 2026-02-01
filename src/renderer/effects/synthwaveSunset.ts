import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type Star = {
  x: number;
  y: number;
  size: number;
  brightness: number;
  drift: number;
};

type SilhouetteBlock = {
  x: number;
  width: number;
  height: number;
  wobble: number;
};

const DEFAULTS = {
  horizon: 0.52,
  sunRadius: 0.25,
  stripeHeight: 6,
  stripeGap: 4,
  seaSpeed: 1.0,
  starCount: 200,
  glow: 0.35,
  scanlines: 0.25,
  audioReactive: 0.3
};

const SUNSET_SEED = 1337;
const SILHOUETTE_SEED = 90210;

const createRng = (seed: number): (() => number) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

export const initStars = (seed: number, count: number): Star[] => {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => {
    const depth = lerp(0.4, 1, rng());
    return {
      x: rng(),
      y: rng(),
      size: lerp(0.6, 1.8, depth),
      brightness: lerp(0.45, 1, depth),
      drift: lerp(0.01, 0.05, depth)
    };
  });
};

export const generateSilhouettes = (seed: number, count: number): SilhouetteBlock[] => {
  const rng = createRng(seed);
  const segment = 1 / count;
  return Array.from({ length: count }, (_, index) => {
    const width = segment * lerp(0.6, 1.1, rng());
    const height = lerp(0.02, 0.09, rng());
    const jitter = segment * lerp(-0.15, 0.15, rng());
    return {
      x: clamp(index * segment + jitter, 0, 1 - width),
      width,
      height,
      wobble: rng() * Math.PI * 2
    };
  });
};

const drawStripedSun = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  stripeHeight: number,
  stripeGap: number,
  alpha = 1
): void => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  const gradient = ctx.createLinearGradient(0, centerY - radius, 0, centerY + radius);
  gradient.addColorStop(0, "#fff4a8");
  gradient.addColorStop(0.5, "#ff9a55");
  gradient.addColorStop(1, "#ff4fb2");
  ctx.fillStyle = gradient;
  ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

  ctx.globalCompositeOperation = "destination-out";
  const top = centerY - radius;
  const totalHeight = radius * 2;
  const step = stripeHeight + stripeGap;
  for (let y = top + stripeHeight; y < top + totalHeight; y += step) {
    ctx.fillRect(centerX - radius, y, radius * 2, stripeGap);
  }

  ctx.restore();
};

const drawSkyGradient = (ctx: CanvasRenderingContext2D, width: number, horizonY: number): void => {
  const gradient = ctx.createLinearGradient(0, 0, 0, horizonY);
  gradient.addColorStop(0, "#2a0b57");
  gradient.addColorStop(0.6, "#b41fe0");
  gradient.addColorStop(1, "#39f1ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, horizonY);
};

const drawStarfield = (
  ctx: CanvasRenderingContext2D,
  width: number,
  horizonY: number,
  time: number,
  audioReactive: number,
  stars: Star[],
  treble: number
): void => {
  const trebleBoost = 0.5 + treble * audioReactive;
  for (const star of stars) {
    const y = ((star.y + time * star.drift) % 1) * horizonY;
    const x = star.x * width;
    const alpha = clamp(star.brightness * trebleBoost, 0.1, 1);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(x, y, star.size, star.size);
  }
};

const drawSilhouettes = (
  ctx: CanvasRenderingContext2D,
  width: number,
  horizonY: number,
  time: number,
  blocks: SilhouetteBlock[]
): void => {
  ctx.fillStyle = "#1a082d";
  for (const block of blocks) {
    const wobble = Math.sin(time * 0.25 + block.wobble) * 3;
    const blockWidth = block.width * width;
    const blockHeight = block.height * horizonY;
    const x = block.x * width + wobble;
    const y = horizonY - blockHeight;
    ctx.fillRect(x, y, blockWidth, blockHeight);
  }
};

const drawSea = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  horizonY: number,
  time: number,
  seaSpeed: number,
  rms: number,
  audioReactive: number,
  includeBase = true
): void => {
  const seaHeight = height - horizonY;
  if (includeBase) {
    const baseGradient = ctx.createLinearGradient(0, horizonY, 0, height);
    baseGradient.addColorStop(0, "#251047");
    baseGradient.addColorStop(1, "#0a0418");
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, horizonY, width, seaHeight);
  }

  const bandSpacing = 6;
  const travel = (time * seaSpeed * 30) % bandSpacing;
  const bandCount = Math.ceil(seaHeight / bandSpacing) + 2;
  const topColor = { r: 120, g: 210, b: 255 };
  const bottomColor = { r: 35, g: 18, b: 70 };

  for (let i = 0; i < bandCount; i += 1) {
    const y = horizonY + ((i * bandSpacing + travel) % seaHeight);
    const depth = clamp((y - horizonY) / seaHeight, 0, 1);
    const bandIntensity = clamp((1 - depth) * 0.7 + rms * audioReactive * 0.6, 0, 1);
    const shimmer = Math.sin(time * 1.2 + depth * 18 + i) * 0.4;
    const r = Math.round(lerp(topColor.r, bottomColor.r, depth));
    const g = Math.round(lerp(topColor.g, bottomColor.g, depth));
    const b = Math.round(lerp(topColor.b, bottomColor.b, depth));
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${bandIntensity})`;
    ctx.fillRect(shimmer * 10, y, width - shimmer * 20, 2);

    const highlightWidth = width * (0.18 + (1 - depth) * 0.25);
    const highlightAlpha = bandIntensity * (1 - depth) * 0.8;
    ctx.fillStyle = `rgba(255, 170, 220, ${highlightAlpha})`;
    ctx.fillRect(width / 2 - highlightWidth / 2, y, highlightWidth, 1.5);
  }
};

const drawScanlines = (ctx: CanvasRenderingContext2D, width: number, height: number, opacity: number): void => {
  if (opacity <= 0) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = "rgba(10, 8, 20, 0.6)";
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1);
  }
  ctx.restore();
};

export class SynthwaveSunsetEffect implements Effect {
  private stars: Star[] = [];
  private silhouettes: SilhouetteBlock[] = [];
  private lastStarCount = 0;
  private lastSize = { width: 0, height: 0 };

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const horizon = clamp(params.horizon ?? DEFAULTS.horizon, 0.35, 0.75);
    const horizonY = height * horizon;
    const sunRadius = (params.sunRadius ?? DEFAULTS.sunRadius) * width;
    const stripeHeight = params.stripeHeight ?? DEFAULTS.stripeHeight;
    const stripeGap = params.stripeGap ?? DEFAULTS.stripeGap;
    const seaSpeed = params.seaSpeed ?? DEFAULTS.seaSpeed;
    const starCount = Math.max(0, Math.floor(params.starCount ?? DEFAULTS.starCount));
    const glow = clamp(params.glow ?? DEFAULTS.glow, 0, 1);
    const scanlines = clamp(params.scanlines ?? DEFAULTS.scanlines, 0, 1);
    const audioReactive = clamp(params.audioReactive ?? DEFAULTS.audioReactive, 0, 1);

    if (this.stars.length === 0 || starCount !== this.lastStarCount) {
      this.stars = initStars(SUNSET_SEED, starCount);
      this.lastStarCount = starCount;
    }

    if (this.silhouettes.length === 0 || width !== this.lastSize.width || height !== this.lastSize.height) {
      const count = Math.max(8, Math.round(width / 120));
      this.silhouettes = generateSilhouettes(SILHOUETTE_SEED, count);
      this.lastSize = { width, height };
    }

    ctx.clearRect(0, 0, width, height);
    drawSkyGradient(ctx, width, horizonY);
    drawStarfield(ctx, width, horizonY, time * 0.15, audioReactive, this.stars, audio.treble);

    drawStripedSun(ctx, width / 2, horizonY, sunRadius, stripeHeight, stripeGap);
    drawSilhouettes(ctx, width, horizonY, time, this.silhouettes);
    drawSea(ctx, width, height, horizonY, time, seaSpeed, audio.rms, audioReactive);

    if (glow > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      drawStripedSun(ctx, width / 2, horizonY, sunRadius * 1.02, stripeHeight, stripeGap, glow * 0.6);
      drawSea(ctx, width, height, horizonY, time, seaSpeed * 1.02, audio.rms, audioReactive * glow, false);
      ctx.restore();
    }

    drawScanlines(ctx, width, height, scanlines);
  }

  reset(): void {
    this.stars = [];
    this.silhouettes = [];
    this.lastStarCount = 0;
    this.lastSize = { width: 0, height: 0 };
  }
}
