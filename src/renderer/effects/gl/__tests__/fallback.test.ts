import { describe, expect, it } from "vitest";

import { AudioFeatures } from "../../../../audio/audioPlayer";
import { FractalTunnelEffect } from "../fractalTunnelEffect";

const createStubDocument = () => {
  const createImageData = (width: number, height: number) => {
    if (typeof ImageData !== "undefined") {
      return new ImageData(width, height);
    }
    return {
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height
    } as ImageData;
  };

  const ctx2d = {
    createImageData,
    putImageData: () => {},
    drawImage: () => {},
    fillRect: () => {},
    save: () => {},
    restore: () => {},
    set fillStyle(_value: string) {}
  } as unknown as CanvasRenderingContext2D;

  const canvas = {
    width: 0,
    height: 0,
    getContext: (type: string) => {
      if (type === "2d") {
        return ctx2d;
      }
      return null;
    }
  } as HTMLCanvasElement;

  return {
    createElement: (tag: string) => {
      if (tag === "canvas") {
        return canvas;
      }
      throw new Error(`Unexpected element creation: ${tag}`);
    }
  } as Document;
};

describe("fractal tunnel fallback", () => {
  it("falls back when WebGL2 is unavailable", () => {
    const originalDocument = globalThis.document;
    globalThis.document = createStubDocument();

    const effect = new FractalTunnelEffect();
    const audio: AudioFeatures = {
      timeDomain: new Uint8Array(4),
      frequency: new Uint8Array(4),
      rms: 0.2,
      bass: 0.3,
      mid: 0.4,
      treble: 0.5,
      beat: false,
      beatStrength: 0.1
    };
    const ctx = {
      drawImage: () => {},
      fillRect: () => {},
      set fillStyle(_value: string) {}
    } as unknown as CanvasRenderingContext2D;

    try {
      expect(() =>
        effect.render({
          ctx,
          width: 320,
          height: 180,
          time: 0,
          delta: 0,
          audio,
          params: {}
        })
      ).not.toThrow();

      expect(effect.getActiveRendererName()).toBe("tunnel");
    } finally {
      globalThis.document = originalDocument;
    }
  });
});
