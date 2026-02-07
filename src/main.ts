import "./style.css";
import {
  EraPreset,
  IntroConfig,
  RawTimelineConfig,
  TimelineConfig,
  TransitionType,
  loadConfig,
  normalizeTimelineConfig
} from "./config/loadConfig";
import { AudioPlayer, AudioFeatures } from "./audio/audioPlayer";
import { Timeline } from "./timeline/timeline";
import { Renderer } from "./renderer/renderer";
import { effectRegistry } from "./renderer/effects";
import { coerceEffectParams, getEffectDebugConfig, getEffectDebugDefaults, EffectParamControl } from "./renderer/debug/effectDebug";
import { getWebGLStatusLabel } from "./renderer/effects/gl/webglStatus";
import { TerminalIntroRenderer } from "./renderer/intro/terminalIntro";
import { createExplosionState, getExplosionShake, renderExplosion } from "./renderer/overlays/explosion";
import { createQualityState, updateQualityState } from "./renderer/qualityController";
import { getRenderSettings } from "./renderer/renderSettings";
import {
  getFullscreenAction,
  getIntroSkipTime,
  getNextDebugOverlayVisibility,
  getRelativeSeekTime,
  getSecondHalfSkipTime
} from "./controls";
import {
  getDebugEffectSelectorOptions,
  getDebugEffectSelectorValue,
  shouldShowEffectPanel
} from "./debug/debugPanel";
import { applyEraOverride, applyEraOverrideToTransition } from "./debug/eraOverride";
import { createEditorRoot, EditorController } from "./editor/EditorRoot";
import { fetchViews, registerViewOncePerSession } from "./viewCounter";

const canvas = document.querySelector<HTMLCanvasElement>("#demo");
const overlay = document.querySelector<HTMLDivElement>("#start-overlay");
const overlayText = overlay?.querySelector<HTMLDivElement>(".start-text");
const debugOverlay = document.querySelector<HTMLDivElement>("#debug-overlay");
const debugTimestamp = document.querySelector<HTMLSpanElement>("#debug-timestamp");
const debugWebglStatus = document.querySelector<HTMLSpanElement>("#debug-webgl-status");
const debugTransitionSelect = document.querySelector<HTMLSelectElement>("#debug-transition");
const debugEraSelect = document.querySelector<HTMLSelectElement>("#debug-era");
const debugEffectSelect = document.querySelector<HTMLSelectElement>("#debug-effect-select");
const debugEffectPanel = document.querySelector<HTMLDivElement>("#debug-effect-panel");
const debugEffectTitle = document.querySelector<HTMLDivElement>("#debug-effect-title");
const debugEffectControls = document.querySelector<HTMLDivElement>("#debug-effect-controls");
const debugEffectEmpty = document.querySelector<HTMLDivElement>("#debug-effect-empty");
const debugMonochromeToggle = document.querySelector<HTMLInputElement>("#debug-monochrome");
const debugSkipIntroButton = document.querySelector<HTMLButtonElement>("#debug-skip-intro");
const debugSkipSecondHalfButton = document.querySelector<HTMLButtonElement>("#debug-skip-second-half");
const debugSkipBackButton = document.querySelector<HTMLButtonElement>("#debug-skip-back");
const debugSkipForwardButton = document.querySelector<HTMLButtonElement>("#debug-skip-forward");
const debugEditorToggle = document.querySelector<HTMLInputElement>("#debug-editor-toggle");
const editorRoot = document.querySelector<HTMLDivElement>("#editor-root");
const mobileControls = document.querySelector<HTMLDivElement>("#mobile-controls");
const mobileDebugButton = document.querySelector<HTMLButtonElement>("#mobile-debug");
const mobileFullscreenButton = document.querySelector<HTMLButtonElement>("#mobile-fullscreen");
const viewCounter = document.querySelector<HTMLDivElement>("#view-counter");

