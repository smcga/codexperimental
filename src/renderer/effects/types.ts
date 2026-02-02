import { AudioFeatures } from "../../audio/audioSource";

export type EffectRenderContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  delta: number;
  audio: AudioFeatures;
  params: Record<string, number>;
};

export type Effect = {
  render: (context: EffectRenderContext) => void;
  reset?: () => void;
};
