import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const WATER_DROPS_OVERLAY_DEFAULTS = {
  density: 1.0,
  maxDrops: 80,
  speed: 1.0,
  distortion: 1.0,
  highlight: 1.0
};

type Drop = {
  x: number;
  baseX: number;
  y: number;
  radius: number;
  distortion: number;
  speed: number;
  phase: number;
  trailLength: number;
};

const MIN_RADIUS = 3;
const MAX_RADIUS = 30;

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const createDrop = (width: number, height: number): Drop => {
  const sizeBias = Math.pow(Math.random(), 2.2);
  const radius = MIN_RADIUS + sizeBias * (MAX_RADIUS - MIN_RADIUS);
  const baseX = Math.random() * width;
  const speed = (0.4 + (radius / MAX_RADIUS) * 1.8) * 9;
  const trailLength = radius > 14 ? radius * (0.7 + Math.random() * 2.8) : 0;

  return {
    x: baseX,
    baseX,
    y: Math.random() * height,
    radius,
    distortion: 0.08 + (radius / MAX_RADIUS) * 0.34,
    speed,
    phase: Math.random() * Math.PI * 2,
    trailLength
  };
};

export class WaterDropsOverlayEffect implements Effect {
  private drops: Drop[] = [];
  private viewportWidth = 0;
  private viewportHeight = 0;
  private sampleBuffer: Uint8ClampedArray = new Uint8ClampedArray(0);

  private syncDrops(width: number, height: number, density: number, maxDrops: number): void {
    const targetCount = Math.max(0, Math.floor(maxDrops * density));
    const sizeChanged = this.viewportWidth !== width || this.viewportHeight !== height;

    if (sizeChanged) {
      this.viewportWidth = width;
      this.viewportHeight = height;
    }

    if (sizeChanged || this.drops.length === 0) {
      this.drops = Array.from({ length: targetCount }, () => createDrop(width, height));
      return;
    }

    if (this.drops.length < targetCount) {
      const missing = targetCount - this.drops.length;
      for (let i = 0; i < missing; i += 1) {
        this.drops.push(createDrop(width, height));
      }
      return;
    }

    if (this.drops.length > targetCount) {
      this.drops.length = targetCount;
    }
  }

  private ensureSampleBuffer(requiredLength: number): void {
    if (this.sampleBuffer.length >= requiredLength) {
      return;
    }
    this.sampleBuffer = new Uint8ClampedArray(requiredLength);
  }

