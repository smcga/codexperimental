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
import { FramingOverride } from "./renderer/framing";
import { effectRegistry } from "./renderer/effects";
import {
  getEffectRegistryKeys,
  getManifestDebugConfig,
  registerRuntimeEffectManifest,
  EffectParamControl
} from "./renderer/effects/manifest";
import { coerceEffectParams, getEffectDebugDefaults } from "./renderer/debug/effectDebug";
import { getWebGLStatusLabel } from "./renderer/effects/gl/webglStatus";
import { TerminalIntroRenderer } from "./renderer/intro/terminalIntro";
import { createExplosionState, getExplosionShake, renderExplosion } from "./renderer/overlays/explosion";
import { createQualityState, updateQualityState } from "./renderer/qualityController";
import { getRenderSettings } from "./renderer/renderSettings";
import {
  getFullscreenAction,
  getEndSkipTime,
  getIntroSkipTime,
  getNextDebugOverlayVisibility,
  getRelativeSeekTime,
  getSecondHalfSkipTime,
  shouldHandleGlobalShortcut
} from "./controls";
import {
  DebugPanelSection,
  buildDebugRenderSelection,
  formatEffectSettingsForTimeline,
  getDebugEffectSelectorOptions,
  getDebugEffectSelectorValue,
  getDebugPanelSection,
  getNextDebugEffectSelection,
  shouldShowEffectPanel
} from "./debug/debugPanel";
import { applyEraOverride, applyEraOverrideToTransition } from "./debug/eraOverride";
import { createEditorRoot, EditorController } from "./editor/EditorRoot";
import { submitDoodle } from "./doodles";
import {
  compileRuntimeEffect,
  EffectIdeaApiError,
  EffectIdeaGenerationResult,
  GeneratedEffectParam,
  fetchApprovedEffects,
  generateEffectIdea,
  submitEffectIdea
} from "./effectIdeas";
import {
  clampDoodleBrushSize,
  DEFAULT_DOODLE_BRUSH_COLOR,
  DEFAULT_DOODLE_BRUSH_SIZE,
  getDoodleBrushSizeLabel,
  normalizeDoodleBrushColor
} from "./doodleComposer";
import { fetchViews, registerViewOncePerSession } from "./viewCounter";
import { buildSharePayload, canUseNativeShare, getShareLink, ShareLinkPlatform } from "./share";
import { getOverlayPresentation, OverlayMode } from "./overlayContent";
import { buildTransitionOptionMarkup } from "./renderer/transitions";
import { createPlaybackSyncController, shouldApplyRemoteState } from "./playbackSync";
import {
  applyCurrentValuesAsGeneratedDefaults,
  getGeneratedEffectDefaultParams,
  getRandomGeneratedEffectParams
} from "./generatedEffectControls";
import { installGlobalNumberInputWheelGuard } from "./numberInputWheel";

const canvas = document.querySelector<HTMLCanvasElement>("#demo");
const overlay = document.querySelector<HTMLDivElement>("#start-overlay");
const overlayKicker = document.querySelector<HTMLDivElement>("#overlay-kicker");
const overlayText = overlay?.querySelector<HTMLDivElement>(".start-text");
const overlaySubtitle = document.querySelector<HTMLDivElement>("#overlay-subtitle");
const overlayActions = document.querySelector<HTMLDivElement>("#overlay-actions");
const overlayStartButton = document.querySelector<HTMLButtonElement>("#overlay-start-button");
const overlayShareButton = document.querySelector<HTMLButtonElement>("#overlay-share-button");
const overlayRestartButton = document.querySelector<HTMLButtonElement>("#overlay-restart-button");
const addDoodleButton = document.querySelector<HTMLButtonElement>("#add-doodle-button");
const addEffectIdeaButton = document.querySelector<HTMLButtonElement>("#add-effect-idea-button");
const shareStatus = document.querySelector<HTMLDivElement>("#share-status");
const sharePanel = document.querySelector<HTMLDivElement>("#share-panel");
const shareCopyButton = document.querySelector<HTMLButtonElement>("#share-copy-button");
const shareLinkedIn = document.querySelector<HTMLAnchorElement>("#share-linkedin");
const shareX = document.querySelector<HTMLAnchorElement>("#share-x");
const shareFacebook = document.querySelector<HTMLAnchorElement>("#share-facebook");
const shareReddit = document.querySelector<HTMLAnchorElement>("#share-reddit");
const shareEmail = document.querySelector<HTMLAnchorElement>("#share-email");
const debugOverlay = document.querySelector<HTMLDivElement>("#debug-overlay");
const debugTimestamp = document.querySelector<HTMLSpanElement>("#debug-timestamp");
const debugWebglStatus = document.querySelector<HTMLSpanElement>("#debug-webgl-status");
const debugFramingState = document.querySelector<HTMLSpanElement>("#debug-framing-state");
const debugTransitionSelect = document.querySelector<HTMLSelectElement>("#debug-transition");
const debugEraSelect = document.querySelector<HTMLSelectElement>("#debug-era");
const debugFramingSelect = document.querySelector<HTMLSelectElement>("#debug-framing");
const debugEffectSelect = document.querySelector<HTMLSelectElement>("#debug-effect-select");
const debugEffectPanel = document.querySelector<HTMLDivElement>("#debug-effect-panel");
const debugEffectTitle = document.querySelector<HTMLDivElement>("#debug-effect-title");
const debugEffectControls = document.querySelector<HTMLDivElement>("#debug-effect-controls");
const debugEffectEmpty = document.querySelector<HTMLDivElement>("#debug-effect-empty");
const debugEffectCopyButton = document.querySelector<HTMLButtonElement>("#debug-effect-copy");
const debugEffectCopyStatus = document.querySelector<HTMLDivElement>("#debug-effect-copy-status");
const debugMonochromeToggle = document.querySelector<HTMLInputElement>("#debug-monochrome");
const debugSkipIntroButton = document.querySelector<HTMLButtonElement>("#debug-skip-intro");
const debugSkipSecondHalfButton = document.querySelector<HTMLButtonElement>("#debug-skip-second-half");
const debugSkipEndButton = document.querySelector<HTMLButtonElement>("#debug-skip-end");
const debugSkipBackButton = document.querySelector<HTMLButtonElement>("#debug-skip-back");
const debugSkipForwardButton = document.querySelector<HTMLButtonElement>("#debug-skip-forward");
const debugEditorToggle = document.querySelector<HTMLInputElement>("#debug-editor-toggle");
const debugTabButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-debug-tab]"));
const editorRoot = document.querySelector<HTMLDivElement>("#editor-root");
const mobileControls = document.querySelector<HTMLDivElement>("#mobile-controls");
const mobileDebugButton = document.querySelector<HTMLButtonElement>("#mobile-debug");
const mobileFullscreenButton = document.querySelector<HTMLButtonElement>("#mobile-fullscreen");
const viewCounter = document.querySelector<HTMLDivElement>("#view-counter");
const doodleModal = document.querySelector<HTMLDivElement>("#doodle-modal");
const doodleCanvas = document.querySelector<HTMLCanvasElement>("#doodle-canvas");
const doodleStatus = document.querySelector<HTMLDivElement>("#doodle-status");
const doodleBrushSizeInput = document.querySelector<HTMLInputElement>("#doodle-brush-size");
const doodleBrushSizeValue = document.querySelector<HTMLSpanElement>("#doodle-brush-size-value");
const doodleColorButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-doodle-color]"));
const doodleClearButton = document.querySelector<HTMLButtonElement>("#doodle-clear");
const doodleCancelButton = document.querySelector<HTMLButtonElement>("#doodle-cancel");
const doodleSubmitButton = document.querySelector<HTMLButtonElement>("#doodle-submit");
const effectIdeaModal = document.querySelector<HTMLDivElement>("#effect-idea-modal");
const effectIdeaInput = document.querySelector<HTMLTextAreaElement>("#effect-idea-input");
const effectIdeaPreview = document.querySelector<HTMLCanvasElement>("#effect-idea-preview");
const effectIdeaControls = document.querySelector<HTMLDivElement>("#effect-idea-controls");
const effectIdeaControlsGrid = document.querySelector<HTMLDivElement>("#effect-idea-controls-grid");
const effectIdeaControlsEmpty = document.querySelector<HTMLDivElement>("#effect-idea-controls-empty");
const effectIdeaSetDefaultsButton = document.querySelector<HTMLButtonElement>("#effect-idea-set-defaults");
const effectIdeaRandomizeButton = document.querySelector<HTMLButtonElement>("#effect-idea-randomize");
const effectIdeaCode = document.querySelector<HTMLPreElement>("#effect-idea-code");
const effectIdeaStatus = document.querySelector<HTMLDivElement>("#effect-idea-status");
const effectIdeaCancelButton = document.querySelector<HTMLButtonElement>("#effect-idea-cancel");
const effectIdeaGenerateButton = document.querySelector<HTMLButtonElement>("#effect-idea-generate");
const effectIdeaSubmitButton = document.querySelector<HTMLButtonElement>("#effect-idea-submit");

