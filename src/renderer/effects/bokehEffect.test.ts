import { describe, expect, it } from "vitest";

import { BOKEH_CONFIG, SLOW_BOKEH_CONFIG, buildBokehCircles } from "./bokehEffect";

const BASE_AUDIO = {
  timeDomain: new Uint8Array(),
  frequency: new Uint8Array(),
  rms: 0,
  bass: 0.2,
  mid: 0,
  treble: 0.1,
  beat: false,
  beatStrength: 0
};

describe("buildBokehCircles", () => {
  it("returns deterministic circles for the same inputs", () => {
    const first = buildBokehCircles(1.2, 800, 600, BASE_AUDIO, BOKEH_CONFIG);
    const second = buildBokehCircles(1.2, 800, 600, BASE_AUDIO, BOKEH_CONFIG);

    expect(first).toHaveLength(BOKEH_CONFIG.count);
    expect(second).toEqual(first);
  });

  it("moves the slow bokeh circles more gently over time", () => {
    const timeA = 2.5;
    const timeB = 3.5;
    const normalA = buildBokehCircles(timeA, 800, 600, BASE_AUDIO, BOKEH_CONFIG);
    const normalB = buildBokehCircles(timeB, 800, 600, BASE_AUDIO, BOKEH_CONFIG);
    const slowA = buildBokehCircles(timeA, 800, 600, BASE_AUDIO, SLOW_BOKEH_CONFIG);
    const slowB = buildBokehCircles(timeB, 800, 600, BASE_AUDIO, SLOW_BOKEH_CONFIG);

    const averageDistance = (start: typeof normalA, end: typeof normalB) => {
      const total = start.reduce((acc, circle, index) => {
        const next = end[index];
        return acc + Math.hypot(circle.x - next.x, circle.y - next.y);
      }, 0);
      return total / start.length;
    };

    const normalDistance = averageDistance(normalA, normalB);
    const slowDistance = averageDistance(slowA, slowB);

    expect(slowDistance).toBeLessThan(normalDistance);
  });
});
