import { describe, expect, it } from "vitest";
import type { TextCue } from "../../config/loadConfig";
import { renderTextCues } from "./textRenderer";

type DrawCall = { font: string; text: string; alpha: number };

function createMockContext(): CanvasRenderingContext2D & { drawCalls: DrawCall[] } {
  const state = {
    font: "",
    textBaseline: "alphabetic",
    fillStyle: "#fff",
    strokeStyle: "#000",
    lineWidth: 1,
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    shadowColor: "transparent",
    shadowBlur: 0,
    drawCalls: [] as DrawCall[]
  };

  const ctx = {
    drawCalls: state.drawCalls,
    save() {},
    restore() {},
    translate() {},
    fillRect() {},
    strokeText() {},
    measureText(text: string) {
      const match = state.font.match(/(\d+(?:\.\d+)?)px/);
      const size = match ? Number(match[1]) : 16;
      return { width: text.length * size * 0.6 } as TextMetrics;
    },
    fillText(text: string) {
      state.drawCalls.push({ font: state.font, text, alpha: state.globalAlpha });
    },
    set font(value: string) {
      state.font = value;
    },
    get font() {
      return state.font;
    },
    set textBaseline(value: CanvasTextBaseline) {
      state.textBaseline = value;
    },
    get textBaseline() {
      return state.textBaseline as CanvasTextBaseline;
    },
    set fillStyle(value: string | CanvasGradient | CanvasPattern) {
      state.fillStyle = String(value);
    },
    get fillStyle() {
      return state.fillStyle;
    },
    set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
      state.strokeStyle = String(value);
    },
    get strokeStyle() {
      return state.strokeStyle;
    },
    set lineWidth(value: number) {
      state.lineWidth = value;
    },
    get lineWidth() {
      return state.lineWidth;
    },
    set globalAlpha(value: number) {
      state.globalAlpha = value;
    },
    get globalAlpha() {
      return state.globalAlpha;
    },
    set globalCompositeOperation(value: GlobalCompositeOperation) {
      state.globalCompositeOperation = value;
    },
    get globalCompositeOperation() {
      return state.globalCompositeOperation as GlobalCompositeOperation;
    },
    set shadowColor(value: string) {
      state.shadowColor = value;
    },
    get shadowColor() {
      return state.shadowColor;
    },
    set shadowBlur(value: number) {
      state.shadowBlur = value;
    },
    get shadowBlur() {
      return state.shadowBlur;
    }
  } as unknown as CanvasRenderingContext2D & { drawCalls: DrawCall[] };

  return ctx;
}

const baseCue: TextCue = {
  id: "cue-1",
  start: 0,
  end: 4,
  text: "HELLO",
  spans: [{ text: "HELLO", size: 40, color: "#fff", weight: "bold", font: "Courier New" }],
  x: 0.5,
  y: 0.5,
  align: "center",
  size: 40,
  color: "#fff",
  blend: "source-over",
  outlineWidth: 0,
  outlineColor: "#000000",
  fadeIn: 0.4,
  fadeOut: 0.4,
  units: "normalized",
  effects: { glitchIn: false, shadow: false, scanlineMask: 0 },
  mobile: { x: 0.5, y: 0.5, size: 20 }
};

describe("renderTextCues mobile size", () => {
  it("scales rendered text span size in mobileFit mode", () => {
    const ctx = createMockContext();
    renderTextCues(ctx, 320, 180, [baseCue], 1, { framingMode: "mobileFit" });

    expect(ctx.drawCalls.length).toBeGreaterThan(0);
    expect(ctx.drawCalls[0].font).toContain("20px");
  });

  it("keeps desktop text span size when not in mobileFit mode", () => {
    const ctx = createMockContext();
    renderTextCues(ctx, 320, 180, [baseCue], 1, { framingMode: "desktopCinematic" });

    expect(ctx.drawCalls.length).toBeGreaterThan(0);
    expect(ctx.drawCalls[0].font).toContain("40px");
  });

  it("uses per-cue fadeIn and fadeOut durations", () => {
    const ctx = createMockContext();
    const cue: TextCue = { ...baseCue, fadeIn: 2, fadeOut: 2 };
    renderTextCues(ctx, 320, 180, [cue], 1, { framingMode: "desktopCinematic" });
    expect(ctx.drawCalls.length).toBeGreaterThan(0);
    expect(ctx.drawCalls[0].alpha).toBeCloseTo(0.5, 2);

    const ctxFadeOut = createMockContext();
    renderTextCues(ctxFadeOut, 320, 180, [cue], 3, { framingMode: "desktopCinematic" });
    expect(ctxFadeOut.drawCalls.length).toBeGreaterThan(0);
    expect(ctxFadeOut.drawCalls[0].alpha).toBeCloseTo(0.5, 2);
  });
});
