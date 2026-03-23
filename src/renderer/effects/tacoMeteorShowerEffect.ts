import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

/**
 * Celestial taco shells streak through the scene, leaving glitter trails before bursting into playful topping splashes.
 */
export const TACO_METEOR_SHOWER_DEFAULTS = {
  shellCount: 13,
  swirl: 0.62,
  trail: 0.54,
  toppingBurst: 0.68,
  audioReact: 0.72,
  hueShift: 0,
  seed: 7
} as const;

export type TacoMeteorShell = {
  id: number;
  lane: number;
  depth: number;
  offset: number;
  wobble: number;
  spinRate: number;
  radius: number;
  burstBias: number;
  trailBias: number;
  hueOffset: number;
};

export type TacoMeteorPose = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  angle: number;
  scale: number;
  progress: number;
  burstProgress: number;
};

const TWO_PI = Math.PI * 2;

const resolveNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const tacoMeteorHash = (value: number): number => {
  const hashed = Math.sin(value * 127.1 + 311.7) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

export const buildTacoMeteorShells = (seed: number, shellCount: number): TacoMeteorShell[] => {
  const count = Math.max(4, Math.round(shellCount));
  return Array.from({ length: count }, (_, index) => {
    const t = seed * 41.7 + index * 23.19;
    return {
      id: index,
      lane: tacoMeteorHash(t + 0.2),
      depth: lerp(0.72, 1.28, tacoMeteorHash(t + 1.3)),
      offset: tacoMeteorHash(t + 2.1),
      wobble: lerp(0.4, 1.4, tacoMeteorHash(t + 3.4)),
      spinRate: lerp(-1.4, 1.4, tacoMeteorHash(t + 4.8)),
      radius: lerp(0.035, 0.085, tacoMeteorHash(t + 5.7)),
      burstBias: lerp(0.7, 1.3, tacoMeteorHash(t + 6.9)),
      trailBias: lerp(0.7, 1.25, tacoMeteorHash(t + 7.5)),
      hueOffset: lerp(-22, 28, tacoMeteorHash(t + 8.6))
    };
  });
};

export const computeTacoMeteorPose = ({
  shell,
  width,
  height,
  time,
  swirl,
  energy
}: {
  shell: TacoMeteorShell;
  width: number;
  height: number;
  time: number;
  swirl: number;
  energy: number;
}): TacoMeteorPose => {
  const cycle = 4.6 / shell.depth;
  const progress = ((time * (0.65 + energy * 0.18) + shell.offset * cycle) % cycle) / cycle;
  const prevProgress = (((time - 0.04) * (0.65 + energy * 0.18) + shell.offset * cycle) % cycle + cycle) % cycle / cycle;
  const arc = Math.sin(progress * Math.PI);
  const prevArc = Math.sin(prevProgress * Math.PI);
  const fallCurve = progress * progress;
  const prevFallCurve = prevProgress * prevProgress;
  const drift = Math.sin(time * (0.75 + shell.wobble * 0.35) + shell.id * 1.17) * width * (0.03 + swirl * 0.05);
  const swirlOffset = Math.cos(time * (0.52 + swirl * 0.38) + shell.id * 0.61) * width * 0.08 * swirl;
  const laneX = width * (0.08 + shell.lane * 0.84);
  const x = laneX + drift + swirlOffset * arc;
  const y = lerp(-height * 0.18, height * 1.08, fallCurve) - arc * height * (0.24 + swirl * 0.14);
  const prevX = laneX
    + Math.sin((time - 0.04) * (0.75 + shell.wobble * 0.35) + shell.id * 1.17) * width * (0.03 + swirl * 0.05)
    + Math.cos((time - 0.04) * (0.52 + swirl * 0.38) + shell.id * 0.61) * width * 0.08 * swirl * prevArc;
  const prevY = lerp(-height * 0.18, height * 1.08, prevFallCurve) - prevArc * height * (0.24 + swirl * 0.14);
  const burstProgress = clamp((progress - 0.72) / 0.28, 0, 1);
  return {
    x,
    y,
    prevX,
    prevY,
    angle: progress * TWO_PI * shell.spinRate + Math.sin(time * 0.9 + shell.id) * 0.35,
    scale: shell.depth * (0.88 + arc * 0.22 + energy * 0.08),
    progress,
    burstProgress
  };
};

export class TacoMeteorShowerEffect implements Effect {
  private cachedSeed = Number.NaN;
  private cachedShellCount = -1;
  private cachedShells: TacoMeteorShell[] = [];

  reset(): void {
    this.cachedSeed = Number.NaN;
    this.cachedShellCount = -1;
    this.cachedShells = [];
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const shellCount = clamp(resolveNumber(rawParams.shellCount, TACO_METEOR_SHOWER_DEFAULTS.shellCount), 4, 28);
    const swirl = clamp(resolveNumber(rawParams.swirl, TACO_METEOR_SHOWER_DEFAULTS.swirl), 0, 1.4);
    const trail = clamp(resolveNumber(rawParams.trail, TACO_METEOR_SHOWER_DEFAULTS.trail), 0, 1);
    const toppingBurst = clamp(resolveNumber(rawParams.toppingBurst, TACO_METEOR_SHOWER_DEFAULTS.toppingBurst), 0, 1.25);
    const audioReact = clamp(resolveNumber(rawParams.audioReact, TACO_METEOR_SHOWER_DEFAULTS.audioReact), 0, 1);
    const hueShift = resolveNumber(rawParams.hueShift, TACO_METEOR_SHOWER_DEFAULTS.hueShift);
    const seed = Math.round(resolveNumber(rawParams.seed, TACO_METEOR_SHOWER_DEFAULTS.seed));

    if (seed !== this.cachedSeed || Math.round(shellCount) !== this.cachedShellCount) {
      this.cachedShells = buildTacoMeteorShells(seed, shellCount);
      this.cachedSeed = seed;
      this.cachedShellCount = Math.round(shellCount);
    }

    const beatPulse = audio.beat ? audio.beatStrength : 0;
    const audioEnergy = audio.rms * 0.55 + audio.mid * 0.22 + audio.treble * 0.28 + beatPulse * 0.72;
    const energy = clamp((1 - audioReact) * 0.38 + audioEnergy * audioReact, 0, 1.5);
    const baseHue = (42 + hueShift + time * (8 + energy * 5)) % 360;

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, `hsl(${(baseHue + 210) % 360} 56% 8%)`);
    sky.addColorStop(0.45, `hsl(${(baseHue + 270) % 360} 62% 6%)`);
    sky.addColorStop(1, `hsl(${(baseHue + 315) % 360} 58% 4%)`);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const nebula = ctx.createRadialGradient(width * 0.52, height * 0.42, 0, width * 0.52, height * 0.42, Math.max(width, height) * 0.7);
    nebula.addColorStop(0, `hsla(${(baseHue + 25) % 360}, 100%, 72%, ${0.09 + energy * 0.06})`);
    nebula.addColorStop(0.42, `hsla(${(baseHue + 118) % 360}, 92%, 48%, ${0.08 + swirl * 0.08})`);
    nebula.addColorStop(1, "hsla(260, 90%, 18%, 0)");
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, width, height);

    const dustCount = Math.round(40 + energy * 28 + trail * 18);
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < dustCount; i += 1) {
      const t = seed * 17.3 + i * 9.91;
      const drift = time * (0.04 + tacoMeteorHash(t + 1.2) * 0.06);
      const x = (tacoMeteorHash(t + 0.5) * width + drift * width * (0.06 + swirl * 0.03)) % width;
      const y = (tacoMeteorHash(t + 2.5) * height + drift * height * 0.08 + height) % height;
      const radius = 0.3 + tacoMeteorHash(t + 3.5) * (1.4 + trail * 2);
      const hue = (baseHue + 50 + tacoMeteorHash(t + 4.5) * 120) % 360;
      ctx.fillStyle = `hsla(${hue}, 100%, ${74 + tacoMeteorHash(t + 5.5) * 16}%, ${0.06 + tacoMeteorHash(t + 6.5) * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TWO_PI);
      ctx.fill();
    }

    this.cachedShells.forEach((shell) => {
      const pose = computeTacoMeteorPose({ shell, width, height, time, swirl, energy });
      const dx = pose.x - pose.prevX;
      const dy = pose.y - pose.prevY;
      const velocity = Math.hypot(dx, dy) || 1;
      const tailLength = (18 + trail * 40 + energy * 18) * shell.trailBias * shell.depth;
      const tailX = pose.x - (dx / velocity) * tailLength;
      const tailY = pose.y - (dy / velocity) * tailLength;
      const shellHue = (baseHue + shell.hueOffset + shell.id * 12) % 360;
      const shellRadius = Math.min(width, height) * shell.radius * pose.scale;

      const trailGradient = ctx.createLinearGradient(tailX, tailY, pose.x, pose.y);
      trailGradient.addColorStop(0, `hsla(${(shellHue + 160) % 360}, 100%, 72%, 0)`);
      trailGradient.addColorStop(0.38, `hsla(${(shellHue + 86) % 360}, 100%, 76%, ${0.08 + trail * 0.2})`);
      trailGradient.addColorStop(1, `hsla(${shellHue}, 100%, 82%, ${0.36 + trail * 0.28 + energy * 0.08})`);
      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = 1.2 + shell.depth * (1.8 + energy * 0.8);
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(pose.x, pose.y);
      ctx.stroke();

      const sparkleCount = Math.round(4 + trail * 8 + energy * 5);
      for (let i = 0; i < sparkleCount; i += 1) {
        const sparkleT = i / Math.max(1, sparkleCount - 1);
        const jitterSeed = seed * 99 + shell.id * 17 + i * 2.1;
        const jitter = (tacoMeteorHash(jitterSeed + Math.floor(time * 24)) - 0.5) * shellRadius * 0.8;
        const sx = lerp(tailX, pose.x, sparkleT) + jitter;
        const sy = lerp(tailY, pose.y, sparkleT) + jitter * 0.25;
        ctx.fillStyle = `hsla(${(shellHue + 110) % 360}, 100%, ${74 + sparkleT * 18}%, ${0.08 + (1 - sparkleT) * 0.16})`;
        ctx.beginPath();
        ctx.arc(sx, sy, (1 - sparkleT) * (1.1 + energy * 0.5), 0, TWO_PI);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(pose.x, pose.y);
      ctx.rotate(pose.angle);
      ctx.scale(1, 0.9 + swirl * 0.1);

      const glow = ctx.createRadialGradient(0, 0, shellRadius * 0.12, 0, 0, shellRadius * 1.8);
      glow.addColorStop(0, `hsla(${(shellHue + 18) % 360}, 100%, 82%, ${0.34 + energy * 0.1})`);
      glow.addColorStop(1, `hsla(${(shellHue + 90) % 360}, 100%, 50%, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, shellRadius * 1.8, 0, TWO_PI);
      ctx.fill();

      ctx.fillStyle = `hsla(${shellHue}, 96%, ${52 + energy * 10}%, 0.96)`;
      ctx.beginPath();
      ctx.arc(0, 0, shellRadius, Math.PI * 0.1, Math.PI * 0.9, false);
      ctx.lineTo(shellRadius * 0.75, shellRadius * 0.08);
      ctx.quadraticCurveTo(0, shellRadius * 0.45, -shellRadius * 0.75, shellRadius * 0.08);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = `hsla(${(shellHue + 20) % 360}, 100%, 78%, ${0.42 + energy * 0.12})`;
      ctx.lineWidth = Math.max(1, shellRadius * 0.08);
      ctx.beginPath();
      ctx.arc(0, 0, shellRadius, Math.PI * 0.16, Math.PI * 0.84, false);
      ctx.stroke();

      const fillingCount = 7;
      for (let i = 0; i < fillingCount; i += 1) {
        const toppingX = lerp(-shellRadius * 0.55, shellRadius * 0.55, i / (fillingCount - 1));
        const toppingY = -shellRadius * (0.12 + (i % 2) * 0.08) + Math.sin(time * 2.4 + shell.id + i) * shellRadius * 0.04;
        const toppingHue = i % 3 === 0 ? 112 : i % 3 === 1 ? 8 : 146;
        ctx.fillStyle = `hsla(${(toppingHue + hueShift) % 360}, 92%, ${i % 3 === 1 ? 58 : 54}%, 0.9)`;
        ctx.beginPath();
        ctx.arc(toppingX, toppingY, shellRadius * (0.1 + (i % 2) * 0.04), 0, TWO_PI);
        ctx.fill();
      }

      ctx.restore();

      if (pose.burstProgress <= 0) {
        return;
      }

      const burstFade = 1 - pose.burstProgress;
      const toppingCount = Math.round((10 + toppingBurst * 14 + energy * 6) * shell.burstBias);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < toppingCount; i += 1) {
        const fragmentSeed = seed * 200 + shell.id * 31 + i * 1.7;
        const angle = tacoMeteorHash(fragmentSeed + 0.7) * TWO_PI;
        const dist = (8 + toppingBurst * 44 + energy * 18) * pose.burstProgress * (0.45 + tacoMeteorHash(fragmentSeed + 1.6));
        const fx = pose.x + Math.cos(angle) * dist;
        const fy = pose.y + Math.sin(angle) * dist * 0.72 + pose.burstProgress * height * 0.035;
        const radius = (1.6 + tacoMeteorHash(fragmentSeed + 2.5) * 4.4) * burstFade * shell.depth;
        const hue = i % 3 === 0 ? 112 : i % 3 === 1 ? 10 : 145;
        ctx.fillStyle = `hsla(${(hue + hueShift) % 360}, 94%, ${hue === 10 ? 56 : 52}%, ${0.22 + burstFade * 0.46})`;
        ctx.beginPath();
        ctx.ellipse(fx, fy, radius * 1.2, radius * 0.8, angle, 0, TWO_PI);
        ctx.fill();
      }

      ctx.fillStyle = `hsla(${(shellHue + 30) % 360}, 100%, 78%, ${0.08 + burstFade * 0.16})`;
      ctx.beginPath();
      ctx.arc(pose.x, pose.y, shellRadius * (1.1 + pose.burstProgress * 1.7), 0, TWO_PI);
      ctx.fill();
      ctx.globalCompositeOperation = "screen";
    });

    ctx.globalCompositeOperation = "source-over";
  }
}
