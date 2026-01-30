import { clamp } from "../../util/math";
import type { Effect, EffectRenderArgs } from "./types";

export class FeedbackEffect implements Effect {
  private canvas = document.createElement("canvas");
  private ctx: CanvasRenderingContext2D;

  constructor(private baseWidth = 320, private baseHeight = 180) {
    this.canvas.width = baseWidth;
    this.canvas.height = baseHeight;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create feedback canvas");
    }
    this.ctx = ctx;
    this.reset();
  }

  reset(): void {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);
  }

  render({ ctx, width, height, time, features, params }: EffectRenderArgs): void {
    const zoom = typeof params?.zoom === "number" ? params.zoom : 1.02;
    const local = this.ctx;
    const pulse = 1 + features.beatStrength * 0.04;

    local.save();
    local.globalAlpha = 0.94;
    local.translate(this.baseWidth / 2, this.baseHeight / 2);
    local.rotate(Math.sin(time * 0.3) * 0.003);
    local.scale(zoom * pulse, zoom * pulse);
    local.drawImage(this.canvas, -this.baseWidth / 2, -this.baseHeight / 2);
    local.restore();

    local.fillStyle = `rgba(30, 20, 60, ${0.2 + features.treble * 0.2})`;
    local.fillRect(0, 0, this.baseWidth, this.baseHeight);

    local.strokeStyle = `rgba(200, 120, 255, ${0.4 + features.mid * 0.5})`;
    local.lineWidth = 2;
    local.beginPath();
    local.arc(
      this.baseWidth / 2,
      this.baseHeight / 2,
      30 + Math.sin(time * 1.5) * 10,
      0,
      Math.PI * 2
    );
    local.stroke();

    ctx.drawImage(this.canvas, 0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const glow = clamp(features.bass + features.treble, 0, 1);
    ctx.fillStyle = `rgba(120, 40, 200, ${0.1 + glow * 0.3})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