  render({ ctx, width, height, time, delta, params }: EffectRenderContext): void {
    const density = clamp(toNumber(params.density, WATER_DROPS_OVERLAY_DEFAULTS.density), 0, 2);
    const maxDrops = clamp(Math.round(toNumber(params.maxDrops, WATER_DROPS_OVERLAY_DEFAULTS.maxDrops)), 0, 300);
    const speedMul = clamp(toNumber(params.speed, WATER_DROPS_OVERLAY_DEFAULTS.speed), 0, 3);
    const distortionMul = clamp(toNumber(params.distortion, WATER_DROPS_OVERLAY_DEFAULTS.distortion), 0, 2.5);
    const highlightMul = clamp(toNumber(params.highlight, WATER_DROPS_OVERLAY_DEFAULTS.highlight), 0, 2);

    this.syncDrops(width, height, density, maxDrops);
    if (this.drops.length === 0) {
      return;
    }

    const dt = clamp(delta, 0.001, 1 / 12);

    for (let i = 0; i < this.drops.length; i += 1) {
      const drop = this.drops[i];
      const wobble = Math.sin(time * 0.75 + drop.phase) * (0.2 + drop.radius * 0.04);

      drop.y += drop.speed * speedMul * dt;
      drop.x = drop.baseX + wobble;

      if (drop.y - drop.radius > height) {
        const recycled = createDrop(width, height);
        drop.baseX = recycled.baseX;
        drop.x = recycled.x;
        drop.radius = recycled.radius;
        drop.y = -drop.radius - Math.random() * height * 0.25;
        drop.distortion = recycled.distortion;
        drop.speed = recycled.speed;
        drop.phase = recycled.phase;
        drop.trailLength = recycled.trailLength;
      }

      const radius = drop.radius;
      const diameter = Math.ceil(radius * 2) + 2;
      const left = Math.floor(clamp(drop.x - radius - 1, 0, width - 1));
      const top = Math.floor(clamp(drop.y - radius - 1, 0, height - 1));
      const sampleW = Math.min(diameter, width - left);
      const sampleH = Math.min(diameter, height - top);

      if (sampleW <= 1 || sampleH <= 1) {
        continue;
      }

      const sample = ctx.getImageData(left, top, sampleW, sampleH);
      const pixels = sample.data;
      this.ensureSampleBuffer(pixels.length);
      this.sampleBuffer.set(pixels.subarray(0, pixels.length));

      const centerX = drop.x - left;
      const centerY = drop.y - top;
      const r2 = radius * radius;
      const distortion = drop.distortion * distortionMul;

      for (let py = 0; py < sampleH; py += 1) {
        for (let px = 0; px < sampleW; px += 1) {
          const dx = px - centerX;
          const dy = py - centerY;
          const distSq = dx * dx + dy * dy;
          if (distSq > r2) {
            continue;
          }

          const dist = Math.sqrt(distSq);
          const norm = dist / radius;
          const strength = (1 - norm) * distortion;
          const sx = Math.round(clamp(px + dx * strength - radius * 0.08, 0, sampleW - 1));
          const sy = Math.round(clamp(py + dy * strength + radius * 0.03, 0, sampleH - 1));

          const dstIdx = (py * sampleW + px) * 4;
          const srcIdx = (sy * sampleW + sx) * 4;

          pixels[dstIdx] = this.sampleBuffer[srcIdx];
          pixels[dstIdx + 1] = this.sampleBuffer[srcIdx + 1];
          pixels[dstIdx + 2] = this.sampleBuffer[srcIdx + 2];
          pixels[dstIdx + 3] = Math.max(this.sampleBuffer[srcIdx + 3], 220);
        }
      }

      ctx.putImageData(sample, left, top);

      if (drop.trailLength > 0) {
        ctx.save();
        ctx.globalAlpha = 0.12 + (drop.radius / MAX_RADIUS) * 0.15;
        ctx.lineWidth = Math.max(1, drop.radius * 0.14);
        ctx.strokeStyle = "rgba(210, 225, 255, 0.5)";
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y - drop.radius * 0.15);
        ctx.lineTo(drop.x, drop.y + drop.trailLength);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = "rgba(210, 235, 255, 0.9)";
      ctx.lineWidth = Math.max(0.8, radius * 0.11);
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, radius * 0.98, Math.PI * 0.05, Math.PI * 1.25);
      ctx.stroke();
      ctx.restore();

      const highlightAlpha = (0.15 + radius / MAX_RADIUS * 0.3) * highlightMul;
      if (highlightAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = clamp(highlightAlpha, 0, 1);
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        ctx.arc(drop.x - radius * 0.3, drop.y - radius * 0.35, Math.max(1, radius * 0.18), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha *= 0.55;
        ctx.beginPath();
        ctx.arc(drop.x - radius * 0.1, drop.y - radius * 0.12, Math.max(0.7, radius * 0.1), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = "rgba(15, 22, 35, 0.75)";
      ctx.lineWidth = Math.max(1, radius * 0.17);
      ctx.beginPath();
      ctx.arc(drop.x, drop.y + radius * 0.05, radius * 0.82, Math.PI * 0.2, Math.PI * 0.92);
      ctx.stroke();
      ctx.restore();
    }
  }

  reset(): void {
    this.drops = [];
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.sampleBuffer = new Uint8ClampedArray(0);
  }
}
