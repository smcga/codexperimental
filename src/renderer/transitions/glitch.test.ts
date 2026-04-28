import { describe, expect, it, vi } from "vitest";

import { glitchTransition } from "./glitch";

const mockContext = {
  ctx: {} as CanvasRenderingContext2D,
  progress: 0.5,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  shakeX: 0,
  shakeY: 0,
  width: 320,
  height: 180,
  camera: { zoom: 1, panX: 0, panY: 0 },
  smoothing: true,
  audio: { bass: 0, mid: 0, treble: 0, beat: false, beatStrength: 0 }
};

describe("glitchTransition", () => {
  it("routes desktop draw to drawGlitch", () => {
    const drawGlitch = vi.fn();
    glitchTransition.draw({ drawGlitch } as never, mockContext);
    expect(drawGlitch).toHaveBeenCalledWith(mockContext);
  });

  it("routes mobile draw to default crossfade", () => {
    const drawMobileDefaultCrossfade = vi.fn();
    const mobileContext = { ctx: {} as CanvasRenderingContext2D, progress: 0.5, width: 320, height: 180, audio: mockContext.audio };
    glitchTransition.drawMobile?.({ drawMobileDefaultCrossfade } as never, mobileContext);
    expect(drawMobileDefaultCrossfade).toHaveBeenCalledWith(mobileContext);
  });
});
