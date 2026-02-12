import { clamp, lerp } from "../../util/math";
import { PixelBuffer } from "./pixelBuffer";
import { Effect, EffectRenderContext } from "./types";

type VoxelLandscapeMaps = {
  height: Uint8Array;
  color: Uint8Array;
  size: number;
  seed: number;
};

type MapColor = {
  r: number;
  g: number;
  b: number;
};

export const VOXEL_LANDSCAPE_DEFAULTS = {
  bufW: 320,
  bufH: 200,
  speed: 70,
  turnRate: 0.15,
  turnWobble: 0.1,
  camH: 110,
  heightBob: 6,
  beatBump: 10,
  fov: 1.0,
  scale: 120,
  maxDist: 900,
  stepBase: 2,
  stepGrow: 80,
  fogStrength: 0.75,
  audioReact: 0.7,
  beatKick: 0.7,
  seed: 1337
};

type VoxelLandscapeViewSettings = {
  fov: number;
  scale: number;
  camBase: number;
  horizon: number;
  maxDist: number;
};

const MAP_SIZE = 256;

const clamp01 = (value: number): number => clamp(value, 0, 1);

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

const hash2D = (x: number, y: number, seed: number): number => {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2147483647);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  return (n ^ (n >>> 16)) / 4294967295;
};

const fade = (t: number): number => t * t * (3 - 2 * t);

const valueNoise2D = (
  x: number,
  y: number,
  scale: number,
  gridMask: number,
  seed: number
): number => {
  const fx = x / scale;
  const fy = y / scale;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fade(fx - x0);
  const ty = fade(fy - y0);
  const gx0 = x0 & gridMask;
  const gy0 = y0 & gridMask;
  const gx1 = (x0 + 1) & gridMask;
  const gy1 = (y0 + 1) & gridMask;
  const n00 = hash2D(gx0, gy0, seed);
  const n10 = hash2D(gx1, gy0, seed);
  const n01 = hash2D(gx0, gy1, seed);
  const n11 = hash2D(gx1, gy1, seed);
  const nx0 = lerp(n00, n10, tx);
  const nx1 = lerp(n01, n11, tx);
  return lerp(nx0, nx1, ty);
};

const lerpColor = (a: MapColor, b: MapColor, t: number): MapColor => ({
  r: lerp(a.r, b.r, t),
  g: lerp(a.g, b.g, t),
  b: lerp(a.b, b.b, t)
});

export const computeVoxelLandscapeViewSettings = (
  viewportWidth: number,
  viewportHeight: number,
  settings: VoxelLandscapeViewSettings
): VoxelLandscapeViewSettings => {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return settings;
  }

  const aspect = viewportWidth / viewportHeight;
  const portraitStrength = clamp01((1 - aspect) / 0.6);
  if (portraitStrength <= 0) {
    return settings;
  }

  const adjustedScale = settings.scale * (1 - portraitStrength * 0.35);
  const adjustedFov = settings.fov * (1 + portraitStrength * 0.45);
  const adjustedCamBase = settings.camBase + portraitStrength * 22;
  const adjustedHorizon = settings.horizon + viewportHeight * portraitStrength * 0.08;
  const adjustedMaxDist = settings.maxDist * (1 + portraitStrength * 0.18);

  return {
    scale: adjustedScale,
    fov: adjustedFov,
    camBase: adjustedCamBase,
    horizon: adjustedHorizon,
    maxDist: adjustedMaxDist
  };
};

