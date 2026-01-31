import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type FakeBox = {
  phase: number;
  hue: number;
  size: number;
  wobble: number;
};

function drawFakeBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  depth: number,
  hue: number,
  alpha: number
): void {
  const height = size * 0.55;
  const topLift = size * 0.25;
  const skew = size * 0.35;
  const lightness = 34 + depth * 40;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.4)`;
  ctx.shadowBlur = size * 0.18;

  ctx.beginPath();
  ctx.moveTo(x - size / 2, y - height / 2);
  ctx.lineTo(x + size / 2, y - height / 2);
  ctx.lineTo(x + size / 2 + skew, y - height / 2 - topLift);
  ctx.lineTo(x - size / 2 + skew, y - height / 2 - topLift);
  ctx.closePath();
  ctx.fillStyle = `hsla(${hue}, 68%, ${lightness + 12}%, ${alpha})`;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - size / 2, y - height / 2);
  ctx.lineTo(x - size / 2 + skew, y - height / 2 - topLift);
  ctx.lineTo(x - size / 2 + skew, y + height / 2 - topLift);
  ctx.lineTo(x - size / 2, y + height / 2);
  ctx.closePath();
  ctx.fillStyle = `hsla(${hue}, 65%, ${lightness - 6}%, ${alpha})`;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - size / 2, y - height / 2);
  ctx.lineTo(x + size / 2, y - height / 2);
  ctx.lineTo(x + size / 2, y + height / 2);
  ctx.lineTo(x - size / 2, y + height / 2);
  ctx.closePath();
  ctx.fillStyle = `hsla(${hue}, 60%, ${lightness}%, ${alpha})`;
  ctx.fill();

  ctx.restore();
}

export class Fake3DEffect implements Effect {
  private boxes: FakeBox[] = Array.from({ length: 16 }, (_, index) => ({
    phase: index / 16,
    hue: 190 + index * 12,
    size: 110 - index * 2,
    wobble: 0.6 + index * 0.08
  }));

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const speed = params.speed ?? 1.0;
    const travel = (time * 0.12 * speed) % 1;
    const energy = clamp(audio.rms + audio.mid * 0.7, 0, 1);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgb(6, 10, 20)");
    gradient.addColorStop(1, "rgb(18, 24, 38)");

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    this.boxes
      .map((box) => {
        const phase = (box.phase + travel) % 1;
        const depth = 1 - phase;
        const scale = lerp(0.25, 1.2, depth);
        const baseX = Math.sin(time * 0.4 + box.wobble) * width * 0.28;
        const baseY = Math.cos(time * 0.35 + box.wobble) * height * 0.18;
        return {
          box,
          depth,
          scale,
          x: width / 2 + baseX * depth + Math.sin(time + box.wobble) * 30,
          y: height / 2 + baseY * depth + Math.cos(time * 0.8 + box.wobble) * 18
        };
      })
      .sort((a, b) => a.depth - b.depth)
      .forEach(({ box, depth, scale, x, y }) => {
        const size = box.size * scale * (1 + energy * 0.12);
        const alpha = 0.2 + depth * 0.8;
        drawFakeBox(ctx, x, y, size, depth, box.hue + energy * 40, alpha);
      });

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(0, 0, width, height);
  }
}
