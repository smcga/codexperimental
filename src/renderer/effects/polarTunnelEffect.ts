import { clamp } from "../../util/math";
import { PixelBuffer } from "./pixelBuffer";
import { Effect, EffectRenderContext } from "./types";

type PolarTunnelParams = {
  rotateSpeed: number;
  wobbleFrequency: number;
  wobbleSpeed: number;
  wobbleAmount: number;
  radialWobbleFrequency: number;
  radialWobbleSpeed: number;
  radialWobbleAmount: number;
  radialFrequency: number;
  angularFrequency: number;
  colorCycles: number;
  audioReact: number;
};

export const POLAR_TUNNEL_DEFAULTS: PolarTunnelParams = {
  rotateSpeed: 0.8,
  wobbleFrequency: 12,
  wobbleSpeed: 2,
  wobbleAmount: 0.8,
  radialWobbleFrequency: 8,
  radialWobbleSpeed: 1.5,
  radialWobbleAmount: 0.03,
  radialFrequency: 30,
  angularFrequency: 6,
  colorCycles: 6.2831,
  audioReact: 0.35
};

const toFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const resolvePolarTunnelParams = (params: Record<string, unknown>): PolarTunnelParams => ({
  rotateSpeed: clamp(toFiniteNumber(params.rotateSpeed, POLAR_TUNNEL_DEFAULTS.rotateSpeed), -4, 4),
  wobbleFrequency: clamp(toFiniteNumber(params.wobbleFrequency, POLAR_TUNNEL_DEFAULTS.wobbleFrequency), 0, 40),
  wobbleSpeed: clamp(toFiniteNumber(params.wobbleSpeed, POLAR_TUNNEL_DEFAULTS.wobbleSpeed), -8, 8),
  wobbleAmount: clamp(toFiniteNumber(params.wobbleAmount, POLAR_TUNNEL_DEFAULTS.wobbleAmount), 0, 2),
  radialWobbleFrequency: clamp(
    toFiniteNumber(params.radialWobbleFrequency, POLAR_TUNNEL_DEFAULTS.radialWobbleFrequency),
    0,
    24
  ),
  radialWobbleSpeed: clamp(toFiniteNumber(params.radialWobbleSpeed, POLAR_TUNNEL_DEFAULTS.radialWobbleSpeed), -8, 8),
  radialWobbleAmount: clamp(toFiniteNumber(params.radialWobbleAmount, POLAR_TUNNEL_DEFAULTS.radialWobbleAmount), 0, 0.2),
  radialFrequency: clamp(toFiniteNumber(params.radialFrequency, POLAR_TUNNEL_DEFAULTS.radialFrequency), 1, 80),
  angularFrequency: clamp(toFiniteNumber(params.angularFrequency, POLAR_TUNNEL_DEFAULTS.angularFrequency), 0, 24),
  colorCycles: clamp(toFiniteNumber(params.colorCycles, POLAR_TUNNEL_DEFAULTS.colorCycles), 0.5, 16),
  audioReact: clamp(toFiniteNumber(params.audioReact, POLAR_TUNNEL_DEFAULTS.audioReact), 0, 1)
});

type PolarTunnelSampleInput = {
  u: number;
  v: number;
  time: number;
  rms: number;
  bass: number;
  params: PolarTunnelParams;
};

export const samplePolarTunnelRgb = ({ u, v, time, rms, bass, params }: PolarTunnelSampleInput): [number, number, number] => {
  let r = Math.sqrt(u * u + v * v);
  let a = Math.atan2(v, u);
  const reactive = 1 + rms * params.audioReact + bass * params.audioReact * 0.7;

  a += time * params.rotateSpeed * reactive;
  a += Math.sin(r * params.wobbleFrequency - time * params.wobbleSpeed) * params.wobbleAmount;
  r += Math.sin(a * params.radialWobbleFrequency + time * params.radialWobbleSpeed) * params.radialWobbleAmount * reactive;

  const p = Math.sin(r * params.radialFrequency + a * params.angularFrequency);
  const c = 0.5 + 0.5 * p;
  const red = 0.5 + 0.5 * Math.sin(params.colorCycles * c + 0.0 + time * 0.25);
  const green = 0.5 + 0.5 * Math.sin(params.colorCycles * c + 2.1 + time * 0.25);
  const blue = 0.5 + 0.5 * Math.sin(params.colorCycles * c + 4.2 + time * 0.25);

  return [Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255)];
};

export class PolarTunnelEffect implements Effect {
  private buffer: PixelBuffer;

  constructor(private readonly width = 320, private readonly height = 180) {
    this.buffer = new PixelBuffer(width, height);
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const config = resolvePolarTunnelParams(params as Record<string, unknown>);
    const data = this.buffer.imageData.data;
    const minDimension = Math.max(1, Math.min(this.width, this.height));
    const halfWidth = this.width * 0.5;
    const halfHeight = this.height * 0.5;

    for (let py = 0; py < this.height; py += 1) {
      for (let px = 0; px < this.width; px += 1) {
        const idx = (py * this.width + px) * 4;

        const u = (px - halfWidth) / minDimension;
        const v = (py - halfHeight) / minDimension;
        const [red, green, blue] = samplePolarTunnelRgb({ u, v, time, rms: audio.rms, bass: audio.bass, params: config });
        data[idx] = red;
        data[idx + 1] = green;
        data[idx + 2] = blue;
        data[idx + 3] = 255;
      }
    }

    this.buffer.commit();
    ctx.drawImage(this.buffer.canvas, 0, 0, width, height);
  }
}
