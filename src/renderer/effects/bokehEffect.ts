import { AudioFeatures } from "../../audio/audioPlayer";
import { Effect, EffectRenderContext } from "./types";

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed) * 43758.5453123) % 1;
}

export type BokehConfig = {
  count: number;
  speed: number;
  baseRadius: number;
  radiusRange: number;
  bassScale: number;
  alphaBase: number;
  alphaRange: number;
  hueRange: number;
  trebleScale: number;
  saturation: number;
  lightness: number;
  backgroundColor: string;
  backgroundAlpha: number;
};

export type BokehCircle = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  hue: number;
};

export const BOKEH_CONFIG: BokehConfig = {
  count: 40,
  speed: 0.7,
  baseRadius: 6,
  radiusRange: 30,
  bassScale: 20,
  alphaBase: 0.15,
  alphaRange: 0.35,
  hueRange: 360,
  trebleScale: 120,
  saturation: 70,
  lightness: 60,
  backgroundColor: "4, 4, 12",
  backgroundAlpha: 0.4
};

export const SLOW_BOKEH_CONFIG: BokehConfig = {
  count: 40,
  speed: 0.18,
  baseRadius: 10,
  radiusRange: 34,
  bassScale: 12,
  alphaBase: 0.08,
  alphaRange: 0.2,
  hueRange: 220,
  trebleScale: 40,
  saturation: 55,
  lightness: 65,
  backgroundColor: "6, 8, 18",
  backgroundAlpha: 0.25
};

export function buildBokehCircles(
  time: number,
  width: number,
  height: number,
  audio: AudioFeatures,
  config: BokehConfig
): BokehCircle[] {
  const circles: BokehCircle[] = [];
  const timeSeed = time * config.speed;
  for (let i = 0; i < config.count; i += 1) {
    const seed = timeSeed + i * 12.3;
    circles.push({
      x: pseudoRandom(seed) * width,
      y: pseudoRandom(seed + 4.2) * height,
      radius: config.baseRadius + pseudoRandom(seed + 8.7) * config.radiusRange + audio.bass * config.bassScale,
      alpha: config.alphaBase + pseudoRandom(seed + 2.1) * config.alphaRange,
      hue: (pseudoRandom(seed + 6.5) * config.hueRange + audio.treble * config.trebleScale) % 360
    });
  }
  return circles;
}

function renderBokeh(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  audio: AudioFeatures,
  config: BokehConfig
): void {
  ctx.fillStyle = `rgba(${config.backgroundColor}, ${config.backgroundAlpha})`;
  ctx.fillRect(0, 0, width, height);

  const circles = buildBokehCircles(time, width, height, audio, config);
  circles.forEach((circle) => {
    ctx.fillStyle = `hsla(${circle.hue}, ${config.saturation}%, ${config.lightness}%, ${circle.alpha})`;
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

export class BokehEffect implements Effect {
  render({ ctx, width, height, time, audio }: EffectRenderContext): void {
    renderBokeh(ctx, width, height, time, audio, BOKEH_CONFIG);
  }
}

export class SlowBokehEffect implements Effect {
  render({ ctx, width, height, time, audio }: EffectRenderContext): void {
    renderBokeh(ctx, width, height, time, audio, SLOW_BOKEH_CONFIG);
  }
}
