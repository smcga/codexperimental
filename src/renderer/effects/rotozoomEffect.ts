import { lerp } from "../../util/math";
import type { Effect, EffectRenderArgs } from "./types";

export class RotozoomEffect implements Effect {
  private patternCanvas = document.createElement("canvas");
  private patternCtx: CanvasRenderingContext2D;
  private pattern: CanvasPattern | null = null;

  constructor() {
    this.patternCanvas.width = 128;
    this.patternCanvas.height = 128;
    const ctx = this.patternCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create rotozoom pattern canvas");
    }
    this.patternCtx = ctx;
    this.buildPattern();
  }

  private buildPattern(): void {
    const ctx = this.patternCtx;
    ctx.fillStyle = "#10151f";
    ctx.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#1d3b55" : "#0b1624";
        ctx.fillRect(x * 16, y * 16, 16, 16);
      }
    }
    this.pattern = ctx.createPattern(this.patternCanvas, "repeat");
  }

  render({ ctx, width, height, time, features, params }: EffectRenderArgs): void {
    const zoomBase = typeof params?.zoom === "number" ? params.zoom : 1.1;
    const zoom = zoomBase + features.bass * 0.2 + Math.sin(time * 0.8) * 0.05;
    const rotation = time * 0.4 + features.treble * 0.5;

    ctx.save();
    ctx.fillStyle = "#05070f";
    ctx.fillRect(0, 0, width, height);

    ctx.translate(width / 2, height / 2);
    ctx.rotate(rotation);
    ctx.scale(zoom, zoom);

    if (this.pattern) {
      ctx.fillStyle = this.pattern;
      ctx.fillRect(-width, -height, width * 2, height * 2);
    }

    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(120, 220, 255, ${lerp(0.2, 0.8, features.mid)})`;
    ctx.strokeRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8);
    ctx.restore();
  }
}
