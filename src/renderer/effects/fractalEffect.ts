import { clamp } from "../../util/math";
import type { Effect, EffectRenderArgs } from "./types";

export class FractalEffect implements Effect {
  private canvas = document.createElement("canvas");
  private ctx: CanvasRenderingContext2D;

  constructor(private baseWidth = 320, private baseHeight = 180) {
    this.canvas.width = baseWidth;
    this.canvas.height = baseHeight;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create fractal canvas");
    }
    this.ctx = ctx;
  }

  reset(): void {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);
  }

  render({ ctx, width, height, time, features, params }: EffectRenderArgs): void {
    const drift = typeof params?.drift === "number" ? params.drift : 0.3;
    const local = this.ctx;

    local.save();
    local.globalAlpha = 0.92;
    local.translate(this.baseWidth / 2, this.baseHeight / 2);
    local.rotate(0.002 + features.treble * 0.01 + drift * 0.01);
    local.scale(1.01 + features.bass * 0.01, 1.01 + features.bass * 0.01);
    local.drawImage(this.canvas, -this.baseWidth / 2, -this.baseHeight / 2);
    local.restore();

    local.fillStyle = `hsla(${180 + Math.sin(time) * 60}, 80%, 60%, 0.15)`;
    local.beginPath();
    local.arc(
      this.baseWidth / 2 + Math.sin(time * 0.9) * 40,
      this.baseHeight / 2 + Math.cos(time * 1.2) * 30,
      8 + features.mid * 20,
      0,
      Math.PI * 2
    );
    local.fill();

    ctx.drawImage(this.canvas, 0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const vignette = clamp(features.bass + features.beatStrength, 0, 1);
    ctx.fillStyle = `rgba(50, 200, 255, ${0.08 + vignette * 0.2})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
