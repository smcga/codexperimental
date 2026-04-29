export type CurveType =
  | "Linear"
  | "SingleCurve"
  | "DoubleCurve"
  | "Hold"
  | "Stairs"
  | "Smooth"
  | "Pulse"
  | "Wave";

export type InteractionMode = "free" | "step";

export type ControlPoint = {
  time: number;
  value: number;
};

export type SegmentMeta = {
  curveType: CurveType;
  tension: number;
};

export type AutomationClip = {
  points: ControlPoint[];
  mode: InteractionMode;
  segmentMeta: SegmentMeta[];
};
export type AxisConstraint = "none" | "horizontal" | "vertical";
export type HitKind = "point" | "segment" | "empty";
export type HitTarget =
  | { kind: "point"; pointIndex: number }
  | { kind: "segment"; segmentIndex: number }
  | { kind: "empty" };

export const MIN_POINTS = 2;
export const DEFAULT_SEGMENT_META: SegmentMeta = { curveType: "Linear", tension: 0 };

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const sortPoints = (points: ControlPoint[]): ControlPoint[] => [...points].sort((a, b) => a.time - b.time);

export const snapTime = (time: number, gridSize: number, snapEnabled: boolean): number => {
  if (!snapEnabled || gridSize <= 0 || !Number.isFinite(time)) {
    return time;
  }
  return Math.round(time / gridSize) * gridSize;
};

export const createAutomationClip = (points: ControlPoint[], mode: InteractionMode = "free"): AutomationClip => {
  const normalized = sortPoints(points).map((point) => ({ ...point }));
  if (normalized.length < MIN_POINTS) {
    throw new Error("Automation clips require at least two control points.");
  }
  return {
    points: normalized,
    mode,
    segmentMeta: Array.from({ length: normalized.length - 1 }, () => ({ ...DEFAULT_SEGMENT_META }))
  };
};

const normalizeSegmentMeta = (clip: AutomationClip): SegmentMeta[] => {
  return Array.from({ length: Math.max(0, clip.points.length - 1) }, (_, index) => ({
    curveType: clip.segmentMeta[index]?.curveType ?? "Linear",
    tension: clamp(clip.segmentMeta[index]?.tension ?? 0, -1, 1)
  }));
};

export const insertPoint = (
  clip: AutomationClip,
  point: ControlPoint,
  options: { gridSize: number; snapEnabled: boolean }
): AutomationClip => {
  const time = snapTime(point.time, options.gridSize, options.snapEnabled);
  const value = clamp(point.value, 0, 1);
  const duplicate = clip.points.find((entry) => Math.abs(entry.time - time) < 1e-6 && Math.abs(entry.value - value) < 1e-6);
  if (duplicate) {
    return clip;
  }
  const insertionIndex = clip.points.findIndex((entry) => time < entry.time);
  const normalizedInsertIndex = insertionIndex < 0 ? clip.points.length : insertionIndex;
  const nextPoints = [...clip.points];
  nextPoints.splice(normalizedInsertIndex, 0, { time, value });
  const leftMeta = clip.segmentMeta[Math.max(0, normalizedInsertIndex - 1)] ?? { ...DEFAULT_SEGMENT_META };
  const rightMeta = clip.segmentMeta[normalizedInsertIndex] ?? { ...leftMeta };
  const nextSegmentMeta = [...clip.segmentMeta];
  if (clip.points.length === 2) {
    nextSegmentMeta.splice(0, nextSegmentMeta.length, { ...leftMeta }, { ...rightMeta });
  } else {
    nextSegmentMeta.splice(Math.max(0, normalizedInsertIndex - 1), normalizedInsertIndex === 0 ? 0 : 1, { ...leftMeta }, { ...rightMeta });
  }
  const next: AutomationClip = {
    ...clip,
    points: nextPoints,
    segmentMeta: normalizeSegmentMeta({ ...clip, points: nextPoints, segmentMeta: nextSegmentMeta })
  };
  return next;
};

export const removePoint = (clip: AutomationClip, pointIndex: number): AutomationClip => {
  if (clip.points.length <= MIN_POINTS) {
    return clip;
  }
  const nextPoints = clip.points.filter((_, index) => index !== pointIndex);
  if (nextPoints.length < MIN_POINTS) {
    return clip;
  }
  const nextSegmentMeta = [...clip.segmentMeta];
  if (pointIndex > 0 && pointIndex < clip.points.length - 1) {
    const merged = nextSegmentMeta[pointIndex - 1] ?? nextSegmentMeta[pointIndex] ?? { ...DEFAULT_SEGMENT_META };
    nextSegmentMeta.splice(pointIndex - 1, 2, merged);
  } else if (pointIndex === 0) {
    nextSegmentMeta.splice(0, 1);
  } else {
    nextSegmentMeta.splice(Math.max(0, nextSegmentMeta.length - 1), 1);
  }
  return {
    ...clip,
    points: nextPoints,
    segmentMeta: normalizeSegmentMeta({ ...clip, points: nextPoints, segmentMeta: nextSegmentMeta })
  };
};

