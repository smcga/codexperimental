import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type KaleidoscopeEra = "8bit" | "16bit" | "ps1" | "pcdemo" | "future";

type KaleidoscopeResolvedParams = {
  slices: number;
  rotationSpeed: number;
  radialZoom: number;
  mirror: number;
  patternScale: number;
  patternWarp: number;
  centreX: number;
  centreY: number;
  colorShift: number;
  glow: number;
  audioReactive: number;
  bassInfluence: number;
  trebleInfluence: number;
  spinOnBeat: number;
  ringDensity: number;
};

const TAU = Math.PI * 2;
const BASE_PATTERN_SIZE = 512;

export const KALEIDOSCOPE_SYMMETRY_DEFAULTS: KaleidoscopeResolvedParams = {
  slices: 8,
  rotationSpeed: 0.15,
  radialZoom: 1,
  mirror: 1,
  patternScale: 1,
  patternWarp: 0.5,
  centreX: 0.5,
  centreY: 0.5,
  colorShift: 0.4,
  glow: 0.2,
  audioReactive: 1,
  bassInfluence: 0.8,
  trebleInfluence: 0.6,
  spinOnBeat: 0.35,
  ringDensity: 0.5
};

const ERA_BIAS: Record<KaleidoscopeEra, { detail: number; warp: number; glow: number; quantize: number; contrast: number }> = {
  "8bit": { detail: 0.45, warp: 0.75, glow: 0.25, quantize: 0.22, contrast: 0.88 },
  "16bit": { detail: 0.7, warp: 0.9, glow: 0.5, quantize: 0.1, contrast: 0.94 },
  ps1: { detail: 0.95, warp: 1, glow: 0.75, quantize: 0.05, contrast: 1 },
  pcdemo: { detail: 1.15, warp: 1.05, glow: 1, quantize: 0.03, contrast: 1.04 },
  future: { detail: 1.35, warp: 1.2, glow: 1.25, quantize: 0, contrast: 1.1 }
};

export const clampKaleidoscopeSlices = (value: number): number => clamp(Math.round(value), 3, 24);

export const foldAngleToWedge = (angle: number, wedgeAngle: number): number => {
  if (wedgeAngle <= 0) {
    return 0;
  }
  const wrapped = ((angle % TAU) + TAU) % TAU;
  const inSlice = wrapped % wedgeAngle;
  const index = Math.floor(wrapped / wedgeAngle);
  return index % 2 === 0 ? inSlice : wedgeAngle - inSlice;
};

const resolveEra = (era?: string): KaleidoscopeEra => {
  if (era === "8bit" || era === "16bit" || era === "ps1" || era === "pcdemo" || era === "future") {
    return era;
  }
  return "pcdemo";
};

export const resolveKaleidoscopeParams = (
  params: Record<string, number>,
  era?: string
): KaleidoscopeResolvedParams => {
  const resolvedEra = resolveEra(era);
  const bias = ERA_BIAS[resolvedEra];

  return {
    slices: clampKaleidoscopeSlices(params.slices ?? KALEIDOSCOPE_SYMMETRY_DEFAULTS.slices),
    rotationSpeed: params.rotationSpeed ?? KALEIDOSCOPE_SYMMETRY_DEFAULTS.rotationSpeed,
    radialZoom: clamp(params.radialZoom ?? KALEIDOSCOPE_SYMMETRY_DEFAULTS.radialZoom, 0.45, 2.8),
    mirror: clamp(params.mirror ?? KALEIDOSCOPE_SYMMETRY_DEFAULTS.mirror, 0, 1),
    patternScale: clamp(params.patternScale ?? KALEIDOSCOPE_SYMMETRY_DEFAULTS.patternScale, 0.35, 3),
    patternWarp: clamp((params.patternWarp ?? KALEIDOSCOPE_SYMMETRY_DEFAULTS.patternWarp) * bias.warp, 0, 2),
    centreX: clamp(params.centreX ?? KALEIDOSCOPE_SYMMETRY_DEFAULTS.centreX, 0, 1),
    centreY: clamp(params.centreY ?? KALEIDOSCOPE_SYMMETRY_DEFAULTS.centreY, 0, 1),
    colorShift: clamp(params.colorShift ?? KALEIDOSCOPE_SYMMETRY_DEFAULTS.colorShift, 0, 1),
    glow: clamp((params.glow ?? KALEIDOSCOPE_SYMMETRY_DEFAULTS.glow) * bias.glow, 0, 1),
    audioReactive: clamp(params.audioReactive ?? KALEIDOSCOPE_SYMMETRY_DEFAULTS.audioReactive, 0, 1),
    bassInfluence: clamp(params.bassInfluence ?? KALEIDOSCOPE_SYMMETRY_DEFAULTS.bassInfluence, 0, 1.5),
    trebleInfluence: clamp(params.trebleInfluence ?? KALEIDOSCOPE_SYMMETRY_DEFAULTS.trebleInfluence, 0, 1.5),
    spinOnBeat: clamp(params.spinOnBeat ?? KALEIDOSCOPE_SYMMETRY_DEFAULTS.spinOnBeat, 0, 1.5),
    ringDensity: clamp((params.ringDensity ?? KALEIDOSCOPE_SYMMETRY_DEFAULTS.ringDensity) * bias.detail, 0.2, 1.8)
  };
};

