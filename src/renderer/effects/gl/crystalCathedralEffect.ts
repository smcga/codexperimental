import { clamp } from "../../../util/math";
import { Effect, EffectRenderContext } from "../types";
import { CRYSTAL_CATHEDRAL_FRAGMENT_SHADER } from "./shaders/crystalCathedral";
import { WebGLEffectBase, WebGLUniformPayload } from "./webglEffectBase";

export const CRYSTAL_CATHEDRAL_DEFAULTS = {
  speed: 0.65,
  quality: 2,
  exposure: 1.15,
  hueShift: 0.08,
  crystalDensity: 0.7,
  symmetry: 0.85,
  reflectivity: 0.45,
  fog: 0.35,
  glow: 0.8,
  audioReact: 0.7,
  beatKick: 0.55,
  seed: 21,
  facetSharpness: 0.6
};

export type CrystalCathedralParams = {
  speed: number;
  quality: number;
  exposure: number;
  hueShift: number;
  crystalDensity: number;
  symmetry: number;
  reflectivity: number;
  fog: number;
  glow: number;
  audioReact: number;
  beatKick: number;
  seed: number;
  facetSharpness: number;
};

const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

export function normalizeCrystalCathedralParams(params: Record<string, number>): CrystalCathedralParams {
  const qualityRaw = toFiniteNumber(params.quality, CRYSTAL_CATHEDRAL_DEFAULTS.quality);
  return {
    speed: clamp(toFiniteNumber(params.speed, CRYSTAL_CATHEDRAL_DEFAULTS.speed), 0.1, 2),
    quality: clamp(Math.round(qualityRaw), 1, 3),
    exposure: clamp(toFiniteNumber(params.exposure, CRYSTAL_CATHEDRAL_DEFAULTS.exposure), 0.5, 2),
    hueShift: clamp(toFiniteNumber(params.hueShift, CRYSTAL_CATHEDRAL_DEFAULTS.hueShift), 0, 1),
    crystalDensity: clamp(toFiniteNumber(params.crystalDensity, CRYSTAL_CATHEDRAL_DEFAULTS.crystalDensity), 0.2, 1.4),
    symmetry: clamp(toFiniteNumber(params.symmetry, CRYSTAL_CATHEDRAL_DEFAULTS.symmetry), 0, 1),
    reflectivity: clamp(toFiniteNumber(params.reflectivity, CRYSTAL_CATHEDRAL_DEFAULTS.reflectivity), 0, 1),
    fog: clamp(toFiniteNumber(params.fog, CRYSTAL_CATHEDRAL_DEFAULTS.fog), 0, 1),
    glow: clamp(toFiniteNumber(params.glow, CRYSTAL_CATHEDRAL_DEFAULTS.glow), 0, 2),
    audioReact: clamp(toFiniteNumber(params.audioReact, CRYSTAL_CATHEDRAL_DEFAULTS.audioReact), 0, 1),
    beatKick: clamp(toFiniteNumber(params.beatKick, CRYSTAL_CATHEDRAL_DEFAULTS.beatKick), 0, 1),
    seed: clamp(toFiniteNumber(params.seed, CRYSTAL_CATHEDRAL_DEFAULTS.seed), 0, 9999),
    facetSharpness: clamp(toFiniteNumber(params.facetSharpness, CRYSTAL_CATHEDRAL_DEFAULTS.facetSharpness), 0.1, 1.5)
  };
}

export function buildCrystalCathedralUniforms(
  time: number,
  width: number,
  height: number,
  audio: EffectRenderContext["audio"],
  params: CrystalCathedralParams,
  beatAccent: number
): WebGLUniformPayload {
  const steps = params.quality === 1 ? 54 : params.quality === 2 ? 82 : 110;
  return {
    time,
    resolution: [width, height],
    rms: clamp(audio.rms, 0, 1),
    bass: clamp(audio.bass, 0, 1),
    mid: clamp(audio.mid, 0, 1),
    treble: clamp(audio.treble, 0, 1),
    beat: audio.beat ? 1 : 0,
    beatStrength: clamp((audio.beatStrength || 0) * beatAccent, 0, 1),
    warp: params.crystalDensity,
    hueShift: params.hueShift,
    exposure: params.exposure,
    seed: params.seed,
    steps,
    quality: params.quality,
    aspect: width / Math.max(1, height),
    speed: params.speed,
    audioReact: params.audioReact,
    beatKick: params.beatKick,
    crystalDensity: params.crystalDensity,
    symmetry: params.symmetry,
    reflectivity: params.reflectivity,
    fog: params.fog,
    glow: params.glow,
    facetSharpness: params.facetSharpness
  };
}

class CrystalCathedralFallbackEffect implements Effect {
  private beatFlash = 0;

