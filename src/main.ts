import "./style.css";
import { IntroConfig, TransitionType, loadConfig } from "./config/loadConfig";
import { AudioPlayer, AudioFeatures } from "./audio/audioPlayer";
import { Timeline } from "./timeline/timeline";
import { Renderer } from "./renderer/renderer";
import { effectRegistry } from "./renderer/effects";
import { TerminalIntroRenderer } from "./renderer/intro/terminalIntro";
import { createExplosionState, getExplosionShake, renderExplosion } from "./renderer/overlays/explosion";
import { getFullscreenAction, getIntroSkipTime, getNextDebugOverlayVisibility, getSecondHalfSkipTime } from "./controls";
import { clamp } from "./util/math";
import { createScrubberController } from "./debug/tools/scrubber";
import { createTextCueEditor } from "./debug/tools/textCueEditor";
import { formatTimestamp } from "./debug/time";

const canvas = document.querySelector<HTMLCanvasElement>("#demo");
const overlay = document.querySelector<HTMLDivElement>("#start-overlay");
const overlayText = overlay?.querySelector<HTMLDivElement>(".start-text");
const debugOverlay = document.querySelector<HTMLDivElement>("#debug-overlay");
const debugTimestamp = document.querySelector<HTMLSpanElement>("#debug-timestamp");
const debugTransitionSelect = document.querySelector<HTMLSelectElement>("#debug-transition");
const debugEffectsContainer = document.querySelector<HTMLDivElement>("#debug-effects");
const debugMonochromeToggle = document.querySelector<HTMLInputElement>("#debug-monochrome");
const debugSkipIntroButton = document.querySelector<HTMLButtonElement>("#debug-skip-intro");
const debugSkipSecondHalfButton = document.querySelector<HTMLButtonElement>("#debug-skip-second-half");
const debugScrubSection = document.querySelector<HTMLDivElement>("#debug-scrub");
const debugTextSection = document.querySelector<HTMLDivElement>("#debug-text");
const mobileControls = document.querySelector<HTMLDivElement>("#mobile-controls");
const mobileDebugButton = document.querySelector<HTMLButtonElement>("#mobile-debug");
const mobileFullscreenButton = document.querySelector<HTMLButtonElement>("#mobile-fullscreen");

if (
  !canvas ||
  !overlay ||
  !overlayText ||
  !debugOverlay ||
  !debugTimestamp ||
  !debugTransitionSelect ||
  !debugScrubSection ||
  !debugTextSection
) {
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
let debugTime = 0;
const scrubber = createScrubberController(debugScrubSection, {
  onSeek: (time) => seekDemoTime(time),
  onTogglePlay: () => togglePlayPause(),
  onNudge: (delta) => seekDemoTime(debugTime + delta),
  onSnap: (time) => seekDemoTime(time)
});
let textCueEditor: ReturnType<typeof createTextCueEditor> | null = null;
const debugState = {
  enabled: false,
  forcedEffect: null as string | null,
  transitionOverride: null as TransitionType | null,
  monochromeOverride: null as boolean | null
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

function setDebugOverlayVisible(visible: boolean): void {
  debugState.enabled = visible;
  debugOverlay.classList.toggle("hidden", !visible);
  scrubber.setEnabled(visible && Boolean(audioPlayer && timeline));
  textCueEditor?.setEnabled(visible && Boolean(audioPlayer && timeline));
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
    debugState.transitionOverride = value === "auto" ? null : (value as TransitionType);
  });
}

if (debugMonochromeToggle) {
  debugMonochromeToggle.addEventListener("change", () => {
    debugState.monochromeOverride = debugMonochromeToggle.checked ? true : null;
  });
}

if (debugSkipIntroButton) {
  debugSkipIntroButton.addEventListener("click", () => {
    if (!audioPlayer || !timeline || !introConfig) {
      return;
    }
    const targetTime = getIntroSkipTime(introConfig.end, timeline.getAudioOffset(), audioPlayer.currentTime);
    seekDemoTime(targetTime + timeline.getAudioOffset());
  });
}

