import "./style.css";
import { IntroConfig, TransitionType, loadConfig } from "./config/loadConfig";
import { AudioPlayer } from "./audio/audioPlayer";
import { AudioFeatures, AudioSource } from "./audio/audioSource";
import { MicAudioSource } from "./audio/micAudioSource";
import { Timeline } from "./timeline/timeline";
import { Renderer } from "./renderer/renderer";
import { effectRegistry } from "./renderer/effects";
import { coerceEffectParams, getEffectDebugConfig, getEffectDebugDefaults, EffectParamControl } from "./renderer/debug/effectDebug";
import { getWebGLStatusLabel } from "./renderer/effects/gl/webglStatus";
import { TerminalIntroRenderer } from "./renderer/intro/terminalIntro";
import { createExplosionState, getExplosionShake, renderExplosion } from "./renderer/overlays/explosion";
import { getFullscreenAction, getIntroSkipTime, getNextDebugOverlayVisibility, getSecondHalfSkipTime } from "./controls";
import { shouldShowEffectPanel } from "./debug/debugPanel";

const canvas = document.querySelector<HTMLCanvasElement>("#demo");
const overlay = document.querySelector<HTMLDivElement>("#start-overlay");
const overlayText = overlay?.querySelector<HTMLDivElement>(".start-text");
const micButton = overlay?.querySelector<HTMLButtonElement>("#mic-button");
const debugOverlay = document.querySelector<HTMLDivElement>("#debug-overlay");
const debugTimestamp = document.querySelector<HTMLSpanElement>("#debug-timestamp");
const debugWebglStatus = document.querySelector<HTMLSpanElement>("#debug-webgl-status");
const debugTransitionSelect = document.querySelector<HTMLSelectElement>("#debug-transition");
const debugEffectsContainer = document.querySelector<HTMLDivElement>("#debug-effects");
const debugEffectPanel = document.querySelector<HTMLDivElement>("#debug-effect-panel");
const debugEffectTitle = document.querySelector<HTMLDivElement>("#debug-effect-title");
const debugEffectControls = document.querySelector<HTMLDivElement>("#debug-effect-controls");
const debugEffectEmpty = document.querySelector<HTMLDivElement>("#debug-effect-empty");
const debugMonochromeToggle = document.querySelector<HTMLInputElement>("#debug-monochrome");
const debugSkipIntroButton = document.querySelector<HTMLButtonElement>("#debug-skip-intro");
const debugSkipSecondHalfButton = document.querySelector<HTMLButtonElement>("#debug-skip-second-half");
const mobileControls = document.querySelector<HTMLDivElement>("#mobile-controls");
const mobileDebugButton = document.querySelector<HTMLButtonElement>("#mobile-debug");
const mobileFullscreenButton = document.querySelector<HTMLButtonElement>("#mobile-fullscreen");
const micStatus = document.querySelector<HTMLDivElement>("#mic-status");

