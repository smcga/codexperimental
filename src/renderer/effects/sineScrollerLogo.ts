import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type LogoCache = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  text: string;
  fontSize: number;
};

const DEFAULTS = {
  message: "    GREETZ TO EVERYONE WATCHING THIS RUN LIVE...    ",
  fontSize: 22,
  speed: 90,
  waveAmp: 10,
  waveSpeed: 2.2,
  wavePhaseStep: 0.55,
  scrollerY: null as number | null,
  scrollerX: 0,
  layer2: false,
  layer2Speed: -45,
  layer2FontSize: 16,
  layer2Y: null as number | null,
  logoText: "SMCGA",
  logoFontSize: 96,
  logoY: 52,
  scanlineStep: 2,
  logoWaveAmp: 18,
  logoWaveSpeed: 2.0,
  logoWaveFreq: 0.06,
  audioReact: 0.7,
  beatBoost: 0.6
};

const MAIN_COLOR = "#6df6ff";
const SHADOW_COLOR = "#0c1f33";
const LAYER2_COLOR = "#f5c542";
const LAYER2_SHADOW = "#3b2505";

const getStringParam = (value: unknown, fallback: string): string => (typeof value === "string" ? value : fallback);

const wrapIndex = (index: number, length: number): number => {
  if (length === 0) {
    return 0;
  }
  const mod = index % length;
  return mod < 0 ? mod + length : mod;
};

export class SineScrollerLogoEffect implements Effect {
  private scrollX = 0;
  private scrollX2 = 0;
  private beatPulse = 0;
  private glyphAdvance = 0;
  private glyphAdvance2 = 0;
  private lastFontSize = 0;
  private lastFontSize2 = 0;
  private logoCache: LogoCache | null = null;

  reset(): void {
    this.scrollX = 0;
    this.scrollX2 = 0;
    this.beatPulse = 0;
  }