const queryParams = new URLSearchParams(window.location.search);
const releaseMode = queryParams.get("release") === "1";
const editorModeFromQuery = queryParams.get("editor") === "1";
const renderSettings = getRenderSettings(queryParams);
const qualityState = createQualityState(renderSettings.qualityScale, renderSettings.autoQuality);
installGlobalNumberInputWheelGuard();

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
let overlayMode: OverlayMode = "start";
let doodleHasStroke = false;
let doodleSubmitting = false;
let doodleDrawing = false;
let doodlePointerId: number | null = null;
let doodleBrushColor = DEFAULT_DOODLE_BRUSH_COLOR;
let doodleBrushSize = DEFAULT_DOODLE_BRUSH_SIZE;
let sharePanelVisible = false;
let effectIdeasGenerating = false;
let effectIdeasSubmitting = false;
let generatedIdea: EffectIdeaGenerationResult | null = null;
let generatedIdeaPrompt = "";
let effectIdeaPreviewFrame = 0;
let effectIdeaPreviewStart = 0;
let effectIdeaPreviewEffect: ReturnType<typeof compileRuntimeEffect> | null = null;
let effectIdeaPreviewParams: Record<string, number | string> = {};
let availableEffectNames = getEffectRegistryKeys();
let playbackSyncSuppressBroadcast = false;
let lastPlaybackSyncStateSentAt = 0;
const playbackSync = createPlaybackSyncController(
  {
    onRemoteTransport: (action, time) => {
      if (playbackSyncSuppressBroadcast) {
        return;
      }
      playbackSyncSuppressBroadcast = true;
      try {
        if (action === "start") {
          void startDemo();
          return;
        }
        if (action === "restart") {
          void restartDemo();
          return;
        }
        if (!audioPlayer) {
          return;
        }
        if (action === "play") {
          void audioPlayer.play();
          return;
        }
        if (action === "pause") {
          audioPlayer.pause();
          return;
        }
        if (action === "seek" && typeof time === "number") {
          audioPlayer.seek(time);
        }
      } finally {
        setTimeout(() => {
          playbackSyncSuppressBroadcast = false;
        }, 0);
      }
    },
    onRemoteState: ({ playing, time }) => {
      if (!audioPlayer) {
        return;
      }
      if (playing !== !audioPlayer.paused) {
        if (playing) {
          void audioPlayer.play();
        } else {
          audioPlayer.pause();
        }
      }
      if (shouldApplyRemoteState(audioPlayer.currentTime, time, 0.35)) {
        audioPlayer.seek(time);
      }
    }
  },
  { sourceId: `${window.location.pathname}-${Math.random().toString(36).slice(2)}` }
);
const debugState = {
  enabled: false,
  forcedEffect: null as string | null,
  transitionOverride: null as TransitionType | null,
  eraOverride: null as EraPreset | null,
  monochromeOverride: null as boolean | null,
  effectParams: Object.fromEntries(getEffectRegistryKeys().map((effectName) => [effectName, getEffectDebugDefaults(effectName)])),
  framingOverride: "auto" as FramingOverride
};
let mobileDebugSection: DebugPanelSection = "transport";

