import { describe, expect, it } from "vitest";

import { EaseName, easeFn, resolveAutomatedParams } from "./automation";

const ALL_EASES: EaseName[] = [
  "linear",
  "easeInOutQuad",
  "easeInQuad",
  "easeOutQuad",
  "easeInOutCubic",
  "easeInCubic",
  "easeOutCubic",
  "easeInOutQuart",
  "easeInOutQuint",
  "easeInSine",
  "easeOutSine",
  "easeInOutSine",
  "easeInExpo",
  "easeOutExpo",
  "easeInOutExpo",
  "easeInBack",
  "easeOutBack",
  "easeInOutBack",
  "easeOutBounce",
  "easeOutElastic",
  "easeInOutCirc"
];

const SMOOTH_EASES: EaseName[] = [
  "linear",
  "easeInOutQuad",
  "easeInQuad",
  "easeOutQuad",
  "easeInOutCubic",
  "easeInCubic",
  "easeOutCubic",
  "easeInOutQuart",
  "easeInOutQuint",
  "easeInSine",
  "easeOutSine",
  "easeInOutSine",
  "easeInExpo",
  "easeOutExpo",
  "easeInOutExpo",
  "easeInOutCirc"
];

const EPSILON = 1e-6;

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

  it("supports point-driven segment automation with hold curve", () => {
    const holdParams = resolveAutomatedParams(2, { speed: 1 }, [
      {
        param: "speed",
        from: 0,
        to: 1,
        t0: 0,
        t1: 10,
        points: [
          { time: 0, value: 0.25 },
          { time: 4, value: 0.75 },
          { time: 8, value: 0.4 }
        ],
        segmentMeta: [{ curveType: "Hold", tension: 0 }, { curveType: "Linear", tension: 0 }]
      }
    ]);
    const linearParams = resolveAutomatedParams(5, { speed: 1 }, [
      {
        param: "speed",
        from: 0,
        to: 1,
        t0: 0,
        t1: 10,
        points: [
          { time: 0, value: 0.25 },
          { time: 4, value: 0.75 },
          { time: 8, value: 0.4 }
        ],
        segmentMeta: [{ curveType: "Hold", tension: 0 }, { curveType: "Linear", tension: 0 }]
      }
    ]);
    expect(holdParams.speed).toBeCloseTo(0.25);
    expect(linearParams.speed).toBeCloseTo(0.6625);
  });
});

describe("easeFn", () => {
  it("hits endpoints for all easings", () => {
    ALL_EASES.forEach((ease) => {
      expect(easeFn(ease, 0)).toBeCloseTo(0, 6);
      expect(easeFn(ease, 1)).toBeCloseTo(1, 6);
    });
  });

  it("stays within [0,1] across the range", () => {
    ALL_EASES.forEach((ease) => {
      for (let step = 0; step <= 10; step += 1) {
        const t = step / 10;
        const value = easeFn(ease, t);
        expect(value).toBeGreaterThanOrEqual(-EPSILON);
        expect(value).toBeLessThanOrEqual(1 + EPSILON);
      }
    });
  });

  it("is monotone for smooth easings", () => {
    SMOOTH_EASES.forEach((ease) => {
      let previous = easeFn(ease, 0);
      for (let step = 1; step <= 20; step += 1) {
        const t = step / 20;
        const value = easeFn(ease, t);
        expect(value + EPSILON).toBeGreaterThanOrEqual(previous);
        previous = value;
      }
    });
  });
});
