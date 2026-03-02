import {
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
  parseAdvancedParamsJSON,
  reorderLayers,
  reorderScenes
} from "./state/timelineStore";
import { clearTimelineDraft, downloadTimeline, loadTimelineDraft, saveTimelineDraft } from "./serialization";
import { getEffectDebugConfig } from "../renderer/debug/effectDebug";
import { EditorPreviewMode, getPreviewDrawRegion } from "./previewFraming";

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

const TRANSITION_TYPES: TransitionType[] = [
  "fade",
  "wipe",
  "slide-left",
  "slide-right",
  "slide-up",
  "slide-down",
  "iris",
  "flash"
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
  error: string | null;
  fieldErrors: Record<string, string>;
  previewMode: EditorPreviewMode;
};

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

export async function createEditorRoot(init: EditorInit): Promise<EditorController> {
  const state: EditorState = {
    timeline: null,
    originalTimeline: null,
    selectedSceneId: null,
    loopEnabled: false,
    error: null,
    fieldErrors: {},
    previewMode: "landscape"
  };
  let playbackLabel: HTMLSpanElement | null = null;
  let playbackButton: HTMLButtonElement | null = null;
  let previewCanvas: HTMLCanvasElement | null = null;
  let previewContext: CanvasRenderingContext2D | null = null;
  let editorVisible = false;

  const getEffectParamOptions = (effectName: string | null | undefined): string[] => {
    const config = getEffectDebugConfig(effectName ?? null);
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
      const response = await fetch("/timeline.json", { cache: "no-cache" });
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
    if (scene.end !== undefined && scene.end !== null) {
      return parseTimelineTimeValue(scene.end);
    }
    if (index >= 0 && index < scenes.length - 1) {
      return parseTimelineTimeValue(scenes[index + 1].start);
    }
    const audioDuration = init.getAudioDuration();
    const fallbackStart = parseTimelineTimeValue(scene.start);
    return audioDuration > 0 ? audioDuration : fallbackStart + 5;
  };

  const formatTime = (value: number): string => {
    const minutes = Math.floor(value / 60);
    const seconds = Math.max(0, value - minutes * 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
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

    init.container.innerHTML = `
      <div class="editor-header">
        <div class="editor-title">Scene + Timeline Editor</div>
        <div class="editor-actions">
          <button type="button" data-action="import">Import JSON</button>
          <button type="button" data-action="export">Export JSON</button>
          <button type="button" data-action="revert">Revert to file</button>
        </div>
      </div>
      ${state.error ? `<div class="editor-error" role="alert">${state.error}</div>` : ""}
      <div class="editor-body">
        <section class="editor-column editor-scenes">
          <div class="editor-section-title">Scenes</div>
          <div class="editor-scene-list" data-region="scene-list"></div>
          <button type="button" class="editor-add" data-action="add-scene">+ Scene</button>
        </section>
        <section class="editor-column editor-timeline">
          <div class="editor-section-title">Timeline</div>
          <div class="editor-preview">
            <canvas data-region="preview-canvas" width="640" height="360"></canvas>
          </div>
          <div class="editor-timeline-view" data-region="timeline-view"></div>
        </section>
        <section class="editor-column editor-inspector">
          <div class="editor-section-title">Inspector</div>
          <div class="editor-inspector-body" data-region="inspector"></div>
        </section>
      </div>
      <div class="editor-transport" data-region="transport">
        <div class="editor-transport-row">
          <button type="button" data-action="play-toggle">Play</button>
          <button type="button" data-action="jump-scene">Jump to scene</button>
          <label class="editor-toggle">
            <input type="checkbox" data-action="loop-toggle" ${state.loopEnabled ? "checked" : ""} />
            <span>Loop scene</span>
          </label>
          <label class="editor-toggle">
            <input type="checkbox" data-action="portrait-preview-toggle" ${state.previewMode === "portrait-mobile" ? "checked" : ""} />
            <span>Portrait mobile preview</span>
          </label>
          <span class="editor-timestamp" data-region="timestamp">00:00.0</span>
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
  };

  const renderSceneList = (): void => {
    const list = init.container.querySelector<HTMLDivElement>("[data-region='scene-list']");
    if (!list || !state.timeline) {
      return;
    }
    list.innerHTML = "";
    const sections = state.timeline.sections;
    let dragIndex: number | null = null;

    sections.forEach((scene, index) => {
      const item = document.createElement("div");
      item.className = "editor-scene-item";
      if (scene.id === state.selectedSceneId) {
        item.classList.add("is-selected");
      }
      item.draggable = true;
      item.dataset.index = String(index);
      item.innerHTML = `
        <button type="button" class="editor-scene-select">${scene.id}</button>
        <div class="editor-scene-meta">
          <span>${formatTime(parseTimelineTimeValue(scene.start))}</span>
          <span>→</span>
          <span>${formatTime(getSceneEnd(scene))}</span>
        </div>
        <div class="editor-scene-actions">
          <button type="button" data-action="duplicate">Duplicate</button>
          <button type="button" data-action="delete">Delete</button>
        </div>
      `;

      item.addEventListener("dragstart", () => {
        dragIndex = index;
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
      selectButton?.addEventListener("click", () => selectScene(scene.id));

      const duplicateButton = item.querySelector<HTMLButtonElement>("[data-action='duplicate']");
      duplicateButton?.addEventListener("click", () => {
        updateTimeline((draft) => {
          const duplicated = duplicateScene(scene, `scene-${Math.random().toString(36).slice(2, 8)}`);
          draft.sections.splice(index + 1, 0, duplicated);
        });
      });

      const deleteButton = item.querySelector<HTMLButtonElement>("[data-action='delete']");
      deleteButton?.addEventListener("click", () => {
        if (window.confirm("Delete this scene?")) {
          updateTimeline((draft) => {
            draft.sections = deleteScene(draft.sections, scene.id);
          });
          if (state.selectedSceneId === scene.id) {
            const nextId = state.timeline?.sections[0]?.id ?? null;
            setState({ selectedSceneId: nextId });
          }
        }
      });

      list.appendChild(item);
    });
  };

  const renderTimelineView = (): void => {
    const view = init.container.querySelector<HTMLDivElement>("[data-region='timeline-view']");
    if (!view || !state.timeline) {
      return;
    }
    const scenes = getScenesByTime();
    const duration = scenes.reduce((max, scene) => Math.max(max, getSceneEnd(scene)), 0);
    const ticks = Math.max(1, Math.ceil(duration / 10));

    view.innerHTML = `
      <div class="editor-ruler">
        ${Array.from({ length: ticks + 1 })
          .map((_, index) => {
            const time = Math.min(duration, index * 10);
            return `<span style="left:${duration ? (time / duration) * 100 : 0}%">${formatTime(time)}</span>`;
          })
          .join("")}
      </div>
      <div class="editor-blocks"></div>
    `;

    const blocks = view.querySelector<HTMLDivElement>(".editor-blocks");
    if (!blocks) {
      return;
    }

    scenes.forEach((scene) => {
      const start = parseTimelineTimeValue(scene.start);
      const end = getSceneEnd(scene);
      const left = duration ? (start / duration) * 100 : 0;
      const width = duration ? ((end - start) / duration) * 100 : 0;
      const block = document.createElement("button");
      block.type = "button";
      block.className = "editor-block";
      block.style.left = `${left}%`;
      block.style.width = `${Math.max(2, width)}%`;
      block.textContent = scene.id;
      block.title = `${scene.id} (${formatTime(start)} → ${formatTime(end)})`;
      if (scene.id === state.selectedSceneId) {
        block.classList.add("is-selected");
      }
      block.addEventListener("click", () => selectScene(scene.id));
      blocks.appendChild(block);
    });
  };

  const renderInspector = (): void => {
    const inspector = init.container.querySelector<HTMLDivElement>("[data-region='inspector']");
    if (!inspector || !state.timeline) {
      return;
    }
    if (!state.selectedSceneId) {
      inspector.innerHTML = `<div class="editor-empty">Select a scene to edit.</div>`;
      return;
    }
    const scene = getSceneById(state.selectedSceneId);
    if (!scene) {
      inspector.innerHTML = `<div class="editor-empty">Scene not found.</div>`;
      return;
    }

    inspector.dataset.sceneId = scene.id;
    inspector.innerHTML = `
      <div class="editor-group">
        <div class="editor-group-title">Basic</div>
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
          <input type="number" step="0.1" data-field="end" value="${formatEditableTime(scene.end, true)}" />
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
      <div class="editor-group">
        <div class="editor-group-title">Transition</div>
        <label>
          <span>In</span>
          <select data-field="transition-in">
            ${TRANSITION_TYPES.map((type) => `<option value="${type}" ${type === scene.transition?.in ? "selected" : ""}>${type}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Out</span>
          <select data-field="transition-out">
            ${TRANSITION_TYPES.map((type) => `<option value="${type}" ${type === scene.transition?.out ? "selected" : ""}>${type}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Duration (s)</span>
          <input type="number" step="0.1" data-field="transition-duration" value="${scene.transition?.duration ?? 0.8}" />
        </label>
      </div>
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

    bindInspectorInputs(scene, inspector);
    renderParamsEditor(
      scene.effect,
      scene.params ?? {},
      inspector.querySelector("[data-region='scene-params']"),
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
      inspector.querySelector("[data-region='scene-automation']"),
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
    renderLayers(scene, inspector.querySelector("[data-region='layers']"));
    renderTextCues(scene, inspector.querySelector("[data-region='text-cues']"));
  };

  const bindInspectorInputs = (scene: RawSectionConfig, inspector: HTMLElement): void => {
    const updateField = (field: string, value: string): void => {
      updateTimeline((draft) => {
        const target = draft.sections.find((section) => section.id === scene.id);
        if (!target) {
          return;
        }
        if (field === "start") {
          target.start = Number(value);
        } else if (field === "end") {
          target.end = value === "" ? undefined : Number(value);
        } else if (field === "id") {
          target.id = value;
          setState({ selectedSceneId: value });
        } else if (field === "effect") {
          target.effect = value;
        } else if (field === "era") {
          target.era = value as EraPreset;
        } else if (field === "transition-in") {
          target.transition = target.transition ?? { in: "fade", out: "fade", duration: 0.8 };
          target.transition.in = value as TransitionType;
        } else if (field === "transition-out") {
          target.transition = target.transition ?? { in: "fade", out: "fade", duration: 0.8 };
          target.transition.out = value as TransitionType;
        } else if (field === "transition-duration") {
          target.transition = target.transition ?? { in: "fade", out: "fade", duration: 0.8 };
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

    const addCueButton = inspector.querySelector<HTMLButtonElement>("[data-action='add-cue']");
    addCueButton?.addEventListener("click", () => {
      const start = parseTimelineTimeValue(scene.start);
      const end = Math.min(getSceneEnd(scene), start + 3);
      updateTimeline((draft) => {
        draft.textCues = [...(draft.textCues ?? []), createTextCue({ start, end })];
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
    const error = state.fieldErrors[errorKey];
    container.innerHTML = `
      <datalist id="${listId}">
        ${paramOptions.map((option) => `<option value="${option}"></option>`).join("")}
      </datalist>
      <div class="editor-param-list">
        ${Object.entries(params)
          .map(
            ([key, value]) => `
            <div class="editor-param-row">
              <input type="text" data-param-key list="${listId}" value="${key}" />
              <input type="number" step="0.1" data-param-value value="${value}" />
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
        <label>
          <span>Custom param</span>
          <input type="text" data-action="add-param-custom" placeholder="paramName" />
        </label>
        <button type="button" class="editor-add" data-action="add-param-custom-submit">+ Custom Param</button>
      </div>
      <label class="editor-advanced">
        <span>Advanced JSON</span>
        <textarea data-action="advanced-json" spellcheck="false">${JSON.stringify(params, null, 2)}</textarea>
      </label>
      ${error ? `<div class="editor-error-inline">${error}</div>` : ""}
    `;

    const rows = container.querySelectorAll<HTMLDivElement>(".editor-param-row");
    rows.forEach((row, index) => {
      const keyInput = row.querySelector<HTMLInputElement>("[data-param-key]");
      const valueInput = row.querySelector<HTMLInputElement>("[data-param-value]");
      const removeButton = row.querySelector<HTMLButtonElement>("[data-action='remove-param']");

      const updateParams = (): void => {
        const entries = Array.from(container.querySelectorAll<HTMLDivElement>(".editor-param-row")).map((item) => {
          const key = item.querySelector<HTMLInputElement>("[data-param-key]")?.value ?? "";
          const value = Number(item.querySelector<HTMLInputElement>("[data-param-value]")?.value ?? 0);
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
      valueInput?.addEventListener("change", updateParams);
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
      onChange({ ...params, [key]: 0 });
    });

    const customParamSubmit = container.querySelector<HTMLButtonElement>("[data-action='add-param-custom-submit']");
    customParamSubmit?.addEventListener("click", () => {
      const input = container.querySelector<HTMLInputElement>("[data-action='add-param-custom']");
      const key = input?.value.trim() ?? "";
      if (!key) {
        return;
      }
      input.value = "";
      onChange({ ...params, [key]: 0 });
    });

    const advanced = container.querySelector<HTMLTextAreaElement>("[data-action='advanced-json']");
    advanced?.addEventListener("change", () => {
      const result = parseAdvancedParamsJSON(advanced.value, params);
      if (result.error) {
        setState({ fieldErrors: { ...state.fieldErrors, [errorKey]: result.error } });
        return;
      }
      const nextErrors = { ...state.fieldErrors };
      delete nextErrors[errorKey];
      setState({ fieldErrors: nextErrors });
      onChange(result.nextParams);
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
              <button type="button" data-action="delete">Delete</button>
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
    });

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
          <button type="button" data-cue-action="delete" data-cue-id="${cue.id}">Delete cue</button>
        </div>
      `
      )
      .join("");

    container.querySelectorAll<HTMLDivElement>(".editor-cue").forEach((cueEl) => {
      const cueId = cueEl.dataset.cueId ?? "";
      cueEl.querySelectorAll<HTMLInputElement>("[data-cue-field]").forEach((input) => {
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
    playbackButton = transport.querySelector<HTMLButtonElement>("[data-action='play-toggle']");

    playbackButton?.addEventListener("click", async () => {
      if (playbackButton?.dataset.state === "playing") {
        init.pause();
      } else {
        await init.play();
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
      const offset = init.getAudioOffset();
      init.seek(Math.max(0, Number(scene.start) - offset));
    });

    transport
      .querySelector<HTMLInputElement>("[data-action='loop-toggle']")
      ?.addEventListener("change", (event) => {
        const target = event.target as HTMLInputElement;
        setState({ loopEnabled: target.checked });
      });

    transport
      .querySelector<HTMLInputElement>("[data-action='portrait-preview-toggle']")
      ?.addEventListener("change", (event) => {
        const target = event.target as HTMLInputElement;
        setState({ previewMode: target.checked ? "portrait-mobile" : "landscape" });
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
        downloadTimeline(state.timeline, "timeline.json");
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
      const maxEnd =
        state.timeline?.sections.reduce((max, section) => {
          const start = parseTimelineTimeValue(section.start);
          const end = section.end ?? start + 5;
          return Math.max(max, parseTimelineTimeValue(end));
        }, 0) ?? 0;
      const newScene = createScene({
        start: maxEnd,
        end: maxEnd + 10,
        effect: init.effectNames[0] ?? "starfield"
      });
      updateTimeline(
        (draft) => {
          draft.sections = [...draft.sections, newScene];
        },
        { selectedSceneId: newScene.id }
      );
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
      if (playbackLabel) {
        playbackLabel.textContent = formatTime(demoTime);
      }
      if (playbackButton) {
        playbackButton.textContent = playing ? "Pause" : "Play";
        playbackButton.dataset.state = playing ? "playing" : "paused";
      }
    },
    updatePreview: (source: HTMLCanvasElement) => {
      if (!previewCanvas || !previewContext || !editorVisible) {
        return;
      }
      const { width, height } = previewCanvas;
      const drawRegion = getPreviewDrawRegion(source.width, source.height, width, height, state.previewMode);
      previewContext.clearRect(0, 0, width, height);
      previewContext.drawImage(
        source,
        drawRegion.sourceX,
        drawRegion.sourceY,
        drawRegion.sourceWidth,
        drawRegion.sourceHeight,
        drawRegion.destX,
        drawRegion.destY,
        drawRegion.destWidth,
        drawRegion.destHeight
      );
    },
    getLoopState: () => {
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
