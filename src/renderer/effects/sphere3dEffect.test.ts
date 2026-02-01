import { describe, expect, it, vi } from "vitest";

import { Sphere3DEffect } from "./sphere3dEffect";

const createContext = () => {
  const arcs: Array<{ x: number; y: number; r: number }> = [];
  const ctx = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn((x: number, y: number, r: number) => {
      arcs.push({ x, y, r });
    }),
    fill: vi.fn(),
    set fillStyle(_value: string) {},
    set globalCompositeOperation(_value: string) {}
  } as unknown as CanvasRenderingContext2D;

  return { ctx, arcs };
};

describe("Sphere3DEffect", () => {
  it("renders a point cloud of arcs", () => {
    const effect = new Sphere3DEffect(4, 8);
    const { ctx, arcs } = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 1,
      delta: 0.016,
      audio: {
        timeDomain: new Uint8Array(0),
        frequency: new Uint8Array(0),
        rms: 0.2,
        bass: 0.3,
        mid: 0.1,
        treble: 0.4,
        beat: false,
        beatStrength: 0.1
      },
      params: {}
    });

    expect(arcs.length).toBeGreaterThan(0);
  });
});
