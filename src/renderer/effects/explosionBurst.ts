import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export type ExplosionParticleType = "fire" | "smoke" | "debris";

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  type: ExplosionParticleType;
  rot: number;
};

type ExplosionState = {
  startTime: number;
  seed: number;
  particles: Particle[];
};

export const EXPLOSION_BURST_DEFAULTS = {
  duration: 5,
  seed: 1,
  intensity: 1,
  particleCount: 180,
  smokeCount: 120,
  debrisCount: 60,
  gravity: 0.02,
  drag: 0.985,
  turbulence: 0.6,
  turbulenceScale: 0.002,
  fade: 0.98,
  audioReactive: true
} as const;

const MAX_PARTICLES = 400;

const resolveNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveBoolean = (value: unknown, fallback: boolean): boolean => (typeof value === "boolean" ? value : fallback);

export const createMulberry32 = (seed: number): (() => number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let n = Math.imul(t ^ (t >>> 15), 1 | t);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
};

const noiseValue = (x: number, y: number, time: number): number => {
  const n = Math.sin(x * 12.9898 + y * 78.233 + time * 10) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
};

export const resolveExplosionCounts = (particleCount: number, smokeCount: number, debrisCount: number) => {
  const fire = Math.max(0, Math.floor(particleCount));
  const smoke = Math.max(0, Math.floor(smokeCount));
  const debris = Math.max(0, Math.floor(debrisCount));
  const total = fire + smoke + debris;
  if (total <= MAX_PARTICLES) {
    return { fire, smoke, debris };
  }
  const scale = MAX_PARTICLES / total;
  const scaledFire = Math.floor(fire * scale);
  const scaledSmoke = Math.floor(smoke * scale);
  const scaledDebris = Math.floor(debris * scale);
  let remainder = MAX_PARTICLES - (scaledFire + scaledSmoke + scaledDebris);
  const counts = { fire: scaledFire, smoke: scaledSmoke, debris: scaledDebris };
  if (remainder > 0) {
    counts.fire += 1;
    remainder -= 1;
  }
  if (remainder > 0) {
    counts.smoke += 1;
    remainder -= 1;
  }
  if (remainder > 0) {
    counts.debris += remainder;
  }
  return counts;
};

const appendParticles = (
  particles: Particle[],
  count: number,
  type: ExplosionParticleType,
  rng: () => number,
  cx: number,
  cy: number,
  radius: number,
  intensity: number,
  beatBoost: number
): void => {
  for (let i = 0; i < count; i += 1) {
    const angle = rng() * Math.PI * 2;
    const spread = Math.pow(rng(), 0.45);
    const radialDistance = radius * 0.15 * Math.pow(rng(), 1.4);
    const x = cx + Math.cos(angle) * radialDistance;
    const y = cy + Math.sin(angle) * radialDistance;
    const outward = 1 + spread;

    if (type === "fire") {
      const speed = (2.2 + rng() * 4.6) * intensity * outward * beatBoost;
      const maxLife = 0.6 + rng() * 0.6;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: maxLife,
        maxLife,
        size: radius * (0.05 + rng() * 0.06),
        type,
        rot: rng() * Math.PI * 2
      });
      continue;
    }

    if (type === "smoke") {
      const speed = (0.4 + rng() * 1.8) * intensity * beatBoost;
      const maxLife = 2 + rng() * 3;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed * 0.75,
        vy: Math.sin(angle) * speed - (0.4 + rng() * 0.8),
        life: maxLife,
        maxLife,
        size: radius * (0.08 + rng() * 0.15),
        type,
        rot: rng() * Math.PI * 2
      });
      continue;
    }

    const speed = (3.8 + rng() * 6.4) * intensity * beatBoost;
    const maxLife = 1 + rng();
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: maxLife,
      maxLife,
      size: radius * (0.015 + rng() * 0.025),
      type,
      rot: angle
    });
  }
};

let stateByCtx = new WeakMap<CanvasRenderingContext2D, ExplosionState>();

export class ExplosionBurstEffect implements Effect {
  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const duration = clamp(resolveNumber(rawParams.duration, EXPLOSION_BURST_DEFAULTS.duration), 1, 8);
    const intensity = clamp(resolveNumber(rawParams.intensity, EXPLOSION_BURST_DEFAULTS.intensity), 0.5, 2);
    const seed = Math.floor(resolveNumber(rawParams.seed, EXPLOSION_BURST_DEFAULTS.seed));
    const gravity = resolveNumber(rawParams.gravity, EXPLOSION_BURST_DEFAULTS.gravity);
    const drag = clamp(resolveNumber(rawParams.drag, EXPLOSION_BURST_DEFAULTS.drag), 0.8, 0.999);
    const turbulenceBase = resolveNumber(rawParams.turbulence, EXPLOSION_BURST_DEFAULTS.turbulence);
    const turbulenceScale = resolveNumber(rawParams.turbulenceScale, EXPLOSION_BURST_DEFAULTS.turbulenceScale);
    const fade = clamp(resolveNumber(rawParams.fade, EXPLOSION_BURST_DEFAULTS.fade), 0.8, 0.999);
    const audioReactive = resolveBoolean(rawParams.audioReactive, EXPLOSION_BURST_DEFAULTS.audioReactive);
    const radius = Math.max(
      12,
      resolveNumber(rawParams.radius, Math.min(width, height) * 0.15) * clamp(intensity, 0.5, 2)
    );

