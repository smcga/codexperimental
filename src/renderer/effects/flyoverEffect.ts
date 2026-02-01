import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type PaletteKey = "day" | "sunset" | "night";

type PaletteDefinition = {
  skyTop: [number, number, number];
  skyHorizon: [number, number, number];
  seaDeep: [number, number, number];
  seaHorizon: [number, number, number];
  seaHighlight: [number, number, number];
  islandNear: [number, number, number];
  islandFar: [number, number, number];
  haze: [number, number, number];
};

type FlyoverIsland = {
  x: number;
  width: number;
  height: number;
  depth: number;
  offset: number;
  samples: number[];
};

const PALETTES: Record<PaletteKey, PaletteDefinition> = {
  day: {
    skyTop: [122, 182, 232],
    skyHorizon: [192, 214, 232],
    seaDeep: [12, 60, 108],
    seaHorizon: [34, 114, 160],
    seaHighlight: [186, 224, 247],
    islandNear: [44, 92, 68],
    islandFar: [88, 118, 98],
    haze: [205, 224, 236]
  },
  sunset: {
    skyTop: [63, 42, 92],
    skyHorizon: [232, 140, 118],
    seaDeep: [24, 32, 78],
    seaHorizon: [90, 72, 124],
    seaHighlight: [248, 200, 168],
    islandNear: [72, 60, 74],
    islandFar: [118, 96, 98],
    haze: [232, 170, 148]
  },
  night: {
    skyTop: [9, 16, 36],
    skyHorizon: [36, 44, 70],
    seaDeep: [4, 10, 28],
    seaHorizon: [12, 26, 54],
    seaHighlight: [94, 140, 186],
    islandNear: [24, 36, 46],
    islandFar: [48, 66, 82],
    haze: [62, 74, 98]
  }
};

const DEFAULT_ISLAND_SAMPLE_COUNT = 64;

export function createMulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function valueNoise1D(x: number, seed: number): number {
  const x0 = Math.floor(x);
  const x1 = x0 + 1;
  const t = x - x0;
  const v0 = hash1D(x0, seed);
  const v1 = hash1D(x1, seed);
  const smoothT = t * t * (3 - 2 * t);
  return lerp(v0, v1, smoothT);
}

function hash1D(value: number, seed: number): number {
  let x = value;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  x ^= seed * 374761393;
  x = Math.imul(x ^ (x >>> 16), 2246822519);
  return ((x >>> 0) % 1024) / 1024;
}

export function generateFlyoverIslands(seed: number, count: number): FlyoverIsland[] {
  const rng = createMulberry32(seed);
  const islands: FlyoverIsland[] = [];
  const islandCount = Math.max(1, Math.floor(count));

  for (let i = 0; i < islandCount; i += 1) {
    const depth = lerp(0.15, 0.85, rng());
    const width = lerp(0.16, 0.32, rng());
    const height = lerp(0.04, 0.12, rng());
    const offset = lerp(-0.01, 0.02, rng());
    const baseX = rng();
    const noiseScale = lerp(1.6, 3.4, rng());
    const samples: number[] = new Array(DEFAULT_ISLAND_SAMPLE_COUNT);

    for (let s = 0; s < DEFAULT_ISLAND_SAMPLE_COUNT; s += 1) {
      const t = s / (DEFAULT_ISLAND_SAMPLE_COUNT - 1);
      const envelope = Math.sin(Math.PI * t);
      const noise = valueNoise1D(t * noiseScale + i * 7.3, seed + i * 19);
      samples[s] = clamp((0.35 + noise * 0.7) * envelope, 0, 1);
    }

    islands.push({
      x: baseX,
      width,
      height,
      depth,
      offset,
      samples
    });
  }

  return islands;
}

