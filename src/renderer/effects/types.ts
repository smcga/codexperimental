import type { AudioFeatures } from "../../audio/audioPlayer";

export type EffectRenderArgs = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  delta: number;
  features: AudioFeatures;
  params?: Record<string, unknown>;
};

export type Effect = {
  render: (args: EffectRenderArgs) => void;
  reset?: () => void;
};
