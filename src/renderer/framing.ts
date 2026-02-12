export type FramingMode = "desktopCinematic" | "mobileFit";

export type FramingOverride = "auto" | FramingMode;

export type FramingState = {
  mode: FramingMode;
  screenW: number;
  screenH: number;
  internalW: number;
  internalH: number;
  aspect: number;
  isPortrait: boolean;
  safe: { x: number; y: number; w: number; h: number };
  present: {
    scale: number;
    offsetX: number;
    offsetY: number;
    letterbox: { left: number; top: number; right: number; bottom: number };
  };
  camera: {
    zoomMul: number;
    panMul: number;
    shakeMul: number;
  };
};

const MOBILE_WIDTH_THRESHOLD = 700;
const SAFE_INSET_RATIO = 0.06;
const SAFE_INSET_MIN = 12;

const MOBILE_CAMERA_MULTIPLIERS = {
  zoomMul: 0.75,
  panMul: 0.8,
  shakeMul: 0.7
};

const DESKTOP_CAMERA_MULTIPLIERS = {
  zoomMul: 1,
  panMul: 1,
  shakeMul: 1
};

export function computeFraming(
  screenW: number,
  screenH: number,
  internalW: number,
  internalH: number,
  _era: string,
  debugOverride: FramingOverride = "auto"
): FramingState {
  const aspect = screenW / screenH;
  const isPortrait = aspect < 1;
  const shouldUseMobileFit =
    debugOverride === "mobileFit" ||
    (debugOverride === "auto" && (isPortrait || screenW < MOBILE_WIDTH_THRESHOLD));
  const mode: FramingMode = debugOverride === "desktopCinematic" ? "desktopCinematic" : shouldUseMobileFit ? "mobileFit" : "desktopCinematic";

  const present =
    mode === "mobileFit"
      ? computeContainPresentation(screenW, screenH, internalW, internalH)
      : computeDesktopPresentation(screenW, screenH, internalW, internalH);

  const inset = Math.max(SAFE_INSET_MIN, Math.round(Math.min(internalW, internalH) * SAFE_INSET_RATIO));
  const safe = {
    x: inset,
    y: inset,
    w: Math.max(1, internalW - inset * 2),
    h: Math.max(1, internalH - inset * 2)
  };

  return {
    mode,
    screenW,
    screenH,
    internalW,
    internalH,
    aspect,
    isPortrait,
    safe,
    present,
    camera: mode === "mobileFit" ? MOBILE_CAMERA_MULTIPLIERS : DESKTOP_CAMERA_MULTIPLIERS
  };
}

function computeDesktopPresentation(
  screenW: number,
  screenH: number,
  internalW: number,
  internalH: number
): FramingState["present"] {
  const targetAspect = internalW / internalH;
  const screenAspect = screenW / screenH;
  const scale = screenAspect < targetAspect ? screenH / internalH : Math.min(screenW / internalW, screenH / internalH);
  const drawW = internalW * scale;
  const drawH = internalH * scale;
  const offsetX = (screenW - drawW) / 2;
  const offsetY = (screenH - drawH) / 2;
  return {
    scale,
    offsetX,
    offsetY,
    letterbox: {
      left: Math.max(0, offsetX),
      right: Math.max(0, screenW - (offsetX + drawW)),
      top: Math.max(0, offsetY),
      bottom: Math.max(0, screenH - (offsetY + drawH))
    }
  };
}

function computeContainPresentation(
  screenW: number,
  screenH: number,
  internalW: number,
  internalH: number
): FramingState["present"] {
  const scale = Math.min(screenW / internalW, screenH / internalH);
  const drawW = internalW * scale;
  const drawH = internalH * scale;
  const offsetX = (screenW - drawW) / 2;
  const offsetY = (screenH - drawH) / 2;
  return {
    scale,
    offsetX,
    offsetY,
    letterbox: {
      left: Math.max(0, offsetX),
      right: Math.max(0, screenW - (offsetX + drawW)),
      top: Math.max(0, offsetY),
      bottom: Math.max(0, screenH - (offsetY + drawH))
    }
  };
}
