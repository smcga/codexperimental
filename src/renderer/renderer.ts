import { AudioFeatures } from "../audio/audioPlayer";
import { SectionConfig, TextCue, TransitionType } from "../config/loadConfig";
import { clamp } from "../util/math";
import { CameraState, computeDynamicCamera } from "./camera";
import { EraConstraints, getEraConstraints, quantizeToPalette } from "./eraConstraints";
import { effectRegistry, resetEffects } from "./effects";
import { computeLetterbox } from "./letterbox";
import { resolveMonochrome } from "./monochrome";
import { renderTextCues } from "./text/textRenderer";

export type RenderState = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  delta: number;
  monochromeOverride?: boolean | null;
  section: SectionConfig;
  transition?: {
    from: SectionConfig;
    to: SectionConfig;
    progress: number;
    type: TransitionType;
  };
  textCues: TextCue[];
  audio: AudioFeatures;
  screenShake?: { x: number; y: number };
};

export class Renderer {
  private baseCanvas: HTMLCanvasElement;
  private baseCtx: CanvasRenderingContext2D;
  private transitionCanvas: HTMLCanvasElement;
  private transitionCtx: CanvasRenderingContext2D;
  private sceneCanvas: HTMLCanvasElement;
  private sceneCtx: CanvasRenderingContext2D;
  private layerCanvas: HTMLCanvasElement;
  private layerCtx: CanvasRenderingContext2D;
  private baseWidth: number;
  private baseHeight: number;

  constructor(baseWidth = 320, baseHeight = 180) {
    this.baseWidth = baseWidth;
    this.baseHeight = baseHeight;
    this.baseCanvas = document.createElement("canvas");
    this.baseCanvas.width = baseWidth;
    this.baseCanvas.height = baseHeight;
    const baseCtx = this.baseCanvas.getContext("2d");
    if (!baseCtx) {
      throw new Error("Unable to create base canvas");
    }
    this.baseCtx = baseCtx;

    this.transitionCanvas = document.createElement("canvas");
    this.transitionCanvas.width = baseWidth;
    this.transitionCanvas.height = baseHeight;
    const transitionCtx = this.transitionCanvas.getContext("2d");
    if (!transitionCtx) {
      throw new Error("Unable to create transition canvas");
    }
    this.transitionCtx = transitionCtx;

    this.sceneCanvas = document.createElement("canvas");
    this.sceneCanvas.width = baseWidth;
    this.sceneCanvas.height = baseHeight;
    const sceneCtx = this.sceneCanvas.getContext("2d");
    if (!sceneCtx) {
      throw new Error("Unable to create scene canvas");
    }
    this.sceneCtx = sceneCtx;

    this.layerCanvas = document.createElement("canvas");
    this.layerCanvas.width = baseWidth;
    this.layerCanvas.height = baseHeight;
    const layerCtx = this.layerCanvas.getContext("2d");
    if (!layerCtx) {
      throw new Error("Unable to create layer canvas");
    }
    this.layerCtx = layerCtx;
  }

  reset(): void {
    resetEffects();
    this.baseCtx.clearRect(0, 0, this.baseWidth, this.baseHeight);
    this.transitionCtx.clearRect(0, 0, this.baseWidth, this.baseHeight);
    this.sceneCtx.clearRect(0, 0, this.sceneCanvas.width, this.sceneCanvas.height);
    this.layerCtx.clearRect(0, 0, this.baseWidth, this.baseHeight);
  }

