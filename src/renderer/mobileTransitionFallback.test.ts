import { describe, expect, it, vi } from "vitest";

import { drawMobileTransitionWithFallback } from "./mobileTransitionFallback";

describe("drawMobileTransitionWithFallback", () => {
  const context = {
    ctx: {} as CanvasRenderingContext2D,
    progress: 0.5,
    duration: 0.8,
    width: 320,
    height: 180,
    audio: { bass: 0, mid: 0, treble: 0, beat: false, beatStrength: 0 }
  };

  it("uses fallback when transition has no mobile renderer", () => {
    const fallback = vi.fn();
    drawMobileTransitionWithFallback({ key: "fade", label: "Fade", visibleInValidator: true, draw: vi.fn() }, {} as never, context, fallback);
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it("uses fallback and reports when mobile renderer throws", () => {
    const fallback = vi.fn();
    const onError = vi.fn();
    drawMobileTransitionWithFallback(
      {
        key: "custom",
        label: "Custom",
        visibleInValidator: true,
        draw: vi.fn(),
        drawMobile: () => {
          throw new Error("mobile boom");
        }
      },
      {} as never,
      context,
      fallback,
      onError
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledTimes(1);
  });
});
