import { clamp } from "../../util/math";
import { NormalizedTextCue, NormalizedTextSpan } from "../../config/loadConfig";

export type SpanLayout = {
  text: string;
  width: number;
  x: number;
  color: string;
};

export type SpanLayoutResult = {
  totalWidth: number;
  spans: SpanLayout[];
};

export type MeasureText = (text: string, size: number) => number;

const DEFAULT_FADE = 0.4;

function prepareSpans(spans: NormalizedTextSpan[]): NormalizedTextSpan[] {
  const prepared: NormalizedTextSpan[] = [];
  spans.forEach((span, index) => {
    let text = span.text;
    if (index > 0) {
      const prev = prepared[index - 1];
      if (prev && !prev.text.endsWith(" ") && !text.startsWith(" ")) {
        text = ` ${text}`;
      }
    }
    prepared.push({ ...span, text });
  });
  return prepared;
}

export function layoutCueSpans(
  spans: NormalizedTextSpan[],
  size: number,
  align: CanvasTextAlign,
  measure: MeasureText
): SpanLayoutResult {
  const prepared = prepareSpans(spans);
  const widths = prepared.map((span) => measure(span.text, size));
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);

  let startX = 0;
  if (align === "center") {
    startX = -totalWidth / 2;
  } else if (align === "right" || align === "end") {
    startX = -totalWidth;
  }

  let cursor = startX;
  const layout = prepared.map((span, index) => {
    const width = widths[index];
    const entry = {
      text: span.text,
      width,
      x: cursor,
      color: span.color
    };
    cursor += width;
    return entry;
  });

  return { totalWidth, spans: layout };
}

function applyTypewriter(spans: NormalizedTextSpan[], visibleChars: number): NormalizedTextSpan[] {
  if (visibleChars <= 0) {
    return spans.map((span) => ({ ...span, text: "" }));
  }
  let remaining = visibleChars;
  return spans.map((span) => {
    if (remaining <= 0) {
      return { ...span, text: "" };
    }
    const text = span.text.slice(0, remaining);
    remaining -= span.text.length;
    return { ...span, text };
  });
}

export function renderTextCue(
  ctx: CanvasRenderingContext2D,
  cue: NormalizedTextCue,
  time: number,
  width: number,
  height: number
): void {
  const fadeIn = clamp((time - cue.start) / DEFAULT_FADE, 0, 1);
  const fadeOut = clamp((cue.end - time) / DEFAULT_FADE, 0, 1);
  const opacity = Math.min(fadeIn, fadeOut);
  if (opacity <= 0) {
    return;
  }

  const baseX = cue.units === "px" ? cue.x : cue.x * width;
  const baseY = cue.units === "px" ? cue.y : cue.y * height;

  const elapsed = Math.max(0, time - cue.start);
  const typewriterSpeed = cue.effects.typewriter?.speed ?? 0;
  const preparedSpans = prepareSpans(cue.spans);
  const totalChars = preparedSpans.reduce((sum, span) => sum + span.text.length, 0);
  const visibleChars = typewriterSpeed > 0 ? Math.floor(elapsed * typewriterSpeed) : totalChars;
  const spanText = applyTypewriter(preparedSpans, visibleChars);

  ctx.save();
  ctx.font = `${cue.size}px "Courier New", monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = opacity;

  if (cue.effects.shadow) {
    ctx.shadowColor = "rgba(0, 255, 255, 0.6)";
    ctx.shadowBlur = 12 * (1 + cue.effects.scanlineMask);
  }

  let jitterX = 0;
  let jitterY = 0;
  if (cue.effects.glitchIn && fadeIn < 1) {
    jitterX = (Math.random() - 0.5) * 8 * (1 - fadeIn);
    jitterY = (Math.random() - 0.5) * 6 * (1 - fadeIn);
  }

  const layout = layoutCueSpans(spanText, cue.size, cue.align, (text, size) => {
    ctx.font = `${size}px "Courier New", monospace`;
    return ctx.measureText(text).width;
  });

  layout.spans.forEach((span) => {
    ctx.fillStyle = span.color;
    ctx.fillText(span.text, baseX + span.x + jitterX, baseY + jitterY);
  });

  if (cue.effects.scanlineMask > 0) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = `rgba(0, 0, 0, ${cue.effects.scanlineMask})`;
    for (let y = -height; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }
  }

  if (cue.effects.glitchIn && fadeIn < 1) {
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255, 120, 200, ${0.3 * (1 - fadeIn)})`;
    ctx.fillText(preparedSpans.map((span) => span.text).join(""), baseX + jitterX * 1.5, baseY);
  }

  ctx.restore();
}
