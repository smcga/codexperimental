import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type NeuralConstellationParams = {
  layers: number;
  neurons: number;
  pulseSpeed: number;
  glow: number;
  hue: number;
  drift: number;
  audioReact: number;
  seed: number;
};

type NetworkNode = {
  baseX: number;
  baseY: number;
  phase: number;
  size: number;
};

type NetworkLayout = {
  key: string;
  layers: NetworkNode[][];
};

const TAU = Math.PI * 2;

export const NEURAL_CONSTELLATION_DEFAULTS = {
  layers: 5,
  neurons: 8,
  pulseSpeed: 1.2,
  glow: 1,
  hue: 205,
  drift: 0.6,
  audioReact: 1,
  seed: 7
} as const;

const clamp01 = (value: number): number => clamp(value, 0, 1);

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const resolveNeuralConstellationParams = (params: Record<string, unknown>): NeuralConstellationParams => ({
  layers: clamp(Math.round(toNumber(params.layers, NEURAL_CONSTELLATION_DEFAULTS.layers)), 3, 8),
  neurons: clamp(Math.round(toNumber(params.neurons, NEURAL_CONSTELLATION_DEFAULTS.neurons)), 3, 16),
  pulseSpeed: clamp(toNumber(params.pulseSpeed, NEURAL_CONSTELLATION_DEFAULTS.pulseSpeed), 0.1, 4),
  glow: clamp(toNumber(params.glow, NEURAL_CONSTELLATION_DEFAULTS.glow), 0, 2),
  hue: clamp(toNumber(params.hue, NEURAL_CONSTELLATION_DEFAULTS.hue), 0, 360),
  drift: clamp(toNumber(params.drift, NEURAL_CONSTELLATION_DEFAULTS.drift), 0, 2),
  audioReact: clamp(toNumber(params.audioReact, NEURAL_CONSTELLATION_DEFAULTS.audioReact), 0, 2),
  seed: clamp(Math.round(toNumber(params.seed, NEURAL_CONSTELLATION_DEFAULTS.seed)), 1, 9999)
});

