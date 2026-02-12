export type PreviewViewportMode = "desktop" | "mobile";

export type PreviewViewport = {
  label: string;
  width: number;
  height: number;
};

export const PREVIEW_VIEWPORTS: Record<PreviewViewportMode, PreviewViewport> = {
  desktop: {
    label: "Desktop (16:9)",
    width: 1280,
    height: 720
  },
  mobile: {
    label: "Mobile (390×844)",
    width: 390,
    height: 844
  }
};

export function getPreviewViewport(mode: PreviewViewportMode): PreviewViewport {
  return PREVIEW_VIEWPORTS[mode];
}

export function fitPreviewViewport(
  viewportWidth: number,
  viewportHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return { width: 1, height: 1 };
  }
  if (maxWidth <= 0 || maxHeight <= 0) {
    return { width: viewportWidth, height: viewportHeight };
  }
  const scale = Math.min(maxWidth / viewportWidth, maxHeight / viewportHeight);
  return {
    width: Math.max(1, Math.round(viewportWidth * scale)),
    height: Math.max(1, Math.round(viewportHeight * scale))
  };
}
