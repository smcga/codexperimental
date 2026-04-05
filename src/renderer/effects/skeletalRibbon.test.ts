import { describe, expect, it, vi } from "vitest";

import SkeletalRibbonEffect, { resolveSkeletalRibbonParams } from "./skeletalRibbon";
import { EffectRenderContext } from "./types";

const createContext = () => {
  const gradient = {
    addColorStop: vi.fn()
  };

  const ctx = {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    set fillStyle(_value: string | CanvasGradient) {},
    set strokeStyle(_value: string) {},
    set lineWidth(_value: number) {},
    set globalAlpha(_value: number) {},
    get globalAlpha() {
      return 1;
    },
    set globalCompositeOperation(_value: GlobalCompositeOperation) {},
    set filter(_value: string) {},
    get filter() {
      return "none";
    }
  } as unknown as CanvasRenderingContext2D;

  return { ctx, gradient };
};

const createRenderContext = (
  ctx: CanvasRenderingContext2D,
  params: Record<string, unknown>,
  era?: string,
  beat = false
): EffectRenderContext =>
  ({
    ctx,
    width: 320,
    height: 180,
    time: 1.25,
    delta: 1 / 60,
    audio: {
      rms: 0.4,
      bass: 0.55,
      mid: 0.35,
      treble: 0.2,
      beat
    },
    params: params as Record<string, number>,
    era
  } as EffectRenderContext);

describe("resolveSkeletalRibbonParams", () => {
  it("clamps values and applies 8bit adaptation", () => {
    const resolved = resolveSkeletalRibbonParams(
      {
        boneCount: 40,
        length: 40,
        thickness: 100,
        waveAmp: 4,
        waveFreq: 0,
        stiffness: -1,
        audioInfluence: 8,
        colorMode: "weird",
        hueShift: 2,
        glow: 0.8,
        debugSkeleton: 1
      },
      "8bit"
    );

    expect(resolved).toEqual({
      boneCount: 22,
      length: 80,
      thickness: 56,
      waveAmp: 2,
      waveFreq: 0.05,
      stiffness: 0.05,
      audioInfluence: 2,
      colorMode: "gradient",
      hueShift: 1,
      glow: 0,
      debugSkeleton: true
    });
  });
});

describe("SkeletalRibbonEffect", () => {
  it("renders a deterministic ribbon path for stable inputs", () => {
    const effectA = new SkeletalRibbonEffect();
    const { ctx: ctxA } = createContext();
    effectA.render(createRenderContext(ctxA, { boneCount: 12, colorMode: "mono", glow: 0 }));

    const effectB = new SkeletalRibbonEffect();
    const { ctx: ctxB } = createContext();
    effectB.render(createRenderContext(ctxB, { boneCount: 12, colorMode: "mono", glow: 0 }));

    expect((ctxA.lineTo as unknown as ReturnType<typeof vi.fn>).mock.calls).toEqual(
      (ctxB.lineTo as unknown as ReturnType<typeof vi.fn>).mock.calls
    );
    expect(ctxA.fill).toHaveBeenCalledTimes(1);
  });

  it("adds beat pulse rendering pass when glow is enabled", () => {
    const effect = new SkeletalRibbonEffect();
    const { ctx, gradient } = createContext();

    effect.render(createRenderContext(ctx, { glow: 0.6, colorMode: "gradient" }, "pcdemo", true));

    expect(ctx.fill).toHaveBeenCalledTimes(2);
    expect(gradient.addColorStop).toHaveBeenCalledTimes(2);
  });
});