const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hash01 = (a: number, b: number): number => {
  const value = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const layerNeuronCount = (layerIndex: number, layerCount: number, maxNeurons: number): number => {
  const t = layerCount > 1 ? layerIndex / (layerCount - 1) : 0;
  const bulge = 0.55 + 0.45 * Math.sin(Math.PI * t);
  return clamp(Math.round(maxNeurons * bulge), 3, maxNeurons);
};

export const buildNeuralConstellationLayout = (
  config: NeuralConstellationParams,
  width: number,
  height: number
): NetworkNode[][] => {
  const rng = mulberry32(config.seed * 7919 + config.layers * 131 + config.neurons * 17);
  const marginX = width * 0.12;
  const marginY = height * 0.14;
  const spanX = width - marginX * 2;
  const spanY = height - marginY * 2;

  const layers: NetworkNode[][] = [];
  for (let layerIndex = 0; layerIndex < config.layers; layerIndex += 1) {
    const count = layerNeuronCount(layerIndex, config.layers, config.neurons);
    const x = config.layers > 1 ? marginX + (spanX * layerIndex) / (config.layers - 1) : width * 0.5;
    const nodes: NetworkNode[] = [];
    for (let nodeIndex = 0; nodeIndex < count; nodeIndex += 1) {
      const slot = count > 1 ? nodeIndex / (count - 1) : 0.5;
      const y = marginY + spanY * slot + (rng() - 0.5) * (spanY / Math.max(count, 1)) * 0.35;
      nodes.push({
        baseX: x + (rng() - 0.5) * spanX * 0.02,
        baseY: y,
        phase: rng() * TAU,
        size: 2.4 + rng() * 1.8
      });
    }
    layers.push(nodes);
  }
  return layers;
};

export class NeuralConstellationEffect implements Effect {
  private layout: NetworkLayout | null = null;

  reset(): void {
    this.layout = null;
  }

  private getLayout(config: NeuralConstellationParams, width: number, height: number): NetworkNode[][] {
    const key = `${config.seed}:${config.layers}:${config.neurons}:${width}x${height}`;
    if (!this.layout || this.layout.key !== key) {
      this.layout = { key, layers: buildNeuralConstellationLayout(config, width, height) };
    }
    return this.layout.layers;
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const config = resolveNeuralConstellationParams(params as Record<string, unknown>);
    const layers = this.getLayout(config, width, height);

    const energy = clamp01((audio.bass * 0.7 + audio.beatStrength * 0.6 + audio.rms * 0.3) * config.audioReact);
    const shimmer = clamp01(audio.treble * config.audioReact);
    const glowBoost = 1 + energy * 0.9;
    const hueDrift = time * 6 + energy * 30;

    ctx.fillStyle = "#04060f";
    ctx.fillRect(0, 0, width, height);

    const wobbleAmp = config.drift * Math.min(width, height) * 0.012;
    const nodeX = (node: NetworkNode): number => node.baseX + Math.sin(time * 0.7 + node.phase) * wobbleAmp;
    const nodeY = (node: NetworkNode): number => node.baseY + Math.cos(time * 0.9 + node.phase * 1.3) * wobbleAmp;

    // Wavefront: an "inference pass" sweeping input layer -> output layer.
    const waveSpan = config.layers + 1;
    const waveCycle = (time * config.pulseSpeed * 0.45) % 1;
    const wavefront = waveCycle * waveSpan - 0.5;

    // Synapse connections between adjacent layers.
    ctx.lineWidth = 1;
    for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex += 1) {
      const from = layers[layerIndex];
      const to = layers[layerIndex + 1];
      const layerHue = (config.hue + layerIndex * 9 + hueDrift) % 360;
      const frontProximity = clamp01(1 - Math.abs(layerIndex + 0.5 - wavefront) / 1.4);

      for (let a = 0; a < from.length; a += 1) {
        for (let b = 0; b < to.length; b += 1) {
          const h = hash01(layerIndex * 31 + a, b);
          const alpha = 0.045 + 0.05 * h + frontProximity * 0.11;
          ctx.strokeStyle = `hsla(${layerHue}, 80%, ${62 + shimmer * 14}%, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(nodeX(from[a]), nodeY(from[a]));
          ctx.lineTo(nodeX(to[b]), nodeY(to[b]));
          ctx.stroke();
        }
      }
    }

    // Signal pulses travelling along a deterministic subset of connections.
    for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex += 1) {
      const from = layers[layerIndex];
      const to = layers[layerIndex + 1];
      const layerHue = (config.hue + layerIndex * 9 + hueDrift) % 360;

      for (let a = 0; a < from.length; a += 1) {
        for (let b = 0; b < to.length; b += 1) {
          const h = hash01(layerIndex * 131 + a * 7, b * 13);
          if (h > 0.4) {
            continue;
          }
          const travel = (time * config.pulseSpeed * (0.7 + h) + h * 11) % 1;
          const px = nodeX(from[a]) + (nodeX(to[b]) - nodeX(from[a])) * travel;
          const py = nodeY(from[a]) + (nodeY(to[b]) - nodeY(from[a])) * travel;
          const strength = Math.sin(Math.PI * travel);
          const alpha = clamp01(strength * (0.35 + 0.5 * energy + 0.3 * h));
          const radius = (1.1 + h * 1.2) * (1 + energy * 0.8);

          ctx.fillStyle = `hsla(${(layerHue + 30) % 360}, 95%, 74%, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, TAU);
          ctx.fill();
        }
      }
    }

    // Neurons: halo + core, flashing as the wavefront passes their layer.
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex += 1) {
      const nodes = layers[layerIndex];
      const layerHue = (config.hue + layerIndex * 9 + hueDrift) % 360;
      const flash = clamp01(1 - Math.abs(layerIndex - wavefront) / 1.1);

      for (const node of nodes) {
        const x = nodeX(node);
        const y = nodeY(node);
        const idle = 0.5 + 0.5 * Math.sin(time * 1.6 + node.phase);
        const activation = clamp01(0.35 + idle * 0.25 + flash * 0.55 + energy * 0.3);
        const coreRadius = node.size * (1 + flash * 0.5 + energy * 0.35);
        const haloRadius = coreRadius * (1.7 + config.glow * 1.3) * glowBoost;

        ctx.fillStyle = `hsla(${layerHue}, 90%, 60%, ${(0.05 + 0.06 * activation * config.glow).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, haloRadius, 0, TAU);
        ctx.fill();

        ctx.fillStyle = `hsla(${layerHue}, 90%, 66%, ${(0.1 + 0.12 * activation * config.glow).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, haloRadius * 0.55, 0, TAU);
        ctx.fill();

        ctx.fillStyle = `hsla(${layerHue}, 60%, ${68 + activation * 24}%, ${(0.55 + 0.45 * activation).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, coreRadius, 0, TAU);
        ctx.fill();
      }
    }
  }
}
