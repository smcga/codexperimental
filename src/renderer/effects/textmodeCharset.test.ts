import { describe, expect, it, vi } from "vitest";

import {
  TEXTMODE_CHARSET_DEFAULTS,
  TextmodeCharsetEffect,
  coerceTextmodeCharsetParams,
  resolveGlyphRamp
} from "./textmodeCharset";

const createAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  beat: false,
  beatStrength: 0,
  impactStrength: 0
});

const createContext = () => {
  const ops: string[] = [];
  const ctx = {
    fillRect: vi.fn((x: number, y: number, w: number, h: number) => {
      ops.push(`fillRect:${x},${y},${w},${h}`);
    }),
    fillText: vi.fn((text: string, x: number, y: number) => {
      ops.push(`fillText:${text}@${x.toFixed(2)},${y.toFixed(2)}`);
    }),
    save: vi.fn(() => {
      ops.push("save");
    }),
    restore: vi.fn(() => {
      ops.push("restore");
    }),
    set font(value: string) {
      ops.push(`font:${value}`);
    },
    set fillStyle(value: string) {
      ops.push(`fillStyle:${value}`);
    },
    set textAlign(value: CanvasTextAlign) {
      ops.push(`textAlign:${value}`);
    },
    set textBaseline(value: CanvasTextBaseline) {
      ops.push(`textBaseline:${value}`);
    },
    set globalCompositeOperation(value: GlobalCompositeOperation) {
      ops.push(`blend:${value}`);
    }
  } as unknown as CanvasRenderingContext2D;

  return { ctx, ops };
};

describe("textmodeCharset", () => {
  it("resolves glyph ramps from presets and custom strings", () => {
    expect(resolveGlyphRamp("classic")).toBe(" .:-=+*#%@");
    expect(resolveGlyphRamp("  abccba  ")).toBe(" abc");
    expect(resolveGlyphRamp("")).toBe(" .:-=+*#%@");
  });

  it("coerces and validates params", () => {
    const params = coerceTextmodeCharsetParams({
      cols: 999,
      rows: -8,
      mode: "oops",
      palette: "amber",
      speed: -3,
      scanlines: 0,
      seed: 12000
    });

    expect(params.cols).toBe(240);
    expect(params.rows).toBe(6);
    expect(params.mode).toBe(TEXTMODE_CHARSET_DEFAULTS.mode);
    expect(params.palette).toBe("amber");
    expect(params.speed).toBe(0);
    expect(params.scanlines).toBe(false);
    expect(params.seed).toBe(9999);
  });

  it("renders stable output for fixed time and seed", () => {
    const effect = new TextmodeCharsetEffect();
    const first = createContext();
    const second = createContext();

    const renderArgs = {
      width: 80,
      height: 40,
      time: 1.25,
      delta: 0.016,
      audio: createAudio(),
      params: {
        cols: 8,
        rows: 4,
        glyphSet: " .:-=+*#%@",
        mode: "noise",
        speed: 1.1,
        palette: "ice",
        scanlines: 1,
        seed: 42
      }
    };

    effect.render({ ...renderArgs, ctx: first.ctx });
    effect.render({ ...renderArgs, ctx: second.ctx });

    expect(first.ops).toEqual(second.ops);
    expect(first.ops.some((entry) => entry.startsWith("fillText:"))).toBe(true);
  });
});
