import { RawTimelineConfig } from "../config/loadConfig";
import { serializeTimeline } from "./state/timelineStore";

const DRAFT_KEY = "codexperimental.timeline.editor.draft";

export function loadTimelineDraft(): RawTimelineConfig | null {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as RawTimelineConfig;
  } catch (error) {
    return null;
  }
}

export function saveTimelineDraft(timeline: RawTimelineConfig): void {
  localStorage.setItem(DRAFT_KEY, serializeTimeline(timeline));
}

export function clearTimelineDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

export function downloadTimeline(timeline: RawTimelineConfig, filename = "timeline.release.json"): void {
  const blob = new Blob([serializeTimeline(timeline)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
