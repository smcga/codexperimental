import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type PaletteMode = "mono" | "neon" | "heat" | "era";
type RuntimeEra = "8bit" | "16bit" | "ps1" | "pcdemo" | "future";

type CellSeed = {
  baseX: number;
  baseY: number;
  phaseX: number;
  phaseY: number;
  freqX: number;
  freqY: number;
  hueBase: number;
};

const TAU = Math.PI * 2;
const DEFAULTS = {
  cellCount: 24,
  drift: 0.55,
  speed: 1,
  lineWidth: 1.5,
  lineAlpha: 0.9,
  fillAlpha: 0.7,
  contrast: 1,
  jitter: 0.12,
  paletteMode: "era" as PaletteMode,
  beatPulse: 0.55,
  shade: 0.45,
  seed: 1,
  pixelStep: 4,
  chromatic: 0.2
};

const createSeededRng = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967295;
  };
};

const resolveEra = (era?: string): RuntimeEra => {
  if (era === "8bit" || era === "16bit" || era === "ps1" || era === "pcdemo" || era === "future") {
    return era;
  }
  return "pcdemo";
};

const hslToRgb = (hue: number, saturation: number, lightness: number): [number, number, number] => {
  const h = ((hue % 360) + 360) % 360;
  const s = clamp(saturation, 0, 1);
  const l = clamp(lightness, 0, 1);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hp >= 0 && hp < 1) {
    r1 = c;
    g1 = x;
  } else if (hp < 2) {
    r1 = x;
    g1 = c;
  } else if (hp < 3) {
    g1 = c;
    b1 = x;
  } else if (hp < 4) {
    g1 = x;
    b1 = c;
  } else if (hp < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  const m = l - c / 2;
  return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
};

const resolvePaletteMode = (value: unknown): PaletteMode => {
  if (value === "mono" || value === "neon" || value === "heat" || value === "era") {
    return value;
  }
  return DEFAULTS.paletteMode;
};

export class VoronoiCellsEffect implements Effect {
  private bufferCanvas: HTMLCanvasElement | null = null;
  private bufferCtx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private pixelData: Uint8ClampedArray | null = null;
  private ownerMap = new Uint16Array(0);
  private nearestDist = new Float32Array(0);
  private seeds: CellSeed[] = [];
  private seedX = new Float32Array(0);
  private seedY = new Float32Array(0);
  private bufferWidth = 0;
  private bufferHeight = 0;
  private lastSeed = Number.NaN;
  private beatAmount = 0;

