import { AudioFeatures } from "../audio/audioPlayer";
import { FitAlign, SectionConfig, TextCue, TransitionType } from "../config/loadConfig";
import { resolveAutomatedParams } from "../timeline/automation";
import { clamp } from "../util/math";
import { CameraState, computeDynamicCamera } from "./camera";
import { EraConstraints, getEraConstraints, quantizeToPalette } from "./eraConstraints";
import { effectRegistry, resetEffects } from "./effects";
import { computeFraming, FramingOverride, FramingState } from "./framing";
import { resolveMonochrome } from "./monochrome";
import { computePresentTransform, computeScreenSafeRect } from "./present";
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
  framingOverride?: FramingOverride;
};

type FitAlignDebug = {
  sectionFitAlign: FitAlign;
  layerFitAligns: FitAlign[];
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
  private passCanvas: HTMLCanvasElement;
  private passCtx: CanvasRenderingContext2D;
  private mobileFromCanvas: HTMLCanvasElement;
  private mobileFromCtx: CanvasRenderingContext2D;
  private mobileToCanvas: HTMLCanvasElement;
  private mobileToCtx: CanvasRenderingContext2D;
  private baseWidth: number;
  private baseHeight: number;
  private lastFramingState: FramingState | null = null;
  private lastFitAlignDebug: FitAlignDebug | null = null;
  private touchMode = false;

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

    this.passCanvas = document.createElement("canvas");
    this.passCanvas.width = baseWidth;
    this.passCanvas.height = baseHeight;
    const passCtx = this.passCanvas.getContext("2d");
    if (!passCtx) {
      throw new Error("Unable to create pass canvas");
    }
    this.passCtx = passCtx;

    this.mobileFromCanvas = document.createElement("canvas");
    this.mobileFromCanvas.width = baseWidth;
    this.mobileFromCanvas.height = baseHeight;
    const mobileFromCtx = this.mobileFromCanvas.getContext("2d");
    if (!mobileFromCtx) {
      throw new Error("Unable to create mobile from canvas");
    }
    this.mobileFromCtx = mobileFromCtx;

    this.mobileToCanvas = document.createElement("canvas");
    this.mobileToCanvas.width = baseWidth;
    this.mobileToCanvas.height = baseHeight;
    const mobileToCtx = this.mobileToCanvas.getContext("2d");
    if (!mobileToCtx) {
      throw new Error("Unable to create mobile to canvas");
    }
    this.mobileToCtx = mobileToCtx;
  }

  getCurrentFramingState(): FramingState | null {
    return this.lastFramingState;
  }

  getCurrentFitAlignDebug(): FitAlignDebug | null {
    return this.lastFitAlignDebug;
  }

  setTouchMode(enabled: boolean): void {
    this.touchMode = enabled;
  }

  getTouchMode(): boolean {
    return this.touchMode;
  }

  setBaseSize(baseWidth: number, baseHeight: number): void {
    if (this.baseWidth === baseWidth && this.baseHeight === baseHeight) {
      return;
    }
    this.baseWidth = baseWidth;
    this.baseHeight = baseHeight;
    this.baseCanvas.width = baseWidth;
    this.baseCanvas.height = baseHeight;
    this.transitionCanvas.width = baseWidth;
    this.transitionCanvas.height = baseHeight;
    this.passCanvas.width = baseWidth;
    this.passCanvas.height = baseHeight;
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
    screenShake,
    framingOverride
  }: RenderState): void {
    const activeSection = transition?.to ?? section;
    const eraConstraints = getEraConstraints(activeSection.era, this.baseWidth, this.baseHeight);
    const framing = computeFraming(
      width,
      height,
      this.baseWidth,
      this.baseHeight,
      activeSection.era,
      activeSection.framing === "auto" ? (framingOverride ?? "auto") : activeSection.framing
    );
    this.lastFramingState = framing;
    this.lastFitAlignDebug = {
      sectionFitAlign: activeSection.fitAlign,
      layerFitAligns: activeSection.layers.map((layer) => layer.fitAlign)
    };
    const baseShake = audio.beatStrength * 6;
    const shakeX = (baseShake + (screenShake?.x ?? 0)) * eraConstraints.cameraShake * framing.camera.shakeMul;
    const shakeY = (baseShake + (screenShake?.y ?? 0)) * eraConstraints.cameraShake * framing.camera.shakeMul;
    const { scale, offsetX, offsetY } = framing.present;
    const monochrome = resolveMonochrome(time, monochromeOverride);
    const camera = this.applyCameraConstraints(
      computeDynamicCamera(time, audio, this.baseWidth, this.baseHeight),
      eraConstraints,
      framing
    );

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    if (monochrome) {
      ctx.save();
      ctx.filter = "grayscale(1)";
    }

    if (framing.mode === "mobileFit") {
      this.renderMobileFrame(ctx, width, height, section, transition, time, delta, audio, shakeX, shakeY, camera, framing);
      this.renderOverlays(ctx, width, height, audio, eraConstraints);
      renderTextCues(ctx, width, height, textCues, time, {
        framingMode: framing.mode,
        safeRect: computeScreenSafeRect(width, height)
      });
    } else {
      if (transition) {
        this.renderSectionTo(this.transitionCtx, transition.from, time, delta, audio, framing);
        this.renderSectionTo(this.baseCtx, transition.to, time, delta, audio, framing);
        this.drawTransition(ctx, transition, scale, offsetX, offsetY, shakeX, shakeY, camera, eraConstraints);
      } else {
        this.renderSectionTo(this.baseCtx, section, time, delta, audio, framing);
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

      ctx.save();
      ctx.translate(offsetX + shakeX, offsetY + shakeY);
      ctx.scale(scale, scale);
      this.applyCameraTransform(ctx, camera);
      this.renderOverlays(ctx, this.baseWidth, this.baseHeight, audio, eraConstraints);
      renderTextCues(ctx, this.baseWidth, this.baseHeight, textCues, time, {
        framingMode: framing.mode,
        safeRect: framing.safe
      });
      ctx.restore();
    }

    if (monochrome) {
      ctx.restore();
    }
  }

  private renderMobileFrame(
    targetCtx: CanvasRenderingContext2D,
    width: number,
    height: number,
    section: SectionConfig,
    transition: RenderState["transition"] | undefined,
    time: number,
    delta: number,
    audio: AudioFeatures,
    shakeX: number,
    shakeY: number,
    camera: CameraState,
    framing: FramingState
  ): void {
    this.ensureMobileCanvasSize(width, height);
    if (transition) {
      this.mobileFromCtx.clearRect(0, 0, width, height);
      this.mobileToCtx.clearRect(0, 0, width, height);
      this.mobileFromCtx.fillStyle = "black";
      this.mobileFromCtx.fillRect(0, 0, width, height);
      this.mobileToCtx.fillStyle = "black";
      this.mobileToCtx.fillRect(0, 0, width, height);
      this.renderSectionToMobileScreen(this.mobileFromCtx, transition.from, time, delta, audio, shakeX, shakeY, camera, framing);
      this.renderSectionToMobileScreen(this.mobileToCtx, transition.to, time, delta, audio, shakeX, shakeY, camera, framing);
      targetCtx.save();
      targetCtx.globalAlpha = 1 - clamp(transition.progress, 0, 1);
      targetCtx.drawImage(this.mobileFromCanvas, 0, 0, width, height);
      targetCtx.globalAlpha = clamp(transition.progress, 0, 1);
      targetCtx.drawImage(this.mobileToCanvas, 0, 0, width, height);
      targetCtx.restore();
      return;
    }

    this.renderSectionToMobileScreen(targetCtx, section, time, delta, audio, shakeX, shakeY, camera, framing);
  }

  private renderSectionToMobileScreen(
    targetCtx: CanvasRenderingContext2D,
    section: SectionConfig,
    time: number,
    delta: number,
    audio: AudioFeatures,
    shakeX: number,
    shakeY: number,
    camera: CameraState,
    framing: FramingState
  ): void {
    const eraConstraints = getEraConstraints(section.era, this.baseWidth, this.baseHeight);
    this.ensureSceneSize(eraConstraints.renderWidth, eraConstraints.renderHeight);

    this.sceneCtx.clearRect(0, 0, this.sceneCanvas.width, this.sceneCanvas.height);
    const sectionParams = resolveAutomatedParams(time, section.params, section.automation);
    this.renderEffectTo(
      this.sceneCtx,
      section.effect,
      time,
      delta,
      audio,
      sectionParams,
      this.sceneCanvas.width,
      this.sceneCanvas.height,
      section.era,
      framing
    );
    this.copyRenderToPass(this.sceneCanvas, eraConstraints);
    this.presentPassToScreen(
      targetCtx,
      section.fitAlign,
      sectionParams,
      1,
      "source-over",
      shakeX,
      shakeY,
      camera,
      eraConstraints.smoothing,
      framing
    );

    section.layers.forEach((layer) => {
      this.layerCtx.clearRect(0, 0, this.layerCanvas.width, this.layerCanvas.height);
      const layerParams = resolveAutomatedParams(time, layer.params, layer.automation);
      this.renderEffectTo(
        this.layerCtx,
        layer.effect,
        time,
        delta,
        audio,
        layerParams,
        this.layerCanvas.width,
        this.layerCanvas.height,
        section.era,
        framing
      );
      this.copyRenderToPass(this.layerCanvas, eraConstraints);
      this.presentPassToScreen(
        targetCtx,
        layer.fitAlign,
        layerParams,
        layer.opacity,
        layer.blend,
        shakeX,
        shakeY,
        camera,
        eraConstraints.smoothing,
        framing
      );
    });
  }

  private copyRenderToPass(source: HTMLCanvasElement, eraConstraints: EraConstraints): void {
    this.passCtx.save();
    this.passCtx.clearRect(0, 0, this.baseWidth, this.baseHeight);
    this.passCtx.imageSmoothingEnabled = eraConstraints.smoothing;
    this.passCtx.drawImage(source, 0, 0, this.baseWidth, this.baseHeight);
    if (eraConstraints.palette) {
      const imageData = this.passCtx.getImageData(0, 0, this.baseWidth, this.baseHeight);
      quantizeToPalette(imageData.data, eraConstraints.palette);
      this.passCtx.putImageData(imageData, 0, 0);
    }
    this.passCtx.restore();
  }

  private presentPassToScreen(
    targetCtx: CanvasRenderingContext2D,
    fitAlign: FitAlign,
    _params: Record<string, number>,
    alpha: number,
    blend: GlobalCompositeOperation,
    shakeX: number,
    shakeY: number,
    camera: CameraState,
    smoothing: boolean,
    framing: FramingState
  ): void {
    const transform = computePresentTransform(
      framing.screenW,
      framing.screenH,
      this.baseWidth,
      this.baseHeight,
      fitAlign,
      fitAlign === "fill" ? "desktopCinematic" : "containAlign"
    );
    targetCtx.save();
    targetCtx.globalAlpha = clamp(alpha, 0, 1);
    targetCtx.globalCompositeOperation = blend;
    targetCtx.imageSmoothingEnabled = smoothing;
    targetCtx.translate(transform.dx + shakeX, transform.dy + shakeY);
    targetCtx.translate((this.baseWidth * transform.scale) / 2, (this.baseHeight * transform.scale) / 2);
    targetCtx.scale(camera.zoom, camera.zoom);
    targetCtx.translate(
      -(this.baseWidth * transform.scale) / 2 + camera.panX * transform.scale,
      -(this.baseHeight * transform.scale) / 2 + camera.panY * transform.scale
    );
    targetCtx.drawImage(this.passCanvas, 0, 0, this.baseWidth * transform.scale, this.baseHeight * transform.scale);
    targetCtx.restore();
  }

  private renderSectionTo(
    targetCtx: CanvasRenderingContext2D,
    section: SectionConfig,
    time: number,
    delta: number,
    audio: AudioFeatures,
    framing: FramingState
  ): void {
    const eraConstraints = getEraConstraints(section.era, this.baseWidth, this.baseHeight);
    this.ensureSceneSize(eraConstraints.renderWidth, eraConstraints.renderHeight);
    this.sceneCtx.clearRect(0, 0, this.sceneCanvas.width, this.sceneCanvas.height);
    const sectionParams = resolveAutomatedParams(time, section.params, section.automation);
    this.renderEffectTo(
      this.sceneCtx,
      section.effect,
      time,
      delta,
      audio,
      sectionParams,
      this.sceneCanvas.width,
      this.sceneCanvas.height,
      section.era,
      framing
    );

    if (section.layers.length > 0) {
      section.layers.forEach((layer) => {
        this.layerCtx.clearRect(0, 0, this.layerCanvas.width, this.layerCanvas.height);
        const layerParams = resolveAutomatedParams(time, layer.params, layer.automation);
        this.renderEffectTo(
          this.layerCtx,
          layer.effect,
          time,
          delta,
          audio,
          layerParams,
          this.layerCanvas.width,
          this.layerCanvas.height,
          section.era,
          framing
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
    height: number,
    era: string,
    framing: FramingState
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
      params,
      era,
      framing,
      safeRect: this.mapSafeRectToRenderSpace(framing.safe, framing, width, height)
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
        this.drawScaled(ctx, this.transitionCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1, camera, eraConstraints.smoothing);
        ctx.save();
        ctx.beginPath();
        const wipeX = offsetX + (this.baseWidth * scale + shakeX) * progress;
        ctx.rect(offsetX, offsetY, wipeX - offsetX, this.baseHeight * scale + shakeY * 2);
        ctx.clip();
        this.drawScaled(ctx, this.baseCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1, camera, eraConstraints.smoothing);
        ctx.restore();
        return;
      }
      case "slide-left":
        this.drawSlideTransition(ctx, progress, -1, 0, scale, offsetX, offsetY, shakeX, shakeY, camera, eraConstraints.smoothing);
        return;
      case "slide-right":
        this.drawSlideTransition(ctx, progress, 1, 0, scale, offsetX, offsetY, shakeX, shakeY, camera, eraConstraints.smoothing);
        return;
      case "slide-up":
        this.drawSlideTransition(ctx, progress, 0, -1, scale, offsetX, offsetY, shakeX, shakeY, camera, eraConstraints.smoothing);
        return;
      case "slide-down":
        this.drawSlideTransition(ctx, progress, 0, 1, scale, offsetX, offsetY, shakeX, shakeY, camera, eraConstraints.smoothing);
        return;
      case "iris":
        this.drawIrisTransition(ctx, progress, scale, offsetX, offsetY, shakeX, shakeY, camera, eraConstraints.smoothing);
        return;
      case "flash":
        this.drawFlashTransition(ctx, progress, scale, offsetX, offsetY, shakeX, shakeY, camera, eraConstraints.smoothing);
        return;
      case "signal-collapse":
        this.drawSignalCollapseTransition(ctx, progress, scale, offsetX, offsetY, shakeX, shakeY, camera, eraConstraints.smoothing);
        return;
      case "fade":
        this.drawFadeTransition(ctx, progress, scale, offsetX, offsetY, shakeX, shakeY, camera, eraConstraints.smoothing);
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
    this.drawScaled(ctx, this.transitionCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1 - progress, camera, smoothing);
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
    ctx.fillRect(offsetX + shakeX, offsetY + shakeY, this.baseWidth * scale, this.baseHeight * scale);
    ctx.restore();
  }

  private drawSignalCollapseTransition(
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
    const width = this.baseWidth * scale;
    const height = this.baseHeight * scale;
    const safeProgress = clamp(progress, 0, 1);
    const collapseProgress = clamp(safeProgress / 0.55, 0, 1);
    const expandProgress = clamp((safeProgress - 0.45) / 0.55, 0, 1);

    this.drawScaled(ctx, this.transitionCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1, camera, smoothing);

    const centerX = offsetX + shakeX + width / 2;
    const centerY = offsetY + shakeY + height / 2;
    const collapsedHeight = Math.max(1, height * (1 - collapseProgress));

    ctx.save();
    ctx.beginPath();
    ctx.rect(offsetX + shakeX, centerY - collapsedHeight / 2, width, collapsedHeight);
    ctx.clip();
    this.drawScaled(ctx, this.transitionCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1, camera, smoothing);
    ctx.restore();

    const scanlineStrength = clamp(collapseProgress * 1.1, 0, 1);
    if (scanlineStrength > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = scanlineStrength * 0.7;
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      for (let y = offsetY + shakeY; y < offsetY + shakeY + height; y += Math.max(2, Math.round(4 * (1 - collapseProgress) + 1))) {
        ctx.fillRect(offsetX + shakeX, y, width, 1);
      }
      ctx.restore();
    }

    const toRadius = Math.hypot(width, height) * 0.5 * expandProgress;
    if (toRadius > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, toRadius, 0, Math.PI * 2);
      ctx.clip();
      this.drawScaled(ctx, this.baseCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1, camera, smoothing);
      ctx.restore();
    }

    const flash = Math.exp(-Math.pow((safeProgress - 0.5) / 0.12, 2));
    if (flash > 0.01) {
      const bloom = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.6);
      bloom.addColorStop(0, `rgba(255, 255, 255, ${clamp(flash * 0.95, 0, 1)})`);
      bloom.addColorStop(0.4, `rgba(255, 255, 255, ${clamp(flash * 0.45, 0, 1)})`);
      bloom.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.save();
      ctx.fillStyle = bloom;
      ctx.fillRect(offsetX + shakeX, offsetY + shakeY, width, height);
      ctx.restore();
    }
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

  private applyCameraConstraints(camera: CameraState, eraConstraints: EraConstraints, framing: FramingState): CameraState {
    const zoomDelta = camera.zoom - 1;
    return {
      zoom: 1 + zoomDelta * eraConstraints.cameraZoom * framing.camera.zoomMul,
      panX: camera.panX * eraConstraints.cameraPan * framing.camera.panMul,
      panY: camera.panY * eraConstraints.cameraPan * framing.camera.panMul
    };
  }

  private mapSafeRectToRenderSpace(
    safeRect: FramingState["safe"],
    framing: FramingState,
    width: number,
    height: number
  ): FramingState["safe"] {
    return {
      x: (safeRect.x / framing.internalW) * width,
      y: (safeRect.y / framing.internalH) * height,
      w: (safeRect.w / framing.internalW) * width,
      h: (safeRect.h / framing.internalH) * height
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

  private ensureMobileCanvasSize(width: number, height: number): void {
    if (this.mobileFromCanvas.width !== width || this.mobileFromCanvas.height !== height) {
      this.mobileFromCanvas.width = width;
      this.mobileFromCanvas.height = height;
    }
    if (this.mobileToCanvas.width !== width || this.mobileToCanvas.height !== height) {
      this.mobileToCanvas.width = width;
      this.mobileToCanvas.height = height;
    }
  }
}
