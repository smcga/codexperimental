import "./style.css";
import { Renderer } from "./renderer/renderer";
import { loadTimelineConfig, type TimelineConfig } from "./config/loadConfig";
import { AudioPlayer } from "./audio/audioPlayer";
import { getActiveTextCues, getSectionState } from "./timeline/timeline";

const canvas = document.querySelector<HTMLCanvasElement>("#demo");
const overlay = document.querySelector<HTMLDivElement>("#start-overlay");
const overlayText = document.querySelector<HTMLDivElement>(".start-text");

if (!canvas || !overlay || !overlayText) {
  throw new Error("Missing canvas or overlay element");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Unable to create 2D context");
}

const renderer = new Renderer();
let audioPlayer: AudioPlayer | null = null;
let animationFrame = 0;
let lastFrameTime = 0;
let isRunning = false;
let isLoading = false;
let timelineConfig: TimelineConfig | null = null;

function resize(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);

function setOverlay(message: string, visible: boolean): void {
  overlayText.textContent = message;
  overlay.classList.toggle("hidden", !visible);
}

async function startDemo(): Promise<void> {
  if (isLoading || isRunning) {
    return;
  }

  isLoading = true;
  setOverlay("Loading…", true);

  try {
    const config = await loadTimelineConfig();

    if (audioPlayer) {
      audioPlayer.stop();
      audioPlayer.context.close();
    }

    audioPlayer = new AudioPlayer(config.audio.src, config.audio.offset);
    await audioPlayer.load();
    await audioPlayer.play();

    timelineConfig = config;
    renderer.reset();
    lastFrameTime = performance.now();
    isRunning = true;
    setOverlay("CLICK TO START", false);

    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(loop);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    setOverlay(`Config error: ${message}`, true);
  } finally {
    isLoading = false;
  }
}

function stopDemo(message: string): void {
  isRunning = false;
  cancelAnimationFrame(animationFrame);
  setOverlay(message, true);
}

function loop(timestamp: number): void {
  if (!audioPlayer || !timelineConfig) {
    return;
  }

  if (audioPlayer.isPaused) {
    stopDemo("CLICK TO START");
    return;
  }

  if (audioPlayer.isEnded) {
    stopDemo("THE END (press R to restart)");
    return;
  }

  const delta = (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;

  const demoTime = audioPlayer.demoTime;
  const features = audioPlayer.updateFeatures();
  const sectionState = getSectionState(
    demoTime,
    timelineConfig.sections,
    audioPlayer.duration + timelineConfig.audio.offset
  );
  const activeTextCues = getActiveTextCues(demoTime, timelineConfig.textCues);

  renderer.render({
    ctx,
    width: canvas.width,
    height: canvas.height,
    time: demoTime,
    delta,
    features,
    sectionState,
    textCues: activeTextCues
  });

  animationFrame = requestAnimationFrame(loop);
}

function restart(): void {
  if (!audioPlayer || !timelineConfig) {
    startDemo();
    return;
  }
  audioPlayer.restart();
  void audioPlayer.play();
  renderer.reset();
  lastFrameTime = performance.now();
  isRunning = true;
  setOverlay("CLICK TO START", false);
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(loop);
}

overlay.addEventListener("click", () => {
  startDemo();
});

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") {
    restart();
  }
  if (event.key.toLowerCase() === "f" && document.fullscreenEnabled) {
    if (!document.fullscreenElement) {
      canvas.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
});
