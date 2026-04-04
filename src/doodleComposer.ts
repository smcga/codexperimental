export const DOODLE_BRUSH_COLORS = [
  "#8ef9ff",
  "#ff7bd5",
  "#ffe066",
  "#9fffc5",
  "#ff9b71",
  "#f5f7ff"
] as const;

export const DEFAULT_DOODLE_BRUSH_COLOR = DOODLE_BRUSH_COLORS[0];
export const DEFAULT_DOODLE_BRUSH_SIZE = 8;
export const MIN_DOODLE_BRUSH_SIZE = 2;
export const MAX_DOODLE_BRUSH_SIZE = 24;

export function clampDoodleBrushSize(size: number): number {
  if (!Number.isFinite(size)) {
    return DEFAULT_DOODLE_BRUSH_SIZE;
  }
  return Math.min(MAX_DOODLE_BRUSH_SIZE, Math.max(MIN_DOODLE_BRUSH_SIZE, Math.round(size)));
}

export function normalizeDoodleBrushColor(color: string | null | undefined): string {
  if (!color) {
    return DEFAULT_DOODLE_BRUSH_COLOR;
  }
  const normalized = color.trim().toLowerCase();
  return DOODLE_BRUSH_COLORS.find((entry) => entry === normalized) ?? DEFAULT_DOODLE_BRUSH_COLOR;
}

export function getDoodleBrushSizeLabel(size: number): string {
  const clamped = clampDoodleBrushSize(size);
  if (clamped <= 5) {
    return "Small";
  }
  if (clamped >= 16) {
    return "Large";
  }
  return "Medium";
}
