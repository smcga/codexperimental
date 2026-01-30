import { getEffectsAtTime, getTextProgress, textLines } from '../timeline';
import { clamp } from '../util/math';
import { Starfield } from './effects/starfield';
import { PlasmaField } from './effects/plasma';
import { Tunnel } from './effects/tunnel';
import { Particles } from './effects/particles';
import { renderTextOverlay } from './overlay/text';

interface RenderOptions {
  demoTime: number;
  delta: number;
  intensity: number;
  beatStrength: number;
}

export class DemoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lowResCanvas: HTMLCanvasElement;
  private lowResCtx: CanvasRenderingContext2D;
  private plasma: PlasmaField;
  private tunnel: Tunnel;
  private starfield: Starfield;
  private particles: Particles;
  private width = 0;
  private height = 0;
  private renderWidth = 320;
  private renderHeight = 180;
  private shake = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context unavailable');
    }
    this.ctx = ctx;
    this.lowResCanvas = document.createElement('canvas');
    this.lowResCanvas.width = this.renderWidth;
    this.lowResCanvas.height = this.renderHeight;
    const lowResCtx = this.lowResCanvas.getContext('2d');
    if (!lowResCtx) {
      throw new Error('Low-res canvas context unavailable');
    }
    this.lowResCtx = lowResCtx;
    this.lowResCtx.imageSmoothingEnabled = false;

    this.plasma = new PlasmaField(160, 90);
    this.tunnel = new Tunnel(200, 112);
    this.starfield = new Starfield(200);
    this.particles = new Particles();
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.starfield.resize(this.renderWidth, this.renderHeight);
  }

  triggerBeat(strength: number) {
    this.shake = Math.min(12, this.shake + 6 * strength);
    this.particles.emitBurst(
      this.renderWidth / 2,
      this.renderHeight / 2,
      Math.floor(20 + 40 * strength),
      60 + 80 * strength
    );
  }

  update(options: RenderOptions) {
    const { demoTime, delta, intensity, beatStrength } = options;
    const effects = getEffectsAtTime(demoTime).map((effect) => effect.name);

    this.lowResCtx.fillStyle = 'rgba(0,0,0,0.3)';
    this.lowResCtx.fillRect(0, 0, this.renderWidth, this.renderHeight);

    this.starfield.update(delta, 0.4 + intensity * 1.2);
    this.starfield.render(this.lowResCtx, intensity);

    if (effects.includes('plasma')) {
      this.plasma.render(demoTime);
      this.plasma.drawTo(this.lowResCtx, this.renderWidth, this.renderHeight);
    }

    if (effects.includes('tunnel')) {
      this.tunnel.render(demoTime);
      this.tunnel.drawTo(this.lowResCtx, this.renderWidth, this.renderHeight);
    }

    this.particles.update(delta);

    const shakeOffset = this.applyShake(delta, beatStrength);

    this.ctx.save();
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const scale = Math.min(this.width / this.renderWidth, this.height / this.renderHeight);
    const drawWidth = this.renderWidth * scale;
    const drawHeight = this.renderHeight * scale;
    const offsetX = (this.width - drawWidth) / 2 + shakeOffset.x;
    const offsetY = (this.height - drawHeight) / 2 + shakeOffset.y;

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this.lowResCanvas, offsetX, offsetY, drawWidth, drawHeight);

    if (effects.includes('glitch')) {
      this.renderGlitch(offsetX, offsetY, drawWidth, drawHeight, intensity);
    }

    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);
    this.ctx.scale(scale, scale);
    this.particles.render(this.ctx);
    this.ctx.restore();

    this.renderPost(intensity + beatStrength * 0.4);

    const textState = getTextProgress(demoTime);
    if (textState) {
      renderTextOverlay(
        this.ctx,
        textLines[textState.index],
        textState.inProgress,
        textState.outProgress,
        demoTime,
        this.width,
        this.height
      );
    }

    this.ctx.restore();
  }

  private applyShake(delta: number, beatStrength: number) {
    this.shake *= Math.max(0, 1 - delta * 4);
    const amount = this.shake + beatStrength * 4;
    return {
      x: (Math.random() - 0.5) * amount,
      y: (Math.random() - 0.5) * amount
    };
  }

  private renderGlitch(x: number, y: number, w: number, h: number, intensity: number) {
    const sliceCount = Math.floor(4 + intensity * 6);
    for (let i = 0; i < sliceCount; i += 1) {
      const sliceHeight = h * (0.02 + Math.random() * 0.05);
      const sliceY = y + Math.random() * h;
      const offset = (Math.random() - 0.5) * 20 * intensity;
      this.ctx.drawImage(
        this.canvas,
        x,
        sliceY,
        w,
        sliceHeight,
        x + offset,
        sliceY,
        w,
        sliceHeight
      );
    }
  }

  private renderPost(intensity: number) {
    const vignette = this.ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      this.height * 0.2,
      this.width / 2,
      this.height / 2,
      this.height * 0.7
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.7)');
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const scanlineAlpha = clamp(0.12 + intensity * 0.15, 0.1, 0.3);
    this.ctx.fillStyle = `rgba(0,0,0,${scanlineAlpha})`;
    for (let y = 0; y < this.height; y += 3) {
      this.ctx.fillRect(0, y, this.width, 1);
    }
  }
}
