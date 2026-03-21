import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

/**
 * Velvet dreamscape paints layered silk ribbons, luminous glass blooms, and soft gallery-grade grain for an overtly artistic AI-showcase moment.
 */
export const VELVET_DREAMSCAPE_DEFAULTS = {
  bloom: 0.78,
  flow: 0.62,
  ribbonCount: 11,
  grain: 0.32,
  hueDrift: 0.08,
  focus: 0.58,
  audioReact: 0.68,
  seed: 5
} as const;

type VelvetRibbon = {
  lane: number;
  amplitude: number;
  thickness: number;
  drift: number;
  curve: number;
  hueOffset: number;
  alpha: number;
  widthBias: number;
};

type VelvetBloom = {
  orbit: number;
  radius: number;
  xBias: number;
  yBias: number;
  hueOffset: number;
  alpha: number;
};

type VelvetAnchor = {
  x: number;
  y: number;
  radius: number;
  driftX: number;
  driftY: number;
};

const TWO_PI = Math.PI * 2;

const resolveNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const velvetDreamscapeHash = (value: number): number => {
  const hashed = Math.sin(value * 127.1 + 19.19) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

export const buildVelvetDreamscapeRibbons = (seed: number, ribbonCount: number): VelvetRibbon[] => {
  const count = Math.max(4, Math.round(ribbonCount));
  return Array.from({ length: count }, (_, index) => {
    const t = seed * 17.37 + index * 8.19;
    return {
      lane: lerp(-0.44, 0.44, velvetDreamscapeHash(t + 0.2)),
      amplitude: lerp(0.08, 0.26, velvetDreamscapeHash(t + 1.4)),
      thickness: lerp(18, 54, velvetDreamscapeHash(t + 2.1)),
      drift: lerp(0.45, 1.55, velvetDreamscapeHash(t + 3.3)),
      curve: lerp(-0.48, 0.48, velvetDreamscapeHash(t + 4.5)),
      hueOffset: lerp(-70, 90, velvetDreamscapeHash(t + 5.7)),
      alpha: lerp(0.16, 0.42, velvetDreamscapeHash(t + 6.4)),
      widthBias: lerp(0.7, 1.3, velvetDreamscapeHash(t + 7.1))
    };
  });
};

export const buildVelvetDreamscapeBlooms = (seed: number): VelvetBloom[] =>
  Array.from({ length: 7 }, (_, index) => {
    const t = seed * 21.73 + index * 12.41;
    return {
      orbit: lerp(0.18, 0.88, velvetDreamscapeHash(t + 0.8)),
      radius: lerp(0.1, 0.28, velvetDreamscapeHash(t + 1.9)),
      xBias: lerp(-0.34, 0.34, velvetDreamscapeHash(t + 3.1)),
      yBias: lerp(-0.22, 0.22, velvetDreamscapeHash(t + 4.2)),
      hueOffset: lerp(-48, 72, velvetDreamscapeHash(t + 5.4)),
      alpha: lerp(0.12, 0.3, velvetDreamscapeHash(t + 6.6))
    };
  });

export const computeVelvetDreamscapeAnchor = ({
  width,
  height,
  time,
  flow,
  focus,
  energy
}: {
  width: number;
  height: number;
  time: number;
  flow: number;
  focus: number;
  energy: number;
}): VelvetAnchor => {
  const driftX = Math.sin(time * (0.21 + flow * 0.16)) * width * (0.05 + focus * 0.04);
  const driftY = Math.cos(time * (0.17 + flow * 0.09)) * height * (0.05 + energy * 0.04);
  return {
    x: width * (0.5 + Math.sin(time * 0.09) * 0.03) + driftX,
    y: height * (0.48 + Math.cos(time * 0.07) * 0.04) + driftY * 0.4,
    radius: Math.min(width, height) * (0.16 + focus * 0.12 + energy * 0.08),
    driftX,
    driftY
  };
};

export class VelvetDreamscapeEffect implements Effect {
  private cachedSeed = Number.NaN;
  private cachedRibbonCount = -1;
  private cachedRibbons: VelvetRibbon[] = [];
  private cachedBlooms: VelvetBloom[] = [];

  reset(): void {
    this.cachedSeed = Number.NaN;
    this.cachedRibbonCount = -1;
    this.cachedRibbons = [];
    this.cachedBlooms = [];
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const bloom = clamp(resolveNumber(rawParams.bloom, VELVET_DREAMSCAPE_DEFAULTS.bloom), 0, 1.6);
    const flow = clamp(resolveNumber(rawParams.flow, VELVET_DREAMSCAPE_DEFAULTS.flow), 0, 1.8);
    const ribbonCount = clamp(resolveNumber(rawParams.ribbonCount, VELVET_DREAMSCAPE_DEFAULTS.ribbonCount), 4, 24);
    const grain = clamp(resolveNumber(rawParams.grain, VELVET_DREAMSCAPE_DEFAULTS.grain), 0, 1);
    const hueDrift = clamp(resolveNumber(rawParams.hueDrift, VELVET_DREAMSCAPE_DEFAULTS.hueDrift), -1, 1);
    const focus = clamp(resolveNumber(rawParams.focus, VELVET_DREAMSCAPE_DEFAULTS.focus), 0, 1.2);
    const audioReact = clamp(resolveNumber(rawParams.audioReact, VELVET_DREAMSCAPE_DEFAULTS.audioReact), 0, 1);
    const seed = Math.round(resolveNumber(rawParams.seed, VELVET_DREAMSCAPE_DEFAULTS.seed));

    if (seed !== this.cachedSeed || Math.round(ribbonCount) !== this.cachedRibbonCount) {
      this.cachedRibbons = buildVelvetDreamscapeRibbons(seed, ribbonCount);
      this.cachedBlooms = buildVelvetDreamscapeBlooms(seed);
      this.cachedSeed = seed;
      this.cachedRibbonCount = Math.round(ribbonCount);
    }

    const beatPulse = audio.beat ? audio.beatStrength : 0;
    const audioEnergy = audio.rms * 0.4 + audio.mid * 0.28 + audio.treble * 0.22 + beatPulse * 0.8;
    const energy = clamp((1 - audioReact) * 0.38 + audioEnergy * audioReact, 0, 1.5);
    const anchor = computeVelvetDreamscapeAnchor({ width, height, time, flow, focus, energy });
    const baseHue = (248 + hueDrift * 120 + time * (5 + flow * 4) + audio.treble * 48) % 360;

    const backdrop = ctx.createLinearGradient(0, 0, width, height);
    backdrop.addColorStop(0, `hsl(${(baseHue + 18) % 360} 40% 10%)`);
    backdrop.addColorStop(0.52, `hsl(${(baseHue + 66) % 360} 32% 5%)`);
    backdrop.addColorStop(1, `hsl(${(baseHue + 122) % 360} 48% 4%)`);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, width, height);

    const haze = ctx.createRadialGradient(anchor.x, anchor.y, 0, anchor.x, anchor.y, anchor.radius * (3 + bloom));
    haze.addColorStop(0, `hsla(${(baseHue + 24) % 360}, 95%, 78%, ${0.12 + bloom * 0.14 + energy * 0.1})`);
    haze.addColorStop(0.45, `hsla(${(baseHue + 72) % 360}, 88%, 58%, ${0.08 + bloom * 0.1})`);
    haze.addColorStop(1, "hsla(280, 70%, 12%, 0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "screen";
    this.cachedBlooms.forEach((bloomOrb, index) => {
      const phase = time * (0.18 + flow * 0.22) * (0.8 + bloomOrb.orbit) + index * 0.9;
      const orbitRadius = anchor.radius * (0.6 + bloomOrb.orbit * 1.8);
      const x = anchor.x + Math.cos(phase) * orbitRadius + bloomOrb.xBias * width;
      const y = anchor.y + Math.sin(phase * 1.12) * orbitRadius * 0.42 + bloomOrb.yBias * height;
      const radius = Math.min(width, height) * bloomOrb.radius * (1 + bloom * 0.22 + energy * 0.18);
      const hue = (baseHue + bloomOrb.hueOffset + Math.sin(phase) * 12) % 360;
      const orb = ctx.createRadialGradient(x, y, radius * 0.12, x, y, radius);
      orb.addColorStop(0, `hsla(${hue}, 100%, 86%, ${bloomOrb.alpha + bloom * 0.12})`);
      orb.addColorStop(0.55, `hsla(${(hue + 36) % 360}, 92%, 62%, ${bloomOrb.alpha * 0.62})`);
      orb.addColorStop(1, `hsla(${(hue + 88) % 360}, 88%, 42%, 0)`);
      ctx.fillStyle = orb;
      ctx.beginPath();
      ctx.ellipse(x, y, radius, radius * (0.65 + bloomOrb.orbit * 0.25), phase * 0.35, 0, TWO_PI);
      ctx.fill();
    });

    this.cachedRibbons.forEach((ribbon, index) => {
      const phase = time * (0.28 + flow * 0.34) * ribbon.drift + index * 0.63;
      const startX = -width * 0.08;
      const startY = height * (0.16 + (ribbon.lane + 0.5) * 0.72) + Math.sin(phase) * height * 0.04;
      const endX = width * 1.08;
      const endY = height * (0.18 + (0.5 - ribbon.lane) * 0.7) + Math.cos(phase * 0.9) * height * 0.06;
      const cp1X = width * (0.22 + ribbon.widthBias * 0.08) + anchor.driftX * 0.45;
      const cp1Y = anchor.y + ribbon.curve * height * 0.42 + Math.sin(phase * 1.4) * height * ribbon.amplitude;
      const cp2X = width * (0.72 - ribbon.widthBias * 0.04) - anchor.driftX * 0.28;
      const cp2Y = anchor.y - ribbon.curve * height * 0.36 - Math.cos(phase * 1.2) * height * ribbon.amplitude;
      const hue = (baseHue + ribbon.hueOffset + Math.cos(phase) * 16) % 360;
      const stroke = ctx.createLinearGradient(startX, startY, endX, endY);
      stroke.addColorStop(0, `hsla(${(hue + 18) % 360}, 100%, 74%, 0)`);
      stroke.addColorStop(0.18, `hsla(${(hue + 6) % 360}, 100%, 80%, ${ribbon.alpha * (0.6 + bloom * 0.22)})`);
      stroke.addColorStop(0.52, `hsla(${(hue + 42) % 360}, 92%, 60%, ${ribbon.alpha * (0.95 + energy * 0.22)})`);
      stroke.addColorStop(1, `hsla(${(hue + 96) % 360}, 88%, 46%, 0)`);

      ctx.strokeStyle = stroke;
      ctx.lineWidth = ribbon.thickness * (1 + bloom * 0.35 + energy * 0.16);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
      ctx.stroke();

      ctx.strokeStyle = `hsla(${(hue + 10) % 360}, 100%, 90%, ${0.03 + bloom * 0.05})`;
      ctx.lineWidth = Math.max(1.4, ctx.lineWidth * 0.16);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
      ctx.stroke();
    });

    ctx.globalCompositeOperation = "lighter";
    const sparkCount = Math.round(18 + grain * 34 + energy * 16);
    for (let i = 0; i < sparkCount; i += 1) {
      const t = seed * 13.2 + i * 2.41;
      const drift = time * (0.05 + velvetDreamscapeHash(t + 2.2) * (0.14 + flow * 0.12));
      const x = (velvetDreamscapeHash(t + 0.3) * width + drift * width * 0.09 + width) % width;
      const y = (velvetDreamscapeHash(t + 1.3) * height + drift * height * 0.05 + height) % height;
      const radius = 0.6 + velvetDreamscapeHash(t + 4.6) * (1.4 + bloom * 1.8);
      const hue = (baseHue + velvetDreamscapeHash(t + 6.1) * 140) % 360;
      ctx.fillStyle = `hsla(${hue}, 100%, ${74 + velvetDreamscapeHash(t + 7.4) * 16}%, ${0.08 + velvetDreamscapeHash(t + 8.3) * 0.22})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TWO_PI);
      ctx.fill();
    }

    if (grain > 0) {
      ctx.globalCompositeOperation = "overlay";
      const grainDots = Math.round(30 + grain * 90);
      for (let i = 0; i < grainDots; i += 1) {
        const t = seed * 3.8 + i * 5.77 + Math.floor(time * 18);
        const x = velvetDreamscapeHash(t + 0.4) * width;
        const y = velvetDreamscapeHash(t + 1.7) * height;
        const size = 0.4 + velvetDreamscapeHash(t + 2.8) * 1.6;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.018 + grain * 0.028})`;
        ctx.fillRect(x, y, size, size);
      }
    }

    const vignette = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      Math.min(width, height) * 0.16,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.72
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, `rgba(6, 2, 14, ${0.22 + bloom * 0.18 + grain * 0.12})`);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "source-over";
  }
}
