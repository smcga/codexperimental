import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const REACTION_DIFFUSION_DEFAULTS = {
  scale: 1,
  simScale: 0.25,
  feed: 0.042,
  kill: 0.06,
  diffA: 1,
  diffB: 0.5,
  steps: 6,
  seed: 1,
  contrast: 1.4,
  brightness: 1,
  invert: 0,
  paletteMix: 0.35,
  audioReactivity: 0.2,
  beatPulse: 0.15,
  drift: 0.05,
  reseedCue: 0
} as const;

type NormalizedParams = {
  scale: number;
  simScale: number;
  feed: number;
  kill: number;
  diffA: number;
  diffB: number;
  steps: number;
  seed: number;
  contrast: number;
  brightness: number;
  invert: boolean;
  paletteMix: number;
  audioReactivity: number;
  beatPulse: number;
  drift: number;
  reseedCue: number;
};

type ReactionDiffusionState = {
  simWidth: number;
  simHeight: number;
  fieldA: Float32Array;
  fieldB: Float32Array;
  nextA: Float32Array;
  nextB: Float32Array;
  imageData: ImageData;
  bufferCanvas: HTMLCanvasElement;
  bufferCtx: CanvasRenderingContext2D;
  simTime: number;
  pulse: number;
  prevReseedCue: number;
  seed: number;
  simScale: number;
};

const clamp01 = (value: number): number => clamp(value, 0, 1);

export const createMulberry32 = (seed: number): (() => number) => {
  let t = (seed >>> 0) + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const toFiniteNumber = (value: number | undefined, fallback: number): number =>
  Number.isFinite(value) ? Number(value) : fallback;

export const normalizeReactionDiffusionParams = (params: Record<string, number>, era?: string): NormalizedParams => {
  const eraSimBoost = era === "8bit" ? 0.85 : era === "future" ? 1.15 : 1;
  const stepsMax = era === "8bit" ? 12 : era === "future" ? 18 : 14;

  return {
    scale: clamp(toFiniteNumber(params.scale, REACTION_DIFFUSION_DEFAULTS.scale), 0.5, 3),
    simScale: clamp(toFiniteNumber(params.simScale, REACTION_DIFFUSION_DEFAULTS.simScale) * eraSimBoost, 0.08, 0.7),
    feed: clamp(toFiniteNumber(params.feed, REACTION_DIFFUSION_DEFAULTS.feed), 0.01, 0.09),
    kill: clamp(toFiniteNumber(params.kill, REACTION_DIFFUSION_DEFAULTS.kill), 0.03, 0.09),
    diffA: clamp(toFiniteNumber(params.diffA, REACTION_DIFFUSION_DEFAULTS.diffA), 0.2, 1.6),
    diffB: clamp(toFiniteNumber(params.diffB, REACTION_DIFFUSION_DEFAULTS.diffB), 0.1, 1.2),
    steps: Math.round(clamp(toFiniteNumber(params.steps, REACTION_DIFFUSION_DEFAULTS.steps), 1, stepsMax)),
    seed: Math.round(clamp(toFiniteNumber(params.seed, REACTION_DIFFUSION_DEFAULTS.seed), 0, 999999)),
    contrast: clamp(toFiniteNumber(params.contrast, REACTION_DIFFUSION_DEFAULTS.contrast), 0.4, 3.2),
    brightness: clamp(toFiniteNumber(params.brightness, REACTION_DIFFUSION_DEFAULTS.brightness), 0.2, 2.5),
    invert: toFiniteNumber(params.invert, REACTION_DIFFUSION_DEFAULTS.invert) > 0.5,
    paletteMix: clamp(toFiniteNumber(params.paletteMix, REACTION_DIFFUSION_DEFAULTS.paletteMix), 0, 1),
    audioReactivity: clamp(toFiniteNumber(params.audioReactivity, REACTION_DIFFUSION_DEFAULTS.audioReactivity), 0, 1),
    beatPulse: clamp(toFiniteNumber(params.beatPulse, REACTION_DIFFUSION_DEFAULTS.beatPulse), 0, 1),
    drift: clamp(toFiniteNumber(params.drift, REACTION_DIFFUSION_DEFAULTS.drift), 0, 0.5),
    reseedCue: toFiniteNumber(params.reseedCue, REACTION_DIFFUSION_DEFAULTS.reseedCue)
  };
};

export const createSeededFields = (
  width: number,
  height: number,
  seed: number
): { fieldA: Float32Array; fieldB: Float32Array } => {
  const size = width * height;
  const fieldA = new Float32Array(size);
  const fieldB = new Float32Array(size);
  fieldA.fill(1);

  const random = createMulberry32(seed || 1);
  const patches = Math.max(6, Math.round((width * height) / 1800));

  for (let i = 0; i < patches; i += 1) {
    const cx = Math.floor(random() * width);
    const cy = Math.floor(random() * height);
    const radius = Math.max(2, Math.floor((2 + random() * 7) * Math.sqrt((width * height) / (160 * 90))));

    for (let y = Math.max(1, cy - radius); y < Math.min(height - 1, cy + radius); y += 1) {
      for (let x = Math.max(1, cx - radius); x < Math.min(width - 1, cx + radius); x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 > radius * radius) {
          continue;
        }
        const idx = y * width + x;
        const influence = 1 - Math.sqrt(d2) / radius;
        const noise = random() * 0.08;
        fieldB[idx] = clamp01(fieldB[idx] + influence * (0.6 + noise));
        fieldA[idx] = clamp01(fieldA[idx] - influence * 0.45);
      }
    }
  }

  return { fieldA, fieldB };
};

