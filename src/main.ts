import "./style.css";
import { Renderer } from "./renderer/renderer";
import { Transport } from "./audio/transport";
import { scheduleStep, isKickStep } from "./audio/song";
import { dropTime, totalDuration } from "./timeline";
import { Synth } from "./audio/synth";

const canvas = document.querySelector<HTMLCanvasElement>("#demo");
const overlay = document.querySelector<HTMLDivElement>("#start-overlay");

if (!canvas || !overlay) {
  throw new Error("Missing canvas or overlay element");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Unable to create 2D context");
}

const renderer = new Renderer();
let audioContext: AudioContext | null = null;
let transport: Transport | null = null;
let animationFrame = 0;
let startPerf = 0;
let audioStartTime = 0;
let lastFrameTime = 0;
let lastStep = -1;
let kickPulse = 0;
let energy = 0;

function resize(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);

function startDemo(): void {
  if (audioContext) {
    audioContext.close();
  }

  audioContext = new AudioContext();
  audioStartTime = audioContext.currentTime + 0.05;
  const synth = new Synth(audioContext);
  transport = new Transport(audioContext, audioStartTime, (step, time) => {
    scheduleStep(synth, step, time);
  });

  audioContext.resume();
  transport.start();
  startPerf = performance.now();
  lastFrameTime = startPerf;
  lastStep = -1;
  kickPulse = 0;
  energy = 0;
  overlay.classList.add("hidden");

  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(loop);
}

function loop(timestamp: number): void {
  animationFrame = requestAnimationFrame(loop);
  const delta = (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;

  if (!audioContext || !transport) {
    return;
  }

  const demoTime = audioContext.currentTime - audioStartTime;
  if (demoTime > totalDuration) {
    restartToOverlay();
    return;
  }

  const beat = transport.getBeatAtTime(audioContext.currentTime);
  const step = Math.floor(beat * 4);
  const kick = step !== lastStep && isKickStep(step, beat);
  if (step !== lastStep) {
    lastStep = step;
  }

  if (kick) {
    kickPulse = 1;
  }
  kickPulse = Math.max(0, kickPulse - delta * 2.2);
  energy = Math.max(0.2, energy * 0.9 + kickPulse * 0.8);

  renderer.render({
    ctx,
    width: canvas.width,
    height: canvas.height,
    time: demoTime,
    delta,
    kick,
    energy: energy + (demoTime > dropTime ? 0.3 : 0)
  });
}

function restartToOverlay(): void {
  if (transport) {
    transport.stop();
  }
  if (audioContext) {
    audioContext.close();
  }
  transport = null;
  audioContext = null;
  overlay.classList.remove("hidden");
}

overlay.addEventListener("click", () => {
  startDemo();
});

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") {
    restartToOverlay();
  }
  if (event.key.toLowerCase() === "f" && document.fullscreenEnabled) {
    if (!document.fullscreenElement) {
      canvas.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
});
