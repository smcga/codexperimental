import { clamp } from "../../util/math";
import type { Effect, EffectRenderArgs } from "./types";

type Blob = { x: number; y: number; radius: number; speed: number };

export class MetaballsEffect implements Effect {
  private canvas = document.createElement("canvas");
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;
  private blobs: Blob[] = [];

  constructor(private baseWidth = 160, private baseHeight = 90) {
    this.canvas.width = baseWidth;
    this.canvas.height = baseHeight;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create metaballs canvas");
    }
    this.ctx = ctx;
    this.imageData = ctx.createImageData(baseWidth, baseHeight);
    this.reset();
  }

  reset(): void {
    this.blobs = Array.from({ length: 5 }, (_, index) => ({
      x: (index + 1) / 6,
      y: (index % 3) / 3,
      radius: 0.2 + index * 0.03,
      speed: 0.4 + index * 0.2
    }));
  }

  render({ ctx, width, height, time, features, params }: EffectRenderArgs): void {
    const blobCount = typeof params?.blobCount === "number" ? params.blobCount : this.blobs.length;
    const data = this.imageData.data;

    for (let i = 0; i < blobCount; i += 1) {
      const blob = this.blobs[i % this.blobs.length];
      blob.x = 0.5 + Math.sin(time * blob.speed + i) * 0.35;
      blob.y = 0.5 + Math.cos(time * blob.speed * 0.7 + i) * 0.35;
    }

    for (let y = 0; y < this.baseHeight; y += 1) {
      for (let x = 0; x < this.baseWidth; x += 1) {
        const idx = (y * this.baseWidth + x) * 4;
        const nx = x / this.baseWidth;
        const ny = y / this.baseHeight;
        let field = 0;
        for (let i = 0; i < blobCount; i += 1) {
          const blob = this.blobs[i % this.blobs.length];
          const dx = nx - blob.x;
          const dy = ny - blob.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          field += blob.radius / Math.max(0.02, dist);
        }
        const threshold = 2.4 + features.bass * 1.2;
        const value = clamp((field - threshold) * 0.6, 0, 1);
        data[idx] = 40 + value * 140;
        data[idx + 1] = 80 + value * 160;
        data[idx + 2] = 120 + value * 100;
        data[idx + 3] = 255;
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);
    ctx.drawImage(this.canvas, 0, 0, width, height);
  }
}