    const counts = resolveExplosionCounts(
      resolveNumber(rawParams.particleCount, EXPLOSION_BURST_DEFAULTS.particleCount),
      resolveNumber(rawParams.smokeCount, EXPLOSION_BURST_DEFAULTS.smokeCount),
      resolveNumber(rawParams.debrisCount, EXPLOSION_BURST_DEFAULTS.debrisCount)
    );

    const beatStrength = audioReactive ? clamp(audio.beatStrength, 0, 2) : 0;
    const beatBoost = 1 + beatStrength * 0.5;
    const turbulence = turbulenceBase * (1 + beatStrength * 0.25);
    const cx = width * 0.5;
    const cy = height * 0.5;

    const hasExplicitStartTime = typeof rawParams.startTime === "number" && Number.isFinite(rawParams.startTime);
    let state = stateByCtx.get(ctx);
    let startTime = hasExplicitStartTime ? resolveNumber(rawParams.startTime, 0) : state?.startTime ?? time;
    if (!hasExplicitStartTime && time - startTime > duration) {
      startTime = time;
    }
    const t = Math.max(0, time - startTime);
    const normalized = clamp(t / duration, 0, 1);
    if (t > duration) {
      return;
    }
    const shouldReinitialize =
      !state || state.startTime !== startTime || state.seed !== seed || t < 0.01 || state.particles.length === 0;

    if (shouldReinitialize) {
      const rng = createMulberry32(seed ^ Math.floor(startTime * 1000));
      const particles: Particle[] = [];
      appendParticles(particles, counts.fire, "fire", rng, cx, cy, radius, intensity, beatBoost);
      appendParticles(particles, counts.smoke, "smoke", rng, cx, cy, radius, intensity, beatBoost);
      appendParticles(particles, counts.debris, "debris", rng, cx, cy, radius, intensity, beatBoost);
      state = { startTime, seed, particles };
      stateByCtx.set(ctx, state);
    }

    ctx.fillStyle = `rgba(0, 0, 0, ${1 - fade})`;
    ctx.fillRect(0, 0, width, height);

    if (normalized <= 0.1) {
      const flashRadius = radius * (1.5 + normalized * 5);
      const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashRadius);
      flash.addColorStop(0, "rgba(255, 255, 240, 0.92)");
      flash.addColorStop(0.4, "rgba(255, 220, 120, 0.6)");
      flash.addColorStop(1, "rgba(255, 140, 30, 0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = flash;
      ctx.beginPath();
      ctx.arc(cx, cy, flashRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    const dt = Math.max(0.001, Math.min(delta, 0.05)) * 60;
    const particles = state.particles;
    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];
      if (particle.life <= 0) {
        continue;
      }
      const n1 = noiseValue(particle.x * turbulenceScale, particle.y * turbulenceScale, time);
      const n2 = noiseValue(particle.y * turbulenceScale, particle.x * turbulenceScale, time + 0.37);
      particle.vx = particle.vx * drag + n1 * turbulence * 0.08 * dt;
      particle.vy = particle.vy * drag + gravity * dt + n2 * turbulence * 0.08 * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= delta;
    }

    const drawPhase = (type: ExplosionParticleType): void => {
      if (type === "smoke") {
        ctx.globalCompositeOperation = "source-over";
      } else {
        ctx.globalCompositeOperation = normalized < 0.65 ? "lighter" : "source-over";
      }
      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i];
        if (particle.type !== type || particle.life <= 0) {
          continue;
        }
        const lifeRatio = clamp(particle.life / particle.maxLife, 0, 1);
        const age = 1 - lifeRatio;
        if (type === "fire") {
          const fireSize = particle.size * (1 + age * 1.2);
          const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, fireSize);
          gradient.addColorStop(0, `rgba(255, 255, 240, ${0.9 * lifeRatio})`);
          gradient.addColorStop(0.35, `rgba(255, 210, 90, ${0.75 * lifeRatio})`);
          gradient.addColorStop(0.7, `rgba(255, 110, 20, ${0.45 * lifeRatio})`);
          gradient.addColorStop(1, "rgba(120, 20, 0, 0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, fireSize, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        if (type === "debris") {
          const alpha = 0.75 * lifeRatio;
          const length = particle.size * (6 + age * 4);
          const dir = Math.atan2(particle.vy, particle.vx);
          ctx.strokeStyle = `rgba(255, ${160 + Math.round(50 * lifeRatio)}, 80, ${alpha})`;
          ctx.lineWidth = 1 + particle.size * 0.05;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x - Math.cos(dir) * length, particle.y - Math.sin(dir) * length);
          ctx.stroke();
          continue;
        }

        const smokeSize = particle.size * (1 + age * 2.4);
        const smokeAlpha = (0.28 + (1 - normalized) * 0.12) * lifeRatio;
        const earlyBrown = clamp(1 - age * 2.5, 0, 1);
        const r = Math.round(80 + earlyBrown * 30);
        const g = Math.round(72 + earlyBrown * 16);
        const b = Math.round(68 + earlyBrown * 8);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${smokeAlpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, smokeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawPhase("fire");
    drawPhase("debris");
    drawPhase("smoke");

    ctx.globalCompositeOperation = "source-over";
  }

  reset(): void {
    stateByCtx = new WeakMap<CanvasRenderingContext2D, ExplosionState>();
  }
}