const queryParams = new URLSearchParams(window.location.search);
const releaseMode = queryParams.get("release") === "1";
const editorModeFromQuery = queryParams.get("editor") === "1";
const renderSettings = getRenderSettings(queryParams);
const qualityState = createQualityState(renderSettings.qualityScale, renderSettings.autoQuality);

if (!canvas || !overlay || !overlayText || !debugOverlay || !debugTimestamp || !debugTransitionSelect || !debugEraSelect) {
  throw new Error("Missing canvas or overlay element");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Unable to create 2D context");
}

const getEffectiveBaseSize = (): { width: number; height: number } => ({
  width: Math.max(1, Math.round(renderSettings.baseWidth * qualityState.qualityScale)),
  height: Math.max(1, Math.round(renderSettings.baseHeight * qualityState.qualityScale))
});

let { width: effectiveBaseWidth, height: effectiveBaseHeight } = getEffectiveBaseSize();
const renderer = new Renderer(effectiveBaseWidth, effectiveBaseHeight);
const introRenderer = new TerminalIntroRenderer();
const explosionState = createExplosionState();
let audioPlayer: AudioPlayer | null = null;
let timeline: Timeline | null = null;
let introConfig: IntroConfig | null = null;
let animationFrame = 0;
let lastDemoTime = 0;
let isRunning = false;
let pendingConfig: TimelineConfig | null = null;
let currentAudioSrc = "";
let editorController: EditorController | null = null;
let lastFrameTimestamp = performance.now();
let currentViewCount = 0;
const debugState = {
  enabled: false,
  forcedEffect: null as string | null,
  transitionOverride: null as TransitionType | null,
  eraOverride: null as EraPreset | null,
  monochromeOverride: null as boolean | null,
  effectParams: Object.fromEntries(
    Object.keys(effectRegistry).map((effectName) => [effectName, getEffectDebugDefaults(effectName)])
  )
};

function updateViewCounter(count: number): void {
  currentViewCount = count;
  if (viewCounter) {
    viewCounter.textContent = `Views: ${count}`;
  }
}

async function handlePlaybackStarted(): Promise<void> {
  const count = await registerViewOncePerSession();
  if (count !== null) {
    updateViewCounter(count);
  }
}

function attachAudioPlayerHandlers(player: AudioPlayer): void {
  player.onStarted = () => {
    void handlePlaybackStarted();
  };
}

function applyQualityScale(): void {
  const effectiveSize = getEffectiveBaseSize();
  if (effectiveSize.width === effectiveBaseWidth && effectiveSize.height === effectiveBaseHeight) {
    return;
  }
  effectiveBaseWidth = effectiveSize.width;
  effectiveBaseHeight = effectiveSize.height;
  renderer.setBaseSize(effectiveBaseWidth, effectiveBaseHeight);
}

function resize(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);

void fetchViews().then((count) => {
  updateViewCounter(count);
});

