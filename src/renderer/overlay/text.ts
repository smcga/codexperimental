import { STORY_LINES, getTextState } from "../../timeline";

export function renderStoryText(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
): void {
  const { index, opacity, yOffset, glitch } = getTextState(time);
  const text = STORY_LINES[index];
  const baseX = width / 2;
  const baseY = height * 0.7 + yOffset;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${Math.max(22, width * 0.035)}px "Courier New", monospace`;
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  ctx.shadowColor = "rgba(0, 200, 255, 0.6)";
  ctx.shadowBlur = 18;

  if (glitch > 0) {
    const jitter = glitch * 6;
    ctx.fillStyle = `rgba(255, 80, 80, ${opacity * 0.6})`;
    ctx.fillText(text, baseX + jitter, baseY - jitter);
    ctx.fillStyle = `rgba(80, 200, 255, ${opacity * 0.6})`;
    ctx.fillText(text, baseX - jitter, baseY + jitter);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  }

  ctx.fillText(text, baseX, baseY);
  ctx.restore();
}
