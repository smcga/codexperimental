import { describe, expect, it } from "vitest";
import {
  applyAxisConstraint,
  createStepDrawPoints,
  createAutomationClip,
  hitTestAutomationClip,
  insertPoint,
  movePoint,
  removePoint,
  setSegmentCurveType,
  setSegmentTension,
  snapTime
} from "./automationClip";

describe("automationClip", () => {
  it("snaps time to grid when enabled", () => {
    expect(snapTime(1.12, 0.25, true)).toBe(1);
    expect(snapTime(1.12, 0.25, false)).toBe(1.12);
  });

  it("adds points with snapping and keeps sorted timeline", () => {
    const clip = createAutomationClip([
      { time: 0, value: 0 },
      { time: 2, value: 1 }
    ]);

    const next = insertPoint(clip, { time: 1.13, value: 0.4 }, { gridSize: 0.25, snapEnabled: true });
    expect(next.points).toEqual([
      { time: 0, value: 0 },
      { time: 1.25, value: 0.4 },
      { time: 2, value: 1 }
    ]);
  });

  it("removes points but preserves a minimum of two points", () => {
    const clip = createAutomationClip([
      { time: 0, value: 0 },
      { time: 1, value: 0.3 },
      { time: 2, value: 1 }
    ]);
    const oneRemoved = removePoint(clip, 1);
    expect(oneRemoved.points).toEqual([
      { time: 0, value: 0 },
      { time: 2, value: 1 }
    ]);
    const blocked = removePoint(oneRemoved, 0);
    expect(blocked.points).toEqual(oneRemoved.points);
  });

  it("moves only one point when slide mode is off", () => {
    const clip = createAutomationClip([
      { time: 0, value: 0 },
      { time: 1, value: 0.5 },
      { time: 2, value: 1 }
    ]);

    const moved = movePoint(clip, 1, { time: 1.5, value: 0.25 }, { gridSize: 0.25, snapEnabled: true, slideMode: false });
    expect(moved.points).toEqual([
      { time: 0, value: 0 },
      { time: 1.5, value: 0.25 },
      { time: 2, value: 1 }
    ]);
  });

  it("slides all subsequent points when slide mode is on", () => {
    const clip = createAutomationClip([
      { time: 0, value: 0 },
      { time: 1, value: 0.5 },
      { time: 2, value: 1 }
    ]);

    const moved = movePoint(clip, 1, { time: 1.5, value: 0.25 }, { gridSize: 0.25, snapEnabled: true, slideMode: true });
    expect(moved.points).toEqual([
      { time: 0, value: 0 },
      { time: 1.5, value: 0.25 },
      { time: 2.5, value: 1 }
    ]);
  });

  it("sets per-segment tension and curve type with clamping", () => {
    const clip = createAutomationClip([
      { time: 0, value: 0 },
      { time: 1, value: 0.5 },
      { time: 2, value: 1 }
    ]);

    const tensioned = setSegmentTension(clip, 0, 4);
    expect(tensioned.segmentMeta[0].tension).toBe(1);
    const curved = setSegmentCurveType(tensioned, 0, "Hold");
    expect(curved.segmentMeta[0].curveType).toBe("Hold");
  });

  it("supports axis-constrained drawing behavior", () => {
    expect(
      applyAxisConstraint({ time: 1, value: 0.2 }, { time: 2, value: 0.8 }, "horizontal")
    ).toEqual({ time: 2, value: 0.2 });
    expect(
      applyAxisConstraint({ time: 1, value: 0.2 }, { time: 2, value: 0.8 }, "vertical")
    ).toEqual({ time: 1, value: 0.8 });
  });

  it("creates step-mode points at grid intervals", () => {
    const points = createStepDrawPoints({ time: 0, value: 0 }, { time: 1, value: 1 }, 0.25, true);
    expect(points.map((point) => point.time)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it("uses point > segment > empty hit priority", () => {
    const clip = createAutomationClip([
      { time: 0, value: 0 },
      { time: 1, value: 1 }
    ]);
    const pointHit = hitTestAutomationClip(clip, { time: 0.02, value: 0.01 }, { time: 0.05, value: 0.05 });
    expect(pointHit).toEqual({ kind: "point", pointIndex: 0 });

    const segmentHit = hitTestAutomationClip(clip, { time: 0.5, value: 0.5 }, { time: 0.05, value: 0.05 });
    expect(segmentHit).toEqual({ kind: "segment", segmentIndex: 0 });

    const emptyHit = hitTestAutomationClip(clip, { time: 0.5, value: 0.9 }, { time: 0.05, value: 0.05 });
    expect(emptyHit).toEqual({ kind: "empty" });
  });

  it("preserves neighboring segment metadata when inserting and removing points", () => {
    const base = createAutomationClip([
      { time: 0, value: 0 },
      { time: 2, value: 1 },
      { time: 4, value: 0.5 }
    ]);
    base.segmentMeta = [
      { curveType: "Hold", tension: 0.6 },
      { curveType: "Wave", tension: -0.2 }
    ];
    const inserted = insertPoint(base, { time: 1, value: 0.4 }, { gridSize: 0.1, snapEnabled: false });
    expect(inserted.segmentMeta[0].curveType).toBe("Hold");
    expect(inserted.segmentMeta[1].curveType).toBe("Wave");
    const removed = removePoint(inserted, 1);
    expect(removed.segmentMeta[0].curveType).toBe("Hold");
  });
});
