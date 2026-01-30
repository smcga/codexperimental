import { clamp } from "../../util/math";

export interface TextState {
  text: string;
  alpha: number;
  offset: number;
  glitch: number;
}

export const renderText = (
  ctx: CanvasRenderingContext2D,
  state: TextState,
  width: number,
  height: number,
  intensity: number
) => {
  if (!state.text || state.alpha <= 0) {
    return;
  }
  ctx.save();
  ctx.font = "bold 32px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const baseX = width / 2;
  const baseY = height * 0.72 - state.offset;
  const glow = clamp(state.alpha + intensity * 0.2, 0, 1);
  ctx.shadowColor = "rgba(140, 255, 220, 0.6)";
  ctx.shadowBlur = 12;

  const jitter = state.glitch > 0 ? (Math.random() - 0.5) * 10 * state.glitch : 0;
  const alpha = state.alpha;

  ctx.fillStyle = `rgba(220, 255, 245, ${alpha})`;
  ctx.fillText(state.text, baseX + jitter, baseY + jitter);

  if (state.glitch > 0.2) {
    ctx.fillStyle = `rgba(255, 120, 180, ${alpha * 0.6})`;
    ctx.fillText(state.text, baseX + 6 * state.glitch, baseY - 3 * state.glitch);
    ctx.fillStyle = `rgba(120, 180, 255, ${alpha * 0.6})`;
    ctx.fillText(state.text, baseX - 6 * state.glitch, baseY + 3 * state.glitch);
  }

  ctx.restore();
};
