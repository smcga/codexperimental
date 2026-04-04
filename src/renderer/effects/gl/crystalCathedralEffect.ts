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

const QUALITY_STEPS: Record<number, number> = {
  1: 64,
  2: 92,
  3: 128
};

type CrystalCathedralParams = {
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
  context: EffectRenderContext,
  params: CrystalCathedralParams,
  beatDecay: number
): WebGLUniformPayload {
  const audio = context.audio;
  return {
    time: context.time,
    resolution: [context.width, context.height],
    rms: clamp(audio.rms, 0, 1),
    bass: clamp(audio.bass, 0, 1),
    mid: clamp(audio.mid, 0, 1),
    treble: clamp(audio.treble, 0, 1),
    beat: audio.beat ? 1 : 0,
    beatStrength: clamp(Math.max(beatDecay, audio.beatStrength * 0.7), 0, 1),
    speed: params.speed,
    hueShift: params.hueShift,
    exposure: params.exposure,
    seed: params.seed,
    steps: QUALITY_STEPS[params.quality] ?? QUALITY_STEPS[2],
    quality: params.quality,
    aspect: context.width / Math.max(1, context.height),
    warp: params.crystalDensity,
    cameraRadius: params.symmetry,
    cameraHeight: params.reflectivity,
    cameraOrbitSpeed: params.fog,
    paletteSpeed: params.glow,
    audioReact: params.audioReact,
    beatKick: params.beatKick,
    fractalScale: params.facetSharpness
  };
}

class CrystalCathedralFallbackEffect implements Effect {
  private beatDecay = 0;

  render(context: EffectRenderContext): void {
    const params = normalizeCrystalCathedralParams(context.params ?? {});
    if (context.audio.beat) {
      this.beatDecay = 1;
    } else {
      this.beatDecay *= 0.84;
    }

    const { ctx, width, height } = context;
    const cx = width * 0.5;
    const horizon = height * 0.58;
    const t = context.time * params.speed;
    const bassPulse = clamp(context.audio.bass * params.audioReact, 0, 1);
    const beatLift = this.beatDecay * params.beatKick;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#081022");
    sky.addColorStop(0.58, "#0c1a2f");
    sky.addColorStop(1, "#07090f");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const fogAlpha = 0.08 + params.fog * 0.28;
    for (let i = 0; i < 4; i += 1) {
      const y = horizon + i * height * 0.08;
      const g = ctx.createLinearGradient(0, y, 0, height);
      g.addColorStop(0, `rgba(120, 220, 255, ${fogAlpha * (1 - i * 0.2)})`);
      g.addColorStop(1, "rgba(10, 18, 28, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, y, width, height - y);
    }

    const laneGlow = 0.2 + params.glow * 0.6 + beatLift * 0.35;
    const seamGrad = ctx.createLinearGradient(cx - width * 0.12, 0, cx + width * 0.12, 0);
    seamGrad.addColorStop(0, "rgba(100,200,255,0)");
    seamGrad.addColorStop(0.5, `rgba(140, 245, 255, ${laneGlow})`);
    seamGrad.addColorStop(1, "rgba(100,200,255,0)");
    ctx.fillStyle = seamGrad;
    ctx.fillRect(cx - width * 0.12, 0, width * 0.24, height);

    ctx.globalCompositeOperation = "lighter";
    const archCount = Math.max(8, Math.round(10 + params.crystalDensity * 10));
    for (let i = archCount; i >= 0; i -= 1) {
      const depth = i / archCount;
      const phase = (depth * 7.0 + t * 0.6 + params.seed * 0.01) % 1;
      const z = phase < 0 ? phase + 1 : phase;
      const scale = 0.12 + z * 1.15;
      const archWidth = width * (0.18 + scale * (0.56 + params.symmetry * 0.25));
      const archHeight = height * (0.2 + scale * (0.72 + bassPulse * 0.1));
      const yBase = horizon - archHeight * 0.65;
      const alpha = (1 - z) * (0.16 + params.glow * 0.24) + beatLift * 0.06;
      const sway = Math.sin(t * 0.45 + i * 0.7) * width * 0.015;

      ctx.strokeStyle = `rgba(150, ${190 + Math.round(40 * (1 - z))}, 255, ${alpha.toFixed(3)})`;
      ctx.lineWidth = Math.max(1, width * 0.0012 * (1.4 - z));
      ctx.beginPath();
      ctx.moveTo(cx - archWidth + sway, horizon + archHeight * 0.3);
      ctx.quadraticCurveTo(cx - archWidth * 0.82 + sway, yBase, cx + sway, yBase - archHeight * 0.08);
      ctx.quadraticCurveTo(cx + archWidth * 0.82 + sway, yBase, cx + archWidth + sway, horizon + archHeight * 0.3);
      ctx.stroke();

      const ribStep = archWidth / 5;
      for (let side = -1; side <= 1; side += 2) {
        for (let r = 1; r <= 3; r += 1) {
          const x = cx + side * (archWidth - ribStep * r) + sway;
          const h = archHeight * (0.48 + r * 0.08 + bassPulse * 0.06);
          ctx.strokeStyle = `rgba(120, 220, 255, ${(alpha * 0.7).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(x, horizon + archHeight * 0.28);
          ctx.lineTo(x + side * archWidth * 0.06, horizon - h * 0.65);
          ctx.stroke();
        }
      }
    }

    const floorGrad = ctx.createLinearGradient(0, horizon, 0, height);
    floorGrad.addColorStop(0, `rgba(90, 170, 230, ${0.08 + params.reflectivity * 0.18})`);
    floorGrad.addColorStop(1, "rgba(10, 16, 24, 0.95)");
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, horizon, width, height - horizon);

    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 6; i += 1) {
      const y = horizon + i * (height - horizon) * 0.16;
      const lineAlpha = (0.12 + params.reflectivity * 0.2) * (1 - i * 0.12);
      ctx.strokeStyle = `rgba(140, 230, 255, ${lineAlpha.toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - width * (0.07 + i * 0.06), y);
      ctx.lineTo(cx + width * (0.07 + i * 0.06), y);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  reset(): void {
    this.beatDecay = 0;
  }
}

export class CrystalCathedralEffect implements Effect {
  private webgl: WebGLEffectBase | null = null;
  private fallbackEffect: Effect = new CrystalCathedralFallbackEffect();
  private warned = false;
  private beatDecay = 0;

  constructor() {
    this.webgl = new WebGLEffectBase(CRYSTAL_CATHEDRAL_FRAGMENT_SHADER, "gl_crystal_cathedral");
  }

  render(context: EffectRenderContext): void {
    const params = normalizeCrystalCathedralParams(context.params ?? {});
    if (context.audio.beat) {
      this.beatDecay = 1;
    } else {
      this.beatDecay *= 0.86;
    }

    const uniforms = buildCrystalCathedralUniforms(context, params, this.beatDecay);
    const rendered = this.webgl?.renderToCanvas2D(context.ctx, context.width, context.height, uniforms, params.quality);

    if (rendered) {
      this.warned = false;
      return;
    }

    if (!this.warned) {
      const reason = this.webgl?.lastError ?? "WebGL2 unavailable or shader failed";
      console.warn(`[gl_crystal_cathedral] ${reason}. Falling back to stylized Canvas2D cathedral.`);
      this.warned = true;
    }

    this.fallbackEffect.render(context);
  }

  reset(): void {
    this.warned = false;
    this.beatDecay = 0;
    this.fallbackEffect.reset?.();
  }
}