export const generateVoxelLandscapeMaps = (seed: number, mapSize = MAP_SIZE): VoxelLandscapeMaps => {
  const heightField = new Float32Array(mapSize * mapSize);
  const octaves = [
    { scale: 64, amplitude: 0.6 },
    { scale: 32, amplitude: 0.35 },
    { scale: 16, amplitude: 0.22 },
    { scale: 8, amplitude: 0.12 },
    { scale: 4, amplitude: 0.06 }
  ];

  octaves.forEach((octave, index) => {
    const gridSize = Math.max(1, Math.round(mapSize / octave.scale));
    const gridMask = gridSize - 1;
    for (let y = 0; y < mapSize; y += 1) {
      const rowIndex = y * mapSize;
      for (let x = 0; x < mapSize; x += 1) {
        const noise = valueNoise2D(x, y, octave.scale, gridMask, seed + index * 131);
        heightField[rowIndex + x] += noise * octave.amplitude;
      }
    }
  });

  const random = mulberry32(seed ^ 0x9e3779b9);
  for (let hill = 0; hill < 3; hill += 1) {
    const cx = random() * mapSize;
    const cy = random() * mapSize;
    const radius = lerp(mapSize * 0.12, mapSize * 0.28, random());
    const height = lerp(0.35, 0.8, random());
    for (let y = 0; y < mapSize; y += 1) {
      const rowIndex = y * mapSize;
      const dy = y - cy;
      for (let x = 0; x < mapSize; x += 1) {
        const dx = x - cx;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius) {
          const t = 1 - dist / radius;
          heightField[rowIndex + x] += t * t * height;
        }
      }
    }
  }

  for (let y = 0; y < mapSize; y += 1) {
    const rowIndex = y * mapSize;
    const ridgeY = Math.sin((y + seed * 3) * 0.05) * 0.08;
    for (let x = 0; x < mapSize; x += 1) {
      const ridgeX = Math.cos((x - seed * 2) * 0.06) * 0.08;
      heightField[rowIndex + x] += ridgeX + ridgeY;
    }
  }

  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < heightField.length; i += 1) {
    const value = heightField[i];
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
  }

  const height = new Uint8Array(mapSize * mapSize);
  const color = new Uint8Array(mapSize * mapSize * 3);
  const low: MapColor = { r: 18, g: 64, b: 82 };
  const mid: MapColor = { r: 44, g: 118, b: 74 };
  const high: MapColor = { r: 120, g: 110, b: 96 };
  const snow: MapColor = { r: 220, g: 220, b: 230 };
  const range = max - min || 1;

  for (let i = 0; i < height.length; i += 1) {
    const normalized = clamp01((heightField[i] - min) / range);
    const h = Math.round(normalized * 255);
    height[i] = h;
    let base: MapColor;
    if (normalized < 0.35) {
      base = lerpColor(low, mid, normalized / 0.35);
    } else if (normalized < 0.7) {
      base = lerpColor(mid, high, (normalized - 0.35) / 0.35);
    } else {
      base = lerpColor(high, snow, (normalized - 0.7) / 0.3);
    }
    const colorIndex = i * 3;
    color[colorIndex] = Math.round(base.r);
    color[colorIndex + 1] = Math.round(base.g);
    color[colorIndex + 2] = Math.round(base.b);
  }

  return { height, color, size: mapSize, seed };
};

export class VoxelLandscapeEffect implements Effect {
  private maps: VoxelLandscapeMaps | null = null;
  private buffer: PixelBuffer | null = null;
  private bufferWidth = 0;
  private bufferHeight = 0;
  private camX = 0;
  private camY = 0;
  private camH = 0;
  private camAng = 0;
  private lastTime = 0;
  private beatPulse = 0;

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const bufW = Math.max(96, Math.round(params.bufW ?? VOXEL_LANDSCAPE_DEFAULTS.bufW));
    const bufH = Math.max(64, Math.round(params.bufH ?? VOXEL_LANDSCAPE_DEFAULTS.bufH));
    const speed = params.speed ?? VOXEL_LANDSCAPE_DEFAULTS.speed;
    const turnRate = params.turnRate ?? VOXEL_LANDSCAPE_DEFAULTS.turnRate;
    const turnWobble = params.turnWobble ?? VOXEL_LANDSCAPE_DEFAULTS.turnWobble;
    const camBase = params.camH ?? VOXEL_LANDSCAPE_DEFAULTS.camH;
    const heightBob = params.heightBob ?? VOXEL_LANDSCAPE_DEFAULTS.heightBob;
    const beatBump = params.beatBump ?? VOXEL_LANDSCAPE_DEFAULTS.beatBump;
    const fov = params.fov ?? VOXEL_LANDSCAPE_DEFAULTS.fov;
    const horizon = params.horizon ?? bufH * 0.45;
    const scale = params.scale ?? VOXEL_LANDSCAPE_DEFAULTS.scale;
    const maxDist = params.maxDist ?? VOXEL_LANDSCAPE_DEFAULTS.maxDist;
    const stepBase = Math.max(1, Math.round(params.stepBase ?? VOXEL_LANDSCAPE_DEFAULTS.stepBase));
    const stepGrow = Math.max(1, params.stepGrow ?? VOXEL_LANDSCAPE_DEFAULTS.stepGrow);
    const fogStrength = clamp(params.fogStrength ?? VOXEL_LANDSCAPE_DEFAULTS.fogStrength, 0, 1);
    const audioReact = clamp(params.audioReact ?? VOXEL_LANDSCAPE_DEFAULTS.audioReact, 0, 1);
    const beatKick = clamp(params.beatKick ?? VOXEL_LANDSCAPE_DEFAULTS.beatKick, 0, 1);
    const scanlines = Boolean(params.scanlines);
    const seed = Math.round(params.seed ?? VOXEL_LANDSCAPE_DEFAULTS.seed);

    const viewSettings = computeVoxelLandscapeViewSettings(width, height, {
      fov,
      scale,
      camBase,
      horizon,
      maxDist
    });

    if (!this.maps || this.maps.seed !== seed) {
      this.maps = generateVoxelLandscapeMaps(seed, MAP_SIZE);
      this.camX = this.maps.size * 0.5;
      this.camY = this.maps.size * 0.5;
      this.camAng = Math.PI * 0.2;
      this.lastTime = time;
      this.beatPulse = 0;
    }

