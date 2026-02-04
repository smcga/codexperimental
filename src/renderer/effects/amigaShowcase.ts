import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type BobState = {
  phaseX: number;
  phaseY: number;
  speedX: number;
  speedY: number;
  radius: number;
};

export const hashUnit = (value: number): number => {
  const hashed = Math.sin(value) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

const resolveNumberParam = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveBooleanParam = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return fallback;
};

export const resolveTwistX = (value: unknown, width: number, fallback: number): number => {
  const resolved = resolveNumberParam(value, fallback);
  if (Math.abs(resolved) <= 1) {
    return width * resolved;
  }
  return resolved;
};

const BASE_GLENZ_VERTS = new Float32Array([
  -1, -1, -1,
  1, -1, -1,
  1, 1, -1,
  -1, 1, -1,
  -1, -1, 1,
  1, -1, 1,
  1, 1, 1,
  -1, 1, 1
]);

const GLENZ_EDGES = [
  0, 1, 1, 2, 2, 3, 3, 0,
  4, 5, 5, 6, 6, 7, 7, 4,
  0, 4, 1, 5, 2, 6, 3, 7
];

const BEAT_PULSE_DECAY = 2.4;

export class AmigaShowcaseEffect implements Effect {
  private barsCanvas: HTMLCanvasElement;
  private barsCtx: CanvasRenderingContext2D;
  private shadeCanvas: HTMLCanvasElement;
  private shadeCtx: CanvasRenderingContext2D;
  private bobs: BobState[] = [];
  private bobCount = 0;
  private beatPulse = 0;
  private lastWidth = 0;
  private lastHeight = 0;
  private glenzProjected = new Float32Array(16);

  constructor() {
    this.barsCanvas = document.createElement("canvas");
    const barsCtx = this.barsCanvas.getContext("2d");
    if (!barsCtx) {
      throw new Error("Unable to create amiga showcase bars canvas");
    }
    this.barsCtx = barsCtx;

    this.shadeCanvas = document.createElement("canvas");
    const shadeCtx = this.shadeCanvas.getContext("2d");
    if (!shadeCtx) {
      throw new Error("Unable to create amiga showcase shade canvas");
    }
    this.shadeCtx = shadeCtx;
  }

  private ensureCanvases(width: number, height: number): void {
    if (width === this.lastWidth && height === this.lastHeight) {
      return;
    }
    this.lastWidth = width;
    this.lastHeight = height;
    this.barsCanvas.width = width;
    this.barsCanvas.height = height;
    this.shadeCanvas.width = width;
    this.shadeCanvas.height = height;
  }

  private ensureBobs(count: number): void {
    if (count === this.bobCount) {
      return;
    }
    this.bobCount = count;
    this.bobs = Array.from({ length: count }, (_, index) => {
      const base = index + 1;
      return {
        phaseX: hashUnit(base * 2.13) * Math.PI * 2,
        phaseY: hashUnit(base * 3.77) * Math.PI * 2,
        speedX: 0.6 + hashUnit(base * 4.19) * 1.4,
        speedY: 0.5 + hashUnit(base * 5.61) * 1.2,
        radius: 0.75 + hashUnit(base * 7.03) * 0.6
      };
    });
  }

