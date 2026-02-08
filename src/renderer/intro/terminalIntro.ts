import { IntroConfig, IntroScriptEvent } from "../../config/loadConfig";
import { clamp } from "../../util/math";

export const DEFAULT_TYPING_CPS = 28;
export const INTRO_EXPLOSION_DURATION = 0.9;

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

export function getIntroExplosionProgress(time: number, introEnd: number, duration = INTRO_EXPLOSION_DURATION): number {
  if (duration <= 0) {
    return 0;
  }
  return clamp((time - (introEnd - duration)) / duration, 0, 1);
}

function hashUnit(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function getExplosionVector(seed: number, progress: number, speed: number): { x: number; y: number; rotation: number } {
  const angle = hashUnit(seed) * Math.PI * 2;
  const lift = 0.35 + hashUnit(seed + 1) * 0.65;
  const distance = speed * (0.25 + progress * progress * 2.2) * lift;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance - progress * progress * speed * 0.25,
    rotation: (hashUnit(seed + 2) - 0.5) * progress * 1.8
  };
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
  private sceneCanvas: HTMLCanvasElement | null = null;

  private sceneCtx: CanvasRenderingContext2D | null = null;

  private ensureSceneCanvas(width: number, height: number): CanvasRenderingContext2D {
    if (!this.sceneCanvas || !this.sceneCtx) {
      this.sceneCanvas = document.createElement("canvas");
      const sceneCtx = this.sceneCanvas.getContext("2d");
      if (!sceneCtx) {
        throw new Error("Unable to create terminal intro scene canvas");
      }
      this.sceneCtx = sceneCtx;
    }
    if (this.sceneCanvas.width !== width || this.sceneCanvas.height !== height) {
      this.sceneCanvas.width = width;
      this.sceneCanvas.height = height;
    }
    return this.sceneCtx;
  }

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
    const explosionProgress = getIntroExplosionProgress(time, config.end);
    const targetCtx = explosionProgress > 0 ? this.ensureSceneCanvas(width, height) : ctx;

    targetCtx.clearRect(0, 0, width, height);
    targetCtx.fillStyle = theme.bg;
    targetCtx.fillRect(0, 0, width, height);

    const windowWidth = Math.min(width * 0.85, 920);
    const windowHeight = Math.min(height * 0.72, 520);
    const windowX = (width - windowWidth) / 2;
    const windowY = (height - windowHeight) / 2;
    const radius = 8;
    const titleBarHeight = theme.window.chrome ? theme.lineHeight + 20 : 0;

    const contentX = windowX + theme.padding;
    const contentY = windowY + theme.padding + titleBarHeight;
    const contentWidth = windowWidth - theme.padding * 2;
    const contentHeight = windowHeight - theme.padding * 2 - titleBarHeight;

    const buffer = buildTerminalBuffer(script, time);
    const charWidth = Math.max(1, targetCtx.measureText("M").width);
    const maxChars = Math.max(1, Math.floor(contentWidth / charWidth));
    const wrapped = wrapLines(buffer.lines, buffer.cursor, maxChars);

    const maxLines = Math.max(1, Math.floor(contentHeight / theme.lineHeight));
    const totalLines = wrapped.lines.length;
    const startIndex = Math.max(0, totalLines - maxLines);
    const visibleLines = wrapped.lines.slice(startIndex);
    const cursorLine = wrapped.cursor.line - startIndex;
    const cursorColumn = wrapped.cursor.column;

    targetCtx.save();
    targetCtx.shadowColor = "rgba(0, 0, 0, 0.5)";
    targetCtx.shadowBlur = 18;
    drawRoundedRect(targetCtx, windowX, windowY, windowWidth, windowHeight, radius);
    targetCtx.fillStyle = "#0f141b";
    targetCtx.fill();
    targetCtx.restore();

    targetCtx.save();
    drawRoundedRect(targetCtx, windowX, windowY, windowWidth, windowHeight, radius);
    targetCtx.clip();
    targetCtx.fillStyle = theme.bg;
    targetCtx.fillRect(windowX, windowY, windowWidth, windowHeight);

    if (theme.window.chrome) {
      const titleGradient = targetCtx.createLinearGradient(0, windowY, 0, windowY + titleBarHeight);
      titleGradient.addColorStop(0, "rgba(30, 36, 46, 0.96)");
      titleGradient.addColorStop(1, "rgba(18, 23, 31, 0.96)");
      targetCtx.fillStyle = titleGradient;
      targetCtx.fillRect(windowX, windowY, windowWidth, titleBarHeight);

      targetCtx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      targetCtx.lineWidth = 1;
      targetCtx.beginPath();
      targetCtx.moveTo(windowX, windowY + titleBarHeight + 0.5);
      targetCtx.lineTo(windowX + windowWidth, windowY + titleBarHeight + 0.5);
      targetCtx.stroke();

      targetCtx.fillStyle = theme.dim;
      targetCtx.font = `600 ${theme.fontSize - 2}px ${theme.fontFamily}`;
      targetCtx.textBaseline = "middle";
      targetCtx.fillText(theme.window.title, windowX + 42, windowY + titleBarHeight / 2);

      const controlY = windowY + titleBarHeight / 2;
      const controlX = windowX + windowWidth - 56;
      const controlGap = 16;
      const controlSize = 10;
      ["#f7768e", "#e0af68", "#9ece6a"].forEach((color, index) => {
        targetCtx.strokeStyle = color;
        targetCtx.lineWidth = 2;
        targetCtx.beginPath();
        targetCtx.rect(controlX + index * controlGap, controlY - controlSize / 2, controlSize, controlSize);
        targetCtx.stroke();
      });

      targetCtx.fillStyle = theme.accent;
      targetCtx.fillRect(windowX + 16, windowY + titleBarHeight / 2 - 4, 8, 8);
    }

    targetCtx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    targetCtx.lineWidth = 1;
    drawRoundedRect(targetCtx, windowX, windowY, windowWidth, windowHeight, radius);
    targetCtx.stroke();

    targetCtx.font = `${theme.fontSize}px ${theme.fontFamily}`;
    targetCtx.textBaseline = "alphabetic";
    targetCtx.fillStyle = theme.fg;
    targetCtx.shadowColor = theme.accent;
    targetCtx.shadowBlur = 6;

    visibleLines.forEach((line, index) => {
      const x = contentX;
      const y = contentY + (index + 1) * theme.lineHeight;
      targetCtx.fillText(line, x, y);
    });

    const cursorVisible = Math.floor(time * 2) % 2 === 0;
    if (cursorVisible && cursorLine >= 0 && cursorLine < visibleLines.length) {
      const cursorX = contentX + cursorColumn * charWidth;
      const cursorY = contentY + cursorLine * theme.lineHeight;
      targetCtx.fillStyle = theme.accent;
      targetCtx.shadowColor = theme.accent;
      targetCtx.shadowBlur = 8;
      targetCtx.fillRect(cursorX, cursorY + 4, charWidth * 0.9, theme.lineHeight - 6);
    }

    targetCtx.restore();

    if (explosionProgress <= 0 || !this.sceneCanvas) {
      return;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    const cols = 12;
    const rows = 9;
    const shardW = windowWidth / cols;
    const shardH = windowHeight / rows;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const index = row * cols + col;
        const sx = windowX + col * shardW;
        const sy = windowY + row * shardH;
        const vector = getExplosionVector(index + 1, explosionProgress, Math.min(width, height) * 0.45);
        const centerX = sx + shardW / 2;
        const centerY = sy + shardH / 2;
        ctx.save();
        ctx.globalAlpha = 1 - explosionProgress * 0.55;
        ctx.translate(centerX + vector.x, centerY + vector.y);
        ctx.rotate(vector.rotation);
        ctx.drawImage(this.sceneCanvas, sx, sy, shardW, shardH, -shardW / 2, -shardH / 2, shardW, shardH);
        ctx.restore();
      }
    }

    ctx.save();
    ctx.font = `${theme.fontSize}px ${theme.fontFamily}`;
    ctx.textBaseline = "alphabetic";
    visibleLines.forEach((line, lineIndex) => {
      for (let charIndex = 0; charIndex < line.length; charIndex += 1) {
        const char = line[charIndex];
        if (char === " ") {
          continue;
        }
        const particleSeed = lineIndex * 997 + charIndex * 37 + 11;
        const vector = getExplosionVector(particleSeed, explosionProgress, Math.min(width, height) * 0.32);
        const x = contentX + charIndex * charWidth + vector.x;
        const y = contentY + (lineIndex + 1) * theme.lineHeight + vector.y;
        ctx.fillStyle = theme.accent;
        ctx.globalAlpha = Math.max(0, 1 - explosionProgress * 1.25);
        ctx.fillText(char, x, y);
      }
    });
    ctx.restore();
  }
}
