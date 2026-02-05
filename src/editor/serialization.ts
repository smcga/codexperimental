import { RawTimelineConfig } from "../config/loadConfig";
import { serializeTimeline } from "./state/timelineStore";

const STORAGE_KEY = "codexperimental.timeline.editor.draft";

export type EditorDraft = {
  timeline: RawTimelineConfig;
  source: "draft" | "file";
};

export function loadDraft(): RawTimelineConfig | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as EditorDraft;
    return parsed.timeline ?? null;
  } catch (error) {
    return null;
  }
}

export function saveDraft(timeline: RawTimelineConfig): void {
  const payload: EditorDraft = {
    timeline: serializeTimeline(timeline),
    source: "draft"
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearDraft(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function downloadTimeline(timeline: RawTimelineConfig, filename = "timeline.json"): void {
  const blob = new Blob([JSON.stringify(serializeTimeline(timeline), null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function importTimelineFile(file: File): Promise<RawTimelineConfig> {
  const text = await file.text();
  return JSON.parse(text) as RawTimelineConfig;
}
