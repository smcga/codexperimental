import { clamp } from "../../util/math";
import { DoodleRecord, fetchDoodles, getCachedDoodles } from "../../doodles";
import { Effect, EffectRenderContext } from "./types";
import { GREETS_WALL_DEFAULTS, resolveGreetsSequenceIndex } from "./greetsWall";

export const DOODLE_GREETZ_WALL_DEFAULTS = {
  layout: GREETS_WALL_DEFAULTS.layout,
  transitionStyle: GREETS_WALL_DEFAULTS.transitionStyle,
  cycleSeconds: GREETS_WALL_DEFAULTS.cycleSeconds,
  columns: GREETS_WALL_DEFAULTS.columns,
  padding: GREETS_WALL_DEFAULTS.padding,
  highlightPulse: GREETS_WALL_DEFAULTS.highlightPulse,
  beatPulseDecay: GREETS_WALL_DEFAULTS.beatPulseDecay,
  audioReact: GREETS_WALL_DEFAULTS.audioReact,
  title: "DOODLE GREETZ WALL"
};

export type DoodleGreetzWallParams = {
  layout: "grid" | "carousel";
  transitionStyle: "slide" | "fade" | "pop";
  cycleSeconds: number;
  columns: number;
  padding: number;
  highlightPulse: number;
  beatPulseDecay: number;
  audioReact: number;
  title: string;
};

const asNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const asText = (value: unknown, fallback: string): string => (typeof value === "string" && value.length > 0 ? value : fallback);

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function normalizeDoodleGreetzWallParams(params: Record<string, unknown>): DoodleGreetzWallParams {
  const layout = params.layout === "carousel" || params.layout === "grid" ? params.layout : DOODLE_GREETZ_WALL_DEFAULTS.layout;
  const transitionStyle =
    params.transitionStyle === "fade" || params.transitionStyle === "pop" || params.transitionStyle === "slide"
      ? params.transitionStyle
      : DOODLE_GREETZ_WALL_DEFAULTS.transitionStyle;

  return {
    layout,
    transitionStyle,
    cycleSeconds: clamp(asNumber(params.cycleSeconds, DOODLE_GREETZ_WALL_DEFAULTS.cycleSeconds), 0.35, 10),
    columns: Math.round(clamp(asNumber(params.columns, DOODLE_GREETZ_WALL_DEFAULTS.columns), 1, 8)),
    padding: clamp(asNumber(params.padding, DOODLE_GREETZ_WALL_DEFAULTS.padding), 0.02, 0.18),
    highlightPulse: clamp(asNumber(params.highlightPulse, DOODLE_GREETZ_WALL_DEFAULTS.highlightPulse), 0, 1.5),
    beatPulseDecay: clamp(asNumber(params.beatPulseDecay, DOODLE_GREETZ_WALL_DEFAULTS.beatPulseDecay), 0.2, 8),
    audioReact: clamp(asNumber(params.audioReact, DOODLE_GREETZ_WALL_DEFAULTS.audioReact), 0, 1),
    title: asText(params.title, DOODLE_GREETZ_WALL_DEFAULTS.title)
  };
}

export function orderDoodlesForWall(doodles: DoodleRecord[]): DoodleRecord[] {
  return [...doodles].sort((left, right) => {
    const diff = hashString(left.id) - hashString(right.id);
    if (diff !== 0) {
      return diff;
    }
    return left.createdAt - right.createdAt;
  });
}

export class DoodleGreetzWallEffect implements Effect {
  private beatPulse = 0;
  private requestedDoodles = false;
  private imageCache = new Map<string, HTMLImageElement>();

  reset(): void {
    this.beatPulse = 0;
    this.requestedDoodles = false;
  }

  private requestDoodles(): void {
    if (this.requestedDoodles) {
      return;
    }
    this.requestedDoodles = true;
    void fetchDoodles(true).finally(() => {
      this.requestedDoodles = false;
    });
  }

  private getImage(src: string): HTMLImageElement | null {
    const cached = this.imageCache.get(src);
    if (cached) {
      return cached.complete ? cached : null;
    }

    const image = new Image();
    image.decoding = "async";
    image.src = src;
    this.imageCache.set(src, image);
    return null;
  }

  private drawDoodleCard(
    ctx: CanvasRenderingContext2D,
    doodle: DoodleRecord,
    x: number,
    y: number,
    w: number,
    h: number,
    alpha: number,
    scale = 1
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    const radius = Math.max(10, Math.min(w, h) * 0.08);
    ctx.fillStyle = "rgba(8, 12, 24, 0.92)";
    ctx.strokeStyle = "rgba(142, 249, 255, 0.55)";
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.02);
    ctx.beginPath();
    ctx.roundRect(-w * 0.5, -h * 0.5, w, h, radius);
    ctx.fill();
    ctx.stroke();

