import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

/**
 * Coupled pendulum array with weighted strings, inertia, and beat-driven pushes so the motion feels genuinely physical.
 */
export const PENDULUM_WAVE_DEFAULTS = {
  count: 11,
  spread: 0.78,
  gravity: 0.78,
  damping: 0.1,
  coupling: 0.44,
  bobRadius: 0.9,
  trail: 0.2,
  sway: 0.56,
  audioReact: 0.74,
  seed: 7
} as const;

type PendulumRig = {
  anchorX: number;
  anchorY: number;
  length: number;
  restAngle: number;
  angle: number;
  velocity: number;
  mass: number;
  radius: number;
  hue: number;
  phase: number;
};

const TWO_PI = Math.PI * 2;
const FIXED_STEP = 1 / 120;
const MAX_STEPS = 8;

const resolveNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const pendulumWaveHash = (value: number): number => {
  const hashed = Math.sin(value * 127.13 + 19.19) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

export const buildPendulumRig = ({
  width,
  height,
  count,
  spread,
  bobRadius,
  seed
}: {
  width: number;
  height: number;
  count: number;
  spread: number;
  bobRadius: number;
  seed: number;
}): PendulumRig[] => {
  const resolvedCount = clamp(Math.round(count), 5, 24);
  const usableSpread = clamp(spread, 0.3, 0.95);
  const normalizedRadius = clamp(bobRadius, 0.45, 1.6);
  const startX = width * (0.5 - usableSpread * 0.5);
  const spacing = (width * usableSpread) / Math.max(1, resolvedCount - 1);
  const anchorY = height * 0.12;

  return Array.from({ length: resolvedCount }, (_, index) => {
    const t = seed * 41.23 + index * 13.17;
    const radius = (10 + pendulumWaveHash(t + 0.2) * 12) * normalizedRadius;
    const length = lerp(height * 0.2, height * 0.44, pendulumWaveHash(t + 0.5));
    const restAngle = lerp(-0.24, 0.24, pendulumWaveHash(t + 0.8));
    return {
      anchorX: startX + spacing * index,
      anchorY,
      length,
      restAngle,
      angle: restAngle + lerp(-0.16, 0.16, pendulumWaveHash(t + 1.1)),
      velocity: lerp(-0.65, 0.65, pendulumWaveHash(t + 1.4)),
      mass: lerp(0.8, 1.5, pendulumWaveHash(t + 1.8)),
      radius,
      hue: (190 + pendulumWaveHash(t + 2.4) * 135 + index * 9) % 360,
      phase: pendulumWaveHash(t + 3.2) * TWO_PI
    };
  });
};

export const stepPendulumRig = ({
  rig,
  dt,
  gravity,
  damping,
  coupling,
  sway,
  drive,
  time
}: {
  rig: PendulumRig[];
  dt: number;
  gravity: number;
  damping: number;
  coupling: number;
  sway: number;
  drive: number;
  time: number;
}): void => {
  if (rig.length === 0) {
    return;
  }

  const nextVelocity = new Array<number>(rig.length);
  const gravityStrength = lerp(10, 28, clamp(gravity, 0, 1.6));
  const dampingStrength = lerp(0.03, 0.16, clamp(damping, 0, 1.2));
  const couplingStrength = lerp(0.55, 3.2, clamp(coupling, 0, 1.4));
  const swayStrength = lerp(0.18, 1.6, clamp(sway, 0, 1.4));

  for (let index = 0; index < rig.length; index += 1) {
    const bob = rig[index];
    const left = rig[index - 1];
    const right = rig[index + 1];
    const animatedRestAngle = bob.restAngle + Math.sin(time * (0.48 + swayStrength * 0.52) + bob.phase) * swayStrength * 0.16;
    const springToRest = (animatedRestAngle - bob.angle) * (1.08 + swayStrength * 0.44);
    const neighborPull = ((left?.angle ?? bob.angle) + (right?.angle ?? bob.angle) - bob.angle * 2) * couplingStrength;
    const gravityPull = (-gravityStrength / Math.max(34, bob.length)) * Math.sin(bob.angle);
    const swayDrive = Math.sin(time * (0.9 + swayStrength * 0.55) + bob.phase) * swayStrength * 0.06;
    const audioDrive = Math.sin(time * (1.8 + drive * 8) + bob.phase * 1.7) * (0.035 + drive * 0.22);
    const acceleration = (gravityPull + springToRest + neighborPull + swayDrive + audioDrive / bob.mass) - bob.velocity * dampingStrength;
    nextVelocity[index] = clamp(bob.velocity + acceleration * dt * 60, -4.6, 4.6);
  }

  for (let index = 0; index < rig.length; index += 1) {
    const bob = rig[index];
    bob.velocity = nextVelocity[index] ?? bob.velocity;
    bob.angle = clamp(bob.angle + bob.velocity * dt, -1.45, 1.45);
  }
};

export class PendulumWaveEffect implements Effect {
  private rig: PendulumRig[] = [];
  private accumulator = 0;
  private cachedSeed = Number.NaN;
  private cachedCount = -1;
  private cachedWidth = -1;
  private cachedHeight = -1;
  private cachedSpread = Number.NaN;
  private cachedBobRadius = Number.NaN;
  private previousBeat = false;

  reset(): void {
    this.rig = [];
    this.accumulator = 0;
    this.cachedSeed = Number.NaN;
    this.cachedCount = -1;
    this.cachedWidth = -1;
    this.cachedHeight = -1;
    this.cachedSpread = Number.NaN;
    this.cachedBobRadius = Number.NaN;
    this.previousBeat = false;
  }

  private ensureRig(width: number, height: number, count: number, spread: number, bobRadius: number, seed: number): void {
    const roundedCount = clamp(Math.round(count), 5, 24);
    const safeSpread = clamp(spread, 0.3, 0.95);
    const safeBobRadius = clamp(bobRadius, 0.45, 1.6);
    if (
      this.rig.length > 0
      && this.cachedSeed === seed
      && this.cachedCount === roundedCount
      && this.cachedWidth === width
      && this.cachedHeight === height
      && this.cachedSpread === safeSpread
      && this.cachedBobRadius === safeBobRadius
    ) {
      return;
    }

    this.rig = buildPendulumRig({ width, height, count: roundedCount, spread: safeSpread, bobRadius: safeBobRadius, seed });
    this.cachedSeed = seed;
    this.cachedCount = roundedCount;
    this.cachedWidth = width;
    this.cachedHeight = height;
    this.cachedSpread = safeSpread;
    this.cachedBobRadius = safeBobRadius;
    this.accumulator = 0;
  }

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const count = clamp(resolveNumber(rawParams.count, PENDULUM_WAVE_DEFAULTS.count), 5, 24);
    const spread = clamp(resolveNumber(rawParams.spread, PENDULUM_WAVE_DEFAULTS.spread), 0.3, 0.95);
    const gravity = clamp(resolveNumber(rawParams.gravity, PENDULUM_WAVE_DEFAULTS.gravity), 0, 1.6);
    const damping = clamp(resolveNumber(rawParams.damping, PENDULUM_WAVE_DEFAULTS.damping), 0.02, 1.2);
    const coupling = clamp(resolveNumber(rawParams.coupling, PENDULUM_WAVE_DEFAULTS.coupling), 0, 1.4);
    const bobRadius = clamp(resolveNumber(rawParams.bobRadius, PENDULUM_WAVE_DEFAULTS.bobRadius), 0.45, 1.6);
    const trail = clamp(resolveNumber(rawParams.trail, PENDULUM_WAVE_DEFAULTS.trail), 0.02, 0.65);
    const sway = clamp(resolveNumber(rawParams.sway, PENDULUM_WAVE_DEFAULTS.sway), 0, 1.4);
    const audioReact = clamp(resolveNumber(rawParams.audioReact, PENDULUM_WAVE_DEFAULTS.audioReact), 0, 1);
    const seed = Math.round(resolveNumber(rawParams.seed, PENDULUM_WAVE_DEFAULTS.seed));

    this.ensureRig(width, height, count, spread, bobRadius, seed);

    const energy = clamp(audio.rms * 0.5 + audio.bass * 0.32 + audio.mid * 0.18, 0, 1);
    const beatPulse = audio.beat && !this.previousBeat ? audio.beatStrength : 0;
    this.previousBeat = audio.beat;
    const drive = ((energy * 0.08 + beatPulse * 0.3) * audioReact) + (1 - audioReact) * 0.05;

    this.accumulator = Math.min(this.accumulator + Math.max(0, delta), FIXED_STEP * MAX_STEPS);
    let steps = 0;
    while (this.accumulator >= FIXED_STEP && steps < MAX_STEPS) {
      stepPendulumRig({
        rig: this.rig,
        dt: FIXED_STEP,
        gravity,
        damping,
        coupling,
        sway,
        drive,
        time: time - this.accumulator
      });
      this.accumulator -= FIXED_STEP;
      steps += 1;
    }

    const baseHue = (204 + time * 10 + energy * 30) % 360;
    const background = ctx.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, `rgba(3, 10, 18, ${0.78 + trail * 0.12})`);
    background.addColorStop(0.5, `rgba(4, 14, 24, ${0.84 + trail * 0.08})`);
    background.addColorStop(1, `rgba(0, 3, 8, ${0.92})`);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const haze = ctx.createRadialGradient(width * 0.5, height * 0.32, 0, width * 0.5, height * 0.38, Math.max(width, height) * 0.8);
    haze.addColorStop(0, `hsla(${baseHue}, 85%, 60%, ${0.09 + energy * 0.08})`);
    haze.addColorStop(0.55, `hsla(${(baseHue + 38) % 360}, 95%, 48%, ${0.06 + audioReact * 0.06})`);
    haze.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);

    const beamY = height * 0.12;
    ctx.strokeStyle = `hsla(${(baseHue + 32) % 360}, 30%, 76%, 0.46)`;
    ctx.lineWidth = Math.max(2, height * 0.007);
    ctx.beginPath();
    ctx.moveTo(width * (0.5 - spread * 0.55), beamY);
    ctx.lineTo(width * (0.5 + spread * 0.55), beamY);
    ctx.stroke();

    this.rig.forEach((bob, index) => {
      const x = bob.anchorX + Math.sin(bob.angle) * bob.length;
      const y = bob.anchorY + Math.cos(bob.angle) * bob.length;
      const glow = 0.2 + energy * 0.35 + Math.abs(bob.velocity) * 0.08;
      const hue = (bob.hue + time * 12 + index * 3) % 360;

      ctx.strokeStyle = `hsla(${(hue + 12) % 360}, 42%, 85%, ${0.3 + glow * 0.3})`;
      ctx.lineWidth = Math.max(1.2, bob.radius * 0.12);
      ctx.beginPath();
      ctx.moveTo(bob.anchorX, bob.anchorY);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.fillStyle = `rgba(0, 0, 0, ${0.16 + bob.radius * 0.003})`;
      ctx.beginPath();
      ctx.ellipse(x + bob.radius * 0.18, y + height * 0.025, bob.radius * 1.05, bob.radius * 0.42, 0, 0, TWO_PI);
      ctx.fill();

      const bobGradient = ctx.createRadialGradient(
        x - bob.radius * 0.35,
        y - bob.radius * 0.45,
        Math.max(1, bob.radius * 0.12),
        x,
        y,
        bob.radius * 1.15
      );
      bobGradient.addColorStop(0, `hsla(${(hue + 18) % 360}, 100%, 88%, ${0.88})`);
      bobGradient.addColorStop(0.32, `hsla(${hue}, 84%, 60%, ${0.92})`);
      bobGradient.addColorStop(1, `hsla(${(hue + 52) % 360}, 92%, 24%, ${0.96})`);
      ctx.fillStyle = bobGradient;
      ctx.beginPath();
      ctx.arc(x, y, bob.radius, 0, TWO_PI);
      ctx.fill();

      ctx.strokeStyle = `hsla(${(hue + 48) % 360}, 95%, 80%, ${0.4 + glow * 0.24})`;
      ctx.lineWidth = Math.max(0.8, bob.radius * 0.08);
      ctx.beginPath();
      ctx.arc(x, y, bob.radius * 0.98, 0, TWO_PI);
      ctx.stroke();

      ctx.fillStyle = `hsla(${(hue + 8) % 360}, 100%, 95%, ${0.22 + glow * 0.18})`;
      ctx.beginPath();
      ctx.arc(x - bob.radius * 0.28, y - bob.radius * 0.34, bob.radius * 0.2, 0, TWO_PI);
      ctx.fill();

      if (index > 0) {
        const prev = this.rig[index - 1];
        const prevX = prev.anchorX + Math.sin(prev.angle) * prev.length;
        const prevY = prev.anchorY + Math.cos(prev.angle) * prev.length;
        ctx.strokeStyle = `hsla(${(baseHue + 20) % 360}, 60%, 72%, ${0.08 + coupling * 0.08})`;
        ctx.lineWidth = 0.8 + coupling * 0.9;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.quadraticCurveTo((prevX + x) * 0.5, Math.min(prevY, y) - height * 0.04 * coupling, x, y);
        ctx.stroke();
      }
    });

    const vignette = ctx.createRadialGradient(width * 0.5, height * 0.5, Math.min(width, height) * 0.18, width * 0.5, height * 0.5, Math.max(width, height) * 0.75);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, `rgba(0, 0, 0, ${0.2 + trail * 0.28})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }
}
