import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type SpaceStar = {
  x: number;
  y: number;
  z: number;
  size: number;
  hue: number;
  twinkle: number;
};

type SpacePlanet = {
  x: number;
  y: number;
  radius: number;
  hue: number;
  bandTilt: number;
  ring: number;
  parallax: number;
};

type SpaceGalaxy = {
  x: number;
  y: number;
  radius: number;
  hue: number;
  spin: number;
  armCount: number;
  parallax: number;
};

type SpaceAsteroid = {
  x: number;
  y: number;
  z: number;
  size: number;
  spin: number;
  hue: number;
};

type SpaceCache = {
  seed: number;
  width: number;
  height: number;
  starCount: number;
  asteroidCount: number;
  planetCount: number;
  stars: SpaceStar[];
  planets: SpacePlanet[];
  galaxies: SpaceGalaxy[];
  asteroids: SpaceAsteroid[];
};

export const COSMIC_VOYAGE_DEFAULTS = {
  speed: 1.2,
  warp: 0.7,
  starDensity: 1,
  galaxyGlow: 0.85,
  nebula: 0.7,
  asteroidDensity: 0.65,
  planetCount: 3,
  parallax: 0.75,
  bloom: 0.8,
  seed: 7
};

const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const cosmicHash01 = (x: number): number => {
  const s = Math.sin(x * 127.1) * 43758.5453123;
  return s - Math.floor(s);
};

const createCache = (
  width: number,
  height: number,
  seed: number,
  starCount: number,
  asteroidCount: number,
  planetCount: number
): SpaceCache => {
  const random = mulberry32(seed + width * 31 + height * 17);
  const stars = Array.from({ length: starCount }, () => ({
    x: random() * 2 - 1,
    y: random() * 2 - 1,
    z: lerp(0.12, 1.5, random()),
    size: lerp(0.6, 2.8, random()),
    hue: lerp(190, 245, random()),
    twinkle: random() * Math.PI * 2
  }));

  const galaxies = Array.from({ length: 3 }, (_, i) => ({
    x: lerp(0.12, 0.88, random()),
    y: lerp(0.1, 0.5, random()),
    radius: lerp(90, 180, random()),
    hue: lerp(190, 310, random()) + i * 14,
    spin: lerp(0.4, 1.2, random()) * (random() > 0.5 ? 1 : -1),
    armCount: 3 + Math.floor(random() * 3),
    parallax: lerp(0.12, 0.32, random())
  }));

  const planets = Array.from({ length: planetCount }, () => ({
    x: lerp(0.08, 0.92, random()),
    y: lerp(0.12, 0.68, random()),
    radius: lerp(24, 88, random()),
    hue: lerp(10, 260, random()),
    bandTilt: lerp(-0.45, 0.45, random()),
    ring: random() > 0.45 ? lerp(0.25, 0.62, random()) : 0,
    parallax: lerp(0.24, 0.58, random())
  }));

  const asteroids = Array.from({ length: asteroidCount }, () => ({
    x: random() * 2 - 1,
    y: random() * 2 - 1,
    z: lerp(0.2, 1.6, random()),
    size: lerp(1.5, 7.5, random()),
    spin: random() * Math.PI * 2,
    hue: lerp(18, 40, random())
  }));

  return { seed, width, height, starCount, asteroidCount, planetCount, stars, planets, galaxies, asteroids };
};

