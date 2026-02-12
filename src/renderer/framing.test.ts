import { describe, expect, it } from "vitest";

import { computeFraming } from "./framing";

describe("computeFraming", () => {
  it("uses desktop cinematic for wide screens by default", () => {
    const framing = computeFraming(1366, 768, 320, 180, "pcdemo");

    expect(framing.mode).toBe("desktopCinematic");
  });

  it("uses mobile fit for portrait screens", () => {
    const framing = computeFraming(390, 844, 320, 180, "pcdemo");

    expect(framing.mode).toBe("mobileFit");
  });

  it("uses contain scaling in mobile fit mode", () => {
    const framing = computeFraming(390, 844, 320, 180, "pcdemo");

    expect(framing.present.scale).toBeCloseTo(Math.min(390 / 320, 844 / 180), 5);
  });

  it("computes safe rect inset and bounds", () => {
    const framing = computeFraming(390, 844, 320, 180, "pcdemo");

    expect(framing.safe.x).toBeGreaterThanOrEqual(12);
    expect(framing.safe.y).toBeGreaterThanOrEqual(12);
    expect(framing.safe.x + framing.safe.w).toBeLessThanOrEqual(320);
    expect(framing.safe.y + framing.safe.h).toBeLessThanOrEqual(180);
  });
});
