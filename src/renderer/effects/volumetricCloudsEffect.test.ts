import { describe, expect, it, vi } from "vitest";

import {
  VOLUMETRIC_CLOUDS_DEFAULTS,
  VolumetricCloudsEffect,
  resolveVolumetricCloudsParams
} from "./volumetricCloudsEffect";
import { EffectRenderContext } from "./types";

type DrawCall = { type: string; fillStyle: string };

const createContext = () => {
  const drawCalls: DrawCall[] = [];
  let fillStyle = "";
  const gradientStops: Array<{ offset: number; color: string }> = [];

  const gradient = {
    addColorStop: vi.fn((offset: number, color: string) => {
      gradientStops.push({ offset, color });
    })
  } as unknown as CanvasGradient;

  const ctx = {
    createLinearGradient: vi.fn(() => gradient),
    fillRect: vi.fn(() => {
      drawCalls.push({ type: "fillRect", fillStyle });
    }),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(() => {
      drawCalls.push({ type: "fill", fillStyle });
    }),
    set fillStyle(value: string | CanvasGradient) {
      fillStyle = typeof value === "string" ? value : "gradient";
    },
    get fillStyle() {
      return fillStyle;
    }
  } as unknown as CanvasRenderingContext2D;

  return { ctx, drawCalls, gradientStops };
};

const createRenderContext = (
  ctx: CanvasRenderingContext2D,
  params: Record<string, unknown>
): EffectRenderContext =>
  ({
    ctx,
    width: 160,
    height: 100,
    time: 2.25,
    delta: 1 / 60,
    audio: { rms: 0.32, bass: 0.41, beat: true },
    params: params as Record<string, number>
  } as EffectRenderContext);

describe("resolveVolumetricCloudsParams", () => {
  it("clamps values and rounds layer count", () => {
    expect(
      resolveVolumetricCloudsParams({
        density: 8,
        layers: 7.8,
        windSpeed: -6,
        cloudScale: 0.1,
        detail: 99,
        sunlight: -1,
        haze: 2,
        audioReact: -3
      })
    ).toEqual({
      density: 1,
      layers: 8,
      windSpeed: -2,
      cloudScale: 0.4,
      detail: 1,
      sunlight: 0,
      haze: 0.8,
      audioReact: 0
    });
  });

  it("uses defaults when params are omitted", () => {
    expect(resolveVolumetricCloudsParams({})).toEqual(VOLUMETRIC_CLOUDS_DEFAULTS);
  });
});

describe("VolumetricCloudsEffect", () => {
  it("renders deterministically for fixed inputs", () => {
    const params = {
      density: 0.66,
      layers: 5,
      windSpeed: 0.5,
      cloudScale: 1.1,
      detail: 0.75,
      sunlight: 0.62,
      haze: 0.2,
      audioReact: 0.35
    };

    const effectA = new VolumetricCloudsEffect();
    const { ctx: ctxA, drawCalls: callsA, gradientStops: stopsA } = createContext();
    effectA.render(createRenderContext(ctxA, params));

    const effectB = new VolumetricCloudsEffect();
    const { ctx: ctxB, drawCalls: callsB, gradientStops: stopsB } = createContext();
    effectB.render(createRenderContext(ctxB, params));

    expect(callsA).toEqual(callsB);
    expect(stopsA).toEqual(stopsB);
    expect(callsA[0]).toEqual({ type: "fillRect", fillStyle: "gradient" });
    expect(callsA.at(-1)).toEqual({ type: "fillRect", fillStyle: "rgba(210, 225, 240, 0.226)" });
  });
});
