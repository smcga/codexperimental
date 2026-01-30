import type { TextCueConfig, TextSpanConfig, TextEffectsConfig } from "../../config/loadConfig";
import { clamp, lerp } from "../../util/math";

export type SpanLayout = {
  text: string;
  color: string;
  width: number;
  x: number;
};

export type SpanLayoutResult = {
  totalWidth: number;
  spans: SpanLayout[];
  startX: number;
};

export function layoutTextSpans(
  spans: TextSpanConfig[],
  size: number,
  align: CanvasTextAlign,
  measure: (text: string, size: number) => number
): SpanLayoutResult {
  const widths = spans.map((span) => measure(span.text, size));
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);
  const startX = align === "center" ? -totalWidth / 2 : align === "right" ? -totalWidth : 0;
  let cursor = startX;
  const layout: SpanLayout[] = spans.map((span, index) => {
    const width = widths[index];
    const entry = {
      text: span.text,
      color: span.color ?? "#ffffff",
      width,
      x: cursor
    };
    cursor += width;
    return entry;
  });

  return { totalWidth, spans: layout, startX };
}

function buildSpans(cue: TextCueConfig): TextSpanConfig[] {
  if (cue.spans && cue.spans.length > 0) {
    return cue.spans.map((span) => ({
      text: span.text,
      color: span.color ?? cue.color ?? "#ffffff"
    }));
  }
  return [{ text: cue.text ?? "", color: cue.color ?? "#ffffff" }];
}

function applyTypewriter(spans: TextSpanConfig[], visibleChars: number): TextSpanConfig[] {
  if (visibleChars <= 0) {
    return [{ text: "", color: spans[0]?.color }];
  }
  const output: TextSpanConfig[] = [];
  let remaining = visibleChars;
  spans.forEach((span) => {
    if (remaining <= 0) {
      return;
    }
    const sliceText = span.text.slice(0, remaining);
    output.push({ text: sliceText, color: span.color });
    remaining -= sliceText.length;
  });
  return output.length > 0 ? output : [{ text: "", color: spans[0]?.color }];
}

function renderCue(
  ctx: CanvasRenderingContext2D,
  cue: TextCueConfig,
  time: number,
  baseWidth: number,
  baseHeight: number
): void {
  const start = cue.start;
  const end = cue.end ?? cue.start + 3;
  const duration = end - start;
  if (duration <= 0) {
    return;
  }

  const fade = Math.min(0.6, duration * 0.25);
  const fadeIn = clamp((time - start) / fade, 0, 1);
  const fadeOut = clamp((end - time) / fade, 0, 1);
  const opacity = Math.min(fadeIn, fadeOut);
  if (opacity <= 0) {
    return;
  }

  const size = cue.size ?? 42;
  const align = cue.align ?? "center";
  const x = cue.units === "px" ? cue.x ?? baseWidth / 2 : (cue.x ?? 0.5) * baseWidth;
  const y = cue.units === "px" ? cue.y ?? baseHeight / 2 : (cue.y ?? 0.5) * baseHeight;

  const baseSpans = buildSpans(cue);
  const effects = cue.effects ?? ({} as TextEffectsConfig);
  const typewriter = effects.typewriter;
  const elapsed = time - start;
  const visibleChars = typewriter ? Math.floor(elapsed * typewriter.speed) : Infinity;
  const spans =
    visibleChars === Infinity ? baseSpans : applyTypewriter(baseSpans, visibleChars);

  ctx.save();
  ctx.font = `bold ${size}px "Courier New", monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const layout = layoutTextSpans(spans, size, align, (text, measureSize) => {
    ctx.font = `bold ${measureSize}px "Courier New", monospace`;
    return ctx.measureText(text).width;
  });

  if (effects.shadow) {
    ctx.shadowColor = "rgba(0, 180, 255, 0.7)";
    ctx.shadowBlur = 16;
  }

  const glitchPhase = effects.glitchIn ? clamp(1 - fadeIn, 0, 1) : 0;
  if (glitchPhase > 0) {
    const jitter = glitchPhase * 6;
    layout.spans.forEach((span) => {
      ctx.fillStyle = `rgba(255, 80, 80, ${opacity * 0.5})`;
      ctx.fillText(span.text, x + span.x + jitter, y - jitter);
      ctx.fillStyle = `rgba(80, 200, 255, ${opacity * 0.5})`;
      ctx.fillText(span.text, x + span.x - jitter, y + jitter);
    });
  }

  layout.spans.forEach((span) => {
    const alpha = opacity * lerp(0.6, 1, 1 - glitchPhase * 0.6);
    ctx.fillStyle = `${span.color ?? "#ffffff"}`;
    ctx.globalAlpha = alpha;
    ctx.fillText(span.text, x + span.x, y);
  });

  if (effects.scanlineMask) {
    const maskAlpha = clamp(effects.scanlineMask, 0, 1) * opacity * 0.6;
    const lineHeight = Math.max(2, size * 0.15);
    ctx.globalAlpha = maskAlpha;
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    const boxWidth = layout.totalWidth;
    const boxHeight = size * 1.2;
    const startX = x + layout.startX;
    const startY = y - boxHeight / 2;
    for (let line = startY; line < startY + boxHeight; line += lineHeight * 2) {
      ctx.fillRect(startX, line, boxWidth, lineHeight);
    }
  }

  ctx.restore();
}

export function renderTextCues(
  ctx: CanvasRenderingContext2D,
  cues: TextCueConfig[],
  time: number,
  baseWidth: number,
  baseHeight: number
): void {
  cues.forEach((cue) => renderCue(ctx, cue, time, baseWidth, baseHeight));
}
