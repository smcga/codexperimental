import { clamp, randRange } from "../../util/math";
import { EffectDefinition } from "./types";

type Blob = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

export class MetaballsEffect implements EffectDefinition {
  name = "metaballs";
  private blobs: Blob[] = [];
  private buffer: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;

  constructor(private width = 160, private height = 90) {
    this.buffer = document.createElement("canvas");
    this.buffer.width = width;
    this.buffer.height = height;
    const ctx = this.buffer.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create metaballs buffer.");
    }
    this.ctx = ctx;
    this.imageData = ctx.createImageData(width, height);
    this.reset();
  }

  reset(): void {
    this.blobs = Array.from({ length: 6 }, () => ({
      x: randRange(0, this.width),
      y: randRange(0, this.height),
      vx: randRange(-0.3, 0.3),
      vy: randRange(-0.3, 0.3),
      radius: randRange(18, 38)
    }));
  }

  render({ ctx, width, height, delta, audio }: Parameters<EffectDefinition["render"]>[0]): void {
    this.blobs.forEach((blob) => {
      blob.x += blob.vx * delta * 60;
      blob.y += blob.vy * delta * 60;
      if (blob.x < 0 || blob.x > this.width) {
        blob.vx *= -1;
      }
      if (blob.y < 0 || blob.y > this.height) {
        blob.vy *= -1;
      }
    });

    const data = this.imageData.data;
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const idx = (y * this.width + x) * 4;
        let field = 0;
        this.blobs.forEach((blob) => {
          const dx = x - blob.x;
          const dy = y - blob.y;
          field += (blob.radius * blob.radius) / (dx * dx + dy * dy + 1);
        });
        const intensity = clamp((field / 20) + audio.bass * 0.6, 0, 1);
        data[idx] = 80 + intensity * 175;
        data[idx + 1] = 40 + intensity * 120;
        data[idx + 2] = 140 + intensity * 90;
        data[idx + 3] = 255;
      }
    }
    this.ctx.putImageData(this.imageData, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.buffer, 0, 0, width, height);
    ctx.restore();
  }
}
