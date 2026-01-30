import { DemoRenderer } from './renderer/renderer';
import { dropTime, getSection } from './timeline';
import { Transport } from './audio/transport';
import { scheduleSongStep } from './audio/song';
import { clamp } from './util/math';

const canvas = document.querySelector<HTMLCanvasElement>('#demo');
const overlay = document.querySelector<HTMLDivElement>('#start-overlay');

if (!canvas || !overlay) {
  throw new Error('Missing required DOM elements');
}

const renderer = new DemoRenderer(canvas);

let audioContext: AudioContext | null = null;
let transport: Transport | null = null;
let startTime = 0;
let lastTime = 0;
let rafId = 0;
let pendingBeats: Array<{ time: number; strength: number }> = [];
let beatStrength = 0;

const resize = () => {
  renderer.resize(window.innerWidth, window.innerHeight);
};

window.addEventListener('resize', resize);
resize();

const schedule = (context: AudioContext) => {
  transport = new Transport(context, 160, {
    onStep: (step, time) => {
      scheduleSongStep(context, step, time, startTime, {
        onDrum: (type, atTime) => {
          const strength = type === 'kick' ? 1 : type === 'snare' ? 0.6 : 0.3;
          pendingBeats.push({ time: atTime, strength });
        }
      });
    }
  });
  transport.start(startTime);
};

const updateBeatTriggers = (demoTime: number) => {
  const remaining: typeof pendingBeats = [];
  for (const beat of pendingBeats) {
    if (demoTime >= beat.time - startTime) {
      renderer.triggerBeat(beat.strength);
      beatStrength = Math.max(beatStrength, beat.strength);
    } else {
      remaining.push(beat);
    }
  }
  pendingBeats = remaining;
};

const loop = (time: number) => {
  const now = time / 1000;
  const delta = Math.min(0.05, now - lastTime);
  lastTime = now;

  if (!audioContext) {
    return;
  }

  const demoTime = audioContext.currentTime - startTime;
  updateBeatTriggers(demoTime);

  const section = getSection(demoTime);
  const baseIntensity = section === 'intro' ? 0.3 : section === 'build' ? 0.5 : 0.9;
  const dropBoost = demoTime >= dropTime ? 0.2 : 0;
  const intensity = clamp(baseIntensity + dropBoost + beatStrength * 0.4, 0, 1.4);

  renderer.update({
    demoTime,
    delta,
    intensity,
    beatStrength
  });

  beatStrength *= Math.max(0, 1 - delta * 3.5);
  rafId = requestAnimationFrame(loop);
};

const startDemo = async () => {
  overlay.style.display = 'none';
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  await audioContext.resume();
  startTime = audioContext.currentTime + 0.1;
  lastTime = performance.now() / 1000;
  pendingBeats = [];
  schedule(audioContext);
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
};

overlay.addEventListener('click', () => {
  void startDemo();
});

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'r') {
    window.location.reload();
  }
  if (event.key.toLowerCase() === 'f') {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  }
});
