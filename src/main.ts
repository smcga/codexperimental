import "./style.css";
import { IntroConfig, TransitionType, loadConfig } from "./config/loadConfig";
import { AudioPlayer, AudioFeatures } from "./audio/audioPlayer";
import { Timeline } from "./timeline/timeline";
import { Renderer } from "./renderer/renderer";
import { effectRegistry } from "./renderer/effects";
import { DEFAULT_FLYOVER_PARAMS, FlyoverDebugParams, coerceFlyoverParams } from "./renderer/debug/flyoverDebug";
import { TerminalIntroRenderer } from "./renderer/intro/terminalIntro";
import { createExplosionState, getExplosionShake, renderExplosion } from "./renderer/overlays/explosion";
import { getFullscreenAction, getIntroSkipTime, getNextDebugOverlayVisibility, getSecondHalfSkipTime } from "./controls";
import { shouldShowFlyoverPanel } from "./debug/debugPanel";

const canvas = document.querySelector<HTMLCanvasElement>("#demo");
const overlay = document.querySelector<HTMLDivElement>("#start-overlay");
const overlayText = overlay?.querySelector<HTMLDivElement>(".start-text");
const debugOverlay = document.querySelector<HTMLDivElement>("#debug-overlay");
const debugTimestamp = document.querySelector<HTMLSpanElement>("#debug-timestamp");
const debugTransitionSelect = document.querySelector<HTMLSelectElement>("#debug-transition");
const debugEffectsContainer = document.querySelector<HTMLDivElement>("#debug-effects");
const debugFlyoverPanel = document.querySelector<HTMLDivElement>("#debug-flyover-panel");
const debugMonochromeToggle = document.querySelector<HTMLInputElement>("#debug-monochrome");
const debugSkipIntroButton = document.querySelector<HTMLButtonElement>("#debug-skip-intro");
const debugSkipSecondHalfButton = document.querySelector<HTMLButtonElement>("#debug-skip-second-half");
const mobileControls = document.querySelector<HTMLDivElement>("#mobile-controls");
const mobileDebugButton = document.querySelector<HTMLButtonElement>("#mobile-debug");
const mobileFullscreenButton = document.querySelector<HTMLButtonElement>("#mobile-fullscreen");

const releaseMode = new URLSearchParams(window.location.search).get("release") === "1";

if (!canvas || !overlay || !overlayText || !debugOverlay || !debugTimestamp || !debugTransitionSelect) {
  throw new Error("Missing canvas or overlay element");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Unable to create 2D context");
}

const renderer = new Renderer();
const introRenderer = new TerminalIntroRenderer();
const explosionState = createExplosionState();
let audioPlayer: AudioPlayer | null = null;
let timeline: Timeline | null = null;
let introConfig: IntroConfig | null = null;
let animationFrame = 0;
let lastDemoTime = 0;
let isRunning = false;
const debugState = {
  enabled: false,
  forcedEffect: null as string | null,
  transitionOverride: null as TransitionType | null,
  monochromeOverride: null as boolean | null,
  flyoverParams: { ...DEFAULT_FLYOVER_PARAMS }
};

function resize(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);

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
    updateFlyoverPanelVisibility();
    return;
  }
  debugState.enabled = visible;
  debugOverlay.classList.toggle("hidden", !visible);
  updateFlyoverPanelVisibility();
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
    return;
  }
  debugSkipIntroButton.disabled = demoTime >= introConfig.end;
  if (debugSkipSecondHalfButton) {
    debugSkipSecondHalfButton.disabled = demoTime >= SECOND_HALF_START;
  }
}

function createEffectButtons(): void {
  if (!debugEffectsContainer) {
    return;
  }
  debugEffectsContainer.innerHTML = "";
  const timelineButton = document.createElement("button");
  timelineButton.type = "button";
  timelineButton.textContent = "timeline";
  timelineButton.addEventListener("click", () => {
    debugState.forcedEffect = null;
    updateEffectButtonStates();
  });
  debugEffectsContainer.appendChild(timelineButton);

  Object.keys(effectRegistry).forEach((effectName) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = effectName;
    button.addEventListener("click", () => {
      debugState.forcedEffect = effectName;
      updateEffectButtonStates();
    });
    debugEffectsContainer.appendChild(button);
  });
  updateEffectButtonStates();
}

const flyoverInputs = debugFlyoverPanel?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-flyover-param]");

