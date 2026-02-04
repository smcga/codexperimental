import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type EvolutionEra = "8bit" | "16bit" | "ps1" | "pcdemo" | "future";

type LatticeNode = {
  x: number;
  y: number;
  z: number;
  phase: number;
};

type Palette = {
  node: string;
  line: string;
};

const TAU = Math.PI * 2;
const BASE_NODE_COUNT = 320;
const MIN_NODE_COUNT = 128;
const MAX_NODE_COUNT = 800;

const ERA_COLORS: Record<EvolutionEra, Palette> = {
  "8bit": { node: "#dfe7f2", line: "#9fb3cc" },
  "16bit": { node: "#c0f6ff", line: "#6fb7e6" },
  ps1: { node: "#f1b6ff", line: "#9b73ff" },
  pcdemo: { node: "#9ef0ff", line: "#3ea6ff" },
  future: { node: "#c8fffb", line: "#55d5ff" }
};

const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967295;
  };
};

export class EffectEvolution implements Effect {
  private nodes: LatticeNode[] = [];
  private connectionsA: number[] = [];
  private connectionsB: number[] = [];
  private transformedX = new Float32Array(0);
  private transformedY = new Float32Array(0);
  private transformedZ = new Float32Array(0);
  private brightness = new Float32Array(0);
  private order: number[] = [];
  private lastCount = 0;
  private lastSeed = Number.NaN;
  private shock = 0;

  render({ ctx, width, height, time, delta, audio, params, era }: EffectRenderContext): void {
    const density = clamp(params.density ?? 1.0, 0.4, 2.5);
    const motion = clamp(params.motion ?? 0.6, 0, 1);
    const warp = clamp(params.warp ?? 0.4, 0, 1);
    const trail = clamp(params.trail ?? 0.15, 0, 0.92);
    const seed = Math.round(params.seed ?? 13);

    const targetCount = clamp(Math.round(BASE_NODE_COUNT * density), MIN_NODE_COUNT, MAX_NODE_COUNT);
    this.ensureLattice(targetCount, seed);

    const timeSec = time;
    const energy = clamp(audio?.rms ?? 0, 0, 1);
    const bass = clamp(audio?.bass ?? 0, 0, 1);

    if (audio?.beat) {
      this.shock = 1;
    } else {
      this.shock = Math.max(0, this.shock - delta * 1.8);
    }

    const activeEra = this.resolveEra(era);
    const palette = ERA_COLORS[activeEra];
    const scale = Math.min(width, height) * 0.44;
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const energyPulse = 1 + (0.05 + 0.1 * motion) * energy * Math.sin(timeSec * 2.2);
    const breath = 1 + bass * (0.06 + 0.1 * motion);

    if (activeEra === "future" && trail > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(1 - trail, 0.1, 0.85);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    ctx.save();
    ctx.globalCompositeOperation = activeEra === "pcdemo" || activeEra === "future" ? "lighter" : "source-over";
    ctx.strokeStyle = palette.line;
    ctx.fillStyle = palette.node;

    const baseLineWidth = 0.6 + bass * 1.4;
    ctx.lineWidth = activeEra === "8bit" ? Math.max(1, baseLineWidth) : baseLineWidth;

    const rotY = timeSec * (0.2 + motion * 0.6);
    const rotX = timeSec * (0.15 + motion * 0.4);
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    let minZ = Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < this.nodes.length; i += 1) {
      const node = this.nodes[i];
      const phase = node.phase + this.shock * 1.4;
      let x = node.x * breath;
      let y = node.y * breath;
      let z = node.z;

      const warpPhase = timeSec * (0.4 + motion * 0.5) + phase;
      const warpAmount = warp * 0.18;
      x += Math.cos(warpPhase) * warpAmount;
      y += Math.sin(warpPhase * 1.2) * warpAmount;

      if (activeEra === "8bit") {
        const quant = 0.12;
        x = Math.round(x / quant) * quant;
        y = Math.round(y / quant) * quant;
        z = 0;
      } else if (activeEra === "16bit") {
        y += Math.sin(timeSec * 1.3 + x * 3.2 + phase) * (0.12 + motion * 0.08);
        z = 0;
      } else {
        let rx = x * cosY - z * sinY;
        let rz = x * sinY + z * cosY;
        let ry = y * cosX - rz * sinX;
        rz = y * sinX + rz * cosX;

        if (activeEra === "ps1") {
          const wobble = Math.sin(timeSec * 3.2 + phase) * 0.03 + Math.cos(timeSec * 2.6 + phase) * 0.02;
          rx += wobble;
          ry += wobble * 0.6;
          x = rx + rz * 0.35;
          y = ry + rz * 0.18;
          z = rz;
        } else if (activeEra === "pcdemo") {
          x = rx;
          y = ry;
          z = rz;
        } else {
          const warpWave = Math.sin(rz * 2.4 + timeSec * 1.6 + phase) * (0.2 + warp * 0.35);
          x = rx + warpWave;
          y = ry + Math.cos(rz * 1.6 + timeSec * 1.2 + phase) * (0.18 + warp * 0.25);
          z = rz * 1.15;
        }
      }

      let screenX = centerX + x * scale * energyPulse;
      let screenY = centerY + y * scale * energyPulse;

      if (activeEra === "pcdemo" || activeEra === "future") {
        const perspective = 1 / (1 + z * 0.55);
        screenX = centerX + x * scale * perspective * energyPulse;
        screenY = centerY + y * scale * perspective * energyPulse;
        const invLen = 1 / Math.sqrt(x * x + y * y + (z + 1.2) * (z + 1.2));
        const dot = clamp((z + 1.2) * invLen, 0, 1);
        this.brightness[i] = clamp(0.4 + dot * 0.7 + bass * 0.2, 0.2, 1.25);
      } else if (activeEra === "ps1") {
        this.brightness[i] = clamp(0.6 + z * 0.2 + bass * 0.2, 0.2, 1.0);
      } else {
        this.brightness[i] = 0.85 + bass * 0.2;
      }

      this.transformedX[i] = activeEra === "8bit" ? Math.round(screenX) : screenX;
      this.transformedY[i] = activeEra === "8bit" ? Math.round(screenY) : screenY;
      this.transformedZ[i] = z;

      if (z < minZ) {
        minZ = z;
      }
      if (z > maxZ) {
        maxZ = z;
      }
    }

    const depthRange = Math.max(0.2, maxZ - minZ);
    const lineBaseAlpha = activeEra === "8bit" ? 0.55 : 0.4;

    for (let i = 0; i < this.connectionsA.length; i += 1) {
      const a = this.connectionsA[i];
      const b = this.connectionsB[i];
      const za = this.transformedZ[a];
      const zb = this.transformedZ[b];
      const depth = (za + zb) * 0.5;
      const depthFade = clamp(1 - (depth - minZ) / depthRange, 0.12, 1);
      ctx.globalAlpha = lineBaseAlpha * depthFade * (0.65 + bass * 0.35);
      ctx.beginPath();
      ctx.moveTo(this.transformedX[a], this.transformedY[a]);
      ctx.lineTo(this.transformedX[b], this.transformedY[b]);
      ctx.stroke();
    }

    const nodeSizeBase = activeEra === "8bit" ? 2.2 : activeEra === "16bit" ? 2.4 : 2.6;
    const nodeSize = nodeSizeBase * (0.8 + bass * 0.5);
    const halfNode = nodeSize * 0.5;

    if (activeEra === "pcdemo") {
      this.order.sort((a, b) => this.transformedZ[a] - this.transformedZ[b]);
    }

    const drawOrder = activeEra === "pcdemo" ? this.order : null;

    if (drawOrder) {
      for (let i = 0; i < drawOrder.length; i += 1) {
        const index = drawOrder[i];
        ctx.globalAlpha = clamp(this.brightness[index] * (0.75 + energy * 0.25), 0.25, 1);
        ctx.fillRect(this.transformedX[index] - halfNode, this.transformedY[index] - halfNode, nodeSize, nodeSize);
      }
    } else {
      for (let i = 0; i < this.nodes.length; i += 1) {
        ctx.globalAlpha = clamp(this.brightness[i] * (0.75 + energy * 0.25), 0.25, 1);
        ctx.fillRect(this.transformedX[i] - halfNode, this.transformedY[i] - halfNode, nodeSize, nodeSize);
      }
    }

    ctx.restore();
  }

