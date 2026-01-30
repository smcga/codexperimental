import { Starfield } from "./effects/starfield";
import { Plasma } from "./effects/plasma";
import { Tunnel } from "./effects/tunnel";
import { Particles } from "./effects/particles";
import { renderText, TextState } from "./overlay/text";
import { clamp } from "../util/math";

export interface EffectState {
  starfield: number;
  plasma: number;
  tunnel: number;
  particles: number;
  glitch: number;
}

export class Renderer {
  private lowResCanvas: HTMLCanvasElement;
  private lowCtx: CanvasRenderingContext2D;
  private starfield: Starfield;
  private plasma: Plasma;
  private tunnel: Tunnel;
  private particles: Particles;
  private width = 320;
  private height = 180;

  constructor() {
    this.lowResCanvas = document.createElement("canvas");
    this.lowResCanvas.width = this.width;
    this.lowResCanvas.height = this.height;
    const ctx = this.lowResCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("2D context not available");
    }
    this.lowCtx = ctx;
    this.lowCtx.imageSmoothingEnabled = false;

    this.starfield = new Starfield(140);
    this.plasma = new Plasma(this.width, this.height);
    this.tunnel = new Tunnel(this.width, this.height);
    this.particles = new Particles();
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.lowResCanvas.width = width;
    this.lowResCanvas.height = height;
    this.lowCtx.imageSmoothingEnabled = false;
    this.starfield.resize(width, height);
    this.plasma.resize(width, height);
    this.tunnel.resize(width, height);
    this.particles.resize(width, height);
  }

  update(delta: number, warp: number) {
    this.starfield.update(delta, warp);
    this.particles.update(delta);
  }

  burstParticles(intensity: number) {
    this.particles.burst(32, 1.2 + intensity * 2);
  }

  render(
    ctx: CanvasRenderingContext2D,
    time: number,
    effects: EffectState,
    text: TextState,
    intensity: number,
    screenWidth: number,
    screenHeight: number
  ) {
    this.lowCtx.clearRect(0, 0, this.width, this.height);
    this.starfield.render(this.lowCtx, effects.starfield + intensity * 0.2);

    if (effects.plasma > 0.05) {
      this.plasma.render(this.lowCtx, time, effects.plasma);
    }

    if (effects.tunnel > 0.05) {
      this.tunnel.render(this.lowCtx, time, effects.tunnel);
    }

    if (effects.particles > 0) {
      this.particles.render(this.lowCtx, intensity);
    }

    const { scale, offsetX, offsetY } = this.fitToScreen(screenWidth, screenHeight);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, screenWidth, screenHeight);
    ctx.drawImage(
      this.lowResCanvas,
      0,
      0,
      this.width,
      this.height,
      offsetX,
      offsetY,
      this.width * scale,
      this.height * scale
    );

    this.renderGlitch(ctx, effects.glitch, scale, offsetX, offsetY);

    renderText(ctx, text, screenWidth, screenHeight, intensity);
    this.renderScanlines(ctx, screenWidth, screenHeight, intensity);
    ctx.restore();
  }

  private renderScanlines(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number
  ) {
    ctx.save();
    ctx.globalAlpha = 0.15 + intensity * 0.2;
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 1);
    }
    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.2,
      width / 2,
      height / 2,
      width * 0.7
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  private renderGlitch(
    ctx: CanvasRenderingContext2D,
    amount: number,
    scale: number,
    offsetX: number,
    offsetY: number
  ) {
    if (amount <= 0.05) {
      return;
    }
    const slices = Math.floor(3 + amount * 10);
    ctx.save();
    ctx.globalAlpha = clamp(amount, 0.2, 0.8);
    for (let i = 0; i < slices; i += 1) {
      const sliceHeight = Math.max(4, Math.random() * 20);
      const y = Math.random() * (this.height * scale - sliceHeight) + offsetY;
      const xOffset = (Math.random() - 0.5) * 20 * amount;
      ctx.drawImage(
        this.lowResCanvas,
        0,
        (y - offsetY) / scale,
        this.width,
        sliceHeight / scale,
        offsetX + xOffset,
        y,
        this.width * scale,
        sliceHeight
      );
    }
    ctx.restore();
  }

  private fitToScreen(canvasWidth: number, canvasHeight: number) {
    const scale = Math.min(canvasWidth / this.width, canvasHeight / this.height);
    const offsetX = (canvasWidth - this.width * scale) / 2;
    const offsetY = (canvasHeight - this.height * scale) / 2;
    return { scale, offsetX, offsetY };
  }
}
