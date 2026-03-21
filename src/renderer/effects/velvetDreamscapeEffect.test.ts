import { describe, expect, it, vi } from "vitest";

import {
  buildVelvetDreamscapeBlooms,
  buildVelvetDreamscapeRibbons,
  computeVelvetDreamscapeAnchor,
  VelvetDreamscapeEffect,
  velvetDreamscapeHash,
  VELVET_DREAMSCAPE_DEFAULTS
} from "./velvetDreamscapeEffect";

const createCtx = () => {
  const gradient = { addColorStop: vi.fn() };
  return {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "round",
    globalCompositeOperation: "source-over",
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn()
  } as unknown as CanvasRenderingContext2D;
};

const makeAudio = () => ({
  bass: 0.24,
  mid: 0.31,
  treble: 0.46,
  rms: 0.29,
  beat: true,
  beatStrength: 0.44,
  impactStrength: 0,
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0)
});

describe("VelvetDreamscapeEffect", () => {
  it("keeps hash values deterministic and in range", () => {
    const sample = velvetDreamscapeHash(7.25);
    expect(sample).toBeGreaterThanOrEqual(0);
    expect(sample).toBeLessThan(1);
    expect(velvetDreamscapeHash(7.25)).toBe(sample);
  });

  it("builds deterministic ribbons and blooms", () => {
    const ribbons = buildVelvetDreamscapeRibbons(5, 11);
    const blooms = buildVelvetDreamscapeBlooms(5);

    expect(ribbons).toHaveLength(11);
    expect(ribbons[0]).toEqual(buildVelvetDreamscapeRibbons(5, 11)[0]);
    expect(blooms).toHaveLength(7);
    ribbons.forEach((ribbon) => {
      expect(ribbon.thickness).toBeGreaterThanOrEqual(18);
      expect(ribbon.thickness).toBeLessThanOrEqual(54);
      expect(ribbon.alpha).toBeGreaterThan(0.15);
    });
  });

  it("computes an anchor near the visual center", () => {
    const anchor = computeVelvetDreamscapeAnchor({
      width: 640,
      height: 360,
      time: 1.8,
      flow: 0.7,
      focus: 0.6,
      energy: 0.5
    });

    expect(anchor.x).toBeGreaterThan(240);
    expect(anchor.x).toBeLessThan(420);
    expect(anchor.y).toBeGreaterThan(130);
    expect(anchor.y).toBeLessThan(230);
    expect(anchor.radius).toBeGreaterThan(70);
  });

  it("renders layered ribbons, blooms, and grain without throwing", () => {
    const effect = new VelvetDreamscapeEffect();
    const ctx = createCtx();

    effect.render({
      ctx,
      width: 640,
      height: 360,
      time: 2.6,
      delta: 1 / 60,
      audio: makeAudio(),
      params: {
        bloom: 0.92,
        flow: 0.8,
        ribbonCount: 14,
        grain: 0.45,
        hueDrift: 0.18,
        focus: 0.66,
        audioReact: 0.85,
        seed: 8
      }
    });

    expect((ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.bezierCurveTo as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.ellipse as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("resets cached ribbons and blooms", () => {
    const effect = new VelvetDreamscapeEffect();
    const ctx = createCtx();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0,
      delta: 1 / 60,
      audio: makeAudio(),
      params: { seed: 12, ribbonCount: 9 }
    });

    expect((effect as unknown as { cachedRibbons: unknown[] }).cachedRibbons.length).toBeGreaterThan(0);
    expect((effect as unknown as { cachedBlooms: unknown[] }).cachedBlooms.length).toBeGreaterThan(0);
    effect.reset();
    expect((effect as unknown as { cachedRibbons: unknown[] }).cachedRibbons).toEqual([]);
    expect((effect as unknown as { cachedBlooms: unknown[] }).cachedBlooms).toEqual([]);
  });

  it("exposes stable defaults for docs and editor controls", () => {
    expect(VELVET_DREAMSCAPE_DEFAULTS.ribbonCount).toBeGreaterThanOrEqual(4);
    expect(VELVET_DREAMSCAPE_DEFAULTS.focus).toBeGreaterThan(0);
    expect(VELVET_DREAMSCAPE_DEFAULTS.seed).toBe(5);
  });
});
