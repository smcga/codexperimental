import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type Boid = { x: number; y: number; vx: number; vy: number };

const DEFAULTS = {
  count: 90,
  speed: 1,
  cohesion: 0.22,
  alignment: 0.2,
  separation: 0.45,
  neighborRadius: 54,
  separationRadius: 18,
  trail: 0.18,
  size: 2,
  seed: 0
};

const TWO_PI = Math.PI * 2;

export const hashFloat = (value: number): number => {
  const s = Math.sin(value * 127.1) * 43758.5453123;
  return s - Math.floor(s);
};

export const wrap = (value: number, max: number): number => {
  if (max <= 0) {
    return 0;
  }
  let next = value % max;
  if (next < 0) {
    next += max;
  }
  return next;
};

export class BoidsSimulationEffect implements Effect {
  private boids: Boid[] = [];
  private seededFor = Number.NaN;

  reset(): void {
    this.boids = [];
    this.seededFor = Number.NaN;
  }

  private reseed(count: number, width: number, height: number, seed: number): void {
    this.boids = [];
    const target = Math.max(8, Math.round(count));
    for (let i = 0; i < target; i += 1) {
      const x = hashFloat(seed * 43.7 + i * 1.17) * width;
      const y = hashFloat(seed * 19.3 + i * 2.91) * height;
      const angle = hashFloat(seed * 7.1 + i * 4.73) * TWO_PI;
      const velocity = 22 + hashFloat(seed * 5.9 + i * 3.2) * 32;
      this.boids.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity });
    }
    this.seededFor = seed;
  }

  render({ ctx, width, height, delta, time, audio, params }: EffectRenderContext): void {
    const count = params.count ?? DEFAULTS.count;
    const speed = clamp(params.speed ?? DEFAULTS.speed, 0.1, 3);
    const cohesion = clamp(params.cohesion ?? DEFAULTS.cohesion, 0, 1.2);
    const alignment = clamp(params.alignment ?? DEFAULTS.alignment, 0, 1.2);
    const separation = clamp(params.separation ?? DEFAULTS.separation, 0, 1.6);
    const neighborRadius = Math.max(8, params.neighborRadius ?? DEFAULTS.neighborRadius);
    const separationRadius = clamp(params.separationRadius ?? DEFAULTS.separationRadius, 4, neighborRadius);
    const trail = clamp(params.trail ?? DEFAULTS.trail, 0.02, 0.5);
    const size = clamp(params.size ?? DEFAULTS.size, 1, 5);
    const seed = Math.round(params.seed ?? DEFAULTS.seed);

    if (this.boids.length !== Math.max(8, Math.round(count)) || this.seededFor !== seed) {
      this.reseed(count, width, height, seed);
    }

    const dt = Math.min(delta, 0.05) * speed;
    const beatBoost = audio.beat ? 1 + audio.beatStrength * 0.9 : 1;
    const maxSpeed = (65 + audio.bass * 120) * beatBoost;
    const minSpeed = maxSpeed * 0.2;
    const neighborRadiusSq = neighborRadius * neighborRadius;
    const separationRadiusSq = separationRadius * separationRadius;

    ctx.fillStyle = `rgba(2, 4, 10, ${trail})`;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < this.boids.length; i += 1) {
      const boid = this.boids[i];
      let cx = 0;
      let cy = 0;
      let ax = 0;
      let ay = 0;
      let sx = 0;
      let sy = 0;
      let neighbors = 0;

      for (let j = 0; j < this.boids.length; j += 1) {
        if (i === j) continue;
        const other = this.boids[j];
        let dx = other.x - boid.x;
        let dy = other.y - boid.y;

        if (Math.abs(dx) > width * 0.5) dx -= Math.sign(dx) * width;
        if (Math.abs(dy) > height * 0.5) dy -= Math.sign(dy) * height;

        const distSq = dx * dx + dy * dy;
        if (distSq > neighborRadiusSq) {
          continue;
        }

        neighbors += 1;
        cx += dx;
        cy += dy;
        ax += other.vx;
        ay += other.vy;

        if (distSq < separationRadiusSq) {
          const dist = Math.sqrt(distSq) + 0.001;
          const force = (1 - dist / separationRadius) / dist;
          sx -= dx * force;
          sy -= dy * force;
        }
      }

      if (neighbors > 0) {
        const inv = 1 / neighbors;
        boid.vx += (cx * inv * cohesion + (ax * inv - boid.vx) * alignment + sx * separation) * dt;
        boid.vy += (cy * inv * cohesion + (ay * inv - boid.vy) * alignment + sy * separation) * dt;
      }

      const speedNow = Math.hypot(boid.vx, boid.vy) || 1;
      if (speedNow > maxSpeed) {
        boid.vx = (boid.vx / speedNow) * maxSpeed;
        boid.vy = (boid.vy / speedNow) * maxSpeed;
      } else if (speedNow < minSpeed) {
        boid.vx = (boid.vx / speedNow) * minSpeed;
        boid.vy = (boid.vy / speedNow) * minSpeed;
      }

      boid.x = wrap(boid.x + boid.vx * dt, width);
      boid.y = wrap(boid.y + boid.vy * dt, height);
    }

    for (let i = 0; i < this.boids.length; i += 1) {
      const boid = this.boids[i];
      const heading = Math.atan2(boid.vy, boid.vx);
      const pulse = 0.35 + audio.rms * 0.8 + (audio.beat ? audio.beatStrength * 0.9 : 0);
      const hue = (190 + i * 2 + time * 24 + audio.treble * 90) % 360;
      const light = clamp(55 + pulse * 22, 45, 88);
      ctx.fillStyle = `hsl(${hue} 100% ${light}%)`;
      ctx.beginPath();
      ctx.moveTo(boid.x + Math.cos(heading) * (size * 2.3), boid.y + Math.sin(heading) * (size * 2.3));
      ctx.lineTo(boid.x + Math.cos(heading + 2.5) * size, boid.y + Math.sin(heading + 2.5) * size);
      ctx.lineTo(boid.x + Math.cos(heading - 2.5) * size, boid.y + Math.sin(heading - 2.5) * size);
      ctx.closePath();
      ctx.fill();
    }
  }
}