  render({
    ctx,
    width,
    height,
    time,
    delta,
    section,
    transition,
    textCues,
    audio,
    monochromeOverride,
    screenShake
  }: RenderState): void {
    const activeSection = transition?.to ?? section;
    const eraConstraints = getEraConstraints(activeSection.era, this.baseWidth, this.baseHeight);
    const baseShake = audio.beatStrength * 6;
    const shakeX = (baseShake + (screenShake?.x ?? 0)) * eraConstraints.cameraShake;
    const shakeY = (baseShake + (screenShake?.y ?? 0)) * eraConstraints.cameraShake;
    const { scale, offsetX, offsetY } = computeLetterbox(width, height, this.baseWidth, this.baseHeight);
    const monochrome = resolveMonochrome(time, monochromeOverride);
    const camera = this.applyCameraConstraints(
      computeDynamicCamera(time, audio, this.baseWidth, this.baseHeight),
      eraConstraints
    );

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    if (monochrome) {
      ctx.save();
      ctx.filter = "grayscale(1)";
    }

    if (transition) {
      this.renderSectionTo(this.transitionCtx, transition.from, time, delta, audio);
      this.renderSectionTo(this.baseCtx, transition.to, time, delta, audio);
      this.drawTransition(ctx, transition, scale, offsetX, offsetY, shakeX, shakeY, camera, eraConstraints);
    } else {
      this.renderSectionTo(this.baseCtx, section, time, delta, audio);
      this.drawScaled(
        ctx,
        this.baseCanvas,
        scale,
        offsetX,
        offsetY,
        shakeX,
        shakeY,
        1,
        camera,
        eraConstraints.smoothing
      );
    }

    if (monochrome) {
      ctx.restore();
    }

    ctx.save();
    ctx.translate(offsetX + shakeX, offsetY + shakeY);
    ctx.scale(scale, scale);
    this.applyCameraTransform(ctx, camera);
    this.renderOverlays(ctx, this.baseWidth, this.baseHeight, audio, eraConstraints);
    renderTextCues(ctx, this.baseWidth, this.baseHeight, textCues, time);
    ctx.restore();
  }

  private renderSectionTo(
    targetCtx: CanvasRenderingContext2D,
    section: SectionConfig,
    time: number,
    delta: number,
    audio: AudioFeatures
  ): void {
    const eraConstraints = getEraConstraints(section.era, this.baseWidth, this.baseHeight);
    this.ensureSceneSize(eraConstraints.renderWidth, eraConstraints.renderHeight);
    this.sceneCtx.clearRect(0, 0, this.sceneCanvas.width, this.sceneCanvas.height);
    this.renderEffectTo(
      this.sceneCtx,
      section.effect,
      time,
      delta,
      audio,
      section.params,
      this.sceneCanvas.width,
      this.sceneCanvas.height
    );

    if (section.layers.length > 0) {
      section.layers.forEach((layer) => {
        this.layerCtx.clearRect(0, 0, this.layerCanvas.width, this.layerCanvas.height);
        this.renderEffectTo(
          this.layerCtx,
          layer.effect,
          time,
          delta,
          audio,
          layer.params,
          this.layerCanvas.width,
          this.layerCanvas.height
        );
        this.sceneCtx.save();
        this.sceneCtx.globalCompositeOperation = layer.blend;
        this.sceneCtx.globalAlpha = layer.opacity;
        this.sceneCtx.drawImage(this.layerCanvas, 0, 0);
        this.sceneCtx.restore();
      });
    }

    if (eraConstraints.palette) {
      const imageData = this.sceneCtx.getImageData(0, 0, this.sceneCanvas.width, this.sceneCanvas.height);
      quantizeToPalette(imageData.data, eraConstraints.palette);
      this.sceneCtx.putImageData(imageData, 0, 0);
    }

    targetCtx.save();
    targetCtx.clearRect(0, 0, this.baseWidth, this.baseHeight);
    targetCtx.imageSmoothingEnabled = eraConstraints.smoothing;
    targetCtx.drawImage(this.sceneCanvas, 0, 0, this.baseWidth, this.baseHeight);
    targetCtx.restore();
  }

  private renderEffectTo(
    targetCtx: CanvasRenderingContext2D,
    effectName: string,
    time: number,
    delta: number,
    audio: AudioFeatures,
    params: Record<string, number>,
    width: number,
    height: number
  ): void {
    const effect = effectRegistry[effectName];
    if (!effect) {
      targetCtx.fillStyle = "#000";
      targetCtx.fillRect(0, 0, width, height);
      targetCtx.fillStyle = "#fff";
      targetCtx.fillText(`Missing effect: ${effectName}`, 12, 24);
      return;
    }
    effect.render({
      ctx: targetCtx,
      width,
      height,
      time,
      delta,
      audio,
      params
    });
  }

