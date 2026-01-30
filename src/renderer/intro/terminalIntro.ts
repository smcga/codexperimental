import { IntroConfig, IntroScriptEvent } from "../../config/loadConfig";

export const DEFAULT_TYPING_CPS = 28;

export function getTypedSubstring(text: string, cps: number, elapsed: number): string {
  if (cps <= 0 || elapsed <= 0) {
    return "";
  }
  const count = Math.min(text.length, Math.floor(elapsed * cps));
  return text.slice(0, count);
}

type TerminalLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  contentTop: number;
  contentHeight: number;
  maxCharsPerLine: number;
  maxLines: number;
};

export class TerminalIntroRenderer {
  private sortedEvents: IntroScriptEvent[] = [];
  private lastScript: IntroScriptEvent[] | null = null;

  render(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, intro: IntroConfig): void {
    this.ensureSorted(intro.script);
    const theme = intro.theme;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    const layout = this.computeLayout(ctx, width, height, theme);
    this.drawWindow(ctx, layout, theme);
    const cursorVisible = Math.floor(time * 2) % 2 === 0;
    const output = this.buildOutput(this.sortedEvents, time);
    const outputWithCursor = cursorVisible ? `${output}█` : output;

    ctx.save();
    ctx.font = `${theme.fontSize}px ${theme.fontFamily}`;
    ctx.textBaseline = "top";
    ctx.fillStyle = theme.fg;
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const lines = this.wrapLines(outputWithCursor.split("\n"), layout.maxCharsPerLine);
    const visibleLines = lines.slice(-layout.maxLines);
    visibleLines.forEach((line, index) => {
      const y = layout.contentTop + index * theme.lineHeight;
      ctx.fillText(line, layout.x + theme.padding, y);
    });
    ctx.restore();
  }

  private ensureSorted(events: IntroScriptEvent[]): void {
    if (this.lastScript === events) {
      return;
    }
    this.sortedEvents = [...events].sort((a, b) => a.t - b.t);
    this.lastScript = events;
  }

  private computeLayout(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    theme: IntroConfig["theme"]
  ): TerminalLayout {
    const windowWidth = Math.min(width * 0.86, 960);
    const windowHeight = Math.min(height * 0.72, 520);
    const x = (width - windowWidth) / 2;
    const y = (height - windowHeight) / 2;
    const chromeHeight = theme.window.chrome ? theme.lineHeight + 16 : 0;
    const contentTop = y + chromeHeight + theme.padding;
    const contentHeight = windowHeight - chromeHeight - theme.padding * 2;

    ctx.save();
    ctx.font = `${theme.fontSize}px ${theme.fontFamily}`;
    const charWidth = ctx.measureText("M").width || theme.fontSize * 0.6;
    ctx.restore();
    const maxCharsPerLine = Math.max(1, Math.floor((windowWidth - theme.padding * 2) / charWidth));
    const maxLines = Math.max(1, Math.floor(contentHeight / theme.lineHeight));

    return {
      x,
      y,
      width: windowWidth,
      height: windowHeight,
      contentTop,
      contentHeight,
      maxCharsPerLine,
      maxLines
    };
  }

  private drawWindow(ctx: CanvasRenderingContext2D, layout: TerminalLayout, theme: IntroConfig["theme"]): void {
    const radius = 12;
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = theme.bg;
    this.roundedRect(ctx, layout.x, layout.y, layout.width, layout.height, radius);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = theme.bg;
    this.roundedRect(ctx, layout.x, layout.y, layout.width, layout.height, radius);
    ctx.fill();
    ctx.restore();

    if (theme.window.chrome) {
      const barHeight = theme.lineHeight + 16;
      ctx.save();
      ctx.fillStyle = theme.dim;
      this.roundedRect(ctx, layout.x, layout.y, layout.width, barHeight, radius, true);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = theme.fg;
      ctx.font = `${theme.fontSize - 2}px ${theme.fontFamily}`;
      ctx.textBaseline = "middle";
      ctx.fillText(
        theme.window.title,
        layout.x + theme.padding + 48,
        layout.y + barHeight / 2
      );

      const buttonY = layout.y + barHeight / 2;
      const buttonX = layout.x + theme.padding;
      const buttonRadius = 6;
      const colors = ["#ff5f57", "#febc2e", "#28c840"];
      colors.forEach((color, index) => {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(buttonX + index * 16, buttonY, buttonRadius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  }

  private roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    topOnly = false
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    if (!topOnly) {
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    } else {
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    }
    ctx.closePath();
  }

  private wrapLines(lines: string[], maxChars: number): string[] {
    const wrapped: string[] = [];
    lines.forEach((line) => {
      if (line.length === 0) {
        wrapped.push("");
        return;
      }
      for (let i = 0; i < line.length; i += maxChars) {
        wrapped.push(line.slice(i, i + maxChars));
      }
    });
    return wrapped;
  }

  private buildOutput(events: IntroScriptEvent[], time: number): string {
    let output = "";
    for (const event of events) {
      if (event.type === "type") {
        if (time < event.t) {
          break;
        }
        const text = event.text ?? "";
        const cps = event.cps ?? DEFAULT_TYPING_CPS;
        const elapsed = time - event.t;
        const typed = getTypedSubstring(text, cps, elapsed);
        output += typed;
        if (typed.length < text.length) {
          break;
        }
      } else if (time >= event.t) {
        switch (event.type) {
          case "prompt":
          case "output":
          case "ascii":
            output += event.text ?? "";
            break;
          case "enter":
            output += "\n";
            break;
          case "clear":
            output = "";
            break;
          default:
            break;
        }
      } else {
        break;
      }
    }
    return output;
  }
}