const doodleCtx = doodleCanvas?.getContext("2d") ?? null;
const effectIdeaPreviewCtx = effectIdeaPreview?.getContext("2d") ?? null;
const EMPTY_AUDIO_FEATURES: AudioFeatures = {
  timeDomain: new Uint8Array(2048),
  frequency: new Uint8Array(1024),
  rms: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  beat: false,
  beatStrength: 0,
  impactStrength: 0
};

debugTransitionSelect.innerHTML = buildTransitionOptionMarkup({ includeAuto: true });

updateOverlayActions();
updateDoodleBrushControls();
resetDoodleCanvas();
updateEffectIdeaButtons();
syncShareLinks();

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
    if (!playbackSyncSuppressBroadcast) {
      playbackSync.broadcastTransport("play");
    }
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

function updateOverlayActions(): void {
  if (!overlay || !overlayActions) {
    return;
  }
  const presentation = getOverlayPresentation(overlayMode);
  overlay.dataset.mode = overlayMode;
  if (overlayKicker) {
    overlayKicker.textContent = presentation.kicker;
  }
  if (overlaySubtitle) {
    overlaySubtitle.textContent = presentation.subtitle;
  }
  overlayActions.classList.toggle("hidden", !presentation.showActions);
  if (overlayStartButton) {
    overlayStartButton.textContent = presentation.startLabel;
  }
  overlayStartButton?.classList.toggle("hidden", !presentation.showStart);
  if (overlayShareButton) {
    overlayShareButton.textContent = presentation.shareLabel;
  }
  overlayShareButton?.classList.toggle("hidden", !presentation.showShare);
  if (overlayRestartButton) {
    overlayRestartButton.textContent = presentation.restartLabel;
  }
  overlayRestartButton?.classList.toggle("hidden", !presentation.showRestart);
  if (addDoodleButton) {
    addDoodleButton.textContent = presentation.doodleLabel;
  }
  addDoodleButton?.classList.toggle("hidden", !presentation.showDoodle);
  if (addEffectIdeaButton) {
    addEffectIdeaButton.textContent = presentation.effectIdeaLabel;
  }
  addEffectIdeaButton?.classList.toggle("hidden", !presentation.showEffectIdea);
  if (!presentation.showActions) {
    setSharePanelVisible(false);
    setShareStatus("");
  }
}

