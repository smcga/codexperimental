import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const GREETS_WALL_DEFAULTS = {
  names: "Fairlight|TRSI|Spaceballs|CNCD|Mercury|TBL",
  layout: "grid" as "grid" | "carousel",
  transitionStyle: "slide" as "slide" | "fade" | "pop",
  cycleSeconds: 1.5,
  columns: 3,
  padding: 0.08,
  highlightPulse: 0.65,
  beatPulseDecay: 2.2,
  audioReact: 0.45,
  title: "GREETS"
};

export type GreetsWallParams = {
  names: string[];
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

export const parseGreetsList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(/[|,\n]/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  return [];
};

const asNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const asText = (value: unknown, fallback: string): string => (typeof value === "string" && value.length > 0 ? value : fallback);

export const normalizeGreetsWallParams = (params: Record<string, unknown>): GreetsWallParams => {
  const names = parseGreetsList(params.names);
  const layout = params.layout === "carousel" || params.layout === "grid" ? params.layout : GREETS_WALL_DEFAULTS.layout;
  const transitionStyle =
    params.transitionStyle === "fade" || params.transitionStyle === "pop" || params.transitionStyle === "slide"
      ? params.transitionStyle
      : GREETS_WALL_DEFAULTS.transitionStyle;

  return {
    names: names.length > 0 ? names : parseGreetsList(GREETS_WALL_DEFAULTS.names),
    layout,
    transitionStyle,
    cycleSeconds: clamp(asNumber(params.cycleSeconds, GREETS_WALL_DEFAULTS.cycleSeconds), 0.35, 10),
    columns: Math.round(clamp(asNumber(params.columns, GREETS_WALL_DEFAULTS.columns), 1, 8)),
    padding: clamp(asNumber(params.padding, GREETS_WALL_DEFAULTS.padding), 0.02, 0.18),
    highlightPulse: clamp(asNumber(params.highlightPulse, GREETS_WALL_DEFAULTS.highlightPulse), 0, 1.5),
    beatPulseDecay: clamp(asNumber(params.beatPulseDecay, GREETS_WALL_DEFAULTS.beatPulseDecay), 0.2, 8),
    audioReact: clamp(asNumber(params.audioReact, GREETS_WALL_DEFAULTS.audioReact), 0, 1),
    title: asText(params.title, GREETS_WALL_DEFAULTS.title)
  };
};

export const resolveGreetsSequenceIndex = (time: number, cycleSeconds: number, entryCount: number): number => {
  if (entryCount <= 0) {
    return 0;
  }
  const safeCycle = Math.max(0.001, cycleSeconds);
  return Math.floor(Math.max(0, time) / safeCycle) % entryCount;
};

export class GreetsWallEffect implements Effect {
  private beatPulse = 0;

  reset(): void {
    this.beatPulse = 0;
  }

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const resolved = normalizeGreetsWallParams(params as Record<string, unknown>);
    const count = resolved.names.length;
    const dt = clamp(delta, 0, 0.06);

    this.beatPulse = audio.beat
      ? 1
      : Math.max(0, this.beatPulse - dt * resolved.beatPulseDecay * (1 + audio.impactStrength * 1.5));

    const index = resolveGreetsSequenceIndex(time, resolved.cycleSeconds, count);
    const cycleProgress = ((time % resolved.cycleSeconds) + resolved.cycleSeconds) % resolved.cycleSeconds / resolved.cycleSeconds;

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

    if (resolved.layout === "carousel") {
      const centerX = width * 0.5;
      const centerY = height * 0.58;
      const radius = Math.min(width, height) * 0.22;
      const visibleCount = Math.min(7, count);
      const half = Math.floor(visibleCount / 2);

      for (let offset = -half; offset <= half; offset += 1) {
        const itemIndex = (index + offset + count) % count;
        const angle = (offset / Math.max(1, half)) * Math.PI * 0.6;
        const x = centerX + Math.sin(angle) * radius;
        const depth = (Math.cos(angle) + 1) * 0.5;
        const y = centerY + (1 - depth) * 26;
        const focus = offset === 0 ? 1 : 0;
        const fade = resolved.transitionStyle === "fade" ? 1 - Math.abs(offset) / (half + 1) : 1;
        const popScale = resolved.transitionStyle === "pop" && focus > 0 ? 1 + (1 - cycleProgress) * 0.08 : 1;
        const slideX = resolved.transitionStyle === "slide" ? (cycleProgress - 0.5) * offset * 10 : 0;

        ctx.save();
        ctx.translate(x + slideX, y);
        ctx.scale((0.8 + depth * 0.5) * popScale, (0.8 + depth * 0.5) * popScale);
        ctx.globalAlpha = clamp(0.22 + depth * 0.68 + focus * pulse * 0.3, 0.08, 1) * fade;
        ctx.fillStyle = focus > 0 ? "#ffffff" : "#8fa8ff";
        ctx.font = `${Math.round(22 + depth * 22)}px monospace`;
        ctx.fillText(resolved.names[itemIndex], 0, 0);
        ctx.restore();
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
      const slideOffset = resolved.transitionStyle === "slide" && highlight > 0 ? (1 - cycleProgress) * 16 : 0;
      const popScale = resolved.transitionStyle === "pop" && highlight > 0 ? 1 + (1 - cycleProgress) * 0.2 : 1;
      const alpha = clamp((0.45 + highlight * (0.35 + pulse * 0.35)) * fadeBoost, 0.2, 1);

      ctx.save();
      ctx.translate(x + slideOffset, y);
      ctx.scale(popScale, popScale);
      ctx.font = `${Math.round(Math.max(14, cellH * 0.28))}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = highlight > 0 ? "#ffffff" : "#8ca2ef";
      ctx.globalAlpha = alpha;
      ctx.fillText(resolved.names[i], 0, 0);
      ctx.restore();
    }
  }
}