export class FlyoverEffect implements Effect {
  private islands: FlyoverIsland[] = [];
  private islandSeed = 1;
  private islandCount = 4;

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const speed = params.speed ?? 1.0;
    const horizon = params.horizon ?? 0.45;
    const seaDetail = Math.max(0.4, params.seaDetail ?? 1.0);
    const waveSpeed = params.waveSpeed ?? 1.0;
    const waveIntensity = params.waveIntensity ?? 1.0;
    const islandCount = params.islandCount ?? 4;
    const islandSeed = params.islandSeed ?? 1;
    const fog = clamp(params.fog ?? 0.65, 0, 1);
    const audioReactive = clamp(params.audioReactive ?? 0.35, 0, 1);
    const paletteParam = (params as Record<string, number | string>).palette;
    const paletteKey = resolvePaletteKey(paletteParam);
    const palette = PALETTES[paletteKey];

    if (this.islandSeed !== islandSeed || this.islandCount !== islandCount || this.islands.length === 0) {
      this.islands = generateFlyoverIslands(islandSeed, islandCount);
      this.islandSeed = islandSeed;
      this.islandCount = islandCount;
    }

    const horizonY = height * clamp(horizon, 0.2, 0.8);
    const seaHeight = Math.max(1, height - horizonY);
    const audioBass = audio?.bass ?? 0;
    const audioRms = audio?.rms ?? 0;
    const bob = Math.sin(time * 0.6 * speed) * 2.2 * (0.35 + audioBass * audioReactive);
    const shimmer = audioBass * audioReactive * 2.2;

    ctx.clearRect(0, 0, width, height);

    const skyGradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGradient.addColorStop(0, rgbString(palette.skyTop));
    skyGradient.addColorStop(1, rgbString(palette.skyHorizon));
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, horizonY);

    drawCloudBands(ctx, width, horizonY, time, speed, palette, seaDetail);

    renderIslands(ctx, width, horizonY, bob, shimmer, time, speed, palette, fog, this.islands);

    renderSea(
      ctx,
      width,
      height,
      horizonY,
      seaHeight,
      time,
      speed,
      seaDetail,
      waveSpeed,
      waveIntensity,
      fog,
      audioRms,
      audioReactive,
      palette
    );
  }
}

function resolvePaletteKey(value: unknown): PaletteKey {
  if (value === "day" || value === "sunset" || value === "night") {
    return value;
  }
  if (value === 0) {
    return "day";
  }
  if (value === 2) {
    return "night";
  }
  return "sunset";
}

function renderIslands(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizonY: number,
  bob: number,
  shimmer: number,
  time: number,
  speed: number,
  palette: PaletteDefinition,
  fog: number,
  islands: FlyoverIsland[]
): void {
  const drift = time * speed * 0.015;

  islands.forEach((island, index) => {
    const depth = island.depth;
    const parallax = drift * (1 - depth);
    const jitter = (index % 2 === 0 ? 1 : -1) * shimmer * 0.4;
    const baseX = wrap01(island.x + parallax + jitter * 0.0004);
    const widthPx = island.width * width;
    const heightPx = island.height * (horizonY * 0.8);
    const startX = baseX * width - widthPx * 0.5;
    const baseY = horizonY + island.offset * horizonY + bob * 0.3;
    const fogAlpha = clamp(1 - fog * (1 - depth), 0.1, 1);
    const islandColor = mixColor(palette.islandFar, palette.islandNear, depth);

    drawIslandShape(ctx, startX, baseY, widthPx, heightPx, island.samples, islandColor, fogAlpha);
    if (startX + widthPx < width) {
      drawIslandShape(ctx, startX + width, baseY, widthPx, heightPx, island.samples, islandColor, fogAlpha);
    }
    if (startX > 0) {
      drawIslandShape(ctx, startX - width, baseY, widthPx, heightPx, island.samples, islandColor, fogAlpha);
    }
  });
}

