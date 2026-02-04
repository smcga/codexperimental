import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type TwisterTexture = "solid" | "pattern";
type TwisterBackground = "clear" | "fade";

const TAU = Math.PI * 2;
const PATTERN_WIDTH = 64;
const PATTERN_HEIGHT = 8;

const DEFAULTS = {
  baseWidth: 220,
  amplitude: 90,
  turns: 3.0,
  speed: 2.2,
  sliceH: 2,
  sat: 90,
  hueSpeed: 55,
  minWidthScale: 0.55,
  maxWidthScale: 1.0,
  minAlpha: 0.25,
  maxAlpha: 0.95,
  edgeShade: 0.35,
  trailFade: 0.08,
  audioReact: 0.7,
  beatKick: 0.7
};

const clamp01 = (value: number): number => clamp(value, 0, 1);

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveTexture = (value: unknown): TwisterTexture => (value === "pattern" ? "pattern" : "solid");

const resolveBackground = (value: unknown): TwisterBackground => (value === "fade" ? "fade" : "clear");

export class TwisterEffect implements Effect {
  private lastTimeSec = 0;
  private beatPulse = 0;
  private pattern: CanvasPattern | null = null;

  reset(): void {
    this.lastTimeSec = 0;
    this.beatPulse = 0;
  }

  private ensurePattern(ctx: CanvasRenderingContext2D): void {
    if (this.pattern || typeof document === "undefined") {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = PATTERN_WIDTH;
    canvas.height = PATTERN_HEIGHT;
    const patternCtx = canvas.getContext("2d");
    if (!patternCtx) {
      return;
    }

    for (let x = 0; x < PATTERN_WIDTH; x += 4) {
      const hue = (x / PATTERN_WIDTH) * 360;
      patternCtx.fillStyle = `hsl(${hue}, 90%, 55%)`;
      patternCtx.fillRect(x, 0, 4, PATTERN_HEIGHT);
    }

    this.pattern = ctx.createPattern(canvas, "repeat");
  }

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const paramBag = params as Record<string, unknown>;
    const texture = resolveTexture(paramBag.texture);
    const background = resolveBackground(paramBag.background);
    const sliceH = clamp(Math.round(toNumber(paramBag.sliceH, DEFAULTS.sliceH)), 1, 8);
    const sat = clamp(toNumber(paramBag.sat, DEFAULTS.sat), 0, 100);
    const minWidthScale = clamp01(toNumber(paramBag.minWidthScale, DEFAULTS.minWidthScale));
    const maxWidthScale = clamp01(toNumber(paramBag.maxWidthScale, DEFAULTS.maxWidthScale));
    const minAlpha = clamp01(toNumber(paramBag.minAlpha, DEFAULTS.minAlpha));
    const maxAlpha = clamp01(toNumber(paramBag.maxAlpha, DEFAULTS.maxAlpha));
    const edgeShade = clamp01(toNumber(paramBag.edgeShade, DEFAULTS.edgeShade));
    const trailFade = clamp01(toNumber(paramBag.trailFade, DEFAULTS.trailFade));
    const audioReact = clamp01(toNumber(paramBag.audioReact, DEFAULTS.audioReact));
    const beatKick = clamp01(toNumber(paramBag.beatKick, DEFAULTS.beatKick));

    const rawX = toNumber(paramBag.x, width / 2);
    const centerX = rawX >= 0 && rawX <= 1 ? rawX * width : rawX;
    const baseWidthParam = Math.max(10, toNumber(paramBag.baseWidth, DEFAULTS.baseWidth));
    const amplitudeParam = Math.max(0, toNumber(paramBag.amplitude, DEFAULTS.amplitude));
    const turnsParam = Math.max(0.1, toNumber(paramBag.turns, DEFAULTS.turns));
    const speedParam = Math.max(0, toNumber(paramBag.speed, DEFAULTS.speed));
    const hueSpeedParam = Math.max(0, toNumber(paramBag.hueSpeed, DEFAULTS.hueSpeed));

    let dt = typeof delta === "number" && Number.isFinite(delta) ? delta : 0;
    if (dt <= 0) {
      dt = this.lastTimeSec ? time - this.lastTimeSec : 0;
    }
    dt = clamp(dt, 0, 0.05);
    this.lastTimeSec = time;

    const bass =
      ((audio as { bands?: { bass?: number } }).bands?.bass ?? audio?.bass ?? 0) *
      audioReact;
    const rms = (audio?.rms ?? 0) * audioReact;
    const beat = audio?.beat ?? false;
    const energy = clamp01(bass + rms);

    if (beat) {
      this.beatPulse = 1;
    } else {
      this.beatPulse = Math.max(0, this.beatPulse - dt * 6);
    }

    const kick = this.beatPulse * beatKick;
    const kickBoost = 1 + kick * 0.3;
    const baseWidth = baseWidthParam * (1 + bass * 0.25 + kick * 0.12);
    const amplitude = amplitudeParam * (1 + bass * 0.35 + kick * 0.2);
    const turns = turnsParam * (1 + kick * 0.2);
    const speed = speedParam * (1 + kick * 0.4);
    const hueSpeed = hueSpeedParam * (1 + kick * 0.6);
    const brightnessBoost = energy * 6 + kick * 12;

    if (background === "fade") {
      ctx.fillStyle = `rgba(0, 0, 0, ${trailFade})`;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);
    }

    if (texture === "pattern") {
      this.ensurePattern(ctx);
    }
    const pattern = texture === "pattern" ? this.pattern : null;

    for (let y = 0; y < height; y += sliceH) {
      const t = y / height;
      const angle = time * speed + t * turns * TAU;
      const xOffset = Math.sin(angle) * amplitude;
      const depth = Math.cos(angle) * 0.5 + 0.5;
      const widthScale = lerp(minWidthScale, maxWidthScale, depth) * kickBoost;
      const widthSlice = baseWidth * widthScale;
      const alphaSlice = lerp(minAlpha, maxAlpha, depth);
      const x = centerX + xOffset - widthSlice / 2;

      if (pattern) {
        const shift = (angle / TAU) * PATTERN_WIDTH + time * 6;
        ctx.save();
        ctx.translate(centerX + xOffset, y);
        ctx.translate(-shift, 0);
        ctx.globalAlpha = alphaSlice;
        ctx.fillStyle = pattern;
        ctx.fillRect(-widthSlice / 2 + shift, 0, widthSlice, sliceH);
        ctx.restore();
      } else {
        const hue = (time * hueSpeed + angle * (180 / Math.PI)) % 360;
        const lightness = clamp(35 + (65 - 35) * depth + brightnessBoost, 15, 85);
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lightness}%, ${alphaSlice})`;
        ctx.fillRect(x, y, widthSlice, sliceH);
      }

      if (edgeShade > 0) {
        const edgeWidth = Math.max(1, widthSlice * 0.08);
        const edgeAlpha = alphaSlice * edgeShade;
        ctx.fillStyle = `rgba(0, 0, 0, ${edgeAlpha})`;
        ctx.fillRect(x, y, edgeWidth, sliceH);
        ctx.fillRect(x + widthSlice - edgeWidth, y, edgeWidth, sliceH);
      }
    }
  }
}
