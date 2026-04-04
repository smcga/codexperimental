import { clamp, lerp, smoothstep } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type TilingMorphMode = "mono" | "palette" | "neon";

type TilingMorphParams = {
  scale: number;
  morphSpeed: number;
  morphAmount: number;
  rotationSpeed: number;
  lineWidth: number;
  fillAlpha: number;
  paletteShift: number;
  audioReactive: number;
  cellJitter: number;
  roundedness: number;
  contrast: number;
  seed: number;
  backgroundAlpha: number;
  mode: TilingMorphMode;
};

export const TILING_MORPH_DEFAULTS: TilingMorphParams = {
  scale: 1,
  morphSpeed: 1,
  morphAmount: 0.85,
  rotationSpeed: 0.08,
  lineWidth: 1.5,
  fillAlpha: 0.85,
  paletteShift: 0,
  audioReactive: 1,
  cellJitter: 0.15,
  roundedness: 0.35,
  contrast: 1,
  seed: 1,
  backgroundAlpha: 1,
  mode: "palette"
};

const TAU = Math.PI * 2;
const LOOP_SECONDS = 16;

const toFinite = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const clamp01 = (value: number): number => clamp(value, 0, 1);

const toMode = (value: unknown): TilingMorphMode => {
  if (value === "mono" || value === "palette" || value === "neon") {
    return value;
  }
  return TILING_MORPH_DEFAULTS.mode;
};

export const resolveTilingMorphParams = (params: Record<string, unknown>): TilingMorphParams => ({
  scale: clamp(toFinite(params.scale, TILING_MORPH_DEFAULTS.scale), 0.35, 3),
  morphSpeed: clamp(toFinite(params.morphSpeed, TILING_MORPH_DEFAULTS.morphSpeed), 0.1, 4),
  morphAmount: clamp01(toFinite(params.morphAmount, TILING_MORPH_DEFAULTS.morphAmount)),
  rotationSpeed: clamp(toFinite(params.rotationSpeed, TILING_MORPH_DEFAULTS.rotationSpeed), -1, 1),
  lineWidth: clamp(toFinite(params.lineWidth, TILING_MORPH_DEFAULTS.lineWidth), 0.25, 8),
  fillAlpha: clamp01(toFinite(params.fillAlpha, TILING_MORPH_DEFAULTS.fillAlpha)),
  paletteShift: clamp(toFinite(params.paletteShift, TILING_MORPH_DEFAULTS.paletteShift), -2, 2),
  audioReactive: clamp01(toFinite(params.audioReactive, TILING_MORPH_DEFAULTS.audioReactive)),
  cellJitter: clamp(toFinite(params.cellJitter, TILING_MORPH_DEFAULTS.cellJitter), 0, 0.45),
  roundedness: clamp01(toFinite(params.roundedness, TILING_MORPH_DEFAULTS.roundedness)),
  contrast: clamp(toFinite(params.contrast, TILING_MORPH_DEFAULTS.contrast), 0.5, 2.5),
  seed: clamp(toFinite(params.seed, TILING_MORPH_DEFAULTS.seed), 0, 9999),
  backgroundAlpha: clamp01(toFinite(params.backgroundAlpha, TILING_MORPH_DEFAULTS.backgroundAlpha)),
  mode: toMode(params.mode)
});

export const hashNode = (ix: number, iy: number, seed: number): number => {
  const x = (ix | 0) + ((seed * 73.13) | 0);
  const y = (iy | 0) + ((seed * 193.31) | 0);
  const n = x * 374761393 + y * 668265263;
  const mixed = (n ^ (n >>> 13)) * 1274126177;
  return (((mixed ^ (mixed >>> 16)) >>> 0) & 0xffff) / 0xffff;
};

export const getLoopedMorphPhase = (time: number, morphSpeed: number): number => {
  const t = ((time * morphSpeed) % LOOP_SECONDS + LOOP_SECONDS) % LOOP_SECONDS;
  return (t / LOOP_SECONDS) * 4;
};

export const computeMorphWeights = (phase: number): [number, number, number, number] => {
  const p = ((phase % 4) + 4) % 4;
  const i = Math.floor(p);
  const t = smoothstep(0, 1, p - i);
  const weights: [number, number, number, number] = [0, 0, 0, 0];
  weights[i] = 1 - t;
  weights[(i + 1) % 4] = t;
  return weights;
};