function drawIslandShape(
  ctx: CanvasRenderingContext2D,
  startX: number,
  baseY: number,
  widthPx: number,
  heightPx: number,
  samples: number[],
  color: [number, number, number],
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = rgbString(color);
  ctx.beginPath();
  ctx.moveTo(startX, baseY);
  const step = widthPx / (samples.length - 1);
  for (let i = 0; i < samples.length; i += 1) {
    const x = startX + step * i;
    const y = baseY - samples[i] * heightPx;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(startX + widthPx, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function renderSea(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  horizonY: number,
  seaHeight: number,
  time: number,
  speed: number,
  seaDetail: number,
  waveSpeed: number,
  waveIntensity: number,
  fog: number,
  audioRms: number,
  audioReactive: number,
  palette: PaletteDefinition
): void {
  const stepX = Math.max(1, Math.round(2 / seaDetail));
  const stepY = 1;
  const horizonR = palette.seaHorizon[0];
  const horizonG = palette.seaHorizon[1];
  const horizonB = palette.seaHorizon[2];
  const deepR = palette.seaDeep[0];
  const deepG = palette.seaDeep[1];
  const deepB = palette.seaDeep[2];
  const fogR = palette.haze[0];
  const fogG = palette.haze[1];
  const fogB = palette.haze[2];
  const highlightR = palette.seaHighlight[0];
  const highlightG = palette.seaHighlight[1];
  const highlightB = palette.seaHighlight[2];
  const waveBase = time * waveSpeed * speed * 1.4;
  const audioBoost = 1 + audioRms * audioReactive * 0.6;

  for (let y = Math.floor(horizonY); y < height; y += stepY) {
    const depth = clamp((y - horizonY) / seaHeight, 0, 1);
    const perspective = Math.pow(depth, 1.6);
    const wavePhase = waveBase + perspective * 12.0;
    const rowMix = lerp(horizonR, deepR, perspective);
    const rowMixG = lerp(horizonG, deepG, perspective);
    const rowMixB = lerp(horizonB, deepB, perspective);
    const fogAmount = fog * (1 - perspective);
    const rowR = lerp(rowMix, fogR, fogAmount);
    const rowG = lerp(rowMixG, fogG, fogAmount);
    const rowB = lerp(rowMixB, fogB, fogAmount);
    const dither = (valueNoise1D(y * 0.07, 91) - 0.5) * 8;

    for (let x = 0; x < width; x += stepX) {
      const noise = valueNoise1D(x * 0.035 + perspective * 4.2, 31);
      const wave = Math.sin(wavePhase + x * 0.05 * seaDetail + noise * 1.8);
      const highlight = Math.max(0, wave) * (0.35 + noise * 0.65) * waveIntensity * audioBoost;
      const mix = clamp(highlight, 0, 1);
      const finalR = clamp(lerp(rowR + dither, highlightR, mix), 0, 255);
      const finalG = clamp(lerp(rowG + dither, highlightG, mix), 0, 255);
      const finalB = clamp(lerp(rowB + dither, highlightB, mix), 0, 255);
      ctx.fillStyle = `rgb(${Math.round(finalR)}, ${Math.round(finalG)}, ${Math.round(finalB)})`;
      ctx.fillRect(x, y, stepX, stepY);
    }
  }
}

function drawCloudBands(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizonY: number,
  time: number,
  speed: number,
  palette: PaletteDefinition,
  seaDetail: number
): void {
  const bands = 3;
  const bandStep = Math.max(22, 48 / seaDetail);
  for (let i = 0; i < bands; i += 1) {
    const bandY = horizonY * (0.22 + i * 0.12);
    const bandHeight = horizonY * (0.08 + i * 0.015);
    const drift = time * speed * (0.02 + i * 0.01);
    ctx.save();
    ctx.globalAlpha = 0.12 + i * 0.04;
    for (let x = -bandStep; x < width + bandStep; x += bandStep) {
      const noise = valueNoise1D(x * 0.03 + drift, 200 + i * 19);
      const offset = (noise - 0.5) * bandHeight * 0.6;
      ctx.fillStyle = rgbString(palette.haze);
      ctx.fillRect(x + drift * 120, bandY + offset, bandStep * 0.9, bandHeight * 0.3);
    }
    ctx.restore();
  }
}

function mixColor(
  from: [number, number, number],
  to: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t)];
}

function wrap01(value: number): number {
  const wrapped = value % 1;
  return wrapped < 0 ? wrapped + 1 : wrapped;
}

function rgbString(color: [number, number, number]): string {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}
