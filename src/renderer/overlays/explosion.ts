import { clamp } from "../../util/math";

type Particle = {
  angle: number;
  speed: number;
  radius: number;
  hue: number;
};

export const EXPLOSION_DURATION = 0.8;
export const EXPLOSION_SHAKE_DURATION = 0.4;

const PARTICLE_COUNT = 90;
const BURST_RADIUS = 220;

const createSeededRandom = (seed: number): (() => number) => {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const computeExplosionShake = (time: number): number => {
  if (time < 0 || time > EXPLOSION_SHAKE_DURATION) {
    return 0;
  }
  const progress = time / EXPLOSION_SHAKE_DURATION;
  return Math.pow(1 - progress, 2);
};

export class ExplosionOverlay {
  private particles: Particle[];

  constructor(seed = 1337) {
    const random = createSeededRandom(seed);
    this.particles = Array.from({ length: PARTICLE_COUNT }).map(() => {
      return {
        angle: random() * Math.PI * 2,
        speed: 0.6 + random() * 1.2,
        radius: 2 + random() * 4,
        hue: 40 + random() * 120
      };
    });
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, time: number | undefined): void {
    if (time === undefined || time < 0 || time > EXPLOSION_DURATION) {
      return;
    }
    const progress = clamp(time / EXPLOSION_DURATION, 0, 1);
    const flashAlpha = Math.max(0, 1 - progress * 3);
    if (flashAlpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    const centreX = width / 2;
    const centreY = height / 2;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const particleAlpha = Math.max(0, 1 - progress);
    this.particles.forEach((particle) => {
      const distance = particle.speed * BURST_RADIUS * Math.pow(progress, 0.8);
      const x = centreX + Math.cos(particle.angle) * distance;
      const y = centreY + Math.sin(particle.angle) * distance;
      ctx.fillStyle = `hsla(${particle.hue}, 90%, 65%, ${particleAlpha})`;
      ctx.beginPath();
      ctx.arc(x, y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}
