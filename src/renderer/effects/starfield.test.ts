import { describe, expect, it, vi } from "vitest";

import { Starfield } from "./starfield";

const createContext = () => {
  const fills: Array<{ x: number; y: number }> = [];
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
    set fillStyle(_value: string) {},
    set strokeStyle(_value: string) {},
    set globalCompositeOperation(_value: string) {}
  } as unknown as CanvasRenderingContext2D;

  return { ctx, fills };
};

describe("Starfield", () => {
  it("shifts stars horizontally based on turn phase", () => {
    const starfield = new Starfield(1, 2);
    (starfield as unknown as { stars: Array<{ x: number; y: number; z: number }> }).stars = [
      { x: 0, y: 0, z: 1 }
    ];
    (starfield as unknown as { turnPhase: number }).turnPhase = Math.PI / 2;
    (starfield as unknown as { turnStrength: number }).turnStrength = 0.5;

    const { ctx, fills } = createContext();

    starfield.render(ctx, 100, 100, 0, 0);

    expect(fills).toHaveLength(1);
    expect(fills[0].x).toBeCloseTo(61.25, 2);
    expect(fills[0].y).toBeCloseTo(50, 2);
  });

  it("advances turn phase when updating", () => {
    const starfield = new Starfield(1, 2);
    const initialPhase = (starfield as unknown as { turnPhase: number }).turnPhase;

    starfield.update(0.5, 1.0, 1.2, 0.4);

    const updatedPhase = (starfield as unknown as { turnPhase: number }).turnPhase;
    expect(updatedPhase).not.toBe(initialPhase);
    expect((starfield as unknown as { turnRate: number }).turnRate).toBe(1.2);
    expect((starfield as unknown as { turnStrength: number }).turnStrength).toBe(0.4);
  });
});