  reset(): void {
    this.shock = 0;
  }

  private resolveEra(era?: string): EvolutionEra {
    if (era === "8bit" || era === "16bit" || era === "ps1" || era === "pcdemo" || era === "future") {
      return era;
    }
    return "16bit";
  }

  private ensureLattice(count: number, seed: number): void {
    if (this.lastCount === count && this.lastSeed === seed) {
      return;
    }

    const random = mulberry32(seed);
    const cols = Math.max(6, Math.round(Math.sqrt(count)));
    const rows = Math.ceil(count / cols);
    const nodes: LatticeNode[] = new Array(count);

    for (let i = 0; i < count; i += 1) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const baseX = cols > 1 ? (col / (cols - 1) - 0.5) * 2 : 0;
      const baseY = rows > 1 ? (row / (rows - 1) - 0.5) * 2 : 0;
      const jitterX = (random() - 0.5) * 0.14;
      const jitterY = (random() - 0.5) * 0.14;
      const phase = random() * TAU;
      const x = baseX + jitterX;
      const y = baseY + jitterY;
      const z = Math.sin(x * 2.1 + y * 1.6 + phase) * 0.6;
      nodes[i] = { x, y, z, phase };
    }

    const connectionsA: number[] = [];
    const connectionsB: number[] = [];
    for (let i = 0; i < count; i += 1) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      if (col + 1 < cols && i + 1 < count) {
        connectionsA.push(i);
        connectionsB.push(i + 1);
      }
      if (row + 1 < rows && i + cols < count) {
        connectionsA.push(i);
        connectionsB.push(i + cols);
      }
    }

    this.nodes = nodes;
    this.connectionsA = connectionsA;
    this.connectionsB = connectionsB;
    this.transformedX = new Float32Array(count);
    this.transformedY = new Float32Array(count);
    this.transformedZ = new Float32Array(count);
    this.brightness = new Float32Array(count);
    this.order = Array.from({ length: count }, (_value, index) => index);
    this.lastCount = count;
    this.lastSeed = seed;
  }
}
