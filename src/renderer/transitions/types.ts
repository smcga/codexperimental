import { AudioFeatures } from "../../audio/audioPlayer";
import { CameraState } from "../camera";

export type TransitionDrawContext = {
  ctx: CanvasRenderingContext2D;
  progress: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  shakeX: number;
  shakeY: number;
  width: number;
  height: number;
  camera: CameraState;
  smoothing: boolean;
  audio: AudioFeatures;
};

export type MobileTransitionDrawContext = {
  ctx: CanvasRenderingContext2D;
  progress: number;
  width: number;
  height: number;
  audio: AudioFeatures;
};

export type TransitionRendererApi = {
  drawFade: (context: TransitionDrawContext) => void;
  drawWipe: (context: TransitionDrawContext) => void;
  drawSlide: (context: TransitionDrawContext, directionX: number, directionY: number) => void;
  drawIris: (context: TransitionDrawContext) => void;
  drawFlash: (context: TransitionDrawContext) => void;
  drawSignalCollapse: (context: TransitionDrawContext) => void;
  drawShatter: (context: TransitionDrawContext) => void;
  drawCameraPunchThrough: (context: TransitionDrawContext) => void;
  drawBitplaneWipe: (context: TransitionDrawContext) => void;
  drawGlitch: (context: TransitionDrawContext) => void;
  drawAudioReactiveParticle: (context: TransitionDrawContext) => void;
  drawMobileDefaultCrossfade: (context: MobileTransitionDrawContext) => void;
  drawMobileShatter: (context: MobileTransitionDrawContext) => void;
  drawMobileCameraPunchThrough: (context: MobileTransitionDrawContext) => void;
  drawMobileBitplaneWipe: (context: MobileTransitionDrawContext) => void;
  drawMobileAudioReactiveParticle: (context: MobileTransitionDrawContext) => void;
};

export type TransitionSetupContext = {
  note: string;
};

export type TransitionStateContext = {
  progress: number;
  width: number;
  height: number;
  audio: AudioFeatures;
};

export type TransitionDefinition<TKey extends string = string> = {
  key: TKey;
  label: string;
  visibleInValidator: boolean;
  draw: (api: TransitionRendererApi, context: TransitionDrawContext) => void;
  drawMobile?: (api: TransitionRendererApi, context: MobileTransitionDrawContext) => void;
  setup?: (context: TransitionSetupContext) => void;
  createState?: (context: TransitionStateContext) => unknown;
};
