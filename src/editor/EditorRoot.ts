import {
  RawTextCue,
  BlendMode,
  EraPreset,
  RawParamAutomation,
  RawSectionConfig,
  RawTimelineConfig,
  TransitionType,
  FitAlign
} from "../config/loadConfig";
import {
  addLayer,
  createAutomationEntry,
  createLayer,
  createScene,
  createTextCue,
  deleteScene,
  duplicateScene,
  ensureTimelineShape,
  parseTimelineTimeValue,
  reorderLayers,
  reorderScenes
} from "./state/timelineStore";
import { clearTimelineDraft, downloadTimeline, loadTimelineDraft, saveTimelineDraft } from "./serialization";
import { getManifestDebugConfig } from "../renderer/effects/manifest";
import { transitionOptions } from "../renderer/transitions";
import { createAutomationClip, insertPoint, movePoint, removePoint } from "./automationClip";

const ERA_PRESETS: EraPreset[] = ["8bit", "16bit", "ps1", "pcdemo", "future"];
const BLEND_MODES: BlendMode[] = [
  "source-over",
  "screen",
  "overlay",
  "lighter",
  "multiply",
  "soft-light",
  "hard-light",
  "color-dodge",
  "difference",
  "exclusion",
  "xor"
];
const FIT_ALIGN_OPTIONS: Array<{ label: string; value: FitAlign }> = [
  { label: "Top", value: "top" },
  { label: "Centre", value: "centre" },
  { label: "Bottom", value: "bottom" },
  { label: "Stretch/Fill", value: "fill" }
];

const EASE_NAMES = [
  "linear",
  "easeInOutQuad",
  "easeInQuad",
  "easeOutQuad",
  "easeInOutCubic",
  "easeInCubic",
  "easeOutCubic",
  "easeInOutQuart",
  "easeInOutQuint",
  "easeInSine",
  "easeOutSine",
  "easeInOutSine",
  "easeInExpo",
  "easeOutExpo",
  "easeInOutExpo",
  "easeInBack",
  "easeOutBack",
  "easeInOutBack",
  "easeOutBounce",
  "easeOutElastic",
  "easeInOutCirc"
];

type EditorState = {
  timeline: RawTimelineConfig | null;
  originalTimeline: RawTimelineConfig | null;
  selectedSceneId: string | null;
  loopEnabled: boolean;
  loopRange: { start: number; end: number } | null;
  error: string | null;
};

type EditorParamValue = number | string | boolean | null;

type BulkCueGenerationOptions = {
  text: string;
  start: number;
  end: number;
  font: string;
  color: string;
  size: number;
  x: number;
  y: number;
  align: "left" | "center" | "right";
  existingIds?: Set<string>;
  idPrefix?: string;
};

type CueTypography = {
  font: string;
  color: string;
  size: number;
};

type MainSlot = "top" | "centre" | "bottom";
type MainSlotSelection = Record<MainSlot, string | null>;
export type SceneListSortMode = "timeline" | "alphabetical" | "start-time";

const MAIN_SLOT_ORDER: MainSlot[] = ["centre", "top", "bottom"];
const MAIN_SLOT_LABELS: Array<{ slot: MainSlot; label: string }> = [
  { slot: "top", label: "Top" },
  { slot: "centre", label: "Centre" },
  { slot: "bottom", label: "Bottom" }
];

type EditorInit = {
  container: HTMLElement;
  effectNames: string[];
  applyTimeline: (raw: RawTimelineConfig) => Promise<string | null>;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  getAudioOffset: () => number;
  getAudioDuration: () => number;
};

export type EditorController = {
  setVisible: (visible: boolean) => void;
  isVisible: () => boolean;
  updatePlayback: (demoTime: number, playing: boolean) => void;
  updatePreview: (source: HTMLCanvasElement) => void;
  getLoopState: () => { enabled: boolean; start: number; end: number } | null;
};

export const computeSceneSeekTime = (sceneStart: number | string, audioOffset: number): number => {
  return Math.max(0, parseTimelineTimeValue(sceneStart) - audioOffset);
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const formatTime = (value: number): string => {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const minutes = Math.floor(safeValue / 60);
  const seconds = safeValue - minutes * 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
};

export const getClipPercent = (
  start: number,
  end: number,
  duration: number
): { left: number; width: number } => {
  const safeDuration = Math.max(0.001, duration);
  const left = ((start / safeDuration) * 100);
  const width = (((end - start) / safeDuration) * 100);
  return {
    left: clamp(left, 0, 100),
    width: clamp(width, 0, 100)
  };
};

export const getMinimumClipWidthPercent = (
  viewportDuration: number,
  timelineWidthPx: number,
  minPixelWidth = 2
): number => {
  if (!Number.isFinite(viewportDuration) || viewportDuration <= 0 || !Number.isFinite(timelineWidthPx) || timelineWidthPx <= 0) {
    return 0;
  }
  return (minPixelWidth / timelineWidthPx) * 100;
};

export const buildPlaylistClipTitle = (
  sceneId: string,
  effectName: string,
  start: number,
  end: number
): string => {
  return [
    `Scene: ${sceneId}`,
    `Effect: ${effectName}`,
    `Time: ${formatTime(start)} → ${formatTime(end)}`
  ].join("\n");
};

export const getVisibleClipRange = (
  start: number,
  end: number,
  viewportStart: number,
  viewportEnd: number
): { start: number; end: number } | null => {
  const visibleStart = Math.max(start, viewportStart);
  const visibleEnd = Math.min(end, viewportEnd);
  if (visibleEnd <= visibleStart) {
    return null;
  }
  return { start: visibleStart, end: visibleEnd };
};

export const normalizeLoopRange = (a: number, b: number, minimumDuration = 0.05): { start: number; end: number } | null => {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return null;
  }
  const start = Math.min(a, b);
  const end = Math.max(a, b);
  if (end - start < minimumDuration) {
    return null;
  }
  return { start, end };
};

export const buildAutomationTrackPolyline = (
  points: Array<{ time: number; value: number }>,
  range: { start: number; end: number },
  width = 1000,
  height = 64
): string => {
  if (points.length === 0) {
    return "";
  }
  const span = Math.max(0.001, range.end - range.start);
  return points
    .map((point) => {
      const x = clamp(((point.time - range.start) / span) * width, 0, width);
      const y = clamp((1 - point.value) * height, 0, height);
      return `${x},${y}`;
    })
    .join(" ");
};

function isMainSlotLayer(layer: RawSectionConfig["layers"][number]): boolean {
  const fitAlign = layer.fitAlign ?? "fill";
  return (
    (fitAlign === "top" || fitAlign === "centre" || fitAlign === "bottom") &&
    (layer.blend ?? "source-over") === "source-over" &&
    Math.abs((layer.opacity ?? 1) - 1) < 0.0001
  );
}

export function getMainSlotSelection(scene: RawSectionConfig): MainSlotSelection {
  const selection: MainSlotSelection = {
    top: null,
    centre: null,
    bottom: null
  };
  const sceneAlign = scene.fitAlign ?? "fill";
  if (sceneAlign === "top" || sceneAlign === "centre" || sceneAlign === "bottom") {
    selection[sceneAlign] = scene.effect;
  }
  (scene.layers ?? []).forEach((layer) => {
    if (!isMainSlotLayer(layer)) {
      return;
    }
    const slot = layer.fitAlign as MainSlot;
    if (!selection[slot]) {
      selection[slot] = layer.effect;
    }
  });
  if (!selection.centre && sceneAlign === "fill") {
    selection.centre = scene.effect;
  }
  return selection;
}

export function applyMainSlotSelection(scene: RawSectionConfig, selection: MainSlotSelection): void {
  const orderedSlots = MAIN_SLOT_ORDER.filter((slot) => Boolean(selection[slot]));
  if (orderedSlots.length === 0) {
    return;
  }
  const primarySlot = orderedSlots[0];
  const primaryEffect = selection[primarySlot] ?? scene.effect;
  scene.effect = primaryEffect;
  scene.fitAlign = primarySlot;

  const preservedLayers = (scene.layers ?? []).filter((layer) => !isMainSlotLayer(layer));
  const slotLayers = orderedSlots
    .filter((slot) => slot !== primarySlot)
    .map((slot) => {
      return {
        effect: selection[slot] as string,
        opacity: 1,
        blend: "source-over" as BlendMode,
        params: {},
        automation: [],
        fitAlign: slot as FitAlign
      };
    });
  scene.layers = [...slotLayers, ...preservedLayers];
}

export const sortScenesForEditorList = (
  scenes: RawSectionConfig[],
  sortMode: SceneListSortMode
): RawSectionConfig[] => {
  if (sortMode === "alphabetical") {
    return [...scenes].sort((left, right) => left.id.localeCompare(right.id));
  }
  if (sortMode === "start-time") {
    return [...scenes].sort(
      (left, right) => parseTimelineTimeValue(left.start) - parseTimelineTimeValue(right.start) || left.id.localeCompare(right.id)
    );
  }
  return scenes;
};

export const getScenePlayingAtTime = (
  scenes: RawSectionConfig[],
  demoTime: number
): RawSectionConfig | null => {
  if (!Number.isFinite(demoTime)) {
    return null;
  }
  const sorted = [...scenes].sort((a, b) => parseTimelineTimeValue(a.start) - parseTimelineTimeValue(b.start));
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const scene = sorted[index];
    if (demoTime >= parseTimelineTimeValue(scene.start)) {
      return scene;
    }
  }
  return null;
};

export const getNewSceneTimeRange = (
  scenes: RawSectionConfig[],
  playbackTime: number
): { start: number; end: number } => {
  const start = Math.max(0, playbackTime);
  const nextStart = scenes
    .map((scene) => parseTimelineTimeValue(scene.start))
    .filter((sceneStart) => sceneStart > start)
    .sort((a, b) => a - b)[0];

  return {
    start,
    end: nextStart ?? start + 10
  };
};

export const stripSceneEnds = (sections: RawSectionConfig[]): void => {
  sections.forEach((section) => {
    if ("end" in section) {
      delete section.end;
    }
  });
};

export const getNextNewSectionName = (scenes: RawSectionConfig[]): string => {
  const nextNumber = scenes.reduce((max, scene) => {
    const match = scene.id.match(/^New Section (\d+)$/);
    if (!match) {
      return max;
    }
    const value = Number(match[1]);
    if (!Number.isFinite(value)) {
      return max;
    }
    return Math.max(max, value);
  }, 0);
  return `New Section ${nextNumber + 1}`;
};

export const getRandomEffectSelection = (effectNames: string[], randomValue = Math.random): string => {
  if (effectNames.length === 0) {
    return "starfield";
  }
  const index = Math.min(effectNames.length - 1, Math.floor(randomValue() * effectNames.length));
  return effectNames[index] ?? "starfield";
};

export const getRandomEffectParams = (
  effectName: string,
  randomValue = Math.random
): Record<string, number | string> => {
  const config = getManifestDebugConfig(effectName);
  if (!config) {
    return {};
  }

  return config.controls.reduce<Record<string, number | string>>((params, control) => {
    if (control.type === "toggle") {
      params[control.key] = randomValue() >= 0.5 ? 1 : 0;
      return params;
    }

    if (control.type === "select") {
      if (!control.options || control.options.length === 0) {
        params[control.key] = control.defaultValue;
        return params;
      }
      const optionIndex = Math.min(control.options.length - 1, Math.floor(randomValue() * control.options.length));
      params[control.key] = control.options[optionIndex]?.value ?? control.defaultValue;
      return params;
    }

    const fallbackDefault = typeof control.defaultValue === "number" ? control.defaultValue : 0;
    const min = control.min ?? Math.min(0, fallbackDefault);
    const max = control.max ?? Math.max(min + 1, fallbackDefault * 2 || 1);
    const step = control.step ?? 0.01;
    const range = Math.max(0, max - min);
    const unrounded = min + randomValue() * range;
    const stepped = step > 0 ? Math.round((unrounded - min) / step) * step + min : unrounded;
    params[control.key] = Number(stepped.toFixed(6));
    return params;
  }, {});
};

export const isWithinSceneStartThreshold = (
  scenes: RawSectionConfig[],
  playbackTime: number,
  thresholdSeconds = 0.1
): boolean => {
  if (!Number.isFinite(playbackTime) || !Number.isFinite(thresholdSeconds) || thresholdSeconds < 0) {
    return false;
  }
  return scenes.some((scene) => Math.abs(parseTimelineTimeValue(scene.start) - playbackTime) <= thresholdSeconds);
};

export type PlaylistClipLayout = {
  sceneId: string;
  start: number;
  end: number;
  track: number;
};

type EditorTimelineTrack = {
  id: string;
  label: string;
  kind: "scene" | "layer" | "automation";
  start: number;
  end: number;
};

export const getSceneTimelineClips = (scenes: RawSectionConfig[], getSceneEnd: (scene: RawSectionConfig) => number) => {
  return [...scenes]
    .sort((a, b) => parseTimelineTimeValue(a.start) - parseTimelineTimeValue(b.start))
    .map((scene) => {
      const start = parseTimelineTimeValue(scene.start);
      const end = Math.max(start + 0.05, getSceneEnd(scene));
      return {
        sceneId: scene.id,
        start,
        end
      };
    });
};

export const buildEditorTimelineTracks = (
  selectedScene: RawSectionConfig | null,
  selectedSceneEnd: number
): EditorTimelineTrack[] => {
  if (!selectedScene) {
    return [];
  }
  const sceneStart = parseTimelineTimeValue(selectedScene.start);
  const sceneEnd = Math.max(sceneStart + 0.05, selectedSceneEnd);
  const tracks: EditorTimelineTrack[] = [
    {
      id: `${selectedScene.id}:scene`,
      label: "Scene",
      kind: "scene",
      start: sceneStart,
      end: sceneEnd
    }
  ];
  (selectedScene.layers ?? []).forEach((layer, index) => {
    tracks.push({
      id: `${selectedScene.id}:layer:${index}`,
      label: `Layer ${index + 1}: ${layer.effect}`,
      kind: "layer",
      start: sceneStart,
      end: sceneEnd
    });
  });
  (selectedScene.automation ?? []).forEach((entry, index) => {
    tracks.push({
      id: `${selectedScene.id}:automation:${index}`,
      label: `Automation: ${entry.param}`,
      kind: "automation",
      start: parseTimelineTimeValue(entry.start ?? sceneStart),
      end: parseTimelineTimeValue(entry.end ?? sceneEnd)
    });
  });
  return tracks;
};

