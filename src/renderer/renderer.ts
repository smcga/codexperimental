import { getActiveEffects, getTextWindow, STORY_LINES, dropTime } from "../timeline";
import { clamp } from "../util/math";
import { ParticleSystem } from "./effects/particles";
import { Plasma } from "./effects/plasma";
import { Starfield } from "./effects/starfield";
import { Tunnel } from "./effects/tunnel";
import { renderStoryText } from "./overlay/text";

const LOW_RES_WIDTH = 320;
const LOW_RES_HEIGHT = 180;

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lowCanvas: HTMLCanvasElement;
  private lowCtx: CanvasRenderingContext2D;
  private starfield: Starfield;
  private plasma: Plasma;
  private plasmaCanvas: HTMLCanvasElement;
  private plasmaCtx: CanvasRenderingContext2D | null;
  private tunnel: Tunnel;
  private tunnelCanvas: HTMLCanvasElement;
  private tunnelCtx: CanvasRenderingContext2D | null;
  private particles: ParticleSystem;
  private lastTime = 0;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context not available");
    }
    this.ctx = ctx;
    this.lowCanvas = document.createElement("canvas");
    this.lowCanvas.width = LOW_RES_WIDTH;
    this.lowCanvas.height = LOW_RES_HEIGHT;
    const lowCtx = this.lowCanvas.getContext("2d", { willReadFrequently: true });
    if (!lowCtx) {
      throw new Error("Low-res context not available");
    }
    this.lowCtx = lowCtx;
    this.starfield = new Starfield(LOW_RES_WIDTH, LOW_RES_HEIGHT);
    this.plasma = new Plasma(LOW_RES_WIDTH, LOW_RES_HEIGHT);
    this.plasmaCanvas = document.createElement("canvas");
    this.plasmaCanvas.width = LOW_RES_WIDTH;
    this.plasmaCanvas.height = LOW_RES_HEIGHT;
    this.plasmaCtx = this.plasmaCanvas.getContext("2d", { willReadFrequently: true });
    this.tunnel = new Tunnel(160, 90);
    this.tunnelCanvas = document.createElement("canvas");
    this.tunnelCanvas.width = 160;
    this.tunnelCanvas.height = 90;
    this.tunnelCtx = this.tunnelCanvas.getContext("2d", { willReadFrequently: true });
    this.particles = new ParticleSystem(LOW_RES_WIDTH, LOW_RES_HEIGHT);
    this.resize();
  }

  resize() {
    const { innerWidth, innerHeight } = window;
    this.canvas.width = innerWidth;
    this.canvas.height = innerHeight;
    const scale = Math.min(innerWidth / LOW_RES_WIDTH, innerHeight / LOW_RES_HEIGHT);
    this.scale = scale;
    this.offsetX = (innerWidth - LOW_RES_WIDTH * scale) / 2;
    this.offsetY = (innerHeight - LOW_RES_HEIGHT * scale) / 2;
  }

  render(time: number, beatPulse: number) {
    if (this.lastTime === 0) {
      this.lastTime = time;
    }
    const dt = Math.min(0.05, time - this.lastTime);
    this.lastTime = time;
    const ctx = this.ctx;
    const activeEffects = getActiveEffects(time);
    const dropIntensity = time >= dropTime ? 1 : 0;
    const intensity = clamp(0.4 + beatPulse + dropIntensity * 0.7, 0, 1.8);

    this.lowCtx.fillStyle = "black";
    this.lowCtx.fillRect(0, 0, LOW_RES_WIDTH, LOW_RES_HEIGHT);

    if (activeEffects.includes("starfield")) {
      this.starfield.update(dt, 0.4 + intensity * 0.8);
      this.starfield.render(this.lowCtx);
    }

    if (activeEffects.includes("plasma")) {
      const plasmaData = this.plasma.render(time, intensity * 0.6);
      if (this.plasmaCtx) {
        this.plasmaCtx.putImageData(plasmaData, 0, 0);
        this.lowCtx.save();
        this.lowCtx.globalAlpha = 0.75 + intensity * 0.15;
        this.lowCtx.drawImage(this.plasmaCanvas, 0, 0);
        this.lowCtx.restore();
      }
    }

    if (activeEffects.includes("tunnel")) {
      const tunnelData = this.tunnel.render(time, intensity);
      if (this.tunnelCtx) {
        this.tunnelCtx.putImageData(tunnelData, 0, 0);
        this.lowCtx.save();
        this.lowCtx.globalAlpha = 0.9;
        this.lowCtx.imageSmoothingEnabled = false;
        this.lowCtx.drawImage(this.tunnelCanvas, 0, 0, LOW_RES_WIDTH, LOW_RES_HEIGHT);
        this.lowCtx.restore();
      }
    }

    this.particles.update(dt);
    if (time >= dropTime && Math.random() < 0.2) {
      this.particles.emitBurst(10, intensity);
    }
    this.particles.render(this.lowCtx);

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.lowCanvas,
      0,
      0,
      LOW_RES_WIDTH,
      LOW_RES_HEIGHT,
      this.offsetX,
      this.offsetY,
      LOW_RES_WIDTH * this.scale,
      LOW_RES_HEIGHT * this.scale
    );

    this.renderOverlay(time, beatPulse, activeEffects);
  }

  triggerBeat() {
    this.particles.emitBurst(28, 1);
  }

  private renderOverlay(time: number, beatPulse: number, activeEffects: string[]) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const textWindow = getTextWindow(time);

    if (textWindow) {
      renderStoryText(ctx, width, height, time, STORY_LINES[textWindow.index], textWindow.start, textWindow.end);
    }

    if (activeEffects.includes("glitch") && Math.random() < 0.08) {
      const sliceHeight = 12 + Math.random() * 18;
      const y = Math.random() * (height - sliceHeight);
      const offset = (Math.random() - 0.5) * 20;
      ctx.drawImage(this.canvas, 0, y, width, sliceHeight, offset, y, width, sliceHeight);
    }

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "overlay";
    for (let y = 0; y < height; y += 4) {
      ctx.fillStyle = `rgba(255,255,255,${0.05 + beatPulse * 0.1})`;
      ctx.fillRect(0, y, width, 1);
    }

    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.2,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

}
