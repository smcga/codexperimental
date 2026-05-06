import { TextCue, TextSpan } from "../../config/loadConfig";
import { FramingMode } from "../framing";
import { clamp } from "../../util/math";
import { layoutSpans } from "./layout";

const DEFAULT_FADE = 0.4;

type Rect = { x: number; y: number; w: number; h: number };

type TextRenderOptions = {
  framingMode?: FramingMode;
  safeRect?: Rect;
};
type RenderSpan = TextSpan & { outlineWidth: number; outlineColor: string };

function sliceSpansByChars(spans: RenderSpan[], charCount: number): RenderSpan[] {
  if (charCount <= 0) {
    return [];
  }
  let remaining = charCount;
  return spans
    .map((span) => {
      if (remaining <= 0) {
        return null;
      }
      const text = span.text.slice(0, remaining);
      remaining -= text.length;
      return { ...span, text };
    })
    .filter((span): span is RenderSpan => span !== null && span.text.length > 0);
}

function measureText(ctx: CanvasRenderingContext2D, text: string, span: TextSpan): number {
  ctx.font = `${span.weight} ${span.size}px ${span.font}`;
  return ctx.measureText(text).width;
}

function clampToSafe(value: number, min: number, max: number): number {
  return clamp(value, min, max);
}

export function resolveTextPosition(
  anchor: "left" | "center" | "right",
  x: number,
  y: number,
  safeRect: Rect,
  internalW: number,
  internalH: number
): { px: number; py: number } {
  const px = clampToSafe(x, safeRect.x, safeRect.x + safeRect.w);
  const py = clampToSafe(y, safeRect.y, safeRect.y + safeRect.h);
  if (anchor === "left") {
    return { px: clampToSafe(px, safeRect.x, internalW), py };
  }
  if (anchor === "right") {
    return { px: clampToSafe(px, 0, safeRect.x + safeRect.w), py };
  }
  return { px, py };
}

function wrapSpans(
  ctx: CanvasRenderingContext2D,
  spans: RenderSpan[],
  maxWidth: number
): Array<{ spans: RenderSpan[]; layout: ReturnType<typeof layoutSpans> }> {
  if (!Number.isFinite(maxWidth) || maxWidth <= 0) {
    return [{ spans, layout: layoutSpans(spans, "left", (text, span) => measureText(ctx, text, span)) }];
  }

  const lines: RenderSpan[][] = [];
  let current: RenderSpan[] = [];
  let currentWidth = 0;

  const pushCurrent = (): void => {
    if (current.length > 0) {
      lines.push(current);
      current = [];
      currentWidth = 0;
    }
  };

  spans.forEach((span) => {
    const parts = span.text.split(/(\s+)/);
    parts.forEach((part) => {
      if (part.length === 0) {
        return;
      }
      const partWidth = measureText(ctx, part, span);
      if (currentWidth + partWidth > maxWidth && current.length > 0 && !/^\s+$/.test(part)) {
        pushCurrent();
      }
      if (/^\s+$/.test(part) && current.length === 0) {
        return;
      }
      current.push({ ...span, text: part });
      currentWidth += partWidth;
    });
  });
  pushCurrent();

  if (lines.length === 0) {
    return [{ spans, layout: layoutSpans(spans, "left", (text, span) => measureText(ctx, text, span)) }];
  }

  return lines.map((line) => ({
    spans: line,
    layout: layoutSpans(line, "left", (text, span) => measureText(ctx, text, span))
  }));
}

