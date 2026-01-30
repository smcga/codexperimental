import { TEXT_TRANSITION_DURATION, TEXT_VISIBLE_DURATION } from "../../timeline";
import { clamp, easeOutCubic } from "../../util/math";

export const renderStoryText = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  text: string,
  start: number,
  end: number
) => {
  const fadeInStart = start - TEXT_TRANSITION_DURATION;
  const fadeOutEnd = end + TEXT_TRANSITION_DURATION;
  const fadeIn = clamp((time - fadeInStart) / TEXT_TRANSITION_DURATION, 0, 1);
  const fadeOut = clamp((fadeOutEnd - time) / TEXT_TRANSITION_DURATION, 0, 1);
  const visibility = Math.min(fadeIn, fadeOut);
  if (visibility <= 0) {
    return;
  }

  const timeSinceStart = time - start;
  const isGlitch = timeSinceStart >= 0 && timeSinceStart < 0.35;
  const drift = easeOutCubic(clamp(timeSinceStart / TEXT_VISIBLE_DURATION, 0, 1));
  const y = height * 0.65 - drift * 18;
  const baseX = width * 0.5;
  const jitter = isGlitch ? (Math.random() - 0.5) * 8 : 0;

  ctx.save();
  ctx.globalAlpha = visibility;
  ctx.font = "28px 'Trebuchet MS', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0, 220, 255, 0.4)";
  ctx.shadowBlur = 12;

  if (isGlitch) {
    ctx.fillStyle = "rgba(0, 255, 255, 0.8)";
    ctx.fillText(text, baseX + jitter + 4, y);
    ctx.fillStyle = "rgba(255, 120, 255, 0.7)";
    ctx.fillText(text, baseX + jitter - 4, y + 2);
  }

  ctx.fillStyle = "white";
  ctx.fillText(text, baseX + jitter, y);
  ctx.restore();
};
