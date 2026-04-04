import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

/**
 * Taco meteor shower launches glowing shells through the sky, leaves sparkling stardust trails, and bursts into avocado/cilantro/salsa confetti on impact.
 */
export const TACO_METEOR_SHOWER_DEFAULTS = {
  shellCount: 16,
  fallSpeed: 0.62,
  swirl: 0.7,
  burst: 0.78,
  stardust: 0.72,
  toppingSpread: 0.7,
  audioReact: 0.68,
  seed: 7
} as const;

type TacoShell = {
  lane: number;
  phaseOffset: number;
  sway: number;
  wobble: number;
  size: number;
  spin: number;
  hueOffset: number;
  collisionBand: number;
};

export type TacoShellState = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  rotation: number;
  scale: number;
  collisionProgress: number;
  burstProgress: number;
  dustAlpha: number;
};

const TWO_PI = Math.PI * 2;

const resolveNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const tacoHash01 = (value: number): number => {
  const hashed = Math.sin(value * 91.173 + 17.371) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

export const buildTacoShells = (seed: number, shellCount: number): TacoShell[] => {
  const count = Math.max(6, Math.round(shellCount));
  return Array.from({ length: count }, (_, index) => {
    const t = seed * 19.7 + index * 13.1;
    return {
      lane: lerp(0.08, 0.92, tacoHash01(t + 0.2)),
      phaseOffset: tacoHash01(t + 1.3),
      sway: lerp(0.035, 0.14, tacoHash01(t + 2.4)),
      wobble: lerp(0.55, 1.45, tacoHash01(t + 3.5)),
      size: lerp(0.045, 0.095, tacoHash01(t + 4.6)),
      spin: lerp(-2.6, 2.6, tacoHash01(t + 5.7)),
      hueOffset: lerp(-22, 58, tacoHash01(t + 6.8)),
      collisionBand: lerp(0.44, 0.78, tacoHash01(t + 7.9))
    };
  });
};

export const computeTacoShellState = ({
  width,
  height,
  time,
  fallSpeed,
  swirl,
  burst,
  shell,
  energy
}: {
  width: number;
  height: number;
  time: number;
  fallSpeed: number;
  swirl: number;
  burst: number;
  shell: TacoShell;
  energy: number;
}): TacoShellState => {
  const cycle = Math.max(1.8, 4.4 - fallSpeed * 2.2);
  const progress = ((time / cycle + shell.phaseOffset) % 1 + 1) % 1;
  const prevProgress = ((time - 0.04) / cycle + shell.phaseOffset) % 1;
  const eased = Math.pow(progress, 0.86);
  const prevEased = Math.pow(((prevProgress % 1) + 1) % 1, 0.86);
  const arc = Math.sin(progress * TWO_PI * (1.4 + swirl * shell.wobble));
  const prevArc = Math.sin((((prevProgress % 1) + 1) % 1) * TWO_PI * (1.4 + swirl * shell.wobble));
  const drift = Math.sin(time * (0.28 + shell.wobble * 0.14) + shell.lane * 9.1) * width * shell.sway * swirl;
  const prevDrift = Math.sin((time - 0.04) * (0.28 + shell.wobble * 0.14) + shell.lane * 9.1) * width * shell.sway * swirl;
  const x = width * shell.lane + arc * width * 0.12 * swirl + drift;
  const prevX = width * shell.lane + prevArc * width * 0.12 * swirl + prevDrift;
  const y = lerp(-height * 0.16, height * 1.12, eased);
  const prevY = lerp(-height * 0.16, height * 1.12, prevEased);
  const collisionThreshold = shell.collisionBand;
  const collisionProgress = clamp((progress - collisionThreshold) / Math.max(0.08, (1 - collisionThreshold) * 0.52), 0, 1);
  const burstProgress = clamp(Math.pow(collisionProgress, 0.78) * (0.72 + burst * 0.55 + energy * 0.16), 0, 1.3);

  return {
    x,
    y,
    prevX,
    prevY,
    rotation: progress * TWO_PI * shell.spin + arc * 0.3,
    scale: 0.7 + shell.size * 4.6 + energy * 0.08,
    collisionProgress,
    burstProgress,
    dustAlpha: clamp(0.18 + (1 - collisionProgress) * 0.46 + energy * 0.12, 0, 1)
  };
};

export class TacoMeteorShowerEffect implements Effect {
  private cachedSeed = Number.NaN;
  private cachedShellCount = -1;
  private cachedShells: TacoShell[] = [];

  reset(): void {
    this.cachedSeed = Number.NaN;
    this.cachedShellCount = -1;
    this.cachedShells = [];
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const shellCount = clamp(resolveNumber(rawParams.shellCount, TACO_METEOR_SHOWER_DEFAULTS.shellCount), 6, 32);
    const fallSpeed = clamp(resolveNumber(rawParams.fallSpeed, TACO_METEOR_SHOWER_DEFAULTS.fallSpeed), 0.2, 1.6);
    const swirl = clamp(resolveNumber(rawParams.swirl, TACO_METEOR_SHOWER_DEFAULTS.swirl), 0, 1.4);
    const burst = clamp(resolveNumber(rawParams.burst, TACO_METEOR_SHOWER_DEFAULTS.burst), 0.2, 1.4);
    const stardust = clamp(resolveNumber(rawParams.stardust, TACO_METEOR_SHOWER_DEFAULTS.stardust), 0, 1.4);
    const toppingSpread = clamp(resolveNumber(rawParams.toppingSpread, TACO_METEOR_SHOWER_DEFAULTS.toppingSpread), 0.2, 1.4);
    const audioReact = clamp(resolveNumber(rawParams.audioReact, TACO_METEOR_SHOWER_DEFAULTS.audioReact), 0, 1);
    const seed = Math.round(resolveNumber(rawParams.seed, TACO_METEOR_SHOWER_DEFAULTS.seed));

    if (seed !== this.cachedSeed || Math.round(shellCount) !== this.cachedShellCount) {
      this.cachedShells = buildTacoShells(seed, shellCount);
      this.cachedSeed = seed;
      this.cachedShellCount = Math.round(shellCount);
    }

    const beatPulse = audio.beat ? audio.beatStrength : 0;
    const audioEnergy = audio.rms * 0.42 + audio.mid * 0.26 + audio.treble * 0.32 + beatPulse * 0.88;
    const energy = clamp((1 - audioReact) * 0.34 + audioEnergy * audioReact, 0, 1.6);
    const baseHue = (32 + time * (4 + fallSpeed * 3) + audio.treble * 24) % 360;

    const backdrop = ctx.createLinearGradient(0, 0, 0, height);
    backdrop.addColorStop(0, `hsl(${(baseHue + 220) % 360} 48% 8%)`);
    backdrop.addColorStop(0.4, `hsl(${(baseHue + 272) % 360} 58% 12%)`);
    backdrop.addColorStop(1, `hsl(${(baseHue + 326) % 360} 72% 6%)`);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, width, height);

    const nebula = ctx.createRadialGradient(width * 0.5, height * 0.46, 0, width * 0.5, height * 0.46, Math.max(width, height) * 0.7);
    nebula.addColorStop(0, `hsla(${(baseHue + 46) % 360}, 100%, 72%, ${0.08 + stardust * 0.06 + energy * 0.05})`);
    nebula.addColorStop(0.45, `hsla(${(baseHue + 112) % 360}, 92%, 58%, ${0.06 + stardust * 0.05})`);
    nebula.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "screen";
    const starCount = Math.round(24 + stardust * 38 + energy * 16);
    for (let i = 0; i < starCount; i += 1) {
      const t = seed * 10.7 + i * 4.2 + Math.floor(time * 8);
      const x = tacoHash01(t + 0.4) * width;
      const y = (tacoHash01(t + 1.5) * height + time * (4 + fallSpeed * 14) * (0.25 + tacoHash01(t + 2.3)) + height) % height;
      const radius = 0.5 + tacoHash01(t + 3.4) * (1.2 + stardust * 1.6);
      ctx.fillStyle = `hsla(${(baseHue + tacoHash01(t + 4.8) * 120) % 360}, 100%, ${72 + tacoHash01(t + 5.1) * 18}%, ${0.08 + stardust * 0.18})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TWO_PI);
      ctx.fill();
    }

    this.cachedShells.forEach((shell, index) => {
      const state = computeTacoShellState({ width, height, time, fallSpeed, swirl, burst, shell, energy });
      const hue = (baseHue + shell.hueOffset + index * 7) % 360;
      const shellRadius = Math.min(width, height) * shell.size * (0.95 + energy * 0.08);

      const trail = ctx.createLinearGradient(state.prevX, state.prevY, state.x, state.y);
      trail.addColorStop(0, `hsla(${(hue + 170) % 360}, 100%, 72%, 0)`);
      trail.addColorStop(0.45, `hsla(${(hue + 70) % 360}, 100%, 78%, ${state.dustAlpha * 0.34 * stardust})`);
      trail.addColorStop(1, `hsla(${(hue + 24) % 360}, 100%, 84%, ${state.dustAlpha * 0.9 * stardust})`);
      ctx.strokeStyle = trail;
      ctx.lineWidth = shellRadius * (0.45 + stardust * 0.3);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(state.prevX, state.prevY);
      ctx.lineTo(state.x, state.y);
      ctx.stroke();

      const dustCount = Math.round(4 + stardust * 8 + energy * 3);
      ctx.globalCompositeOperation = "lighter";
      for (let sparkIndex = 0; sparkIndex < dustCount; sparkIndex += 1) {
        const sparkSeed = seed * 50 + index * 17 + sparkIndex * 2.7;
        const sparkT = tacoHash01(sparkSeed + Math.floor(time * 24));
        const dustX = lerp(state.prevX, state.x, sparkT) + (tacoHash01(sparkSeed + 0.9) - 0.5) * shellRadius * 2.2;
        const dustY = lerp(state.prevY, state.y, sparkT) + (tacoHash01(sparkSeed + 1.7) - 0.5) * shellRadius * 1.2;
        const dustRadius = 0.7 + tacoHash01(sparkSeed + 2.8) * (1.1 + stardust * 1.3);
        ctx.fillStyle = `hsla(${(hue + 48 + sparkIndex * 11) % 360}, 100%, ${72 + tacoHash01(sparkSeed + 3.4) * 18}%, ${0.08 + state.dustAlpha * 0.16 * stardust})`;
        ctx.beginPath();
        ctx.arc(dustX, dustY, dustRadius, 0, TWO_PI);
        ctx.fill();
      }

      if (state.collisionProgress < 0.98) {
        ctx.save();
        ctx.translate(state.x, state.y);
        ctx.rotate(state.rotation);
        ctx.scale(state.scale, state.scale);

        const glow = ctx.createRadialGradient(0, 0, shellRadius * 0.2, 0, 0, shellRadius * 1.9);
        glow.addColorStop(0, `hsla(${(hue + 22) % 360}, 100%, 84%, ${0.26 + energy * 0.1})`);
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, shellRadius * 1.9, 0, TWO_PI);
        ctx.fill();

        ctx.fillStyle = `hsl(${(hue + 18) % 360} 92% 64%)`;
        ctx.beginPath();
        ctx.ellipse(0, 0, shellRadius, shellRadius * 0.72, 0, Math.PI * 0.08, Math.PI * 0.92);
        ctx.lineTo(-shellRadius * 0.62, shellRadius * 0.14);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = `hsla(${(hue + 38) % 360}, 100%, 90%, 0.44)`;
        ctx.lineWidth = Math.max(1.2, shellRadius * 0.08);
        ctx.stroke();

        ctx.fillStyle = "hsla(108, 78%, 64%, 0.9)";
        ctx.beginPath();
        ctx.ellipse(-shellRadius * 0.18, -shellRadius * 0.03, shellRadius * 0.18, shellRadius * 0.12, -0.4, 0, TWO_PI);
        ctx.fill();
        ctx.fillStyle = "hsla(8, 96%, 60%, 0.88)";
        ctx.beginPath();
        ctx.ellipse(shellRadius * 0.12, -shellRadius * 0.08, shellRadius * 0.24, shellRadius * 0.15, 0.5, 0, TWO_PI);
        ctx.fill();
        ctx.fillStyle = "hsla(138, 92%, 72%, 0.88)";
        ctx.beginPath();
        ctx.ellipse(0, -shellRadius * 0.18, shellRadius * 0.14, shellRadius * 0.08, 0.2, 0, TWO_PI);
        ctx.fill();
        ctx.restore();
      }

      const collisionY = height * shell.collisionBand;
      const burstRadius = shellRadius * (1.8 + state.burstProgress * (2.4 + toppingSpread * 1.8));
      const messAlpha = clamp((1 - state.collisionProgress) * 0.1 + state.burstProgress * 0.52, 0, 0.8);
      ctx.fillStyle = `hsla(${(hue + 16) % 360}, 100%, 76%, ${messAlpha * 0.24})`;
      ctx.beginPath();
      ctx.arc(state.x, collisionY, burstRadius * 0.5, 0, TWO_PI);
      ctx.fill();

      const toppingCount = Math.round(10 + burst * 12 + toppingSpread * 10 + energy * 4);
      for (let toppingIndex = 0; toppingIndex < toppingCount; toppingIndex += 1) {
        const toppingSeed = seed * 80 + index * 31 + toppingIndex * 5.3;
        const angle = (toppingIndex / toppingCount) * TWO_PI + tacoHash01(toppingSeed + 0.4) * 0.6;
        const radius = burstRadius * (0.2 + tacoHash01(toppingSeed + 1.6) * state.burstProgress);
        const tx = state.x + Math.cos(angle) * radius;
        const ty = collisionY + Math.sin(angle) * radius * 0.8 + state.burstProgress * height * 0.06;
        const rx = shellRadius * (0.12 + tacoHash01(toppingSeed + 2.1) * 0.28);
        const ry = shellRadius * (0.08 + tacoHash01(toppingSeed + 3.2) * 0.22);
        const rotation = angle + tacoHash01(toppingSeed + 4.4) * 1.8;
        const alpha = clamp(state.burstProgress * 0.44, 0, 0.44);
        const paletteIndex = toppingIndex % 3;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(rotation);
        ctx.fillStyle = paletteIndex === 0
          ? `hsla(108, 72%, ${56 + tacoHash01(toppingSeed + 5.3) * 12}%, ${alpha})`
          : paletteIndex === 1
            ? `hsla(142, 80%, ${58 + tacoHash01(toppingSeed + 6.4) * 10}%, ${alpha})`
            : `hsla(7, 92%, ${54 + tacoHash01(toppingSeed + 7.5) * 10}%, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, TWO_PI);
        ctx.fill();
        ctx.restore();
      }
    });

    const forceFieldY = height * 0.64;
    const forceField = ctx.createLinearGradient(0, forceFieldY - height * 0.08, 0, forceFieldY + height * 0.08);
    forceField.addColorStop(0, "rgba(255,255,255,0)");
    forceField.addColorStop(0.5, `hsla(${(baseHue + 150) % 360}, 100%, 74%, ${0.08 + energy * 0.08})`);
    forceField.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = forceField;
    ctx.fillRect(0, forceFieldY - height * 0.08, width, height * 0.16);

    const vignette = ctx.createRadialGradient(width * 0.5, height * 0.5, Math.min(width, height) * 0.12, width * 0.5, height * 0.5, Math.max(width, height) * 0.78);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(4, 0, 10, 0.42)");
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";
  }
}
