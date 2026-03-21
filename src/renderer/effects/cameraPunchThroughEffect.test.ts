import { describe, expect, it, vi } from "vitest";

import { CAMERA_PUNCH_THROUGH_DEFAULTS, CameraPunchThroughEffect } from "./cameraPunchThroughEffect";

const createCtx = () => {
  const gradient = { addColorStop: vi.fn() };
  return {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    createRadialGradient: vi.fn(() => gradient)
  } as unknown as CanvasRenderingContext2D;
};

describe("CameraPunchThroughEffect", () => {
  it("exposes stable defaults for docs generation", () => {
    expect(CAMERA_PUNCH_THROUGH_DEFAULTS.speed).toBeGreaterThan(0);
    expect(CAMERA_PUNCH_THROUGH_DEFAULTS.depthFade).toBeGreaterThan(0);
    expect(CAMERA_PUNCH_THROUGH_DEFAULTS.seed).toBe(9);
  });

  it("renders streaks, rings, and impact fade", () => {
    const effect = new CameraPunchThroughEffect();
    const ctx = createCtx();

    effect.render({
      ctx,
      width: 640,
      height: 360,
      time: 1.1,
      delta: 1 / 60,
      audio: { bass: 0.7, treble: 0.5, beatStrength: 0.8, mid: 0.3, rms: 0.4, beat: true },
      params: { speed: 1.6, fov: 1.4, blur: 0.78, depthFade: 0.55, streaks: 1.2, seed: 3 }
    });

    expect((ctx.moveTo as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(50);
    expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(10);
    expect((ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(1);
    expect((ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });
});