  private drawTransition(
    ctx: CanvasRenderingContext2D,
    transition: Required<RenderState>["transition"],
    scale: number,
    offsetX: number,
    offsetY: number,
    shakeX: number,
    shakeY: number,
    camera: CameraState,
    eraConstraints: EraConstraints
  ): void {
    const progress = transition.progress;
    switch (transition.type) {
      case "wipe": {
        this.drawScaled(
          ctx,
          this.transitionCanvas,
          scale,
          offsetX,
          offsetY,
          shakeX,
          shakeY,
          1,
          camera,
          eraConstraints.smoothing
        );
        ctx.save();
        ctx.beginPath();
        const wipeX = offsetX + (this.baseWidth * scale + shakeX) * progress;
        ctx.rect(offsetX, offsetY, wipeX - offsetX, this.baseHeight * scale + shakeY * 2);
        ctx.clip();
        this.drawScaled(
          ctx,
          this.baseCanvas,
          scale,
          offsetX,
          offsetY,
          shakeX,
          shakeY,
          1,
          camera,
          eraConstraints.smoothing
        );
        ctx.restore();
        return;
      }
      case "slide-left":
        this.drawSlideTransition(
          ctx,
          progress,
          -1,
          0,
          scale,
          offsetX,
          offsetY,
          shakeX,
          shakeY,
          camera,
          eraConstraints.smoothing
        );
        return;
      case "slide-right":
        this.drawSlideTransition(
          ctx,
          progress,
          1,
          0,
          scale,
          offsetX,
          offsetY,
          shakeX,
          shakeY,
          camera,
          eraConstraints.smoothing
        );
        return;
      case "slide-up":
        this.drawSlideTransition(
          ctx,
          progress,
          0,
          -1,
          scale,
          offsetX,
          offsetY,
          shakeX,
          shakeY,
          camera,
          eraConstraints.smoothing
        );
        return;
      case "slide-down":
        this.drawSlideTransition(
          ctx,
          progress,
          0,
          1,
          scale,
          offsetX,
          offsetY,
          shakeX,
          shakeY,
          camera,
          eraConstraints.smoothing
        );
        return;
      case "iris":
        this.drawIrisTransition(
          ctx,
          progress,
          scale,
          offsetX,
          offsetY,
          shakeX,
          shakeY,
          camera,
          eraConstraints.smoothing
        );
        return;
      case "flash":
        this.drawFlashTransition(
          ctx,
          progress,
          scale,
          offsetX,
          offsetY,
          shakeX,
          shakeY,
          camera,
          eraConstraints.smoothing
        );
        return;
      case "fade":
        this.drawFadeTransition(
          ctx,
          progress,
          scale,
          offsetX,
          offsetY,
          shakeX,
          shakeY,
          camera,
          eraConstraints.smoothing
        );
        return;
      default: {
        const _exhaustiveCheck: never = transition.type;
        return _exhaustiveCheck;
      }
    }
  }

  private drawFadeTransition(
    ctx: CanvasRenderingContext2D,
    progress: number,
    scale: number,
    offsetX: number,
    offsetY: number,
    shakeX: number,
    shakeY: number,
    camera: CameraState,
    smoothing: boolean
  ): void {
    this.drawScaled(
      ctx,
      this.transitionCanvas,
      scale,
      offsetX,
      offsetY,
      shakeX,
      shakeY,
      1 - progress,
      camera,
      smoothing
    );
    this.drawScaled(ctx, this.baseCanvas, scale, offsetX, offsetY, shakeX, shakeY, progress, camera, smoothing);
  }

  private drawSlideTransition(
    ctx: CanvasRenderingContext2D,
    progress: number,
    directionX: number,
    directionY: number,
    scale: number,
    offsetX: number,
    offsetY: number,
    shakeX: number,
    shakeY: number,
    camera: CameraState,
    smoothing: boolean
  ): void {
    const width = this.baseWidth * scale;
    const height = this.baseHeight * scale;
    const fromOffsetX = offsetX + width * progress * directionX;
    const fromOffsetY = offsetY + height * progress * directionY;
    const toOffsetX = offsetX - width * (1 - progress) * directionX;
    const toOffsetY = offsetY - height * (1 - progress) * directionY;

    this.drawScaled(ctx, this.transitionCanvas, scale, fromOffsetX, fromOffsetY, shakeX, shakeY, 1, camera, smoothing);
    this.drawScaled(ctx, this.baseCanvas, scale, toOffsetX, toOffsetY, shakeX, shakeY, 1, camera, smoothing);
  }

