import { Renderer } from "./renderer/renderer";
import { Transport } from "./audio/transport";
import { Song } from "./audio/song";
import { dropTime } from "./timeline";

const canvas = document.querySelector<HTMLCanvasElement>("#demo");
const overlay = document.querySelector<HTMLDivElement>("#overlay");

if (!canvas || !overlay) {
  throw new Error("Missing canvas or overlay");
}

const renderer = new Renderer(canvas);

let audioCtx: AudioContext | null = null;
let transport: Transport | null = null;
let song: Song | null = null;
let startTime = 0;
let rafId = 0;
let beatPulse = 0;

const onResize = () => renderer.resize();
window.addEventListener("resize", onResize);

const animate = () => {
  if (!audioCtx || !transport || !song) {
    return;
  }
  const demoTime = audioCtx.currentTime - startTime;
  if (demoTime < 0) {
    rafId = requestAnimationFrame(animate);
    return;
  }

  const events = song.consumeEvents(audioCtx.currentTime);
  for (const event of events) {
    if (event.type === "kick") {
      beatPulse = 1;
      renderer.triggerBeat();
    }
  }

  beatPulse *= 0.9;
  renderer.render(demoTime, beatPulse);
  rafId = requestAnimationFrame(animate);
};

const startDemo = async () => {
  overlay.classList.add("hidden");
  audioCtx = new AudioContext();
  transport = new Transport(audioCtx, 160);
  const dropBeat = (dropTime / 60) * 160;
  song = new Song(audioCtx, dropBeat);
  startTime = audioCtx.currentTime + 0.1;
  transport.start(startTime, (step, time) => {
    song?.scheduleStep(step, time);
  });
  rafId = requestAnimationFrame(animate);
};

overlay.addEventListener("click", () => {
  if (audioCtx) {
    return;
  }
  startDemo();
});

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "f") {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => undefined);
    } else {
      document.exitFullscreen().catch(() => undefined);
    }
  }
  if (event.key.toLowerCase() === "r") {
    cancelAnimationFrame(rafId);
    window.location.reload();
  }
});
