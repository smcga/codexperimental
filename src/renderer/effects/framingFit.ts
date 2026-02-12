export type Rect = { x: number; y: number; w: number; h: number };

export function fitSquareToSafe(size: number, safeRect: Rect): number {
  return Math.min(size, safeRect.w, safeRect.h);
}

export function fitCircleToSafe(radius: number, safeRect: Rect): number {
  return Math.min(radius, safeRect.w * 0.5, safeRect.h * 0.5);
}