const searchParams = new URLSearchParams(window.location.search);
const releaseMode = searchParams.get("release") === "1";
const micMode = searchParams.get("mic") === "1";

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
let audioSource: AudioSource | null = null;
let micSource: MicAudioSource | null = null;
let timeline: Timeline | null = null;
let introConfig: IntroConfig | null = null;
let animationFrame = 0;
let lastDemoTime = 0;
let isRunning = false;
let micMessageTimeout: number | null = null;
const debugState = {
  enabled: false,
  forcedEffect: null as string | null,
  transitionOverride: null as TransitionType | null,
  monochromeOverride: null as boolean | null,
  effectParams: Object.fromEntries(
    Object.keys(effectRegistry).map((effectName) => [effectName, getEffectDebugDefaults(effectName)])
  )
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

function setMicStatus(message: string, show = true): void {
  if (!micStatus) {
    return;
  }
  micStatus.textContent = message;
  micStatus.classList.toggle("hidden", !show);
  if (micMessageTimeout) {
    window.clearTimeout(micMessageTimeout);
  }
  if (show) {
    micMessageTimeout = window.setTimeout(() => {
      micStatus.classList.add("hidden");
    }, 4000);
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

const SECOND_HALF_START = 150;

function updateDebugSkipButtonState(demoTime: number | null): void {
  if (!debugSkipIntroButton) {
    return;
  }
  const canControlAudio = audioPlayer && audioSource === audioPlayer;
  if (!canControlAudio || !timeline || !introConfig || demoTime === null) {
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
  updateEffectPanelVisibility();
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

if (!releaseMode && debugSkipIntroButton) {
  debugSkipIntroButton.addEventListener("click", () => {
    if (!audioPlayer || !timeline || !introConfig || audioSource !== audioPlayer) {
      return;
    }
    const targetTime = getIntroSkipTime(introConfig.end, timeline.getAudioOffset(), audioPlayer.currentTime);
    audioPlayer.seek(targetTime);
  });
}

if (!releaseMode && debugSkipSecondHalfButton) {
  debugSkipSecondHalfButton.addEventListener("click", () => {
    if (!audioPlayer || !timeline || audioSource !== audioPlayer) {
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

if (micMode) {
  setOverlay("Enable microphone to start", true);
  if (micButton) {
    micButton.classList.remove("hidden");
  }
} else if (micButton) {
  micButton.classList.add("hidden");
}

async function startDemo(options: { useMic?: boolean; forceRestart?: boolean } = {}): Promise<void> {
  if (isRunning && !options.forceRestart) {
    return;
  }
  setOverlay("Loading…", true);
  setMicStatus("", false);
  isRunning = false;

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

    if (options.useMic) {
      if (micSource) {
        micSource.stop?.();
      }
      micSource = new MicAudioSource();
      audioSource = micSource;
      void micSource.start().catch(async (error) => {
        console.error("Microphone unavailable", error);
        setMicStatus("Mic unavailable (permission denied).", true);
        if (!audioPlayer || !timeline) {
          return;
        }
        audioSource = audioPlayer;
        const targetTime = Math.max(0, lastDemoTime - timeline.getAudioOffset());
        audioPlayer.seek(targetTime);
        await audioPlayer.start();
        lastDemoTime = audioPlayer.currentTime + timeline.getAudioOffset();
        if (!releaseMode) {
          updateDebugSkipButtonState(lastDemoTime);
        }
      });
    } else {
      audioSource = audioPlayer;
      await audioPlayer.start();
    }

    renderer.reset();
    isRunning = true;
    const activeSource = audioSource;
    lastDemoTime = activeSource ? activeSource.getTimeSeconds() + timeline.getAudioOffset() : 0;
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
  if (!audioSource || !timeline) {
    await startDemo({ useMic: micMode });
    return;
  }
  if (audioSource === audioPlayer && audioPlayer) {
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
    return;
  }
  await startDemo({ useMic: micMode, forceRestart: true });
}

function loop(): void {
  if (!audioSource || !timeline || !introConfig) {
    isRunning = false;
    updateDebugSkipButtonState(null);
    return;
  }

  const demoTime = audioSource.getTimeSeconds() + timeline.getAudioOffset();
  const delta = Math.max(0, demoTime - lastDemoTime);
  lastDemoTime = demoTime;

  const audioFeatures: AudioFeatures = audioSource.getFeatures();
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
    let sectionOverride = debugState.forcedEffect
      ? { ...state.section, effect: debugState.forcedEffect }
      : state.section;
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
  if (debugWebglStatus) {
    debugWebglStatus.textContent = getWebGLStatusLabel();
  }
  if (!releaseMode) {
    updateDebugSkipButtonState(demoTime);
  }

  if (audioSource === audioPlayer && audioPlayer.ended) {
    isRunning = false;
    setOverlay("THE END (press R to restart)", true);
    return;
  }

  animationFrame = requestAnimationFrame(loop);
}

if (!micMode) {
  overlay.addEventListener("click", () => {
    startDemo();
  });
}

if (micMode && micButton) {
  micButton.addEventListener("click", (event) => {
    event.stopPropagation();
    startDemo({ useMic: true });
  });
}

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
