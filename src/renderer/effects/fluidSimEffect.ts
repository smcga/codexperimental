import { clamp, lerp } from "../../util/math";
import { PixelBuffer } from "./pixelBuffer";
import { Effect, EffectRenderContext } from "./types";

const DEFAULTS = {
  speed: 1,
  dissipation: 0.985,
  splatCount: 3,
  splatSize: 6,
  turbulence: 1.1,
  hueShift: 0,
  seed: 0
};

export function hashFloat(value: number): number {
  const s = Math.sin(value * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

export function sampleField(field: Float32Array, width: number, height: number, x: number, y: number): number {
  const clampedX = clamp(x, 0, width - 1);
  const clampedY = clamp(y, 0, height - 1);
  const x0 = Math.floor(clampedX);
  const y0 = Math.floor(clampedY);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = clampedX - x0;
  const ty = clampedY - y0;

  const idx00 = y0 * width + x0;
  const idx10 = y0 * width + x1;
  const idx01 = y1 * width + x0;
  const idx11 = y1 * width + x1;

  const v00 = field[idx00] ?? 0;
  const v10 = field[idx10] ?? 0;
  const v01 = field[idx01] ?? 0;
  const v11 = field[idx11] ?? 0;

  const vx0 = lerp(v00, v10, tx);
  const vx1 = lerp(v01, v11, tx);
  return lerp(vx0, vx1, ty);
}

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hPrime = hue / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));

  let r = 0;
  let g = 0;
  let b = 0;

  if (hPrime >= 0 && hPrime < 1) {
    r = c;
    g = x;
  } else if (hPrime >= 1 && hPrime < 2) {
    r = x;
    g = c;
  } else if (hPrime >= 2 && hPrime < 3) {
    g = c;
    b = x;
  } else if (hPrime >= 3 && hPrime < 4) {
    g = x;
    b = c;
  } else if (hPrime >= 4 && hPrime < 5) {
    r = x;
    b = c;
  } else if (hPrime >= 5 && hPrime < 6) {
    r = c;
    b = x;
  }

  const m = l - c / 2;
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
};

export class FluidSimEffect implements Effect {
  private buffer: PixelBuffer;
  private density: Float32Array;
  private nextDensity: Float32Array;
  private velocityX: Float32Array;
  private velocityY: Float32Array;

  constructor(private gridWidth = 120, private gridHeight = 68) {
    const size = gridWidth * gridHeight;
    this.buffer = new PixelBuffer(gridWidth, gridHeight);
    this.density = new Float32Array(size);
    this.nextDensity = new Float32Array(size);
    this.velocityX = new Float32Array(size);
    this.velocityY = new Float32Array(size);
  }

  reset(): void {
    this.density.fill(0);
    this.nextDensity.fill(0);
    this.velocityX.fill(0);
    this.velocityY.fill(0);
  }

  private addSplat(x: number, y: number, radius: number, strength: number): void {
    const minX = Math.max(0, Math.floor(x - radius));
    const maxX = Math.min(this.gridWidth - 1, Math.ceil(x + radius));
    const minY = Math.max(0, Math.floor(y - radius));
    const maxY = Math.min(this.gridHeight - 1, Math.ceil(y + radius));
    const radiusSq = radius * radius;

    for (let yy = minY; yy <= maxY; yy += 1) {
      for (let xx = minX; xx <= maxX; xx += 1) {
        const dx = xx - x;
        const dy = yy - y;
        const distSq = dx * dx + dy * dy;
        if (distSq <= radiusSq) {
          const idx = yy * this.gridWidth + xx;
          const falloff = 1 - Math.sqrt(distSq) / radius;
          this.density[idx] = clamp(this.density[idx] + strength * falloff * falloff, 0, 1.5);
        }
      }
    }
  }

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const speed = params.speed ?? DEFAULTS.speed;
    const dissipation = clamp(params.dissipation ?? DEFAULTS.dissipation, 0.9, 0.999);
    const splatCount = Math.max(0, Math.round(params.splatCount ?? DEFAULTS.splatCount));
    const splatSize = Math.max(1, params.splatSize ?? DEFAULTS.splatSize);
    const turbulence = Math.max(0, params.turbulence ?? DEFAULTS.turbulence);
    const hueShift = params.hueShift ?? DEFAULTS.hueShift;
    const seed = params.seed ?? DEFAULTS.seed;

    const dt = Math.min(0.05, delta) * speed;
    const bassBoost = 0.4 + audio.bass * 1.4;
    const flowStrength = turbulence * bassBoost;

    for (let y = 0; y < this.gridHeight; y += 1) {
      const ny = y / this.gridHeight - 0.5;
      for (let x = 0; x < this.gridWidth; x += 1) {
        const nx = x / this.gridWidth - 0.5;
        const idx = y * this.gridWidth + x;
        const angle =
          Math.sin((nx * 3 + time * 0.4) * Math.PI) +
          Math.cos((ny * 2 - time * 0.35) * Math.PI);
        const swirl = Math.sin(time * 0.25 + nx * 2 - ny * 2) * 0.5;
        this.velocityX[idx] = Math.cos(angle + swirl) * flowStrength;
        this.velocityY[idx] = Math.sin(angle - swirl) * flowStrength;
      }
    }

    for (let i = 0; i < splatCount; i += 1) {
      const tSeed = time * 0.35 + seed * 11.3 + i * 3.7;
      const x = hashFloat(tSeed) * (this.gridWidth - 1);
      const y = hashFloat(tSeed + 4.2) * (this.gridHeight - 1);
      const strength = clamp(0.5 + audio.rms * 1.2 + audio.treble * 0.5, 0.4, 1.4);
      this.addSplat(x, y, splatSize, strength * 0.9);
    }

    for (let y = 0; y < this.gridHeight; y += 1) {
      for (let x = 0; x < this.gridWidth; x += 1) {
        const idx = y * this.gridWidth + x;
        const vx = this.velocityX[idx];
        const vy = this.velocityY[idx];
        const srcX = x - vx * dt * 2.5;
        const srcY = y - vy * dt * 2.5;
        this.nextDensity[idx] = sampleField(this.density, this.gridWidth, this.gridHeight, srcX, srcY) * dissipation;
      }
    }

    const swap = this.density;
    this.density = this.nextDensity;
    this.nextDensity = swap;

    const data = this.buffer.imageData.data;
    const brightness = clamp(0.4 + audio.rms * 0.8, 0.4, 1.2);

    for (let y = 0; y < this.gridHeight; y += 1) {
      for (let x = 0; x < this.gridWidth; x += 1) {
        const idx = y * this.gridWidth + x;
        const density = clamp(this.density[idx], 0, 1);
        const hue = 210 + hueShift + density * 140 + audio.treble * 40;
        const lightness = clamp(0.15 + density * 0.55 + audio.bass * 0.1, 0, 0.85);
        const [r, g, b] = hslToRgb(hue, 0.7, lightness * brightness);
        const dataIdx = idx * 4;
        data[dataIdx] = r;
        data[dataIdx + 1] = g;
        data[dataIdx + 2] = b;
        data[dataIdx + 3] = 255;
      }
    }

    this.buffer.commit();
    ctx.drawImage(this.buffer.canvas, 0, 0, width, height);
  }
}