export const layoutPlaylistTracks = (scenes: RawSectionConfig[], getSceneEnd: (scene: RawSectionConfig) => number) => {
  const sorted = [...scenes].sort((a, b) => parseTimelineTimeValue(a.start) - parseTimelineTimeValue(b.start));
  const trackEnds: number[] = [];
  const clips: PlaylistClipLayout[] = [];

  sorted.forEach((scene) => {
    const start = parseTimelineTimeValue(scene.start);
    const end = Math.max(start + 0.05, getSceneEnd(scene));
    let assignedTrack = trackEnds.findIndex((trackEnd) => trackEnd <= start + 0.0001);
    if (assignedTrack < 0) {
      assignedTrack = trackEnds.length;
      trackEnds.push(end);
    } else {
      trackEnds[assignedTrack] = end;
    }
    clips.push({
      sceneId: scene.id,
      start,
      end,
      track: assignedTrack
    });
  });

  return {
    clips,
    trackCount: Math.max(1, trackEnds.length)
  };
};

export const clampPlaylistViewportStart = (start: number, duration: number, viewportDuration: number): number => {
  const maxStart = Math.max(0, duration - viewportDuration);
  return Math.min(maxStart, Math.max(0, start));
};

export const zoomPlaylistViewport = (
  viewportStart: number,
  viewportDuration: number,
  zoomFactor: number,
  focusTime: number,
  totalDuration: number
): { start: number; duration: number } => {
  const minDuration = Math.max(0.25, Math.min(4, totalDuration));
  const maxDuration = Math.max(minDuration, totalDuration);
  const unclampedDuration = viewportDuration * zoomFactor;
  const nextDuration = Math.min(maxDuration, Math.max(minDuration, unclampedDuration));
  const effectiveFocus = Number.isFinite(focusTime) ? focusTime : viewportStart + viewportDuration / 2;
  const unclampedFocusRatio = viewportDuration > 0 ? (effectiveFocus - viewportStart) / viewportDuration : 0.5;
  const focusRatio = Math.min(1, Math.max(0, unclampedFocusRatio));
  const nextStart = clampPlaylistViewportStart(effectiveFocus - focusRatio * nextDuration, totalDuration, nextDuration);
  return {
    start: nextStart,
    duration: nextDuration
  };
};

export const panPlaylistViewport = (
  viewportStart: number,
  deltaSeconds: number,
  totalDuration: number,
  viewportDuration: number
): number => {
  return clampPlaylistViewportStart(viewportStart + deltaSeconds, totalDuration, viewportDuration);
};

export const zoomPlaylistTrackHeight = (
  currentHeightRem: number,
  zoomFactor: number,
  minHeightRem = 1.2,
  maxHeightRem = 12
): number => {
  const nextHeight = currentHeightRem * zoomFactor;
  return clamp(nextHeight, minHeightRem, maxHeightRem);
};

export const resizePlaylistTrackHeightFromScrollbar = (
  currentHeightRem: number,
  edge: "start" | "end",
  deltaRatio: number
): number => {
  const direction = edge === "end" ? 1 : -1;
  const scale = 1 - direction * deltaRatio * 1.8;
  return zoomPlaylistTrackHeight(currentHeightRem, scale);
};

export const getPlaylistScrollbarMetrics = (
  totalDuration: number,
  viewportStart: number,
  viewportDuration: number
): { thumbStartRatio: number; thumbSizeRatio: number } => {
  if (!Number.isFinite(totalDuration) || totalDuration <= 0) {
    return { thumbStartRatio: 0, thumbSizeRatio: 1 };
  }
  const normalizedViewportDuration = Math.min(totalDuration, Math.max(0, viewportDuration));
  const rawSizeRatio = normalizedViewportDuration / totalDuration;
  const thumbSizeRatio = Math.min(1, Math.max(0.05, rawSizeRatio));
  const maxStart = Math.max(0, totalDuration - normalizedViewportDuration);
  const startRatio = maxStart > 0 ? Math.min(1, Math.max(0, viewportStart / maxStart)) : 0;
  return {
    thumbStartRatio: startRatio * (1 - thumbSizeRatio),
    thumbSizeRatio
  };
};