  render(context: EffectRenderContext): void {
    const { ctx, width, height, time, audio } = context;
    const params = normalizeCrystalCathedralParams(context.params ?? {});
    const bass = clamp(audio.bass, 0, 1);
    const treble = clamp(audio.treble, 0, 1);
    const rms = clamp(audio.rms, 0, 1);

    if (audio.beat) {
      this.beatFlash = 1;
    } else {
      this.beatFlash *= 0.84;
    }

    const beat = this.beatFlash * params.beatKick * params.audioReact;
    const speedTime = time * params.speed;
    const centerX = width * 0.5;
    const centerY = height * 0.52;
    const horizonY = height * 0.25;
    const breath = 1 + (bass * 0.12 + beat * 0.2) * params.audioReact;

    const hue = (params.hueShift * 360 + time * 16) % 360;
    ctx.fillStyle = `hsl(${hue}, 38%, 6%)`;
    ctx.fillRect(0, 0, width, height);

    const fogGradient = ctx.createLinearGradient(0, 0, 0, height);
    fogGradient.addColorStop(0, `hsla(${(hue + 20) % 360}, 45%, 18%, 0.42)`);
    fogGradient.addColorStop(1, `hsla(${(hue + 260) % 360}, 55%, 5%, 0.92)`);
    ctx.fillStyle = fogGradient;
    ctx.fillRect(0, 0, width, height);

    const archCount = 16;
    for (let i = archCount; i >= 0; i -= 1) {
      const depth = i / archCount;
      const travel = (speedTime * 0.4 + depth * 1.2) % 1;
      const z = 1 - travel;
      const scale = Math.max(0.04, z * z);
      const wobble = Math.sin(speedTime * 1.3 + i * 0.37 + params.seed * 0.01) * 0.03 * width;
      const widthHalf = (width * (0.08 + scale * 0.46) * breath) * (0.8 + params.crystalDensity * 0.35);
      const archHeight = (height * (0.12 + scale * 0.64) * breath) * (0.85 + params.crystalDensity * 0.25);
      const alpha = (0.18 + scale * 0.5 + beat * 0.25) * (0.5 + treble * 0.7 * params.audioReact);

      ctx.strokeStyle = `hsla(${(hue + depth * 70 + 180) % 360}, 90%, ${40 + scale * 35}%, ${alpha})`;
      ctx.lineWidth = Math.max(1, 0.5 + scale * (2.8 + params.facetSharpness * 2.3));
      ctx.beginPath();
      ctx.moveTo(centerX - widthHalf + wobble, centerY + archHeight * 0.5);
      ctx.lineTo(centerX - widthHalf * 0.84 + wobble, centerY - archHeight * 0.45);
      ctx.lineTo(centerX + widthHalf * 0.84 + wobble, centerY - archHeight * 0.45);
      ctx.lineTo(centerX + widthHalf + wobble, centerY + archHeight * 0.5);
      ctx.stroke();

      const ribX = widthHalf * (0.45 + params.symmetry * 0.25);
      ctx.beginPath();
      ctx.moveTo(centerX - ribX + wobble, centerY + archHeight * 0.46);
      ctx.lineTo(centerX - ribX * 0.65 + wobble, centerY - archHeight * 0.35);
      ctx.moveTo(centerX + ribX + wobble, centerY + archHeight * 0.46);
      ctx.lineTo(centerX + ribX * 0.65 + wobble, centerY - archHeight * 0.35);
      ctx.stroke();
    }

    const coreWidth = width * (0.012 + bass * 0.014 * params.audioReact + beat * 0.016);
    const coreGradient = ctx.createLinearGradient(centerX, horizonY, centerX, height);
    coreGradient.addColorStop(0, `hsla(${(hue + 190) % 360}, 100%, 82%, ${0.65 + beat * 0.3})`);
    coreGradient.addColorStop(1, `hsla(${(hue + 240) % 360}, 95%, 45%, 0.04)`);
    ctx.fillStyle = coreGradient;
    ctx.fillRect(centerX - coreWidth, horizonY, coreWidth * 2, height - horizonY);

    const floorGradient = ctx.createLinearGradient(0, centerY, 0, height);
    floorGradient.addColorStop(0, `hsla(${(hue + 210) % 360}, 70%, 36%, ${0.14 + params.reflectivity * 0.3})`);
    floorGradient.addColorStop(1, `hsla(${(hue + 250) % 360}, 80%, 7%, 0.94)`);
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, centerY, width, height - centerY);

    ctx.strokeStyle = `hsla(${(hue + 200) % 360}, 100%, 75%, ${0.2 + treble * 0.4 * params.audioReact})`;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 12; i += 1) {
      const t = i / 12;
      const y = centerY + (height - centerY) * t * t;
      const spread = width * (0.02 + t * 0.45);
      ctx.beginPath();
      ctx.moveTo(centerX - spread, y);
      ctx.lineTo(centerX + spread, y);
      ctx.stroke();
    }

    const bloom = params.glow * (0.3 + rms * 0.7 + beat * 0.8);
    ctx.fillStyle = `hsla(${(hue + 170) % 360}, 100%, 80%, ${0.04 + bloom * 0.07})`;
    ctx.fillRect(0, 0, width, height);
  }

  reset(): void {
    this.beatFlash = 0;
  }
}

export class CrystalCathedralEffect implements Effect {
  private webgl: WebGLEffectBase | null = null;
  private fallbackEffect: Effect = new CrystalCathedralFallbackEffect();
  private warned = false;
  private beatAccent = 0;

  constructor() {
    this.webgl = new WebGLEffectBase(CRYSTAL_CATHEDRAL_FRAGMENT_SHADER, "gl_crystal_cathedral");
  }

  render(context: EffectRenderContext): void {
    const params = normalizeCrystalCathedralParams(context.params ?? {});
    if (context.audio.beat) {
      this.beatAccent = 1;
    } else {
      this.beatAccent *= 0.86;
    }

    const uniforms = buildCrystalCathedralUniforms(
      context.time,
      context.width,
      context.height,
      context.audio,
      params,
      this.beatAccent
    );

    const rendered = this.webgl?.renderToCanvas2D(
      context.ctx,
      context.width,
      context.height,
      uniforms,
      params.quality
    );

    if (rendered) {
      this.warned = false;
      return;
    }

    if (!this.warned) {
      const reason = this.webgl?.lastError ?? "WebGL2 unavailable or shader failed";
      console.warn(`[gl_crystal_cathedral] ${reason}. Falling back to stylised Canvas2D cathedral rendering.`);
      this.warned = true;
    }
    this.fallbackEffect.render(context);
  }

  reset(): void {
    this.warned = false;
    this.beatAccent = 0;
    this.fallbackEffect.reset?.();
  }
}
