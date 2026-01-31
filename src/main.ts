import "./style.css";
import { IntroConfig, loadConfig } from "./config/loadConfig";
import { AudioPlayer, AudioFeatures } from "./audio/audioPlayer";
import { Timeline } from "./timeline/timeline";
import { Renderer } from "./renderer/renderer";
import { effectRegistry } from "./renderer/effects";
import { TerminalIntroRenderer } from "./renderer/intro/terminalIntro";
import { createExplosionState, getExplosionShake, renderExplosion } from "./renderer/overlays/explosion";
import { getFullscreenAction, getNextDebugOverlayVisibility } from "./controls";

const canvas = document.querySelector<HTMLCanvasElement>("#demo");
const overlay = document.querySelector<HTMLDivElement>("#start-overlay");
const overlayText = overlay?.querySelector<HTMLDivElement>(".start-text");
const debugOverlay = document.querySelector<HTMLDivElement>("#debug-overlay");
const debugTimestamp = document.querySelector<HTMLSpanElement>("#debug-timestamp");
const debugTransitionSelect = document.querySelector<HTMLSelectElement>("#debug-transition");
const debugEffectsContainer = document.querySelector<HTMLDivElement>("#debug-effects");
const debugMonochromeToggle = document.querySelector<HTMLInputElement>("#debug-monochrome");
const mobileControls = document.querySelector<HTMLDivElement>("#mobile-controls");
const mobileDebugButton = document.querySelector<HTMLButtonElement>("#mobile-debug");
const mobileFullscreenButton = document.querySelector<HTMLButtonElement>("#mobile-fullscreen");
const fullscreenFallbackClass = "fullscreen-fallback";

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
  transitionOverride: null as "fade" | "wipe" | null,
  monochromeOverride: null as boolean | null
};
type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
};

type WebkitCanvas = HTMLCanvasElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
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
  debugState.enabled = visible;
  debugOverlay.classList.toggle("hidden", !visible);
}

function toggleDebugOverlay(): void {
  setDebugOverlayVisible(getNextDebugOverlayVisibility(debugState.enabled));
}

function isFullscreenFallbackActive(): boolean {
  return document.body.classList.contains(fullscreenFallbackClass);
}

function setFullscreenFallback(active: boolean): void {
  document.body.classList.toggle(fullscreenFallbackClass, active);
  resize();
}

function toggleFullscreen(): void {
  const webkitDocument = document as WebkitDocument;
  const webkitCanvas = canvas as WebkitCanvas;
  const fullscreenElement = document.fullscreenElement ?? webkitDocument.webkitFullscreenElement ?? null;
  const hasNativeFullscreen =
    document.fullscreenEnabled && typeof canvas.requestFullscreen === "function";
  const hasWebkitFullscreen =
    typeof webkitCanvas.webkitRequestFullscreen === "function" &&
    (webkitDocument.webkitFullscreenEnabled ?? true);
  const fullscreenEnabled = hasNativeFullscreen || hasWebkitFullscreen;
  const action = getFullscreenAction(
    fullscreenEnabled,
    fullscreenElement,
    !fullscreenEnabled,
    isFullscreenFallbackActive()
  );
  if (action === "enter") {
    if (hasNativeFullscreen) {
      void canvas.requestFullscreen();
    } else if (webkitCanvas.webkitRequestFullscreen) {
      void webkitCanvas.webkitRequestFullscreen();
    }
  }
  if (action === "exit") {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (webkitDocument.webkitFullscreenElement) {
      void webkitDocument.webkitExitFullscreen?.();
    }
  }
  if (action === "enter-fallback") {
    setFullscreenFallback(true);
  }
  if (action === "exit-fallback") {
    setFullscreenFallback(false);
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
}

if (debugTransitionSelect) {
  debugTransitionSelect.addEventListener("change", () => {
    const value = debugTransitionSelect.value;
    debugState.transitionOverride = value === "auto" ? null : (value as "fade" | "wipe");
  });
}

if (debugMonochromeToggle) {
  debugMonochromeToggle.addEventListener("change", () => {
    debugState.monochromeOverride = debugMonochromeToggle.checked ? true : null;
  });
}

createEffectButtons();
setDebugOverlayVisible(false);

async function startDemo(): Promise<void> {
  if (isRunning) {
    return;
  }
  setOverlay("Loading…", true);

  try {
    const config = await loadConfig();
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
  setOverlay("", false);
  if (!isRunning) {
    isRunning = true;
    animationFrame = requestAnimationFrame(loop);
  }
}

function loop(): void {
  if (!audioPlayer || !timeline || !introConfig) {
    isRunning = false;
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
    const sectionOverride = debugState.forcedEffect
      ? { ...state.section, effect: debugState.forcedEffect }
      : state.section;
    const transitionOverride = state.transition
      ? {
          ...state.transition,
          to: debugState.forcedEffect ? { ...state.transition.to, effect: debugState.forcedEffect } : state.transition.to,
          type: debugState.transitionOverride ?? state.transition.type
        }
      : undefined;
    const explosionTime = demoTime - introConfig.end;
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
  if (event.key.toLowerCase() === "d") {
    toggleDebugOverlay();
  }
  if (event.key.toLowerCase() === "r") {
    restartDemo();
  }
  if (event.key.toLowerCase() === "f") {
    toggleFullscreen();
  }
});

if (mobileControls && mobileDebugButton) {
  mobileDebugButton.addEventListener("click", () => {
    toggleDebugOverlay();
  });
}

if (mobileControls && mobileFullscreenButton) {
  mobileFullscreenButton.addEventListener("click", () => {
    toggleFullscreen();
  });
}
