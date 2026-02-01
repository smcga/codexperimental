import { clamp, lerp, smoothstep } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type PaletteName = "day" | "sunset" | "night";

type Color = {
  r: number;
  g: number;
  b: number;
};

type IslandProfile = {
  samples: number[];
  width: number;
  height: number;
  depth: number;
  x: number;
  shade: number;
  seed: number;
};

type IslandCache = {
  seed: number;
  count: number;
  islands: IslandProfile[];
};

type FlyoverPalette = {
  skyTop: Color;
  skyHorizon: Color;
  seaBase: Color;
  seaHighlight: Color;
  islandBase: Color;
  islandShadow: Color;
  fog: Color;
};

const PALETTES: Record<PaletteName, FlyoverPalette> = {
  day: {
    skyTop: { r: 96, g: 174, b: 224 },
    skyHorizon: { r: 194, g: 224, b: 246 },
    seaBase: { r: 24, g: 92, b: 124 },
    seaHighlight: { r: 178, g: 226, b: 240 },
    islandBase: { r: 32, g: 86, b: 76 },
    islandShadow: { r: 22, g: 58, b: 52 },
    fog: { r: 204, g: 225, b: 236 }
  },
  sunset: {
    skyTop: { r: 54, g: 72, b: 132 },
    skyHorizon: { r: 246, g: 165, b: 120 },
    seaBase: { r: 26, g: 54, b: 92 },
    seaHighlight: { r: 255, g: 206, b: 164 },
    islandBase: { r: 44, g: 52, b: 68 },
    islandShadow: { r: 26, g: 30, b: 40 },
    fog: { r: 235, g: 187, b: 162 }
  },
  night: {
    skyTop: { r: 16, g: 20, b: 48 },
    skyHorizon: { r: 62, g: 78, b: 120 },
    seaBase: { r: 10, g: 28, b: 52 },
    seaHighlight: { r: 120, g: 148, b: 194 },
    islandBase: { r: 20, g: 30, b: 46 },
    islandShadow: { r: 10, g: 16, b: 26 },
    fog: { r: 70, g: 88, b: 120 }
  }
};

const SEA_SAMPLE_RESOLUTION = 96;
const ISLAND_SAMPLE_RESOLUTION = 96;

const clamp01 = (value: number): number => clamp(value, 0, 1);

const mixColor = (from: Color, to: Color, t: number): Color => ({
  r: lerp(from.r, to.r, t),
  g: lerp(from.g, to.g, t),
  b: lerp(from.b, to.b, t)
});

