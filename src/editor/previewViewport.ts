export type PreviewViewportMode = "desktop" | "mobile";

type PreviewViewport = {
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

