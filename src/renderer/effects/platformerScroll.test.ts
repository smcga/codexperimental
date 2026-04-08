import { describe, expect, it, vi } from "vitest";

import {
  buildCollectibleSprite,
  buildRunnerSprite,
  collectibleAt,
  hash1,
  PLATFORMER_SCROLL_DEFAULTS,
  PlatformerScrollEffect,
  platformAt,
  runnerJumpOffset,
  supportTopY
} from "./platformerScroll";

const createGradient = () => ({ addColorStop: vi.fn() });

const createCtx = () =>
  ({
    fillStyle: "",
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fill: vi.fn(),
    createLinearGradient: vi.fn(() => createGradient()),
    createRadialGradient: vi.fn(() => createGradient())
  }) as unknown as CanvasRenderingContext2D;

const audio = {
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.35,
  bass: 0.2,
  mid: 0.2,
  treble: 0.2,
  beat: true,
  beatStrength: 0.4,
  impactStrength: 0.25
};

describe("platformerScroll helpers", () => {
  it("hash1 is deterministic for the same index/seed", () => {
    const a = hash1(42, 1337);
    const b = hash1(42, 1337);

    expect(a).toBe(b);
  });

  it("hash1 stays in [0, 1)", () => {
    for (let i = -25; i <= 25; i += 1) {
      const value = hash1(i, 77);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("platformAt is deterministic for fixed inputs", () => {
    const sampleA = platformAt(128, 1337, 0.55, 5);
    const sampleB = platformAt(128, 1337, 0.55, 5);

    expect(sampleA).toEqual(sampleB);
  });

  it("platformAt bounds ySteps and length fields", () => {
    for (let col = -64; col <= 64; col += 1) {
      const platform = platformAt(col, 9001, 0.65, 4);
      expect(platform.ySteps).toBeGreaterThanOrEqual(0);
      expect(platform.ySteps).toBeLessThanOrEqual(4);
      expect(platform.lengthCols).toBeGreaterThanOrEqual(0);
      expect(platform.lengthCols).toBeLessThanOrEqual(5);
    }
  });

  it("supportTopY falls back to ground and never sinks below it", () => {
    const groundTop = 260;
    const result = supportTopY(12, 1234, 0.5, 5, 200, 16, groundTop, 2);

    expect(result).toBeLessThanOrEqual(groundTop - 2);
  });

  it("runnerJumpOffset creates an arc only when stepping up", () => {
    const upAtMid = runnerJumpOffset(220, 180, 0.5, 0.3);
    const flat = runnerJumpOffset(200, 200, 0.5, 0.3);
    const down = runnerJumpOffset(180, 220, 0.5, 0.3);

    expect(upAtMid).toBeGreaterThan(0);
    expect(flat).toBe(0);
    expect(down).toBe(0);
  });

  it("collectibleAt is deterministic and respects disabled rate", () => {
    expect(collectibleAt(12, 2024, 0)).toBe(false);
    expect(collectibleAt(44, 2024, 0.35)).toBe(collectibleAt(44, 2024, 0.35));
  });

  it("buildCollectibleSprite adds bobbing aura, gleam, and sparkles", () => {
    const spriteA = buildCollectibleSprite(120, 80, 16, 0.15, 30);
    const spriteB = buildCollectibleSprite(120, 80, 16, 0.55, 30);

    expect(spriteA.core.w).toBeGreaterThanOrEqual(2);
    expect(spriteA.aura.w).toBeGreaterThan(spriteA.core.w);
    expect(spriteA.shine.color).toBe("#fef9c3");
    expect(spriteA.sparkles).toHaveLength(4);
    expect(spriteA.core.y).not.toBe(spriteB.core.y);
  });

  it("buildRunnerSprite creates a colorful mascot silhouette with animated limbs", () => {
    const earlyFrame = buildRunnerSprite(100, 160, 16, 0, 0.2);
    const laterFrame = buildRunnerSprite(100, 160, 16, 0.2, 0.2);
    const palette = new Set(earlyFrame.parts.map((part) => part.color));
    const partNames = new Set(earlyFrame.parts.map((part) => part.name));
    const earlyFrontBoot = earlyFrame.parts.find((part) => part.name === "boot-front");
    const laterFrontBoot = laterFrame.parts.find((part) => part.name === "boot-front");

    expect(palette.size).toBeGreaterThanOrEqual(7);
    expect(partNames.has("helmet-front")).toBe(true);
    expect(partNames.has("gauntlet-front")).toBe(true);
    expect(partNames.has("antenna-tip")).toBe(true);
    expect(earlyFrame.shadow.w).toBeGreaterThan(0);
    expect(earlyFrontBoot?.x).not.toBe(laterFrontBoot?.x);
  });
});

describe("PlatformerScrollEffect", () => {
  it("exposes stable defaults for docs and UI", () => {
    expect(PLATFORMER_SCROLL_DEFAULTS.speed).toBe(140);
    expect(PLATFORMER_SCROLL_DEFAULTS.seed).toBe(1337);
    expect(PLATFORMER_SCROLL_DEFAULTS.tileSize).toBeGreaterThanOrEqual(8);
    expect(PLATFORMER_SCROLL_DEFAULTS.skyGlow).toBeGreaterThan(0);
  });

  it("renders a colorful runner instead of a monochrome block silhouette", () => {
    const effect = new PlatformerScrollEffect();
    const ctx = createCtx();
    const colorUsage = new Map<string, number>();

    (ctx.fillRect as ReturnType<typeof vi.fn>).mockImplementation(() => {
      const color = String((ctx as unknown as { fillStyle: unknown }).fillStyle);
      colorUsage.set(color, (colorUsage.get(color) ?? 0) + 1);
    });

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.25,
      delta: 1 / 60,
      audio,
      params: {}
    });

    expect((ctx.clearRect as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
    expect(colorUsage.get("#06b6d4") ?? 0).toBeGreaterThan(0);
    expect(colorUsage.get("#99f6e4") ?? 0).toBeGreaterThan(0);
    expect(colorUsage.get("#ff4d6d") ?? 0).toBeGreaterThan(0);
    expect(colorUsage.get("#fb923c") ?? 0).toBeGreaterThan(0);
    expect(colorUsage.get("#f8fafc") ?? 0).toBeGreaterThan(0);
    expect((ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("renders polished pickup colors when collectibles are frequent", () => {
    const effect = new PlatformerScrollEffect();
    const ctx = createCtx();
    const colorUsage = new Map<string, number>();

    (ctx.fillRect as ReturnType<typeof vi.fn>).mockImplementation(() => {
      const color = String((ctx as unknown as { fillStyle: unknown }).fillStyle);
      colorUsage.set(color, (colorUsage.get(color) ?? 0) + 1);
    });

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.35,
      delta: 1 / 60,
      audio,
      params: { collectibleRate: 1 }
    });

    const glowColorHit = [...colorUsage.keys()].some((color) => color.startsWith("rgba(253, 224, 71,"));
    expect(glowColorHit).toBe(true);
    expect(colorUsage.get("#fef9c3") ?? 0).toBeGreaterThan(0);
    expect(colorUsage.get("rgba(255, 255, 255, 0.65)") ?? 0).toBeGreaterThan(0);
  });
});
