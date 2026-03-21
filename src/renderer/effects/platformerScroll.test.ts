import { describe, expect, it, vi } from "vitest";

import {
  buildRunnerSprite,
  getRunnerJumpState,
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
    createLinearGradient: vi.fn(() => createGradient())
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

  it("getRunnerJumpState adds a crouch, delayed takeoff, and curled pose on upward jumps", () => {
    const anticipation = getRunnerJumpState(220, 180, 0.08, 0.3);
    const airborne = getRunnerJumpState(220, 180, 0.5, 0.3);
    const grounded = getRunnerJumpState(180, 220, 0.5, 0.3);

    expect(anticipation.crouchOffset).toBeGreaterThan(0);
    expect(anticipation.jumpOffset).toBe(0);
    expect(airborne.jumpOffset).toBeGreaterThan(20);
    expect(airborne.poseAmount).toBeGreaterThan(0.8);
    expect(airborne.supportBlend).toBeLessThan(1);
    expect(grounded.crouchOffset).toBe(0);
    expect(grounded.poseAmount).toBe(0);
  });

  it("buildRunnerSprite creates a colorful mascot silhouette with animated limbs", () => {
    const earlyFrame = buildRunnerSprite(100, 160, 16, 0, 0.2);
    const laterFrame = buildRunnerSprite(100, 160, 16, 0.2, 0.2);
    const palette = new Set(earlyFrame.parts.map((part) => part.color));
    const partNames = new Set(earlyFrame.parts.map((part) => part.name));
    const earlyFrontShoe = earlyFrame.parts.find((part) => part.name === "shoe-front");
    const laterFrontShoe = laterFrame.parts.find((part) => part.name === "shoe-front");

    expect(palette.size).toBeGreaterThanOrEqual(7);
    expect(partNames.has("scarf-knot")).toBe(true);
    expect(partNames.has("glove-front")).toBe(true);
    expect(partNames.has("quill-back-top")).toBe(true);
    expect(earlyFrame.shadow.w).toBeGreaterThan(0);
    expect(earlyFrontShoe?.x).not.toBe(laterFrontShoe?.x);
  });

  it("buildRunnerSprite tucks the limbs inward while airborne", () => {
    const running = buildRunnerSprite(100, 160, 16, 0.1, 0.2, 0);
    const jumping = buildRunnerSprite(100, 160, 16, 0.1, 0.2, 1);
    const runningFrontShoe = running.parts.find((part) => part.name === "shoe-front");
    const jumpingFrontShoe = jumping.parts.find((part) => part.name === "shoe-front");
    const runningFrontGlove = running.parts.find((part) => part.name === "glove-front");
    const jumpingFrontGlove = jumping.parts.find((part) => part.name === "glove-front");

    expect(runningFrontShoe && jumpingFrontShoe).toBeTruthy();
    expect(runningFrontGlove && jumpingFrontGlove).toBeTruthy();
    expect(jumpingFrontShoe!.y).toBeLessThan(runningFrontShoe!.y);
    expect(Math.abs(jumpingFrontShoe!.x - 100)).toBeLessThan(Math.abs(runningFrontShoe!.x - 100));
    expect(jumpingFrontGlove!.y).toBeLessThan(runningFrontGlove!.y);
  });
});

describe("PlatformerScrollEffect", () => {
  it("exposes stable defaults for docs and UI", () => {
    expect(PLATFORMER_SCROLL_DEFAULTS.speed).toBe(140);
    expect(PLATFORMER_SCROLL_DEFAULTS.seed).toBe(1337);
    expect(PLATFORMER_SCROLL_DEFAULTS.tileSize).toBeGreaterThanOrEqual(8);
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
    expect(colorUsage.get("#2563eb") ?? 0).toBeGreaterThan(0);
    expect(colorUsage.get("#ffb703") ?? 0).toBeGreaterThan(0);
    expect(colorUsage.get("#ef4444") ?? 0).toBeGreaterThan(0);
    expect(colorUsage.get("#f8fafc") ?? 0).toBeGreaterThan(0);
  });
});