export const computeNodePosition = (
  ix: number,
  iy: number,
  cell: number,
  morphAmount: number,
  jitterAmount: number,
  roundedness: number,
  phase: number,
  bassBreath: number,
  seed: number
): [number, number] => {
  const baseX = ix * cell;
  const baseY = iy * cell;
  const wx = ix * 0.61 + iy * 0.17 + phase * TAU;
  const wy = iy * 0.58 - ix * 0.11 + phase * TAU * 0.9;
  const w2 = (ix + iy) * 0.33 + phase * TAU * 1.31;

  const squareX = 0;
  const squareY = 0;

  const diamondX = (Math.sin(wy) + Math.cos(w2)) * 0.17 * cell;
  const diamondY = (Math.cos(wx) - Math.sin(w2)) * 0.17 * cell;

  const triWave = Math.sin((ix - iy) * 0.7 + phase * TAU * 1.2);
  const triX = triWave * 0.23 * cell;
  const triY = -triWave * 0.19 * cell;

  const organicX = (Math.sin(wx * 1.7) + Math.sin(w2 * 2.1)) * 0.11 * cell;
  const organicY = (Math.cos(wy * 1.5) + Math.cos(w2 * 1.9)) * 0.11 * cell;

  const [wA, wB, wC, wD] = computeMorphWeights(phase * 4);
  const morphX = (squareX * wA + diamondX * wB + triX * wC + organicX * wD) * morphAmount;
  const morphY = (squareY * wA + diamondY * wB + triY * wC + organicY * wD) * morphAmount;

  const j = (hashNode(ix, iy, seed) * 2 - 1) * jitterAmount * (0.7 + roundedness * 0.6);
  const jitterX = Math.sin(w2 + j * 7.3) * 0.12 * cell * j;
  const jitterY = Math.cos(w2 - j * 6.7) * 0.12 * cell * j;

  const breath = 1 + bassBreath * 0.08;
  return [baseX + (morphX + jitterX) * breath, baseY + (morphY + jitterY) * breath];
};

const eraTuning = (era: string | undefined): { cellMul: number; roundMul: number; contrastMul: number; glow: number } => {
  switch (era) {
    case "8bit":
      return { cellMul: 1.45, roundMul: 0.35, contrastMul: 1.25, glow: 0 };
    case "16bit":
      return { cellMul: 1.2, roundMul: 0.65, contrastMul: 1.1, glow: 0.04 };
    case "ps1":
      return { cellMul: 1.1, roundMul: 0.75, contrastMul: 1.05, glow: 0.02 };
    case "future":
      return { cellMul: 0.95, roundMul: 1.25, contrastMul: 1.15, glow: 0.22 };
    case "pcdemo":
    default:
      return { cellMul: 1, roundMul: 1, contrastMul: 1, glow: 0.08 };
  }
};

const hsl = (h: number, s: number, l: number, a: number): string =>
  `hsla(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%, ${a.toFixed(3)})`;

export class TilingMorphEffect implements Effect {
  private beatPulse = 0;

  render({ ctx, width, height, time, delta, audio, params, era }: EffectRenderContext): void {
    const p = resolveTilingMorphParams(params as Record<string, unknown>);
    const audioReact = p.audioReactive;
    const beatStrength = audio.beat ? 1 : 0;
    this.beatPulse = Math.max(0, this.beatPulse - delta * 3.2);
    if (beatStrength > 0) {
      this.beatPulse = 1;
    }

    const tuning = eraTuning(era);
    const bassBreath = audio.bass * 0.6 * audioReact + this.beatPulse * 0.2 * audioReact;
    const contrast = p.contrast * tuning.contrastMul * (1 + audio.rms * 0.2 * audioReact);
    const morphAmount = clamp01(p.morphAmount + this.beatPulse * 0.12 * audioReact);
    const morphPhase = getLoopedMorphPhase(time, p.morphSpeed * (1 + audio.rms * 0.12 * audioReact));

    const baseCell = Math.max(18, Math.min(width, height) * 0.095);
    const cell = baseCell * tuning.cellMul / p.scale;

    const hueBase = (210 + p.paletteShift * 180 + time * 8 * p.paletteShift + p.seed * 13) % 360;
    const bgL = clamp(6 + (contrast - 1) * 8, 2, 20);
    ctx.fillStyle = hsl(hueBase + 220, 32, bgL, p.backgroundAlpha);
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width * 0.5, height * 0.5);
    const rot = time * p.rotationSpeed * (1 + audio.treble * 0.06 * audioReact);
    ctx.rotate(rot);

