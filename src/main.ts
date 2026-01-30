import { Renderer } from "./renderer/renderer";
import { getEffectState, getTextState } from "./timeline";
import { createSong } from "./audio/song";
import type { Transport } from "./audio/transport";

const canvas = document.querySelector<HTMLCanvasElement>("#scene");
const overlay = document.querySelector<HTMLDivElement>("#startOverlay");

if (!canvas || !overlay) {
  throw new Error("Missing canvas or overlay element");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("2D context not available");
}

const renderer = new Renderer();
let audioContext: AudioContext | null = null;
let audioStartTime = 0;
let lastAudioTime = 0;
let running = false;
let animationId = 0;
let kickPulse = 0;
let snarePulse = 0;
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;
let transport: Transport | null = null;

const triggers = { kickTimes: [] as number[], snareTimes: [] as number[] };

const resize = () => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  screenWidth = window.innerWidth;
  screenHeight = window.innerHeight;
  canvas.width = screenWidth * dpr;
  canvas.height = screenHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  renderer.resize(320, 180);
};

resize();
window.addEventListener("resize", resize);

const startDemo = async () => {
  if (running) {
    return;
  }
  overlay.style.display = "none";
  audioContext = new AudioContext();
  await audioContext.resume();
  const master = audioContext.createGain();
  master.gain.value = 0.7;
  master.connect(audioContext.destination);

  triggers.kickTimes.length = 0;
  triggers.snareTimes.length = 0;
  kickPulse = 0;
  snarePulse = 0;

  const song = createSong(audioContext, master, triggers);
  transport = song.transport;
  audioStartTime = transport.start(audioContext);
  lastAudioTime = audioContext.currentTime;

  running = true;
  const loop = () => {
    if (!audioContext || !running) {
      return;
    }
    const currentTime = audioContext.currentTime;
    const delta = currentTime - lastAudioTime;
    lastAudioTime = currentTime;
    const demoTime = currentTime - audioStartTime;

    while (triggers.kickTimes.length && triggers.kickTimes[0] <= currentTime) {
      triggers.kickTimes.shift();
      kickPulse = 1;
      renderer.burstParticles(1);
    }
    while (triggers.snareTimes.length && triggers.snareTimes[0] <= currentTime) {
      triggers.snareTimes.shift();
      snarePulse = 1;
    }

    kickPulse *= 0.9;
    snarePulse *= 0.85;

    const intensity = Math.min(1, kickPulse + snarePulse * 0.6);
    const effects = getEffectState(demoTime);
    const textState = getTextState(demoTime);

    renderer.update(delta, intensity + (effects.particles > 0 ? 0.3 : 0));
    renderer.render(ctx, demoTime, effects, textState, intensity, screenWidth, screenHeight);

    animationId = requestAnimationFrame(loop);
  };
  animationId = requestAnimationFrame(loop);
};

const stopDemo = () => {
  if (!running) {
    return;
  }
  running = false;
  cancelAnimationFrame(animationId);
  if (audioContext) {
    transport?.stop();
    audioContext.close();
    audioContext = null;
  }
  transport = null;
};

overlay.addEventListener("click", () => {
  void startDemo();
});

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "f") {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  }
  if (event.key.toLowerCase() === "r") {
    stopDemo();
    void startDemo();
  }
});

ctx.fillStyle = "#000";
ctx.fillRect(0, 0, screenWidth, screenHeight);
