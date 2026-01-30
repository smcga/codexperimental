import { clamp, smoothstep } from "../../util/math";

export const EXPLOSION_DURATION = 0.8;
export const EXPLOSION_SHAKE_DURATION = 0.4;

type ExplosionParticle = {
  angle: number;
  speed: number;
  size: number;
  hue: number;
};

export type ExplosionState = {
  particles: ExplosionParticle[];
  slices: { y: number; height: number; offset: number }[];
};

function createRng(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function createExplosionState(seed = 1337, count = 120): ExplosionState {
  const rng = createRng(seed);
  const particles: ExplosionParticle[] = Array.from({ length: count }, () => {
    return {
      angle: rng() * Math.PI * 2,
      speed: 0.5 + rng() * 1.5,
      size: 2 + rng() * 4,
      hue: 170 + rng() * 140
    };
  });
  const slices = Array.from({ length: 6 }, () => {
    return {
      y: rng(),
      height: 0.04 + rng() * 0.08,
      offset: (rng() - 0.5) * 18
    };
  });
  return { particles, slices };
}

export function getExplosionShake(time: number): { x: number; y: number } {
  if (time < 0 || time > EXPLOSION_SHAKE_DURATION) {
    return { x: 0, y: 0 };
  }
  const intensity = (1 - time / EXPLOSION_SHAKE_DURATION) * 12;
  return {
    x: Math.sin(time * 70) * intensity,
    y: Math.cos(time * 64) * intensity
  };
}

export function renderExplosion(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  state: ExplosionState,
  shake: { x: number; y: number }
): void {
  if (time < 0 || time > EXPLOSION_DURATION) {
    return;
  }
  const progress = clamp(time / EXPLOSION_DURATION, 0, 1);
  const flash = 1 - smoothstep(0, 0.25, time);
  const alpha = clamp(1 - progress, 0, 1);

  ctx.save();
  ctx.translate(shake.x, shake.y);

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(255, 255, 255, ${flash})`;
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.min(width, height) * 0.45;

  ctx.globalCompositeOperation = "lighter";
  state.particles.forEach((particle) => {
    const distance = maxDistance * particle.speed * smoothstep(0, 1, progress);
    const x = centerX + Math.cos(particle.angle) * distance;
    const y = centerY + Math.sin(particle.angle) * distance;
    ctx.fillStyle = `hsla(${particle.hue}, 100%, 65%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });

  if (progress < 0.4) {
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(120, 200, 255, ${0.3 * (1 - progress)})`;
    state.slices.forEach((slice) => {
      const sliceY = slice.y * height;
      ctx.fillRect(
        0,
        sliceY,
        width,
        slice.height * height
      );
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.translate(slice.offset, 0);
      ctx.fillRect(0, sliceY, width, slice.height * height);
      ctx.restore();
    });
  }

  ctx.restore();
}
