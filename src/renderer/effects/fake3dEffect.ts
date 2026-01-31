import { Effect, EffectRenderContext } from "./types";

const shade = (hex: string, amount: number): string => {
  const value = parseInt(hex.replace("#", ""), 16);
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  const factor = Math.max(0, Math.min(1, amount));
  const mix = (channel: number) => Math.round(channel * factor);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

const drawFakeBlock = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
  color: string
): void => {
  const skew = depth * 0.6;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y - depth);
  ctx.lineTo(x + width - skew, y - depth - height);
  ctx.lineTo(x - skew, y - height);
  ctx.closePath();
  ctx.fillStyle = shade(color, 1.05);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - skew, y - height);
  ctx.lineTo(x - skew, y - height + depth);
  ctx.lineTo(x, y + depth);
  ctx.closePath();
  ctx.fillStyle = shade(color, 0.7);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y - depth);
  ctx.lineTo(x + width, y - depth + depth);
  ctx.lineTo(x, y + depth);
  ctx.closePath();
  ctx.fillStyle = shade(color, 0.55);
  ctx.fill();
};

const drawBillboard = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
): void => {
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0.15, -0.6, 1, 0, 0);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, shade(color, 1.1));
  gradient.addColorStop(1, shade(color, 0.6));
  ctx.fillStyle = gradient;

  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, 12);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
};

export class Fake3DEffect implements Effect {
  render({ ctx, width, height, time, audio }: EffectRenderContext): void {
    ctx.fillStyle = "#0b0e1a";
    ctx.fillRect(0, 0, width, height);

    const horizon = height * 0.62;
    const glow = ctx.createLinearGradient(0, horizon - 120, 0, height);
    glow.addColorStop(0, "rgba(120, 80, 255, 0.35)");
    glow.addColorStop(1, "rgba(5, 6, 10, 0.95)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, horizon - 120, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2 + 40);

    const pulse = 1 + audio.bass * 0.2;
    drawFakeBlock(ctx, -220, 140, 180 * pulse, 90 * pulse, 48, "#ff8fab");
    drawFakeBlock(ctx, 40, 130, 200 * pulse, 110 * pulse, 52, "#7bdff2");
    drawFakeBlock(ctx, -40, -30, 240 * pulse, 120 * pulse, 64, "#caffbf");

    const float = Math.sin(time * 0.7) * 30;
    drawBillboard(ctx, -160, -220 + float, 220, 80, "#9d4edd");

    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 6; i += 1) {
      const radius = 40 + i * 18;
      const x = width * 0.15 + i * 80;
      const y = horizon - 50 + Math.sin(time * 0.8 + i) * 20;
      const gradient = ctx.createRadialGradient(x, y, 10, x, y, radius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${0.25 + audio.treble * 0.4})`);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 1.4, radius * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    for (let i = 0; i < 10; i += 1) {
      const lineY = horizon + i * 18;
      ctx.fillRect(0, lineY, width, 1);
    }
  }
}
