export type FitAlign = "top" | "centre" | "bottom" | "fill";

export type PresentMode = "desktopCinematic" | "containAlign";

export type PresentTransform = {
  scale: number;
  dx: number;
  dy: number;
};

const SAFE_INSET_RATIO = 0.06;
const SAFE_INSET_MIN = 12;

export function computePresentTransform(
  screenW: number,
  screenH: number,
  srcW: number,
  srcH: number,
  align: FitAlign,
  mode: PresentMode
): PresentTransform {
  if (mode === "desktopCinematic" || align === "fill") {
    return computeDesktopCinematicTransform(screenW, screenH, srcW, srcH);
  }

  const slotHeight = screenH / 3;
  const scale = Math.min(screenW / srcW, slotHeight / srcH);
  const drawW = srcW * scale;
  const drawH = srcH * scale;
  const dx = (screenW - drawW) / 2;
  const slotOffsetY = align === "top" ? 0 : align === "bottom" ? slotHeight * 2 : slotHeight;
  const dy = slotOffsetY + (slotHeight - drawH) / 2;

  return { scale, dx, dy };
}

export function computeDesktopCinematicTransform(
  screenW: number,
  screenH: number,
  srcW: number,
  srcH: number
): PresentTransform {
  const targetAspect = srcW / srcH;
  const screenAspect = screenW / screenH;
  const scale =
    screenAspect < targetAspect
      ? screenH / srcH
      : Math.min(screenW / srcW, screenH / srcH);
  return {
    scale,
    dx: (screenW - srcW * scale) / 2,
    dy: (screenH - srcH * scale) / 2
  };
}

export function computeScreenSafeRect(screenW: number, screenH: number): { x: number; y: number; w: number; h: number } {
  const inset = Math.max(SAFE_INSET_MIN, Math.round(Math.min(screenW, screenH) * SAFE_INSET_RATIO));
  return {
    x: inset,
    y: inset,
    w: Math.max(1, screenW - inset * 2),
    h: Math.max(1, screenH - inset * 2)
  };
}