  private ensureLogoCanvas(width: number, fontSize: number, text: string): LogoCache | null {
    if (typeof document === "undefined") {
      return null;
    }

    const logoWidth = Math.max(120, Math.floor(width * 0.9));
    const logoHeight = Math.max(80, Math.round(fontSize * 1.4));

    if (
      this.logoCache &&
      this.logoCache.width === logoWidth &&
      this.logoCache.height === logoHeight &&
      this.logoCache.text === text &&
      this.logoCache.fontSize === fontSize
    ) {
      return this.logoCache;
    }

    const canvas = this.logoCache?.canvas ?? document.createElement("canvas");
    canvas.width = logoWidth;
    canvas.height = logoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    ctx.clearRect(0, 0, logoWidth, logoHeight);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${fontSize}px monospace`;

    const gradient = ctx.createLinearGradient(0, 0, 0, logoHeight);
    gradient.addColorStop(0, "#fef3a3");
    gradient.addColorStop(0.5, "#ff6ad5");
    gradient.addColorStop(1, "#4be4ff");
    ctx.fillStyle = gradient;
    ctx.shadowColor = "#071326";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.fillText(text, logoWidth / 2, logoHeight / 2);
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.05));
    ctx.strokeStyle = "rgba(5, 8, 18, 0.9)";
    ctx.strokeText(text, logoWidth / 2, logoHeight / 2);

    this.logoCache = {
      canvas,
      ctx,
      width: logoWidth,
      height: logoHeight,
      text,
      fontSize
    };

    return this.logoCache;
  }

  private measureGlyphAdvance(ctx: CanvasRenderingContext2D, fontSize: number): number {
    ctx.font = `${fontSize}px monospace`;
    const metrics = ctx.measureText("M");
    return metrics.width || fontSize * 0.62;
  }

  private drawScroller(
    ctx: CanvasRenderingContext2D,
    width: number,
    message: string,
    baseX: number,
    baseY: number,
    glyphAdvance: number,
    time: number,
    waveSpeed: number,
    waveAmp: number,
    wavePhaseStep: number
  ): void {
    if (!message.length || glyphAdvance <= 0) {
      return;
    }

    const offset = ((this.scrollX % glyphAdvance) + glyphAdvance) % glyphAdvance;
    const firstIndex = Math.floor(this.scrollX / glyphAdvance);
    const visibleCount = Math.ceil((width - baseX) / glyphAdvance) + 3;

    for (let i = 0; i < visibleCount; i += 1) {
      const charIndex = wrapIndex(firstIndex + i, message.length);
      const x = baseX + i * glyphAdvance - offset;
      const y = baseY + Math.sin(time * waveSpeed + i * wavePhaseStep) * waveAmp;
      ctx.fillText(message[charIndex], x, y);
    }
  }

  private drawScrollerWithShadow(
    ctx: CanvasRenderingContext2D,
    width: number,
    message: string,
    baseX: number,
    baseY: number,
    glyphAdvance: number,
    time: number,
    waveSpeed: number,
    waveAmp: number,
    wavePhaseStep: number,
    shadowOffset: number
  ): void {
    if (!message.length || glyphAdvance <= 0) {
      return;
    }

    const offset = ((this.scrollX % glyphAdvance) + glyphAdvance) % glyphAdvance;
    const firstIndex = Math.floor(this.scrollX / glyphAdvance);
    const visibleCount = Math.ceil((width - baseX) / glyphAdvance) + 3;

    for (let i = 0; i < visibleCount; i += 1) {
      const charIndex = wrapIndex(firstIndex + i, message.length);
      const x = baseX + i * glyphAdvance - offset;
      const y = baseY + Math.sin(time * waveSpeed + i * wavePhaseStep) * waveAmp;
      ctx.fillText(message[charIndex], x + shadowOffset, y + shadowOffset);
    }
  }

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const dt = clamp(delta, 0, 0.05);
    const audioReact = clamp(params.audioReact ?? DEFAULTS.audioReact, 0, 1);
    const beatBoost = clamp(params.beatBoost ?? DEFAULTS.beatBoost, 0, 1);

    if (audio.beat) {
      this.beatPulse = 1;
    } else {
      this.beatPulse = Math.max(0, this.beatPulse - dt * 6);
    }

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    const logoText = getStringParam(params.logoText, DEFAULTS.logoText);
    const logoFontSize = params.logoFontSize ?? DEFAULTS.logoFontSize;
    const logoY = params.logoY ?? DEFAULTS.logoY;
    const scanlineStep = clamp(Math.round(params.scanlineStep ?? DEFAULTS.scanlineStep), 1, 6);

    const logoCache = this.ensureLogoCanvas(width, logoFontSize, logoText);
    if (logoCache) {
      const logoWaveBase = params.logoWaveAmp ?? DEFAULTS.logoWaveAmp;
      const logoWaveSpeed = params.logoWaveSpeed ?? DEFAULTS.logoWaveSpeed;
      const logoWaveFreq = params.logoWaveFreq ?? DEFAULTS.logoWaveFreq;
      const logoWaveAmp = logoWaveBase * (1 + audio.bass * audioReact * 0.6 + this.beatPulse * beatBoost);

      const logoX = (width - logoCache.width) / 2;
      ctx.save();
      ctx.globalAlpha = clamp(0.85 + audio.rms * audioReact * 0.3 + this.beatPulse * beatBoost * 0.2, 0.6, 1);

      for (let y = 0; y < logoCache.height; y += scanlineStep) {
        const primary = Math.sin(time * logoWaveSpeed + y * logoWaveFreq) * logoWaveAmp;
        const secondary = Math.sin(time * 2.1 + y * 0.07) * (logoWaveAmp * 0.35);
        const xOffset = primary + secondary;
        ctx.drawImage(
          logoCache.canvas,
          0,
          y,
          logoCache.width,
          scanlineStep,
          logoX + xOffset,
          logoY + y,
          logoCache.width,
          scanlineStep
        );
      }

      ctx.restore();
    }

    const message = getStringParam(params.message, DEFAULTS.message);
    if (!message.length) {
      return;
    }

    const fontSize = params.fontSize ?? DEFAULTS.fontSize;
    if (fontSize !== this.lastFontSize || this.glyphAdvance <= 0) {
      this.glyphAdvance = this.measureGlyphAdvance(ctx, fontSize);
      this.lastFontSize = fontSize;
    }

    const speed = params.speed ?? DEFAULTS.speed;
    this.scrollX -= speed * dt;
    const messageWidth = message.length * this.glyphAdvance;
    if (messageWidth > 0) {
      if (this.scrollX <= -messageWidth) {
        this.scrollX += messageWidth;
      } else if (this.scrollX >= messageWidth) {
        this.scrollX -= messageWidth;
      }
    }

    const waveAmp = (params.waveAmp ?? DEFAULTS.waveAmp) * (1 + audio.bass * audioReact * 0.5 + this.beatPulse * beatBoost * 0.35);
    const waveSpeed = params.waveSpeed ?? DEFAULTS.waveSpeed;
    const wavePhaseStep = params.wavePhaseStep ?? DEFAULTS.wavePhaseStep;
    const scrollerX = params.scrollerX ?? DEFAULTS.scrollerX;
    const scrollerY = params.scrollerY ?? (height - 48);

    ctx.save();
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    const mainAlpha = clamp(0.8 + audio.rms * audioReact * 0.4 + this.beatPulse * beatBoost * 0.25, 0.5, 1);
    ctx.globalAlpha = mainAlpha * 0.6;
    ctx.fillStyle = SHADOW_COLOR;
    this.drawScrollerWithShadow(ctx, width, message, scrollerX, scrollerY, this.glyphAdvance, time, waveSpeed, waveAmp, wavePhaseStep, 2);

    ctx.globalAlpha = mainAlpha;
    ctx.fillStyle = MAIN_COLOR;
    this.drawScroller(ctx, width, message, scrollerX, scrollerY, this.glyphAdvance, time, waveSpeed, waveAmp, wavePhaseStep);
    ctx.restore();

    if (params.layer2 ?? DEFAULTS.layer2) {
      const layer2FontSize = params.layer2FontSize ?? DEFAULTS.layer2FontSize;
      if (layer2FontSize !== this.lastFontSize2 || this.glyphAdvance2 <= 0) {
        this.glyphAdvance2 = this.measureGlyphAdvance(ctx, layer2FontSize);
        this.lastFontSize2 = layer2FontSize;
      }

      const layer2Speed = params.layer2Speed ?? DEFAULTS.layer2Speed;
      this.scrollX2 -= layer2Speed * dt;
      const layer2MessageWidth = message.length * this.glyphAdvance2;
      if (layer2MessageWidth > 0) {
        if (this.scrollX2 <= -layer2MessageWidth) {
          this.scrollX2 += layer2MessageWidth;
        } else if (this.scrollX2 >= layer2MessageWidth) {
          this.scrollX2 -= layer2MessageWidth;
        }
      }

      const layer2Y = params.layer2Y ?? (height - 76);
      const layer2WaveAmp = waveAmp * 0.65;
      const layer2Phase = wavePhaseStep * 0.9;

      ctx.save();
      ctx.font = `${layer2FontSize}px monospace`;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.globalAlpha = mainAlpha * 0.5;
      ctx.fillStyle = LAYER2_SHADOW;

      const offset2 = ((this.scrollX2 % this.glyphAdvance2) + this.glyphAdvance2) % this.glyphAdvance2;
      const firstIndex2 = Math.floor(this.scrollX2 / this.glyphAdvance2);
      const visibleCount2 = Math.ceil((width - scrollerX) / this.glyphAdvance2) + 3;

      for (let i = 0; i < visibleCount2; i += 1) {
        const charIndex = wrapIndex(firstIndex2 + i, message.length);
        const x = scrollerX + i * this.glyphAdvance2 - offset2;
        const y = layer2Y + Math.sin(time * (waveSpeed * 0.8) + i * layer2Phase) * layer2WaveAmp;
        ctx.fillText(message[charIndex], x + 2, y + 2);
      }

      ctx.globalAlpha = mainAlpha * 0.8;
      ctx.fillStyle = LAYER2_COLOR;
      for (let i = 0; i < visibleCount2; i += 1) {
        const charIndex = wrapIndex(firstIndex2 + i, message.length);
        const x = scrollerX + i * this.glyphAdvance2 - offset2;
        const y = layer2Y + Math.sin(time * (waveSpeed * 0.8) + i * layer2Phase) * layer2WaveAmp;
        ctx.fillText(message[charIndex], x, y);
      }

      ctx.restore();
    }
  }
}