const colorToString = (color: Color): string =>
  `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;

const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967295;
  };
};

const hash1D = (value: number, seed: number): number => {
  let n = Math.imul(value, 374761393) + Math.imul(seed, 668265263);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  return (n ^ (n >>> 16)) / 4294967295;
};

const hash2D = (x: number, y: number, seed: number): number => {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2147483647);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  return (n ^ (n >>> 16)) / 4294967295;
};

const fade = (t: number): number => t * t * (3 - 2 * t);

const valueNoise1D = (x: number, seed: number): number => {
  const i0 = Math.floor(x);
  const i1 = i0 + 1;
  const t = fade(x - i0);
  return lerp(hash1D(i0, seed), hash1D(i1, seed), t);
};

const fbm1D = (x: number, seed: number): number => {
  let value = 0;
  let amplitude = 0.6;
  let frequency = 1;
  for (let i = 0; i < 4; i += 1) {
    value += valueNoise1D(x * frequency, seed + i * 71) * amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
};

const createIslandProfile = (seed: number, resolution = ISLAND_SAMPLE_RESOLUTION): number[] => {
  const samples: number[] = [];
  for (let i = 0; i < resolution; i += 1) {
    const x = i / (resolution - 1);
    const ridge = smoothstep(0, 0.5, x) * smoothstep(1, 0.5, x);
    const noise = fbm1D(x * 3, seed);
    samples.push(clamp01(noise * ridge));
  }
  return samples;
};

export const generateIslands = (seed: number, count: number): IslandProfile[] => {
  const random = mulberry32(seed);
  const islands: IslandProfile[] = [];
  for (let i = 0; i < count; i += 1) {
    const width = lerp(0.2, 0.4, random());
    const height = lerp(0.08, 0.18, random());
    const depth = lerp(0.2, 0.9, random());
    const x = random();
    const shade = random();
    const profileSeed = Math.floor(random() * 10000) + i * 193;
    islands.push({
      samples: createIslandProfile(profileSeed),
      width,
      height,
      depth,
      x,
      shade,
      seed: profileSeed
    });
  }
  return islands;
};

const resolvePaletteName = (params: Record<string, unknown>): PaletteName => {
  const paletteParam = params.palette;
  if (paletteParam === "day" || paletteParam === "sunset" || paletteParam === "night") {
    return paletteParam;
  }
  return "sunset";
};

export class FlyoverEffect implements Effect {
  private islandCache: IslandCache | null = null;

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const speed = params.speed ?? 1.0;
    const horizon = clamp(params.horizon ?? 0.45, 0.25, 0.75);
    const seaDetail = Math.max(0.5, params.seaDetail ?? 1.0);
    const waveSpeed = params.waveSpeed ?? 1.0;
    const waveIntensity = params.waveIntensity ?? 1.0;
    const islandCount = Math.max(3, Math.round(params.islandCount ?? 4));
    const islandSeed = Math.round(params.islandSeed ?? 1);
    const fog = clamp(params.fog ?? 0.65, 0, 1);
    const audioReactive = clamp(params.audioReactive ?? 0.35, 0, 1);

    const palette = PALETTES[resolvePaletteName(params as Record<string, unknown>)];

    const rms = audio?.rms ?? 0;
    const bass = audio?.bass ?? 0;

    const bob = Math.sin(time * (0.6 + speed * 0.2)) * (1.5 + bass * 5 * audioReactive);
    const horizonY = height * horizon + bob;

    ctx.clearRect(0, 0, width, height);
    this.drawSky(ctx, width, horizonY, time, palette, islandSeed);

    const islands = this.getIslands(islandSeed, islandCount);
    this.drawIslands(ctx, width, height, horizonY, time, speed, palette, fog, bass, audioReactive, islands);

    this.drawSea(
      ctx,
      width,
      height,
      horizonY,
      time,
      speed,
      seaDetail,
      waveSpeed,
      waveIntensity,
      fog,
      palette,
      islandSeed,
      rms,
      audioReactive
    );
  }

  private getIslands(seed: number, count: number): IslandProfile[] {
    if (!this.islandCache || this.islandCache.seed !== seed || this.islandCache.count !== count) {
      this.islandCache = {
        seed,
        count,
        islands: generateIslands(seed, count)
      };
    }
    return this.islandCache.islands;
  }

  private drawSky(
    ctx: CanvasRenderingContext2D,
    width: number,
    horizonY: number,
    time: number,
    palette: FlyoverPalette,
    seed: number
  ): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    gradient.addColorStop(0, colorToString(palette.skyTop));
    gradient.addColorStop(1, colorToString(palette.skyHorizon));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, horizonY + 1);

    const bandCount = 3;
    const bandSeed = seed + 77;
    for (let i = 0; i < bandCount; i += 1) {
      const bandBase = horizonY * (0.18 + i * 0.18);
      const bandHeight = horizonY * 0.14;
      const drift = time * (6 + i * 3);
      const step = 28;
      for (let x = -step; x < width + step; x += step) {
        const noise = hash2D(Math.floor((x + drift) / step), i, bandSeed);
        const offset = lerp(-6, 6, noise);
        const alpha = 0.05 + noise * 0.08;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.fillRect(x + (drift % step), bandBase + offset, step * 1.4, bandHeight * 0.6);
      }
    }
  }

  private drawIslands(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    horizonY: number,
    time: number,
    speed: number,
    palette: FlyoverPalette,
    fog: number,
    bass: number,
    audioReactive: number,
    islands: IslandProfile[]
  ): void {
    const seaLevel = horizonY + height * 0.01;

    islands.forEach((island, index) => {
      const widthPx = island.width * width;
      const heightPx = island.height * height;
      const drift = time * speed * 8 * (1 - island.depth);
      const jitter = Math.sin(time * 2.5 + island.seed) * bass * 2.5 * audioReactive;
      const span = width + widthPx * 1.5;
      const baseX = island.x * width + drift + jitter;
      const startX = ((baseX % span) + span) % span - widthPx * 0.75;
      const baseY = seaLevel + island.depth * height * 0.04;

      const shadeMix = mixColor(palette.islandBase, palette.islandShadow, island.shade);
      const fogMix = clamp01(fog * (1 - island.depth));
      const color = mixColor(shadeMix, palette.fog, fogMix);
      const alpha = clamp01(0.95 - fogMix * 0.55);

      ctx.beginPath();
      ctx.moveTo(startX, baseY);
      island.samples.forEach((sample, sampleIndex) => {
        const t = sampleIndex / (island.samples.length - 1);
        const x = startX + t * widthPx;
        const y = baseY - sample * heightPx;
        ctx.lineTo(x, y);
      });
      ctx.lineTo(startX + widthPx, baseY);
      ctx.closePath();
      ctx.fillStyle = `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${alpha.toFixed(
        3
      )})`;
      ctx.fill();

      if (index === 0) {
        ctx.strokeStyle = `rgba(${palette.fog.r}, ${palette.fog.g}, ${palette.fog.b}, 0.35)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, seaLevel + 0.5);
        ctx.lineTo(width, seaLevel + 0.5);
        ctx.stroke();
      }
    });
  }

  private drawSea(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    horizonY: number,
    time: number,
    speed: number,
    seaDetail: number,
    waveSpeed: number,
    waveIntensity: number,
    fog: number,
    palette: FlyoverPalette,
    seed: number,
    rms: number,
    audioReactive: number
  ): void {
    const seaHeight = height - horizonY;
    if (seaHeight <= 0) {
      return;
    }

    ctx.fillStyle = colorToString(palette.seaBase);
    ctx.fillRect(0, horizonY, width, seaHeight);

    const yStep = Math.max(1, Math.round(2 / seaDetail));
    const baseStep = Math.max(1, Math.round(2 / seaDetail));
    const timePhase = time * waveSpeed * speed * 1.8;
    const forwardPhase = time * speed * 0.5;

    for (let y = Math.floor(horizonY); y < height; y += yStep) {
      const depth = clamp01((y - horizonY) / seaHeight);
      const perspective = lerp(3.2, 0.8, depth);
      const stepX = Math.max(1, Math.round(baseStep * perspective));
      const fogMix = clamp01(fog * (1 - depth));
      const baseColor = mixColor(palette.seaBase, palette.fog, fogMix);
      const highlightScale = waveIntensity * (0.25 + depth * 0.85) + rms * audioReactive * 0.4;
      const phaseBase = timePhase + depth * 6 + forwardPhase * (1 - depth);
      const rowSeed = Math.floor(depth * SEA_SAMPLE_RESOLUTION);

      for (let x = 0; x < width; x += stepX) {
        const noise = hash2D(Math.floor(x / stepX), rowSeed, seed + 17);
        const phase = phaseBase + x * 0.02 * (1 + depth * 0.5) + noise * 4;
        const wave = Math.max(0, Math.sin(phase));
        const sparkle = clamp01(wave * wave * highlightScale);
        const color = mixColor(baseColor, palette.seaHighlight, sparkle);
        ctx.fillStyle = colorToString(color);
        ctx.fillRect(x, y, stepX, yStep);
      }
    }
  }
}
