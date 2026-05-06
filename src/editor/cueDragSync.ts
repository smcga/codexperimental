import { RawTimelineConfig } from "../config/loadConfig";

export const CUE_DRAG_HIT_RADIUS = 0.08;

export const toNormalizedCanvasPoint = (
  pointerX: number,
  pointerY: number,
  rect: DOMRect
): { x: number; y: number } | null => {
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }
  const x = (pointerX - rect.left) / rect.width;
  const y = (pointerY - rect.top) / rect.height;
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) {
    return null;
  }
  return { x, y };
};

export const pickCueForDrag = (
  cueIdsInDrawOrder: string[],
  cuePositions: Map<string, { x: number; y: number }>,
  point: { x: number; y: number },
  radius = CUE_DRAG_HIT_RADIUS
): string | null => {
  const radiusSq = radius * radius;
  for (let index = cueIdsInDrawOrder.length - 1; index >= 0; index -= 1) {
    const cueId = cueIdsInDrawOrder[index];
    const cuePoint = cuePositions.get(cueId);
    if (!cuePoint) {
      continue;
    }
    const dx = cuePoint.x - point.x;
    const dy = cuePoint.y - point.y;
    if (dx * dx + dy * dy <= radiusSq) {
      return cueId;
    }
  }
  return null;
};

export const applyCueDragPosition = (
  timeline: RawTimelineConfig,
  cueId: string,
  point: { x: number; y: number },
  mobileFit: boolean,
  round = (value: number): number => Number(value.toFixed(4))
): boolean => {
  const cue = timeline.textCues?.find((entry) => entry.id === cueId);
  if (!cue) {
    return false;
  }
  if (mobileFit) {
    cue.mobile = {
      ...cue.mobile,
      x: round(point.x),
      y: round(point.y)
    };
    return true;
  }
  cue.x = round(point.x);
  cue.y = round(point.y);
  cue.units = "normalized";
  return true;
};