function syncFlyoverInputs(params: FlyoverDebugParams): void {
  if (!flyoverInputs) {
    return;
  }
  flyoverInputs.forEach((input) => {
    const key = input.dataset.flyoverParam as keyof FlyoverDebugParams | undefined;
    if (!key) {
      return;
    }
    if (input instanceof HTMLSelectElement) {
      input.value = params[key];
    } else {
      input.value = String(params[key]);
    }
  });
}

function updateFlyoverPanelVisibility(): void {
  if (!debugFlyoverPanel) {
    return;
  }
  const visible = shouldShowFlyoverPanel(debugState.enabled, debugState.forcedEffect);
  debugFlyoverPanel.classList.toggle("hidden", !visible);
  if (visible) {
    syncFlyoverInputs(debugState.flyoverParams);
  }
}

function updateEffectButtonStates(): void {
  if (!debugEffectsContainer) {
    return;
  }
  const buttons = Array.from(debugEffectsContainer.querySelectorAll<HTMLButtonElement>("button"));
  buttons.forEach((button) => {
    const isActive =
      (button.textContent === "timeline" && debugState.forcedEffect === null) ||
      button.textContent === debugState.forcedEffect;
    button.classList.toggle("active", isActive);
  });
  updateFlyoverPanelVisibility();
}

if (!releaseMode && debugTransitionSelect) {
  debugTransitionSelect.addEventListener("change", () => {
    const value = debugTransitionSelect.value;
    debugState.transitionOverride = value === "auto" ? null : (value as TransitionType);
  });
}

if (!releaseMode && debugMonochromeToggle) {
  debugMonochromeToggle.addEventListener("change", () => {
    debugState.monochromeOverride = debugMonochromeToggle.checked ? true : null;
  });
}

if (!releaseMode && flyoverInputs && debugFlyoverPanel) {
  syncFlyoverInputs(debugState.flyoverParams);
  flyoverInputs.forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.flyoverParam as keyof FlyoverDebugParams | undefined;
      if (!key) {
        return;
      }
      const nextValue =
        input instanceof HTMLSelectElement ? input.value : Number.parseFloat(input.value);
      debugState.flyoverParams = coerceFlyoverParams({
        ...debugState.flyoverParams,
        [key]: nextValue
      });
      syncFlyoverInputs(debugState.flyoverParams);
    });
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

if (!releaseMode) {
  createEffectButtons();
  setDebugOverlayVisible(false);
  updateDebugSkipButtonState(null);
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
    const config = await loadConfig(releaseMode ? "/timeline.release.json" : "/timeline.json");
    introConfig = config.intro;
    if (audioPlayer) {
      audioPlayer.destroy();
    }
    audioPlayer = new AudioPlayer(config.audio.src);
    await audioPlayer.load();

    timeline = new Timeline(config);
    timeline.setAudioDuration(audioPlayer.duration);

    await audioPlayer.play();
    renderer.reset();
    isRunning = true;
    lastDemoTime = audioPlayer.currentTime + timeline.getAudioOffset();
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

  const demoTime = audioPlayer.currentTime + timeline.getAudioOffset();
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
    const flyoverParamOverrides =
      debugState.forcedEffect === "flyover"
        ? (debugState.flyoverParams as unknown as Record<string, number>)
        : null;
    let sectionOverride = debugState.forcedEffect
      ? { ...state.section, effect: debugState.forcedEffect }
      : state.section;
    if (flyoverParamOverrides) {
      sectionOverride = { ...sectionOverride, params: { ...sectionOverride.params, ...flyoverParamOverrides } };
    }
    const transitionOverride = state.transition
      ? {
          ...state.transition,
          to: debugState.forcedEffect
            ? {
                ...state.transition.to,
                effect: debugState.forcedEffect,
                params: flyoverParamOverrides
                  ? { ...state.transition.to.params, ...flyoverParamOverrides }
                  : state.transition.to.params
              }
            : state.transition.to,
          type: debugState.transitionOverride ?? state.transition.type
        }
      : undefined;
    const explosionTime = state.section.era === "future" ? demoTime - state.section.start : -1;
    const explosionShake = getExplosionShake(explosionTime);

    renderer.render({
      ctx,
      width: canvas.width,
      height: canvas.height,
      time: demoTime,
      delta,
      section: sectionOverride,
      transition: transitionOverride,
      textCues: state.activeTextCues,
      audio: audioFeatures,
      monochromeOverride: debugState.monochromeOverride,
      screenShake: explosionShake
    });
    renderExplosion(ctx, canvas.width, canvas.height, explosionTime, explosionState, explosionShake);
  }

  debugTimestamp.textContent = formatTimestamp(demoTime);
  if (!releaseMode) {
    updateDebugSkipButtonState(demoTime);
  }

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
