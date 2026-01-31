export type Letterbox = {
  scale: number;
  offsetX: number;
  offsetY: number;
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
