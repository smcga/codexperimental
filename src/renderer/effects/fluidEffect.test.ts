import { describe, expect, it, vi } from "vitest";

import { FluidEffect } from "./fluidEffect";

const createAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.4,
  bass: 0.3,
  mid: 0,
  treble: 0.2,
  beat: false,
  beatStrength: 0,
  impactStrength: 0
});

const createContext = () =>
  ({
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    set fillStyle(_value: string) {},
    set globalCompositeOperation(_value: GlobalCompositeOperation) {}
  }) as unknown as CanvasRenderingContext2D;

describe("FluidEffect", () => {
  it("renders a fluid frame with filled cells", () => {
    const effect = new FluidEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 1,
      delta: 0.016,
      audio: createAudio(),
      params: { density: 0.8, force: 1.2 } as unknown as Record<string, number>
    });

    expect(ctx.fillRect).toHaveBeenCalled();
  });
});
