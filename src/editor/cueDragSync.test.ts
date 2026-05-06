import { describe, expect, it } from "vitest";
import { RawTimelineConfig } from "../config/loadConfig";
import { applyCueDragPosition, pickCueForDrag, toNormalizedCanvasPoint } from "./cueDragSync";

const makeTimeline = (): RawTimelineConfig => ({
  audio: { src: "/song.mp3" },
  intro: { end: 0, script: [] },
  sections: [],
  textCues: [
    { id: "a", start: 1, text: "A", x: 0.2, y: 0.3, size: 40 },
    { id: "b", start: 2, text: "B", x: 0.5, y: 0.6, size: 40, mobile: { x: 0.7, y: 0.8, size: 30 } }
  ]
});

describe("cueDragSync", () => {
  it("maps pointer coordinates into normalized canvas coordinates", () => {
    const point = toNormalizedCanvasPoint(150, 75, { left: 100, top: 50, width: 200, height: 100 } as DOMRect);
    expect(point).toEqual({ x: 0.25, y: 0.25 });
  });

  it("chooses topmost matching cue in draw order", () => {
    const cuePositions = new Map<string, { x: number; y: number }>([
      ["a", { x: 0.5, y: 0.5 }],
      ["b", { x: 0.52, y: 0.5 }]
    ]);
    expect(pickCueForDrag(["a", "b"], cuePositions, { x: 0.51, y: 0.5 }, 0.03)).toBe("b");
  });

  it("updates desktop cue coordinates when not in mobile fit", () => {
    const timeline = makeTimeline();
    expect(applyCueDragPosition(timeline, "a", { x: 0.3333, y: 0.77777 }, false)).toBe(true);
    expect(timeline.textCues?.[0].x).toBe(0.333);
    expect(timeline.textCues?.[0].y).toBe(0.778);
    expect(timeline.textCues?.[0].units).toBe("normalized");
  });

  it("updates only mobile cue coordinates in mobile fit", () => {
    const timeline = makeTimeline();
    expect(applyCueDragPosition(timeline, "b", { x: 0.2222, y: 0.1111 }, true)).toBe(true);
    expect(timeline.textCues?.[1].mobile).toMatchObject({ x: 0.222, y: 0.111, size: 30 });
    expect(timeline.textCues?.[1].x).toBe(0.5);
    expect(timeline.textCues?.[1].y).toBe(0.6);
  });
});
