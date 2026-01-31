import { AudioFeatures } from "../../audio/audioPlayer";
import { Effect, EffectRenderContext } from "./types";

type ImagePulseState = {
  scale: number;
  rotation: number;
  opacity: number;
  flare: number;
};

type ImagePulseAudio = Pick<AudioFeatures, "bass" | "treble" | "rms" | "beatStrength">;

const DEFAULT_SPEED = 1;
const IMAGE_SRC = new URL("../../../img/94B53814-80C3-4851-A6D3-A590FBB6022F.png", import.meta.url).href;

export function getImagePulseState(time: number, audio: ImagePulseAudio, params: Record<string, number>): ImagePulseState {
  const speed = params.speed ?? DEFAULT_SPEED;
  const energy = Math.min(1, audio.bass * 0.6 + audio.treble * 0.4 + audio.beatStrength * 0.8);
  const pulse = 0.9 + energy * 0.35 + Math.sin(time * 1.1 * speed) * 0.08;
  const rotation = time * 0.25 * speed + Math.sin(time * 0.3) * 0.35 * (0.2 + audio.treble);
  const opacity = 0.45 + audio.rms * 0.45;
  const flare = 0.15 + audio.treble * 0.55 + audio.beatStrength * 0.3;

  return {
    scale: pulse,
    rotation,
    opacity,
    flare
  };
}

export class ImagePulseEffect implements Effect {
  private image: HTMLImageElement | null = null;
  private ready = false;

  constructor() {
    if (typeof Image !== "undefined") {
      this.image = new Image();
      this.image.src = IMAGE_SRC;
      this.image.onload = () => {
        this.ready = true;
      };
    }
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, width * 0.65);
    gradient.addColorStop(0, "rgba(20, 30, 48, 0.9)");
    gradient.addColorStop(1, "rgba(5, 8, 16, 0.95)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (!this.image || !this.ready) {
      ctx.fillStyle = "rgba(120, 160, 220, 0.15)";
      ctx.fillRect(width * 0.2, height * 0.2, width * 0.6, height * 0.6);
      return;
    }

    const state = getImagePulseState(time, audio, params);
    const centerX = width / 2 + Math.sin(time * 0.4) * width * 0.04 * state.flare;
    const centerY = height / 2 + Math.cos(time * 0.35) * height * 0.04 * state.flare;
    const baseScale = Math.min(width / this.image.width, height / this.image.height) * 0.7;
    const mainScale = baseScale * state.scale;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(state.rotation);
    ctx.globalCompositeOperation = "screen";

    const drawLayer = (scale: number, alpha: number) => {
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        this.image as HTMLImageElement,
        (-this.image.width * scale) / 2,
        (-this.image.height * scale) / 2,
        this.image.width * scale,
        this.image.height * scale
      );
    };

    drawLayer(mainScale * (1.08 + state.flare * 0.2), Math.min(0.35 + state.flare * 0.4, 0.8));
    drawLayer(mainScale, state.opacity);
    drawLayer(mainScale * 0.85, 0.25 + audio.treble * 0.3);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.2 + audio.treble * 0.25;
    ctx.strokeStyle = "rgba(120, 200, 255, 0.4)";
    ctx.lineWidth = 2 + audio.rms * 3;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, width * 0.15 * state.scale, height * 0.1 * state.scale, state.rotation, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