export class KaleidoscopeSymmetryEffect implements Effect {
  private sourceCanvas: HTMLCanvasElement;
  private sourceCtx: CanvasRenderingContext2D;
  private patternSize = BASE_PATTERN_SIZE;
  private beatKick = 0;

  constructor() {
    this.sourceCanvas = document.createElement("canvas");
    this.sourceCanvas.width = BASE_PATTERN_SIZE;
    this.sourceCanvas.height = BASE_PATTERN_SIZE;
    const sourceCtx = this.sourceCanvas.getContext("2d", { alpha: true });
    if (!sourceCtx) {
      throw new Error("Unable to create kaleidoscope source context");
    }
    this.sourceCtx = sourceCtx;
  }

  render({ ctx, width, height, time, delta, audio, params, era }: EffectRenderContext): void {
    const resolved = resolveKaleidoscopeParams(params, era);
    const eraBias = ERA_BIAS[resolveEra(era)];
    const energy = clamp(audio.rms * resolved.audioReactive, 0, 1);
    const bass = clamp(audio.bass * resolved.audioReactive * resolved.bassInfluence, 0, 1.5);
    const treble = clamp(audio.treble * resolved.audioReactive * resolved.trebleInfluence, 0, 1.5);

    if (audio.beat) {
      this.beatKick = Math.max(this.beatKick, clamp(audio.beatStrength + resolved.spinOnBeat, 0, 2));
    }
    this.beatKick = Math.max(0, this.beatKick - delta * 3.2);

    this.ensurePatternCanvasSize(width, height);
    this.drawSourcePattern({
      time,
      bass,
      treble,
      energy,
      colorShift: resolved.colorShift,
      patternScale: resolved.patternScale,
      patternWarp: resolved.patternWarp,
      ringDensity: resolved.ringDensity,
      quantize: eraBias.quantize,
      contrast: eraBias.contrast
    });

    const centerX = width * resolved.centreX;
    const centerY = height * resolved.centreY;
    const wedgeAngle = TAU / resolved.slices;
    const baseRotation =
      time * (resolved.rotationSpeed + this.beatKick * (0.12 + resolved.spinOnBeat * 0.2)) + Math.sin(time * 0.23) * 0.08;
    const pulse = 1 + bass * 0.12 + this.beatKick * 0.08;
    const zoom = resolved.radialZoom * pulse;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(centerX, centerY);

    const drawRadius = Math.hypot(width, height);
    for (let slice = 0; slice < resolved.slices; slice += 1) {
      const start = -wedgeAngle * 0.5;
      const end = start + wedgeAngle;
      const sliceRotation = baseRotation + slice * wedgeAngle;
      const mirrorPhase = resolved.mirror >= 0.5 && slice % 2 === 1 ? -1 : 1;

      ctx.save();
      ctx.rotate(sliceRotation);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, drawRadius, start, end);
      ctx.closePath();
      ctx.clip();

      ctx.rotate(start + wedgeAngle * 0.5);
      ctx.scale(mirrorPhase * zoom, zoom);
      ctx.drawImage(this.sourceCanvas, -this.patternSize / 2, -this.patternSize / 2, this.patternSize, this.patternSize);
      ctx.restore();
    }