if (debugSkipSecondHalfButton) {
  debugSkipSecondHalfButton.addEventListener("click", () => {
    if (!audioPlayer || !timeline) {
      return;
    }
    const targetTime = getSecondHalfSkipTime(SECOND_HALF_START, timeline.getAudioOffset(), audioPlayer.currentTime);
    seekDemoTime(targetTime + timeline.getAudioOffset());
  });
}

createEffectButtons();
setDebugOverlayVisible(false);
updateDebugSkipButtonState(null);

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
    debugTime = lastDemoTime;
    scrubber.setSections(timeline.getSections());
    if (!textCueEditor) {
      textCueEditor = createTextCueEditor(debugTextSection, config.textCues);
    }
    setDebugOverlayVisible(debugState.enabled);
    setOverlay("", false);
    updateDebugSkipButtonState(lastDemoTime);

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
  debugTime = lastDemoTime;
  updateDebugSkipButtonState(lastDemoTime);
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

  const audioTime = audioPlayer.currentTime;
  const isPlaying = !audioPlayer.paused;
  const demoTime = isPlaying ? audioTime + timeline.getAudioOffset() : debugTime;
  if (isPlaying) {
    debugTime = demoTime;
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
    const selectedCue = textCueEditor?.getSelectedCue() ?? null;
    if (debugState.enabled && selectedCue) {
      renderer.drawTextCueDebug(
        ctx,
        canvas.width,
        canvas.height,
        selectedCue,
        demoTime,
        audioFeatures,
        true,
        explosionShake
      );
    }
  }

  debugTimestamp.textContent = formatTimestamp(demoTime);
  scrubber.update({
    demoTime,
    audioTime,
    audioOffset: timeline.getAudioOffset(),
    isPlaying,
    demoEndTime: getDemoEndTime()
  });
  textCueEditor?.update({
    time: demoTime,
    activeCues: state.activeTextCues
  });
  updateDebugSkipButtonState(demoTime);

  if (audioPlayer.ended) {
    isRunning = false;
    setOverlay("THE END (press R to restart)", true);
    return;
  }

  animationFrame = requestAnimationFrame(loop);
}

function getDemoEndTime(): number {
  if (!timeline) {
    return 0;
  }
  const duration = timeline.getDurationFallback();
  return Math.max(0, duration + timeline.getAudioOffset());
}

function seekDemoTime(targetTime: number): void {
  if (!audioPlayer || !timeline) {
    return;
  }
  const maxTime = getDemoEndTime();
  debugTime = clamp(targetTime, 0, maxTime);
  const audioTarget = debugTime - timeline.getAudioOffset();
  audioPlayer.seek(audioTarget);
  lastDemoTime = debugTime;
}

function togglePlayPause(): void {
  if (!audioPlayer || !timeline) {
    return;
  }
  if (audioPlayer.paused) {
    const audioTarget = debugTime - timeline.getAudioOffset();
    audioPlayer.seek(audioTarget);
    audioPlayer.play();
  } else {
    audioPlayer.pause();
    debugTime = audioPlayer.currentTime + timeline.getAudioOffset();
  }
}

function handleCanvasPick(event: PointerEvent): void {
  if (!debugState.enabled || !textCueEditor || !textCueEditor.isPickMode()) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const canvasX = (event.clientX - rect.left) * scaleX;
  const canvasY = (event.clientY - rect.top) * scaleY;
  const contentRect = renderer.getContentRect(canvas.width, canvas.height);
  textCueEditor.handleCanvasPick(canvasX, canvasY, contentRect);
}

overlay.addEventListener("click", () => {
  startDemo();
});

canvas.addEventListener("pointerdown", (event) => {
  handleCanvasPick(event);
});

window.addEventListener("keydown", (event) => {
  if (debugState.enabled && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
    const target = event.target as HTMLElement | null;
    const isTypingField =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement;
    if (!isTypingField) {
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      const step = event.shiftKey ? 5 : event.altKey ? 0.1 : 1;
      seekDemoTime(debugTime + direction * step);
      event.preventDefault();
    }
  }
  if (event.key.toLowerCase() === "d") {
    toggleDebugOverlay();
  }
  if (event.key.toLowerCase() === "r") {
    restartDemo();
  }
  if (event.key.toLowerCase() === "f" && document.fullscreenEnabled) {
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
