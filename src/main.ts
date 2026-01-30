import "./style.css";
import { AudioPlayer } from "./audio/audioPlayer";
import { fetchTimelineConfig, normalizeTimelineConfig, NormalizedTimeline } from "./config/loadConfig";
import { Renderer } from "./renderer/renderer";
import { effectRegistry } from "./renderer/effects";
import { getTimelineState } from "./timeline/timeline";

const canvas = document.querySelector<HTMLCanvasElement>("#demo");
const overlay = document.querySelector<HTMLDivElement>("#start-overlay");
const overlayText = document.querySelector<HTMLDivElement>("#start-overlay .start-text");

if (!canvas || !overlay || !overlayText) {
  throw new Error("Missing canvas or overlay element");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Unable to create 2D context");
}

const renderer = new Renderer();
let audioPlayer: AudioPlayer | null = null;
let timeline: NormalizedTimeline | null = null;
let animationFrame = 0;
let lastFrameTime = 0;
let isLoading = false;
let hasStarted = false;

function resize(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);

function setOverlayMessage(message: string, clickable = true): void {
  overlayText.textContent = message;
  overlay.classList.remove("hidden");
  overlay.style.cursor = clickable ? "pointer" : "default";
}

async function startDemo(): Promise<void> {
  if (isLoading) {
    return;
  }
  isLoading = true;
  setOverlayMessage("Loading…", false);

  try {
    const rawConfig = await fetchTimelineConfig("/timeline.json");
    audioPlayer?.dispose();
    audioPlayer = new AudioPlayer(rawConfig.audio.src);
    await audioPlayer.load();
    timeline = normalizeTimelineConfig(rawConfig, audioPlayer.getDuration());

    timeline.sections.forEach((section) => {
      if (!effectRegistry.has(section.effect)) {
        throw new Error(`Unknown effect: ${section.effect}`);
      }
    });

    renderer.reset();
    await audioPlayer.start();
    hasStarted = true;
    overlay.classList.add("hidden");
    lastFrameTime = performance.now();
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(loop);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start demo.";
    setOverlayMessage(`Error: ${message}`, true);
  } finally {
    isLoading = false;
  }
}

function loop(timestamp: number): void {
  animationFrame = requestAnimationFrame(loop);
  const delta = (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;

  if (!audioPlayer || !timeline) {
    return;
  }

  if (audioPlayer.isEnded()) {
    setOverlayMessage("THE END\n(press R to restart)", true);
    cancelAnimationFrame(animationFrame);
    return;
  }

  const demoTime = audioPlayer.getCurrentTime() + timeline.audio.offset;
  const audio = audioPlayer.update();
  const renderDelta = audioPlayer.isPaused() ? 0 : delta;
  const timelineState = getTimelineState(demoTime, timeline);

  renderer.render({
    ctx,
    width: canvas.width,
    height: canvas.height,
    time: demoTime,
    delta: renderDelta,
    audio,
    timelineState
  });
}

function restartDemo(): void {
  if (!audioPlayer || !timeline) {
    startDemo();
    return;
  }
  renderer.reset();
  audioPlayer.restart().catch(() => {
    setOverlayMessage("Unable to restart audio.", true);
  });
  overlay.classList.add("hidden");
  cancelAnimationFrame(animationFrame);
  lastFrameTime = performance.now();
  animationFrame = requestAnimationFrame(loop);
}

overlay.addEventListener("click", () => {
  if (!hasStarted) {
    startDemo();
  } else if (audioPlayer?.isPaused()) {
    audioPlayer.start().catch(() => {
      setOverlayMessage("Unable to resume audio.", true);
    });
    overlay.classList.add("hidden");
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") {
    restartDemo();
  }
  if (event.key.toLowerCase() === "f" && document.fullscreenEnabled) {
    if (!document.fullscreenElement) {
      canvas.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
});
