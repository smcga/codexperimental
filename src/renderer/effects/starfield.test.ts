import { describe, expect, it, vi } from "vitest";

import { Starfield } from "./starfield";

const createContext = () => {
  const fills: Array<{ x: number; y: number }> = [];
  let currentFillStyle = "";
  let currentStrokeStyle = "";
  const ctx = {
    fillRect: vi.fn((x: number, y: number) => {
      fills.push({ x, y });
    }),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    set fillStyle(value: string) {
      currentFillStyle = value;
    },
    get fillStyle() {
      return currentFillStyle;
    },
    set strokeStyle(value: string) {
      currentStrokeStyle = value;
    },
    get strokeStyle() {
      return currentStrokeStyle;
    },
    set globalCompositeOperation(_value: string) {}
  } as unknown as CanvasRenderingContext2D;

  return { ctx, fills, styles: () => ({ fill: currentFillStyle, stroke: currentStrokeStyle }) };
};

describe("Starfield", () => {
  it("shifts stars horizontally based on turn phase", () => {
    const starfield = new Starfield(1, 2);
    (starfield as unknown as { stars: Array<{ x: number; y: number; z: number; twinkle: number }> }).stars = [
      { x: 0, y: 0, z: 1, twinkle: 0 }
    ];
    (starfield as unknown as { turnPhase: number }).turnPhase = Math.PI / 2;
    (starfield as unknown as { turnStrength: number }).turnStrength = 0.5;

    const { ctx, fills } = createContext();

    starfield.render(ctx, 100, 100, 0, { warp: 0 });

    expect(fills).toHaveLength(1);
    expect(fills[0].x).toBeCloseTo(61.25, 2);
    expect(fills[0].y).toBeCloseTo(50, 2);
  });

  it("advances turn phase and stores update options", () => {
    const starfield = new Starfield(1, 2);
    const initialPhase = (starfield as unknown as { turnPhase: number }).turnPhase;

    starfield.update(0.5, 1.0, { turnRate: 1.2, turnStrength: 0.4, drift: 0.3 });

    const updatedPhase = (starfield as unknown as { turnPhase: number }).turnPhase;
    expect(updatedPhase).not.toBe(initialPhase);
    expect((starfield as unknown as { turnRate: number }).turnRate).toBe(1.2);
    expect((starfield as unknown as { turnStrength: number }).turnStrength).toBe(0.4);
    expect((starfield as unknown as { drift: number }).drift).toBe(0.3);
  });

  it("applies color shifting and warp styles", () => {
    const starfield = new Starfield(1, 2);
    (starfield as unknown as { stars: Array<{ x: number; y: number; z: number; twinkle: number }> }).stars = [
      { x: 0.1, y: -0.1, z: 1.2, twinkle: 1.1 }
    ];
    const { ctx, styles } = createContext();

    starfield.render(ctx, 120, 80, 0.6, { warp: 0.7, sparkle: 1.1, colorShift: 0.5 });

    expect(styles().fill).toContain("hsla(");
    expect(styles().stroke).toContain("hsla(");
  });
});
