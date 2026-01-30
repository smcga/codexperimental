import { AudioFeatures } from "../../audio/audioPlayer";

export type EffectRenderContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  delta: number;
  audio: AudioFeatures;
  params: Record<string, number>;
};

export type EffectDefinition = {
  name: string;
  render: (context: EffectRenderContext) => void;
  reset?: () => void;
};