export function renderTextCues(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cues: TextCue[],
  time: number,
  options: TextRenderOptions = {}
): void {
  const safeRect = options.safeRect ?? { x: 0, y: 0, w: width, h: height };
  const mobileFit = options.framingMode === "mobileFit";

  cues.forEach((cue) => {
    const fadeIn = clamp((time - cue.start) / DEFAULT_FADE, 0, 1);
    const fadeOut = clamp((cue.end - time) / DEFAULT_FADE, 0, 1);
    const opacity = Math.min(fadeIn, fadeOut);
    if (opacity <= 0) {
      return;
    }

    const revealSpeed = cue.effects.typewriter?.speed ?? 0;
    let spans: RenderSpan[] = cue.spans.map((span) => ({
      ...span,
      outlineWidth: cue.outlineWidth ?? 0,
      outlineColor: cue.outlineColor ?? "#000000"
    }));
    if (revealSpeed > 0) {
      const totalChars = cue.spans.reduce((sum, span) => sum + span.text.length, 0);
      const visibleChars = Math.floor((time - cue.start) * revealSpeed);
      spans = sliceSpansByChars(cue.spans, Math.min(totalChars, Math.max(0, visibleChars)));
      if (spans.length === 0) {
        return;
      }
    }

    const initialX = cue.units === "px" ? cue.x : cue.x * width;
    const initialY = cue.units === "px" ? cue.y : cue.y * height;
    const shouldUseSafe = cue.safe ?? mobileFit;
    const { px: x, py: y } = shouldUseSafe
      ? resolveTextPosition(cue.align, initialX, initialY, safeRect, width, height)
      : { px: initialX, py: initialY };

    const maxWidth = cue.maxWidth ?? (mobileFit && shouldUseSafe ? safeRect.w : Number.POSITIVE_INFINITY);
    const lines = wrapSpans(ctx, spans, maxWidth);
    const lineHeight = Math.max(...spans.map((span) => span.size), cue.size) * 1.2;
    const blockHeight = lineHeight * lines.length;
    const glitchAmount = cue.effects.glitchIn ? 1 - fadeIn : 0;

    ctx.save();
    ctx.translate(x, y - blockHeight / 2 + lineHeight / 2);
    ctx.textBaseline = "middle";
    ctx.globalCompositeOperation = cue.blend ?? "source-over";

    if (cue.effects.shadow) {
      ctx.shadowColor = "rgba(80, 220, 255, 0.8)";
      ctx.shadowBlur = 12;
    }

    lines.forEach((line, lineIndex) => {
      const yOffset = lineIndex * lineHeight;
      const lineLayout = layoutSpans(line.spans, cue.align, (text, span) => measureText(ctx, text, span));
      if (glitchAmount > 0.01) {
        const jitter = glitchAmount * 6;
        ctx.globalAlpha = opacity * 0.6;
        ctx.fillStyle = "rgba(255, 80, 80, 0.8)";
        drawSpans(ctx, lineLayout, jitter, -jitter + yOffset);
        ctx.fillStyle = "rgba(80, 200, 255, 0.8)";
        drawSpans(ctx, lineLayout, -jitter, jitter + yOffset);
      }

      ctx.globalAlpha = opacity;
      drawSpans(ctx, lineLayout, 0, yOffset);

      if (cue.effects.scanlineMask > 0) {
        ctx.globalCompositeOperation = "source-atop";
        ctx.globalAlpha = opacity * cue.effects.scanlineMask;
        const scanHeight = Math.max(2, cue.size * 0.1);
        const top = -cue.size * 0.6 + yOffset;
        const areaHeight = cue.size * 1.2;
        for (let lineY = top; lineY < top + areaHeight; lineY += scanHeight * 2) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          ctx.fillRect(lineLayout.startX, lineY, lineLayout.totalWidth, scanHeight);
        }
      }
    });

    ctx.restore();
  });
}

function drawSpans(
  ctx: CanvasRenderingContext2D,
  layout: ReturnType<typeof layoutSpans>,
  offsetX: number,
  offsetY: number
): void {
  layout.spans.forEach((span) => {
    ctx.font = `${span.weight} ${span.size}px ${span.font}`;
    if (span.outlineWidth > 0) {
      ctx.lineWidth = span.outlineWidth;
      ctx.strokeStyle = span.outlineColor;
      ctx.strokeText(span.text, span.x + offsetX, offsetY);
    }
    ctx.fillStyle = span.color;
    ctx.fillText(span.text, span.x + offsetX, offsetY);
  });
}