const computeEraTint = (era: string | undefined, value: number): [number, number, number] => {
  if (era === "8bit") {
    const q = Math.round(value * 3) / 3;
    return [q * 255, q * 235, q * 210];
  }
  if (era === "16bit") {
    return [value * 255, value * 244, value * 220];
  }
  if (era === "ps1") {
    return [value * 230, value * 220, value * 255];
  }
  if (era === "pcdemo") {
    return [value * 210, value * 245, value * 255];
  }
  return [value * 190, value * 255, value * 245];
};

const laplacian = (field: Float32Array, x: number, y: number, width: number, height: number): number => {
  const xm = x > 0 ? x - 1 : width - 1;
  const xp = x < width - 1 ? x + 1 : 0;
  const ym = y > 0 ? y - 1 : height - 1;
  const yp = y < height - 1 ? y + 1 : 0;

  const center = field[y * width + x];
  const cross =
    field[y * width + xm] +
    field[y * width + xp] +
    field[ym * width + x] +
    field[yp * width + x];
  const corners =
    field[ym * width + xm] +
    field[ym * width + xp] +
    field[yp * width + xm] +
    field[yp * width + xp];

  return cross * 0.2 + corners * 0.05 - center;
};

export class ReactionDiffusionEffect implements Effect {
  private state: ReactionDiffusionState | null = null;
  private lastTime = 0;

  reset(): void {
    this.state = null;
    this.lastTime = 0;
  }

  private createState(simWidth: number, simHeight: number, seed: number, simScale: number): ReactionDiffusionState {
    const seeded = createSeededFields(simWidth, simHeight, seed);
    const bufferCanvas = document.createElement("canvas");
    bufferCanvas.width = simWidth;
    bufferCanvas.height = simHeight;
    const bufferCtx = bufferCanvas.getContext("2d");
    if (!bufferCtx) {
      throw new Error("Unable to create reactionDiffusion buffer context");
    }
    return {
      simWidth,
      simHeight,
      fieldA: seeded.fieldA,
      fieldB: seeded.fieldB,
      nextA: new Float32Array(simWidth * simHeight),
      nextB: new Float32Array(simWidth * simHeight),
      imageData: bufferCtx.createImageData(simWidth, simHeight),
      bufferCanvas,
      bufferCtx,
      simTime: 0,
      pulse: 0,
      prevReseedCue: 0,
      seed,
      simScale
    };
  }