  render({ ctx, width, height, time, delta, audio, params, era }: EffectRenderContext): void {
    const activeEra = resolveEra(era);
    const eraCellMult = activeEra === "8bit" ? 0.7 : activeEra === "future" ? 1.25 : 1;
    const eraStepMult = activeEra === "8bit" ? 1.8 : activeEra === "future" ? 0.85 : 1;

    const seed = Math.round(params.seed ?? DEFAULTS.seed);
    const targetCells = Math.round(clamp((params.cellCount ?? DEFAULTS.cellCount) * eraCellMult, 6, 96));
    this.ensureSeeds(targetCells, seed);

    const pixelStep = Math.round(clamp((params.pixelStep ?? DEFAULTS.pixelStep) * eraStepMult, 2, 12));
    const gridW = Math.max(48, Math.ceil(width / pixelStep));
    const gridH = Math.max(27, Math.ceil(height / pixelStep));
    this.ensureBuffer(gridW, gridH);

    const speed = Math.max(0, params.speed ?? DEFAULTS.speed);
    const drift = clamp(params.drift ?? DEFAULTS.drift, 0, 2);
    const jitter = clamp(params.jitter ?? DEFAULTS.jitter, 0, 1.5);
    const fillAlpha = clamp(params.fillAlpha ?? DEFAULTS.fillAlpha, 0, 1);
    const lineAlpha = clamp(params.lineAlpha ?? DEFAULTS.lineAlpha, 0, 1);
    const lineWidth = Math.max(0.25, params.lineWidth ?? DEFAULTS.lineWidth);
    const beatPulse = clamp(params.beatPulse ?? DEFAULTS.beatPulse, 0, 1.5);
    const contrast = clamp(params.contrast ?? DEFAULTS.contrast, 0.4, 2.5);
    const shade = clamp(params.shade ?? DEFAULTS.shade, 0, 1);
    const chromatic = clamp(params.chromatic ?? DEFAULTS.chromatic, 0, 1);
    const paletteMode = resolvePaletteMode((params as Record<string, unknown>).paletteMode);

    const dt = clamp(delta ?? 0, 0, 0.05);
    if (audio?.beat) {
      this.beatAmount = 1;
    } else {
      this.beatAmount = Math.max(0, this.beatAmount - dt * 5);
    }

    const rms = clamp(audio?.rms ?? 0, 0, 1.4);
    const beatStrength = clamp(audio?.beatStrength ?? 0, 0, 2);
    const pulse = this.beatAmount * beatPulse * (0.75 + beatStrength * 0.25);
    const motion = speed * (1 + rms * 0.3);
    const wobbleAmp = (0.08 + drift * 0.22) * (1 + pulse * 0.15);

    for (let i = 0; i < this.seeds.length; i += 1) {
      const seedData = this.seeds[i];
      const jitterWave = Math.sin(time * (0.91 + seedData.freqX) + seedData.phaseX) * jitter;
      this.seedX[i] = seedData.baseX + Math.sin(time * motion * seedData.freqX + seedData.phaseX) * wobbleAmp + jitterWave * 0.015;
      this.seedY[i] = seedData.baseY + Math.cos(time * motion * seedData.freqY + seedData.phaseY) * wobbleAmp + jitterWave * 0.015;
    }

    this.computeOwnership(gridW, gridH);
    this.paintCells(gridW, gridH, activeEra, paletteMode, { fillAlpha, lineAlpha, contrast, shade, lineWidth, pulse, chromatic, rms });

    if (!this.bufferCanvas) {
      return;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = activeEra !== "8bit";
    ctx.globalAlpha = 1;
    ctx.drawImage(this.bufferCanvas, 0, 0, width, height);

    const edgeBoost = 1 + pulse * 0.8 + (activeEra === "16bit" ? 0.25 : 0);
    ctx.globalAlpha = clamp(lineAlpha * 0.5, 0, 1);
    ctx.lineWidth = lineWidth * edgeBoost;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.strokeRect(0, 0, width, height);
    ctx.restore();
  }

  reset(): void {
    this.beatAmount = 0;
  }

  private ensureSeeds(count: number, seed: number): void {
    if (this.seeds.length === count && this.lastSeed === seed) {
      return;
    }
    const rand = createSeededRng(seed || 1);
    this.seeds = [];
    this.seedX = new Float32Array(count);
    this.seedY = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      this.seeds.push({
        baseX: rand(),
        baseY: rand(),
        phaseX: rand() * TAU,
        phaseY: rand() * TAU,
        freqX: 0.45 + rand() * 0.95,
        freqY: 0.45 + rand() * 0.95,
        hueBase: rand() * 360
      });
    }
    this.lastSeed = seed;
  }

  private ensureBuffer(width: number, height: number): void {
    if (this.bufferCanvas && width === this.bufferWidth && height === this.bufferHeight && this.imageData && this.pixelData) {
      return;
    }
    this.bufferCanvas = document.createElement("canvas");
    this.bufferCanvas.width = width;
    this.bufferCanvas.height = height;
    this.bufferCtx = this.bufferCanvas.getContext("2d", { alpha: true });
    this.imageData = this.bufferCtx?.createImageData(width, height) ?? null;
    this.pixelData = this.imageData?.data ?? null;
    const size = width * height;
    this.ownerMap = new Uint16Array(size);
    this.nearestDist = new Float32Array(size);
    this.bufferWidth = width;
    this.bufferHeight = height;
  }