  private drawCopperbars(
    width: number,
    height: number,
    time: number,
    barCount: number,
    barSpeed: number,
    barWaveAmp: number,
    barWaveFreq: number,
    barSaturation: number
  ): void {
    const ctx = this.barsCtx;
    const step = 2;
    const saturation = clamp(barSaturation, 0, 1) * 100;
    const bandHeight = height / barCount;

    ctx.clearRect(0, 0, width, height);

    for (let y = 0; y < height; y += step) {
      const p = y / height;
      const wave = barWaveAmp * Math.sin(time * barSpeed * 2 + p * barWaveFreq * 8);
      const band = Math.floor((y + wave) / bandHeight);
      const hue = (band * 28 + time * 40 + Math.sin(p * 6 + time) * 20) % 360;
      const light = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(p * 10 + time * 1.4));
      const lightness = clamp(light, 0, 1) * 100;
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.fillRect(0, y, width, step);
    }
  }

  private drawShadeBobs(
    width: number,
    height: number,
    time: number,
    audioBoost: number,
    baseRadius: number,
    trail: number,
    intensity: number
  ): void {
    const ctx = this.shadeCtx;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(0, 0, 0, ${trail})`;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";

    const centerX = width * 0.5;
    const centerY = height * 0.5;

    for (let i = 0; i < this.bobs.length; i += 1) {
      const bob = this.bobs[i];
      const x = centerX + Math.sin(time * bob.speedX + bob.phaseX) * width * 0.35;
      const y = centerY + Math.sin(time * bob.speedY + bob.phaseY) * height * 0.22;
      const wobble = 1 + 0.25 * Math.sin(time * 2 + bob.phaseX);
      const radius = baseRadius * bob.radius * wobble * audioBoost;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const coreAlpha = clamp(0.45 + intensity * 0.55, 0, 1);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
  }

  private drawTwister(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    twistX: number,
    twistWidth: number,
    twistAmp: number,
    twistSpeed: number,
    twistSlices: number,
    twistHueSpeed: number,
    intensity: number
  ): void {
    const sliceHeight = height / twistSlices;
    const amp = twistAmp * (1 + intensity * 0.25);

    for (let i = 0; i < twistSlices; i += 1) {
      const t = twistSlices <= 1 ? 0 : i / (twistSlices - 1);
      const y = t * height;
      const angle = time * twistSpeed * 2 + t * Math.PI * 4;
      const xOff = Math.sin(angle) * amp;
      const z = Math.cos(angle);
      const depth = z * 0.5 + 0.5;
      const sliceW = twistWidth * (0.55 + 0.45 * depth);
      const alpha = 0.35 + 0.55 * depth;
      const hue = (t * 180 + time * twistHueSpeed) % 360;
      ctx.fillStyle = `hsla(${hue}, 90%, 55%, ${alpha})`;
      ctx.fillRect(twistX + xOff - sliceW / 2, y, sliceW, sliceHeight + 1);
    }
  }

  private drawGlenz(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    intensity: number
  ): void {
    const scale = Math.min(width, height) * 0.22;
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const rotationSpeed = 0.45 + intensity * 0.65;
    const angleY = time * rotationSpeed;
    const angleX = time * (rotationSpeed * 0.7);
    const angleZ = time * (rotationSpeed * 0.45);
    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    const cosZ = Math.cos(angleZ);
    const sinZ = Math.sin(angleZ);
    const depthOffset = 3.2;

    for (let i = 0; i < BASE_GLENZ_VERTS.length; i += 3) {
      const x = BASE_GLENZ_VERTS[i];
      const y = BASE_GLENZ_VERTS[i + 1];
      const z = BASE_GLENZ_VERTS[i + 2];

      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;
      const x2 = x1 * cosZ - y1 * sinZ;
      const y2 = x1 * sinZ + y1 * cosZ;

      const perspective = scale / (z2 + depthOffset);
      const px = centerX + x2 * perspective;
      const py = centerY + y2 * perspective;
      const index = (i / 3) * 2;
      this.glenzProjected[index] = px;
      this.glenzProjected[index + 1] = py;
    }

    const alpha = clamp(0.15 + intensity * 0.35, 0, 0.6);
    const hue = (time * 40) % 360;
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = `hsla(${hue}, 70%, 75%, ${alpha})`;
    ctx.beginPath();
    for (let i = 0; i < GLENZ_EDGES.length; i += 2) {
      const a = GLENZ_EDGES[i] * 2;
      const b = GLENZ_EDGES[i + 1] * 2;
      ctx.moveTo(this.glenzProjected[a], this.glenzProjected[a + 1]);
      ctx.lineTo(this.glenzProjected[b], this.glenzProjected[b + 1]);
    }
    ctx.stroke();
  }

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    this.ensureCanvases(width, height);
    const rawParams = params as Record<string, unknown>;
    const audioReact = clamp(resolveNumberParam(rawParams.audioReact, 0.7), 0, 1);

    const barCount = clamp(Math.round(resolveNumberParam(rawParams.barCount, 8)), 2, 24);
    const barSpeed = Math.max(0, resolveNumberParam(rawParams.barSpeed, 0.9));
    const barWaveAmp = resolveNumberParam(rawParams.barWaveAmp, 18);
    const barWaveFreq = resolveNumberParam(rawParams.barWaveFreq, 1.2);
    const barSaturation = resolveNumberParam(rawParams.barSaturation, 0.85);

    const bobCount = clamp(Math.round(resolveNumberParam(rawParams.bobCount, 6)), 1, 16);
    const bobRadius = clamp(resolveNumberParam(rawParams.bobRadius, 0.12), 0.05, 0.3);
    const bobTrail = clamp(resolveNumberParam(rawParams.bobTrail, 0.18), 0.05, 0.45);
    const bobIntensity = clamp(resolveNumberParam(rawParams.bobIntensity, 1.0), 0.2, 2.5);

    const twistWidth = resolveNumberParam(rawParams.twistWidth, 180);
    const twistAmp = resolveNumberParam(rawParams.twistAmp, 70);
    const twistSpeed = Math.max(0, resolveNumberParam(rawParams.twistSpeed, 1.1));
    const twistSlices = clamp(Math.round(resolveNumberParam(rawParams.twistSlices, 120)), 60, 220);
    const twistHueSpeed = resolveNumberParam(rawParams.twistHueSpeed, 55);
    const twistX = resolveTwistX(rawParams.twistX, width, width * 0.5);

    const glenzEnabled = resolveBooleanParam(rawParams.glenz, true);

    const dt = Math.min(delta, 0.05);
    if (audio.beat) {
      this.beatPulse = 1;
    } else {
      this.beatPulse = Math.max(0, this.beatPulse - dt * BEAT_PULSE_DECAY);
    }

    this.ensureBobs(bobCount);

    const intensity = clamp((audio.rms + audio.bass * 0.6) * audioReact + this.beatPulse * 0.6, 0, 1.5);
    const baseRadius = Math.min(width, height) * bobRadius;
    const shadeBoost = 1 + audio.bass * audioReact * 0.8 + this.beatPulse * 0.35;

    this.drawCopperbars(width, height, time, barCount, barSpeed, barWaveAmp, barWaveFreq, barSaturation);
    this.drawShadeBobs(width, height, time, shadeBoost, baseRadius, bobTrail, bobIntensity * intensity);

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(this.barsCanvas, 0, 0, width, height);
    this.drawTwister(
      ctx,
      width,
      height,
      time,
      twistX,
      twistWidth,
      twistAmp,
      twistSpeed,
      twistSlices,
      twistHueSpeed,
      intensity
    );
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(this.shadeCanvas, 0, 0, width, height);
    if (glenzEnabled) {
      this.drawGlenz(ctx, width, height, time, intensity + this.beatPulse * 0.4);
    }
    ctx.restore();
  }

  reset(): void {
    this.beatPulse = 0;
    this.bobCount = 0;
    this.bobs = [];
    this.shadeCtx.clearRect(0, 0, this.shadeCanvas.width, this.shadeCanvas.height);
  }
}
