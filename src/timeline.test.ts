import { describe, expect, it } from "vitest";
import { dropTime, getActiveTextIndex, getEffectState, timelineLines } from "./timeline";

describe("timeline", () => {
  it("returns correct active text index for line midpoints", () => {
    timelineLines.forEach((line, index) => {
      const midpoint = line.start + (line.end - line.start) / 2;
      expect(getActiveTextIndex(midpoint)).toBe(index);
    });
  });

  it("drop time follows line 6 shortly after it appears", () => {
    const line6 = timelineLines[5];
    expect(dropTime).toBeGreaterThan(line6.start);
    expect(dropTime - line6.start).toBeLessThanOrEqual(2);
  });

  it("plasma and tunnel peaks do not overlap", () => {
    const plasmaTime = timelineLines[2].start + 1.5;
    const tunnelTime = timelineLines[4].start + 1.5;
    const plasmaState = getEffectState(plasmaTime);
    const tunnelState = getEffectState(tunnelTime);
    expect(plasmaState.plasma).toBeGreaterThan(0.2);
    expect(plasmaState.tunnel).toBeLessThan(0.2);
    expect(tunnelState.tunnel).toBeGreaterThan(0.2);
    expect(tunnelState.plasma).toBeLessThan(0.2);
  });
});
