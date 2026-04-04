import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCrystalCathedralUniforms,
  CrystalCathedralEffect,
  normalizeCrystalCathedralParams
} from "../crystalCathedralEffect";

const buildAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.5,
  bass: 0.88,
  mid: 0.4,
  treble: 0.74,
  beat: true,
  beatStrength: 1.3,
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
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
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

describe("crystal cathedral uniforms", () => {
  it("clamps params and emits finite uniforms", () => {
    const params = normalizeCrystalCathedralParams({
      speed: -1,
      quality: 5,
      exposure: 9,
      hueShift: -0.5,
      crystalDensity: 9,
      symmetry: -2,
      reflectivity: 3,
      fog: -2,
      glow: 8,
      audioReact: 4,
      beatKick: -3,
      seed: 10001,
      facetSharpness: 4
    });

    expect(params.speed).toBe(0.1);
    expect(params.quality).toBe(3);
    expect(params.exposure).toBe(2);
    expect(params.hueShift).toBe(0);
    expect(params.crystalDensity).toBe(1.4);
    expect(params.symmetry).toBe(0);
    expect(params.reflectivity).toBe(1);
    expect(params.fog).toBe(0);
    expect(params.glow).toBe(2);
    expect(params.audioReact).toBe(1);
    expect(params.beatKick).toBe(0);
    expect(params.seed).toBe(9999);
    expect(params.facetSharpness).toBe(1.5);

    const uniforms = buildCrystalCathedralUniforms(5.1, 1280, 720, buildAudio(), params, 0.7);
    Object.values(uniforms).forEach((value) => {
      if (typeof value === "number") {
        expect(Number.isFinite(value)).toBe(true);
      }
    });
    expect(uniforms.steps).toBe(110);
    expect(uniforms.crystalDensity).toBe(params.crystalDensity);
    expect(uniforms.reflectivity).toBe(params.reflectivity);
  });

  it("falls back to Canvas2D cathedral rendering when WebGL2 is unavailable", () => {
    setupCanvasMocks();

    const effect = new CrystalCathedralEffect();
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
  });
});
