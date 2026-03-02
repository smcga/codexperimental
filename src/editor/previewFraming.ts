export type EditorPreviewMode = "landscape" | "portrait-mobile";

export type PreviewDrawRegion = {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  destX: number;
  destY: number;
  destWidth: number;
  destHeight: number;
};

const PORTRAIT_MOBILE_ASPECT = 9 / 16;

const fitAspectInside = (
  containerWidth: number,
  containerHeight: number,
  aspect: number
): { x: number; y: number; width: number; height: number } => {
  const containerAspect = containerWidth / containerHeight;
  let width = containerWidth;
  let height = containerHeight;
  if (aspect > containerAspect) {
    height = containerWidth / aspect;
  } else {
    width = containerHeight * aspect;
  }
  return {
    x: (containerWidth - width) / 2,
    y: (containerHeight - height) / 2,
    width,
    height
  };
};

export const getPreviewDrawRegion = (
  sourceWidth: number,
  sourceHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  mode: EditorPreviewMode
): PreviewDrawRegion => {
  if (mode === "portrait-mobile") {
    const targetFrame = fitAspectInside(canvasWidth, canvasHeight, PORTRAIT_MOBILE_ASPECT);
    const sourceAspect = sourceWidth / sourceHeight;
    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;
    if (sourceAspect > PORTRAIT_MOBILE_ASPECT) {
      cropWidth = sourceHeight * PORTRAIT_MOBILE_ASPECT;
    } else {
      cropHeight = sourceWidth / PORTRAIT_MOBILE_ASPECT;
    }

    return {
      sourceX: (sourceWidth - cropWidth) / 2,
      sourceY: (sourceHeight - cropHeight) / 2,
      sourceWidth: cropWidth,
      sourceHeight: cropHeight,
      destX: targetFrame.x,
      destY: targetFrame.y,
      destWidth: targetFrame.width,
      destHeight: targetFrame.height
    };
  }

  const frame = fitAspectInside(canvasWidth, canvasHeight, sourceWidth / sourceHeight);
  return {
    sourceX: 0,
    sourceY: 0,
    sourceWidth,
    sourceHeight,
    destX: frame.x,
    destY: frame.y,
    destWidth: frame.width,
    destHeight: frame.height
  };
};