    const image = this.getImage(doodle.imageData);
    if (image) {
      const inset = Math.min(w, h) * 0.08;
      const drawW = w - inset * 2;
      const drawH = h - inset * 2;
      const imageAspect = image.width > 0 && image.height > 0 ? image.width / image.height : 16 / 9;
      let fitW = drawW;
      let fitH = drawW / imageAspect;
      if (fitH > drawH) {
        fitH = drawH;
        fitW = drawH * imageAspect;
      }
      ctx.drawImage(image, -fitW * 0.5, -fitH * 0.5, fitW, fitH);
    } else {
      ctx.fillStyle = "rgba(181, 200, 255, 0.65)";
      ctx.font = `${Math.round(Math.max(12, h * 0.11))}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Loading doodle…", 0, 0);
    }

    ctx.restore();
  }

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const resolved = normalizeDoodleGreetzWallParams(params as Record<string, unknown>);
    const dt = clamp(delta, 0, 0.06);

    this.beatPulse = audio.beat
      ? 1
      : Math.max(0, this.beatPulse - dt * resolved.beatPulseDecay * (1 + audio.impactStrength * 1.5));

    const orderedDoodles = orderDoodlesForWall(getCachedDoodles());
    if (orderedDoodles.length === 0) {
      this.requestDoodles();
    }

    ctx.fillStyle = "#05070f";
    ctx.fillRect(0, 0, width, height);

    const pulse = this.beatPulse * resolved.highlightPulse + audio.rms * resolved.audioReact;
    ctx.save();
    ctx.fillStyle = `rgba(120, 170, 255, ${0.05 + pulse * 0.25})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    ctx.fillStyle = "#b5c8ff";
    ctx.font = `${Math.round(Math.max(14, height * 0.045))}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(resolved.title, width * 0.5, height * 0.12);

    if (orderedDoodles.length === 0) {
      ctx.fillStyle = "rgba(232, 247, 255, 0.88)";
      ctx.font = `${Math.round(Math.max(18, height * 0.05))}px monospace`;
      ctx.fillText("ADD A DOODLE TO FILL THE WALL", width * 0.5, height * 0.5);
      ctx.font = `${Math.round(Math.max(13, height * 0.03))}px monospace`;
      ctx.fillStyle = "rgba(232, 247, 255, 0.62)";
      ctx.fillText("Submitted doodles will appear here.", width * 0.5, height * 0.58);
      return;
    }

    const count = orderedDoodles.length;
    const index = resolveGreetsSequenceIndex(time, resolved.cycleSeconds, count);
    const cycleProgress = ((time % resolved.cycleSeconds) + resolved.cycleSeconds) % resolved.cycleSeconds / resolved.cycleSeconds;

    if (resolved.layout === "carousel") {
      const centerX = width * 0.5;
      const centerY = height * 0.6;
      const radius = Math.min(width, height) * 0.24;
      const visibleCount = Math.min(5, count);
      const half = Math.floor(visibleCount / 2);
      const cardW = width * 0.22;
      const cardH = cardW * 0.75;

      for (let offset = -half; offset <= half; offset += 1) {
        const itemIndex = (index + offset + count) % count;
        const angle = (offset / Math.max(1, half)) * Math.PI * 0.55;
        const x = centerX + Math.sin(angle) * radius;
        const depth = (Math.cos(angle) + 1) * 0.5;
        const y = centerY + (1 - depth) * 32;
        const focus = offset === 0 ? 1 : 0;
        const fade = resolved.transitionStyle === "fade" ? 1 - Math.abs(offset) / (half + 1) : 1;
        const popScale = resolved.transitionStyle === "pop" && focus > 0 ? 1 + (1 - cycleProgress) * 0.08 : 1;
        const slideX = resolved.transitionStyle === "slide" ? (cycleProgress - 0.5) * offset * 18 : 0;
        const alpha = clamp(0.18 + depth * 0.74 + focus * pulse * 0.18, 0.08, 1) * fade;

        this.drawDoodleCard(ctx, orderedDoodles[itemIndex], x + slideX, y, cardW, cardH, alpha, 0.82 + depth * 0.42 * popScale);
      }
      return;
    }

    const columns = Math.min(resolved.columns, count);
    const rows = Math.ceil(count / columns);
    const contentWidth = width * (1 - resolved.padding * 2);
    const contentHeight = height * 0.68;
    const startX = width * resolved.padding;
    const startY = height * 0.2;
    const cellW = contentWidth / columns;
    const cellH = contentHeight / rows;

    for (let i = 0; i < count; i += 1) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = startX + col * cellW + cellW * 0.5;
      const y = startY + row * cellH + cellH * 0.5;
      const highlight = i === index ? 1 : 0;
      const fadeBoost = resolved.transitionStyle === "fade" ? 1 - cycleProgress * 0.35 : 1;
      const slideOffset = resolved.transitionStyle === "slide" && highlight > 0 ? (1 - cycleProgress) * 18 : 0;
      const popScale = resolved.transitionStyle === "pop" && highlight > 0 ? 1 + (1 - cycleProgress) * 0.18 : 1;
      const alpha = clamp((0.52 + highlight * (0.24 + pulse * 0.24)) * fadeBoost, 0.2, 1);

      this.drawDoodleCard(
        ctx,
        orderedDoodles[i],
        x + slideOffset,
        y,
        cellW * 0.88,
        cellH * 0.82,
        alpha,
        popScale
      );
    }
  }
}
