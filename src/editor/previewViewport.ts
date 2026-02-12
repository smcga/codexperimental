export type PreviewViewportMode = "desktop" | "mobile";

export type PreviewViewport = {
  width: number;
  height: number;
  aspectRatio: string;
};

const PREVIEW_VIEWPORTS: Record<PreviewViewportMode, PreviewViewport> = {
  desktop: {
    width: 640,
    height: 360,
    aspectRatio: "16 / 9"
  },
  mobile: {
    width: 360,
    height: 640,
    aspectRatio: "9 / 16"
  }
};

export function getEditorPreviewViewport(mode: PreviewViewportMode): PreviewViewport {
  return PREVIEW_VIEWPORTS[mode];
}

