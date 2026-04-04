import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCrystalCathedralUniforms,
  CRYSTAL_CATHEDRAL_DEFAULTS,
  CrystalCathedralEffect,
  normalizeCrystalCathedralParams
} from "../crystalCathedralEffect";

const buildAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.4,
  bass: 0.82,
  mid: 0.34,
  treble: 0.61,
  beat: true,
  beatStrength: 1,
  impactStrength: 0
});

const createCanvasContext = (): CanvasRenderingContext2D =>
  ({
    createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
    clearRect: vi.fn(),
    putImageData: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    imageSmoothingEnabled: false,
    globalCompositeOperation: "source-over",
    globalAlpha: 1
  }) as unknown as CanvasRenderingContext2D;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("crystal cathedral params", () => {
  it("clamps required controls", () => {
    const params = normalizeCrystalCathedralParams({
      speed: 99,
      quality: -2,
      exposure: -1,
      crystalDensity: 8,
      symmetry: -3,
      reflectivity: 4,
      fog: -3,
      glow: 9,
      audioReact: 2,
      beatKick: -2,
      seed: 100000,
      facetSharpness: 0
    });

    expect(params.speed).toBe(2);
    expect(params.quality).toBe(1);
    expect(params.exposure).toBe(0.5);
    expect(params.crystalDensity).toBe(1.4);
    expect(params.symmetry).toBe(0);
    expect(params.reflectivity).toBe(1);
    expect(params.fog).toBe(0);
    expect(params.glow).toBe(2);
    expect(params.audioReact).toBe(1);
    expect(params.beatKick).toBe(0);
    expect(params.seed).toBe(9999);
    expect(params.facetSharpness).toBe(0.1);
  });

  it("maps finite uniforms with quality-dependent steps", () => {
    const params = normalizeCrystalCathedralParams(CRYSTAL_CATHEDRAL_DEFAULTS);
    const uniforms = buildCrystalCathedralUniforms(
      {
        ctx: createCanvasContext(),
        width: 320,
        height: 180,
        time: 3,
        delta: 1 / 60,
        audio: buildAudio(),
        params: {}
      },
      params,
      0.75
    );

    Object.values(uniforms).forEach((value) => {
      if (typeof value === "number") {
        expect(Number.isFinite(value)).toBe(true);
      }
    });
    expect(uniforms.steps).toBeGreaterThanOrEqual(64);
  });
});

describe("crystal cathedral fallback", () => {
  it("renders without throwing when WebGL2 is unavailable", () => {
    vi.stubGlobal("document", {
      createElement: () => ({
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
      })
    });

    const effect = new CrystalCathedralEffect();
    const ctx = createCanvasContext();

    expect(() => {
      effect.render({
        ctx,
        width: 320,
        height: 180,
        time: 0,
        delta: 1 / 60,
        audio: buildAudio(),
        params: {}
      });
    }).not.toThrow();
  });
});
