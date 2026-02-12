import { AudioFeatures } from "../../audio/audioPlayer";
import { FramingState } from "../framing";

export type EffectRenderContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  delta: number;
  audio: AudioFeatures;
  params: Record<string, number>;
  era?: string;
  framing?: FramingState;
  safeRect?: { x: number; y: number; w: number; h: number };
};

export type Effect = {
  render: (context: EffectRenderContext) => void;
  reset?: () => void;
};
