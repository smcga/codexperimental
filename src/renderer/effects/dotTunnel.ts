import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const DOT_TUNNEL_DEFAULTS = {
  ringCount: 52,
  dotsPerRing: 40,
  fov: 72,
  speed: 1,
  twist: 0.9,
  palette: 0,
  glow: 0.7,
  seed: 1
};

const TAU = Math.PI * 2;
const BASE_RING_SPACING = 0.24;
const BASE_TUNNEL_DEPTH = 16;
const BASE_RADIUS = 1.3;

type PaletteColor = [number, number, number];

const PALETTES: PaletteColor[][] = [
  [
    [38, 237, 255],
    [77, 125, 255],
    [255, 77, 210]
  ],
  [
    [255, 230, 92],
    [255, 132, 64],
    [255, 76, 76]
  ],
  [
    [117, 255, 159],
    [31, 201, 255],
    [44, 105, 255]
  ],
  [
    [255, 255, 255],
    [210, 238, 255],
    [157, 196, 255]
  ]
];

export type DotTunnelParticle = {
  ringIndex: number;
  dotIndex: number;
  angle: number;
  radius: number;
  zBase: number;
  phase: number;
  hueShift: number;
};

export type DotTunnelProjected = {
  x: number;
  y: number;
  scale: number;
  depth: number;
};

export function createDotTunnelRng(seed: number): () => number {
  let state = (seed | 0) ^ 0x9e3779b9;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function initializeDotTunnelParticles(ringCount: number, dotsPerRing: number, seed: number): DotTunnelParticle[] {
  const safeRingCount = Math.max(1, Math.floor(ringCount));
  const safeDotsPerRing = Math.max(3, Math.floor(dotsPerRing));
  const rng = createDotTunnelRng(seed);
  const particles: DotTunnelParticle[] = [];

  for (let ringIndex = 0; ringIndex < safeRingCount; ringIndex += 1) {
    const ringTwist = (rng() - 0.5) * 0.7;
    const ringRadius = BASE_RADIUS + (rng() - 0.5) * 0.28;
    for (let dotIndex = 0; dotIndex < safeDotsPerRing; dotIndex += 1) {
      particles.push({
        ringIndex,
        dotIndex,
        angle: (dotIndex / safeDotsPerRing) * TAU + ringTwist,
        radius: ringRadius + (rng() - 0.5) * 0.22,
        zBase: ringIndex * BASE_RING_SPACING,
        phase: rng() * TAU,
        hueShift: rng()
      });
    }
  }

  return particles;
}

export function projectDotTunnelPoint(
  x: number,
  y: number,
  z: number,
  fovDeg: number,
  width: number,
  height: number
): DotTunnelProjected | null {
  const near = 0.05;
  if (z <= near) {
    return null;
  }
  const focal = 0.5 * Math.min(width, height) / Math.tan((fovDeg * Math.PI) / 360);
  const scale = focal / z;
  return {
    x: width * 0.5 + x * scale,
    y: height * 0.5 + y * scale,
    scale,
    depth: z
  };
}

const toFinite = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

const paletteColorAt = (paletteIndex: number, t: number): PaletteColor => {
  const colors = PALETTES[Math.abs(Math.round(paletteIndex)) % PALETTES.length];
  const clamped = clamp(t, 0, 0.9999);
  const span = colors.length - 1;
  const scaled = clamped * span;
  const i0 = Math.floor(scaled);
  const i1 = Math.min(span, i0 + 1);
  const mix = scaled - i0;
  const c0 = colors[i0];
  const c1 = colors[i1];
  return [
    Math.round(c0[0] + (c1[0] - c0[0]) * mix),
    Math.round(c0[1] + (c1[1] - c0[1]) * mix),
    Math.round(c0[2] + (c1[2] - c0[2]) * mix)
  ];
};

export class DotTunnelEffect implements Effect {
  private particles: DotTunnelParticle[] = [];
  private lastSignature = "";

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const ringCount = clamp(Math.round(toFinite(params.ringCount, DOT_TUNNEL_DEFAULTS.ringCount)), 8, 180);
    const dotsPerRing = clamp(Math.round(toFinite(params.dotsPerRing, DOT_TUNNEL_DEFAULTS.dotsPerRing)), 6, 160);
    const fov = clamp(toFinite(params.fov, DOT_TUNNEL_DEFAULTS.fov), 40, 125);
    const speed = clamp(toFinite(params.speed, DOT_TUNNEL_DEFAULTS.speed), 0.05, 3.5);
    const twist = clamp(toFinite(params.twist, DOT_TUNNEL_DEFAULTS.twist), -4, 4);
    const palette = toFinite(params.palette, DOT_TUNNEL_DEFAULTS.palette);
    const glow = clamp(toFinite(params.glow, DOT_TUNNEL_DEFAULTS.glow), 0, 1.5);
    const seed = Math.round(toFinite(params.seed, DOT_TUNNEL_DEFAULTS.seed));

    const signature = `${ringCount}:${dotsPerRing}:${seed}`;
    if (signature !== this.lastSignature) {
      this.particles = initializeDotTunnelParticles(ringCount, dotsPerRing, seed);
      this.lastSignature = signature;
    }

    const tunnelDepth = Math.max(BASE_TUNNEL_DEPTH, ringCount * BASE_RING_SPACING);
    const speedTime = time * speed * 2.2;
    const bass = clamp(audio.bass ?? 0, 0, 1);
    const treble = clamp(audio.treble ?? 0, 0, 1);
    const audioPulse = 1 + bass * 0.35;
    const depthItems: Array<DotTunnelProjected & { radius: number; color: PaletteColor; alpha: number }> = [];

    for (const particle of this.particles) {
      const wrapped = ((particle.zBase + speedTime) % tunnelDepth + tunnelDepth) % tunnelDepth;
      const z = tunnelDepth - wrapped + 0.2;
      const spin = twist * (time + particle.ringIndex * 0.015);
      const wobble = 0.1 * Math.sin(time * 1.3 + particle.phase) * (0.3 + treble);
      const radial = particle.radius * (1 + 0.14 * bass * Math.sin(time * 2.4 + particle.phase));
      const x = Math.cos(particle.angle + spin) * (radial + wobble);
      const y = Math.sin(particle.angle + spin) * (radial - wobble);
      const projected = projectDotTunnelPoint(x, y, z, fov, width, height);
      if (!projected) {
        continue;
      }

      const normDepth = clamp(1 - z / tunnelDepth, 0, 1);
      const color = paletteColorAt(palette, (normDepth + particle.hueShift * 0.35) % 1);
      const pointRadius = clamp(projected.scale * (0.012 + glow * 0.009), 0.8, 18) * audioPulse;
      const alpha = clamp(0.2 + normDepth * 0.95 + glow * 0.25, 0.1, 1);

      depthItems.push({ ...projected, radius: pointRadius, color, alpha });
    }

    depthItems.sort((a, b) => b.depth - a.depth);

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(3, 4, 10, 0.35)";
    ctx.fillRect(0, 0, width, height);

    for (const item of depthItems) {
      const [r, g, b] = item.color;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${item.alpha})`;
      ctx.arc(item.x, item.y, item.radius, 0, TAU);
      ctx.fill();

      if (glow > 0.02) {
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, item.alpha * (0.5 + glow * 0.6))})`;
        ctx.lineWidth = Math.max(0.8, item.radius * 0.25);
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius * 1.8, 0, TAU);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  reset(): void {
    this.particles = [];
    this.lastSignature = "";
  }
}
