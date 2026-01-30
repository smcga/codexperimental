import "./style.css";
import { loadConfig } from "./config/loadConfig";
import { AudioPlayer, AudioFeatures } from "./audio/audioPlayer";
import { Timeline } from "./timeline/timeline";
import { Renderer } from "./renderer/renderer";

const canvas = document.querySelector<HTMLCanvasElement>("#demo");
const overlay = document.querySelector<HTMLDivElement>("#start-overlay");
const overlayText = overlay?.querySelector<HTMLDivElement>(".start-text");

if (!canvas || !overlay || !overlayText) {
  throw new Error("Missing canvas or overlay element");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Unable to create 2D context");
}

const renderer = new Renderer();
let audioPlayer: AudioPlayer | null = null;
let timeline: Timeline | null = null;
let animationFrame = 0;
let lastDemoTime = 0;
let isRunning = false;

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

async function startDemo(): Promise<void> {
  if (isRunning) {
    return;
  }
  setOverlay("Loading…", true);

  try {
    const config = await loadConfig();
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
  if (!audioPlayer || !timeline) {
    isRunning = false;
    return;
  }

  const demoTime = audioPlayer.currentTime + timeline.getAudioOffset();
  const delta = Math.max(0, demoTime - lastDemoTime);
  lastDemoTime = demoTime;

  const audioFeatures: AudioFeatures = audioPlayer.updateFeatures();
  const state = timeline.getState(demoTime);

  renderer.render({
    ctx,
    width: canvas.width,
    height: canvas.height,
    time: demoTime,
    delta,
    section: state.section,
    transition: state.transition,
    textCues: state.activeTextCues,
    audio: audioFeatures
  });

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
