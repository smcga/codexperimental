import { TextCue, TextSpan } from "../../config/loadConfig";
import { clamp } from "../../util/math";
import { layoutSpans } from "./layout";

const DEFAULT_FADE = 0.4;

function sliceSpansByChars(spans: TextSpan[], charCount: number): TextSpan[] {
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
    .filter((span): span is TextSpan => span !== null && span.text.length > 0);
}

function measureText(ctx: CanvasRenderingContext2D, text: string, span: TextSpan): number {
  ctx.font = `${span.weight} ${span.size}px ${span.font}`;
  return ctx.measureText(text).width;
}

export function renderTextCues(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cues: TextCue[],
  time: number
): void {
  cues.forEach((cue) => {
    const fadeIn = clamp((time - cue.start) / DEFAULT_FADE, 0, 1);
    const fadeOut = clamp((cue.end - time) / DEFAULT_FADE, 0, 1);
    const opacity = Math.min(fadeIn, fadeOut);
    if (opacity <= 0) {
      return;
    }

    const revealSpeed = cue.effects.typewriter?.speed ?? 0;
    let spans = cue.spans;
    if (revealSpeed > 0) {
      const totalChars = cue.spans.reduce((sum, span) => sum + span.text.length, 0);
      const visibleChars = Math.floor((time - cue.start) * revealSpeed);
      spans = sliceSpansByChars(cue.spans, Math.min(totalChars, Math.max(0, visibleChars)));
      if (spans.length === 0) {
        return;
      }
    }

    const layout = layoutSpans(spans, cue.align, (text, span) => measureText(ctx, text, span));
    const x = cue.units === "px" ? cue.x : cue.x * width;
    const y = cue.units === "px" ? cue.y : cue.y * height;
    const glitchAmount = cue.effects.glitchIn ? 1 - fadeIn : 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.textBaseline = "middle";

    if (cue.effects.shadow) {
      ctx.shadowColor = "rgba(80, 220, 255, 0.8)";
      ctx.shadowBlur = 12;
    }

    if (glitchAmount > 0.01) {
      const jitter = glitchAmount * 6;
      ctx.globalAlpha = opacity * 0.6;
      ctx.fillStyle = "rgba(255, 80, 80, 0.8)";
      drawSpans(ctx, layout, jitter, -jitter);
      ctx.fillStyle = "rgba(80, 200, 255, 0.8)";
      drawSpans(ctx, layout, -jitter, jitter);
    }

    ctx.globalAlpha = opacity;
    drawSpans(ctx, layout, 0, 0);

    if (cue.effects.scanlineMask > 0) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = opacity * cue.effects.scanlineMask;
      const scanHeight = Math.max(2, cue.size * 0.1);
      const top = -cue.size * 0.6;
      const areaHeight = cue.size * 1.2;
      for (let line = top; line < top + areaHeight; line += scanHeight * 2) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fillRect(layout.startX, line, layout.totalWidth, scanHeight);
      }
    }

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
    ctx.fillStyle = span.color;
    ctx.fillText(span.text, span.x + offsetX, offsetY);
  });
}
