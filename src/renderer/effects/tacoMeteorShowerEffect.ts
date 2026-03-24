import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

/**
 * Taco meteor shower rains glowing shells that corkscrew through a cosmic haze, then burst into avocado, cilantro, and salsa confetti on impact.
 */
export const TACO_METEOR_SHOWER_DEFAULTS = {
  shellCount: 16,
  swirl: 0.68,
  trail: 0.72,
  toppingBurst: 0.74,
  salsaChaos: 0.58,
  audioReact: 0.7,
  colorHeat: 0.36,
  seed: 7
} as const;

type TacoMeteorDescriptor = {
  lane: number;
  offset: number;
  speed: number;
  size: number;
  rotation: number;
  wobble: number;
  hueShift: number;
  burstBias: number;
};

export type TacoMeteorState = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  rotation: number;
  shellWidth: number;
  shellHeight: number;
  trailLength: number;
  launchProgress: number;
  impactProgress: number;
  impactX: number;
  impactY: number;
};

type TacoPalette = {
  shell: string;
  shellEdge: string;
  shellGlow: string;
  avocado: string;
  cilantro: string;
  salsa: string;
  stardust: string;
};

const TWO_PI = Math.PI * 2;
const IMPACT_START = 0.72;

const resolveNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const tacoMeteorHash = (value: number): number => {
  const hashed = Math.sin(value * 91.231 + 17.17) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

export const buildTacoPalette = (baseHue: number, colorHeat: number): TacoPalette => ({
  shell: `hsla(${(34 + baseHue * 0.15) % 360}, ${78 + colorHeat * 10}%, ${58 + colorHeat * 8}%, 0.95)`,
  shellEdge: `hsla(${(18 + baseHue * 0.12) % 360}, 92%, ${36 + colorHeat * 8}%, 0.9)`,
  shellGlow: `hsla(${(44 + baseHue * 0.22) % 360}, 100%, 72%, ${0.3 + colorHeat * 0.2})`,
  avocado: `hsla(${(118 + baseHue * 0.08) % 360}, 72%, 66%, 0.92)`,
  cilantro: `hsla(${(142 + baseHue * 0.1) % 360}, 82%, 54%, 0.88)`,
  salsa: `hsla(${(8 + baseHue * 0.18) % 360}, 96%, 58%, 0.9)`,
  stardust: `hsla(${(56 + baseHue * 0.2) % 360}, 100%, 82%, 0.78)`
});

export const buildTacoMeteors = (seed: number, shellCount: number): TacoMeteorDescriptor[] => {
  const count = Math.max(6, Math.round(shellCount));
  return Array.from({ length: count }, (_, index) => {
    const t = seed * 13.37 + index * 9.17;
    return {
      lane: lerp(0.08, 0.92, tacoMeteorHash(t + 0.4)),
      offset: tacoMeteorHash(t + 1.1),
      speed: lerp(0.2, 0.52, tacoMeteorHash(t + 2.2)),
      size: lerp(0.72, 1.28, tacoMeteorHash(t + 3.3)),
      rotation: lerp(-1.1, 1.1, tacoMeteorHash(t + 4.4)),
      wobble: lerp(0.45, 1.4, tacoMeteorHash(t + 5.5)),
      hueShift: lerp(-28, 32, tacoMeteorHash(t + 6.6)),
      burstBias: lerp(0.75, 1.3, tacoMeteorHash(t + 7.7))
    };
  });
};

export const computeTacoMeteorState = ({
  width,
  height,
  time,
  descriptor,
  swirl,
  trail,
  energy
}: {
  width: number;
  height: number;
  time: number;
  descriptor: TacoMeteorDescriptor;
  swirl: number;
  trail: number;
  energy: number;
}): TacoMeteorState => {
  const cycle = (time * descriptor.speed + descriptor.offset) % 1;
  const launchProgress = clamp(cycle / IMPACT_START, 0, 1);
  const impactProgress = clamp((cycle - IMPACT_START) / (1 - IMPACT_START), 0, 1);
  const impactX = width * descriptor.lane;
  const impactY = height * (0.74 + descriptor.burstBias * 0.06);
  const pathBend = Math.sin(cycle * TWO_PI * descriptor.wobble + descriptor.rotation * 2.4) * width * (0.04 + swirl * 0.08);
  const audioDrift = Math.cos(time * (0.8 + descriptor.wobble * 0.2) + descriptor.offset * 6) * width * energy * 0.015;
  const x = impactX + pathBend * (1 - impactProgress * 0.55) + audioDrift;
  const y = lerp(-height * (0.18 + descriptor.size * 0.08), impactY, Math.pow(launchProgress, 0.78));
  const prevCycle = (time * descriptor.speed + descriptor.offset - 0.028) % 1;
  const normalizedPrevCycle = prevCycle < 0 ? prevCycle + 1 : prevCycle;
  const prevLaunchProgress = clamp(normalizedPrevCycle / IMPACT_START, 0, 1);
  const prevImpactProgress = clamp((normalizedPrevCycle - IMPACT_START) / (1 - IMPACT_START), 0, 1);
  const prevBend = Math.sin(normalizedPrevCycle * TWO_PI * descriptor.wobble + descriptor.rotation * 2.4) * width * (0.04 + swirl * 0.08);
  const prevAudioDrift = Math.cos((time - 0.028) * (0.8 + descriptor.wobble * 0.2) + descriptor.offset * 6) * width * energy * 0.015;
  const prevX = impactX + prevBend * (1 - prevImpactProgress * 0.55) + prevAudioDrift;
  const prevY = lerp(-height * (0.18 + descriptor.size * 0.08), impactY, Math.pow(prevLaunchProgress, 0.78));

  return {
    x,
    y,
    prevX,
    prevY,
    rotation: descriptor.rotation + time * (0.8 + descriptor.wobble * 0.4) + launchProgress * 3.2,
    shellWidth: Math.min(width, height) * (0.045 + descriptor.size * 0.02 + energy * 0.008),
    shellHeight: Math.min(width, height) * (0.03 + descriptor.size * 0.012),
    trailLength: Math.min(width, height) * (0.05 + trail * 0.05 + descriptor.size * 0.015),
    launchProgress,
    impactProgress,
    impactX,
    impactY
  };
};

export class TacoMeteorShowerEffect implements Effect {
  private cachedSeed = Number.NaN;
  private cachedShellCount = -1;
  private cachedMeteors: TacoMeteorDescriptor[] = [];

  reset(): void {
    this.cachedSeed = Number.NaN;
    this.cachedShellCount = -1;
    this.cachedMeteors = [];
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const shellCount = clamp(resolveNumber(rawParams.shellCount, TACO_METEOR_SHOWER_DEFAULTS.shellCount), 6, 32);
    const swirl = clamp(resolveNumber(rawParams.swirl, TACO_METEOR_SHOWER_DEFAULTS.swirl), 0, 1.5);
    const trail = clamp(resolveNumber(rawParams.trail, TACO_METEOR_SHOWER_DEFAULTS.trail), 0, 1);
    const toppingBurst = clamp(resolveNumber(rawParams.toppingBurst, TACO_METEOR_SHOWER_DEFAULTS.toppingBurst), 0, 1.4);
    const salsaChaos = clamp(resolveNumber(rawParams.salsaChaos, TACO_METEOR_SHOWER_DEFAULTS.salsaChaos), 0, 1.3);
    const audioReact = clamp(resolveNumber(rawParams.audioReact, TACO_METEOR_SHOWER_DEFAULTS.audioReact), 0, 1);
    const colorHeat = clamp(resolveNumber(rawParams.colorHeat, TACO_METEOR_SHOWER_DEFAULTS.colorHeat), 0, 1);
    const seed = Math.round(resolveNumber(rawParams.seed, TACO_METEOR_SHOWER_DEFAULTS.seed));

    if (seed !== this.cachedSeed || Math.round(shellCount) !== this.cachedShellCount) {
      this.cachedMeteors = buildTacoMeteors(seed, shellCount);
      this.cachedSeed = seed;
      this.cachedShellCount = Math.round(shellCount);
    }

    const beatPulse = audio.beat ? 0.5 + audio.beatStrength * 0.9 : 0;
    const audioEnergy = audio.rms * 0.42 + audio.bass * 0.32 + audio.treble * 0.18 + beatPulse * 0.45;
    const energy = clamp((1 - audioReact) * 0.35 + audioEnergy * audioReact, 0, 1.5);
    const palette = buildTacoPalette((time * 18 + energy * 40) % 360, colorHeat);

    const backdrop = ctx.createLinearGradient(0, 0, width, height);
    backdrop.addColorStop(0, "hsl(238 48% 8%)");
    backdrop.addColorStop(0.45, "hsl(284 36% 7%)");
    backdrop.addColorStop(1, "hsl(328 42% 10%)");
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, width, height);

    const haze = ctx.createRadialGradient(width * 0.5, height * 0.42, 0, width * 0.5, height * 0.42, Math.max(width, height) * 0.75);
    haze.addColorStop(0, `hsla(${(292 + time * 6) % 360}, 85%, 58%, ${0.08 + energy * 0.06})`);
    haze.addColorStop(0.5, `hsla(${(220 + time * 4) % 360}, 95%, 28%, ${0.06 + trail * 0.05})`);
    haze.addColorStop(1, "rgba(4, 0, 12, 0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "lighter";
    const dustCount = Math.round(24 + trail * 34 + energy * 12);
    for (let i = 0; i < dustCount; i += 1) {
      const t = seed * 7.3 + i * 3.21 + Math.floor(time * 12);
      const x = (tacoMeteorHash(t + 0.4) * width + time * width * (0.008 + trail * 0.012) + width) % width;
      const y = (tacoMeteorHash(t + 1.7) * height + Math.sin(time * 0.6 + i) * height * 0.03 + height) % height;
      const radius = 0.7 + tacoMeteorHash(t + 2.9) * (1.4 + trail * 1.8);
      ctx.fillStyle = palette.stardust;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TWO_PI);
      ctx.fill();
    }

    this.cachedMeteors.forEach((meteor, index) => {
      const state = computeTacoMeteorState({ width, height, time, descriptor: meteor, swirl, trail, energy });
      const meteorPalette = buildTacoPalette((index * 18 + meteor.hueShift + time * 14) % 360, colorHeat);
      const dx = state.x - state.prevX;
      const dy = state.y - state.prevY;
      const length = Math.hypot(dx, dy) || 1;
      const trailStartX = state.x - (dx / length) * state.trailLength;
      const trailStartY = state.y - (dy / length) * state.trailLength;

      const trailGradient = ctx.createLinearGradient(trailStartX, trailStartY, state.x, state.y);
      trailGradient.addColorStop(0, "rgba(255, 210, 140, 0)");
      trailGradient.addColorStop(0.35, `hsla(${(42 + meteor.hueShift) % 360}, 100%, 62%, ${0.16 + trail * 0.26})`);
      trailGradient.addColorStop(1, meteorPalette.shellGlow);
      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = 1.2 + trail * 1.8 + energy * 0.6;
      ctx.beginPath();
      ctx.moveTo(trailStartX, trailStartY);
      ctx.lineTo(state.x, state.y);
      ctx.stroke();

      const sparkleCount = Math.round(4 + trail * 5 + energy * 3);
      for (let sparkleIndex = 0; sparkleIndex < sparkleCount; sparkleIndex += 1) {
        const sparkleSeed = seed * 4.9 + index * 11.1 + sparkleIndex * 2.8 + Math.floor(time * 24);
        const sparkleT = tacoMeteorHash(sparkleSeed + 0.3);
        const sparkleX = lerp(state.x, trailStartX, sparkleT) + (tacoMeteorHash(sparkleSeed + 1.4) - 0.5) * state.shellWidth * 0.3;
        const sparkleY = lerp(state.y, trailStartY, sparkleT) + (tacoMeteorHash(sparkleSeed + 2.6) - 0.5) * state.shellHeight * 0.26;
        const sparkleRadius = 0.5 + (1 - sparkleT) * 1.2;
        ctx.fillStyle = meteorPalette.stardust;
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, sparkleRadius, 0, TWO_PI);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(state.x, state.y);
      ctx.rotate(state.rotation);

      const shellGlow = ctx.createRadialGradient(0, 0, state.shellWidth * 0.2, 0, 0, state.shellWidth * 1.6);
      shellGlow.addColorStop(0, `hsla(${(44 + meteor.hueShift) % 360}, 100%, 80%, ${0.18 + energy * 0.08})`);
      shellGlow.addColorStop(1, "rgba(255, 180, 40, 0)");
      ctx.fillStyle = shellGlow;
      ctx.beginPath();
      ctx.ellipse(0, 0, state.shellWidth * 1.1, state.shellHeight * 1.3, 0, 0, TWO_PI);
      ctx.fill();

      ctx.fillStyle = meteorPalette.shell;
      ctx.strokeStyle = meteorPalette.shellEdge;
      ctx.lineWidth = Math.max(1.2, state.shellWidth * 0.08);
      ctx.beginPath();
      ctx.moveTo(-state.shellWidth, state.shellHeight * 0.1);
      ctx.quadraticCurveTo(0, -state.shellHeight * 1.2, state.shellWidth, state.shellHeight * 0.05);
      ctx.quadraticCurveTo(0, state.shellHeight * 1.45, -state.shellWidth, state.shellHeight * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = `hsla(${(26 + meteor.hueShift) % 360}, 100%, 82%, ${0.26 + energy * 0.08})`;
      ctx.lineWidth = Math.max(0.8, state.shellWidth * 0.04);
      ctx.beginPath();
      ctx.moveTo(-state.shellWidth * 0.7, state.shellHeight * 0.12);
      ctx.quadraticCurveTo(0, state.shellHeight * 0.66, state.shellWidth * 0.7, state.shellHeight * 0.12);
      ctx.stroke();
      ctx.restore();

      if (state.impactProgress <= 0) {
        return;
      }

      const burstFade = 1 - state.impactProgress;
      const burstRadius = Math.min(width, height) * (0.04 + toppingBurst * 0.08 + energy * 0.02) * Math.sqrt(state.impactProgress);
      const toppingCount = Math.round(12 + toppingBurst * 18 + energy * 10);
      for (let particleIndex = 0; particleIndex < toppingCount; particleIndex += 1) {
        const particleSeed = seed * 5.7 + index * 17.3 + particleIndex * 3.1;
        const angle = tacoMeteorHash(particleSeed + 0.4) * TWO_PI;
        const radial = burstRadius * (0.3 + tacoMeteorHash(particleSeed + 1.1) * meteor.burstBias);
        const chaos = salsaChaos * height * 0.05 * state.impactProgress;
        const px = state.impactX + Math.cos(angle) * radial;
        const py = state.impactY + Math.sin(angle) * radial * 0.55 + chaos * tacoMeteorHash(particleSeed + 2.7);
        const typeSelector = particleIndex % 3;

        if (typeSelector === 0) {
          ctx.fillStyle = meteorPalette.avocado;
          ctx.beginPath();
          ctx.ellipse(px, py, 3 + burstFade * 5, 2 + burstFade * 3.5, angle, 0, TWO_PI);
          ctx.fill();
          ctx.fillStyle = `rgba(84, 52, 22, ${0.2 + burstFade * 0.2})`;
          ctx.beginPath();
          ctx.arc(px + Math.cos(angle) * 0.8, py + Math.sin(angle) * 0.5, 0.8 + burstFade * 1.4, 0, TWO_PI);
          ctx.fill();
          return;
        }

        if (typeSelector === 1) {
          ctx.strokeStyle = meteorPalette.cilantro;
          ctx.lineWidth = 1 + burstFade * 0.6;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + Math.cos(angle) * (4 + burstFade * 7), py + Math.sin(angle) * (3 + burstFade * 6));
          ctx.moveTo(px, py);
          ctx.lineTo(px + Math.cos(angle + 0.8) * (2 + burstFade * 4), py + Math.sin(angle + 0.8) * (2 + burstFade * 4));
          ctx.stroke();
          return;
        }

        ctx.fillStyle = meteorPalette.salsa;
        ctx.beginPath();
        ctx.arc(px, py, 1.6 + burstFade * 2.6 + tacoMeteorHash(particleSeed + 4.8), 0, TWO_PI);
        ctx.fill();
      }

      ctx.strokeStyle = `hsla(${(32 + meteor.hueShift) % 360}, 100%, 74%, ${0.18 + burstFade * 0.26})`;
      ctx.lineWidth = 1.2;
      const shardCount = Math.round(3 + toppingBurst * 4);
      ctx.beginPath();
      for (let shardIndex = 0; shardIndex < shardCount; shardIndex += 1) {
        const shardSeed = seed * 2.1 + index * 19.1 + shardIndex * 5.6;
        const angle = tacoMeteorHash(shardSeed) * TWO_PI;
        const inner = burstRadius * 0.24;
        const outer = burstRadius * (0.5 + tacoMeteorHash(shardSeed + 1.1) * 0.4);
        ctx.moveTo(state.impactX + Math.cos(angle) * inner, state.impactY + Math.sin(angle) * inner);
        ctx.lineTo(state.impactX + Math.cos(angle) * outer, state.impactY + Math.sin(angle) * outer);
      }
      ctx.stroke();
    });

    const vignette = ctx.createRadialGradient(width * 0.5, height * 0.5, Math.min(width, height) * 0.12, width * 0.5, height * 0.5, Math.max(width, height) * 0.74);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, `rgba(12, 0, 18, ${0.3 + trail * 0.14})`);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";
  }
}
