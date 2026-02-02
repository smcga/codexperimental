import { AudioFeatures } from "../audio/audioSource";
import { clamp } from "../util/math";

export type CameraState = {
  zoom: number;
  panX: number;
  panY: number;
};

export const computeDynamicCamera = (
  time: number,
  audio: AudioFeatures,
  baseWidth: number,
  baseHeight: number
): CameraState => {
  const driftX = Math.sin(time * 0.18) * 0.035;
  const driftY = Math.cos(time * 0.23) * 0.03;
  const zoomPulse = 0.04 * Math.sin(time * 0.32) + audio.bass * 0.015 + audio.beatStrength * 0.03;
  const zoom = clamp(1 + zoomPulse, 1, 1.12);
  const panX = baseWidth * (driftX + audio.mid * 0.01 * Math.sin(time * 0.9));
  const panY = baseHeight * (driftY + audio.treble * 0.008 * Math.cos(time * 0.7));

  return {
    zoom,
    panX,
    panY
  };
};