  render({ ctx, width, height, time, delta, audio, params, era }: EffectRenderContext): void {
    const p = normalizeReactionDiffusionParams(params, era);
    const simWidth = Math.max(64, Math.round((width * p.simScale) / p.scale));
    const simHeight = Math.max(48, Math.round((height * p.simScale) / p.scale));

    const needsReset =
      !this.state ||
      this.state.simWidth !== simWidth ||
      this.state.simHeight !== simHeight ||
      this.state.seed !== p.seed ||
      Math.abs(this.state.simScale - p.simScale) > 0.0001 ||
      (p.reseedCue > 0.5 && this.state.prevReseedCue <= 0.5) ||
      time < this.lastTime - 0.001 ||
      time - this.lastTime > 1.25;

    if (needsReset) {
      this.state = this.createState(simWidth, simHeight, p.seed, p.simScale);
    }
    const state = this.state;
    state.prevReseedCue = p.reseedCue;

    const reactivity = p.audioReactivity;
    const energy = clamp01(audio.rms * 0.7 + audio.mid * 0.45 + audio.treble * 0.2);
    const beatKick = (audio.beat ? 1 : audio.beatStrength) * p.beatPulse;
    state.pulse = lerp(state.pulse, beatKick, 0.35);
    state.pulse *= 0.93;

    const driftMotion = Math.sin(state.simTime * 0.08 + p.seed * 0.17) * p.drift;
    const feed = clamp(p.feed + driftMotion * 0.005 + energy * reactivity * 0.004 + state.pulse * 0.006, 0.005, 0.095);
    const kill = clamp(p.kill - driftMotion * 0.004 + energy * reactivity * 0.003 + state.pulse * 0.006, 0.03, 0.095);

    const dt = clamp(delta, 1 / 240, 1 / 24);
    const subDt = dt * 32;

    for (let step = 0; step < p.steps; step += 1) {
      for (let y = 0; y < state.simHeight; y += 1) {
        for (let x = 0; x < state.simWidth; x += 1) {
          const idx = y * state.simWidth + x;
          const a = state.fieldA[idx];
          const b = state.fieldB[idx];
          const reaction = a * b * b;
          const lapA = laplacian(state.fieldA, x, y, state.simWidth, state.simHeight);
          const lapB = laplacian(state.fieldB, x, y, state.simWidth, state.simHeight);

          state.nextA[idx] = clamp01(a + (p.diffA * lapA - reaction + feed * (1 - a)) * subDt);
          state.nextB[idx] = clamp01(b + (p.diffB * lapB + reaction - (kill + feed) * b) * subDt);
        }
      }
      const swapA = state.fieldA;
      const swapB = state.fieldB;
      state.fieldA = state.nextA;
      state.fieldB = state.nextB;
      state.nextA = swapA;
      state.nextB = swapB;
      state.simTime += subDt;
    }

    const image = state.imageData.data;
    const shadingStrength = era === "future" ? 0.28 : era === "8bit" ? 0.12 : 0.2;
    const audioBrightness = 1 + energy * reactivity * 0.45 + state.pulse * 0.35;

    for (let y = 0; y < state.simHeight; y += 1) {
      for (let x = 0; x < state.simWidth; x += 1) {
        const idx = y * state.simWidth + x;
        const b = state.fieldB[idx];
        const val = state.fieldA[idx] - b;
        const edge = laplacian(state.fieldB, x, y, state.simWidth, state.simHeight);
        const contour = clamp01(0.5 + edge * 3.5);

        const shaped = clamp01(Math.pow(clamp01((0.85 - val) * p.brightness * audioBrightness), p.contrast));
        let mono = clamp01(shaped + (contour - 0.5) * shadingStrength);
        if (era === "8bit") {
          mono = Math.round(mono * 4) / 4;
        } else if (era === "16bit") {
          mono = Math.round(mono * 12) / 12;
        }
        if (p.invert) {
          mono = 1 - mono;
        }

        const tint = computeEraTint(era, mono);
        const base = mono * 255;
        const mix = p.paletteMix;
        const outR = lerp(base, tint[0], mix);
        const outG = lerp(base, tint[1], mix);
        const outB = lerp(base, tint[2], mix);

        const outIdx = idx * 4;
        image[outIdx] = clamp(outR, 0, 255);
        image[outIdx + 1] = clamp(outG, 0, 255);
        image[outIdx + 2] = clamp(outB, 0, 255);
        image[outIdx + 3] = 255;
      }
    }

    state.bufferCtx.putImageData(state.imageData, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.imageSmoothingEnabled = era !== "8bit";
    const drawWidth = width * p.scale;
    const drawHeight = height * p.scale;
    const drawX = (width - drawWidth) * 0.5;
    const drawY = (height - drawHeight) * 0.5;
    ctx.drawImage(state.bufferCanvas, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    this.lastTime = time;
  }
}
