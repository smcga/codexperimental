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
  const nextPoints = sortPoints([...clip.points, { time, value }]);
  const next: AutomationClip = {
    ...clip,
    points: nextPoints,
    segmentMeta: normalizeSegmentMeta({ ...clip, points: nextPoints })
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
  return {
    ...clip,
    points: nextPoints,
    segmentMeta: normalizeSegmentMeta({ ...clip, points: nextPoints })
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
    segmentMeta: normalizeSegmentMeta({ ...clip, points: nextPoints })
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
