import { afterEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_EFFECT_NAME, FractalTunnelEffect } from "../fractalTunnelEffect";

const buildAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.1,
  bass: 0.2,
  mid: 0.3,
  treble: 0.4,
  beat: false,
  beatStrength: 0,
  impactStrength: 0
});

const createCanvasContext = (): CanvasRenderingContext2D =>
  ({
    createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
    putImageData: vi.fn(),
    drawImage: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    imageSmoothingEnabled: false,
    globalCompositeOperation: "source-over",
    globalAlpha: 1
  }) as unknown as CanvasRenderingContext2D;

const setupCanvasMocks = () => {
  const createCanvasElement = () => ({
    width: 0,
    height: 0,
    getContext: (type: string) => {
      if (type === "webgl2") {
        return null;
      }
      if (type === "2d") {
        return createCanvasContext();
      }
      return null;
    }
  });

  vi.stubGlobal("document", {
    createElement: createCanvasElement
  });
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("fractal tunnel fallback", () => {
  it("falls back when WebGL2 is unavailable", () => {
    setupCanvasMocks();

    const effect = new FractalTunnelEffect();
    const ctx = createCanvasContext();

    expect(() => {
      effect.render({
        ctx,
        width: 320,
        height: 180,
        time: 0,
        delta: 0,
        audio: buildAudio(),
        params: {}
      });
    }).not.toThrow();

    expect(FALLBACK_EFFECT_NAME).toBe("tunnel");
  });
});
