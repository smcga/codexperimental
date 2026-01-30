import "./style.css";
import { loadTimelineConfig } from "./config/loadConfig";
import { AudioPlayer } from "./audio/audioPlayer";
import { createTimeline } from "./timeline/timeline";
import { Renderer } from "./renderer/renderer";

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

let renderer: Renderer | null = null;
let audioPlayer: AudioPlayer | null = null;
let timeline: ReturnType<typeof createTimeline> | null = null;
let configOffset = 0;
let animationFrame = 0;
let lastFrameTime = 0;
let started = false;

function resize(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);

function setOverlay(message: string, visible = true): void {
  overlayText.textContent = message;
  overlay.classList.toggle("hidden", !visible);
}

async function startDemo(): Promise<void> {
  if (started) {
    return;
  }
  started = true;
  setOverlay("LOADING…", true);

  try {
    const config = await loadTimelineConfig("/timeline.json");
    configOffset = config.audio.offset;
    audioPlayer = await AudioPlayer.create({ src: config.audio.src, offset: config.audio.offset });
    renderer = new Renderer();
    timeline = createTimeline(config, audioPlayer.duration);

    await audioPlayer.play();
    lastFrameTime = performance.now();
    setOverlay("", false);
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(loop);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start demo.";
    setOverlay(message, true);
    started = false;
  }
}

function loop(timestamp: number): void {
  animationFrame = requestAnimationFrame(loop);
  const delta = (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;

  if (!renderer || !timeline || !audioPlayer) {
    return;
  }

  if (audioPlayer.ended) {
    setOverlay("THE END (press R to restart)", true);
    return;
  }

  if (!audioPlayer.isPlaying) {
    return;
  }

  const demoTime = audioPlayer.currentTime + configOffset;
  const features = audioPlayer.update();
  const state = timeline.getState(demoTime);

  renderer.render({
    ctx,
    width: canvas.width,
    height: canvas.height,
    time: demoTime,
    delta,
    features,
    state
  });
}

async function restartDemo(): Promise<void> {
  if (!audioPlayer || !renderer) {
    return;
  }
  renderer.reset();
  await audioPlayer.restart();
  lastFrameTime = performance.now();
  setOverlay("", false);
}

overlay.addEventListener("click", () => {
  startDemo();
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
