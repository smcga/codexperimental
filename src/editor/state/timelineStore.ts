import { RawSectionConfig, RawSectionLayerConfig, RawTimelineConfig } from "../../config/loadConfig";

const DEFAULT_SCENE_EFFECT = "starfield";
const DEFAULT_LAYER_EFFECT = "plasma";

const DEFAULT_LAYER: RawSectionLayerConfig = {
  effect: DEFAULT_LAYER_EFFECT,
  opacity: 0.6,
  blend: "screen"
};

export function createScene(start: number, end: number, existingIds: Set<string>): RawSectionConfig {
  const id = createUniqueId("scene", existingIds);
  return {
    id,
    start,
    end,
    effect: DEFAULT_SCENE_EFFECT,
    era: "pcdemo",
    transition: {
      in: "fade",
      out: "fade",
      duration: 0.8
    },
    params: {},
    automation: [],
    layers: []
  };
}

export function duplicateScene(scene: RawSectionConfig, existingIds: Set<string>): RawSectionConfig {
  const id = createUniqueId(scene.id, existingIds);
  return {
    ...structuredClone(scene),
    id
  };
}

export function deleteScene(sections: RawSectionConfig[], id: string): RawSectionConfig[] {
  return sections.filter((section) => section.id !== id);
}

export function reorderScenes(sections: RawSectionConfig[], fromIndex: number, toIndex: number): RawSectionConfig[] {
  if (fromIndex === toIndex) {
    return sections;
  }
  const next = [...sections];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function addLayer(section: RawSectionConfig): RawSectionConfig {
  const layers = section.layers ? [...section.layers] : [];
  layers.push(structuredClone(DEFAULT_LAYER));
  return { ...section, layers };
}

export function removeLayer(section: RawSectionConfig, index: number): RawSectionConfig {
  const layers = section.layers ? [...section.layers] : [];
  layers.splice(index, 1);
  return { ...section, layers };
}

export function reorderLayers(section: RawSectionConfig, fromIndex: number, toIndex: number): RawSectionConfig {
  if (!section.layers || fromIndex === toIndex) {
    return section;
  }
  const layers = [...section.layers];
  const [moved] = layers.splice(fromIndex, 1);
  layers.splice(toIndex, 0, moved);
  return { ...section, layers };
}

export function parseAdvancedParamsJSON(
  value: string,
  previous: Record<string, number>
): { next: Record<string, number>; error: string | null } {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { next: previous, error: "Params must be a JSON object." };
    }
    return { next: parsed as Record<string, number>, error: null };
  } catch (error) {
    return { next: previous, error: "Invalid JSON." };
  }
}

export function serializeTimeline(timeline: RawTimelineConfig): RawTimelineConfig {
  return structuredClone(timeline);
}

export function getSceneIdSet(sections: RawSectionConfig[]): Set<string> {
  return new Set(sections.map((section) => section.id));
}

function createUniqueId(seed: string, existing: Set<string>): string {
  let base = seed.trim() || "scene";
  if (!existing.has(base)) {
    return base;
  }
  let counter = 1;
  while (existing.has(`${base}-${counter}`)) {
    counter += 1;
  }
  return `${base}-${counter}`;
}
