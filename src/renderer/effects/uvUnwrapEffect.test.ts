import { describe, expect, it, vi } from "vitest";

import { EffectRenderContext } from "./types";
import { UV_UNWRAP_DEFAULTS, UvUnwrapEffect, resolveUvUnwrapParams } from "./uvUnwrapEffect";

const createContext = () => {
  let fillStyle = "";
  let strokeStyle = "";
  let lineWidth = 0;
  const fills: string[] = [];
  const strokes: Array<{ strokeStyle: string; lineWidth: number }> = [];

  const ctx = {
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(() => fills.push(fillStyle)),
    stroke: vi.fn(() => strokes.push({ strokeStyle, lineWidth })),
    set fillStyle(value: string) {
      fillStyle = value;
    },
    get fillStyle() {
      return fillStyle;
    },
    set strokeStyle(value: string) {
      strokeStyle = value;
    },
    get strokeStyle() {
      return strokeStyle;
    },
    set lineWidth(value: number) {
      lineWidth = value;
    },
    get lineWidth() {
      return lineWidth;
    }
  } as unknown as CanvasRenderingContext2D;

  return { ctx, fills, strokes };
};

const createRenderContext = (ctx: CanvasRenderingContext2D, params: Record<string, unknown>): EffectRenderContext =>
  ({
    ctx,
    width: 320,
    height: 180,
    time: 1.25,
    delta: 1 / 60,
    audio: { rms: 0.3, bass: 0.4, beat: true },
    params: params as Record<string, number>
  } as EffectRenderContext);

describe("resolveUvUnwrapParams", () => {
  it("clamps incoming params and uses defaults", () => {
    expect(
      resolveUvUnwrapParams({
        unwrap: 2,
        uvScale: 0,
        cameraDist: 99,
        rotationSpeed: -99,
        edgeStrength: 0,
        explode: -2
      })
    ).toEqual({
      unwrap: 1,
      uvScale: 1,
      cameraDist: 6,
      rotationSpeed: -2,
      edgeStrength: 0.2,
      explode: 0
    });

    expect(resolveUvUnwrapParams({})).toEqual(UV_UNWRAP_DEFAULTS);
  });
});

describe("UvUnwrapEffect", () => {
  it("renders filled triangles and seam edges", () => {
    const { ctx, fills, strokes } = createContext();
    const effect = new UvUnwrapEffect();

    effect.render(
      createRenderContext(ctx, {
        unwrap: 0.2,
        uvScale: 2,
        cameraDist: 3,
        rotationSpeed: 0.6,
        edgeStrength: 1,
        explode: 0.15
      })
    );

    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 320, 180);
    expect(fills.length).toBeGreaterThanOrEqual(12);
    expect(strokes.length).toBe(24);
    expect(fills.some((value) => value.startsWith("hsl("))).toBe(true);
    expect(strokes[0].strokeStyle).toContain("rgba(220, 255, 255");
  });
});
