import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { computeCameraPunchThroughTransitionState } from "./transitions/cameraPunchThrough";

describe("computeCameraPunchThroughTransitionState", () => {
  it("clamps progress outside the valid range", () => {
    expect(computeCameraPunchThroughTransitionState(-1)).toEqual(computeCameraPunchThroughTransitionState(0));
    expect(computeCameraPunchThroughTransitionState(2)).toEqual(computeCameraPunchThroughTransitionState(1));
  });

  it("ramps the outgoing zoom, incoming handoff, and impact flash", () => {
    const start = computeCameraPunchThroughTransitionState(0.1);
    const mid = computeCameraPunchThroughTransitionState(0.6);
    const end = computeCameraPunchThroughTransitionState(0.95);

    expect(mid.fromZoom).toBeGreaterThan(start.fromZoom);
    expect(mid.streakAlpha).toBeGreaterThan(0);
    expect(mid.toAlpha).toBeGreaterThan(start.toAlpha);
    expect(end.impactAlpha).toBeGreaterThan(mid.impactAlpha);
    expect(end.fromAlpha).toBeLessThan(mid.fromAlpha);
  });
});

describe("renderer mobile transition fallback wiring", () => {
  it("passes duration into the default mobile crossfade fallback call", () => {
    const source = readFileSync(join(process.cwd(), "src/renderer/renderer.ts"), "utf8");
    expect(source).toContain("this.drawMobileDefaultCrossfade(targetCtx, transition.progress, transition.duration, width, height);");
  });
});
