import type { AudioFeatures } from "../../audio/audioPlayer";

export type EffectRenderContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  delta: number;
  features: AudioFeatures;
  params: Record<string, number>;
};

export type Effect = {
  render: (context: EffectRenderContext) => void;
  reset?: () => void;
};