function setOverlay(text: string, show = true, isError = false): void {
  overlayText.textContent = text;
  overlay.dataset.state = isError ? "error" : "normal";
  if (show) {
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

function formatTimestamp(time: number): string {
  const minutes = Math.floor(time / 60);
  const seconds = Math.max(0, time - minutes * 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
}

function setDebugOverlayVisible(visible: boolean): void {
  if (releaseMode) {
    debugState.enabled = false;
    debugOverlay.classList.add("hidden");
    updateEffectPanelVisibility();
    return;
  }
  debugState.enabled = visible;
  debugOverlay.classList.toggle("hidden", !visible);
  updateEffectPanelVisibility();
}

function toggleDebugOverlay(): void {
  setDebugOverlayVisible(getNextDebugOverlayVisibility(debugState.enabled));
}

function toggleFullscreen(): void {
  const action = getFullscreenAction(document.fullscreenEnabled, document.fullscreenElement);
  if (action === "enter") {
    canvas.requestFullscreen();
  }
  if (action === "exit") {
    document.exitFullscreen();
  }
}

async function applyTimelineConfig(config: TimelineConfig): Promise<void> {
  if (!audioPlayer) {
    pendingConfig = config;
    return;
  }
  const currentTime = audioPlayer.currentTime;
  const wasPaused = audioPlayer.paused;
  introConfig = config.intro;
  const shouldReloadAudio = config.audio.src !== currentAudioSrc;
  if (shouldReloadAudio) {
    audioPlayer.destroy();
    audioPlayer = new AudioPlayer(config.audio.src);
    attachAudioPlayerHandlers(audioPlayer);
    await audioPlayer.load();
    currentAudioSrc = config.audio.src;
  }
  timeline = new Timeline(config);
  timeline.setAudioDuration(audioPlayer.duration);
  audioPlayer.seek(currentTime);
  lastDemoTime = audioPlayer.currentTime + timeline.getAudioOffset();
  updateDebugSkipButtonState(lastDemoTime);
  setOverlay("", false);
  if (!wasPaused) {
    await audioPlayer.play();
  }
}

async function applyRawTimeline(raw: RawTimelineConfig): Promise<string | null> {
  try {
    const config = normalizeTimelineConfig(raw);
    await applyTimelineConfig(config);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Invalid timeline JSON";
  }
}

const SECOND_HALF_START = 150;

function updateDebugSkipButtonState(demoTime: number | null): void {
  if (!debugSkipIntroButton) {
    return;
  }
  if (!audioPlayer || !timeline || !introConfig || demoTime === null) {
    debugSkipIntroButton.disabled = true;
    if (debugSkipSecondHalfButton) {
      debugSkipSecondHalfButton.disabled = true;
    }
    if (debugSkipBackButton) {
      debugSkipBackButton.disabled = true;
    }
    if (debugSkipForwardButton) {
      debugSkipForwardButton.disabled = true;
    }
    return;
  }
  debugSkipIntroButton.disabled = demoTime >= introConfig.end;
  if (debugSkipSecondHalfButton) {
    debugSkipSecondHalfButton.disabled = demoTime >= SECOND_HALF_START;
  }
  if (debugSkipBackButton) {
    debugSkipBackButton.disabled = false;
  }
  if (debugSkipForwardButton) {
    debugSkipForwardButton.disabled = false;
  }
}

function createEffectSelector(): void {
  if (!debugEffectSelect) {
    return;
  }

  debugEffectSelect.innerHTML = "";

  getDebugEffectSelectorOptions(Object.keys(effectRegistry)).forEach((effectName) => {
    const option = document.createElement("option");
    option.value = effectName;
    option.textContent = effectName;
    debugEffectSelect.appendChild(option);
  });

  debugEffectSelect.addEventListener("change", () => {
    debugState.forcedEffect = debugEffectSelect.value === "timeline" ? null : debugEffectSelect.value;
    updateEffectSelectorState();
  });

  updateEffectSelectorState();
}

function syncEffectInputs(effectName: string, controls: EffectParamControl[]): void {
  if (!debugEffectControls) {
    return;
  }
  const params = debugState.effectParams[effectName] ?? {};
  controls.forEach((control) => {
    const input = debugEffectControls.querySelector<HTMLInputElement | HTMLSelectElement>(
      `[data-effect-param="${control.key}"]`
    );
    if (!input) {
      return;
    }
    const value = params[control.key] ?? control.defaultValue;
    if (control.type === "select" && input instanceof HTMLSelectElement) {
      input.value = String(value);
      return;
    }
    if (control.type === "toggle" && input instanceof HTMLInputElement) {
      input.checked = Number(value) !== 0;
      return;
    }
    if (input instanceof HTMLInputElement) {
      input.value = String(value);
    }
  });
}

function renderEffectPanel(effectName: string): void {
  if (!debugEffectPanel || !debugEffectControls || !debugEffectTitle || !debugEffectEmpty) {
    return;
  }
  const config = getEffectDebugConfig(effectName);
  if (!config) {
    return;
  }
  debugEffectTitle.textContent = config.title;
  debugEffectControls.innerHTML = "";
  if (config.controls.length === 0) {
    debugEffectEmpty.classList.remove("hidden");
    return;
  }
  debugEffectEmpty.classList.add("hidden");
  config.controls.forEach((control) => {
    const field = document.createElement("label");
    field.classList.add("debug-field");
    const label = document.createElement("span");
    label.textContent = control.label;
    field.appendChild(label);

    if (control.type === "select") {
      const select = document.createElement("select");
      select.dataset.effectParam = control.key;
      (control.options ?? []).forEach((option) => {
        const optionEl = document.createElement("option");
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        select.appendChild(optionEl);
      });
      select.addEventListener("change", () => {
        const nextParams = coerceEffectParams(effectName, {
          ...debugState.effectParams[effectName],
          [control.key]: select.value
        });
        debugState.effectParams[effectName] = nextParams;
        syncEffectInputs(effectName, config.controls);
      });
      field.appendChild(select);
      debugEffectControls.appendChild(field);
      return;
    }

    const input = document.createElement("input");
    input.dataset.effectParam = control.key;
    if (control.type === "toggle") {
      input.type = "checkbox";
      input.addEventListener("change", () => {
        const nextParams = coerceEffectParams(effectName, {
          ...debugState.effectParams[effectName],
          [control.key]: input.checked ? 1 : 0
        });
        debugState.effectParams[effectName] = nextParams;
        syncEffectInputs(effectName, config.controls);
      });
    } else {
      input.type = "number";
      if (control.step !== undefined) {
        input.step = String(control.step);
      }
      if (control.min !== undefined) {
        input.min = String(control.min);
      }
      if (control.max !== undefined) {
        input.max = String(control.max);
      }
      input.addEventListener("input", () => {
        const nextParams = coerceEffectParams(effectName, {
          ...debugState.effectParams[effectName],
          [control.key]: Number.parseFloat(input.value)
        });
        debugState.effectParams[effectName] = nextParams;
        syncEffectInputs(effectName, config.controls);
      });
    }

    field.appendChild(input);
    debugEffectControls.appendChild(field);
  });
  syncEffectInputs(effectName, config.controls);
}

function updateEffectPanelVisibility(): void {
  if (!debugEffectPanel) {
    return;
  }
  const visible = shouldShowEffectPanel(debugState.enabled, debugState.forcedEffect);
  debugEffectPanel.classList.toggle("hidden", !visible);
  if (visible && debugState.forcedEffect) {
    renderEffectPanel(debugState.forcedEffect);
  }
}

function updateEffectSelectorState(): void {
  if (debugEffectSelect) {
    debugEffectSelect.value = getDebugEffectSelectorValue(debugState.forcedEffect);
  }
  updateEffectPanelVisibility();
}

if (!releaseMode && debugTransitionSelect) {
  debugTransitionSelect.addEventListener("change", () => {
    const value = debugTransitionSelect.value;
    debugState.transitionOverride = value === "auto" ? null : (value as TransitionType);
  });
}

if (!releaseMode && debugEraSelect) {
  debugEraSelect.addEventListener("change", () => {
    const value = debugEraSelect.value;
    debugState.eraOverride = value === "auto" ? null : (value as EraPreset);
  });
}

if (!releaseMode && debugMonochromeToggle) {
  debugMonochromeToggle.addEventListener("change", () => {
    debugState.monochromeOverride = debugMonochromeToggle.checked ? true : null;
  });
}

if (!releaseMode && debugSkipIntroButton) {
  debugSkipIntroButton.addEventListener("click", () => {
    if (!audioPlayer || !timeline || !introConfig) {
      return;
    }
    const targetTime = getIntroSkipTime(introConfig.end, timeline.getAudioOffset(), audioPlayer.currentTime);
    audioPlayer.seek(targetTime);
  });
}

if (!releaseMode && debugSkipSecondHalfButton) {
  debugSkipSecondHalfButton.addEventListener("click", () => {
    if (!audioPlayer || !timeline) {
      return;
    }
    const targetTime = getSecondHalfSkipTime(SECOND_HALF_START, timeline.getAudioOffset(), audioPlayer.currentTime);
    audioPlayer.seek(targetTime);
  });
}

if (!releaseMode && debugSkipBackButton) {
  debugSkipBackButton.addEventListener("click", () => {
    if (!audioPlayer) {
      return;
    }
    const targetTime = getRelativeSeekTime(audioPlayer.currentTime, -10, audioPlayer.duration);
    audioPlayer.seek(targetTime);
  });
}

if (!releaseMode && debugSkipForwardButton) {
  debugSkipForwardButton.addEventListener("click", () => {
    if (!audioPlayer) {
      return;
    }
    const targetTime = getRelativeSeekTime(audioPlayer.currentTime, 10, audioPlayer.duration);
    audioPlayer.seek(targetTime);
  });
}

if (!releaseMode) {
  createEffectSelector();
  setDebugOverlayVisible(false);
  updateDebugSkipButtonState(null);
  if (editorRoot) {
    createEditorRoot({
      container: editorRoot,
      effectNames: Object.keys(effectRegistry),
      applyTimeline: applyRawTimeline,
      play: async () => {
        if (!audioPlayer) {
          await startDemo();
          return;
        }
        await audioPlayer.play();
      },
      pause: () => {
        audioPlayer?.pause();
      },
      seek: (time: number) => {
        audioPlayer?.seek(time);
      },
      getAudioOffset: () => timeline?.getAudioOffset() ?? 0,
      getAudioDuration: () => audioPlayer?.duration ?? 0
    }).then((controller) => {
      editorController = controller;
      if (debugEditorToggle) {
        debugEditorToggle.checked = editorModeFromQuery;
        debugEditorToggle.addEventListener("change", () => {
          controller.setVisible(debugEditorToggle.checked);
        });
      }
      controller.setVisible(debugEditorToggle?.checked ?? editorModeFromQuery);
    });
  }
} else {
  setDebugOverlayVisible(false);
  if (mobileDebugButton) {
    mobileDebugButton.style.display = "none";
  }
}

async function startDemo(): Promise<void> {
  if (isRunning) {
    return;
  }
  setOverlay("Loading…", true);

  try {
    const config = pendingConfig ?? (await loadConfig(releaseMode ? "/timeline.release.json" : "/timeline.json"));
    pendingConfig = null;
    introConfig = config.intro;
    if (audioPlayer) {
      audioPlayer.destroy();
    }
    audioPlayer = new AudioPlayer(config.audio.src);
    attachAudioPlayerHandlers(audioPlayer);
    await audioPlayer.load();
    currentAudioSrc = config.audio.src;

    timeline = new Timeline(config);
    timeline.setAudioDuration(audioPlayer.duration);

    await audioPlayer.play();
    renderer.reset();
    isRunning = true;
    lastDemoTime = audioPlayer.currentTime + timeline.getAudioOffset();
    lastFrameTimestamp = performance.now();
    setOverlay("", false);
    if (!releaseMode) {
      updateDebugSkipButtonState(lastDemoTime);
    }

    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(loop);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    setOverlay(`Error: ${message}`, true, true);
  }
}

async function restartDemo(): Promise<void> {
  if (!audioPlayer || !timeline) {
    await startDemo();
    return;
  }
  await audioPlayer.restart();
  renderer.reset();
  lastDemoTime = audioPlayer.currentTime + timeline.getAudioOffset();
  lastFrameTimestamp = performance.now();
  if (!releaseMode) {
    updateDebugSkipButtonState(lastDemoTime);
  }
  setOverlay("", false);
  if (!isRunning) {
    isRunning = true;
    animationFrame = requestAnimationFrame(loop);
  }
}

function loop(): void {
  if (!audioPlayer || !timeline || !introConfig) {
    isRunning = false;
    updateDebugSkipButtonState(null);
    return;
  }

  const now = performance.now();
  const frameMs = now - lastFrameTimestamp;
  lastFrameTimestamp = now;
  if (updateQualityState(qualityState, frameMs, now)) {
    applyQualityScale();
  }

  let demoTime = audioPlayer.currentTime + timeline.getAudioOffset();
  const loopState = editorController?.getLoopState();
  if (loopState && !audioPlayer.paused && demoTime >= loopState.end) {
    audioPlayer.seek(loopState.start - timeline.getAudioOffset());
    demoTime = audioPlayer.currentTime + timeline.getAudioOffset();
    lastDemoTime = demoTime;
  }
  const delta = Math.max(0, demoTime - lastDemoTime);
  lastDemoTime = demoTime;

  const audioFeatures: AudioFeatures = audioPlayer.updateFeatures();
  const state = timeline.getState(demoTime);
  if (state.mode === "intro") {
    introRenderer.render({
      ctx,
      width: canvas.width,
      height: canvas.height,
      time: demoTime,
      config: introConfig
    });
  } else {
    const effectParamOverrides = debugState.forcedEffect ? debugState.effectParams[debugState.forcedEffect] : null;
    const effectParamOverridesRecord = effectParamOverrides as Record<string, number> | null;
    const hasEffectOverrides = effectParamOverrides && Object.keys(effectParamOverrides).length > 0;
    const eraOverride = debugState.eraOverride;
    let sectionOverride = debugState.forcedEffect
      ? { ...state.section, effect: debugState.forcedEffect }
      : state.section;
    sectionOverride = applyEraOverride(sectionOverride, eraOverride);
    if (hasEffectOverrides && effectParamOverridesRecord) {
      sectionOverride = { ...sectionOverride, params: { ...sectionOverride.params, ...effectParamOverridesRecord } };
    }
    const transitionOverride = state.transition
      ? {
          ...state.transition,
          to: debugState.forcedEffect
            ? {
                ...state.transition.to,
                effect: debugState.forcedEffect,
                params: hasEffectOverrides && effectParamOverridesRecord
                  ? { ...state.transition.to.params, ...effectParamOverridesRecord }
                  : state.transition.to.params
              }
            : state.transition.to,
          type: debugState.transitionOverride ?? state.transition.type
        }
      : undefined;
    const transitionOverrideWithEra = applyEraOverrideToTransition(transitionOverride, eraOverride);
    const explosionTime = sectionOverride.era === "future" ? demoTime - sectionOverride.start : -1;
    const explosionShake = getExplosionShake(explosionTime);

    renderer.render({
      ctx,
      width: canvas.width,
      height: canvas.height,
      time: demoTime,
      delta,
      section: sectionOverride,
      transition: transitionOverrideWithEra,
      textCues: state.activeTextCues,
      audio: audioFeatures,
      monochromeOverride: debugState.monochromeOverride,
      screenShake: explosionShake
    });
    renderExplosion(ctx, canvas.width, canvas.height, explosionTime, explosionState, explosionShake);
  }

  debugTimestamp.textContent = formatTimestamp(demoTime);
  if (debugWebglStatus) {
    debugWebglStatus.textContent = getWebGLStatusLabel();
  }
  if (!releaseMode) {
    updateDebugSkipButtonState(demoTime);
  }
  editorController?.updatePlayback(demoTime, !audioPlayer.paused);
  editorController?.updatePreview(canvas);

  if (audioPlayer.ended) {
    isRunning = false;
    setOverlay("THE END (press R to restart)", true);
    return;
  }

  animationFrame = requestAnimationFrame(loop);
}

overlay.addEventListener("click", () => {
  startDemo();
});

window.addEventListener("keydown", (event) => {
  if (!releaseMode && event.key.toLowerCase() === "d") {
    toggleDebugOverlay();
  }
  if (event.key.toLowerCase() === "r") {
    restartDemo();
  }
  if (event.key.toLowerCase() === "f" && document.fullscreenEnabled) {
    toggleFullscreen();
  }
});

if (!releaseMode && mobileControls && mobileDebugButton) {
  mobileDebugButton.addEventListener("click", () => {
    toggleDebugOverlay();
  });
}

if (mobileControls && mobileFullscreenButton) {
  mobileFullscreenButton.addEventListener("click", () => {
    toggleFullscreen();
  });
}
