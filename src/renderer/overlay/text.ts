import { clamp, easeOutCubic, smoothstep } from '../../util/math';

export const renderTextOverlay = (
  ctx: CanvasRenderingContext2D,
  text: string,
  progressIn: number,
  progressOut: number,
  time: number,
  width: number,
  height: number
) => {
  const inEase = easeOutCubic(clamp(progressIn, 0, 1));
  const outEase = smoothstep(0, 1, clamp(progressOut, 0, 1));
  const alpha = Math.min(inEase, outEase);
  const yOffset = (1 - inEase) * 18;
  const jitter = (1 - outEase) * 2 * Math.sin(time * 30);
  const x = width / 2 + jitter;
  const y = height * 0.75 + yOffset;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(10, 10, 10, 0.6)';
  ctx.fillRect(0, height * 0.66, width, height * 0.2);
  ctx.font = `600 ${Math.floor(height * 0.065)}px Courier New, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = 'rgba(220, 255, 255, 0.95)';
  ctx.fillText(text, x, y);

  if (alpha > 0.2) {
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = 'rgba(255, 120, 200, 0.7)';
    ctx.fillText(text, x + 3, y - 2);
    ctx.fillStyle = 'rgba(80, 200, 255, 0.7)';
    ctx.fillText(text, x - 3, y + 2);
  }

  ctx.restore();
};