export class CosmicVoyageEffect implements Effect {
  private cache: SpaceCache | null = null;

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const speed = Math.max(0, params.speed ?? COSMIC_VOYAGE_DEFAULTS.speed);
    const warp = clamp(params.warp ?? COSMIC_VOYAGE_DEFAULTS.warp, 0, 2.4);
    const starDensity = clamp(params.starDensity ?? COSMIC_VOYAGE_DEFAULTS.starDensity, 0.2, 2.5);
    const galaxyGlow = clamp(params.galaxyGlow ?? COSMIC_VOYAGE_DEFAULTS.galaxyGlow, 0, 1.5);
    const nebula = clamp(params.nebula ?? COSMIC_VOYAGE_DEFAULTS.nebula, 0, 1.5);
    const asteroidDensity = clamp(params.asteroidDensity ?? COSMIC_VOYAGE_DEFAULTS.asteroidDensity, 0, 2);
    const planetCount = Math.max(1, Math.round(params.planetCount ?? COSMIC_VOYAGE_DEFAULTS.planetCount));
    const parallax = clamp(params.parallax ?? COSMIC_VOYAGE_DEFAULTS.parallax, 0, 1);
    const bloom = clamp(params.bloom ?? COSMIC_VOYAGE_DEFAULTS.bloom, 0, 1.6);
    const seed = Math.round(params.seed ?? COSMIC_VOYAGE_DEFAULTS.seed);

    const bass = audio?.bass ?? 0;
    const treble = audio?.treble ?? 0;
    const beat = audio?.beatStrength ?? 0;
    const rms = audio?.rms ?? 0;

    const starCount = Math.round(320 * starDensity + width * 0.12);
    const asteroidCount = Math.round(34 * asteroidDensity + width * 0.012);

    if (
      !this.cache ||
      this.cache.seed !== seed ||
      this.cache.width !== width ||
      this.cache.height !== height ||
      this.cache.starCount !== starCount ||
      this.cache.asteroidCount !== asteroidCount ||
      this.cache.planetCount !== planetCount
    ) {
      this.cache = createCache(width, height, seed, starCount, asteroidCount, planetCount);
    }

    this.drawBackdrop(ctx, width, height, time, nebula, galaxyGlow, bloom, beat, rms);
    this.drawGalaxies(ctx, width, height, time, galaxyGlow, parallax, beat);
    this.drawPlanets(ctx, width, height, time, parallax, bass, bloom);
    this.drawStarfield(ctx, width, height, time, delta, speed, warp, parallax, treble, beat, rms);
    this.drawAsteroids(ctx, width, height, time, delta, speed, parallax, asteroidDensity, beat);

