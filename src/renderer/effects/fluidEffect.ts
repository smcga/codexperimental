import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type FluidBuffers = {
  width: number;
  height: number;
  u: Float32Array;
  v: Float32Array;
  dye: Float32Array;
  uTemp: Float32Array;
  vTemp: Float32Array;
  dyeTemp: Float32Array;
};

const resolveNumberParam = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const clampInt = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, Math.round(value)));

const indexFor = (x: number, y: number, width: number): number => y * width + x;

const sampleGrid = (grid: Float32Array, x: number, y: number, width: number, height: number): number => {
  const x0 = clampInt(Math.floor(x), 0, width - 1);
  const y0 = clampInt(Math.floor(y), 0, height - 1);
  const x1 = clampInt(x0 + 1, 0, width - 1);
  const y1 = clampInt(y0 + 1, 0, height - 1);

  const tx = clamp(x - x0, 0, 1);
  const ty = clamp(y - y0, 0, 1);

  const v00 = grid[indexFor(x0, y0, width)];
  const v10 = grid[indexFor(x1, y0, width)];
  const v01 = grid[indexFor(x0, y1, width)];
  const v11 = grid[indexFor(x1, y1, width)];

  const v0 = lerp(v00, v10, tx);
  const v1 = lerp(v01, v11, tx);
  return lerp(v0, v1, ty);
};

const diffuseGrid = (
  source: Float32Array,
  target: Float32Array,
  width: number,
  height: number,
  rate: number
): void => {
  const lerpRate = clamp(rate, 0, 1);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = indexFor(x, y, width);
      const center = source[idx];
      const left = source[indexFor(Math.max(0, x - 1), y, width)];
      const right = source[indexFor(Math.min(width - 1, x + 1), y, width)];
      const up = source[indexFor(x, Math.max(0, y - 1), width)];
      const down = source[indexFor(x, Math.min(height - 1, y + 1), width)];
      const average = (left + right + up + down) * 0.25;
      target[idx] = lerp(center, average, lerpRate);
    }
  }
};

export class FluidEffect implements Effect {
  private buffers: FluidBuffers | null = null;

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const scale = clamp(resolveNumberParam(rawParams.scale, 16), 8, 32);
    const viscosity = clamp(resolveNumberParam(rawParams.viscosity, 0.15), 0, 1);
    const diffusion = clamp(resolveNumberParam(rawParams.diffusion, 0.25), 0, 1);
    const force = clamp(resolveNumberParam(rawParams.force, 1.2), 0, 4);
    const density = clamp(resolveNumberParam(rawParams.density, 0.7), 0, 2);
    const decay = clamp(resolveNumberParam(rawParams.decay, 0.35), 0, 2);
    const hue = resolveNumberParam(rawParams.hue, 200);
    const seed = resolveNumberParam(rawParams.seed, 0);

    const gridWidth = clampInt(width / scale, 24, 160);
    const gridHeight = clampInt(height / scale, 16, 120);
    const cellWidth = width / gridWidth;
    const cellHeight = height / gridHeight;

    if (!this.buffers || this.buffers.width !== gridWidth || this.buffers.height !== gridHeight) {
      const size = gridWidth * gridHeight;
      this.buffers = {
        width: gridWidth,
        height: gridHeight,
        u: new Float32Array(size),
        v: new Float32Array(size),
        dye: new Float32Array(size),
        uTemp: new Float32Array(size),
        vTemp: new Float32Array(size),
        dyeTemp: new Float32Array(size)
      };
    }

    const buffers = this.buffers;
    const { u, v, dye, uTemp, vTemp, dyeTemp } = buffers;
    const dt = Math.min(delta, 0.05);

    const drive = force * (0.35 + audio.rms * 1.4);
    const swirl = drive * (0.4 + audio.bass * 1.1);
    const pulse = audio.beat ? 1.4 : 1;
    const centerX = gridWidth * (0.5 + Math.sin(time * 0.35 + seed) * 0.18);
    const centerY = gridHeight * (0.5 + Math.cos(time * 0.3 + seed * 1.3) * 0.2);
    const radius = Math.min(gridWidth, gridHeight) * 0.35;

    for (let y = 0; y < gridHeight; y += 1) {
      for (let x = 0; x < gridWidth; x += 1) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > radius) {
          continue;
        }
        const falloff = 1 - distance / radius;
        const strength = swirl * falloff * pulse;
        const idx = indexFor(x, y, gridWidth);
        u[idx] += (-dy / (distance + 1)) * strength * dt;
        v[idx] += (dx / (distance + 1)) * strength * dt;
        dye[idx] = clamp(dye[idx] + density * falloff * dt * (0.5 + audio.treble * 1.5), 0, 1.5);
      }
    }

    diffuseGrid(u, uTemp, gridWidth, gridHeight, viscosity * dt * 4);
    diffuseGrid(v, vTemp, gridWidth, gridHeight, viscosity * dt * 4);
    u.set(uTemp);
    v.set(vTemp);
    diffuseGrid(dye, dyeTemp, gridWidth, gridHeight, diffusion * dt * 4);
    dye.set(dyeTemp);

    const driftX = Math.sin(time * 0.2 + seed) * 0.35 * drive;
    const driftY = Math.cos(time * 0.18 + seed * 0.7) * 0.35 * drive;

    for (let y = 0; y < gridHeight; y += 1) {
      for (let x = 0; x < gridWidth; x += 1) {
        const idx = indexFor(x, y, gridWidth);
        const backX = x - (u[idx] + driftX) * dt;
        const backY = y - (v[idx] + driftY) * dt;
        uTemp[idx] = sampleGrid(u, backX, backY, gridWidth, gridHeight);
        vTemp[idx] = sampleGrid(v, backX, backY, gridWidth, gridHeight);
      }
    }
    u.set(uTemp);
    v.set(vTemp);

    for (let y = 0; y < gridHeight; y += 1) {
      for (let x = 0; x < gridWidth; x += 1) {
        const idx = indexFor(x, y, gridWidth);
        const backX = x - (u[idx] + driftX) * dt;
        const backY = y - (v[idx] + driftY) * dt;
        dyeTemp[idx] = sampleGrid(dye, backX, backY, gridWidth, gridHeight);
      }
    }
    dye.set(dyeTemp);

    const fade = clamp(1 - decay * dt, 0, 1);
    for (let i = 0; i < dye.length; i += 1) {
      dye[i] *= fade;
    }

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "hsl(220, 35%, 6%)";
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "lighter";
    for (let y = 0; y < gridHeight; y += 1) {
      for (let x = 0; x < gridWidth; x += 1) {
        const idx = indexFor(x, y, gridWidth);
        const energy = dye[idx];
        if (energy <= 0.01) {
          continue;
        }
        const alpha = clamp(energy * (0.6 + audio.rms * 0.4), 0, 1);
        const lightness = clamp(45 + energy * 35, 0, 90);
        ctx.fillStyle = `hsla(${hue + energy * 30}, 70%, ${lightness}%, ${alpha})`;
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth + 0.5, cellHeight + 0.5);
      }
    }

    ctx.restore();
  }

  reset(): void {
    if (!this.buffers) {
      return;
    }
    this.buffers.u.fill(0);
    this.buffers.v.fill(0);
    this.buffers.dye.fill(0);
    this.buffers.uTemp.fill(0);
    this.buffers.vTemp.fill(0);
    this.buffers.dyeTemp.fill(0);
  }
}
