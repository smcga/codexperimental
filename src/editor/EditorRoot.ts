import {
  BlendMode,
  EraPreset,
  RawSectionConfig,
  RawSectionLayerConfig,
  RawTextCue,
  RawTimelineConfig,
  TransitionType
} from "../config/loadConfig";
import { EaseName } from "../timeline/automation";
import {
  addLayer,
  createScene,
  deleteScene,
  duplicateScene,
  getSceneIdSet,
  parseAdvancedParamsJSON,
  reorderLayers,
  reorderScenes
} from "./state/timelineStore";
import { downloadTimeline, importTimelineFile, saveDraft } from "./serialization";

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

const EASE_NAMES: EaseName[] = [
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

export type EditorApplyResult = { ok: boolean; error?: string };

export type EditorCallbacks = {
  applyTimeline: (timeline: RawTimelineConfig) => EditorApplyResult;
  onSeek: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onLoopChange: (range: { start: number; end: number } | null) => void;
  getIsPlaying: () => boolean;
};

export function createEditorRoot(options: {
  root: HTMLElement;
  timeline: RawTimelineConfig;
  effects: string[];
  onRevert: () => Promise<RawTimelineConfig>;
  callbacks: EditorCallbacks;
}): { setVisible: (visible: boolean) => void } {
  const { root, effects, onRevert, callbacks } = options;
  let timeline: RawTimelineConfig = normalizeTimeline(options.timeline);
  let selectedSceneId = timeline.sections[0]?.id ?? null;
  let loopEnabled = false;
  let editorError: string | null = null;
  const paramErrors = new Map<string, string>();
  const dragState: { id: string | null } = { id: null };

  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = "application/json";
  importInput.classList.add("editor-file-input");

  function setVisible(visible: boolean): void {
    root.classList.toggle("hidden", !visible);
  }

  function normalizeTimeline(raw: RawTimelineConfig): RawTimelineConfig {
    return {
      ...raw,
      sections: raw.sections ?? [],
      textCues: raw.textCues ?? []
    };
  }

  function getSelectedScene(): RawSectionConfig | null {
    if (!selectedSceneId) {
      return null;
    }
    return timeline.sections.find((section) => section.id === selectedSceneId) ?? null;
  }

  function updateTimeline(next: RawTimelineConfig): void {
    timeline = normalizeTimeline(next);
    saveDraft(timeline);
    const result = callbacks.applyTimeline(timeline);
    editorError = result.ok ? null : result.error ?? "Unable to apply timeline.";
    render();
  }

  function updateScene(sceneId: string, updater: (scene: RawSectionConfig) => RawSectionConfig): void {
    const sections = timeline.sections.map((section) =>
      section.id === sceneId ? updater(section) : section
    );
    updateTimeline({ ...timeline, sections });
  }

  function updateLayer(sceneId: string, index: number, updater: (layer: RawSectionLayerConfig) => RawSectionLayerConfig): void {
    updateScene(sceneId, (scene) => {
      const layers = scene.layers ? [...scene.layers] : [];
      const layer = layers[index];
      if (!layer) {
        return scene;
      }
      layers[index] = updater(layer);
      return { ...scene, layers };
    });
  }

  function updateTextCue(cueId: string, updater: (cue: RawTextCue) => RawTextCue): void {
    const textCues = timeline.textCues ?? [];
    const nextCues = textCues.map((cue) => (cue.id === cueId ? updater(cue) : cue));
    updateTimeline({ ...timeline, textCues: nextCues });
  }

  function createCue(scene: RawSectionConfig): RawTextCue {
    const id = `cue-${scene.id}-${Date.now()}`;
    return {
      id,
      start: scene.start,
      end: scene.end ?? scene.start + 4,
      text: "New cue",
      x: 0.5,
      y: 0.7,
      align: "center",
      size: 42,
      color: "#ffffff"
    };
  }

  function render(): void {
    const selectedScene = getSelectedScene();
    const sections = timeline.sections;
    const totalDuration = Math.max(
      1,
      ...sections.map((section, index) => {
        const end = getSceneEnd(section, index);
        return end ?? section.start + 1;
      })
    );

    root.innerHTML = `
      <div class="editor-toolbar">
        <div class="editor-toolbar-group">
          <span class="editor-title">Scene + Timeline Editor</span>
          <button type="button" class="editor-btn" data-action="revert">Revert to file</button>
        </div>
        <div class="editor-toolbar-group">
          <button type="button" class="editor-btn" data-action="import">Import JSON</button>
          <button type="button" class="editor-btn" data-action="export">Export JSON</button>
        </div>
      </div>
      <div class="editor-body">
        <div class="editor-column editor-scene-list">
          <div class="editor-column-header">
            <span>Scenes</span>
            <button type="button" class="editor-btn" data-action="add-scene">+ Scene</button>
          </div>
          <div class="editor-scene-items">
            ${sections
              .map((section, index) => {
                const isActive = section.id === selectedSceneId;
                return `
                  <div class="editor-scene-item ${isActive ? "active" : ""}" draggable="true" data-scene-id="${section.id}">
                    <button type="button" class="editor-scene-select" data-action="select-scene" data-scene-id="${section.id}">
                      <span class="editor-scene-name">${section.id}</span>
                      <span class="editor-scene-range">${formatTime(section.start)} → ${formatTime(
                  getSceneEnd(section, index) ?? section.start
                )}</span>
                    </button>
                    <div class="editor-scene-actions">
                      <button type="button" class="editor-icon-btn" data-action="duplicate-scene" data-scene-id="${section.id}">⎘</button>
                      <button type="button" class="editor-icon-btn" data-action="delete-scene" data-scene-id="${section.id}">✕</button>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
        <div class="editor-column editor-timeline">
          <div class="editor-column-header">
            <span>Timeline</span>
          </div>
          <div class="editor-timeline-ruler">
            ${renderRuler(totalDuration)}
          </div>
          <div class="editor-timeline-track">
            ${sections
              .map((section, index) => {
                const end = getSceneEnd(section, index) ?? section.start + 1;
                const width = ((end - section.start) / totalDuration) * 100;
                const left = (section.start / totalDuration) * 100;
                return `
                  <button type="button" class="editor-scene-block ${section.id === selectedSceneId ? "active" : ""}" style="left:${left}%; width:${Math.max(
                    width,
                    2
                  )}%" data-action="select-scene" data-scene-id="${section.id}">
                    ${section.id}
                  </button>
                `;
              })
              .join("")}
          </div>
        </div>
        <div class="editor-column editor-inspector">
          <div class="editor-column-header">
            <span>Inspector</span>
          </div>
          ${selectedScene ? renderInspector(selectedScene) : "<p class=\"editor-muted\">Select a scene to edit.</p>"}
        </div>
      </div>
      <div class="editor-transport">
        <button type="button" class="editor-btn" data-action="toggle-play">${
          callbacks.getIsPlaying() ? "Pause" : "Play"
        }</button>
        <button type="button" class="editor-btn" data-action="jump-scene" ${
          selectedScene ? "" : "disabled"
        }>Jump to scene start</button>
        <button type="button" class="editor-btn" data-action="toggle-loop" ${
          selectedScene ? "" : "disabled"
        }>${loopEnabled ? "Looping" : "Loop"}</button>
        <span class="editor-status ${editorError ? "error" : ""}">${
          editorError ?? "Changes apply live."}
        </span>
      </div>
    `;

    root.querySelector(".editor-toolbar")?.appendChild(importInput);

    bindActions();
  }

  function renderInspector(scene: RawSectionConfig): string {
    const layers = scene.layers ?? [];
    const cues = (timeline.textCues ?? []).filter((cue) => {
      const end = cue.end ?? cue.start + 3;
      const sceneEnd = scene.end ?? Number.POSITIVE_INFINITY;
      return cue.start >= scene.start && end <= sceneEnd;
    });
    return `
      <div class="editor-section">
        <div class="editor-section-title">Basic</div>
        <label class="editor-field">
          <span>ID</span>
          <input type="text" value="${scene.id}" data-action="update-scene-id" data-scene-id="${scene.id}" />
        </label>
        <label class="editor-field">
          <span>Effect</span>
          <select data-action="update-scene-effect" data-scene-id="${scene.id}">
            ${effects
              .map((effect) => `<option value="${effect}" ${effect === scene.effect ? "selected" : ""}>${effect}</option>`)
              .join("")}
          </select>
        </label>
        <label class="editor-field">
          <span>Start</span>
          <input type="number" step="0.1" value="${scene.start}" data-action="update-scene-start" data-scene-id="${scene.id}" />
        </label>
        <label class="editor-field">
          <span>End</span>
          <input type="number" step="0.1" value="${scene.end ?? scene.start + 4}" data-action="update-scene-end" data-scene-id="${scene.id}" />
        </label>
        <label class="editor-field">
          <span>Era</span>
          <select data-action="update-scene-era" data-scene-id="${scene.id}">
            ${ERA_PRESETS.map(
              (preset) => `<option value="${preset}" ${preset === scene.era ? "selected" : ""}>${preset}</option>`
            ).join("")}
          </select>
        </label>
      </div>
      <div class="editor-section">
        <div class="editor-section-title">Transition</div>
        <label class="editor-field">
          <span>In</span>
          <select data-action="update-transition-in" data-scene-id="${scene.id}">
            ${TRANSITION_TYPES.map(
              (type) => `<option value="${type}" ${type === scene.transition?.in ? "selected" : ""}>${type}</option>`
            ).join("")}
          </select>
        </label>
        <label class="editor-field">
          <span>Out</span>
          <select data-action="update-transition-out" data-scene-id="${scene.id}">
            ${TRANSITION_TYPES.map(
              (type) => `<option value="${type}" ${type === scene.transition?.out ? "selected" : ""}>${type}</option>`
            ).join("")}
          </select>
        </label>
        <label class="editor-field">
          <span>Duration</span>
          <input type="number" step="0.1" value="${scene.transition?.duration ?? 0.8}" data-action="update-transition-duration" data-scene-id="${scene.id}" />
        </label>
      </div>
      <div class="editor-section">
        <div class="editor-section-title">Scene Params</div>
        ${renderParamsEditor(scene.params ?? {}, `scene:${scene.id}`)}
      </div>
      <div class="editor-section">
        <div class="editor-section-title">Scene Automation</div>
        ${renderAutomationEditor(scene.automation ?? [], `scene:${scene.id}`)}
      </div>
      <div class="editor-section">
        <div class="editor-section-title">Layers</div>
        <button type="button" class="editor-btn" data-action="add-layer" data-scene-id="${scene.id}">+ Layer</button>
        ${layers
          .map((layer, index) => {
            return `
              <div class="editor-layer" data-layer-index="${index}" data-scene-id="${scene.id}">
                <div class="editor-layer-header">
                  <span>Layer ${index + 1}</span>
                  <div class="editor-layer-actions">
                    <button type="button" class="editor-icon-btn" data-action="move-layer-up" data-scene-id="${scene.id}" data-layer-index="${index}">↑</button>
                    <button type="button" class="editor-icon-btn" data-action="move-layer-down" data-scene-id="${scene.id}" data-layer-index="${index}">↓</button>
                    <button type="button" class="editor-icon-btn" data-action="remove-layer" data-scene-id="${scene.id}" data-layer-index="${index}">✕</button>
                  </div>
                </div>
                <label class="editor-field">
                  <span>Effect</span>
                  <select data-action="update-layer-effect" data-scene-id="${scene.id}" data-layer-index="${index}">
                    ${effects
                      .map(
                        (effect) =>
                          `<option value="${effect}" ${effect === layer.effect ? "selected" : ""}>${effect}</option>`
                      )
                      .join("")}
                  </select>
                </label>
                <label class="editor-field">
                  <span>Opacity</span>
                  <input type="number" step="0.05" min="0" max="1" value="${layer.opacity ?? 0.6}" data-action="update-layer-opacity" data-scene-id="${scene.id}" data-layer-index="${index}" />
                </label>
                <label class="editor-field">
                  <span>Blend</span>
                  <select data-action="update-layer-blend" data-scene-id="${scene.id}" data-layer-index="${index}">
                    ${BLEND_MODES.map(
                      (mode) => `<option value="${mode}" ${mode === layer.blend ? "selected" : ""}>${mode}</option>`
                    ).join("")}
                  </select>
                </label>
                <div class="editor-subsection">
                  <div class="editor-subsection-title">Params</div>
                  ${renderParamsEditor(layer.params ?? {}, `layer:${scene.id}:${index}`)}
                </div>
                <div class="editor-subsection">
                  <div class="editor-subsection-title">Automation</div>
                  ${renderAutomationEditor(layer.automation ?? [], `layer:${scene.id}:${index}`)}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
      <div class="editor-section">
        <div class="editor-section-title">Text Cues</div>
        <button type="button" class="editor-btn" data-action="add-cue" data-scene-id="${scene.id}">+ Cue</button>
        ${cues
          .map(
            (cue) => `
              <div class="editor-layer" data-cue-id="${cue.id}">
                <div class="editor-layer-header">
                  <span>${cue.id}</span>
                  <button type="button" class="editor-icon-btn" data-action="delete-cue" data-cue-id="${cue.id}">✕</button>
                </div>
                <label class="editor-field">
                  <span>Text</span>
                  <input type="text" value="${cue.text ?? ""}" data-action="update-cue-text" data-cue-id="${cue.id}" />
                </label>
                <label class="editor-field">
                  <span>Start</span>
                  <input type="number" step="0.1" value="${cue.start}" data-action="update-cue-start" data-cue-id="${cue.id}" />
                </label>
                <label class="editor-field">
                  <span>End</span>
                  <input type="number" step="0.1" value="${cue.end ?? cue.start + 3}" data-action="update-cue-end" data-cue-id="${cue.id}" />
                </label>
                <label class="editor-field">
                  <span>Align</span>
                  <select data-action="update-cue-align" data-cue-id="${cue.id}">
                    ${["left", "center", "right"].map(
                      (align) => `<option value="${align}" ${cue.align === align ? "selected" : ""}>${align}</option>`
                    )}
                  </select>
                </label>
                <label class="editor-field">
                  <span>Size</span>
                  <input type="number" step="1" value="${cue.size ?? 42}" data-action="update-cue-size" data-cue-id="${cue.id}" />
                </label>
                <label class="editor-field">
                  <span>Color</span>
                  <input type="text" value="${cue.color ?? "#ffffff"}" data-action="update-cue-color" data-cue-id="${cue.id}" />
                </label>
              </div>
            `
          )
          .join("")}
      </div>
    `;
  }

  function renderParamsEditor(params: Record<string, number>, ownerKey: string): string {
    const entries = Object.entries(params);
    const jsonValue = JSON.stringify(params, null, 2);
    const error = paramErrors.get(ownerKey);
    return `
      <div class="editor-param-list">
        ${entries
          .map(
            ([key, value]) => `
              <div class="editor-param-row">
                <input type="text" value="${key}" data-action="update-param-key" data-owner-key="${ownerKey}" data-param-key="${key}" />
                <input type="number" step="0.1" value="${value}" data-action="update-param-value" data-owner-key="${ownerKey}" data-param-key="${key}" />
                <button type="button" class="editor-icon-btn" data-action="delete-param" data-owner-key="${ownerKey}" data-param-key="${key}">✕</button>
              </div>
            `
          )
          .join("")}
        <button type="button" class="editor-btn" data-action="add-param" data-owner-key="${ownerKey}">+ Param</button>
      </div>
      <div class="editor-json-editor">
        <textarea data-action="update-param-json" data-owner-key="${ownerKey}">${jsonValue}</textarea>
        ${error ? `<div class="editor-error">${error}</div>` : ""}
      </div>
    `;
  }

  function renderAutomationEditor(automation: RawSectionConfig["automation"], ownerKey: string): string {
    return `
      <div class="editor-automation-list">
        ${automation
          .map(
            (entry, index) => `
              <div class="editor-automation-row">
                <input type="text" value="${entry.param}" placeholder="param" data-action="update-automation-param" data-owner-key="${ownerKey}" data-automation-index="${index}" />
                <input type="number" step="0.1" value="${entry.from}" data-action="update-automation-from" data-owner-key="${ownerKey}" data-automation-index="${index}" />
                <input type="number" step="0.1" value="${entry.to}" data-action="update-automation-to" data-owner-key="${ownerKey}" data-automation-index="${index}" />
                <input type="number" step="0.1" value="${entry.t0}" data-action="update-automation-t0" data-owner-key="${ownerKey}" data-automation-index="${index}" />
                <input type="number" step="0.1" value="${entry.t1}" data-action="update-automation-t1" data-owner-key="${ownerKey}" data-automation-index="${index}" />
                <select data-action="update-automation-ease" data-owner-key="${ownerKey}" data-automation-index="${index}">
                  <option value="">linear</option>
                  ${EASE_NAMES.map(
                    (ease) => `<option value="${ease}" ${entry.ease === ease ? "selected" : ""}>${ease}</option>`
                  ).join("")}
                </select>
                <button type="button" class="editor-icon-btn" data-action="delete-automation" data-owner-key="${ownerKey}" data-automation-index="${index}">✕</button>
              </div>
            `
          )
          .join("")}
        <button type="button" class="editor-btn" data-action="add-automation" data-owner-key="${ownerKey}">+ Automation</button>
      </div>
    `;
  }

  function bindActions(): void {
    root.querySelectorAll<HTMLElement>("[data-action]").forEach((element) => {
      const action = element.dataset.action;
      if (!action) {
        return;
      }
      element.addEventListener("click", (event) => {
        const target = event.currentTarget as HTMLElement;
        handleAction(action, target);
      });
      if (element.tagName === "INPUT" || element.tagName === "SELECT" || element.tagName === "TEXTAREA") {
        element.addEventListener("change", (event) => {
          const target = event.currentTarget as HTMLElement;
          handleAction(action, target);
        });
      }
    });

    root.querySelectorAll<HTMLElement>(".editor-scene-item").forEach((item) => {
      item.addEventListener("dragstart", (event) => {
        const id = (event.currentTarget as HTMLElement).dataset.sceneId ?? null;
        dragState.id = id;
        event.dataTransfer?.setData("text/plain", id ?? "");
      });
      item.addEventListener("dragover", (event) => {
        event.preventDefault();
      });
      item.addEventListener("drop", (event) => {
        event.preventDefault();
        const targetId = (event.currentTarget as HTMLElement).dataset.sceneId;
        if (!dragState.id || !targetId || dragState.id === targetId) {
          return;
        }
        const fromIndex = timeline.sections.findIndex((section) => section.id === dragState.id);
        const toIndex = timeline.sections.findIndex((section) => section.id === targetId);
        if (fromIndex < 0 || toIndex < 0) {
          return;
        }
        updateTimeline({
          ...timeline,
          sections: reorderScenes(timeline.sections, fromIndex, toIndex)
        });
        dragState.id = null;
      });
    });
  }

  function handleAction(action: string, target: HTMLElement): void {
    switch (action) {
      case "add-scene": {
        const ids = getSceneIdSet(timeline.sections);
        const last = timeline.sections[timeline.sections.length - 1];
        const start = last ? getSceneEnd(last, timeline.sections.length - 1) ?? last.start + 8 : 0;
        const end = start + 8;
        const newScene = createScene(start, end, ids);
        updateTimeline({ ...timeline, sections: [...timeline.sections, newScene] });
        selectedSceneId = newScene.id;
        return;
      }
      case "select-scene": {
        selectedSceneId = target.dataset.sceneId ?? null;
        if (loopEnabled) {
          const scene = getSelectedScene();
          if (scene) {
            callbacks.onLoopChange({ start: scene.start, end: scene.end ?? scene.start + 1 });
          }
        }
        render();
        return;
      }
      case "duplicate-scene": {
        const sceneId = target.dataset.sceneId;
        const scene = timeline.sections.find((section) => section.id === sceneId);
        if (!scene) {
          return;
        }
        const ids = getSceneIdSet(timeline.sections);
        const clone = duplicateScene(scene, ids);
        updateTimeline({ ...timeline, sections: [...timeline.sections, clone] });
        return;
      }
      case "delete-scene": {
        const sceneId = target.dataset.sceneId;
        if (!sceneId) {
          return;
        }
        if (!window.confirm("Delete this scene?")) {
          return;
        }
        const sections = deleteScene(timeline.sections, sceneId);
        const nextSelected = sections[0]?.id ?? null;
        selectedSceneId = nextSelected;
        updateTimeline({ ...timeline, sections });
        return;
      }
      case "update-scene-id": {
        const sceneId = target.dataset.sceneId;
        if (!sceneId || !(target instanceof HTMLInputElement)) {
          return;
        }
        const nextId = target.value.trim();
        if (!nextId) {
          target.value = sceneId;
          return;
        }
        if (timeline.sections.some((section) => section.id === nextId && section.id !== sceneId)) {
          target.value = sceneId;
          editorError = "Scene IDs must be unique.";
          render();
          return;
        }
        updateScene(sceneId, (scene) => ({ ...scene, id: nextId }));
        selectedSceneId = nextId;
        return;
      }
      case "update-scene-effect": {
        const sceneId = target.dataset.sceneId;
        if (!sceneId || !(target instanceof HTMLSelectElement)) {
          return;
        }
        updateScene(sceneId, (scene) => ({ ...scene, effect: target.value }));
        return;
      }
      case "update-scene-start": {
        const sceneId = target.dataset.sceneId;
        if (!sceneId || !(target instanceof HTMLInputElement)) {
          return;
        }
        const start = Number(target.value);
        updateScene(sceneId, (scene) => ({ ...scene, start }));
        if (loopEnabled && selectedSceneId === sceneId) {
          const scene = getSelectedScene();
          if (scene) {
            callbacks.onLoopChange({ start: scene.start, end: scene.end ?? scene.start + 1 });
          }
        }
        return;
      }
      case "update-scene-end": {
        const sceneId = target.dataset.sceneId;
        if (!sceneId || !(target instanceof HTMLInputElement)) {
          return;
        }
        const end = Number(target.value);
        updateScene(sceneId, (scene) => ({ ...scene, end }));
        if (loopEnabled && selectedSceneId === sceneId) {
          const scene = getSelectedScene();
          if (scene) {
            callbacks.onLoopChange({ start: scene.start, end: scene.end ?? scene.start + 1 });
          }
        }
        return;
      }
      case "update-scene-era": {
        const sceneId = target.dataset.sceneId;
        if (!sceneId || !(target instanceof HTMLSelectElement)) {
          return;
        }
        updateScene(sceneId, (scene) => ({ ...scene, era: target.value as EraPreset }));
        return;
      }
      case "update-transition-in": {
        const sceneId = target.dataset.sceneId;
        if (!sceneId || !(target instanceof HTMLSelectElement)) {
          return;
        }
        updateScene(sceneId, (scene) => ({
          ...scene,
          transition: {
            ...scene.transition,
            in: target.value as TransitionType
          }
        }));
        return;
      }
      case "update-transition-out": {
        const sceneId = target.dataset.sceneId;
        if (!sceneId || !(target instanceof HTMLSelectElement)) {
          return;
        }
        updateScene(sceneId, (scene) => ({
          ...scene,
          transition: {
            ...scene.transition,
            out: target.value as TransitionType
          }
        }));
        return;
      }
      case "update-transition-duration": {
        const sceneId = target.dataset.sceneId;
        if (!sceneId || !(target instanceof HTMLInputElement)) {
          return;
        }
        const duration = Number(target.value);
        updateScene(sceneId, (scene) => ({
          ...scene,
          transition: {
            ...scene.transition,
            duration
          }
        }));
        return;
      }
      case "add-layer": {
        const sceneId = target.dataset.sceneId;
        if (!sceneId) {
          return;
        }
        updateScene(sceneId, (scene) => addLayer(scene));
        return;
      }
      case "remove-layer": {
        const sceneId = target.dataset.sceneId;
        const index = Number(target.dataset.layerIndex);
        if (!sceneId || Number.isNaN(index)) {
          return;
        }
        updateScene(sceneId, (scene) => removeLayerWithIndex(scene, index));
        return;
      }
      case "move-layer-up": {
        const sceneId = target.dataset.sceneId;
        const index = Number(target.dataset.layerIndex);
        if (!sceneId || Number.isNaN(index)) {
          return;
        }
        updateScene(sceneId, (scene) => reorderLayers(scene, index, Math.max(0, index - 1)));
        return;
      }
      case "move-layer-down": {
        const sceneId = target.dataset.sceneId;
        const index = Number(target.dataset.layerIndex);
        if (!sceneId || Number.isNaN(index)) {
          return;
        }
        updateScene(sceneId, (scene) => reorderLayers(scene, index, Math.min((scene.layers?.length ?? 1) - 1, index + 1)));
        return;
      }
      case "update-layer-effect": {
        const sceneId = target.dataset.sceneId;
        const index = Number(target.dataset.layerIndex);
        if (!sceneId || Number.isNaN(index) || !(target instanceof HTMLSelectElement)) {
          return;
        }
        updateLayer(sceneId, index, (layer) => ({ ...layer, effect: target.value }));
        return;
      }
      case "update-layer-opacity": {
        const sceneId = target.dataset.sceneId;
        const index = Number(target.dataset.layerIndex);
        if (!sceneId || Number.isNaN(index) || !(target instanceof HTMLInputElement)) {
          return;
        }
        updateLayer(sceneId, index, (layer) => ({ ...layer, opacity: Number(target.value) }));
        return;
      }
      case "update-layer-blend": {
        const sceneId = target.dataset.sceneId;
        const index = Number(target.dataset.layerIndex);
        if (!sceneId || Number.isNaN(index) || !(target instanceof HTMLSelectElement)) {
          return;
        }
        updateLayer(sceneId, index, (layer) => ({ ...layer, blend: target.value as BlendMode }));
        return;
      }
      case "add-param": {
        const ownerKey = target.dataset.ownerKey;
        if (!ownerKey) {
          return;
        }
        const { params, setParams } = resolveParams(ownerKey);
        const newKey = createParamKey(params);
        const next = { ...params, [newKey]: 0 };
        setParams(next);
        return;
      }
      case "delete-param": {
        const ownerKey = target.dataset.ownerKey;
        const paramKey = target.dataset.paramKey;
        if (!ownerKey || !paramKey) {
          return;
        }
        const { params, setParams } = resolveParams(ownerKey);
        const next = { ...params };
        delete next[paramKey];
        setParams(next);
        return;
      }
      case "update-param-key": {
        if (!(target instanceof HTMLInputElement)) {
          return;
        }
        const ownerKey = target.dataset.ownerKey;
        const paramKey = target.dataset.paramKey;
        if (!ownerKey || !paramKey) {
          return;
        }
        const nextKey = target.value.trim();
        if (!nextKey) {
          target.value = paramKey;
          return;
        }
        const { params, setParams } = resolveParams(ownerKey);
        if (nextKey !== paramKey && params[nextKey] !== undefined) {
          target.value = paramKey;
          return;
        }
        const next = { ...params };
        const value = next[paramKey];
        delete next[paramKey];
        next[nextKey] = value;
        setParams(next);
        return;
      }
      case "update-param-value": {
        if (!(target instanceof HTMLInputElement)) {
          return;
        }
        const ownerKey = target.dataset.ownerKey;
        const paramKey = target.dataset.paramKey;
        if (!ownerKey || !paramKey) {
          return;
        }
        const { params, setParams } = resolveParams(ownerKey);
        setParams({ ...params, [paramKey]: Number(target.value) });
        return;
      }
      case "update-param-json": {
        if (!(target instanceof HTMLTextAreaElement)) {
          return;
        }
        const ownerKey = target.dataset.ownerKey;
        if (!ownerKey) {
          return;
        }
        const { params, setParams } = resolveParams(ownerKey);
        const result = parseAdvancedParamsJSON(target.value, params);
        if (result.error) {
          paramErrors.set(ownerKey, result.error);
        } else {
          paramErrors.delete(ownerKey);
          setParams(result.next);
        }
        render();
        return;
      }
      case "add-automation": {
        const ownerKey = target.dataset.ownerKey;
        if (!ownerKey) {
          return;
        }
        const { automation, setAutomation } = resolveAutomation(ownerKey);
        const next = [
          ...automation,
          {
            param: "",
            from: 0,
            to: 1,
            t0: 0,
            t1: 1,
            ease: "linear" as EaseName
          }
        ];
        setAutomation(next);
        return;
      }
      case "delete-automation": {
        const ownerKey = target.dataset.ownerKey;
        const index = Number(target.dataset.automationIndex);
        if (!ownerKey || Number.isNaN(index)) {
          return;
        }
        const { automation, setAutomation } = resolveAutomation(ownerKey);
        const next = [...automation];
        next.splice(index, 1);
        setAutomation(next);
        return;
      }
      case "update-automation-param":
      case "update-automation-from":
      case "update-automation-to":
      case "update-automation-t0":
      case "update-automation-t1":
      case "update-automation-ease": {
        const ownerKey = target.dataset.ownerKey;
        const index = Number(target.dataset.automationIndex);
        if (!ownerKey || Number.isNaN(index)) {
          return;
        }
        const { automation, setAutomation } = resolveAutomation(ownerKey);
        const next = automation.map((entry, idx) => {
          if (idx !== index) {
            return entry;
          }
          if (action === "update-automation-param" && target instanceof HTMLInputElement) {
            return { ...entry, param: target.value };
          }
          if (action === "update-automation-from" && target instanceof HTMLInputElement) {
            return { ...entry, from: Number(target.value) };
          }
          if (action === "update-automation-to" && target instanceof HTMLInputElement) {
            return { ...entry, to: Number(target.value) };
          }
          if (action === "update-automation-t0" && target instanceof HTMLInputElement) {
            return { ...entry, t0: Number(target.value) };
          }
          if (action === "update-automation-t1" && target instanceof HTMLInputElement) {
            return { ...entry, t1: Number(target.value) };
          }
          if (action === "update-automation-ease" && target instanceof HTMLSelectElement) {
            return { ...entry, ease: (target.value as EaseName) || undefined };
          }
          return entry;
        });
        setAutomation(next);
        return;
      }
      case "add-cue": {
        const sceneId = target.dataset.sceneId;
        const scene = timeline.sections.find((section) => section.id === sceneId);
        if (!scene) {
          return;
        }
        const cue = createCue(scene);
        const next = [...(timeline.textCues ?? []), cue];
        updateTimeline({ ...timeline, textCues: next });
        return;
      }
      case "delete-cue": {
        const cueId = target.dataset.cueId;
        if (!cueId) {
          return;
        }
        const next = (timeline.textCues ?? []).filter((cue) => cue.id !== cueId);
        updateTimeline({ ...timeline, textCues: next });
        return;
      }
      case "update-cue-text": {
        if (!(target instanceof HTMLInputElement)) {
          return;
        }
        const cueId = target.dataset.cueId;
        if (!cueId) {
          return;
        }
        updateTextCue(cueId, (cue) => ({ ...cue, text: target.value }));
        return;
      }
      case "update-cue-start": {
        if (!(target instanceof HTMLInputElement)) {
          return;
        }
        const cueId = target.dataset.cueId;
        if (!cueId) {
          return;
        }
        updateTextCue(cueId, (cue) => ({ ...cue, start: Number(target.value) }));
        return;
      }
      case "update-cue-end": {
        if (!(target instanceof HTMLInputElement)) {
          return;
        }
        const cueId = target.dataset.cueId;
        if (!cueId) {
          return;
        }
        updateTextCue(cueId, (cue) => ({ ...cue, end: Number(target.value) }));
        return;
      }
      case "update-cue-align": {
        if (!(target instanceof HTMLSelectElement)) {
          return;
        }
        const cueId = target.dataset.cueId;
        if (!cueId) {
          return;
        }
        updateTextCue(cueId, (cue) => ({ ...cue, align: target.value as RawTextCue["align"] }));
        return;
      }
      case "update-cue-size": {
        if (!(target instanceof HTMLInputElement)) {
          return;
        }
        const cueId = target.dataset.cueId;
        if (!cueId) {
          return;
        }
        updateTextCue(cueId, (cue) => ({ ...cue, size: Number(target.value) }));
        return;
      }
      case "update-cue-color": {
        if (!(target instanceof HTMLInputElement)) {
          return;
        }
        const cueId = target.dataset.cueId;
        if (!cueId) {
          return;
        }
        updateTextCue(cueId, (cue) => ({ ...cue, color: target.value }));
        return;
      }
      case "toggle-play": {
        if (callbacks.getIsPlaying()) {
          callbacks.onPause();
        } else {
          callbacks.onPlay();
        }
        render();
        return;
      }
      case "jump-scene": {
        const scene = getSelectedScene();
        if (!scene) {
          return;
        }
        callbacks.onSeek(scene.start);
        return;
      }
      case "toggle-loop": {
        loopEnabled = !loopEnabled;
        const scene = getSelectedScene();
        if (loopEnabled && scene) {
          callbacks.onLoopChange({ start: scene.start, end: scene.end ?? scene.start + 1 });
        } else {
          callbacks.onLoopChange(null);
        }
        render();
        return;
      }
      case "import": {
        importInput.click();
        return;
      }
      case "export": {
        downloadTimeline(timeline);
        return;
      }
      case "revert": {
        void onRevert().then((next) => {
          updateTimeline(next);
        });
        return;
      }
      default:
        return;
    }
  }

  function resolveParams(ownerKey: string): {
    params: Record<string, number>;
    setParams: (next: Record<string, number>) => void;
  } {
    if (ownerKey.startsWith("scene:")) {
      const sceneId = ownerKey.replace("scene:", "");
      const scene = timeline.sections.find((section) => section.id === sceneId);
      return {
        params: scene?.params ?? {},
        setParams: (next) => updateScene(sceneId, (scene) => ({ ...scene, params: next }))
      };
    }
    const match = ownerKey.match(/^layer:(.+):(\d+)$/);
    if (!match) {
      return { params: {}, setParams: () => undefined };
    }
    const sceneId = match[1];
    const index = Number(match[2]);
    return {
      params: timeline.sections.find((section) => section.id === sceneId)?.layers?.[index]?.params ?? {},
      setParams: (next) => updateLayer(sceneId, index, (layer) => ({ ...layer, params: next }))
    };
  }

  function resolveAutomation(ownerKey: string): {
    automation: RawSectionConfig["automation"];
    setAutomation: (next: RawSectionConfig["automation"]) => void;
  } {
    if (ownerKey.startsWith("scene:")) {
      const sceneId = ownerKey.replace("scene:", "");
      const scene = timeline.sections.find((section) => section.id === sceneId);
      return {
        automation: scene?.automation ?? [],
        setAutomation: (next) => updateScene(sceneId, (scene) => ({ ...scene, automation: next }))
      };
    }
    const match = ownerKey.match(/^layer:(.+):(\d+)$/);
    if (!match) {
      return { automation: [], setAutomation: () => undefined };
    }
    const sceneId = match[1];
    const index = Number(match[2]);
    return {
      automation: timeline.sections.find((section) => section.id === sceneId)?.layers?.[index]?.automation ?? [],
      setAutomation: (next) => updateLayer(sceneId, index, (layer) => ({ ...layer, automation: next }))
    };
  }

  function removeLayerWithIndex(scene: RawSectionConfig, index: number): RawSectionConfig {
    const layers = scene.layers ? [...scene.layers] : [];
    layers.splice(index, 1);
    return { ...scene, layers };
  }

  function createParamKey(params: Record<string, number>): string {
    let counter = 1;
    let key = `param${counter}`;
    while (params[key] !== undefined) {
      counter += 1;
      key = `param${counter}`;
    }
    return key;
  }

  function getSceneEnd(section: RawSectionConfig, index: number): number | null {
    if (section.end !== undefined) {
      return section.end ?? null;
    }
    const next = timeline.sections[index + 1];
    if (next) {
      return next.start;
    }
    return null;
  }

  function formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.max(0, time - minutes * 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
  }

  function renderRuler(totalDuration: number): string {
    const step = totalDuration > 120 ? 30 : 10;
    const marks: string[] = [];
    for (let t = 0; t <= totalDuration; t += step) {
      const left = (t / totalDuration) * 100;
      marks.push(`<div class="editor-ruler-mark" style="left:${left}%">${formatTime(t)}</div>`);
    }
    return marks.join("");
  }

  importInput.addEventListener("change", async () => {
    const file = importInput.files?.[0];
    if (!file) {
      return;
    }
    const next = await importTimelineFile(file);
    updateTimeline(next);
    importInput.value = "";
  });

  render();

  return { setVisible };
}
