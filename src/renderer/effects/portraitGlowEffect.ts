import { Effect, EffectRenderContext } from "./types";

const portraitSrc = new URL("../../../img/94B53814-80C3-4851-A6D3-A590FBB6022F.png", import.meta.url).toString();

type ImagePlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function computeCoverPlacement(
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number,
  scale = 1
): ImagePlacement {
  if (canvasWidth <= 0 || canvasHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const canvasAspect = canvasWidth / canvasHeight;
  const imageAspect = imageWidth / imageHeight;

  let width = canvasWidth * scale;
  let height = canvasHeight * scale;

  if (imageAspect > canvasAspect) {
    height = canvasHeight * scale;
    width = height * imageAspect;
  } else {
    width = canvasWidth * scale;
    height = width / imageAspect;
  }

  return {
    x: (canvasWidth - width) / 2,
    y: (canvasHeight - height) / 2,
    width,
    height
  };
}

export class PortraitGlowEffect implements Effect {
  private image = new Image();
  private loaded = false;

  constructor() {
    this.image.src = portraitSrc;
    this.image.addEventListener("load", () => {
      this.loaded = true;
    });
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const baseZoom = params.zoom ?? 1.05;
    const drift = params.drift ?? 1;
    const pulse = Math.sin(time * 0.6 * drift) * 0.02 + audio.bass * 0.08 + (audio.beat ? audio.beatStrength * 0.12 : 0);
    const zoom = baseZoom + pulse;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#05070c");
    gradient.addColorStop(1, "#120d18");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (!this.loaded || this.image.naturalWidth === 0 || this.image.naturalHeight === 0) {
      ctx.fillStyle = "rgba(24, 32, 48, 0.6)";
      ctx.fillRect(0, 0, width, height);
      return;
    }

    const placement = computeCoverPlacement(width, height, this.image.naturalWidth, this.image.naturalHeight, zoom);
    const offsetX = Math.sin(time * 0.35 * drift) * 18 * (0.3 + audio.mid);
    const offsetY = Math.cos(time * 0.28 * drift) * 12 * (0.3 + audio.treble);

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.filter = `brightness(${1 + audio.treble * 0.35}) contrast(${1 + audio.mid * 0.2})`;
    ctx.drawImage(
      this.image,
      placement.x + offsetX,
      placement.y + offsetY,
      placement.width,
      placement.height
    );
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.3 + audio.treble * 0.15;
    ctx.filter = `blur(${6 + audio.bass * 12}px)`;
    ctx.drawImage(
      this.image,
      placement.x - offsetX * 0.6,
      placement.y - offsetY * 0.6,
      placement.width,
      placement.height
    );
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = 0.08 + audio.bass * 0.08;
    ctx.fillStyle = "#1c2a3d";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