  private drawIrisTransition(
    ctx: CanvasRenderingContext2D,
    progress: number,
    scale: number,
    offsetX: number,
    offsetY: number,
    shakeX: number,
    shakeY: number,
    camera: CameraState,
    smoothing: boolean
  ): void {
    this.drawScaled(ctx, this.transitionCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1, camera, smoothing);
    const width = this.baseWidth * scale;
    const height = this.baseHeight * scale;
    const maxRadius = Math.hypot(width, height) / 2;
    const centerX = offsetX + shakeX + width / 2;
    const centerY = offsetY + shakeY + height / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius * progress, 0, Math.PI * 2);
    ctx.clip();
    this.drawScaled(ctx, this.baseCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1, camera, smoothing);
    ctx.restore();
  }

  private drawFlashTransition(
    ctx: CanvasRenderingContext2D,
    progress: number,
    scale: number,
    offsetX: number,
    offsetY: number,
    shakeX: number,
    shakeY: number,
    camera: CameraState,
    smoothing: boolean
  ): void {
    this.drawFadeTransition(ctx, progress, scale, offsetX, offsetY, shakeX, shakeY, camera, smoothing);
    const flashStrength = 1 - Math.abs(0.5 - progress) * 2;
    ctx.save();
    ctx.globalAlpha = flashStrength * 0.65;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
      offsetX + shakeX,
      offsetY + shakeY,
      this.baseWidth * scale,
      this.baseHeight * scale
    );
    ctx.restore();
  }

  private drawScaled(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    scale: number,
    offsetX: number,
    offsetY: number,
    shakeX: number,
    shakeY: number,
    alpha: number,
    camera: CameraState,
    smoothing: boolean
  ): void {
    ctx.save();
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.imageSmoothingEnabled = smoothing;
    ctx.translate(offsetX + shakeX, offsetY + shakeY);
    ctx.translate((this.baseWidth * scale) / 2, (this.baseHeight * scale) / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(
      -(this.baseWidth * scale) / 2 + camera.panX * scale,
      -(this.baseHeight * scale) / 2 + camera.panY * scale
    );
    ctx.drawImage(canvas, 0, 0, this.baseWidth * scale, this.baseHeight * scale);
    ctx.restore();
  }

  private renderOverlays(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    audio: AudioFeatures,
    eraConstraints: EraConstraints
  ): void {
    const scanlineStrength = clamp(eraConstraints.overlayScanline, 0, 1.5);
    const vignetteStrength = clamp(eraConstraints.overlayVignette, 0, 1.5);
    if (scanlineStrength <= 0 && vignetteStrength <= 0) {
      return;
    }

    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = `rgba(0, 0, 0, ${clamp((0.1 + audio.rms * 0.2) * scanlineStrength, 0, 1)})`;
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }
    ctx.restore();

    if (vignetteStrength <= 0) {
      return;
    }

    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.2,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.8
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, `rgba(0, 0, 0, ${clamp(0.6 * vignetteStrength, 0, 1)})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  private applyCameraTransform(ctx: CanvasRenderingContext2D, camera: CameraState): void {
    ctx.translate(this.baseWidth / 2, this.baseHeight / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-this.baseWidth / 2 + camera.panX, -this.baseHeight / 2 + camera.panY);
  }

  private applyCameraConstraints(camera: CameraState, eraConstraints: EraConstraints): CameraState {
    const zoomDelta = camera.zoom - 1;
    return {
      zoom: 1 + zoomDelta * eraConstraints.cameraZoom,
      panX: camera.panX * eraConstraints.cameraPan,
      panY: camera.panY * eraConstraints.cameraPan
    };
  }

  private ensureSceneSize(width: number, height: number): void {
    if (this.sceneCanvas.width !== width || this.sceneCanvas.height !== height) {
      this.sceneCanvas.width = width;
      this.sceneCanvas.height = height;
    }
    if (this.layerCanvas.width !== width || this.layerCanvas.height !== height) {
      this.layerCanvas.width = width;
      this.layerCanvas.height = height;
    }
  }
}
