import { buildPalette } from "../util/palette";
import { clamp, lerp } from "../util/math";
import { getDropIntensity, getEffectMix } from "../timeline";
import { plasmaValue } from "./effects/plasma";
import { tunnelValue } from "./effects/tunnel";
import { rotoValue } from "./effects/rotozoom";
import { Starfield } from "./effects/starfield";
import { ParticleSystem } from "./effects/particles";
import { renderStoryText } from "./overlay/text";

export type RenderContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  delta: number;
  kick: boolean;
  energy: number;
};

export class Renderer {
  private lowResCanvas: HTMLCanvasElement;
  private lowResCtx: CanvasRenderingContext2D;
  private imageData: ImageData;
  private palette = buildPalette();
  private starfield = new Starfield(220, 2.5);
  private particles = new ParticleSystem();
  private lastGlitch = 0;

  constructor(private baseWidth = 320, private baseHeight = 180) {
    this.lowResCanvas = document.createElement("canvas");
    this.lowResCanvas.width = baseWidth;
    this.lowResCanvas.height = baseHeight;
    const ctx = this.lowResCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create low-res canvas");
    }
    this.lowResCtx = ctx;
    this.imageData = ctx.createImageData(baseWidth, baseHeight);
  }

  handleKick(width: number, height: number, intensity: number): void {
    this.particles.emitBurst(32, width, height, 2 + intensity * 4);
    this.lastGlitch = 0.12 + intensity * 0.2;
  }

  render({ ctx, width, height, time, delta, kick, energy }: RenderContext): void {
    const dropIntensity = getDropIntensity(time);
    if (kick) {
      this.handleKick(width, height, dropIntensity + energy);
    }
    this.starfield.update(delta, 0.7 + energy * 1.2 + dropIntensity * 2.4);
    this.particles.update(delta);

    this.renderLowRes(time, energy, dropIntensity);

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width / this.baseWidth, height / this.baseHeight);
    const drawWidth = this.baseWidth * scale;
    const drawHeight = this.baseHeight * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.lowResCanvas, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();

    this.starfield.render(ctx, width, height, energy + dropIntensity);
    this.particles.render(ctx, dropIntensity + energy);

    this.renderGlitch(ctx, width, height, dropIntensity);
    this.renderScanlines(ctx, width, height, energy + dropIntensity);
    renderStoryText(ctx, width, height, time);
  }

  private renderLowRes(time: number, energy: number, dropIntensity: number): void {
    const mix = getEffectMix(time);
    const data = this.imageData.data;
    const width = this.baseWidth;
    const height = this.baseHeight;
    const t = time * 0.8;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4;
        const plasma = plasmaValue(x, y, t) * mix.plasma;
        const tunnel = tunnelValue(x, y, t) * mix.tunnel;
        const roto = rotoValue(x, y, t) * mix.roto;
        const value = clamp(plasma + tunnel + roto, 0, 1);
        const paletteIndex = Math.floor(value * 255);
        const color = this.palette[paletteIndex];
        const brightness = lerp(0.8, 1.2, clamp(energy + dropIntensity * 0.6, 0, 1));
        data[idx] = Math.min(255, (color & 255) * brightness);
        data[idx + 1] = Math.min(255, ((color >> 8) & 255) * brightness);
        data[idx + 2] = Math.min(255, ((color >> 16) & 255) * brightness);
        data[idx + 3] = 255;
      }
    }

    this.lowResCtx.putImageData(this.imageData, 0, 0);
  }

  private renderScanlines(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = `rgba(0, 0, 0, ${0.12 + intensity * 0.15})`;
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.2,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.8
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.45)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  private renderGlitch(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dropIntensity: number
  ): void {
    if (this.lastGlitch <= 0 && dropIntensity < 0.4) {
      return;
    }
    this.lastGlitch = Math.max(0, this.lastGlitch - 0.016);
    const slices = Math.floor(3 + dropIntensity * 6);
    for (let i = 0; i < slices; i += 1) {
      const sliceHeight = 8 + Math.random() * 18;
      const y = Math.random() * (height - sliceHeight);
      const offset = (Math.random() - 0.5) * 24 * (dropIntensity + 0.3);
      ctx.drawImage(ctx.canvas, 0, y, width, sliceHeight, offset, y, width, sliceHeight);
    }
  }
}
