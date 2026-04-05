import { describe, expect, it } from "vitest";

import { H, W } from "../../generated/explicitPixelsFrame";
import { ExplicitPixelsEffect } from "./explicitPixelsEffect";

describe("ExplicitPixelsEffect", () => {
  it("hydrates explicit pixels once and does not rewrite them during explicit renders", () => {
    const imageData = { data: new Uint8ClampedArray(W * H * 4) } as ImageData;
    const putImageData = (_img: ImageData, _x: number, _y: number): void => {};
    const createImageData = (_w: number, _h: number): ImageData => imageData;

    const offscreenCtx = {
      createImageData,
      putImageData
    } as unknown as CanvasRenderingContext2D;

    const offscreenCanvas = {
      width: 0,
      height: 0,
      getContext: () => offscreenCtx
    } as unknown as HTMLCanvasElement;

    const originalDocument = globalThis.document;
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: () => offscreenCanvas
      }
    });

    const drawImage = (_canvas: HTMLCanvasElement, _x: number, _y: number, _w: number, _h: number): void => {};
    const outputCtx = {
      save: () => {},
      restore: () => {},
      drawImage,
      imageSmoothingEnabled: true
    } as unknown as CanvasRenderingContext2D;

    try {
      const effect = new ExplicitPixelsEffect();

      expect(imageData.data[2]).not.toBe(0);
      imageData.data[2] = 99;

      effect.render({
        ctx: outputCtx,
        width: 320,
        height: 180,
        time: 1,
        delta: 1 / 60,
        audio: {
          timeDomain: new Uint8Array(0),
          frequency: new Uint8Array(0),
          bass: 0,
          mid: 0,
          treble: 0,
          rms: 0,
          beat: false,
          beatStrength: 0,
          impactStrength: 0
        },
        params: { mode: "explicit" } as unknown as Record<string, number>
      });

      expect(imageData.data[2]).toBe(99);
    } finally {
      Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: originalDocument
      });
    }
  });
});
