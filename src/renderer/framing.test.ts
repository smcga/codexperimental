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

  it("forces mobile fit when override is enabled", () => {
    const framing = computeFraming(1366, 768, 320, 180, "pcdemo", "auto", { forceMobile: true });

    expect(framing.mode).toBe("mobileFit");
  });

  it("uses preview viewport dimensions for framing calculations", () => {
    const framing = computeFraming(360, 800, 320, 180, "pcdemo", "auto", { forceMobile: true });

    expect(framing.screenW).toBe(360);
    expect(framing.screenH).toBe(800);
    expect(framing.isPortrait).toBe(true);
  });

  it("matches safe inset between runtime mobile and forced preview mobile", () => {
    const runtimeMobile = computeFraming(390, 844, 320, 180, "pcdemo");
    const previewMobile = computeFraming(1366, 768, 320, 180, "pcdemo", "auto", { forceMobile: true });

    expect(previewMobile.mode).toBe("mobileFit");
    expect(previewMobile.safe).toEqual(runtimeMobile.safe);
  });

});
