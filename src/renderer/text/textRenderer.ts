import type { NormalizedTextCue, SpanConfig } from "../../config/loadConfig";
import { clamp, lerp } from "../../util/math";
import type { AudioFeatures } from "../../audio/audioPlayer";

export type SpanLayout = {
  text: string;
  color: string;
  size: number;
  weight: string;
  width: number;
  x: number;
};

export type LayoutResult = {
  totalWidth: number;
  spans: SpanLayout[];
  startX: number;
};

export type MeasureFn = (text: string, size: number, weight: string) => number;

export function layoutSpans(
  spans: SpanConfig[],
  size: number,
  align: CanvasTextAlign,
  x: number,
  measure: MeasureFn
): LayoutResult {
  const layouts = spans.map((span) => {
    const spanSize = span.size ?? size;
    const weight = span.weight ?? "600";
    const width = measure(span.text, spanSize, weight);
    return {
      text: span.text,
      color: span.color ?? "#ffffff",
      size: spanSize,
      weight,
      width,
      x: 0
    };
  });

  const totalWidth = layouts.reduce((sum, span) => sum + span.width, 0);
  let startX = x;
  if (align === "center") {
    startX = x - totalWidth / 2;
  } else if (align === "right" || align === "end") {
    startX = x - totalWidth;
  }

  let cursor = startX;
  layouts.forEach((span) => {
    span.x = cursor;
    cursor += span.width;
  });

  return {
    totalWidth,
    spans: layouts,
    startX
  };
}

function sliceSpansByChars(spans: SpanConfig[], count: number): SpanConfig[] {
  if (count <= 0) {
    return [];
  }
  let remaining = count;
  const result: SpanConfig[] = [];
  for (const span of spans) {
    if (remaining <= 0) {
      break;
    }
    if (span.text.length <= remaining) {
      result.push(span);
      remaining -= span.text.length;
    } else {
      result.push({
        ...span,
        text: span.text.slice(0, remaining)
      });
      remaining = 0;
    }
  }
  return result;
}

export function renderTextCues(
  ctx: CanvasRenderingContext2D,
  cues: NormalizedTextCue[],
  time: number,
  audio: AudioFeatures,
  width: number,
  height: number
): void {
  cues.forEach((cue) => {
    const local = time - cue.start;
    const fadeDuration = 0.4;
    const fadeIn = clamp(local / fadeDuration, 0, 1);
    const fadeOut = clamp((cue.end - time) / fadeDuration, 0, 1);
    const opacity = clamp(Math.min(fadeIn, fadeOut), 0, 1);

    const x = cue.units === "px" ? cue.x : cue.x * width;
    const y = cue.units === "px" ? cue.y : cue.y * height;
    const baseSpans = cue.spans.length > 0 ? cue.spans : [{ text: cue.text }];

    const typedSpeed = cue.effects.typewriter.speed;
    const visibleChars = typedSpeed > 0 ? Math.floor(local * typedSpeed) : Number.MAX_SAFE_INTEGER;
    const spansToRender = sliceSpansByChars(baseSpans, visibleChars);

    if (spansToRender.length === 0) {
      return;
    }

    const glitchAmount = cue.effects.glitchIn ? clamp(1 - fadeIn, 0, 1) : 0;
    const jitter = glitchAmount * (1 + audio.treble * 0.6);

    const measure = (text: string, size: number, weight: string) => {
      ctx.font = `${weight} ${size}px "Courier New", monospace`;
      return ctx.measureText(text).width;
    };

    const layout = layoutSpans(spansToRender, cue.size, cue.align, x, measure);

    ctx.save();
    ctx.globalAlpha = opacity;
    if (cue.effects.shadow) {
      ctx.shadowColor = "rgba(120, 200, 255, 0.65)";
      ctx.shadowBlur = 12;
    }

    layout.spans.forEach((span) => {
      ctx.font = `${span.weight} ${span.size}px "Courier New", monospace`;
      const jitterX = (Math.random() - 0.5) * 12 * jitter;
      const jitterY = (Math.random() - 0.5) * 6 * jitter;
      ctx.fillStyle = span.color;
      ctx.fillText(span.text, span.x + jitterX, y + jitterY);
    });

    if (cue.effects.scanlineMask > 0) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = `rgba(0, 0, 0, ${clamp(cue.effects.scanlineMask, 0, 1) * 0.7})`;
      for (let line = -8; line < cue.size + 8; line += 4) {
        ctx.fillRect(layout.startX, y + line, layout.totalWidth, 2);
      }
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  });
}

export function getCueOpacity(cue: NormalizedTextCue, time: number): number {
  const local = time - cue.start;
  const fadeDuration = 0.4;
  const fadeIn = clamp(local / fadeDuration, 0, 1);
  const fadeOut = clamp((cue.end - time) / fadeDuration, 0, 1);
  return lerp(0, 1, Math.min(fadeIn, fadeOut));
}