    if (resolved.glow > 0.001) {
      const glowRadius = Math.min(width, height) * (0.22 + resolved.glow * 0.4);
      const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
      bloom.addColorStop(0, `hsla(${Math.round((time * 35 + resolved.colorShift * 240) % 360)}, 85%, 66%, ${0.08 + resolved.glow * 0.22})`);
      bloom.addColorStop(0.7, `hsla(${Math.round((time * 45 + 90) % 360)}, 95%, 55%, ${0.03 + resolved.glow * 0.12})`);
      bloom.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(0, 0, glowRadius, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }

  reset(): void {
    this.beatKick = 0;
    this.sourceCtx.clearRect(0, 0, this.patternSize, this.patternSize);
  }

  private ensurePatternCanvasSize(width: number, height: number): void {
    const target = Math.max(BASE_PATTERN_SIZE, Math.ceil(Math.max(width, height) * 1.1));
    if (target === this.patternSize) {
      return;
    }
    this.patternSize = target;
    this.sourceCanvas.width = target;
    this.sourceCanvas.height = target;
  }

  private drawSourcePattern(options: {
    time: number;
    bass: number;
    treble: number;
    energy: number;
    colorShift: number;
    patternScale: number;
    patternWarp: number;
    ringDensity: number;
    quantize: number;
    contrast: number;
  }): void {
    const { time, bass, treble, energy, colorShift, patternScale, patternWarp, ringDensity, quantize, contrast } = options;
    const ctx = this.sourceCtx;
    const size = this.patternSize;
    const half = size * 0.5;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const hueBase = (time * 28 + colorShift * 210 + bass * 80) % 360;
    const bg = ctx.createRadialGradient(half, half, size * 0.05, half, half, size * 0.6);
    bg.addColorStop(0, `hsla(${hueBase}, 88%, ${26 + contrast * 8}%, 0.96)`);
    bg.addColorStop(0.55, `hsla(${(hueBase + 68) % 360}, 74%, ${11 + contrast * 10}%, 0.85)`);
    bg.addColorStop(1, `hsla(${(hueBase + 150) % 360}, 62%, ${4 + contrast * 6}%, 1)`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    ctx.translate(half, half);
    const radialLines = Math.round(20 + ringDensity * 22 + treble * 28);
    const swirl = 0.35 + patternWarp * 1.6;
    const baseRadius = size * 0.48 * patternScale;
    ctx.globalCompositeOperation = "screen";

    for (let i = 0; i < radialLines; i += 1) {
      const n = i / Math.max(1, radialLines - 1);
      const angle = n * TAU + time * 0.3;
      const folded = foldAngleToWedge(angle + time * 0.5, Math.PI / 6);
      const radius = baseRadius * (0.25 + n * 0.8 + Math.sin(folded * 7 + time * 0.9) * 0.06);
      const wobble = Math.sin(time * (1 + patternWarp) + n * 17) * size * 0.04 * (0.6 + patternWarp);
      const x1 = Math.cos(angle) * (radius * 0.18 + wobble);
      const y1 = Math.sin(angle) * (radius * 0.18 - wobble * 0.35);
      const x2 = Math.cos(angle + swirl * 0.45) * (radius + wobble * 0.2);
      const y2 = Math.sin(angle + swirl * 0.45) * (radius + wobble * 0.2);

      const width = 0.8 + treble * 1.8 + (1 - n) * 1.1;
      ctx.lineWidth = width;
      ctx.strokeStyle = `hsla(${(hueBase + n * 170 + treble * 60) % 360}, 95%, ${55 + n * 25}%, ${0.08 + 0.32 * (1 - n)})`;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(
        Math.cos(angle + patternWarp) * radius * 0.65,
        Math.sin(angle + patternWarp) * radius * 0.65,
        x2,
        y2
      );
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "lighter";
    const ringCount = Math.round(3 + ringDensity * 7 + bass * 4);
    for (let i = 0; i < ringCount; i += 1) {
      const t = i / Math.max(1, ringCount - 1);
      const radius = baseRadius * (0.2 + t * 0.75) * (1 + Math.sin(time * 1.2 + t * 9) * 0.05);
      const alpha = 0.04 + 0.11 * (1 - t) + bass * 0.04;
      ctx.lineWidth = 1 + t * 2 + treble * 1.2;
      ctx.strokeStyle = `hsla(${(hueBase + 210 + t * 120) % 360}, 92%, ${48 + t * 20}%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.stroke();
    }

    if (quantize > 0) {
      const step = Math.max(2, Math.round(quantize * 14));
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      for (let y = -half; y < half; y += step) {
        for (let x = -half; x < half; x += step) {
          if ((x + y) % (step * 2) === 0) {
            ctx.fillRect(x, y, step * 0.6, step * 0.6);
          }
        }
      }
    }

    const vignette = ctx.createRadialGradient(0, 0, size * 0.08, 0, 0, size * 0.55);
    vignette.addColorStop(0, `rgba(255, 255, 255, ${0.03 + energy * 0.04})`);
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.4)");
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = vignette;
    ctx.fillRect(-half, -half, size, size);

    ctx.restore();
  }
}