    if (!this.buffer || this.bufferWidth !== bufW || this.bufferHeight !== bufH) {
      this.buffer = new PixelBuffer(bufW, bufH);
      this.bufferWidth = bufW;
      this.bufferHeight = bufH;
    }

    const dt = clamp(time - this.lastTime, 0, 0.05);
    this.lastTime = time;

    if (audio.beat) {
      this.beatPulse = Math.max(this.beatPulse, audio.beatStrength || 1);
    }
    this.beatPulse = Math.max(0, this.beatPulse - dt * 6);

    const bass = audio.bass ?? 0;
    const speedEff = speed * (1 + bass * audioReact * 0.4 + this.beatPulse * beatKick * 0.6);
    this.camX += Math.cos(this.camAng) * speedEff * dt;
    this.camY += Math.sin(this.camAng) * speedEff * dt;
    this.camAng += turnRate * dt + Math.sin(time * 0.3) * turnWobble * dt;
    this.camH =
      viewSettings.camBase +
      Math.sin(time * 0.6) * heightBob +
      this.beatPulse * beatBump +
      bass * audioReact * 6;

    const imageData = this.buffer.imageData;
    const data = imageData.data;
    const skyTop: MapColor = { r: 36, g: 76, b: 142 };
    const skyBottom: MapColor = { r: 156, g: 198, b: 226 };
    const skyExponent = 1.5;

    for (let y = 0; y < bufH; y += 1) {
      const t = Math.pow(y / (bufH - 1), skyExponent);
      const r = Math.round(lerp(skyTop.r, skyBottom.r, t));
      const g = Math.round(lerp(skyTop.g, skyBottom.g, t));
      const b = Math.round(lerp(skyTop.b, skyBottom.b, t));
      let idx = y * bufW * 4;
      for (let x = 0; x < bufW; x += 1) {
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
        idx += 4;
      }
    }

    const heightMap = this.maps.height;
    const colorMap = this.maps.color;
    const mapMask = this.maps.size - 1;
    const halfFov = viewSettings.fov * 0.5;

    for (let x = 0; x < bufW; x += 1) {
      const u = (x / (bufW - 1)) * 2 - 1;
      const ang = this.camAng + u * halfFov;
      const dirX = Math.cos(ang);
      const dirY = Math.sin(ang);
      let maxY = bufH;

      for (let z = 1; z < viewSettings.maxDist && maxY > 0; ) {
        const step = stepBase + Math.floor(z / stepGrow);
        const worldX = this.camX + dirX * z;
        const worldY = this.camY + dirY * z;
        const ix = Math.floor(worldX) & mapMask;
        const iy = Math.floor(worldY) & mapMask;
        const mapIndex = iy * this.maps.size + ix;
        const h = heightMap[mapIndex];
        const projected = viewSettings.horizon - ((h - this.camH) * viewSettings.scale) / z;
        if (projected < maxY) {
          const y0 = Math.max(0, Math.floor(projected));
          const y1 = Math.min(bufH, maxY);
          if (y0 < y1) {
            const ix1 = (ix + 1) & mapMask;
            const iy1 = (iy + 1) & mapMask;
            const hX = heightMap[iy * this.maps.size + ix1];
            const hY = heightMap[iy1 * this.maps.size + ix];
            const slope = h - hX + (h - hY);
            const light = clamp(0.72 + slope * 0.012, 0.35, 1.2);
            const fog = Math.min(1, z / viewSettings.maxDist);
            const fogAmt = fogStrength * fog;
            const lit = light * (1 - fogAmt);
            const colorIndex = mapIndex * 3;
            const baseR = colorMap[colorIndex];
            const baseG = colorMap[colorIndex + 1];
            const baseB = colorMap[colorIndex + 2];
            const finalR = Math.round(baseR * lit + skyBottom.r * fogAmt);
            const finalG = Math.round(baseG * lit + skyBottom.g * fogAmt);
            const finalB = Math.round(baseB * lit + skyBottom.b * fogAmt);
            for (let y = y0; y < y1; y += 1) {
              const idx = (y * bufW + x) * 4;
              data[idx] = finalR;
              data[idx + 1] = finalG;
              data[idx + 2] = finalB;
              data[idx + 3] = 255;
            }
          }
          maxY = Math.floor(projected);
        }
        z += step;
      }
    }

    this.buffer.commit();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(this.buffer.canvas, 0, 0, bufW, bufH, 0, 0, width, height);

    if (scanlines) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      for (let y = 0; y < height; y += 3) {
        ctx.fillRect(0, y, width, 1);
      }
      ctx.restore();
    }
  }

  reset(): void {
    this.maps = null;
    this.buffer = null;
    this.bufferWidth = 0;
    this.bufferHeight = 0;
    this.camX = 0;
    this.camY = 0;
    this.camH = 0;
    this.camAng = 0;
    this.lastTime = 0;
    this.beatPulse = 0;
  }
}
