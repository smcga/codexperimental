export type Letterbox = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type ContentRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
};

export type ContentNorm = {
  x: number;
  y: number;
  inside: boolean;
};

export function computeLetterbox(
  width: number,
  height: number,
  baseWidth: number,
  baseHeight: number
): Letterbox {
  const targetAspect = baseWidth / baseHeight;
  const screenAspect = width / height;
  const scale =
    screenAspect < targetAspect ? height / baseHeight : Math.min(width / baseWidth, height / baseHeight);
  const drawWidth = baseWidth * scale;
  const drawHeight = baseHeight * scale;
  return {
    scale,
    offsetX: (width - drawWidth) / 2,
    offsetY: (height - drawHeight) / 2
  };
}

export function getContentRect(
  width: number,
  height: number,
  baseWidth: number,
  baseHeight: number
): ContentRect {
  const { scale, offsetX, offsetY } = computeLetterbox(width, height, baseWidth, baseHeight);
  return {
    x: offsetX,
    y: offsetY,
    width: baseWidth * scale,
    height: baseHeight * scale,
    scale
  };
}

export function screenToContentNorm(x: number, y: number, rect: ContentRect): ContentNorm {
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: 0, y: 0, inside: false };
  }
  const normX = (x - rect.x) / rect.width;
  const normY = (y - rect.y) / rect.height;
  const inside = normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1;
  return { x: normX, y: normY, inside };
}