function setOverlay(text: string, show = true, isError = false, mode: OverlayMode = "status"): void {
  overlayMode = mode;
  updateOverlayActions();
  overlayText.textContent = text;
  overlay.dataset.state = isError ? "error" : "normal";
  if (show) {
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

function setShareStatus(message: string, state: "idle" | "error" = "idle"): void {
  if (!shareStatus) {
    return;
  }
  shareStatus.textContent = message;
  shareStatus.dataset.state = state;
  shareStatus.classList.toggle("hidden", message.length === 0);
}

function setSharePanelVisible(visible: boolean): void {
  sharePanelVisible = visible;
  if (!sharePanel) {
    return;
  }
  sharePanel.classList.toggle("hidden", !visible);
}

function getShareUrl(): string {
  return window.location.href;
}

function syncShareLinks(): void {
  const payload = buildSharePayload(getShareUrl());
  const shareAnchors: Array<[HTMLAnchorElement | null, ShareLinkPlatform]> = [
    [shareLinkedIn, "linkedin"],
    [shareX, "x"],
    [shareFacebook, "facebook"],
    [shareReddit, "reddit"],
    [shareEmail, "email"]
  ];

  shareAnchors.forEach(([anchor, platform]) => {
    if (!anchor) {
      return;
    }
    anchor.href = getShareLink(platform, payload);
  });
}

async function copyShareLink(): Promise<void> {
  try {
    await navigator.clipboard.writeText(getShareUrl());
    setShareStatus("Link copied. Share it anywhere you like.");
  } catch {
    setShareStatus("Clipboard access was blocked on this browser.", "error");
  }
}

async function shareDemo(): Promise<void> {
  syncShareLinks();
  const payload = buildSharePayload(getShareUrl());
  if (canUseNativeShare(navigator.share)) {
    try {
      await navigator.share(payload);
      setShareStatus("Thanks for sharing.");
      setSharePanelVisible(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setShareStatus("Share sheet unavailable here, showing quick links instead.", "error");
      setSharePanelVisible(true);
    }
    return;
  }

  const nextVisible = !sharePanelVisible;
  setSharePanelVisible(nextVisible);
  setShareStatus(nextVisible ? "Pick a platform or copy the link below." : "");
}

function setDoodleStatus(message: string, state: "idle" | "error" | "success" = "idle"): void {
  if (!doodleStatus) {
    return;
  }
  doodleStatus.textContent = message;
  doodleStatus.dataset.state = state;
}

function updateDoodleSubmitState(): void {
  if (!doodleSubmitButton) {
    return;
  }
  doodleSubmitButton.disabled = doodleSubmitting || !doodleHasStroke;
}

function updateDoodleBrushControls(): void {
  doodleColorButtons.forEach((button) => {
    const isActive = normalizeDoodleBrushColor(button.dataset.doodleColor) === doodleBrushColor;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  if (doodleBrushSizeInput) {
    doodleBrushSizeInput.value = String(doodleBrushSize);
  }
  if (doodleBrushSizeValue) {
    doodleBrushSizeValue.textContent = `${getDoodleBrushSizeLabel(doodleBrushSize)} · ${doodleBrushSize}px`;
  }
}

function applyDoodleBrush(): void {
  if (!doodleCtx) {
    return;
  }
  doodleCtx.strokeStyle = doodleBrushColor;
  doodleCtx.lineWidth = doodleBrushSize;
  doodleCtx.lineCap = "round";
  doodleCtx.lineJoin = "round";
}

function resetDoodleCanvas(): void {
  if (!doodleCanvas || !doodleCtx) {
    return;
  }

  doodleCtx.clearRect(0, 0, doodleCanvas.width, doodleCanvas.height);
  const gradient = doodleCtx.createLinearGradient(0, 0, 0, doodleCanvas.height);
  gradient.addColorStop(0, "#08101f");
  gradient.addColorStop(1, "#03060b");
  doodleCtx.fillStyle = gradient;
  doodleCtx.fillRect(0, 0, doodleCanvas.width, doodleCanvas.height);
  applyDoodleBrush();
  doodleHasStroke = false;
  doodleDrawing = false;
  doodlePointerId = null;
  updateDoodleBrushControls();
  updateDoodleSubmitState();
  setDoodleStatus("Draw on the canvas, then submit it for approval when you are ready.");
}

function setDoodleModalVisible(visible: boolean): void {
  if (!doodleModal) {
    return;
  }
  doodleModal.classList.toggle("hidden", !visible);
  doodleModal.setAttribute("aria-hidden", visible ? "false" : "true");
  if (visible) {
    resetDoodleCanvas();
  }
}

function setEffectIdeaStatus(message: string, state: "idle" | "error" | "success" = "idle"): void {
  if (!effectIdeaStatus) {
    return;
  }
  effectIdeaStatus.textContent = message;
  effectIdeaStatus.dataset.state = state;
}

function updateEffectIdeaButtons(): void {
  if (effectIdeaGenerateButton) {
    effectIdeaGenerateButton.disabled = effectIdeasGenerating;
  }
  if (effectIdeaSubmitButton) {
    effectIdeaSubmitButton.disabled = effectIdeasSubmitting || generatedIdea === null;
  }
  if (effectIdeaSetDefaultsButton) {
    effectIdeaSetDefaultsButton.disabled = effectIdeasGenerating || !generatedIdea || (generatedIdea.params?.length ?? 0) === 0;
  }
  if (effectIdeaRandomizeButton) {
    effectIdeaRandomizeButton.disabled = effectIdeasGenerating || !generatedIdea || (generatedIdea.params?.length ?? 0) === 0;
  }
}

function renderGeneratedEffectIdeaControls(): void {
  if (!effectIdeaControls || !effectIdeaControlsGrid || !effectIdeaControlsEmpty) {
    return;
  }
  const params = generatedIdea?.params ?? [];
  const hasControls = params.length > 0;
  effectIdeaControls.classList.toggle("hidden", !generatedIdea);
  effectIdeaControlsGrid.innerHTML = "";
  effectIdeaControlsEmpty.classList.toggle("hidden", hasControls);
  if (!hasControls) {
    return;
  }

  params.forEach((param) => {
    const field = document.createElement("label");
    field.classList.add("debug-field");
    const label = document.createElement("span");
    label.textContent = param.label;
    field.appendChild(label);

    if (param.type === "select") {
      const select = document.createElement("select");
      select.dataset.effectIdeaParam = param.key;
      (param.options ?? []).forEach((option) => {
        const optionEl = document.createElement("option");
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        select.appendChild(optionEl);
      });
      select.value = String(effectIdeaPreviewParams[param.key] ?? "");
      select.addEventListener("change", () => {
        effectIdeaPreviewParams[param.key] = select.value;
      });
      field.appendChild(select);
      effectIdeaControlsGrid.appendChild(field);
      return;
    }

    const input = document.createElement("input");
    input.dataset.effectIdeaParam = param.key;
    if (param.type === "toggle") {
      input.type = "checkbox";
      input.checked = Number(effectIdeaPreviewParams[param.key]) !== 0;
      input.addEventListener("change", () => {
        effectIdeaPreviewParams[param.key] = input.checked ? 1 : 0;
      });
      field.appendChild(input);
      effectIdeaControlsGrid.appendChild(field);
      return;
    }

    input.type = "number";
    if (param.min !== undefined) {
      input.min = String(param.min);
    }
    if (param.max !== undefined) {
      input.max = String(param.max);
    }
    if (param.step !== undefined) {
      input.step = String(param.step);
    }
    input.value = String(effectIdeaPreviewParams[param.key] ?? 0);
    input.addEventListener("input", () => {
      const numeric = Number(input.value);
      if (!Number.isFinite(numeric)) {
        return;
      }
      effectIdeaPreviewParams[param.key] = numeric;
    });
    field.appendChild(input);
    effectIdeaControlsGrid.appendChild(field);
  });
}

function stopEffectIdeaPreview(): void {
  if (effectIdeaPreviewFrame) {
    cancelAnimationFrame(effectIdeaPreviewFrame);
    effectIdeaPreviewFrame = 0;
  }
}

function previewGeneratedIdea(): void {
  if (!effectIdeaPreview || !effectIdeaPreviewCtx || !effectIdeaPreviewEffect) {
    return;
  }
  const nowSeconds = performance.now() / 1000;
  if (effectIdeaPreviewStart === 0) {
    effectIdeaPreviewStart = nowSeconds;
  }
  effectIdeaPreviewEffect.render({
    ctx: effectIdeaPreviewCtx,
    width: effectIdeaPreview.width,
    height: effectIdeaPreview.height,
    time: nowSeconds - effectIdeaPreviewStart,
    delta: 1 / 60,
    audio: EMPTY_AUDIO_FEATURES,
    params: effectIdeaPreviewParams
  });
  effectIdeaPreviewFrame = requestAnimationFrame(previewGeneratedIdea);
}

function setEffectIdeaModalVisible(visible: boolean): void {
  if (!effectIdeaModal) {
    return;
  }
  effectIdeaModal.classList.toggle("hidden", !visible);
  effectIdeaModal.setAttribute("aria-hidden", visible ? "false" : "true");
  if (!visible) {
    stopEffectIdeaPreview();
  }
  if (visible && effectIdeaCode) {
    effectIdeaCode.textContent = "";
    setEffectIdeaStatus("Describe your idea, click Generate, and preview the result.");
    generatedIdea = null;
    effectIdeaPreviewParams = {};
    generatedIdeaPrompt = "";
    effectIdeaPreviewEffect = null;
    effectIdeaPreviewStart = 0;
    renderGeneratedEffectIdeaControls();
    updateEffectIdeaButtons();
  }
}

function getDoodleCanvasPoint(event: PointerEvent): { x: number; y: number } | null {
  if (!doodleCanvas) {
    return null;
  }
  const rect = doodleCanvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }
  return {
    x: ((event.clientX - rect.left) / rect.width) * doodleCanvas.width,
    y: ((event.clientY - rect.top) / rect.height) * doodleCanvas.height
  };
}

async function submitCurrentDoodle(): Promise<void> {
  if (!doodleCanvas || !doodleSubmitButton || doodleSubmitting || !doodleHasStroke) {
    return;
  }

  doodleSubmitting = true;
  updateDoodleSubmitState();
  setDoodleStatus("Submitting doodle…");

  try {
    await submitDoodle(doodleCanvas.toDataURL("image/png"));
    setDoodleStatus("Doodle submitted for review. It will only appear on the doodle greetz wall after you open the review page and approve it.", "success");
    setDoodleModalVisible(false);
  } catch {
    setDoodleStatus("Unable to save the doodle right now. Please try again.", "error");
  } finally {
    doodleSubmitting = false;
    updateDoodleSubmitState();
  }
}

async function generateCurrentEffectIdea(): Promise<void> {
  if (!effectIdeaInput || effectIdeasGenerating) {
    return;
  }
  const prompt = effectIdeaInput.value.trim();
  if (!prompt) {
    setEffectIdeaStatus("Describe your effect idea first.", "error");
    return;
  }
  effectIdeasGenerating = true;
  updateEffectIdeaButtons();
  setEffectIdeaStatus("Generating effect code with Codex…");
  try {
    const generation = await generateEffectIdea(prompt);
    generatedIdea = generation;
    effectIdeaPreviewParams = getGeneratedEffectDefaultParams(generation.params);
    generatedIdeaPrompt = prompt;
    if (effectIdeaCode) {
      effectIdeaCode.textContent = generation.typescriptCode;
    }
    renderGeneratedEffectIdeaControls();
    effectIdeaPreviewEffect = compileRuntimeEffect(generation.runtimeCode);
    effectIdeaPreviewStart = 0;
    stopEffectIdeaPreview();
    previewGeneratedIdea();
    setEffectIdeaStatus("Preview ready. If it looks good, submit it for approval.", "success");
  } catch (error) {
    generatedIdea = null;
    effectIdeaPreviewParams = {};
    renderGeneratedEffectIdeaControls();
    effectIdeaPreviewEffect = null;
    const message = error instanceof Error ? error.message : "Generation failed. Please adjust the prompt and try again.";
    if (effectIdeaCode && error instanceof EffectIdeaApiError && error.rawResponse) {
      effectIdeaCode.textContent = error.rawResponse;
    }
    setEffectIdeaStatus(message, "error");
  } finally {
    effectIdeasGenerating = false;
    updateEffectIdeaButtons();
  }
}

async function submitCurrentEffectIdea(): Promise<void> {
  if (!generatedIdea || effectIdeasSubmitting) {
    return;
  }
  effectIdeasSubmitting = true;
  updateEffectIdeaButtons();
  setEffectIdeaStatus("Submitting for moderation…");
  try {
    await submitEffectIdea({
      name: generatedIdea.name,
      prompt: generatedIdeaPrompt,
      typescriptCode: generatedIdea.typescriptCode,
      runtimeCode: generatedIdea.runtimeCode,
      params: generatedIdea.params,
      docs: generatedIdea.docs
    });
    setEffectIdeaStatus("Submitted. Once approved, it will appear in effect selectors.", "success");
    setEffectIdeaModalVisible(false);
    await hydrateApprovedEffects();
  } catch {
    setEffectIdeaStatus("Submit failed. Please try again.", "error");
  } finally {
    effectIdeasSubmitting = false;
    updateEffectIdeaButtons();
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

function setDebugMobileSection(section: string): void {
  if (!debugOverlay) {
    return;
  }
  mobileDebugSection = getDebugPanelSection(section);
  debugOverlay.dataset.mobileSection = mobileDebugSection;
  debugTabButtons.forEach((button) => {
    const isActive = button.dataset.debugTab === mobileDebugSection;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
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
    if (debugSkipEndButton) {
      debugSkipEndButton.disabled = true;
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
  if (debugSkipEndButton) {
    debugSkipEndButton.disabled = audioPlayer.duration <= 0 || demoTime >= getEndSkipTime(demoTime, audioPlayer.duration);
  }
}

function createEffectSelector(): void {
  if (!debugEffectSelect) {
    return;
  }

  debugEffectSelect.innerHTML = "";

  getDebugEffectSelectorOptions(availableEffectNames).forEach((effectName) => {
    const option = document.createElement("option");
    option.value = effectName;
    option.textContent = effectName;
    debugEffectSelect.appendChild(option);
  });

  debugEffectSelect.addEventListener("change", () => {
    const selection = getNextDebugEffectSelection(debugState.forcedEffect, debugEffectSelect.value);
    debugState.forcedEffect = selection.forcedEffect;
    if (selection.shouldReset && selection.forcedEffect) {
      effectRegistry[selection.forcedEffect]?.reset?.();
      setDebugMobileSection("effects");
    }
    updateEffectSelectorState();
  });

  updateEffectSelectorState();
}

function buildGeneratedEffectControls(params: GeneratedEffectParam[] | undefined): EffectParamControl[] {
  if (!params || params.length === 0) {
    return [];
  }
  return params.flatMap((param) => {
    if (!param.key || !param.label) {
      return [];
    }
    if (param.type === "select") {
      const options = (param.options ?? [])
        .filter((option) => option.value.trim().length > 0)
        .map((option) => ({
          value: option.value,
          label: option.label || option.value
        }));
      if (options.length === 0) {
        return [];
      }
      const defaultValue = typeof param.defaultValue === "string" && options.some((option) => option.value === param.defaultValue)
        ? param.defaultValue
        : options[0].value;
      return [{
        key: param.key,
        label: param.label,
        type: "select" as const,
        defaultValue,
        options
      }];
    }
    if (param.type === "toggle") {
      const defaultValue = Number(param.defaultValue) !== 0 ? 1 : 0;
      return [{
        key: param.key,
        label: param.label,
        type: "toggle" as const,
        defaultValue
      }];
    }
    return [{
      key: param.key,
      label: param.label,
      type: "number" as const,
      defaultValue: typeof param.defaultValue === "number" ? param.defaultValue : 0,
      min: param.min,
      max: param.max,
      step: param.step
    }];
  });
}

async function hydrateApprovedEffects(): Promise<void> {
  try {
    const approved = await fetchApprovedEffects();
    approved.forEach((entry) => {
      try {
        const runtimeEffect = compileRuntimeEffect(entry.runtimeCode);
        effectRegistry[entry.name] = runtimeEffect;
        registerRuntimeEffectManifest({
          key: entry.name,
          className: "GeneratedEffect",
          sourcePath: "generated/effectIdeas",
          createEffect: () => runtimeEffect,
          debug: {
            title: `${entry.name} Controls`,
            controls: buildGeneratedEffectControls(entry.params)
          },
          docs: {
            description: entry.docs?.description ?? "Community-generated effect created with the effect idea generator.",
            parameters: entry.docs?.parameters ?? "Parameter docs not provided for this generated effect.",
            catalogNote: "Generated via effect idea workflow."
          }
        });
        if (!debugState.effectParams[entry.name]) {
          debugState.effectParams[entry.name] = {};
        }
      } catch {
        // Ignore invalid generated effect code.
      }
    });
    availableEffectNames = Array.from(new Set([...getEffectRegistryKeys(), ...approved.map((entry) => entry.name)])).sort((a, b) => a.localeCompare(b));
    createEffectSelector();
  } catch {
    availableEffectNames = getEffectRegistryKeys();
  }
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


function getResolvedEffectParams(effectName: string, controls: EffectParamControl[]): Record<string, string | number> {
  const rawParams = controls.reduce<Record<string, string | number>>((params, control) => {
    params[control.key] = control.defaultValue;
    return params;
  }, {});
  const nextParams = coerceEffectParams(effectName, {
    ...rawParams,
    ...debugState.effectParams[effectName]
  });
  debugState.effectParams[effectName] = nextParams;
  return nextParams;
}

function setCopyStatus(message: string, isError = false): void {
  if (!debugEffectCopyStatus) {
    return;
  }
  debugEffectCopyStatus.textContent = message;
  debugEffectCopyStatus.classList.toggle("debug-error", isError);
}

async function copyCurrentEffectSettings(): Promise<void> {
  if (!debugState.forcedEffect) {
    return;
  }
  const config = getManifestDebugConfig(debugState.forcedEffect);
  if (!config) {
    return;
  }
  const payload = formatEffectSettingsForTimeline(
    debugState.forcedEffect,
    getResolvedEffectParams(debugState.forcedEffect, config.controls)
  );
  try {
    await navigator.clipboard.writeText(payload);
    setCopyStatus("Copied timeline JSON.");
  } catch {
    setCopyStatus("Clipboard blocked. Copy failed.", true);
  }
}

function renderEffectPanel(effectName: string): void {
  if (!debugEffectPanel || !debugEffectControls || !debugEffectTitle || !debugEffectEmpty) {
    return;
  }
  const config = getManifestDebugConfig(effectName);
  if (!config) {
    return;
  }
  debugEffectTitle.textContent = config.title;
  debugEffectControls.innerHTML = "";
  setCopyStatus("");
  if (debugEffectCopyButton) {
    debugEffectCopyButton.disabled = false;
  }
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
  if (debugEffectCopyButton) {
    debugEffectCopyButton.disabled = !visible;
  }
  if (!visible) {
    setCopyStatus("");
  }
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

if (!releaseMode && debugFramingSelect) {
  debugFramingSelect.addEventListener("change", () => {
    debugState.framingOverride = (debugFramingSelect.value as FramingOverride) ?? "auto";
  });
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

if (!releaseMode && debugEffectCopyButton) {
  debugEffectCopyButton.addEventListener("click", () => {
    void copyCurrentEffectSettings();
  });
}

if (!releaseMode && debugSkipIntroButton) {
  debugSkipIntroButton.addEventListener("click", () => {
    if (!audioPlayer || !timeline || !introConfig) {
      return;
    }
    const targetTime = getIntroSkipTime(introConfig.end, timeline.getAudioOffset(), audioPlayer.currentTime);
    audioPlayer.seek(targetTime);
    if (!playbackSyncSuppressBroadcast) {
      playbackSync.broadcastTransport("seek", targetTime);
    }
  });
}

if (!releaseMode && debugSkipSecondHalfButton) {
  debugSkipSecondHalfButton.addEventListener("click", () => {
    if (!audioPlayer || !timeline) {
      return;
    }
    const targetTime = getSecondHalfSkipTime(SECOND_HALF_START, timeline.getAudioOffset(), audioPlayer.currentTime);
    audioPlayer.seek(targetTime);
    if (!playbackSyncSuppressBroadcast) {
      playbackSync.broadcastTransport("seek", targetTime);
    }
  });
}

if (!releaseMode && debugSkipBackButton) {
  debugSkipBackButton.addEventListener("click", () => {
    if (!audioPlayer) {
      return;
    }
    const targetTime = getRelativeSeekTime(audioPlayer.currentTime, -10, audioPlayer.duration);
    audioPlayer.seek(targetTime);
    if (!playbackSyncSuppressBroadcast) {
      playbackSync.broadcastTransport("seek", targetTime);
    }
  });
}

if (!releaseMode && debugSkipForwardButton) {
  debugSkipForwardButton.addEventListener("click", () => {
    if (!audioPlayer) {
      return;
    }
    const targetTime = getRelativeSeekTime(audioPlayer.currentTime, 10, audioPlayer.duration);
    audioPlayer.seek(targetTime);
    if (!playbackSyncSuppressBroadcast) {
      playbackSync.broadcastTransport("seek", targetTime);
    }
  });
}

if (!releaseMode && debugSkipEndButton) {
  debugSkipEndButton.addEventListener("click", () => {
    if (!audioPlayer) {
      return;
    }
    const targetTime = getEndSkipTime(audioPlayer.currentTime, audioPlayer.duration);
    audioPlayer.seek(targetTime);
    if (!playbackSyncSuppressBroadcast) {
      playbackSync.broadcastTransport("seek", targetTime);
    }
  });
}

if (!releaseMode) {
  setDebugMobileSection("transport");
  setDebugOverlayVisible(false);
  updateDebugSkipButtonState(null);
  void (async () => {
    await hydrateApprovedEffects();
    createEffectSelector();
    if (!editorRoot) {
      return;
    }
    createEditorRoot({
      container: editorRoot,
      effectNames: availableEffectNames,
      applyTimeline: applyRawTimeline,
      play: async () => {
        if (!audioPlayer) {
          await startDemo();
          return;
        }
        await audioPlayer.play();
        if (!playbackSyncSuppressBroadcast) {
          playbackSync.broadcastTransport("play");
        }
      },
      pause: () => {
        audioPlayer?.pause();
        if (!playbackSyncSuppressBroadcast) {
          playbackSync.broadcastTransport("pause");
        }
      },
      seek: (time: number) => {
        audioPlayer?.seek(time);
        if (!playbackSyncSuppressBroadcast) {
          playbackSync.broadcastTransport("seek", time);
        }
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
  })();
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
  setDoodleModalVisible(false);
  setEffectIdeaModalVisible(false);
  setOverlay("Loading…", true, false, "status");

  try {
    const config = pendingConfig ?? (await loadConfig("/timeline.release.json"));
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
    if (!playbackSyncSuppressBroadcast) {
      playbackSync.broadcastTransport("start");
    }
    renderer.reset();
    isRunning = true;
    lastDemoTime = audioPlayer.currentTime + timeline.getAudioOffset();
    lastFrameTimestamp = performance.now();
    setOverlay("", false, false, "status");
    if (!releaseMode) {
      updateDebugSkipButtonState(lastDemoTime);
    }

    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(loop);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    setOverlay(`Error: ${message}`, true, true, "start");
  }
}

async function restartDemo(): Promise<void> {
  if (!audioPlayer || !timeline) {
    await startDemo();
    return;
  }
  setDoodleModalVisible(false);
  setEffectIdeaModalVisible(false);
  await audioPlayer.restart();
  if (!playbackSyncSuppressBroadcast) {
    playbackSync.broadcastTransport("restart");
  }
  renderer.reset();
  lastDemoTime = audioPlayer.currentTime + timeline.getAudioOffset();
  lastFrameTimestamp = performance.now();
  if (!releaseMode) {
    updateDebugSkipButtonState(lastDemoTime);
  }
  setOverlay("", false, false, "status");
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
    const effectParamOverrides = debugState.forcedEffect
      ? (debugState.effectParams[debugState.forcedEffect] as Record<string, number> | null)
      : null;
    const eraOverride = debugState.eraOverride;
    const debugRenderSelection = buildDebugRenderSelection({
      section: state.section,
      transition: state.transition,
      textCues: state.activeTextCues,
      forcedEffect: debugState.forcedEffect,
      effectParams: effectParamOverrides,
      transitionOverride: debugState.transitionOverride
    });
    const sectionOverride = applyEraOverride(debugRenderSelection.section, eraOverride);
    const transitionOverrideWithEra = applyEraOverrideToTransition(debugRenderSelection.transition, eraOverride);
    const explosionTime =
      !debugRenderSelection.isolateEffect && sectionOverride.era === "future" ? demoTime - sectionOverride.start : -1;
    const explosionShake = getExplosionShake(explosionTime);

    renderer.render({
      ctx,
      width: canvas.width,
      height: canvas.height,
      time: demoTime,
      delta,
      section: sectionOverride,
      transition: transitionOverrideWithEra,
      textCues: debugRenderSelection.textCues,
      audio: audioFeatures,
      monochromeOverride: debugState.monochromeOverride,
      screenShake: explosionShake,
      framingOverride: debugState.framingOverride
    });
    if (!debugRenderSelection.isolateEffect) {
      renderExplosion(ctx, canvas.width, canvas.height, explosionTime, explosionState, explosionShake);
    }
  }

  debugTimestamp.textContent = formatTimestamp(demoTime);
  if (debugWebglStatus) {
    debugWebglStatus.textContent = getWebGLStatusLabel();
  }
  if (debugFramingState) {
    const framing = renderer.getCurrentFramingState();
    if (framing) {
      const fitAlignDebug = renderer.getCurrentFitAlignDebug();
      const layerSummary = fitAlignDebug ? ` layers=${fitAlignDebug.layerFitAligns.length}` : "";
      const alignSummary = fitAlignDebug
        ? ` base=${fitAlignDebug.sectionFitAlign}${fitAlignDebug.layerFitAligns.length > 0 ? ` [${fitAlignDebug.layerFitAligns.join(",")}]` : ""}`
        : "";
      debugFramingState.textContent = `${framing.mode} s=${framing.present.scale.toFixed(2)} safe=[${Math.round(framing.safe.x)},${Math.round(framing.safe.y)},${Math.round(framing.safe.w)},${Math.round(framing.safe.h)}]${layerSummary}${alignSummary ? ` ${alignSummary}` : ""}`;
    }
  }
  if (!releaseMode) {
    updateDebugSkipButtonState(demoTime);
  }
  editorController?.updatePlayback(demoTime, !audioPlayer.paused);
  editorController?.updatePreview(canvas);

  if (audioPlayer.ended) {
    isRunning = false;
    setOverlay("THE END", true, false, "end");
    setShareStatus("Restart, add a doodle, or share the demo.");
    return;
  }

  if (now - lastPlaybackSyncStateSentAt >= 120) {
    playbackSync.broadcastState({ playing: !audioPlayer.paused, time: audioPlayer.currentTime });
    lastPlaybackSyncStateSentAt = now;
  }
  animationFrame = requestAnimationFrame(loop);
}

overlay.addEventListener("click", () => {
  if (overlayMode !== "start") {
    return;
  }
  void startDemo();
});

if (overlayShareButton) {
  overlayShareButton.addEventListener("click", (event) => {
    event.stopPropagation();
    void shareDemo();
  });
}

if (overlayStartButton) {
  overlayStartButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (overlayMode !== "start") {
      return;
    }
    void startDemo();
  });
}

if (overlayRestartButton) {
  overlayRestartButton.addEventListener("click", (event) => {
    event.stopPropagation();
    void restartDemo();
  });
}

if (addDoodleButton) {
  addDoodleButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setDoodleModalVisible(true);
  });
}

if (addEffectIdeaButton) {
  addEffectIdeaButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setEffectIdeaModalVisible(true);
  });
}

if (shareCopyButton) {
  shareCopyButton.addEventListener("click", (event) => {
    event.stopPropagation();
    void copyShareLink();
  });
}

if (sharePanel) {
  sharePanel.addEventListener("click", (event) => {
    event.stopPropagation();
  });
}

[shareLinkedIn, shareX, shareFacebook, shareReddit, shareEmail].forEach((anchor) => {
  anchor?.addEventListener("click", (event) => {
    event.stopPropagation();
    setShareStatus("Sharing link opened in a new tab.");
  });
});

doodleColorButtons.forEach((button) => {
  button.style.setProperty("--doodle-swatch", normalizeDoodleBrushColor(button.dataset.doodleColor));
  button.addEventListener("click", () => {
    doodleBrushColor = normalizeDoodleBrushColor(button.dataset.doodleColor);
    applyDoodleBrush();
    updateDoodleBrushControls();
    setDoodleStatus(`Brush colour set to ${button.getAttribute("aria-label")?.replace(/ brush$/u, "") ?? "custom"}.`);
  });
});

if (doodleBrushSizeInput) {
  doodleBrushSizeInput.addEventListener("input", () => {
    doodleBrushSize = clampDoodleBrushSize(Number(doodleBrushSizeInput.value));
    applyDoodleBrush();
    updateDoodleBrushControls();
    setDoodleStatus(`Brush size set to ${doodleBrushSize}px.`);
  });
}

if (doodleCanvas && doodleCtx) {
  doodleCanvas.addEventListener("pointerdown", (event) => {
    const point = getDoodleCanvasPoint(event);
    if (!point) {
      return;
    }
    applyDoodleBrush();
    doodleDrawing = true;
    doodlePointerId = event.pointerId;
    doodleCanvas.setPointerCapture(event.pointerId);
    doodleCtx.beginPath();
    doodleCtx.moveTo(point.x, point.y);
    doodleCtx.lineTo(point.x + 0.01, point.y + 0.01);
    doodleCtx.stroke();
    doodleHasStroke = true;
    updateDoodleSubmitState();
    setDoodleStatus("Nice. Keep drawing, or submit when you're done.");
  });

  doodleCanvas.addEventListener("pointermove", (event) => {
    if (!doodleDrawing || doodlePointerId !== event.pointerId) {
      return;
    }
    const point = getDoodleCanvasPoint(event);
    if (!point) {
      return;
    }
    doodleCtx.lineTo(point.x, point.y);
    doodleCtx.stroke();
  });

  const finishDrawing = (event: PointerEvent) => {
    if (doodlePointerId !== event.pointerId) {
      return;
    }
    doodleDrawing = false;
    doodlePointerId = null;
    if (doodleCanvas.hasPointerCapture(event.pointerId)) {
      doodleCanvas.releasePointerCapture(event.pointerId);
    }
  };

  doodleCanvas.addEventListener("pointerup", finishDrawing);
  doodleCanvas.addEventListener("pointercancel", finishDrawing);
}

if (doodleClearButton) {
  doodleClearButton.addEventListener("click", () => {
    resetDoodleCanvas();
  });
}

if (doodleCancelButton) {
  doodleCancelButton.addEventListener("click", () => {
    setDoodleModalVisible(false);
  });
}

if (doodleSubmitButton) {
  doodleSubmitButton.addEventListener("click", () => {
    void submitCurrentDoodle();
  });
}

if (doodleModal) {
  doodleModal.addEventListener("click", (event) => {
    if (event.target === doodleModal) {
      setDoodleModalVisible(false);
    }
  });
}

if (effectIdeaCancelButton) {
  effectIdeaCancelButton.addEventListener("click", () => {
    setEffectIdeaModalVisible(false);
  });
}

if (effectIdeaGenerateButton) {
  effectIdeaGenerateButton.addEventListener("click", () => {
    void generateCurrentEffectIdea();
  });
}

if (effectIdeaSubmitButton) {
  effectIdeaSubmitButton.addEventListener("click", () => {
    void submitCurrentEffectIdea();
  });
}

if (effectIdeaSetDefaultsButton) {
  effectIdeaSetDefaultsButton.addEventListener("click", () => {
    if (!generatedIdea?.params || generatedIdea.params.length === 0) {
      return;
    }
    const updatedParams = applyCurrentValuesAsGeneratedDefaults(generatedIdea.params, effectIdeaPreviewParams);
    generatedIdea = { ...generatedIdea, params: updatedParams };
    effectIdeaPreviewParams = getGeneratedEffectDefaultParams(updatedParams);
    renderGeneratedEffectIdeaControls();
    updateEffectIdeaButtons();
    setEffectIdeaStatus("Current preview values saved as submitted defaults.", "success");
  });
}

if (effectIdeaRandomizeButton) {
  effectIdeaRandomizeButton.addEventListener("click", () => {
    if (!generatedIdea?.params || generatedIdea.params.length === 0) {
      return;
    }
    effectIdeaPreviewParams = getRandomGeneratedEffectParams(generatedIdea.params);
    renderGeneratedEffectIdeaControls();
    setEffectIdeaStatus("Randomized all generated params for inspiration.", "success");
  });
}

if (effectIdeaModal) {
  effectIdeaModal.addEventListener("click", (event) => {
    if (event.target === effectIdeaModal) {
      setEffectIdeaModalVisible(false);
    }
  });
}

window.addEventListener("keydown", (event) => {
  if (!shouldHandleGlobalShortcut(event.target)) {
    return;
  }
  if (event.key === "Escape" && doodleModal && !doodleModal.classList.contains("hidden")) {
    setDoodleModalVisible(false);
    return;
  }
  if (event.key === "Escape" && effectIdeaModal && !effectIdeaModal.classList.contains("hidden")) {
    setEffectIdeaModalVisible(false);
    return;
  }
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

window.addEventListener("beforeunload", () => {
  playbackSync.destroy();
});

if (!releaseMode && mobileControls && mobileDebugButton) {
  mobileDebugButton.addEventListener("click", () => {
    toggleDebugOverlay();
  });
}

if (!releaseMode && debugTabButtons.length > 0) {
  debugTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setDebugMobileSection(button.dataset.debugTab ?? "transport");
    });
  });
}

if (mobileControls && mobileFullscreenButton) {
  mobileFullscreenButton.addEventListener("click", () => {
    toggleFullscreen();
  });
}
