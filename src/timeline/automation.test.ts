import { describe, expect, it } from "vitest";

import { resolveAutomatedParams } from "./automation";

describe("resolveAutomatedParams", () => {
  it("interpolates linearly at the midpoint", () => {
    const params = resolveAutomatedParams(
      15,
      { twist: 50 },
      [{ param: "twist", from: 50, to: 75, t0: 10, t1: 20, ease: "linear" }]
    );

    expect(params.twist).toBeCloseTo(62.5);
  });

  it("clamps outside the range", () => {
    const automation = { param: "twist", from: 50, to: 75, t0: 10, t1: 20, ease: "linear" };

    expect(resolveAutomatedParams(5, { twist: 50 }, [automation]).twist).toBe(50);
    expect(resolveAutomatedParams(25, { twist: 50 }, [automation]).twist).toBe(75);
  });

  it("treats t0 == t1 as a step", () => {
    const automation = { param: "speed", from: 1, to: 2, t0: 10, t1: 10, ease: "linear" };

    expect(resolveAutomatedParams(9, { speed: 1 }, [automation]).speed).toBe(1);
    expect(resolveAutomatedParams(10, { speed: 1 }, [automation]).speed).toBe(2);
  });

  it("defaults unknown easing to linear", () => {
    const params = resolveAutomatedParams(
      5,
      { twist: 0 },
      [{ param: "twist", from: 0, to: 10, t0: 0, t1: 10, ease: "nope" as "linear" }]
    );

    expect(params.twist).toBeCloseTo(5);
  });

  it("uses the last automation for the same key", () => {
    const params = resolveAutomatedParams(5, { speed: 1 }, [
      { param: "speed", from: 0, to: 2, t0: 0, t1: 10, ease: "linear" },
      { param: "speed", from: 2, to: 4, t0: 0, t1: 10, ease: "linear" }
    ]);

    expect(params.speed).toBeCloseTo(3);
  });

  it("preserves untouched base params", () => {
    const params = resolveAutomatedParams(5, { speed: 1, glow: 0.4 }, [
      { param: "speed", from: 1, to: 2, t0: 0, t1: 10, ease: "linear" }
    ]);

    expect(params.speed).toBeCloseTo(1.5);
    expect(params.glow).toBeCloseTo(0.4);
  });
});