export const parseEditorParamInputValue = (input: string): EditorParamValue => {
  const trimmed = input.trim();
  if (!trimmed) {
    return 0;
  }
  const numeric = Number(trimmed);
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  if (trimmed === "true" || trimmed === "false" || trimmed === "null") {
    return JSON.parse(trimmed) as EditorParamValue;
  }
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

export const isEditorParamToggleChecked = (value: unknown): boolean => value === true || value === 1;

const toFiniteNumber = (value: unknown, fallback: number): number => {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const clampEditorNumberParam = (
  value: unknown,
  options: { min?: number; max?: number; fallback?: number }
): number => {
  const fallback = options.fallback ?? 0;
  const numeric = toFiniteNumber(value, fallback);
  const min = Number.isFinite(options.min) ? (options.min as number) : Number.NEGATIVE_INFINITY;
  const max = Number.isFinite(options.max) ? (options.max as number) : Number.POSITIVE_INFINITY;
  return Math.min(max, Math.max(min, numeric));
};

export const stepEditorNumberParam = (
  value: unknown,
  direction: -1 | 1,
  options: { min?: number; max?: number; step?: number; fallback?: number }
): number => {
  const fallback = options.fallback ?? 0;
  const base = clampEditorNumberParam(value, {
    min: options.min,
    max: options.max,
    fallback
  });
  const step = Number.isFinite(options.step) && (options.step as number) > 0 ? (options.step as number) : 0.01;
  const nextValue = base + direction * step;
  return clampEditorNumberParam(nextValue, {
    min: options.min,
    max: options.max,
    fallback
  });
};

export const splitCueWords = (value: string): string[] => {
  return value
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 0);
};

export const ensureAutomationPoints = (entry: RawParamAutomation): RawParamAutomation => {
  if (entry.points && entry.points.length >= 2) {
    return entry;
  }
  return {
    ...entry,
    points: [
      { time: parseTimelineTimeValue(entry.t0), value: entry.from },
      { time: parseTimelineTimeValue(entry.t1), value: entry.to }
    ],
    segmentMeta: [{ curveType: "Linear", tension: 0 }]
  };
};


export const getCueTypography = (cue: RawTextCue): CueTypography => {
  const firstSpan = cue.spans?.[0];
  return {
    font: firstSpan?.font ?? "Courier New",
    color: firstSpan?.color ?? cue.color ?? "#ffffff",
    size: firstSpan?.size ?? cue.size ?? 42
  };
};

const applyCueTypography = (cue: RawTextCue, typography: CueTypography): void => {
  cue.size = typography.size;
  cue.color = typography.color;
  cue.spans = [
    {
      text: cue.text ?? cue.spans?.[0]?.text ?? "",
      font: typography.font,
      color: typography.color,
      size: typography.size,
      weight: cue.spans?.[0]?.weight ?? "bold"
    }
  ];
};

const createUniqueCueId = (baseId: string, existingIds: Set<string>): string => {
  if (!existingIds.has(baseId)) {
    existingIds.add(baseId);
    return baseId;
  }

  let suffix = 2;
  while (existingIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }
  const next = `${baseId}-${suffix}`;
  existingIds.add(next);
  return next;
};

export const generateWordTextCues = (options: BulkCueGenerationOptions): RawTextCue[] => {
  const words = splitCueWords(options.text);
  if (words.length === 0) {
    return [];
  }

  const start = Number.isFinite(options.start) ? options.start : 0;
  const end = Number.isFinite(options.end) ? options.end : start + words.length * 0.3;
  const timelineDuration = Math.max(0, end - start);
  const slotDuration = words.length > 0 ? timelineDuration / words.length : 0;
  const minDuration = 0.05;
  const existingIds = options.existingIds ?? new Set<string>();
  const idPrefix = options.idPrefix ?? "cue";

  return words.map((word, index) => {
    const cueStart = start + slotDuration * index;
    const nextBoundary = index === words.length - 1 ? end : start + slotDuration * (index + 1);
    const cueEnd = Math.max(cueStart + minDuration, nextBoundary);
    const id = createUniqueCueId(`${idPrefix}-${index + 1}`, existingIds);
    return {
      ...createTextCue({ id, start: cueStart, end: cueEnd }),
      text: word,
      spans: [
        {
          text: word,
          font: options.font,
          color: options.color,
          size: options.size,
          weight: "bold"
        }
      ],
      color: options.color,
      size: options.size,
      x: options.x,
      y: options.y,
      align: options.align,
      units: "normalized"
    };
  });
};

export async function createEditorRoot(init: EditorInit): Promise<EditorController> {
  const state: EditorState = {
    timeline: null,
    originalTimeline: null,
    selectedSceneId: null,
    loopEnabled: false,
    loopRange: null,
    error: null,
  };
  let playbackLabel: HTMLSpanElement | null = null;
  let previewPlaybackLabel: HTMLSpanElement | null = null;
  let playbackButton: HTMLButtonElement | null = null;
  let previewCanvas: HTMLCanvasElement | null = null;
  let previewContext: CanvasRenderingContext2D | null = null;
  let playheadElement: HTMLDivElement | null = null;
  let editorVisible = false;
  let currentDemoTime = 0;
  let isPlaying = false;
  let sceneSearchQuery = "";
  let sceneListSortMode: SceneListSortMode = "timeline";
  let playlistViewportStart = 0;
  let playlistViewportDuration = 45;
  let playlistTrackHeightRem = 3.5;
  let playlistVerticalScrollTop = 0;
  let activePlaylistPan:
    | {
        pointerId: number;
        startX: number;
        startViewport: number;
      }
    | null = null;
  let activeScrollbarDrag:
    | {
        pointerId: number;
        startX: number;
        startViewport: number;
      }
    | null = null;
  let activeScrollbarResize:
    | {
        pointerId: number;
        edge: "start" | "end";
        startX: number;
        startViewport: number;
        startDuration: number;
      }
    | null = null;
  let activeVScrollbarDrag:
    | {
        pointerId: number;
        startY: number;
        startScrollTop: number;
      }
    | null = null;
  let activeVScrollbarResize:
    | {
        pointerId: number;
        edge: "start" | "end";
        startY: number;
        startTrackHeightRem: number;
        startScrollTop: number;
        startBottomScroll: number;
      }
    | null = null;
  let activeClipResize:
    | {
        pointerId: number;
        sceneId: string;
        edge: "start" | "end";
      }
    | null = null;

  const getEffectParamOptions = (effectName: string | null | undefined): string[] => {
    const config = getManifestDebugConfig(effectName ?? null);
    if (!config) {
      return [];
    }
    const keys = config.controls.map((control) => control.key);
    return Array.from(new Set(keys)).sort();
  };

  const createParamListId = (seed: string): string => {
    return `param-options-${seed.replace(/[^a-z0-9_-]/gi, "_")}`;
  };

  const setState = (partial: Partial<EditorState>): void => {
    Object.assign(state, partial);
    render();
  };

  const loadFromFile = async (): Promise<void> => {
    try {
      const response = await fetch("/timeline.release.json", { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Failed to load timeline JSON (${response.status})`);
      }
      const raw = (await response.json()) as RawTimelineConfig;
      const timeline = ensureTimelineShape(raw);
      const draft = loadTimelineDraft();
      setState({
        timeline: draft ?? timeline,
        originalTimeline: timeline,
        selectedSceneId: (draft ?? timeline).sections[0]?.id ?? null,
        error: null
      });
      if (draft) {
        await applyTimelineIfValid(draft);
      } else {
        await applyTimelineIfValid(timeline);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load timeline";
      setState({ error: message });
    }
  };

  const applyTimelineIfValid = async (nextTimeline: RawTimelineConfig): Promise<void> => {
    const message = await init.applyTimeline(nextTimeline);
    setState({ error: message });
  };

  const updateTimeline = (
    updater: (draft: RawTimelineConfig) => void,
    options?: { selectedSceneId?: string | null }
  ): void => {
    if (!state.timeline) {
      return;
    }
    const next = structuredClone(state.timeline);
    updater(next);
    stripSceneEnds(next.sections);
    saveTimelineDraft(next);
    if (options?.selectedSceneId !== undefined) {
      setState({ timeline: next, selectedSceneId: options.selectedSceneId });
    } else {
      setState({ timeline: next });
    }
    void applyTimelineIfValid(next);
  };

  const selectScene = (id: string): void => {
    setState({ selectedSceneId: id });
  };

  const getSceneById = (id: string): RawSectionConfig | null => {
    return state.timeline?.sections.find((section) => section.id === id) ?? null;
  };

  const getScenesByTime = (): RawSectionConfig[] => {
    if (!state.timeline) {
      return [];
    }
    return [...state.timeline.sections].sort(
      (a, b) => parseTimelineTimeValue(a.start) - parseTimelineTimeValue(b.start)
    );
  };

  const getSceneEnd = (scene: RawSectionConfig): number => {
    const scenes = getScenesByTime();
    const index = scenes.findIndex((entry) => entry.id === scene.id);
    if (index >= 0 && index < scenes.length - 1) {
      return parseTimelineTimeValue(scenes[index + 1].start);
    }
    const audioDuration = init.getAudioDuration();
    const fallbackStart = parseTimelineTimeValue(scene.start);
    return audioDuration > 0 ? audioDuration : fallbackStart + 5;
  };

  const formatEditableTime = (value: number | string | undefined | null, allowEmpty = false): string => {
    if (allowEmpty && (value === undefined || value === null || value === "")) {
      return "";
    }
    const parsed = parseTimelineTimeValue(value ?? 0);
    return parsed.toFixed(1);
  };

  const refreshPreviewCanvas = (): void => {
    previewCanvas = init.container.querySelector<HTMLCanvasElement>("[data-region='preview-canvas']");
    previewContext = previewCanvas?.getContext("2d") ?? null;
  };

  const render = (): void => {
    if (!state.timeline) {
      init.container.innerHTML = `<div class="editor-loading">Loading editor…</div>`;
      return;
    }

    const previousInspector = init.container.querySelector<HTMLDivElement>(".editor-inspector-body");
    const inspectorScrollState = previousInspector
      ? { sceneId: previousInspector.dataset.sceneId ?? null, scrollTop: previousInspector.scrollTop }
      : null;
    const previousSceneList = init.container.querySelector<HTMLDivElement>(".editor-scene-list");
    const sceneListScrollTop = previousSceneList?.scrollTop ?? 0;

    init.container.innerHTML = `
      <div class="editor-header">
        <div class="editor-title">SCENE + TIMELINE EDITOR</div>
        <div class="editor-actions">
          <button type="button" data-action="import">Import JSON</button>
          <button type="button" data-action="export">Export JSON</button>
          <button type="button" data-action="revert">Revert to File</button>
        </div>
      </div>
      ${state.error ? `<div class="editor-error" role="alert">${state.error}</div>` : ""}
      <div class="editor-body">
        <section class="editor-column editor-scenes">
          <div class="editor-scene-list-header">
            <div class="editor-section-title">SCENES</div>
            <details class="editor-sort-menu">
              <summary class="editor-sort-trigger">Sort</summary>
              <div class="editor-sort-flyout" role="menu" aria-label="Scene sort mode">
                <button type="button" data-action="scene-sort" data-sort-mode="alphabetical">Alphabetical</button>
                <button type="button" data-action="scene-sort" data-sort-mode="timeline">timeline.json order</button>
                <button type="button" data-action="scene-sort" data-sort-mode="start-time">Start time</button>
              </div>
            </details>
          </div>
          <label class="editor-search">
            <span class="sr-only">Search scenes</span>
            <input type="search" data-action="scene-search" value="${sceneSearchQuery}" placeholder="Search scenes…" />
          </label>
          <div class="editor-scene-list" data-region="scene-list"></div>
          <button type="button" class="editor-add editor-add-scene" data-action="add-scene">+ NEW SCENE</button>
          <div class="editor-scene-actions-block">
            <div class="editor-section-title editor-subsection-title">SCENE ACTIONS</div>
            <button type="button" data-action="duplicate-selected" ${state.selectedSceneId ? "" : "disabled"}>Duplicate</button>
            <button type="button" data-action="delete-selected" ${state.selectedSceneId ? "" : "disabled"}>Delete</button>
            <button type="button" data-action="select-current">Select Current</button>
            <button type="button" data-action="select-loop-current">Select &amp; Loop</button>
          </div>
        </section>
        <section class="editor-column editor-workspace">
          <div class="editor-top-row">
            <div class="editor-top-panel" data-region="basic-panel"></div>
            <div class="editor-preview-panel">
              <div class="editor-preview-toolbar">
                <div class="editor-section-title">PREVIEW</div>
              </div>
              <div class="editor-preview">
                <canvas data-region="preview-canvas" width="640" height="360"></canvas>
              </div>
            </div>
            
          </div>
          <div class="editor-preview-transport">
            <span data-region="preview-time">${formatTime(currentDemoTime)} / ${formatTime(init.getAudioDuration())}</span>
            <div class="editor-preview-transport-controls">
              <button type="button" data-action="play-toggle-inline">Play</button>
              <button type="button" data-action="jump-scene-inline">Jump to scene</button>
            </div>
          </div>
          <div class="editor-loop-summary">
            ${state.loopRange ? `Loop selection: ${formatTime(state.loopRange.start)} → ${formatTime(state.loopRange.end)}` : "Loop selection: none"}
            <button type="button" data-action="clear-loop-selection" ${state.loopRange ? "" : "disabled"}>Clear loop selection</button>
          </div>
          <div class="editor-section-title">TIMELINE</div>
          <div class="editor-timeline-view" data-region="timeline-view"></div>
        </section>
        <section class="editor-column editor-inspector">
          <div class="editor-inspector-header">
            <div class="editor-section-title">INSPECTOR</div>
          </div>
          <div class="editor-inspector-body" data-region="inspector"></div>
        </section>
      </div>
      <div class="editor-transport" data-region="transport">
        <button type="button" class="editor-generate-cues-trigger" data-action="open-cue-generator">Generate text cues</button>
        <div class="editor-transport-row">
          <button type="button" data-action="play-toggle">Play</button>
          <button type="button" data-action="jump-scene">Jump to scene</button>
          <label class="editor-toggle">
            <input type="checkbox" data-action="loop-toggle" ${state.loopEnabled ? "checked" : ""} />
            <span>Loop scene</span>
          </label>
          <span class="editor-timestamp" data-region="timestamp">00:00.0</span>
        </div>
      </div>
      <div class="editor-modal-backdrop is-hidden" data-region="cue-generator-modal">
        <div class="editor-modal" role="dialog" aria-modal="true" aria-label="Generate text cues">
          <div class="editor-modal-header">
            <div class="editor-section-title">GENERATE TEXT CUES</div>
            <button type="button" data-action="close-cue-generator">Close</button>
          </div>
          <div class="editor-modal-body" data-region="cue-generator-body"></div>
        </div>
      </div>
    `;

    renderSceneList();
    renderTimelineView();
    renderInspector();
    renderTransport();
    bindHeaderActions();
    refreshPreviewCanvas();

    const nextInspector = init.container.querySelector<HTMLDivElement>(".editor-inspector-body");
    if (nextInspector && inspectorScrollState && inspectorScrollState.sceneId === state.selectedSceneId) {
      nextInspector.scrollTop = inspectorScrollState.scrollTop;
    }
    const nextSceneList = init.container.querySelector<HTMLDivElement>(".editor-scene-list");
    if (nextSceneList) {
      nextSceneList.scrollTop = sceneListScrollTop;
    }
  };

  const renderSceneList = (): void => {
    const list = init.container.querySelector<HTMLDivElement>("[data-region='scene-list']");
    if (!list || !state.timeline) {
      return;
    }
    list.innerHTML = "";
    const sections = sortScenesForEditorList(
      state.timeline.sections.filter((scene) => scene.id.toLowerCase().includes(sceneSearchQuery.trim().toLowerCase())),
      sceneListSortMode
    );
    let dragIndex: number | null = null;

    sections.forEach((scene) => {
      const originalIndex = state.timeline?.sections.findIndex((entry) => entry.id === scene.id) ?? -1;
      if (originalIndex < 0) {
        return;
      }
      const item = document.createElement("div");
      item.className = "editor-scene-item";
      if (scene.id === state.selectedSceneId) {
        item.classList.add("is-selected");
      }
      item.draggable = true;
      item.dataset.index = String(originalIndex);
      item.innerHTML = `
        <div class="editor-scene-card-header">
          <span class="editor-scene-active-indicator" aria-hidden="true">${scene.id === state.selectedSceneId ? "▶" : ""}</span>
          <button type="button" class="editor-scene-select">${scene.id}</button>
          <button type="button" class="editor-scene-kebab" aria-label="Scene menu">⋮</button>
        </div>
        <div class="editor-scene-meta">
          <span>${formatTime(parseTimelineTimeValue(scene.start))}</span>
          <span>→</span>
          <span>${formatTime(getSceneEnd(scene))}</span>
        </div>
      `;

      item.addEventListener("dragstart", () => {
        dragIndex = originalIndex;
      });
      item.addEventListener("dragover", (event) => {
        event.preventDefault();
      });
      item.addEventListener("drop", (event) => {
        event.preventDefault();
        const targetIndex = Number(item.dataset.index ?? 0);
        if (dragIndex === null || Number.isNaN(targetIndex)) {
          return;
        }
        updateTimeline((draft) => {
          draft.sections = reorderScenes(draft.sections, dragIndex, targetIndex);
        });
        dragIndex = null;
      });

      const selectButton = item.querySelector<HTMLButtonElement>(".editor-scene-select");
      selectButton?.addEventListener("click", () => {
        selectScene(scene.id);
        init.seek(computeSceneSeekTime(scene.start, init.getAudioOffset()));
      });
      list.appendChild(item);
    });

    const sortButtons = init.container.querySelectorAll<HTMLButtonElement>("[data-action='scene-sort']");
    sortButtons.forEach((button) => {
      const active = button.dataset.sortMode === sceneListSortMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.addEventListener("click", () => {
        const selectedSort = button.dataset.sortMode as SceneListSortMode | undefined;
        if (!selectedSort || sceneListSortMode === selectedSort) {
          return;
        }
        sceneListSortMode = selectedSort;
        renderSceneList();
      });
    });
  };

  const renderTimelineView = (): void => {
    const view = init.container.querySelector<HTMLDivElement>("[data-region='timeline-view']");
    if (!view || !state.timeline) {
      return;
    }
    const scenes = getScenesByTime();
    const duration = Math.max(5, scenes.reduce((max, scene) => Math.max(max, getSceneEnd(scene)), 0));
    playlistViewportDuration = Math.min(Math.max(2, playlistViewportDuration), duration);
    playlistViewportStart = clampPlaylistViewportStart(playlistViewportStart, duration, playlistViewportDuration);
    const viewportEnd = Math.min(duration, playlistViewportStart + playlistViewportDuration);
    const ticks = Math.max(1, Math.ceil(playlistViewportDuration / 5));
    const currentScene = getScenePlayingAtTime(scenes, currentDemoTime);
    const focusScene =
      (state.selectedSceneId ? scenes.find((scene) => scene.id === state.selectedSceneId) : null) ?? currentScene;
    const focusSceneEnd = focusScene ? getSceneEnd(focusScene) : 0;
    const timelineTracks = buildEditorTimelineTracks(focusScene, focusSceneEnd);
    const sceneClips = getSceneTimelineClips(scenes, getSceneEnd);
    const playheadRatio = clamp((currentDemoTime - playlistViewportStart) / Math.max(playlistViewportDuration, 0.001), 0, 1);
    const visibleLoopRange = state.loopRange
      ? getVisibleClipRange(state.loopRange.start, state.loopRange.end, playlistViewportStart, viewportEnd)
      : null;

    view.innerHTML = `
      <div class="editor-playlist-toolbar">
        <span>Track 1</span>
      </div>
      <div class="editor-ruler" data-region="playlist-ruler">
        ${
          visibleLoopRange
            ? `<div class="editor-ruler-loop-selection" style="left:${((visibleLoopRange.start - playlistViewportStart) / Math.max(playlistViewportDuration, 0.001)) * 100}%;width:${((visibleLoopRange.end - visibleLoopRange.start) / Math.max(playlistViewportDuration, 0.001)) * 100}%"></div>`
            : ""
        }
        ${Array.from({ length: ticks + 1 })
          .map((_, index) => {
            const time = Math.min(viewportEnd, playlistViewportStart + (playlistViewportDuration / ticks) * index);
            const relative = (time - playlistViewportStart) / Math.max(playlistViewportDuration, 0.001);
            return `<span style="left:${relative * 100}%">${formatTime(time)}</span>`;
          })
          .join("")}
      </div>
      <div class="editor-playlist-scroll" data-region="playlist-scroll">
        <div class="editor-playlist-tracks" data-region="playlist-tracks"></div>
      </div>
      <div class="editor-playlist-vscrollbar" data-region="playlist-vscrollbar">
        <div class="editor-playlist-vscrollbar-thumb" data-region="playlist-vscrollbar-thumb">
          <span class="editor-playlist-vscrollbar-handle editor-playlist-vscrollbar-handle-start" data-vresize-edge="start"></span>
          <span class="editor-playlist-vscrollbar-handle editor-playlist-vscrollbar-handle-end" data-vresize-edge="end"></span>
        </div>
      </div>
      <div class="editor-playlist-scrollbar" data-region="playlist-scrollbar">
        <div class="editor-playlist-scrollbar-thumb" data-region="playlist-scrollbar-thumb">
          <span class="editor-playlist-scrollbar-handle editor-playlist-scrollbar-handle-start" data-resize-edge="start"></span>
          <span class="editor-playlist-scrollbar-handle editor-playlist-scrollbar-handle-end" data-resize-edge="end"></span>
        </div>
      </div>
    `;

    const tracks = view.querySelector<HTMLDivElement>("[data-region='playlist-tracks']");
    const scroll = view.querySelector<HTMLDivElement>("[data-region='playlist-scroll']");
    const ruler = view.querySelector<HTMLDivElement>("[data-region='playlist-ruler']");
    const scrollbar = view.querySelector<HTMLDivElement>("[data-region='playlist-scrollbar']");
    const scrollbarThumb = view.querySelector<HTMLDivElement>("[data-region='playlist-scrollbar-thumb']");
    const vScrollbar = view.querySelector<HTMLDivElement>("[data-region='playlist-vscrollbar']");
    const vScrollbarThumb = view.querySelector<HTMLDivElement>("[data-region='playlist-vscrollbar-thumb']");
    if (!tracks || !scroll || !scrollbar || !scrollbarThumb || !ruler || !vScrollbar || !vScrollbarThumb) {
      return;
    }
    const minClipWidthPercent = getMinimumClipWidthPercent(playlistViewportDuration, scroll.clientWidth);
    const visualTracks = timelineTracks.length > 0 ? timelineTracks : [{ id: "empty", label: "Track 1", kind: "scene" as const, start: 0, end: 0 }];
    tracks.style.setProperty("--playlist-track-count", String(visualTracks.length));
    tracks.style.setProperty("--editor-playlist-track-height", `${playlistTrackHeightRem}rem`);
    scroll.scrollTop = clamp(playlistVerticalScrollTop, 0, Math.max(0, scroll.scrollHeight - scroll.clientHeight));
    const syncVerticalScrollbarThumb = (): void => {
      const vSizeRatio = scroll.scrollHeight > 0 ? clamp(scroll.clientHeight / scroll.scrollHeight, 0.08, 1) : 1;
      const vStartRatio =
        scroll.scrollHeight > scroll.clientHeight
          ? clamp(scroll.scrollTop / Math.max(1, scroll.scrollHeight - scroll.clientHeight), 0, 1) * (1 - vSizeRatio)
          : 0;
      vScrollbarThumb.style.height = `${vSizeRatio * 100}%`;
      vScrollbarThumb.style.top = `${vStartRatio * 100}%`;
    };
    scroll.addEventListener("scroll", () => {
      playlistVerticalScrollTop = scroll.scrollTop;
      syncVerticalScrollbarThumb();
    });

    visualTracks.forEach((timelineTrack, index) => {
      const lane = document.createElement("div");
      lane.className = "editor-playlist-track";
      lane.dataset.track = String(index);
      lane.innerHTML = `<span class="editor-playlist-track-label">${timelineTrack.kind === "scene" ? "Track 1" : timelineTrack.label}</span>`;
      tracks.appendChild(lane);
      if (timelineTrack.kind === "scene") {
        sceneClips.forEach((clip) => {
          const scene = scenes.find((entry) => entry.id === clip.sceneId);
          if (!scene) {
            return;
          }
          const visibleRange = getVisibleClipRange(clip.start, clip.end, playlistViewportStart, viewportEnd);
          if (!visibleRange) {
            return;
          }
          const clipPercent = getClipPercent(
            visibleRange.start - playlistViewportStart,
            visibleRange.end - playlistViewportStart,
            playlistViewportDuration
          );
          const block = document.createElement("button");
          block.type = "button";
          block.className = "editor-block editor-playlist-clip";
          block.style.left = `${clipPercent.left}%`;
          block.style.width = `${Math.max(minClipWidthPercent, clipPercent.width)}%`;
          block.style.top = `calc(${index} * var(--editor-playlist-track-height) + 0.25rem)`;
          block.textContent = clip.sceneId;
          block.title = buildPlaylistClipTitle(clip.sceneId, scene.effect, clip.start, clip.end);
          block.dataset.sceneId = clip.sceneId;
          if (clip.sceneId === state.selectedSceneId) {
            block.classList.add("is-selected");
          }
          if (clipPercent.width < 4) {
            block.classList.add("is-compact");
          }
          block.addEventListener("click", () => {
            selectScene(clip.sceneId);
            if (!state.loopRange) {
              init.seek(computeSceneSeekTime(scene.start, init.getAudioOffset()));
            }
          });
          block.draggable = true;
          block.addEventListener("dragstart", (event) => {
            event.dataTransfer?.setData("text/plain", clip.sceneId);
            block.classList.add("is-dragging");
          });
          block.addEventListener("dragend", () => {
            block.classList.remove("is-dragging");
          });
          (["start", "end"] as const).forEach((edge) => {
            const handle = document.createElement("span");
            handle.className = `editor-playlist-resize-handle editor-playlist-resize-handle-${edge}`;
            handle.dataset.resizeEdge = edge;
            handle.addEventListener("pointerdown", (event) => {
              event.preventDefault();
              event.stopPropagation();
              activeClipResize = {
                pointerId: event.pointerId,
                sceneId: clip.sceneId,
                edge
              };
            });
            block.appendChild(handle);
          });
          tracks.appendChild(block);
        });
        return;
      }
      const visibleRange = getVisibleClipRange(timelineTrack.start, timelineTrack.end, playlistViewportStart, viewportEnd);
      if (!visibleRange) {
        return;
      }
      const clipPercent = getClipPercent(
        visibleRange.start - playlistViewportStart,
        visibleRange.end - playlistViewportStart,
        playlistViewportDuration
      );
      const block = document.createElement("button");
      block.type = "button";
      block.className = "editor-block editor-playlist-clip";
      block.style.left = `${clipPercent.left}%`;
      block.style.width = `${Math.max(minClipWidthPercent, clipPercent.width)}%`;
      block.style.top = `calc(${index} * var(--editor-playlist-track-height) + 0.25rem)`;
      block.textContent = focusScene.id;
      block.title = buildPlaylistClipTitle(focusScene.id, focusScene.effect, timelineTrack.start, timelineTrack.end);
      if (timelineTrack.kind === "automation") {
        block.textContent = "";
      }
      if (focusScene.id === state.selectedSceneId) {
        block.classList.add("is-selected");
      }
      if (clipPercent.width < 4) {
        block.classList.add("is-compact");
      }
      block.addEventListener("click", () => {
        if (focusScene) {
          selectScene(focusScene.id);
          if (!state.loopRange) {
            init.seek(computeSceneSeekTime(focusScene.start, init.getAudioOffset()));
          }
        }
      });
      if (timelineTrack.kind === "automation") {
        const trackMatch = timelineTrack.id.match(/:automation:(\d+)$/);
        const automationIndex = trackMatch ? Number(trackMatch[1]) : -1;
        const automationEntry = focusScene.automation?.[automationIndex];
        if (automationEntry) {
          const seeded = ensureAutomationPoints(automationEntry);
          const polyline = document.createElement("div");
          polyline.className = "editor-playlist-automation-line";
          const pointsMarkup = buildAutomationTrackPolyline(
            seeded.points ?? [],
            { start: timelineTrack.start, end: timelineTrack.end },
            1000,
            64
          );
          polyline.innerHTML = `<svg viewBox="0 0 1000 64" preserveAspectRatio="none" style="width:100%;height:100%;pointer-events:none"><polyline points="${pointsMarkup}" fill="none" stroke="#79ffd7" stroke-width="2" />${(seeded.points ?? [])
            .map((point) => {
              const pointMarkup = buildAutomationTrackPolyline(
                [point],
                { start: timelineTrack.start, end: timelineTrack.end },
                1000,
                64
              );
              const [cx = "0", cy = "0"] = pointMarkup.split(",");
              return `<circle cx="${cx}" cy="${cy}" r="2.5" fill="#cffff2" />`;
            })
            .join("")}</svg>`;
          block.appendChild(polyline);
        }
      }
      tracks.appendChild(block);
    });

    playheadElement = document.createElement("div");
    playheadElement.className = "editor-playhead";
    playheadElement.style.left = `${playheadRatio * 100}%`;
    tracks.appendChild(playheadElement);
    ruler.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) {
        return;
      }
      const rect = ruler.getBoundingClientRect();
      if (rect.width <= 0) {
        return;
      }
      const pointerId = event.pointerId;
      const startRatio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const anchorTime = playlistViewportStart + startRatio * playlistViewportDuration;
      let dragStarted = false;
      const onPointerMove = (moveEvent: PointerEvent): void => {
        if (moveEvent.pointerId !== pointerId) {
          return;
        }
        const ratio = clamp((moveEvent.clientX - rect.left) / rect.width, 0, 1);
        const currentTime = playlistViewportStart + ratio * playlistViewportDuration;
        const nextLoopRange = normalizeLoopRange(anchorTime, currentTime);
        if (nextLoopRange) {
          dragStarted = true;
          setState({ loopRange: nextLoopRange, loopEnabled: true });
        }
      };
      const onPointerUp = (upEvent: PointerEvent): void => {
        if (upEvent.pointerId !== pointerId) {
          return;
        }
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        if (!dragStarted) {
          init.seek(Math.max(0, anchorTime - init.getAudioOffset()));
        }
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    });

    tracks.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    tracks.addEventListener("drop", (event) => {
      event.preventDefault();
      const clipId = event.dataTransfer?.getData("text/plain");
      if (!clipId) {
        return;
      }
      const draggedScene = scenes.find((scene) => scene.id === clipId);
      if (!draggedScene) {
        return;
      }
      const rect = tracks.getBoundingClientRect();
      const xRatio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
      const dropTime = clampEditorNumberParam(playlistViewportStart + xRatio * playlistViewportDuration, {
        min: 0,
        max: duration,
        fallback: parseTimelineTimeValue(draggedScene.start)
      });
      updateTimeline((draft) => {
        const ordered = [...draft.sections].sort((a, b) => parseTimelineTimeValue(a.start) - parseTimelineTimeValue(b.start));
        const orderedIndex = ordered.findIndex((section) => section.id === clipId);
        const previous = orderedIndex > 0 ? ordered[orderedIndex - 1] : null;
        const next = orderedIndex >= 0 && orderedIndex < ordered.length - 1 ? ordered[orderedIndex + 1] : null;
        const min = previous ? parseTimelineTimeValue(previous.start) + 0.05 : 0;
        const max = next ? parseTimelineTimeValue(next.start) - 0.05 : duration;
        const clampedDropTime = clamp(dropTime, min, Math.max(min, max));
        const target = draft.sections.find((section) => section.id === clipId);
        if (!target) {
          return;
        }
        target.start = Number(clampedDropTime.toFixed(3));
      });
    });

    scroll.addEventListener("pointerdown", (event) => {
      if ((event.target as HTMLElement).closest(".editor-playlist-clip")) {
        return;
      }
      activePlaylistPan = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startViewport: playlistViewportStart
      };
    });
    scroll.addEventListener("wheel", (event) => {
      event.preventDefault();
      const rect = scroll.getBoundingClientRect();
      if (event.altKey) {
        const factor = event.deltaY > 0 ? 1 / 1.08 : 1.08;
        playlistTrackHeightRem = zoomPlaylistTrackHeight(playlistTrackHeightRem, factor);
        renderTimelineView();
        return;
      }
      if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        const pixels = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        const secondsPerPixel = rect.width > 0 ? playlistViewportDuration / rect.width : 0;
        playlistViewportStart = panPlaylistViewport(
          playlistViewportStart,
          pixels * secondsPerPixel,
          duration,
          playlistViewportDuration
        );
      } else {
        const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5;
        const focusTime = playlistViewportStart + ratio * playlistViewportDuration;
        const factor = event.deltaY > 0 ? 1.12 : 0.88;
        const zoomed = zoomPlaylistViewport(
          playlistViewportStart,
          playlistViewportDuration,
          factor,
          focusTime,
          duration
        );
        playlistViewportStart = zoomed.start;
        playlistViewportDuration = zoomed.duration;
      }
      renderTimelineView();
    });
    const scrollbarMetrics = getPlaylistScrollbarMetrics(duration, playlistViewportStart, playlistViewportDuration);
    scrollbarThumb.style.width = `${scrollbarMetrics.thumbSizeRatio * 100}%`;
    scrollbarThumb.style.left = `${scrollbarMetrics.thumbStartRatio * 100}%`;
    scrollbar.addEventListener("pointerdown", (event) => {
      const target = event.target as HTMLElement;
      const resizeEdge = target.closest<HTMLElement>("[data-resize-edge]")?.dataset.resizeEdge;
      if (resizeEdge === "start" || resizeEdge === "end") {
        activeScrollbarResize = {
          pointerId: event.pointerId,
          edge: resizeEdge,
          startX: event.clientX,
          startViewport: playlistViewportStart,
          startDuration: playlistViewportDuration
        };
        return;
      }
      if (target.closest("[data-region='playlist-scrollbar-thumb']")) {
        activeScrollbarDrag = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startViewport: playlistViewportStart
        };
        return;
      }
      const rect = scrollbar.getBoundingClientRect();
      if (rect.width <= 0) {
        return;
      }
      const ratio = (event.clientX - rect.left) / rect.width;
      const desiredStart = ratio * duration - playlistViewportDuration / 2;
      playlistViewportStart = clampPlaylistViewportStart(desiredStart, duration, playlistViewportDuration);
      renderTimelineView();
    });
    syncVerticalScrollbarThumb();
    vScrollbar.onpointerdown = (event) => {
      const target = event.target as HTMLElement;
      const resizeEdge = target.closest<HTMLElement>("[data-vresize-edge]")?.dataset.vresizeEdge;
      if (resizeEdge === "start" || resizeEdge === "end") {
        event.preventDefault();
        vScrollbar.setPointerCapture(event.pointerId);
        activeVScrollbarResize = {
          pointerId: event.pointerId,
          edge: resizeEdge,
          startY: event.clientY,
          startTrackHeightRem: playlistTrackHeightRem,
          startScrollTop: scroll.scrollTop,
          startBottomScroll: scroll.scrollTop + scroll.clientHeight
        };
        return;
      }
      if (target.closest("[data-region='playlist-vscrollbar-thumb']")) {
        event.preventDefault();
        vScrollbar.setPointerCapture(event.pointerId);
        activeVScrollbarDrag = {
          pointerId: event.pointerId,
          startY: event.clientY,
          startScrollTop: scroll.scrollTop
        };
        return;
      }
      const rect = vScrollbar.getBoundingClientRect();
      if (rect.height <= 0) {
        return;
      }
      const ratio = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      playlistVerticalScrollTop = ratio * Math.max(0, scroll.scrollHeight - scroll.clientHeight);
      scroll.scrollTop = playlistVerticalScrollTop;
      syncVerticalScrollbarThumb();
    };

    view.querySelector<HTMLButtonElement>("[data-action='playlist-zoom-in']")?.addEventListener("click", () => {
      const zoomed = zoomPlaylistViewport(
        playlistViewportStart,
        playlistViewportDuration,
        0.8,
        playlistViewportStart + playlistViewportDuration / 2,
        duration
      );
      playlistViewportStart = zoomed.start;
      playlistViewportDuration = zoomed.duration;
      renderTimelineView();
    });
    view.querySelector<HTMLButtonElement>("[data-action='playlist-zoom-out']")?.addEventListener("click", () => {
      const zoomed = zoomPlaylistViewport(
        playlistViewportStart,
        playlistViewportDuration,
        1.25,
        playlistViewportStart + playlistViewportDuration / 2,
        duration
      );
      playlistViewportStart = zoomed.start;
      playlistViewportDuration = zoomed.duration;
      renderTimelineView();
    });
    view.querySelector<HTMLButtonElement>("[data-action='playlist-reset']")?.addEventListener("click", () => {
      playlistViewportStart = 0;
      playlistViewportDuration = Math.min(Math.max(20, duration * 0.4), duration);
      playlistTrackHeightRem = 3.5;
      renderTimelineView();
    });

  };

  const handleGlobalPlaylistPan = (event: PointerEvent): void => {
    if (!activePlaylistPan || event.pointerId !== activePlaylistPan.pointerId) {
      return;
    }
    const scroll = init.container.querySelector<HTMLDivElement>("[data-region='playlist-scroll']");
    if (!scroll) {
      return;
    }
    const rect = scroll.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }
    const scenes = getScenesByTime();
    const duration = Math.max(5, scenes.reduce((max, scene) => Math.max(max, getSceneEnd(scene)), 0));
    const deltaRatio = (event.clientX - activePlaylistPan.startX) / rect.width;
    playlistViewportStart = panPlaylistViewport(
      activePlaylistPan.startViewport,
      -deltaRatio * playlistViewportDuration,
      duration,
      playlistViewportDuration
    );
    renderTimelineView();
  };

  const handleGlobalScrollbarDrag = (event: PointerEvent): void => {
    if (activeVScrollbarResize && event.pointerId === activeVScrollbarResize.pointerId) {
      const scroll = init.container.querySelector<HTMLDivElement>("[data-region='playlist-scroll']");
      const vScrollbar = init.container.querySelector<HTMLDivElement>("[data-region='playlist-vscrollbar']");
      if (!scroll || !vScrollbar) {
        return;
      }
      const rect = vScrollbar.getBoundingClientRect();
      const deltaRatio = rect.height > 0 ? (event.clientY - activeVScrollbarResize.startY) / rect.height : 0;
      playlistTrackHeightRem = resizePlaylistTrackHeightFromScrollbar(
        activeVScrollbarResize.startTrackHeightRem,
        activeVScrollbarResize.edge,
        deltaRatio
      );
      const scrollRange = Math.max(0, scroll.scrollHeight - scroll.clientHeight);
      if (activeVScrollbarResize.edge === "start") {
        playlistVerticalScrollTop = clamp(activeVScrollbarResize.startBottomScroll - scroll.clientHeight, 0, scrollRange);
      } else {
        playlistVerticalScrollTop = clamp(activeVScrollbarResize.startScrollTop, 0, scrollRange);
      }
      renderTimelineView();
      return;
    }
    if (activeVScrollbarDrag && event.pointerId === activeVScrollbarDrag.pointerId) {
      const scroll = init.container.querySelector<HTMLDivElement>("[data-region='playlist-scroll']");
      const vScrollbar = init.container.querySelector<HTMLDivElement>("[data-region='playlist-vscrollbar']");
      if (!scroll || !vScrollbar) {
        return;
      }
      const rect = vScrollbar.getBoundingClientRect();
      const scrollRange = Math.max(1, scroll.scrollHeight - scroll.clientHeight);
      const ratioPerPixel = scrollRange / Math.max(1, rect.height);
      const deltaY = event.clientY - activeVScrollbarDrag.startY;
      playlistVerticalScrollTop = clamp(activeVScrollbarDrag.startScrollTop + deltaY * ratioPerPixel, 0, scrollRange);
      scroll.scrollTop = playlistVerticalScrollTop;
      return;
    }
    if (activeScrollbarResize && event.pointerId === activeScrollbarResize.pointerId) {
      const scrollbar = init.container.querySelector<HTMLDivElement>("[data-region='playlist-scrollbar']");
      if (!scrollbar) {
        return;
      }
      const rect = scrollbar.getBoundingClientRect();
      if (rect.width <= 0) {
        return;
      }
      const deltaRatio = (event.clientX - activeScrollbarResize.startX) / rect.width;
      const durationDelta = deltaRatio * activeScrollbarResize.startDuration;
      if (activeScrollbarResize.edge === "end") {
        playlistViewportDuration = Math.max(2, activeScrollbarResize.startDuration + durationDelta);
      } else {
        const nextDuration = Math.max(2, activeScrollbarResize.startDuration - durationDelta);
        const end = activeScrollbarResize.startViewport + activeScrollbarResize.startDuration;
        playlistViewportDuration = nextDuration;
        playlistViewportStart = Math.max(0, end - nextDuration);
      }
      renderTimelineView();
      return;
    }
    if (!activeScrollbarDrag || event.pointerId !== activeScrollbarDrag.pointerId) {
      return;
    }
    const scrollbar = init.container.querySelector<HTMLDivElement>("[data-region='playlist-scrollbar']");
    if (!scrollbar) {
      return;
    }
    const rect = scrollbar.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }
    const scenes = getScenesByTime();
    const duration = Math.max(5, scenes.reduce((max, scene) => Math.max(max, getSceneEnd(scene)), 0));
    const secondsPerPixel = duration / rect.width;
    const deltaSeconds = (event.clientX - activeScrollbarDrag.startX) * secondsPerPixel;
    playlistViewportStart = clampPlaylistViewportStart(
      activeScrollbarDrag.startViewport + deltaSeconds,
      duration,
      playlistViewportDuration
    );
    renderTimelineView();
  };

  const handleGlobalClipResize = (event: PointerEvent): void => {
    if (!activeClipResize || event.pointerId !== activeClipResize.pointerId || !state.timeline) {
      return;
    }
    const scenes = getScenesByTime();
    const sceneIndex = scenes.findIndex((scene) => scene.id === activeClipResize.sceneId);
    if (sceneIndex < 0) {
      return;
    }
    const scroll = init.container.querySelector<HTMLDivElement>("[data-region='playlist-scroll']");
    if (!scroll) {
      return;
    }
    const rect = scroll.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }
    const duration = Math.max(5, scenes.reduce((max, scene) => Math.max(max, getSceneEnd(scene)), 0));
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const pointerTime = playlistViewportStart + ratio * playlistViewportDuration;
    const previous = sceneIndex > 0 ? scenes[sceneIndex - 1] : null;
    const current = scenes[sceneIndex];
    const next = sceneIndex < scenes.length - 1 ? scenes[sceneIndex + 1] : null;
    updateTimeline((draft) => {
      const target = draft.sections.find((section) => section.id === current.id);
      if (!target) {
        return;
      }
      if (activeClipResize?.edge === "start") {
        const min = previous ? parseTimelineTimeValue(previous.start) + 0.05 : 0;
        const max = next ? parseTimelineTimeValue(next.start) - 0.05 : duration;
        target.start = Number(clamp(pointerTime, min, Math.max(min, max)).toFixed(3));
        return;
      }
      if (!next) {
        return;
      }
      const min = parseTimelineTimeValue(current.start) + 0.05;
      const max = sceneIndex < scenes.length - 2 ? parseTimelineTimeValue(scenes[sceneIndex + 2].start) - 0.05 : duration;
      const resizedEnd = Number(clamp(pointerTime, min, Math.max(min, max)).toFixed(3));
      const nextTarget = draft.sections.find((section) => section.id === next.id);
      if (nextTarget) {
        nextTarget.start = resizedEnd;
      }
    });
  };

  window.addEventListener("pointermove", handleGlobalPlaylistPan);
  window.addEventListener("pointermove", handleGlobalScrollbarDrag);
  window.addEventListener("pointermove", handleGlobalClipResize);
  window.addEventListener("pointerup", (event) => {
    if (activePlaylistPan && event.pointerId === activePlaylistPan.pointerId) {
      activePlaylistPan = null;
    }
    if (activeScrollbarDrag && event.pointerId === activeScrollbarDrag.pointerId) {
      activeScrollbarDrag = null;
    }
    if (activeScrollbarResize && event.pointerId === activeScrollbarResize.pointerId) {
      activeScrollbarResize = null;
    }
    if (activeVScrollbarDrag && event.pointerId === activeVScrollbarDrag.pointerId) {
      activeVScrollbarDrag = null;
    }
    if (activeVScrollbarResize && event.pointerId === activeVScrollbarResize.pointerId) {
      activeVScrollbarResize = null;
    }
    if (activeClipResize && event.pointerId === activeClipResize.pointerId) {
      activeClipResize = null;
    }
  });
  window.addEventListener("pointercancel", (event) => {
    if (activePlaylistPan && event.pointerId === activePlaylistPan.pointerId) {
      activePlaylistPan = null;
    }
    if (activeScrollbarDrag && event.pointerId === activeScrollbarDrag.pointerId) {
      activeScrollbarDrag = null;
    }
    if (activeScrollbarResize && event.pointerId === activeScrollbarResize.pointerId) {
      activeScrollbarResize = null;
    }
    if (activeVScrollbarDrag && event.pointerId === activeVScrollbarDrag.pointerId) {
      activeVScrollbarDrag = null;
    }
    if (activeVScrollbarResize && event.pointerId === activeVScrollbarResize.pointerId) {
      activeVScrollbarResize = null;
    }
    if (activeClipResize && event.pointerId === activeClipResize.pointerId) {
      activeClipResize = null;
    }
  });

  const renderInspector = (): void => {
    const inspector = init.container.querySelector<HTMLDivElement>("[data-region='inspector']");
    const basicPanel = init.container.querySelector<HTMLDivElement>("[data-region='basic-panel']");
    if (!inspector || !state.timeline) {
      return;
    }
    if (!state.selectedSceneId) {
      inspector.innerHTML = `<div class="editor-empty">Select a scene to edit.</div>`;
      if (basicPanel) {
        basicPanel.innerHTML = "";
      }
      return;
    }
    const scene = getSceneById(state.selectedSceneId);
    if (!scene) {
      inspector.innerHTML = `<div class="editor-empty">Scene not found.</div>`;
      if (basicPanel) {
        basicPanel.innerHTML = "";
      }
      return;
    }

    inspector.dataset.sceneId = scene.id;
    if (basicPanel) {
      basicPanel.innerHTML = `
      <details class="editor-accordion-panel" open>
        <summary class="editor-group-title">BASIC</summary>
        <div class="editor-group">
        <label>
          <span>ID</span>
          <input type="text" data-field="id" value="${scene.id}" />
        </label>
        <label>
          <span>Effect</span>
          <select data-field="effect">
            ${init.effectNames
              .map((name) => `<option value="${name}" ${name === scene.effect ? "selected" : ""}>${name}</option>`)
              .join("")}
          </select>
        </label>
        <label>
          <span>Start (s)</span>
          <input type="number" step="0.1" data-field="start" value="${formatEditableTime(scene.start)}" />
        </label>
        <label>
          <span>End (s)</span>
          <input type="number" step="0.1" value="${formatEditableTime(getSceneEnd(scene))}" disabled />
        </label>
        <label>
          <span>Era preset</span>
          <select data-field="era">
            ${ERA_PRESETS.map((preset) => `<option value="${preset}" ${preset === scene.era ? "selected" : ""}>${preset}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Alignment/Fit</span>
          <select data-field="fitAlign">
            ${FIT_ALIGN_OPTIONS.map((option) => `<option value="${option.value}" ${option.value === (scene.fitAlign ?? "fill") ? "selected" : ""}>${option.label}</option>`).join("")}
          </select>
        </label>
        </div>
      </details>
      <details class="editor-accordion-panel">
        <summary class="editor-group-title">MAIN SLOTS (Top/Centre/Bottom)</summary>
        <div class="editor-group">
        <div class="editor-note">Use these to stage up to three simultaneous “main” effects in mobile-fit mode.</div>
        ${(() => {
          const selection = getMainSlotSelection(scene);
          return MAIN_SLOT_LABELS.map(({ slot, label }) => {
            const selected = selection[slot];
            return `
              <label>
                <span>${label} slot</span>
                <select data-main-slot="${slot}">
                  <option value="">None</option>
                  ${init.effectNames
                    .map((name) => `<option value="${name}" ${name === selected ? "selected" : ""}>${name}</option>`)
                    .join("")}
                </select>
              </label>
            `;
          }).join("");
        })()}
        </div>
      </details>
      <details class="editor-accordion-panel">
        <summary class="editor-group-title">TRANSITION</summary>
        <div class="editor-group">
        <label>
          <span>In</span>
          <select data-field="transition-in">
            ${transitionOptions.map((option) => `<option value="${option.value}" ${option.value === scene.transition?.in ? "selected" : ""}>${option.label}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Duration (s)</span>
          <input type="number" step="0.1" data-field="transition-duration" value="${scene.transition?.duration ?? 0.8}" />
        </label>
        </div>
      </details>
    `;
    }
    inspector.innerHTML = `
      <div class="editor-group">
        <div class="editor-group-title">Scene Params</div>
        <div data-region="scene-params"></div>
      </div>
      <div class="editor-group">
        <div class="editor-group-title">Scene Automation</div>
        <div data-region="scene-automation"></div>
      </div>
      <div class="editor-group">
        <div class="editor-group-title">Layers</div>
        <div data-region="layers"></div>
        <button type="button" class="editor-add" data-action="add-layer">+ Layer</button>
      </div>
      <div class="editor-group">
        <div class="editor-group-title">Text Cues</div>
        <div data-region="text-cues"></div>
        <button type="button" class="editor-add" data-action="add-cue">+ Text cue</button>
      </div>
    `;
    const cueModalBody = init.container.querySelector<HTMLElement>("[data-region='cue-generator-body']");
    if (cueModalBody) {
      cueModalBody.innerHTML = `
        <label><span>Words / lines</span><textarea data-bulk-cue-field="text" placeholder="Paste words here (split by spaces or new lines)"></textarea></label>
        <div class="editor-cue-bulk-grid">
          <label><span>Start (s)</span><input type="number" step="0.1" data-bulk-cue-field="start" value="${formatEditableTime(scene.start)}" /></label>
          <label><span>End (s)</span><input type="number" step="0.1" data-bulk-cue-field="end" value="${formatEditableTime(getSceneEnd(scene), true)}" /></label>
          <label><span>Size (px)</span><input type="number" step="1" min="1" data-bulk-cue-field="size" value="42" /></label>
          <label><span>Colour</span><input type="text" data-bulk-cue-field="color" value="#ffffff" /></label>
          <label><span>Font</span><input type="text" data-bulk-cue-field="font" value="inherit" /></label>
          <label><span>X (0..1)</span><input type="number" step="0.01" min="0" max="1" data-bulk-cue-field="x" value="0.5" /></label>
          <label><span>Y (0..1)</span><input type="number" step="0.01" min="0" max="1" data-bulk-cue-field="y" value="0.7" /></label>
          <label><span>Align</span><select data-bulk-cue-field="align"><option value="left">Left</option><option value="center" selected>Center</option><option value="right">Right</option></select></label>
        </div>
        <label class="editor-toggle"><input type="checkbox" data-bulk-cue-field="replace" /><span>Replace cues already starting in this scene</span></label>
        <button type="button" class="editor-add" data-action="generate-cues">Generate cues from words</button>
      `;
    }

    bindInspectorInputs(scene, init.container);
    renderParamsEditor(
      scene.effect,
      scene.params ?? {},
      init.container.querySelector("[data-region='scene-params']"),
      (params) => {
        updateTimeline((draft) => {
          const target = draft.sections.find((section) => section.id === scene.id);
          if (target) {
            target.params = params;
          }
        });
      },
      `scene:${scene.id}:params`
    );
    renderAutomationEditor(
      scene.effect,
      scene.automation ?? [],
      init.container.querySelector("[data-region='scene-automation']"),
      (automation) => {
        updateTimeline((draft) => {
          const target = draft.sections.find((section) => section.id === scene.id);
          if (target) {
            target.automation = automation;
          }
        });
      },
      parseTimelineTimeValue(scene.start),
      getSceneEnd(scene)
    );
    renderLayers(scene, init.container.querySelector("[data-region='layers']"));
    renderTextCues(scene, init.container.querySelector("[data-region='text-cues']"));
  };

  const bindInspectorInputs = (scene: RawSectionConfig, inspector: HTMLElement): void => {
    const cueModal = init.container.querySelector<HTMLElement>("[data-region='cue-generator-modal']");
    init.container.querySelector<HTMLButtonElement>("[data-action='open-cue-generator']")?.addEventListener("click", () => {
      cueModal?.classList.remove("is-hidden");
    });
    init.container.querySelector<HTMLButtonElement>("[data-action='close-cue-generator']")?.addEventListener("click", () => {
      cueModal?.classList.add("is-hidden");
    });
    const updateField = (field: string, value: string): void => {
      updateTimeline((draft) => {
        const target = draft.sections.find((section) => section.id === scene.id);
        if (!target) {
          return;
        }
        if (field === "start") {
          target.start = Number(value);
        } else if (field === "id") {
          target.id = value;
          setState({ selectedSceneId: value });
        } else if (field === "effect") {
          target.effect = value;
        } else if (field === "era") {
          target.era = value as EraPreset;
        } else if (field === "transition-in") {
          target.transition = target.transition ?? { in: "fade", duration: 0.8 };
          target.transition.in = value as TransitionType;
        } else if (field === "transition-duration") {
          target.transition = target.transition ?? { in: "fade", duration: 0.8 };
          target.transition.duration = Number(value);
        } else if (field === "fitAlign") {
          target.fitAlign = value as FitAlign;
        }
      });
    };

    inspector.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-field]").forEach((input) => {
      input.addEventListener("change", () => updateField(input.dataset.field ?? "", input.value));
      if (input instanceof HTMLInputElement && input.type === "text") {
        input.addEventListener("blur", () => updateField(input.dataset.field ?? "", input.value));
      }
    });

    const addLayerButton = inspector.querySelector<HTMLButtonElement>("[data-action='add-layer']");
    addLayerButton?.addEventListener("click", () => {
      updateTimeline((draft) => {
        const target = draft.sections.find((section) => section.id === scene.id);
        if (target) {
          target.layers = addLayer(target.layers ?? [], createLayer(init.effectNames[0] ?? "starfield"));
        }
      });
    });

    const slotInputs = Array.from(inspector.querySelectorAll<HTMLSelectElement>("[data-main-slot]"));
    const applySlotControls = (): void => {
      const selection: MainSlotSelection = {
        top: null,
        centre: null,
        bottom: null
      };
      slotInputs.forEach((input) => {
        const slot = input.dataset.mainSlot as MainSlot;
        if (!slot) {
          return;
        }
        const nextValue = input.value.trim();
        selection[slot] = nextValue.length > 0 ? nextValue : null;
      });
      updateTimeline((draft) => {
        const target = draft.sections.find((section) => section.id === scene.id);
        if (!target) {
          return;
        }
        applyMainSlotSelection(target, selection);
      });
    };
    slotInputs.forEach((input) => input.addEventListener("change", applySlotControls));

    const addCueButton = inspector.querySelector<HTMLButtonElement>("[data-action='add-cue']");
    addCueButton?.addEventListener("click", () => {
      const start = parseTimelineTimeValue(scene.start);
      const end = Math.min(getSceneEnd(scene), start + 3);
      updateTimeline((draft) => {
        draft.textCues = [...(draft.textCues ?? []), createTextCue({ start, end })];
      });
    });

    inspector.querySelectorAll<HTMLDetailsElement>(".editor-accordion-panel").forEach((panel) => {
      panel.addEventListener("toggle", () => {
        if (!panel.open) {
          return;
        }
        inspector.querySelectorAll<HTMLDetailsElement>(".editor-accordion-panel").forEach((other) => {
          if (other !== panel) {
            other.open = false;
          }
        });
      });
    });

    const generateCuesButton = init.container.querySelector<HTMLButtonElement>("[data-action='generate-cues']");
    generateCuesButton?.addEventListener("click", () => {
      const text =
        init.container.querySelector<HTMLTextAreaElement>("[data-bulk-cue-field='text']")?.value ?? "";
      const start = Number(init.container.querySelector<HTMLInputElement>("[data-bulk-cue-field='start']")?.value ?? 0);
      const end = Number(init.container.querySelector<HTMLInputElement>("[data-bulk-cue-field='end']")?.value ?? 0);
      const size = Number(init.container.querySelector<HTMLInputElement>("[data-bulk-cue-field='size']")?.value ?? 42);
      const color =
        init.container.querySelector<HTMLInputElement>("[data-bulk-cue-field='color']")?.value?.trim() || "#ffffff";
      const font = init.container.querySelector<HTMLInputElement>("[data-bulk-cue-field='font']")?.value?.trim() || "inherit";
      const x = Number(init.container.querySelector<HTMLInputElement>("[data-bulk-cue-field='x']")?.value ?? 0.5);
      const y = Number(init.container.querySelector<HTMLInputElement>("[data-bulk-cue-field='y']")?.value ?? 0.7);
      const align =
        (init.container.querySelector<HTMLSelectElement>("[data-bulk-cue-field='align']")?.value as
          | "left"
          | "center"
          | "right") ?? "center";
      const replace = init.container.querySelector<HTMLInputElement>("[data-bulk-cue-field='replace']")?.checked ?? false;

      updateTimeline((draft) => {
        const sceneStart = parseTimelineTimeValue(scene.start);
        const sceneEnd = getSceneEnd(scene);
        const existingCues = draft.textCues ?? [];
        const nextExistingIds = new Set(existingCues.map((cue) => cue.id));
        const generated = generateWordTextCues({
          text,
          start,
          end,
          font,
          color,
          size: Number.isFinite(size) && size > 0 ? size : 42,
          x: Number.isFinite(x) ? x : 0.5,
          y: Number.isFinite(y) ? y : 0.7,
          align,
          existingIds: nextExistingIds,
          idPrefix: scene.id.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "cue"
        });
        const retained = replace
          ? existingCues.filter((cue) => {
              const cueStart = parseTimelineTimeValue(cue.start);
              return cueStart < sceneStart || cueStart > sceneEnd;
            })
          : existingCues;
        draft.textCues = [...retained, ...generated].sort(
          (a, b) => parseTimelineTimeValue(a.start) - parseTimelineTimeValue(b.start)
        );
      });
    });
  };

  const renderParamsEditor = (
    effectName: string,
    params: Record<string, number>,
    container: Element | null,
    onChange: (nextParams: Record<string, number>) => void,
    errorKey: string
  ): void => {
    if (!container) {
      return;
    }
    const paramOptions = getEffectParamOptions(effectName);
    const listId = createParamListId(errorKey);
    const existingKeys = new Set(Object.keys(params));
    const availableOptions = paramOptions.filter((option) => !existingKeys.has(option));
    container.innerHTML = `
      <datalist id="${listId}">
        ${paramOptions.map((option) => `<option value="${option}"></option>`).join("")}
      </datalist>
      <div class="editor-param-list">
        ${Object.entries(params)
          .map(
            ([key, value]) => `
            <div class="editor-param-row">
              <label class="editor-param-key-field">
                <span class="editor-param-meta">Param</span>
                <input type="text" data-param-key list="${listId}" value="${key}" />
              </label>
              <label class="editor-param-value-field">
                <span class="editor-param-meta">Value</span>
                <span data-param-value-slot><input type="text" data-param-value value="${String(value)}" /></span>
              </label>
              <button type="button" data-action="remove-param">Remove</button>
            </div>`
          )
          .join("")}
      </div>
      <div class="editor-param-add">
        ${
          availableOptions.length > 0
            ? `
              <label>
                <span>Available params</span>
                <select data-action="add-param-select">
                  ${availableOptions.map((option) => `<option value="${option}">${option}</option>`).join("")}
                </select>
              </label>
              <button type="button" class="editor-add" data-action="add-param">+ Param</button>
            `
            : `
              <div class="editor-note">All known params are already added.</div>
            `
        }
      </div>
    `;

    const rows = container.querySelectorAll<HTMLDivElement>(".editor-param-row");
    const config = getManifestDebugConfig(effectName);
    const controlsByKey = new Map((config?.controls ?? []).map((control) => [control.key, control]));

    rows.forEach((row) => {
      const key = row.querySelector<HTMLInputElement>("[data-param-key]")?.value ?? "";
      const control = controlsByKey.get(key);
      const value = params[key] as unknown as EditorParamValue;
      const valueSlot = row.querySelector<HTMLElement>("[data-param-value-slot]");
      if (!valueSlot) {
        return;
      }
      if (control?.type === "toggle") {
        valueSlot.innerHTML = `<input type="checkbox" data-param-value-toggle ${isEditorParamToggleChecked(value) ? "checked" : ""} />`;
        return;
      }
      if (control?.type === "select") {
        valueSlot.innerHTML = `<select data-param-value-select>${(control.options ?? [])
          .map((option) => `<option value="${option.value}" ${String(value) === option.value ? "selected" : ""}>${option.label}</option>`)
          .join("")}</select>`;
        return;
      }
      if (control?.type === "number") {
        const fallback = typeof control.defaultValue === "number" ? control.defaultValue : 0;
        const min = Number.isFinite(control.min) ? (control.min as number) : undefined;
        const max = Number.isFinite(control.max) ? (control.max as number) : undefined;
        const step = Number.isFinite(control.step) && (control.step as number) > 0 ? (control.step as number) : 0.01;
        const currentValue = clampEditorNumberParam(value, { min, max, fallback });
        const hasRange = Number.isFinite(min) && Number.isFinite(max) && (max as number) > (min as number);
        valueSlot.innerHTML = `
          <div class="editor-param-number" ${hasRange ? `data-has-range="true"` : ""}>
            <div class="editor-param-stepper" role="group" aria-label="${control.label}">
              <button type="button" data-action="param-step" data-direction="-1" aria-label="Decrease ${control.label}">−</button>
              <input
                type="number"
                data-param-value-number
                value="${String(currentValue)}"
                ${min !== undefined ? `min="${min}"` : ""}
                ${max !== undefined ? `max="${max}"` : ""}
                step="${step}"
                inputmode="decimal"
              />
              <button type="button" data-action="param-step" data-direction="1" aria-label="Increase ${control.label}">+</button>
            </div>
            ${
              hasRange
                ? `<input
                    type="range"
                    data-param-value-range
                    value="${String(currentValue)}"
                    min="${min as number}"
                    max="${max as number}"
                    step="${step}"
                    aria-label="${control.label} slider"
                  />`
                : ""
            }
          </div>
        `;
        return;
      }
      valueSlot.innerHTML = `<input type="text" data-param-value value="${String(value)}" />`;
    });

    rows.forEach((row, index) => {
      const keyInput = row.querySelector<HTMLInputElement>("[data-param-key]");
      const removeButton = row.querySelector<HTMLButtonElement>("[data-action='remove-param']");

      const updateParams = (): void => {
        const entries = Array.from(container.querySelectorAll<HTMLDivElement>(".editor-param-row")).map((item) => {
          const keyInput = item.querySelector<HTMLInputElement>("[data-param-key]");
          const key = keyInput?.value ?? "";
          const control = controlsByKey.get(key);
          const toggleInput = item.querySelector<HTMLInputElement>("[data-param-value-toggle]");
          const selectInput = item.querySelector<HTMLSelectElement>("[data-param-value-select]");
          const numberInput = item.querySelector<HTMLInputElement>("[data-param-value-number]");
          const textInput = item.querySelector<HTMLInputElement>("[data-param-value]");
          const value: EditorParamValue =
            control?.type === "toggle"
              ? toggleInput?.checked ?? false
              : control?.type === "select"
                ? selectInput?.value ?? ""
                : control?.type === "number"
                  ? clampEditorNumberParam(numberInput?.value ?? "", {
                      min: control.min,
                      max: control.max,
                      fallback: typeof control.defaultValue === "number" ? control.defaultValue : 0
                    })
                  : parseEditorParamInputValue(textInput?.value ?? "");
          return [key, value] as const;
        });
        const nextParams: Record<string, number> = {};
        entries.forEach(([key, value]) => {
          if (key) {
            nextParams[key] = value;
          }
        });
        onChange(nextParams);
      };

      keyInput?.addEventListener("change", updateParams);
      const syncNumberInputs = (): void => {
        const numberInput = row.querySelector<HTMLInputElement>("[data-param-value-number]");
        const rangeInput = row.querySelector<HTMLInputElement>("[data-param-value-range]");
        if (!numberInput || !rangeInput) {
          return;
        }
        rangeInput.value = numberInput.value;
      };

      const syncRangeInputs = (): void => {
        const numberInput = row.querySelector<HTMLInputElement>("[data-param-value-number]");
        const rangeInput = row.querySelector<HTMLInputElement>("[data-param-value-range]");
        if (!numberInput || !rangeInput) {
          return;
        }
        numberInput.value = rangeInput.value;
      };

      row.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-param-value], [data-param-value-toggle], [data-param-value-select], [data-param-value-number]").forEach((input) => {
        input.addEventListener("change", updateParams);
      });
      row.querySelectorAll<HTMLInputElement>("[data-param-value-range]").forEach((input) => {
        input.addEventListener("input", () => {
          syncRangeInputs();
          updateParams();
        });
        input.addEventListener("change", () => {
          syncRangeInputs();
          updateParams();
        });
      });
      row.querySelectorAll<HTMLInputElement>("[data-param-value-number]").forEach((input) => {
        input.addEventListener("input", () => {
          syncNumberInputs();
        });
      });
      row.querySelectorAll<HTMLButtonElement>("[data-action='param-step']").forEach((button) => {
        button.addEventListener("click", () => {
          const key = row.querySelector<HTMLInputElement>("[data-param-key]")?.value ?? "";
          const control = controlsByKey.get(key);
          const numberInput = row.querySelector<HTMLInputElement>("[data-param-value-number]");
          const directionRaw = Number(button.dataset.direction);
          if (!control || control.type !== "number" || !numberInput || !Number.isFinite(directionRaw) || directionRaw === 0) {
            return;
          }
          const direction = directionRaw > 0 ? 1 : -1;
          const nextValue = stepEditorNumberParam(numberInput.value, direction, {
            min: control.min,
            max: control.max,
            step: control.step,
            fallback: typeof control.defaultValue === "number" ? control.defaultValue : 0
          });
          numberInput.value = String(nextValue);
          syncNumberInputs();
          updateParams();
        });
      });
      removeButton?.addEventListener("click", () => {
        const nextEntries = Object.entries(params).filter((_, paramIndex) => paramIndex !== index);
        onChange(Object.fromEntries(nextEntries));
      });
    });

    const addParam = container.querySelector<HTMLButtonElement>("[data-action='add-param']");
    addParam?.addEventListener("click", () => {
      const select = container.querySelector<HTMLSelectElement>("[data-action='add-param-select']");
      const key = select?.value ?? "";
      if (!key) {
        return;
      }
      const control = controlsByKey.get(key);
      const nextValue =
        control?.type === "toggle"
          ? Boolean(control.defaultValue)
          : (control?.defaultValue ?? 0);
      onChange({ ...params, [key]: nextValue as unknown as number });
    });


  };

  const renderAutomationEditor = (
    effectName: string,
    automation: RawParamAutomation[],
    container: Element | null,
    onChange: (next: RawParamAutomation[]) => void,
    sceneStart: number,
    sceneEnd: number
  ): void => {
    if (!container) {
      return;
    }
    const paramOptions = getEffectParamOptions(effectName);
    const listId = createParamListId(`automation-${effectName}`);
    container.innerHTML = `
      <datalist id="${listId}">
        ${paramOptions.map((option) => `<option value="${option}"></option>`).join("")}
      </datalist>
      <div class="editor-automation-header">
        <span>Param</span>
        <span>From</span>
        <span>To</span>
        <span>Start</span>
        <span>End</span>
        <span>Ease</span>
        <span class="editor-automation-actions-label">Actions</span>
      </div>
      <div class="editor-automation-list">
        ${automation
          .map(
            (entry, index) => `
            <div class="editor-automation-row" data-index="${index}">
              <input type="text" list="${listId}" data-field="param" value="${entry.param}" />
              <input type="number" step="0.1" data-field="from" value="${entry.from}" />
              <input type="number" step="0.1" data-field="to" value="${entry.to}" />
              <input type="number" step="0.1" data-field="t0" value="${formatEditableTime(entry.t0)}" />
              <input type="number" step="0.1" data-field="t1" value="${formatEditableTime(entry.t1)}" />
              <select data-field="ease">
                <option value="">(none)</option>
                ${EASE_NAMES.map((name) => `<option value="${name}" ${name === entry.ease ? "selected" : ""}>${name}</option>`).join("")}
              </select>
              <button type="button" data-action="move-up">↑</button>
              <button type="button" data-action="move-down">↓</button>
              <button type="button" data-action="add-point">+Pt</button>
              <button type="button" data-action="delete">Delete</button>
            </div>
            <div class="editor-automation-curve" data-curve-index="${index}">
              <svg viewBox="0 0 1000 140" preserveAspectRatio="none" data-curve-svg="${index}" style="width:100%;height:92px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.15);border-radius:4px;cursor:crosshair;"></svg>
            </div>`
          )
          .join("")}
      </div>
      <button type="button" class="editor-add" data-action="add-automation">+ Automation</button>
    `;

    const list = container.querySelector(".editor-automation-list");
    list?.querySelectorAll<HTMLDivElement>(".editor-automation-row").forEach((row) => {
      const index = Number(row.dataset.index);
      const updateEntry = (): void => {
        const next = automation.map((entry) => ({ ...entry }));
        const fieldInputs = row.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-field]");
        fieldInputs.forEach((input) => {
          const field = input.dataset.field ?? "";
          const value = input.value;
          if (field === "param") {
            next[index].param = value;
          } else if (field === "ease") {
            next[index].ease = value || undefined;
          } else {
            (next[index] as Record<string, number>)[field] = Number(value);
          }
        });
        onChange(next);
      };

      row.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-field]").forEach((input) => {
        input.addEventListener("change", updateEntry);
      });

      row.querySelector<HTMLButtonElement>("[data-action='delete']")?.addEventListener("click", () => {
        onChange(automation.filter((_, entryIndex) => entryIndex !== index));
      });
      row.querySelector<HTMLButtonElement>("[data-action='move-up']")?.addEventListener("click", () => {
        if (index === 0) {
          return;
        }
        const next = [...automation];
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        onChange(next);
      });
      row.querySelector<HTMLButtonElement>("[data-action='move-down']")?.addEventListener("click", () => {
        if (index >= automation.length - 1) {
          return;
        }
        const next = [...automation];
        [next[index + 1], next[index]] = [next[index], next[index + 1]];
        onChange(next);
      });
      row.querySelector<HTMLButtonElement>("[data-action='add-point']")?.addEventListener("click", () => {
        const current = ensureAutomationPoints(automation[index]);
        const clip = createAutomationClip(current.points ?? []);
        const inserted = insertPoint(
          { ...clip, segmentMeta: current.segmentMeta ?? clip.segmentMeta, mode: "free" },
          {
            time: (parseTimelineTimeValue(current.t0) + parseTimelineTimeValue(current.t1)) / 2,
            value: (current.from + current.to) / 2
          },
          { gridSize: 0.1, snapEnabled: true }
        );
        const next = automation.map((entry, entryIndex) => {
          if (entryIndex !== index) {
            return entry;
          }
          return {
            ...entry,
            points: inserted.points,
            segmentMeta: inserted.segmentMeta
          };
        });
        onChange(next);
      });
    });

    const drawCurve = (entry: RawParamAutomation, index: number): void => {
      const svg = container.querySelector<SVGSVGElement>(`[data-curve-svg='${index}']`);
      if (!svg) {
        return;
      }
      const seeded = ensureAutomationPoints(entry);
      const points = seeded.points ?? [];
      const minTime = parseTimelineTimeValue(seeded.t0);
      const maxTime = Math.max(minTime + 0.001, parseTimelineTimeValue(seeded.t1));
      const xOf = (time: number): number => ((time - minTime) / (maxTime - minTime)) * 1000;
      const yOf = (value: number): number => (1 - clamp(value, 0, 1)) * 140;
      svg.innerHTML = `<polyline points="${points.map((point) => `${xOf(point.time)},${yOf(point.value)}`).join(" ")}" fill="none" stroke="#d8f5be" stroke-width="2" />`;
      points.forEach((point, pointIndex) => {
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("cx", String(xOf(point.time)));
        dot.setAttribute("cy", String(yOf(point.value)));
        dot.setAttribute("r", "5");
        dot.setAttribute("fill", "#e6ffd0");
        dot.setAttribute("stroke", "#2e5f2e");
        dot.dataset.pointIndex = String(pointIndex);
        svg.appendChild(dot);
      });
      svg.oncontextmenu = (event) => event.preventDefault();
      svg.onclick = (event) => {
        if ((event.target as Element).tagName.toLowerCase() === "circle") {
          return;
        }
        const rect = svg.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
        const next = automation.map((item, itemIndex) => {
          if (itemIndex !== index) {
            return item;
          }
          const base = ensureAutomationPoints(item);
          const inserted = insertPoint(createAutomationClip(base.points ?? []), { time: minTime + x * (maxTime - minTime), value: 1 - y }, { gridSize: 0.05, snapEnabled: !event.altKey });
          return { ...item, points: inserted.points, segmentMeta: inserted.segmentMeta };
        });
        onChange(next);
      };
      svg.querySelectorAll<SVGCircleElement>("circle").forEach((dot) => {
        const pointIndex = Number(dot.dataset.pointIndex);
        dot.oncontextmenu = () => {
          const next = automation.map((item, itemIndex) => {
            if (itemIndex !== index) {
              return item;
            }
            const base = ensureAutomationPoints(item);
            const removed = removePoint(createAutomationClip(base.points ?? []), pointIndex);
            return { ...item, points: removed.points, segmentMeta: removed.segmentMeta };
          });
          onChange(next);
        };
        dot.onpointerdown = (pointerEvent) => {
          pointerEvent.preventDefault();
          const onMove = (moveEvent: PointerEvent): void => {
            const rect = svg.getBoundingClientRect();
            const x = clamp((moveEvent.clientX - rect.left) / rect.width, 0, 1);
            const y = clamp((moveEvent.clientY - rect.top) / rect.height, 0, 1);
            const next = automation.map((item, itemIndex) => {
              if (itemIndex !== index) {
                return item;
              }
              const base = ensureAutomationPoints(item);
              const moved = movePoint(
                createAutomationClip(base.points ?? []),
                pointIndex,
                { time: minTime + x * (maxTime - minTime), value: 1 - y },
                { gridSize: 0.05, snapEnabled: !moveEvent.altKey, slideMode: moveEvent.shiftKey }
              );
              return { ...item, points: moved.points, segmentMeta: moved.segmentMeta };
            });
            onChange(next);
          };
          const onUp = (): void => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
          };
          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
        };
      });
    };
    automation.forEach((entry, index) => drawCurve(entry, index));

    container.querySelector<HTMLButtonElement>("[data-action='add-automation']")?.addEventListener("click", () => {
      const defaultParam = paramOptions[0] ?? "speed";
      onChange([
        ...automation,
        createAutomationEntry({
          param: defaultParam,
          t0: sceneStart,
          t1: sceneEnd
        })
      ]);
    });
  };

  const renderLayers = (scene: RawSectionConfig, container: Element | null): void => {
    if (!container) {
      return;
    }
    const layers = scene.layers ?? [];
    container.innerHTML = layers
      .map(
        (layer, index) => `
        <details class="editor-layer" ${index === 0 ? "open" : ""}>
          <summary>Layer ${index + 1}: ${layer.effect}</summary>
          <label>
            <span>Effect</span>
            <select data-layer-field="effect" data-layer-index="${index}">
              ${init.effectNames
                .map((name) => `<option value="${name}" ${name === layer.effect ? "selected" : ""}>${name}</option>`)
                .join("")}
            </select>
          </label>
          <label>
            <span>Opacity</span>
            <input type="number" step="0.05" min="0" max="1" data-layer-field="opacity" data-layer-index="${index}" value="${layer.opacity ?? 0.6}" />
          </label>
          <label>
            <span>Blend mode</span>
            <select data-layer-field="blend" data-layer-index="${index}">
              ${BLEND_MODES.map((mode) => `<option value="${mode}" ${mode === layer.blend ? "selected" : ""}>${mode}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Alignment/Fit</span>
            <select data-layer-field="fitAlign" data-layer-index="${index}">
              ${FIT_ALIGN_OPTIONS.map((option) => `<option value="${option.value}" ${option.value === (layer.fitAlign ?? "fill") ? "selected" : ""}>${option.label}</option>`).join("")}
            </select>
          </label>
          <div data-layer-params="${index}"></div>
          <div class="editor-layer-actions">
            <button type="button" data-layer-action="move-up" data-layer-index="${index}">Move up</button>
            <button type="button" data-layer-action="move-down" data-layer-index="${index}">Move down</button>
            <button type="button" data-layer-action="remove" data-layer-index="${index}">Remove layer</button>
          </div>
          <div class="editor-layer-automation" data-layer-automation="${index}"></div>
        </details>
      `
      )
      .join("");

    container.querySelectorAll<HTMLSelectElement | HTMLInputElement>("[data-layer-field]").forEach((input) => {
      input.addEventListener("change", () => {
        const layerIndex = Number(input.dataset.layerIndex ?? 0);
        updateTimeline((draft) => {
          const target = draft.sections.find((section) => section.id === scene.id);
          if (!target || !target.layers) {
            return;
          }
          const layer = target.layers[layerIndex];
          if (!layer) {
            return;
          }
          const field = input.dataset.layerField ?? "";
          if (field === "effect") {
            layer.effect = input.value;
          } else if (field === "opacity") {
            layer.opacity = Number(input.value);
          } else if (field === "blend") {
            layer.blend = input.value as BlendMode;
          } else if (field === "fitAlign") {
            layer.fitAlign = input.value as FitAlign;
          }
        });
      });
    });

    container.querySelectorAll<HTMLButtonElement>("[data-layer-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const layerIndex = Number(button.dataset.layerIndex ?? 0);
        const action = button.dataset.layerAction ?? "";
        updateTimeline((draft) => {
          const target = draft.sections.find((section) => section.id === scene.id);
          if (!target || !target.layers) {
            return;
          }
          if (action === "remove") {
            target.layers = target.layers.filter((_, index) => index !== layerIndex);
          } else if (action === "move-up" && layerIndex > 0) {
            target.layers = reorderLayers(target.layers, layerIndex, layerIndex - 1);
          } else if (action === "move-down" && layerIndex < target.layers.length - 1) {
            target.layers = reorderLayers(target.layers, layerIndex, layerIndex + 1);
          }
        });
      });
    });

    layers.forEach((layer, index) => {
      renderParamsEditor(
        layer.effect,
        layer.params ?? {},
        container.querySelector(`[data-layer-params='${index}']`),
        (params) => {
          updateTimeline((draft) => {
            const target = draft.sections.find((section) => section.id === scene.id);
            if (!target || !target.layers) {
              return;
            }
            const targetLayer = target.layers[index];
            if (targetLayer) {
              targetLayer.params = params;
            }
          });
        },
        `layer:${scene.id}:${index}:params`
      );
      renderAutomationEditor(
        layer.effect,
        layer.automation ?? [],
        container.querySelector(`[data-layer-automation='${index}']`),
        (automation) => {
          updateTimeline((draft) => {
            const target = draft.sections.find((section) => section.id === scene.id);
            if (!target || !target.layers) {
              return;
            }
            const targetLayer = target.layers[index];
            if (targetLayer) {
              targetLayer.automation = automation;
            }
          });
        },
        parseTimelineTimeValue(scene.start),
        getSceneEnd(scene)
      );
    });
  };

  const renderTextCues = (scene: RawSectionConfig, container: Element | null): void => {
    if (!container || !state.timeline) {
      return;
    }
    const cues = (state.timeline.textCues ?? []).filter((cue) => {
      const start = parseTimelineTimeValue(cue.start);
      const sceneStart = parseTimelineTimeValue(scene.start);
      return start >= sceneStart && start <= getSceneEnd(scene);
    });

    container.innerHTML = cues
      .map(
        (cue, index) => `
        <div class="editor-cue" data-cue-id="${cue.id}">
          <label>
            <span>ID</span>
            <input type="text" data-cue-field="id" value="${cue.id}" />
          </label>
          <label>
            <span>Start (s)</span>
            <input type="number" step="0.1" data-cue-field="start" value="${formatEditableTime(cue.start)}" />
          </label>
          <label>
            <span>End (s)</span>
            <input type="number" step="0.1" data-cue-field="end" value="${formatEditableTime(cue.end, true)}" />
          </label>
          <label>
            <span>Text</span>
            <input type="text" data-cue-field="text" value="${cue.text ?? ""}" />
          </label>
          <label>
            <span>Font</span>
            <input type="text" data-cue-field="font" value="${getCueTypography(cue).font}" />
          </label>
          <label>
            <span>Colour</span>
            <input type="text" data-cue-field="color" value="${getCueTypography(cue).color}" />
          </label>
          <label>
            <span>Size (px)</span>
            <input type="number" step="1" min="1" data-cue-field="size" value="${getCueTypography(cue).size}" />
          </label>
          <label>
            <span>X (0..1)</span>
            <input type="number" step="0.01" data-cue-field="x" value="${cue.x ?? 0.5}" />
          </label>
          <label>
            <span>Y (0..1)</span>
            <input type="number" step="0.01" data-cue-field="y" value="${cue.y ?? 0.7}" />
          </label>
          <label>
            <span>Align</span>
            <select data-cue-field="align">
              <option value="left" ${cue.align === "left" ? "selected" : ""}>Left</option>
              <option value="center" ${cue.align === "center" ? "selected" : ""}>Center</option>
              <option value="right" ${cue.align === "right" ? "selected" : ""}>Right</option>
            </select>
          </label>
          <button type="button" data-cue-action="delete" data-cue-id="${cue.id}">Delete cue</button>
        </div>
      `
      )
      .join("");

    container.querySelectorAll<HTMLDivElement>(".editor-cue").forEach((cueEl) => {
      const cueId = cueEl.dataset.cueId ?? "";
      cueEl.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-cue-field]").forEach((input) => {
        input.addEventListener("change", () => {
          updateTimeline((draft) => {
            const targetCue = draft.textCues?.find((cue) => cue.id === cueId);
            if (!targetCue) {
              return;
            }
            const field = input.dataset.cueField ?? "";
            if (field === "id") {
              targetCue.id = input.value;
            } else if (field === "start") {
              targetCue.start = Number(input.value);
            } else if (field === "end") {
              targetCue.end = Number(input.value);
            } else if (field === "text") {
              targetCue.text = input.value;
              if (targetCue.spans && targetCue.spans.length > 0) {
                targetCue.spans[0].text = input.value;
              }
            } else if (field === "font") {
              const typography = getCueTypography(targetCue);
              applyCueTypography(targetCue, { ...typography, font: input.value || typography.font });
            } else if (field === "color") {
              const typography = getCueTypography(targetCue);
              applyCueTypography(targetCue, { ...typography, color: input.value || typography.color });
            } else if (field === "size") {
              const typography = getCueTypography(targetCue);
              const nextSize = Number(input.value);
              applyCueTypography(targetCue, {
                ...typography,
                size: Number.isFinite(nextSize) && nextSize > 0 ? nextSize : typography.size
              });
            } else if (field === "x") {
              targetCue.x = Number(input.value);
              targetCue.units = "normalized";
            } else if (field === "y") {
              targetCue.y = Number(input.value);
              targetCue.units = "normalized";
            } else if (field === "align") {
              targetCue.align = input.value as "left" | "center" | "right";
            }
          });
        });
      });
    });

    container.querySelectorAll<HTMLButtonElement>("[data-cue-action='delete']").forEach((button) => {
      button.addEventListener("click", () => {
        const cueId = button.dataset.cueId ?? "";
        updateTimeline((draft) => {
          draft.textCues = draft.textCues?.filter((cue) => cue.id !== cueId) ?? [];
        });
      });
    });
  };

  const renderTransport = (): void => {
    const transport = init.container.querySelector<HTMLDivElement>("[data-region='transport']");
    if (!transport) {
      return;
    }
    playbackLabel = transport.querySelector<HTMLSpanElement>("[data-region='timestamp']");
    previewPlaybackLabel = init.container.querySelector<HTMLSpanElement>("[data-region='preview-time']");
    playbackButton = transport.querySelector<HTMLButtonElement>("[data-action='play-toggle']");

    playbackButton?.addEventListener("click", async () => {
      if (playbackButton?.dataset.state === "playing") {
        init.pause();
      } else {
        await init.play();
      }
    });
    init.container
      .querySelector<HTMLButtonElement>("[data-action='play-toggle-inline']")
      ?.addEventListener("click", async () => {
        if (playbackButton?.dataset.state === "playing") {
          init.pause();
        } else {
          await init.play();
        }
      });
    init.container
      .querySelector<HTMLButtonElement>("[data-action='jump-scene-inline']")
      ?.addEventListener("click", () => {
        if (!state.selectedSceneId) {
          return;
        }
        const scene = getSceneById(state.selectedSceneId);
        if (!scene) {
          return;
        }
        if (!state.loopRange) {
          init.seek(computeSceneSeekTime(scene.start, init.getAudioOffset()));
        }
      });

    transport.querySelector<HTMLButtonElement>("[data-action='jump-scene']")?.addEventListener("click", () => {
      if (!state.selectedSceneId) {
        return;
      }
      const scene = getSceneById(state.selectedSceneId);
      if (!scene) {
        return;
      }
      if (!state.loopRange) {
        init.seek(computeSceneSeekTime(scene.start, init.getAudioOffset()));
      }
    });

    transport
      .querySelector<HTMLInputElement>("[data-action='loop-toggle']")
      ?.addEventListener("change", (event) => {
        const target = event.target as HTMLInputElement;
        setState({ loopEnabled: target.checked });
      });
    init.container.querySelector<HTMLButtonElement>("[data-action='clear-loop-selection']")?.addEventListener("click", () => {
      setState({ loopRange: null, loopEnabled: false });
    });
  };

  const bindHeaderActions = (): void => {
    const importButton = init.container.querySelector<HTMLButtonElement>("[data-action='import']");
    importButton?.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,application/json";
      input.addEventListener("change", async () => {
        const file = input.files?.[0];
        if (!file) {
          return;
        }
        try {
          const text = await file.text();
          const raw = JSON.parse(text) as RawTimelineConfig;
          const timeline = ensureTimelineShape(raw);
          updateTimeline((draft) => {
            draft.audio = timeline.audio;
            draft.intro = timeline.intro;
            draft.sections = timeline.sections ?? [];
            draft.textCues = timeline.textCues ?? [];
          });
          setState({ selectedSceneId: timeline.sections?.[0]?.id ?? null, error: null });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Invalid JSON file";
          setState({ error: message });
        }
      });
      input.click();
    });

    init.container.querySelector<HTMLButtonElement>("[data-action='export']")?.addEventListener("click", () => {
      if (state.timeline) {
        downloadTimeline(state.timeline, "timeline.release.json");
      }
    });

    init.container.querySelector<HTMLButtonElement>("[data-action='revert']")?.addEventListener("click", () => {
      if (!state.originalTimeline) {
        return;
      }
      clearTimelineDraft();
      setState({
        timeline: structuredClone(state.originalTimeline),
        selectedSceneId: state.originalTimeline.sections[0]?.id ?? null,
        error: null
      });
      void applyTimelineIfValid(state.originalTimeline);
    });

    init.container.querySelector<HTMLButtonElement>("[data-action='add-scene']")?.addEventListener("click", () => {
      const sections = state.timeline?.sections ?? [];
      if (isPlaying && isWithinSceneStartThreshold(sections, currentDemoTime)) {
        return;
      }
      const { start } = getNewSceneTimeRange(sections, currentDemoTime);
      const effect = getRandomEffectSelection(init.effectNames);
      const newScene = createScene({
        id: getNextNewSectionName(sections),
        start,
        effect,
        params: getRandomEffectParams(effect)
      });
      updateTimeline(
        (draft) => {
          draft.sections = [...draft.sections, newScene];
        },
        { selectedSceneId: newScene.id }
      );
    });

    init.container.querySelector<HTMLInputElement>("[data-action='scene-search']")?.addEventListener("input", (event) => {
      sceneSearchQuery = (event.target as HTMLInputElement).value;
      renderSceneList();
    });

    init.container.querySelector<HTMLButtonElement>("[data-action='duplicate-selected']")?.addEventListener("click", () => {
      if (!state.selectedSceneId || !state.timeline) {
        return;
      }
      const index = state.timeline.sections.findIndex((scene) => scene.id === state.selectedSceneId);
      const scene = index >= 0 ? state.timeline.sections[index] : null;
      if (!scene) {
        return;
      }
      updateTimeline((draft) => {
        const duplicated = duplicateScene(scene, `scene-${Math.random().toString(36).slice(2, 8)}`);
        draft.sections.splice(index + 1, 0, duplicated);
      });
    });

    init.container.querySelector<HTMLButtonElement>("[data-action='delete-selected']")?.addEventListener("click", () => {
      if (!state.selectedSceneId || !state.timeline) {
        return;
      }
      const deletingSceneId = state.selectedSceneId;
      const remainingIds = state.timeline.sections.filter((scene) => scene.id !== deletingSceneId).map((scene) => scene.id);
      if (window.confirm("Delete this scene?")) {
        updateTimeline((draft) => {
          draft.sections = deleteScene(draft.sections, deletingSceneId);
        });
        const nextId = remainingIds[0] ?? null;
        setState({ selectedSceneId: nextId });
      }
    });

    init.container.querySelector<HTMLButtonElement>("[data-action='select-current']")?.addEventListener("click", () => {
      const currentScene = getScenePlayingAtTime(state.timeline?.sections ?? [], currentDemoTime);
      if (!currentScene) {
        return;
      }
      selectScene(currentScene.id);
    });

    init.container
      .querySelector<HTMLButtonElement>("[data-action='select-loop-current']")
      ?.addEventListener("click", () => {
        const currentScene = getScenePlayingAtTime(state.timeline?.sections ?? [], currentDemoTime);
        if (!currentScene) {
          return;
        }
        setState({ selectedSceneId: currentScene.id, loopEnabled: true });
      });
  };

  await loadFromFile();

  return {
    setVisible: (visible: boolean) => {
      editorVisible = visible;
      init.container.classList.toggle("hidden", !visible);
    },
    isVisible: () => editorVisible,
    updatePlayback: (demoTime: number, playing: boolean) => {
      currentDemoTime = demoTime;
      isPlaying = playing;
      if (playbackLabel) {
        playbackLabel.textContent = formatTime(demoTime);
      }
      if (previewPlaybackLabel) {
        previewPlaybackLabel.textContent = `${formatTime(demoTime)} / ${formatTime(init.getAudioDuration())}`;
      }
      if (playbackButton) {
        playbackButton.textContent = playing ? "Pause" : "Play";
        playbackButton.dataset.state = playing ? "playing" : "paused";
      }
      if (playheadElement) {
        const ratio = clamp((demoTime - playlistViewportStart) / Math.max(playlistViewportDuration, 0.001), 0, 1);
        playheadElement.style.left = `${ratio * 100}%`;
      }
    },
    updatePreview: (source: HTMLCanvasElement) => {
      if (!previewCanvas || !previewContext || !editorVisible) {
        return;
      }
      const { width, height } = previewCanvas;
      const sourceRatio = source.width / source.height;
      const targetRatio = width / height;
      let drawWidth = width;
      let drawHeight = height;
      if (sourceRatio > targetRatio) {
        drawHeight = width / sourceRatio;
      } else {
        drawWidth = height * sourceRatio;
      }
      const offsetX = (width - drawWidth) / 2;
      const offsetY = (height - drawHeight) / 2;
      previewContext.clearRect(0, 0, width, height);
      previewContext.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
    },
    getLoopState: () => {
      if (state.loopEnabled && state.loopRange) {
        return {
          enabled: true,
          start: state.loopRange.start,
          end: state.loopRange.end
        };
      }
      if (!state.loopEnabled || !state.selectedSceneId || !state.timeline) {
        return null;
      }
      const scene = getSceneById(state.selectedSceneId);
      if (!scene) {
        return null;
      }
      return {
        enabled: true,
        start: parseTimelineTimeValue(scene.start),
        end: getSceneEnd(scene)
      };
    }
  };
}
