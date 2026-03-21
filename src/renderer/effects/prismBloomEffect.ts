import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

/**
 * Painterly prism bloom made of translucent petals, spectral glows, and drifting dust for a tasteful AI-art showcase moment.
 */
export const PRISM_BLOOM_DEFAULTS = {
  bloom: 0.82,
  flow: 0.58,
  petalCount: 18,
  smear: 0.44,
  prismShift: 0.18,
  vignette: 0.52,
  audioReact: 0.72,
  seed: 3
} as const;

type PrismBloomPetal = {
  angle: number;
  radius: number;
  lift: number;
  width: number;
  orbit: number;
  hueOffset: number;
  alpha: number;
};

type PrismBloomFocus = {
  x: number;
  y: number;
  radius: number;
  driftX: number;
  driftY: number;
};

const TWO_PI = Math.PI * 2;

const resolveNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const prismBloomHash = (value: number): number => {
  const hashed = Math.sin(value * 91.371 + 12.793) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

export const buildPrismBloomPetals = (seed: number, petalCount: number): PrismBloomPetal[] => {
  const count = Math.max(6, Math.round(petalCount));
  return Array.from({ length: count }, (_, index) => {
    const t = seed * 37.1 + index * 11.73;
    return {
      angle: prismBloomHash(t + 0.4) * TWO_PI,
      radius: lerp(0.18, 0.52, prismBloomHash(t + 1.7)),
      lift: lerp(-0.28, 0.32, prismBloomHash(t + 2.6)),
      width: lerp(0.08, 0.2, prismBloomHash(t + 3.9)),
      orbit: lerp(0.65, 1.45, prismBloomHash(t + 4.8)),
      hueOffset: lerp(-46, 54, prismBloomHash(t + 6.1)),
      alpha: lerp(0.22, 0.54, prismBloomHash(t + 7.4))
    };
  });
};

export const computePrismBloomFocus = ({
  width,
  height,
  time,
  flow,
  energy
}: {
  width: number;
  height: number;
  time: number;
  flow: number;
  energy: number;
}): PrismBloomFocus => {
  const driftX = Math.sin(time * (0.23 + flow * 0.12)) * width * (0.06 + flow * 0.05);
  const driftY = Math.cos(time * (0.19 + flow * 0.08)) * height * (0.05 + energy * 0.03);
  return {
    x: width * 0.5 + driftX,
    y: height * (0.52 + Math.sin(time * 0.11) * 0.03) + driftY * 0.35,
    radius: Math.min(width, height) * (0.18 + energy * 0.08 + flow * 0.05),
    driftX,
    driftY
  };
};

export class PrismBloomEffect implements Effect {
  private cachedSeed = Number.NaN;
  private cachedPetalCount = -1;
  private cachedPetals: PrismBloomPetal[] = [];

  reset(): void {
    this.cachedSeed = Number.NaN;
    this.cachedPetalCount = -1;
    this.cachedPetals = [];
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const bloom = clamp(resolveNumber(rawParams.bloom, PRISM_BLOOM_DEFAULTS.bloom), 0, 1.4);
    const flow = clamp(resolveNumber(rawParams.flow, PRISM_BLOOM_DEFAULTS.flow), 0, 1.5);
    const petalCount = clamp(resolveNumber(rawParams.petalCount, PRISM_BLOOM_DEFAULTS.petalCount), 6, 36);
    const smear = clamp(resolveNumber(rawParams.smear, PRISM_BLOOM_DEFAULTS.smear), 0, 1.1);
    const prismShift = clamp(resolveNumber(rawParams.prismShift, PRISM_BLOOM_DEFAULTS.prismShift), -1, 1);
    const vignette = clamp(resolveNumber(rawParams.vignette, PRISM_BLOOM_DEFAULTS.vignette), 0, 1);
    const audioReact = clamp(resolveNumber(rawParams.audioReact, PRISM_BLOOM_DEFAULTS.audioReact), 0, 1);
    const seed = Math.round(resolveNumber(rawParams.seed, PRISM_BLOOM_DEFAULTS.seed));

    if (seed !== this.cachedSeed || Math.round(petalCount) !== this.cachedPetalCount) {
      this.cachedPetals = buildPrismBloomPetals(seed, petalCount);
      this.cachedSeed = seed;
      this.cachedPetalCount = Math.round(petalCount);
    }

    const beatPulse = audio.beat ? audio.beatStrength : 0;
    const audioEnergy = audio.rms * 0.45 + audio.mid * 0.3 + audio.treble * 0.2 + beatPulse * 0.75;
    const energy = clamp((1 - audioReact) * 0.4 + audioEnergy * audioReact, 0, 1.4);
    const focus = computePrismBloomFocus({ width, height, time, flow, energy });
    const baseHue = (220 + prismShift * 110 + time * (4 + flow * 5) + audio.treble * 65) % 360;

    const backdrop = ctx.createLinearGradient(0, 0, 0, height);
    backdrop.addColorStop(0, `hsl(${(baseHue + 26) % 360} 52% 8%)`);
    backdrop.addColorStop(0.45, `hsl(${(baseHue + 74) % 360} 46% 5%)`);
    backdrop.addColorStop(1, `hsl(${(baseHue + 130) % 360} 58% 3%)`);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, width, height);

    const aura = ctx.createRadialGradient(focus.x, focus.y, 0, focus.x, focus.y, focus.radius * (2.6 + bloom));
    aura.addColorStop(0, `hsla(${(baseHue + 18) % 360}, 100%, 78%, ${0.22 + bloom * 0.2 + energy * 0.1})`);
    aura.addColorStop(0.38, `hsla(${(baseHue + 54) % 360}, 96%, 60%, ${0.12 + bloom * 0.12})`);
    aura.addColorStop(1, "hsla(285, 90%, 18%, 0)");
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "screen";
    this.cachedPetals.forEach((petal, index) => {
      const phase = time * (0.22 + flow * 0.32) * petal.orbit + index * 0.41;
      const localAngle = petal.angle + Math.sin(phase) * (0.28 + smear * 0.45);
      const orbitRadius = Math.min(width, height) * (petal.radius + Math.sin(phase * 0.7) * 0.03);
      const x = focus.x + Math.cos(localAngle) * orbitRadius + Math.sin(phase * 1.4) * width * 0.03;
      const y = focus.y + Math.sin(localAngle) * orbitRadius * (0.75 + petal.width) + petal.lift * height * 0.2;
      const petalW = orbitRadius * (0.34 + petal.width * 1.4);
      const petalH = orbitRadius * (0.12 + petal.width * 0.75) * (1 + bloom * 0.35 + energy * 0.25);
      const hue = (baseHue + petal.hueOffset + Math.sin(phase) * 18) % 360;
      const alpha = petal.alpha * (0.7 + bloom * 0.55 + energy * 0.15);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(localAngle + Math.sin(phase * 0.9) * 0.22);
      ctx.scale(1 + smear * 0.2, 1 + bloom * 0.08);

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, petalW);
      gradient.addColorStop(0, `hsla(${(hue + 16) % 360}, 100%, 84%, ${alpha})`);
      gradient.addColorStop(0.4, `hsla(${(hue + 48) % 360}, 92%, 66%, ${alpha * 0.78})`);
      gradient.addColorStop(1, `hsla(${(hue + 102) % 360}, 98%, 44%, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, petalW, petalH, 0, 0, TWO_PI);
      ctx.fill();

      ctx.strokeStyle = `hsla(${(hue + 10) % 360}, 100%, 88%, ${0.08 + bloom * 0.08})`;
      ctx.lineWidth = 0.6 + bloom * 1.1;
      ctx.beginPath();
      ctx.moveTo(-petalW * 0.85, 0);
      ctx.bezierCurveTo(-petalW * 0.18, -petalH * 0.85, petalW * 0.18, petalH * 0.85, petalW * 0.85, 0);
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = `hsla(${(hue + 70) % 360}, 96%, 74%, ${0.035 + smear * 0.08})`;
      ctx.lineWidth = 0.4 + smear * 1.2;
      ctx.beginPath();
      ctx.moveTo(focus.x, focus.y);
      ctx.quadraticCurveTo(
        focus.x + (x - focus.x) * 0.5 + focus.driftX * 0.18,
        focus.y + (y - focus.y) * 0.35 - focus.driftY * 0.25,
        x,
        y
      );
      ctx.stroke();
    });

    const dustCount = Math.round(32 + bloom * 36 + energy * 18);
    for (let i = 0; i < dustCount; i += 1) {
      const t = seed * 19.7 + i * 4.21;
      const drift = time * (0.08 + prismBloomHash(t + 2.4) * (0.16 + flow * 0.12));
      const x = (prismBloomHash(t + 0.5) * width + drift * width * 0.07 + focus.driftX * 0.1) % width;
      const y = (prismBloomHash(t + 1.5) * height + drift * height * 0.04 + focus.driftY * 0.08 + height) % height;
      const radius = 0.4 + prismBloomHash(t + 3.5) * (1.6 + bloom * 2.2);
      const hue = (baseHue + prismBloomHash(t + 4.5) * 120) % 360;
      ctx.fillStyle = `hsla(${hue}, 100%, ${72 + prismBloomHash(t + 5.5) * 18}%, ${0.08 + prismBloomHash(t + 6.5) * 0.22})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TWO_PI);
      ctx.fill();
    }

    if (vignette > 0) {
      const edge = ctx.createRadialGradient(width * 0.5, height * 0.5, Math.min(width, height) * 0.18, width * 0.5, height * 0.5, Math.max(width, height) * 0.72);
      edge.addColorStop(0, "rgba(0, 0, 0, 0)");
      edge.addColorStop(1, `rgba(2, 0, 8, ${0.26 + vignette * 0.42})`);
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = edge;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.globalCompositeOperation = "source-over";
  }
}
