import { describe, expect, it, vi } from "vitest";

import {
  applyUmbrellaFallSpeed,
  buildLemmingsTerrain,
  LEMMINGS_MARCH_DEFAULTS,
  LemmingsMarchEffect,
  lemmingsHash01,
  pickLemmingAbility
} from "./lemmingsMarchEffect";

const createGradient = () => ({ addColorStop: vi.fn() });

const createCtx = () =>
  ({
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    createLinearGradient: vi.fn(() => createGradient()),
    createRadialGradient: vi.fn(() => createGradient()),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn()
  }) as unknown as CanvasRenderingContext2D;

const audio = {
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.3,
  bass: 0.45,
  mid: 0.2,
  treble: 0.25,
  beat: false,
  beatStrength: 0.15,
  impactStrength: 0.12
};

describe("lemmingsMarchEffect helpers", () => {
  it("keeps a deterministic hash in the [0, 1) range", () => {
    const a = lemmingsHash01(12.5, 73);
    const b = lemmingsHash01(12.5, 73);

    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
    expect(b).toBe(a);
  });

  it("assigns deterministic contextual abilities", () => {
    expect(pickLemmingAbility(5, 73)).toBe(pickLemmingAbility(5, 73));
    expect(["walker", "climber", "digger", "basher", "builder", "floater"]).toContain(pickLemmingAbility(8, 73));
  });

  it("biases the colony toward bashers/builders for route editing", () => {
    const abilities = Array.from({ length: 120 }, (_, id) => pickLemmingAbility(id, 73));
    const routeEditors = abilities.filter((ability) => ability === "basher" || ability === "builder").length;
    expect(routeEditors).toBeGreaterThan(65);
  });

  it("builds repeating pillar-and-pit terrain with a goal zone", () => {
    const terrain = buildLemmingsTerrain(180, 240, 16, 73, 0.65, 0.2);
    const dropCount = terrain.surfaceY.slice(1).filter((y, idx) => y - terrain.surfaceY[idx] > 14).length;
    const majorWalls = terrain.wallHeight.filter((height) => height > 28).length;

    expect(terrain.surfaceY).toHaveLength(180);
    expect(dropCount).toBeGreaterThanOrEqual(2);
    expect(majorWalls).toBeGreaterThanOrEqual(5);
    expect(terrain.wallHeight[terrain.goalCol]).toBe(0);
    expect(Number.isFinite(terrain.bridgeY[terrain.goalCol])).toBe(true);
  });

  it("slows floaters during long falls", () => {
    const walkerVy = applyUmbrellaFallSpeed(140, "walker", 0.45);
    const floaterVy = applyUmbrellaFallSpeed(140, "floater", 0.45);

    expect(walkerVy).toBe(140);
    expect(floaterVy).toBeLessThan(walkerVy);
  });
});

describe("LemmingsMarchEffect", () => {
  it("exposes stable defaults for docs and UI", () => {
    expect(LEMMINGS_MARCH_DEFAULTS.spawnInterval).toBeGreaterThan(0);
    expect(LEMMINGS_MARCH_DEFAULTS.colonySize).toBeGreaterThan(0);
    expect(LEMMINGS_MARCH_DEFAULTS.seed).toBe(73);
  });

  it("renders the colony scene without throwing", () => {
    const effect = new LemmingsMarchEffect();
    const ctx = createCtx();

    for (let i = 0; i < 20; i += 1) {
      effect.render({
        ctx,
        width: 640,
        height: 360,
        time: i / 10,
        delta: 1 / 30,
        audio,
        params: { colonySize: 8, seed: 11 }
      });
    }

    expect((ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("supports reset by clearing internal state", () => {
    const effect = new LemmingsMarchEffect();
    const ctx = createCtx();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0,
      delta: 1 / 30,
      audio,
      params: { seed: 99 }
    });

    expect((effect as unknown as { state: unknown }).state).not.toBeNull();
    effect.reset();
    expect((effect as unknown as { state: unknown }).state).toBeNull();
  });
});
