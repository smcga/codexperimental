import { IntroConfig, IntroScriptEvent } from "../../config/loadConfig";
import { clamp } from "../../util/math";

export const DEFAULT_TYPING_CPS = 28;

export type TypingCursor = {
  line: number;
  column: number;
};

export type TerminalBuffer = {
  lines: string[];
  cursor: TypingCursor;
};

export function getTypingReveal(text: string, cps: number, elapsed: number): number {
  if (elapsed <= 0 || cps <= 0) {
    return 0;
  }
  return clamp(Math.floor(elapsed * cps), 0, text.length);
}

function appendText(buffer: TerminalBuffer, text: string): void {
  for (const char of text) {
    if (char === "\n") {
      buffer.lines.push("");
      buffer.cursor.line += 1;
      buffer.cursor.column = 0;
    } else {
      buffer.lines[buffer.cursor.line] += char;
      buffer.cursor.column += 1;
    }
  }
}

function buildTerminalBuffer(events: IntroScriptEvent[], time: number): TerminalBuffer {
  const buffer: TerminalBuffer = {
    lines: [""],
    cursor: { line: 0, column: 0 }
  };

  for (const event of events) {
    if (time < event.t) {
      continue;
    }
    if (event.type === "clear") {
      buffer.lines = [""];
      buffer.cursor = { line: 0, column: 0 };
      continue;
    }
    if (event.type === "enter") {
      appendText(buffer, "\n");
      continue;
    }
    if (event.type === "prompt" || event.type === "output" || event.type === "ascii") {
      appendText(buffer, event.text ?? "");
      continue;
    }
    if (event.type === "type") {
      const cps = event.cps ?? DEFAULT_TYPING_CPS;
      const reveal = getTypingReveal(event.text ?? "", cps, time - event.t);
      appendText(buffer, (event.text ?? "").slice(0, reveal));
    }
  }

  return buffer;
}

function wrapLines(
  lines: string[],
  cursor: TypingCursor,
  maxChars: number
): { lines: string[]; cursor: TypingCursor } {
  const wrapped: string[] = [];
  let cursorLine = 0;
  let cursorColumn = 0;

  lines.forEach((line, lineIndex) => {
    if (line.length === 0) {
      wrapped.push("");
      if (lineIndex < cursor.line) {
        cursorLine += 1;
      } else if (lineIndex === cursor.line) {
        cursorLine = wrapped.length - 1;
        cursorColumn = cursor.column;
      }
      return;
    }
    for (let i = 0; i < line.length; i += maxChars) {
      const chunk = line.slice(i, i + maxChars);
      wrapped.push(chunk);
      if (lineIndex === cursor.line && cursor.column >= i && cursor.column <= i + maxChars) {
        cursorLine = wrapped.length - 1;
        cursorColumn = cursor.column - i;
      } else if (lineIndex < cursor.line) {
        cursorLine += 1;
      }
    }
  });

  return { lines: wrapped, cursor: { line: cursorLine, column: cursorColumn } };
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export class TerminalIntroRenderer {
  render({
    ctx,
    width,
    height,
    time,
    config
  }: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    time: number;
    config: IntroConfig;
  }): void {
    const { theme, script } = config;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    const windowWidth = Math.min(width * 0.85, 920);
    const windowHeight = Math.min(height * 0.72, 520);
    const windowX = (width - windowWidth) / 2;
    const windowY = (height - windowHeight) / 2;
    const radius = 8;
    const titleBarHeight = theme.window.chrome ? theme.lineHeight + 20 : 0;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 18;
    drawRoundedRect(ctx, windowX, windowY, windowWidth, windowHeight, radius);
    ctx.fillStyle = "#0f141b";
    ctx.fill();
    ctx.restore();

    ctx.save();
    drawRoundedRect(ctx, windowX, windowY, windowWidth, windowHeight, radius);
    ctx.clip();
    ctx.fillStyle = theme.bg;
    ctx.fillRect(windowX, windowY, windowWidth, windowHeight);

    if (theme.window.chrome) {
      const titleGradient = ctx.createLinearGradient(0, windowY, 0, windowY + titleBarHeight);
      titleGradient.addColorStop(0, "rgba(30, 36, 46, 0.96)");
      titleGradient.addColorStop(1, "rgba(18, 23, 31, 0.96)");
      ctx.fillStyle = titleGradient;
      ctx.fillRect(windowX, windowY, windowWidth, titleBarHeight);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(windowX, windowY + titleBarHeight + 0.5);
      ctx.lineTo(windowX + windowWidth, windowY + titleBarHeight + 0.5);
      ctx.stroke();

      ctx.fillStyle = theme.dim;
      ctx.font = `600 ${theme.fontSize - 2}px ${theme.fontFamily}`;
      ctx.textBaseline = "middle";
      ctx.fillText(theme.window.title, windowX + 42, windowY + titleBarHeight / 2);

      const controlY = windowY + titleBarHeight / 2;
      const controlX = windowX + windowWidth - 56;
      const controlGap = 16;
      const controlSize = 10;
      ["#f7768e", "#e0af68", "#9ece6a"].forEach((color, index) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(controlX + index * controlGap, controlY - controlSize / 2, controlSize, controlSize);
        ctx.stroke();
      });

      ctx.fillStyle = theme.accent;
      ctx.fillRect(windowX + 16, windowY + titleBarHeight / 2 - 4, 8, 8);
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, windowX, windowY, windowWidth, windowHeight, radius);
    ctx.stroke();

    ctx.font = `${theme.fontSize}px ${theme.fontFamily}`;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = theme.fg;
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 6;

    const contentX = windowX + theme.padding;
    const contentY = windowY + theme.padding + titleBarHeight;
    const contentWidth = windowWidth - theme.padding * 2;
    const contentHeight = windowHeight - theme.padding * 2 - titleBarHeight;

    const buffer = buildTerminalBuffer(script, time);
    const charWidth = Math.max(1, ctx.measureText("M").width);
    const maxChars = Math.max(1, Math.floor(contentWidth / charWidth));
    const wrapped = wrapLines(buffer.lines, buffer.cursor, maxChars);

    const maxLines = Math.max(1, Math.floor(contentHeight / theme.lineHeight));
    const totalLines = wrapped.lines.length;
    const startIndex = Math.max(0, totalLines - maxLines);
    const visibleLines = wrapped.lines.slice(startIndex);
    const cursorLine = wrapped.cursor.line - startIndex;
    const cursorColumn = wrapped.cursor.column;

    visibleLines.forEach((line, index) => {
      const x = contentX;
      const y = contentY + (index + 1) * theme.lineHeight;
      ctx.fillText(line, x, y);
    });

    const cursorVisible = Math.floor(time * 2) % 2 === 0;
    if (cursorVisible && cursorLine >= 0 && cursorLine < visibleLines.length) {
      const cursorX = contentX + cursorColumn * charWidth;
      const cursorY = contentY + cursorLine * theme.lineHeight;
      ctx.fillStyle = theme.accent;
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = 8;
      ctx.fillRect(cursorX, cursorY + 4, charWidth * 0.9, theme.lineHeight - 6);
    }

    ctx.restore();
  }
}