    ctx.globalCompositeOperation = "source-over";
  }

  reset(): void {
    this.cache = null;
  }

  private drawBackdrop(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    nebula: number,
    galaxyGlow: number,
    bloom: number,
    beat: number,
    rms: number
  ): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `hsl(${220 + Math.sin(time * 0.07) * 18} 55% 8%)`);
    gradient.addColorStop(0.55, `hsl(${235 + Math.sin(time * 0.11) * 24} 48% 5%)`);
    gradient.addColorStop(1, "hsl(252 62% 3%)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 5; i += 1) {
      const pulse = 0.3 + 0.7 * cosmicHash01(i * 9.7 + Math.floor(time * 8));
      const x = width * cosmicHash01(i * 31.2 + 7.9);
      const y = height * (0.1 + cosmicHash01(i * 18.5 + 1.2) * 0.7);
      const radius = lerp(180, 520, cosmicHash01(i * 2.1 + 6.3));
      const alpha = (0.09 + nebula * 0.2 + beat * 0.12) * pulse;
      const cloud = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
      cloud.addColorStop(0, `hsla(${200 + i * 22}, 90%, 70%, ${alpha})`);
      cloud.addColorStop(1, "hsla(280, 90%, 20%, 0)");
      ctx.fillStyle = cloud;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (bloom + galaxyGlow + rms > 0.2) {
      ctx.fillStyle = `rgba(190, 210, 255, ${0.02 + bloom * 0.04 + rms * 0.03})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  private drawGalaxies(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    galaxyGlow: number,
    parallax: number,
    beat: number
  ): void {
    if (!this.cache) {
      return;
    }
    ctx.globalCompositeOperation = "lighter";
    this.cache.galaxies.forEach((galaxy, index) => {
      const cx = galaxy.x * width + Math.sin(time * 0.07 + index) * 20 * parallax;
      const cy = galaxy.y * height + Math.cos(time * 0.05 + index * 1.4) * 14 * parallax;
      const core = ctx.createRadialGradient(cx, cy, galaxy.radius * 0.08, cx, cy, galaxy.radius);
      core.addColorStop(0, `hsla(${galaxy.hue}, 92%, 78%, ${0.14 + galaxyGlow * 0.24 + beat * 0.2})`);
      core.addColorStop(1, "hsla(260, 90%, 15%, 0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, galaxy.radius, 0, Math.PI * 2);
      ctx.fill();

      const armSegments = 22;
      for (let arm = 0; arm < galaxy.armCount; arm += 1) {
        ctx.beginPath();
        for (let step = 0; step < armSegments; step += 1) {
          const t = step / (armSegments - 1);
          const angle =
            arm * ((Math.PI * 2) / galaxy.armCount) +
            t * Math.PI * 2.2 +
            time * galaxy.spin * 0.08 +
            beat * 0.4;
          const radius = galaxy.radius * (0.1 + t * 0.9);
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius * 0.62;
          if (step === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = `hsla(${galaxy.hue + arm * 6}, 90%, 72%, ${0.05 + galaxyGlow * 0.28})`;
        ctx.lineWidth = 0.6 + galaxyGlow * 1.4;
        ctx.stroke();
      }
    });
  }

  private drawPlanets(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    parallax: number,
    bass: number,
    bloom: number
  ): void {
    if (!this.cache) {
      return;
    }

    this.cache.planets.forEach((planet, index) => {
      const drift = (time * (0.002 + planet.parallax * 0.003) + index * 0.17) % 1;
      const px = ((planet.x + drift * 0.4 * parallax) % 1) * width;
      const py = planet.y * height + Math.sin(time * 0.18 + index) * 9 * parallax;
      const radius = planet.radius * (0.65 + planet.parallax);
      const planetGradient = ctx.createRadialGradient(
        px - radius * 0.25,
        py - radius * 0.2,
        radius * 0.2,
        px,
        py,
        radius
      );
      planetGradient.addColorStop(0, `hsla(${planet.hue + 20}, 70%, 74%, ${0.5 + bloom * 0.3})`);
      planetGradient.addColorStop(0.65, `hsla(${planet.hue}, 65%, 38%, ${0.7 + bass * 0.3})`);
      planetGradient.addColorStop(1, `hsla(${planet.hue - 12}, 72%, 16%, 0.96)`);

      ctx.fillStyle = planetGradient;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.35;
      for (let i = 0; i < 4; i += 1) {
        const bandY = py + (i - 1.5) * radius * 0.22;
        const wobble = Math.sin(time * 0.42 + i + index) * radius * 0.04;
        ctx.strokeStyle = `hsla(${planet.hue + i * 6}, 64%, 58%, ${0.14 + bass * 0.25})`;
        ctx.lineWidth = Math.max(1, radius * 0.05);
        ctx.beginPath();
        ctx.ellipse(px, bandY + wobble, radius * 0.92, radius * (0.14 + i * 0.02), planet.bandTilt, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (planet.ring > 0) {
        ctx.strokeStyle = `hsla(${planet.hue + 36}, 65%, 78%, ${0.32 + bloom * 0.18})`;
        ctx.lineWidth = Math.max(1.5, radius * 0.06);
        ctx.beginPath();
        ctx.ellipse(px, py, radius * (1 + planet.ring), radius * 0.28, planet.bandTilt + 0.08, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  private drawStarfield(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    delta: number,
    speed: number,
    warp: number,
    parallax: number,
    treble: number,
    beat: number,
    rms: number
  ): void {
    if (!this.cache) {
      return;
    }

    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const scale = Math.min(width, height) * (0.52 + warp * 0.13);
    const travel = (0.55 + speed + beat * 1.4) * delta;

    ctx.globalCompositeOperation = "lighter";

    this.cache.stars.forEach((star) => {
      star.z -= travel * (0.45 + star.size * 0.14);
      if (star.z <= 0.08) {
        star.z = 1.6;
        star.x = cosmicHash01(star.twinkle * 132.7 + time * 1.1) * 2 - 1;
        star.y = cosmicHash01(star.twinkle * 77.3 + time * 0.9) * 2 - 1;
      }

      const depth = 1 / star.z;
      const driftX = Math.sin(time * 0.35 + star.twinkle) * 0.06 * parallax;
      const driftY = Math.cos(time * 0.28 + star.twinkle * 1.1) * 0.04 * parallax;
      const x = centerX + (star.x + driftX) * scale * depth;
      const y = centerY + (star.y + driftY) * scale * depth;
      const twinkle = 0.55 + Math.sin(time * (1.8 + treble * 2.2) + star.twinkle) * 0.45;
      const size = Math.max(0.9, star.size * depth * (1 + rms * 0.8));
      const alpha = clamp(0.2 + twinkle * 0.4 + beat * 0.35, 0, 1);

      ctx.fillStyle = `hsla(${star.hue + treble * 25}, 100%, 84%, ${alpha})`;
      ctx.fillRect(x, y, size, size);

      if (warp > 0.08) {
        const stretch = 1 + warp * 2.8 + depth * 0.5;
        ctx.strokeStyle = `hsla(${star.hue - 10}, 100%, 72%, ${alpha * 0.6})`;
        ctx.lineWidth = Math.max(0.7, size * 0.55);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(centerX + (star.x + driftX) * scale * depth * stretch, centerY + (star.y + driftY) * scale * depth * stretch);
        ctx.stroke();
      }
    });
  }

  private drawAsteroids(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    delta: number,
    speed: number,
    parallax: number,
    asteroidDensity: number,
    beat: number
  ): void {
    if (!this.cache || asteroidDensity <= 0) {
      return;
    }

    const centerX = width * 0.5;
    const centerY = height * 0.52;
    const scale = Math.min(width, height) * 0.5;

    ctx.globalCompositeOperation = "source-over";
    this.cache.asteroids.forEach((asteroid, index) => {
      asteroid.z -= delta * (speed * 0.8 + 0.3 + asteroid.size * 0.09);
      asteroid.spin += delta * (0.7 + cosmicHash01(index + asteroid.hue) * 1.3);
      if (asteroid.z <= 0.1) {
        asteroid.z = 1.6;
        asteroid.x = cosmicHash01(index * 17.2 + time * 0.23) * 2 - 1;
        asteroid.y = cosmicHash01(index * 11.8 + time * 0.19) * 2 - 1;
      }

      const depth = 1 / asteroid.z;
      const x = centerX + asteroid.x * scale * depth * (0.9 + parallax * 0.3);
      const y = centerY + asteroid.y * scale * depth * (0.9 + parallax * 0.3);
      const radius = asteroid.size * depth * (1 + beat * 0.4);
      if (radius < 0.6 || radius > 28) {
        return;
      }

      ctx.fillStyle = `hsla(${asteroid.hue}, 24%, ${lerp(24, 64, depth)}%, ${clamp(0.15 + depth * 0.7, 0, 0.9)})`;
      ctx.beginPath();
      const points = 7;
      for (let i = 0; i <= points; i += 1) {
        const angle = (i / points) * Math.PI * 2 + asteroid.spin;
        const roughness = 0.75 + cosmicHash01(index * 13 + i * 0.7) * 0.5;
        const px = x + Math.cos(angle) * radius * roughness;
        const py = y + Math.sin(angle) * radius * roughness;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.fill();

      if (depth > 1.5) {
        ctx.strokeStyle = "hsla(42, 54%, 80%, 0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  }
}