export const movePoint = (
  clip: AutomationClip,
  pointIndex: number,
  target: ControlPoint,
  options: { gridSize: number; snapEnabled: boolean; slideMode: boolean }
): AutomationClip => {
  const points = clip.points.map((point) => ({ ...point }));
  if (!points[pointIndex]) {
    return clip;
  }
  const current = points[pointIndex];
  const nextTime = snapTime(target.time, options.gridSize, options.snapEnabled);
  const deltaTime = nextTime - current.time;
  points[pointIndex] = { time: nextTime, value: clamp(target.value, 0, 1) };

  if (options.slideMode && Math.abs(deltaTime) > 1e-9) {
    for (let index = pointIndex + 1; index < points.length; index += 1) {
      points[index] = { ...points[index], time: points[index].time + deltaTime };
    }
  }

  const nextPoints = sortPoints(points);
  return {
    ...clip,
    points: nextPoints,
    segmentMeta: normalizeSegmentMeta({ ...clip, points: nextPoints, segmentMeta: clip.segmentMeta })
  };
};

export const setSegmentTension = (clip: AutomationClip, segmentIndex: number, tension: number): AutomationClip => {
  if (segmentIndex < 0 || segmentIndex >= clip.segmentMeta.length) {
    return clip;
  }
  const segmentMeta = clip.segmentMeta.map((meta, index) =>
    index === segmentIndex ? { ...meta, tension: clamp(tension, -1, 1) } : meta
  );
  return { ...clip, segmentMeta };
};

export const setSegmentCurveType = (clip: AutomationClip, segmentIndex: number, curveType: CurveType): AutomationClip => {
  if (segmentIndex < 0 || segmentIndex >= clip.segmentMeta.length) {
    return clip;
  }
  const segmentMeta = clip.segmentMeta.map((meta, index) => (index === segmentIndex ? { ...meta, curveType } : meta));
  return { ...clip, segmentMeta };
};

export const applyAxisConstraint = (
  origin: ControlPoint,
  target: ControlPoint,
  constraint: AxisConstraint
): ControlPoint => {
  if (constraint === "horizontal") {
    return { time: target.time, value: origin.value };
  }
  if (constraint === "vertical") {
    return { time: origin.time, value: target.value };
  }
  return target;
};

export const createStepDrawPoints = (
  from: ControlPoint,
  to: ControlPoint,
  gridSize: number,
  snapEnabled: boolean
): ControlPoint[] => {
  const start = snapTime(from.time, gridSize, snapEnabled);
  const end = snapTime(to.time, gridSize, snapEnabled);
  const minTime = Math.min(start, end);
  const maxTime = Math.max(start, end);
  const step = gridSize > 0 ? gridSize : 0.1;
  const points: ControlPoint[] = [];
  for (let time = minTime; time <= maxTime + 1e-6; time += step) {
    const progress = maxTime === minTime ? 0 : (time - minTime) / (maxTime - minTime);
    points.push({
      time,
      value: clamp(from.value + (to.value - from.value) * progress, 0, 1)
    });
  }
  return points;
};

export const hitTestAutomationClip = (
  clip: AutomationClip,
  cursor: ControlPoint,
  tolerance: { time: number; value: number }
): HitTarget => {
  const pointIndex = clip.points.findIndex(
    (point) => Math.abs(point.time - cursor.time) <= tolerance.time && Math.abs(point.value - cursor.value) <= tolerance.value
  );
  if (pointIndex >= 0) {
    return { kind: "point", pointIndex };
  }
  const segmentIndex = clip.points.findIndex((point, index) => {
    if (index >= clip.points.length - 1) {
      return false;
    }
    const right = clip.points[index + 1];
    const minTime = Math.min(point.time, right.time);
    const maxTime = Math.max(point.time, right.time);
    if (cursor.time < minTime - tolerance.time || cursor.time > maxTime + tolerance.time) {
      return false;
    }
    const progress = maxTime - minTime <= 1e-6 ? 0 : (cursor.time - point.time) / (right.time - point.time);
    const expected = point.value + (right.value - point.value) * progress;
    return Math.abs(expected - cursor.value) <= tolerance.value;
  });
  if (segmentIndex >= 0) {
    return { kind: "segment", segmentIndex };
  }
  return { kind: "empty" };
};
