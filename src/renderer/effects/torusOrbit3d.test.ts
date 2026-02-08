import { describe, expect, it, vi } from "vitest";

import { EffectRenderContext } from "./types";
import { TORUS_ORBIT_3D_DEFAULTS, TorusOrbit3dEffect, resolveTorusOrbit3dParams } from "./torusOrbit3d";

type ArcCall = { x: number; y: number; radius: number; fillStyle: string };

const createContext = () => {
  const arcCalls: ArcCall[] = [];
  let fillStyle = "";

  const ctx = {
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn((x: number, y: number, radius: number) => {
      arcCalls.push({ x, y, radius, fillStyle });
    }),
    fill: vi.fn(),
    set fillStyle(value: string) {
      fillStyle = value;
    },
    get fillStyle() {
      return fillStyle;
    }
  } as unknown as CanvasRenderingContext2D;

  return { ctx, arcCalls };
};

const createRenderContext = (
  ctx: CanvasRenderingContext2D,
  params: Record<string, unknown>
): EffectRenderContext =>
  ({
    ctx,
    width: 320,
    height: 180,
    time: 2.4,
    delta: 1 / 60,
    audio: { rms: 0.35, bass: 0.5, beat: true },
    params: params as Record<string, number>
  } as EffectRenderContext);

describe("resolveTorusOrbit3dParams", () => {
  it("clamps numeric fields and falls back unknown palette", () => {
    expect(
      resolveTorusOrbit3dParams({
        ringCount: 1,
        pointsPerRing: 999,
        majorRadius: 4,
        minorRadius: 0,
        spinSpeed: 20,
        wobbleSpeed: -30,
        depth: 1,
        glow: 9,
        palette: "bad",
        audioReact: -2
      })
    ).toEqual({
      ringCount: 3,
      pointsPerRing: 240,
      majorRadius: 1.8,
      minorRadius: 0.05,
      spinSpeed: 4,
      wobbleSpeed: -3,
      depth: 2,
      glow: 1,
      palette: TORUS_ORBIT_3D_DEFAULTS.palette,
      audioReact: 0
    });
  });

  it("uses defaults when no params are provided", () => {
    expect(resolveTorusOrbit3dParams({})).toEqual(TORUS_ORBIT_3D_DEFAULTS);
  });
});

describe("TorusOrbit3dEffect", () => {
  it("renders deterministic arc output for fixed context", () => {
    const params = {
      ringCount: 4,
      pointsPerRing: 12,
      majorRadius: 0.8,
      minorRadius: 0.25,
      spinSpeed: 0.9,
      wobbleSpeed: 0.6,
      depth: 3.3,
      glow: 0.7,
      palette: "violet",
      audioReact: 0.4
    };

    const effect = new TorusOrbit3dEffect();
    const { ctx, arcCalls } = createContext();
    effect.render(createRenderContext(ctx, params));

    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 320, 180);
    expect(arcCalls).toHaveLength(48);
    expect(arcCalls[0].fillStyle).toContain("rgba(180, 120, 255");

    const { ctx: ctxB, arcCalls: arcCallsB } = createContext();
    new TorusOrbit3dEffect().render(createRenderContext(ctxB, params));
    expect(arcCalls).toEqual(arcCallsB);
  });
});