  private computeOwnership(width: number, height: number): void {
    for (let y = 0; y < height; y += 1) {
      const ny = (y + 0.5) / height;
      for (let x = 0; x < width; x += 1) {
        const nx = (x + 0.5) / width;
        let best = Number.POSITIVE_INFINITY;
        let bestIndex = 0;
        for (let i = 0; i < this.seeds.length; i += 1) {
          const dx = nx - this.seedX[i];
          const dy = ny - this.seedY[i];
          const d2 = dx * dx + dy * dy;
          if (d2 < best) {
            best = d2;
            bestIndex = i;
          }
        }
        const idx = y * width + x;
        this.ownerMap[idx] = bestIndex;
        this.nearestDist[idx] = best;
      }
    }
  }

  private paintCells(
    width: number,
    height: number,
    era: RuntimeEra,
    paletteMode: PaletteMode,
    renderStyle: {
      fillAlpha: number;
      lineAlpha: number;
      contrast: number;
      shade: number;
      lineWidth: number;
      pulse: number;
      chromatic: number;
      rms: number;
    }
  ): void {
    if (!this.pixelData || !this.imageData || !this.bufferCtx) {
      return;
    }
    const paletteLight = era === "future" ? 0.56 : era === "8bit" ? 0.44 : 0.5;
    const edgeSensitivity = 0.003 + renderStyle.lineWidth * 0.0018;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = y * width + x;
        const owner = this.ownerMap[idx];
        const seed = this.seeds[owner];
        const n = this.nearestDist[idx];

        const right = x < width - 1 ? this.ownerMap[idx + 1] : owner;
        const left = x > 0 ? this.ownerMap[idx - 1] : owner;
        const up = y > 0 ? this.ownerMap[idx - width] : owner;
        const down = y < height - 1 ? this.ownerMap[idx + width] : owner;
        const edge = owner !== right || owner !== left || owner !== up || owner !== down;

        let hue = seed.hueBase;
        if (paletteMode === "mono") {
          hue = 185 + this.seeds.length * 0.4;
        } else if (paletteMode === "heat") {
          hue = 8 + (seed.hueBase % 110);
        } else if (paletteMode === "era") {
          hue = era === "8bit" ? 135 + (seed.hueBase % 35) : era === "16bit" ? 220 + (seed.hueBase % 55) : era === "ps1" ? 275 + (seed.hueBase % 45) : era === "future" ? 320 + (seed.hueBase % 70) : 190 + (seed.hueBase % 65);
        }

        const sat = paletteMode === "mono" ? 0.1 : paletteMode === "neon" || era === "future" ? 0.85 : 0.62;
        const distShade = 1 - clamp((Math.sqrt(n) * 1.9) * (0.8 + renderStyle.shade), 0, 1);
        const band = era === "ps1" ? Math.floor(distShade * 6) / 6 : distShade;
        const light = clamp((paletteLight + band * 0.2) * renderStyle.contrast + renderStyle.pulse * 0.04, 0.08, 0.95);
        const chromaHue = hue + renderStyle.chromatic * 28 * Math.sin(seed.phaseX + n * 280);
        const [rBase, gBase, bBase] = hslToRgb(chromaHue, sat, light);

        const boundaryGlow = edge ? 0.55 + renderStyle.pulse * 0.45 : 0;
        const edgeByDistance = n < edgeSensitivity ? 1 : 0;
        const edgeMix = Math.max(boundaryGlow, edgeByDistance * renderStyle.lineAlpha);

        const alpha = clamp(renderStyle.fillAlpha + (edge ? 0.08 : 0), 0, 1);
        const outR = lerp(rBase, 245, edgeMix);
        const outG = lerp(gBase, 245, edgeMix);
        const outB = lerp(bBase, 255, edgeMix * 0.9);

        const p = idx * 4;
        this.pixelData[p] = clamp(outR + renderStyle.rms * 16, 0, 255);
        this.pixelData[p + 1] = clamp(outG + renderStyle.rms * 10, 0, 255);
        this.pixelData[p + 2] = clamp(outB + renderStyle.rms * 18, 0, 255);
        this.pixelData[p + 3] = Math.round(alpha * 255);
      }
    }

    this.bufferCtx.putImageData(this.imageData, 0, 0);
  }
}