    const drawW = width + cell * 6;
    const drawH = height + cell * 6;
    const startX = -drawW * 0.5;
    const startY = -drawH * 0.5;
    const cols = Math.ceil(drawW / cell) + 2;
    const rows = Math.ceil(drawH / cell) + 2;

    const baseLine = p.lineWidth * (1 + audio.rms * 0.2 * audioReact + this.beatPulse * 0.16 * audioReact);
    const roundedness = clamp01(p.roundedness * tuning.roundMul);
    const cornerPull = roundedness * 0.32;
    const jitter = p.cellJitter * (1 + audio.treble * 0.15 * audioReact);

    for (let gy = -1; gy < rows; gy += 1) {
      for (let gx = -1; gx < cols; gx += 1) {
        const ix = gx;
        const iy = gy;
        const [x00, y00] = computeNodePosition(ix, iy, cell, morphAmount, jitter, roundedness, morphPhase / 4, bassBreath, p.seed);
        const [x10, y10] = computeNodePosition(ix + 1, iy, cell, morphAmount, jitter, roundedness, morphPhase / 4, bassBreath, p.seed);
        const [x11, y11] = computeNodePosition(ix + 1, iy + 1, cell, morphAmount, jitter, roundedness, morphPhase / 4, bassBreath, p.seed);
        const [x01, y01] = computeNodePosition(ix, iy + 1, cell, morphAmount, jitter, roundedness, morphPhase / 4, bassBreath, p.seed);

        const ox = startX;
        const oy = startY;
        const ax = ox + x00;
        const ay = oy + y00;
        const bx = ox + x10;
        const by = oy + y10;
        const cx = ox + x11;
        const cy = oy + y11;
        const dx = ox + x01;
        const dy = oy + y01;

        const tilePhase = (Math.sin((ix + iy) * 0.37 + morphPhase * TAU * 0.25) + 1) * 0.5;
        const hue = hueBase + tilePhase * 95 + (p.mode === "neon" ? 50 : 0);
        const sat = p.mode === "mono" ? 8 : p.mode === "neon" ? 88 : 62;
        const lit = clamp(30 + tilePhase * 24 * contrast + audio.treble * 6 * audioReact, 12, 86);
        const alpha = clamp01(p.fillAlpha * (0.84 + this.beatPulse * 0.1 * audioReact));

        ctx.fillStyle = hsl(hue, sat, lit, alpha);
        ctx.strokeStyle = hsl(hue + 12, sat * 0.7, clamp(lit + 14, 16, 95), clamp01(0.35 + contrast * 0.18));
        ctx.lineWidth = baseLine;

        const iabx = lerp(ax, bx, cornerPull);
        const iaby = lerp(ay, by, cornerPull);
        const ibcx = lerp(bx, cx, cornerPull);
        const ibcy = lerp(by, cy, cornerPull);
        const icdx = lerp(cx, dx, cornerPull);
        const icdy = lerp(cy, dy, cornerPull);
        const idax = lerp(dx, ax, cornerPull);
        const iday = lerp(dy, ay, cornerPull);

        ctx.beginPath();
        ctx.moveTo(iabx, iaby);
        ctx.quadraticCurveTo(bx, by, ibcx, ibcy);
        ctx.quadraticCurveTo(cx, cy, icdx, icdy);
        ctx.quadraticCurveTo(dx, dy, idax, iday);
        ctx.quadraticCurveTo(ax, ay, iabx, iaby);
        ctx.fill();
        ctx.stroke();

        if (era === "future" || era === "pcdemo") {
          ctx.strokeStyle = hsl(hue + 42, sat, clamp(lit + 26, 25, 96), 0.16 + tuning.glow);
          ctx.lineWidth = baseLine * 0.55;
          ctx.stroke();
        }
      }
    }

    if (era === "future") {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = hsl(hueBase + 40, 95, 62, 0.06 + tuning.glow);
      ctx.fillRect(-width * 0.5, -height * 0.5, width, height);
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  }
}
