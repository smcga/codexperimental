import {
  RawParamAutomation,
  RawSectionConfig,
  RawSectionLayerConfig,
  RawTextCue,
  RawTimelineConfig
} from "../../config/loadConfig";

const DEFAULT_SCENE_DURATION = 10;
const DEFAULT_LAYER_OPACITY = 0.6;

export type ParamsParseResult = {
  nextParams: Record<string, number>;
  error: string | null;
};

export function createScene(options?: {
  id?: string;
  start?: number;
  end?: number;
  effect?: string;
  params?: Record<string, number | string>;
}): RawSectionConfig {
  const start = options?.start ?? 0;
  const end = options?.end ?? start + DEFAULT_SCENE_DURATION;
  return {
    id: options?.id ?? `scene-${Math.random().toString(36).slice(2, 8)}`,
    start,
    end,
    effect: options?.effect ?? "starfield",
    era: "pcdemo",
    transition: {
      in: "fade",
      out: "fade",
      duration: 0.8
    },
    params: options?.params ?? {},
    automation: [],
    layers: [],
    fitAlign: "fill"
  };
}

export function duplicateScene(scene: RawSectionConfig, nextId: string): RawSectionConfig {
  return {
    ...structuredClone(scene),
    id: nextId
  };
}

export function deleteScene(sections: RawSectionConfig[], id: string): RawSectionConfig[] {
  return sections.filter((section) => section.id !== id);
}

export function reorderScenes(
  sections: RawSectionConfig[],
  fromIndex: number,
  toIndex: number
): RawSectionConfig[] {
  if (fromIndex === toIndex) {
    return sections;
  }
  const next = [...sections];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function createLayer(effect = "starfield"): RawSectionLayerConfig {
  return {
    effect,
    opacity: DEFAULT_LAYER_OPACITY,
    blend: "screen",
    params: {},
    automation: [],
    fitAlign: "fill"
  };
}

export function addLayer(
  layers: RawSectionLayerConfig[],
  layer: RawSectionLayerConfig
): RawSectionLayerConfig[] {
  return [...layers, layer];
}

export function removeLayer(layers: RawSectionLayerConfig[], index: number): RawSectionLayerConfig[] {
  return layers.filter((_, currentIndex) => currentIndex !== index);
}

export function reorderLayers(
  layers: RawSectionLayerConfig[],
  fromIndex: number,
  toIndex: number
): RawSectionLayerConfig[] {
  if (fromIndex === toIndex) {
    return layers;
  }
  const next = [...layers];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function createAutomationEntry(overrides: Partial<RawParamAutomation> = {}): RawParamAutomation {
  return {
    param: "speed",
    from: 0,
    to: 1,
    t0: 0,
    t1: 1,
    ease: "linear",
    ...overrides
  };
}

export function createTextCue(options?: { id?: string; start?: number; end?: number }): RawTextCue {
  return {
    id: options?.id ?? `cue-${Math.random().toString(36).slice(2, 8)}`,
    start: options?.start ?? 0,
    end: options?.end ?? (options?.start ?? 0) + 3,
    text: "New cue",
    x: 0.5,
    y: 0.7,
    align: "center",
    size: 42,
    color: "#ffffff",
    units: "normalized",
    effects: {
      glitchIn: false,
      shadow: true,
      scanlineMask: 0
    }
  };
}

export function parseTimelineTimeValue(value: number | string | undefined | null): number {
  if (value === undefined || value === null) {
    return 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{2}):(\d{2})(?:\.(\d+))?$/);
    if (!match) {
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? numeric : 0;
    }
    const minutes = Number(match[1]);
    const seconds = Number(match[2] + (match[3] ? `.${match[3]}` : ""));
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds >= 60) {
      return 0;
    }
    return minutes * 60 + seconds;
  }
  return 0;
}

export function parseAdvancedParamsJSON(
  value: string,
  previous: Record<string, number>
): ParamsParseResult {
  if (!value.trim()) {
    return { nextParams: {}, error: null };
  }
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { nextParams: previous, error: "Params JSON must be an object." };
    }
    const nextParams: Record<string, number> = {};
    for (const [key, entry] of Object.entries(parsed)) {
      const isNumber = typeof entry === "number" && !Number.isNaN(entry);
      const isString = typeof entry === "string";
      const isBoolean = typeof entry === "boolean";
      const isNull = entry === null;
      if (!isNumber && !isString && !isBoolean && !isNull) {
        return { nextParams: previous, error: `Param ${key} must be a number, string, boolean, or null.` };
      }
      nextParams[key] = entry as unknown as number;
    }
    return { nextParams, error: null };
  } catch (error) {
    return { nextParams: previous, error: "Invalid JSON." };
  }
}

export function serializeTimeline(timeline: RawTimelineConfig): string {
  return JSON.stringify(timeline, null, 2);
}

export function ensureTimelineShape(raw: RawTimelineConfig): RawTimelineConfig {
  return {
    audio: raw.audio,
    intro: raw.intro,
    sections: raw.sections ?? [],
    textCues: raw.textCues ?? []
  };
}
