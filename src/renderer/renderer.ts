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
import {
  MobileTransitionDrawContext,
  TransitionDrawContext,
  TransitionRendererApi,
  transitionRegistry
} from "./transitions";
import { computeBitplaneWipeTransitionState } from "./transitions/bitplaneWipe";
import { CameraPunchThroughTransitionState, computeCameraPunchThroughTransitionState } from "./transitions/cameraPunchThrough";
import { computeShatterTransitionState } from "./transitions/shatter";

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
    duration: number;
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
        this.drawTransition(ctx, transition, scale, offsetX, offsetY, shakeX, shakeY, camera, eraConstraints, audio);
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
      const definition = transitionRegistry[transition.type];
      definition.drawMobile?.(this.getTransitionRendererApi(), {
        ctx: targetCtx,
        progress: transition.progress,
        duration: transition.duration,
        width,
        height,
        audio
      });
      if (!definition.drawMobile) {
        this.drawMobileDefaultCrossfade(targetCtx, transition.progress, width, height);
      }
      return;
    }

    this.renderSectionToMobileScreen(targetCtx, section, time, delta, audio, shakeX, shakeY, camera, framing);
  }

  private drawCameraPunchThroughMobileTransition(
    targetCtx: CanvasRenderingContext2D,
    progress: number,
    _duration: number,
    width: number,
    height: number
  ): void {
    const state = computeCameraPunchThroughTransitionState(progress);
    const centerX = width / 2;
    const centerY = height / 2;

    targetCtx.save();
    targetCtx.translate(centerX, centerY);
    targetCtx.scale(state.fromZoom, state.fromZoom);
    targetCtx.translate(-centerX, -centerY + state.fromPanY);
    targetCtx.globalAlpha = state.fromAlpha;
    targetCtx.drawImage(this.mobileFromCanvas, 0, 0, width, height);
    targetCtx.restore();

    if (state.streakAlpha > 0.001) {
      this.drawCameraPunchThroughStreaks(targetCtx, centerX, centerY, width, height, progress, state);
    }

    targetCtx.save();
    targetCtx.translate(centerX, centerY);
    targetCtx.scale(state.toZoom, state.toZoom);
    targetCtx.translate(-centerX, -centerY);
    targetCtx.globalAlpha = state.toAlpha;
    targetCtx.drawImage(this.mobileToCanvas, 0, 0, width, height);
    targetCtx.restore();

    if (state.bloomAlpha > 0.001) {
      const bloom = targetCtx.createRadialGradient(
        centerX,
        centerY,
        width * 0.04,
        centerX,
        centerY,
        width * state.bloomRadius
      );
      bloom.addColorStop(0, `rgba(255, 255, 255, ${clamp(state.bloomAlpha, 0, 1)})`);
      bloom.addColorStop(0.35, `rgba(190, 230, 255, ${clamp(state.bloomAlpha * 0.55, 0, 1)})`);
      bloom.addColorStop(1, "rgba(0, 0, 0, 0)");
      targetCtx.save();
      targetCtx.fillStyle = bloom;
      targetCtx.fillRect(0, 0, width, height);
      targetCtx.restore();
    }

    if (state.impactAlpha > 0.001) {
      targetCtx.save();
      targetCtx.fillStyle = `rgba(255, 255, 255, ${Math.pow(state.impactAlpha, 0.8)})`;
      targetCtx.fillRect(0, 0, width, height);
      targetCtx.restore();
    }
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
    eraConstraints: EraConstraints,
    audio: AudioFeatures
  ): void {
    const definition = transitionRegistry[transition.type];
    definition.draw(this.getTransitionRendererApi(), {
      ctx,
      progress: transition.progress,
      duration: transition.duration,
      scale,
      offsetX,
      offsetY,
      shakeX,
      shakeY,
      width: this.baseWidth * scale,
      height: this.baseHeight * scale,
      camera,
      smoothing: eraConstraints.smoothing,
      audio
    });
  }

  private getTransitionRendererApi(): TransitionRendererApi {
    return {
      drawFade: (context) => this.drawFadeTransition(context),
      drawWipe: (context) => this.drawWipeTransition(context),
      drawSlide: (context, directionX, directionY) => this.drawSlideTransition(context, directionX, directionY),
      drawIris: (context) => this.drawIrisTransition(context),
      drawFlash: (context) => this.drawFlashTransition(context),
      drawSignalCollapse: (context) => this.drawSignalCollapseTransition(context),
      drawShatter: (context) => this.drawShatterTransition(context),
      drawCameraPunchThrough: (context) => this.drawCameraPunchThroughTransition(context),
      drawBitplaneWipe: (context) => this.drawBitplaneWipeTransition(context),
      drawGlitch: (context) => this.drawGlitchTransition(context),
      drawAudioReactiveParticle: (context) => this.drawAudioReactiveParticleTransition(context),
      drawCheckerboardWipe: (context) => this.drawCheckerboardWipeTransition(context),
      drawVenetianBlinds: (context) => this.drawVenetianBlindsTransition(context),
      drawRadialWipe: (context) => this.drawRadialWipeTransition(context),
      drawNoiseThreshold: (context) => this.drawNoiseThresholdTransition(context),
      drawPortalZoom: (context) => this.drawPortalZoomTransition(context),
      drawWhipPan: (context) => this.drawWhipPanTransition(context),
      drawQuantumSlice: (context) => this.drawQuantumSliceTransition(context),
      drawChromaticBloom: (context) => this.drawChromaticBloomTransition(context),
      drawNeuralFeedback: (context) => this.drawNeuralFeedbackTransition(context),
      drawMobileDefaultCrossfade: (context) => this.drawMobileDefaultCrossfade(context.ctx, context.progress, context.duration, context.width, context.height),
      drawMobileShatter: (context) => this.drawMobileShatterTransition(context),
      drawMobileCameraPunchThrough: (context) =>
        this.drawCameraPunchThroughMobileTransition(context.ctx, context.progress, context.width, context.height),
      drawMobileBitplaneWipe: (context) => this.drawMobileBitplaneWipeTransition(context),
      drawMobileAudioReactiveParticle: (context) => this.drawMobileAudioReactiveParticleTransition(context)
    };
  }

  private drawWipeTransition(context: TransitionDrawContext): void {
    const { ctx, progress, scale, offsetX, offsetY, shakeX, shakeY, camera, smoothing } = context;
    this.drawScaled(ctx, this.transitionCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1, camera, smoothing);
    ctx.save();
    ctx.beginPath();
    const wipeX = offsetX + (this.baseWidth * scale + shakeX) * progress;
    ctx.rect(offsetX, offsetY, wipeX - offsetX, this.baseHeight * scale + shakeY * 2);
    ctx.clip();
    this.drawScaled(ctx, this.baseCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1, camera, smoothing);
    ctx.restore();
  }

  private drawMobileDefaultCrossfade(
    ctx: CanvasRenderingContext2D,
    progress: number,
    _duration: number,
    width: number,
    height: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 1 - clamp(progress, 0, 1);
    ctx.drawImage(this.mobileFromCanvas, 0, 0, width, height);
    ctx.globalAlpha = clamp(progress, 0, 1);
    ctx.drawImage(this.mobileToCanvas, 0, 0, width, height);
    ctx.restore();
  }

  private drawMobileShatterTransition(context: MobileTransitionDrawContext): void {
    this.drawShatterTransitionCanvas(
      context.ctx,
      this.mobileFromCanvas,
      this.mobileToCanvas,
      context.progress,
      0,
      0,
      context.width,
      context.height,
      context.audio,
      { zoom: 1, panX: 0, panY: 0 },
      true
    );
  }

  private drawMobileBitplaneWipeTransition(context: MobileTransitionDrawContext): void {
    this.drawBitplaneWipeTransitionCanvas(
      context.ctx,
      this.mobileFromCanvas,
      this.mobileToCanvas,
      context.progress,
      0,
      0,
      context.width,
      context.height
    );
  }

  private drawFadeTransition({ ctx, progress, scale, offsetX, offsetY, shakeX, shakeY, camera, smoothing }: TransitionDrawContext): void {
    this.drawScaled(ctx, this.transitionCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1 - progress, camera, smoothing);
    this.drawScaled(ctx, this.baseCanvas, scale, offsetX, offsetY, shakeX, shakeY, progress, camera, smoothing);
  }

  private drawSlideTransition(
    { ctx, progress, scale, offsetX, offsetY, shakeX, shakeY, camera, smoothing }: TransitionDrawContext,
    directionX: number,
    directionY: number
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

  private drawIrisTransition({
    ctx,
    progress,
    scale,
    offsetX,
    offsetY,
    shakeX,
    shakeY,
    camera,
    smoothing
  }: TransitionDrawContext): void {
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

  private drawCheckerboardWipeTransition({
    ctx,
    progress,
    scale,
    offsetX,
    offsetY,
    shakeX,
    shakeY,
    camera,
    smoothing
  }: TransitionDrawContext): void {
    const width = this.baseWidth * scale;
    const height = this.baseHeight * scale;
    this.drawScaled(ctx, this.transitionCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1, camera, smoothing);

    const cols = 12;
    const rows = 8;
    const tileWidth = width / cols;
    const tileHeight = height / rows;

    ctx.save();
    ctx.beginPath();
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const threshold = (row + col) / (rows + cols - 2);
        if (progress >= threshold) {
          ctx.rect(offsetX + shakeX + col * tileWidth, offsetY + shakeY + row * tileHeight, Math.ceil(tileWidth), Math.ceil(tileHeight));
        }
      }
    }
    ctx.clip();
    this.drawScaled(ctx, this.baseCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1, camera, smoothing);
    ctx.restore();
  }

  private drawVenetianBlindsTransition({
    ctx,
    progress,
    scale,
    offsetX,
    offsetY,
    shakeX,
    shakeY,
    camera,
    smoothing
  }: TransitionDrawContext): void {
    const width = this.baseWidth * scale;
    const height = this.baseHeight * scale;
    this.drawScaled(ctx, this.transitionCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1, camera, smoothing);

    const bands = 24;
    const bandHeight = height / bands;
    for (let band = 0; band < bands; band += 1) {
      const y = offsetY + shakeY + band * bandHeight;
      const bandReveal = Math.max(0, Math.min(1, (progress - band / bands) * 1.8));
      if (bandReveal <= 0) {
        continue;
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(offsetX + shakeX, y, width * bandReveal, Math.ceil(bandHeight));
      ctx.clip();
      this.drawScaled(ctx, this.baseCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1, camera, smoothing);
      ctx.restore();
    }
  }

  private drawRadialWipeTransition({
    ctx,
    progress,
    scale,
    offsetX,
    offsetY,
    shakeX,
    shakeY,
    camera,
    smoothing
  }: TransitionDrawContext): void {
    const width = this.baseWidth * scale;
    const height = this.baseHeight * scale;
    const centerX = offsetX + shakeX + width / 2;
    const centerY = offsetY + shakeY + height / 2;
    this.drawScaled(ctx, this.transitionCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1, camera, smoothing);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, Math.hypot(width, height), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false);
    ctx.closePath();
    ctx.clip();
    this.drawScaled(ctx, this.baseCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1, camera, smoothing);
    ctx.restore();
  }

  private drawNoiseThresholdTransition({
    ctx, progress, scale, offsetX, offsetY, shakeX, shakeY, camera, smoothing
  }: TransitionDrawContext): void {
    const width = this.baseWidth * scale;
    const height = this.baseHeight * scale;
    const rectX = offsetX + shakeX;
    const rectY = offsetY + shakeY;
    const safeProgress = clamp(progress, 0, 1);
    this.drawCanvasToRect(ctx, this.transitionCanvas, rectX, rectY, width, height, 1, camera, smoothing);

    const cols = 96;
    const rows = 54;
    const cellW = width / cols;
    const cellH = height / rows;
    ctx.save();
    ctx.beginPath();
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const seed = x * 12.9898 + y * 78.233;
        const noise = Math.sin(seed) * 43758.5453;
        const normalized = noise - Math.floor(noise);
        if (normalized <= safeProgress) {
          ctx.rect(rectX + x * cellW, rectY + y * cellH, Math.ceil(cellW), Math.ceil(cellH));
        }
      }
    }
    ctx.clip();
    this.drawCanvasToRect(ctx, this.baseCanvas, rectX, rectY, width, height, 1, camera, smoothing);
    ctx.restore();
  }

  private drawPortalZoomTransition({
    ctx, progress, scale, offsetX, offsetY, shakeX, shakeY, camera, smoothing
  }: TransitionDrawContext): void {
    const width = this.baseWidth * scale;
    const height = this.baseHeight * scale;
    const rectX = offsetX + shakeX;
    const rectY = offsetY + shakeY;
    const safeProgress = clamp(progress, 0, 1);

    const fromScale = 1 + safeProgress * 2.2;
    const fromAlpha = 1 - Math.pow(safeProgress, 0.7);
    const fromW = width * fromScale;
    const fromH = height * fromScale;
    const fromX = rectX - (fromW - width) * 0.5;
    const fromY = rectY - (fromH - height) * 0.5;
    this.drawCanvasToRect(ctx, this.transitionCanvas, fromX, fromY, fromW, fromH, fromAlpha, camera, smoothing);

    const reveal = Math.pow(safeProgress, 1.6);
    const toScale = 1.25 - reveal * 0.25;
    const toW = width * toScale;
    const toH = height * toScale;
    const toX = rectX - (toW - width) * 0.5;
    const toY = rectY - (toH - height) * 0.5;
    this.drawCanvasToRect(ctx, this.baseCanvas, toX, toY, toW, toH, reveal, camera, smoothing);
  }

  private drawWhipPanTransition({
    ctx, progress, scale, offsetX, offsetY, shakeX, shakeY, camera, smoothing
  }: TransitionDrawContext): void {
    const width = this.baseWidth * scale;
    const height = this.baseHeight * scale;
    const safeProgress = clamp(progress, 0, 1);
    const direction = Math.sin(safeProgress * Math.PI * 3.0) >= 0 ? 1 : -1;
    const pan = width * 1.35 * safeProgress;

    this.drawCanvasToRect(ctx, this.transitionCanvas, offsetX + shakeX + pan * direction, offsetY + shakeY, width, height, 1, camera, smoothing);
    this.drawCanvasToRect(ctx, this.baseCanvas, offsetX + shakeX - (width * (1 - safeProgress) * direction), offsetY + shakeY, width, height, safeProgress, camera, smoothing);

    const blurPasses = 4;
    for (let i = 0; i < blurPasses; i += 1) {
      const t = i / Math.max(1, blurPasses - 1);
      const trail = (t - 0.5) * width * 0.03 * safeProgress;
      ctx.save();
      ctx.globalAlpha = 0.08 * safeProgress;
      ctx.drawImage(ctx.canvas, trail * direction, 0);
      ctx.restore();
    }
  }

  private drawQuantumSliceTransition({
    ctx, progress, scale, offsetX, offsetY, shakeX, shakeY, camera, smoothing
  }: TransitionDrawContext): void {
    const width = this.baseWidth * scale;
    const height = this.baseHeight * scale;
    const safe = clamp(progress, 0, 1);
    const slices = 36;
    this.drawCanvasToRect(ctx, this.transitionCanvas, offsetX + shakeX, offsetY + shakeY, width, height, 1, camera, smoothing);

    for (let i = 0; i < slices; i += 1) {
      const y0 = (i / slices) * height;
      const h = Math.ceil(height / slices) + 1;
      const gate = (Math.sin(i * 1.73) * 0.5 + 0.5) * 0.7 + i / slices * 0.3;
      if (safe < gate) continue;
      const phase = safe * 18 + i * 0.33;
      const xJitter = Math.sin(phase) * width * 0.06 * (1 - safe);
      ctx.drawImage(this.baseCanvas, 0, y0 / scale, this.baseWidth, h / scale, offsetX + shakeX + xJitter, offsetY + shakeY + y0, width, h);
    }
  }

  private drawChromaticBloomTransition({
    ctx, progress, scale, offsetX, offsetY, shakeX, shakeY, camera, smoothing
  }: TransitionDrawContext): void {
    const width = this.baseWidth * scale;
    const height = this.baseHeight * scale;
    const safe = clamp(progress, 0, 1);
    const rectX = offsetX + shakeX;
    const rectY = offsetY + shakeY;

    this.drawCanvasToRect(ctx, this.transitionCanvas, rectX, rectY, width, height, 1 - safe * 0.2, camera, smoothing);
    const split = width * (0.02 + 0.04 * Math.sin(safe * Math.PI));

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = Math.pow(safe, 0.7);
    this.drawCanvasToRect(ctx, this.baseCanvas, rectX - split, rectY, width, height, 0.38, camera, smoothing);
    ctx.fillStyle = "rgba(255, 40, 40, 0.22)";
    ctx.fillRect(rectX, rectY, width, height);
    this.drawCanvasToRect(ctx, this.baseCanvas, rectX + split, rectY, width, height, 0.38, camera, smoothing);
    ctx.fillStyle = "rgba(40, 120, 255, 0.2)";
    ctx.fillRect(rectX, rectY, width, height);
    this.drawCanvasToRect(ctx, this.baseCanvas, rectX, rectY, width, height, safe, camera, smoothing);
    ctx.restore();

    const flash = Math.exp(-Math.pow((safe - 0.55) / 0.18, 2));
    if (flash > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = flash * 0.5;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(rectX, rectY, width, height);
      ctx.restore();
    }
  }

  private drawNeuralFeedbackTransition({
    ctx, progress, scale, offsetX, offsetY, shakeX, shakeY, camera, smoothing
  }: TransitionDrawContext): void {
    const width = this.baseWidth * scale;
    const height = this.baseHeight * scale;
    const safe = clamp(progress, 0, 1);
    const rectX = offsetX + shakeX;
    const rectY = offsetY + shakeY;

    this.drawCanvasToRect(ctx, this.transitionCanvas, rectX, rectY, width, height, 1, camera, smoothing);
    const feedbackPasses = 7;
    for (let i = 0; i < feedbackPasses; i += 1) {
      const t = i / Math.max(1, feedbackPasses - 1);
      const alpha = (0.06 + t * 0.08) * (1 - safe * 0.25);
      const drift = (0.5 - t) * width * 0.025 * (1 + safe);
      const warp = 1 + (0.01 + t * 0.015) * (1 - safe);
      const w = width * warp;
      const h = height * warp;
      const x = rectX - (w - width) * 0.5 + drift;
      const y = rectY - (h - height) * 0.5;
      this.drawCanvasToRect(ctx, this.transitionCanvas, x, y, w, h, alpha, camera, smoothing);
    }

    const reveal = Math.pow(safe, 1.2);
    this.drawCanvasToRect(ctx, this.baseCanvas, rectX, rectY, width, height, reveal, camera, smoothing);
  }

  private drawFlashTransition(context: TransitionDrawContext): void {
    const { ctx, progress, scale, offsetX, offsetY, shakeX, shakeY } = context;
    this.drawFadeTransition(context);
    const flashStrength = 1 - Math.abs(0.5 - progress) * 2;
    ctx.save();
    ctx.globalAlpha = flashStrength * 0.65;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(offsetX + shakeX, offsetY + shakeY, this.baseWidth * scale, this.baseHeight * scale);
    ctx.restore();
  }

  private drawSignalCollapseTransition({
    ctx,
    progress,
    scale,
    offsetX,
    offsetY,
    shakeX,
    shakeY,
    camera,
    smoothing
  }: TransitionDrawContext): void {
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


  private drawGlitchTransition({
    ctx,
    progress,
    scale,
    offsetX,
    offsetY,
    shakeX,
    shakeY,
    camera,
    smoothing
  }: TransitionDrawContext): void {
    const width = this.baseWidth * scale;
    const height = this.baseHeight * scale;
    const safeProgress = clamp(progress, 0, 1);

    this.drawScaled(ctx, this.transitionCanvas, scale, offsetX, offsetY, shakeX, shakeY, 1, camera, smoothing);

    const reveal = clamp((safeProgress - 0.36) / 0.64, 0, 1);
    const blendAlpha = Math.pow(reveal, 1.15);
    this.drawScaled(ctx, this.baseCanvas, scale, offsetX, offsetY, shakeX, shakeY, blendAlpha, camera, smoothing);

    const glitchIntensity = Math.sin(safeProgress * Math.PI);
    const rows = Math.max(10, Math.round(16 + glitchIntensity * 24));
    const rowHeight = height / rows;

    for (let row = 0; row < rows; row += 1) {
      const bandProgress = row / Math.max(1, rows - 1);
      const jitterSeed = row * 31.73 + safeProgress * 97.11;
      const jitter = Math.sin(jitterSeed) * 0.5 + Math.sin(jitterSeed * 0.37) * 0.5;
      const offset = jitter * width * 0.1 * glitchIntensity;
      const sourceY = Math.floor(row * rowHeight);
      const sourceH = Math.ceil(rowHeight + 1);
      const targetY = offsetY + shakeY + sourceY;
      const alpha = clamp(0.18 + glitchIntensity * (0.22 + Math.abs(jitter) * 0.3), 0, 0.7);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.imageSmoothingEnabled = false;
      const sourceCanvas = bandProgress < reveal ? this.baseCanvas : this.transitionCanvas;
      ctx.drawImage(
        sourceCanvas,
        0,
        sourceY,
        this.baseWidth,
        sourceH / scale,
        offsetX + shakeX + offset,
        targetY,
        width,
        sourceH
      );
      ctx.restore();
    }

    const split = glitchIntensity * width * 0.015;
    if (split > 0.2) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = glitchIntensity * 0.22;
      ctx.drawImage(this.baseCanvas, offsetX + shakeX + split, offsetY + shakeY, width, height);
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = glitchIntensity * 0.18;
      ctx.drawImage(this.transitionCanvas, offsetX + shakeX - split, offsetY + shakeY, width, height);
      ctx.restore();
    }
  }



  private drawAudioReactiveParticleTransition({
    ctx, progress, duration, scale, offsetX, offsetY, shakeX, shakeY, camera, smoothing, audio
  }: TransitionDrawContext): void {
    const width = this.baseWidth * scale;
    const height = this.baseHeight * scale;
    const rectX = offsetX + shakeX;
    const rectY = offsetY + shakeY;
    const safeProgress = clamp(progress, 0, 1);
    const energy = clamp(audio.rms * 1.4 + audio.treble * 0.5 + audio.beatStrength * 0.35, 0, 1.5);

    this.drawCanvasToRect(ctx, this.transitionCanvas, rectX, rectY, width, height, 1, camera, smoothing);
    const baseReveal = Math.pow(safeProgress, 1.15) * 0.22;
    if (baseReveal > 0.001) {
      this.drawCanvasToRect(ctx, this.baseCanvas, rectX, rectY, width, height, baseReveal, camera, smoothing);
    }

    const durationScale = clamp(duration / 0.8, 0.75, 3.2);
    const particleCount = Math.round(80 + energy * 130 + durationScale * 18);
    const maxRadius = width * (0.04 + energy * 0.03) * durationScale;
    this.drawParticleReveal(
      ctx,
      this.baseCanvas,
      safeProgress,
      durationScale,
      particleCount,
      maxRadius,
      rectX,
      rectY,
      width,
      height
    );
  }

  private drawMobileAudioReactiveParticleTransition({ ctx, progress, duration, width, height, audio }: MobileTransitionDrawContext): void {
    ctx.drawImage(this.mobileFromCanvas, 0, 0, width, height);
    const reveal = clamp(progress, 0, 1);
    const baseReveal = Math.pow(reveal, 1.15) * 0.22;
    if (baseReveal > 0.001) {
      ctx.save();
      ctx.globalAlpha = baseReveal;
      ctx.drawImage(this.mobileToCanvas, 0, 0, width, height);
      ctx.restore();
    }

    const energy = clamp(audio.rms * 1.5 + audio.treble * 0.4 + audio.beatStrength * 0.35, 0, 1.5);
    const durationScale = clamp(duration / 0.8, 0.75, 3.2);
    const particles = Math.round(50 + energy * 88 + durationScale * 14);
    const maxRadius = width * (0.024 + energy * 0.018) * durationScale;
    this.drawParticleReveal(ctx, this.mobileToCanvas, reveal, durationScale, particles, maxRadius, 0, 0, width, height);
  }

  private drawParticleReveal(
    ctx: CanvasRenderingContext2D,
    revealCanvas: HTMLCanvasElement,
    progress: number,
    durationScale: number,
    particleCount: number,
    maxRadius: number,
    rectX: number,
    rectY: number,
    width: number,
    height: number
  ): void {
    for (let i = 0; i < particleCount; i += 1) {
      const seed = i * 78.233 + 19.19;
      const px = rectX + (Math.sin(seed) * 0.5 + 0.5) * width;
      const py = rectY + (Math.sin(seed * 1.73) * 0.5 + 0.5) * height;
      const revealWindow = clamp(0.2 + durationScale * 0.1, 0.2, 0.5);
      const t = clamp((progress - (Math.sin(seed * 0.37) * 0.5 + 0.5) * (1 - revealWindow)) / revealWindow, 0, 1);
      if (t <= 0) {
        continue;
      }
      const radius = maxRadius * (0.35 + (Math.sin(seed * 0.91) * 0.5 + 0.5)) * Math.pow(t, 0.8);
      if (radius <= 0.1) {
        continue;
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalAlpha = clamp(0.35 + t * 0.75, 0, 1);
      ctx.drawImage(revealCanvas, rectX, rectY, width, height);
      ctx.restore();
    }
  }

  private drawShatterTransition({
    ctx,
    progress,
    scale,
    offsetX,
    offsetY,
    shakeX,
    shakeY,
    camera,
    smoothing,
    audio
  }: TransitionDrawContext): void {
    this.drawShatterTransitionCanvas(
      ctx,
      this.transitionCanvas,
      this.baseCanvas,
      progress,
      offsetX + shakeX,
      offsetY + shakeY,
      this.baseWidth * scale,
      this.baseHeight * scale,
      audio,
      camera,
      smoothing
    );
  }

  private drawShatterTransitionCanvas(
    ctx: CanvasRenderingContext2D,
    fromCanvas: HTMLCanvasElement,
    toCanvas: HTMLCanvasElement,
    progress: number,
    rectX: number,
    rectY: number,
    width: number,
    height: number,
    audio: AudioFeatures,
    camera: CameraState,
    smoothing: boolean
  ): void {
    const state = computeShatterTransitionState(progress, width, height, audio.beatStrength + audio.bass * 0.35);

    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${state.backdropAlpha})`;
    ctx.fillRect(rectX, rectY, width, height);
    ctx.restore();

    this.drawCanvasToRect(ctx, toCanvas, rectX, rectY, width, height, state.toAlpha, camera, smoothing);

    for (const shard of state.shards) {
      if (shard.alpha <= 0.001) {
        continue;
      }
      this.drawShatterShadow(ctx, shard, rectX, rectY);
      this.drawShardCanvas(ctx, fromCanvas, shard, rectX, rectY, width, height, camera, smoothing);
      this.drawShatterEdge(ctx, shard, rectX, rectY);
    }

    if (state.flashAlpha > 0.001) {
      const centerX = rectX + width / 2;
      const centerY = rectY + height / 2;
      const bloom = ctx.createRadialGradient(centerX, centerY, width * 0.06, centerX, centerY, width * 0.72);
      bloom.addColorStop(0, `rgba(255, 255, 255, ${state.flashAlpha})`);
      bloom.addColorStop(0.35, `rgba(210, 235, 255, ${clamp(state.flashAlpha * 0.58, 0, 1)})`);
      bloom.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.save();
      ctx.fillStyle = bloom;
      ctx.fillRect(rectX, rectY, width, height);
      ctx.restore();
    }
  }

  private drawShardCanvas(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    shard: ReturnType<typeof computeShatterTransitionState>["shards"][number],
    rectX: number,
    rectY: number,
    width: number,
    height: number,
    camera: CameraState,
    smoothing: boolean
  ): void {
    const widthScale = width / this.baseWidth;
    const heightScale = height / this.baseHeight;
    const centroidX = rectX + shard.centroid.x;
    const centroidY = rectY + shard.centroid.y;
    ctx.save();
    this.traceShardPolygon(ctx, shard, rectX, rectY, shard.translateX, shard.translateY, shard.rotation, shard.scale);
    ctx.clip();
    ctx.globalAlpha = clamp(shard.alpha, 0, 1);
    ctx.imageSmoothingEnabled = smoothing;
    ctx.translate(centroidX + shard.translateX, centroidY + shard.translateY);
    ctx.rotate(shard.rotation);
    ctx.scale(camera.zoom * shard.scale, camera.zoom * shard.scale);
    ctx.translate(
      -shard.centroid.x + camera.panX * widthScale,
      -shard.centroid.y + camera.panY * heightScale
    );
    ctx.translate(-rectX, -rectY);
    ctx.drawImage(canvas, rectX, rectY, width, height);
    ctx.restore();
  }

  private drawShatterShadow(
    ctx: CanvasRenderingContext2D,
    shard: ReturnType<typeof computeShatterTransitionState>["shards"][number],
    rectX: number,
    rectY: number
  ): void {
    if (shard.shadowAlpha <= 0.001) {
      return;
    }
    ctx.save();
    this.traceShardPolygon(
      ctx,
      shard,
      rectX,
      rectY,
      shard.translateX * 1.08 + 4,
      shard.translateY * 1.08 + 4,
      shard.rotation,
      shard.scale
    );
    ctx.fillStyle = `rgba(0, 0, 0, ${shard.shadowAlpha})`;
    ctx.fill();
    ctx.restore();
  }

  private drawShatterEdge(
    ctx: CanvasRenderingContext2D,
    shard: ReturnType<typeof computeShatterTransitionState>["shards"][number],
    rectX: number,
    rectY: number
  ): void {
    if (shard.edgeAlpha <= 0.001) {
      return;
    }
    ctx.save();
    this.traceShardPolygon(ctx, shard, rectX, rectY, shard.translateX, shard.translateY, shard.rotation, shard.scale);
    ctx.strokeStyle = `rgba(220, 240, 255, ${shard.edgeAlpha})`;
    ctx.lineWidth = 1.15;
    ctx.stroke();
    ctx.restore();
  }

  private traceShardPolygon(
    ctx: CanvasRenderingContext2D,
    shard: ReturnType<typeof computeShatterTransitionState>["shards"][number],
    rectX: number,
    rectY: number,
    translateX = 0,
    translateY = 0,
    rotation = 0,
    scale = 1
  ): void {
    const [first, ...rest] = shard.polygon;
    if (!first) {
      return;
    }
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const transformPoint = (point: { x: number; y: number }) => {
      const localX = (point.x - shard.centroid.x) * scale;
      const localY = (point.y - shard.centroid.y) * scale;
      return {
        x: rectX + shard.centroid.x + translateX + localX * cos - localY * sin,
        y: rectY + shard.centroid.y + translateY + localX * sin + localY * cos
      };
    };
    const start = transformPoint(first);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    rest.forEach((point) => {
      const transformed = transformPoint(point);
      ctx.lineTo(transformed.x, transformed.y);
    });
    ctx.closePath();
  }

  private drawCameraPunchThroughTransition({
    ctx,
    progress,
    scale,
    offsetX,
    offsetY,
    shakeX,
    shakeY,
    camera,
    smoothing
  }: TransitionDrawContext): void {
    const state = computeCameraPunchThroughTransitionState(progress);
    const width = this.baseWidth * scale;
    const height = this.baseHeight * scale;
    const rectX = offsetX + shakeX;
    const rectY = offsetY + shakeY;
    const centerX = rectX + width / 2;
    const centerY = rectY + height / 2;

    this.drawCanvasToRect(
      ctx,
      this.transitionCanvas,
      rectX,
      rectY,
      width,
      height,
      state.fromAlpha,
      camera,
      smoothing,
      state.fromZoom,
      0,
      state.fromPanY
    );

    if (state.streakAlpha > 0.001) {
      this.drawCameraPunchThroughStreaks(ctx, centerX, centerY, width, height, progress, state);
    }

    if (state.toAlpha > 0.001) {
      this.drawCanvasToRect(
        ctx,
        this.baseCanvas,
        rectX,
        rectY,
        width,
        height,
        state.toAlpha,
        camera,
        smoothing,
        state.toZoom
      );
    }

    if (state.ringAlpha > 0.001 || state.bloomAlpha > 0.001) {
      const bloom = ctx.createRadialGradient(centerX, centerY, width * 0.04, centerX, centerY, width * state.bloomRadius);
      bloom.addColorStop(0, `rgba(255, 255, 255, ${clamp(state.bloomAlpha, 0, 1)})`);
      bloom.addColorStop(0.35, `rgba(190, 230, 255, ${clamp(state.bloomAlpha * 0.55, 0, 1)})`);
      bloom.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.save();
      ctx.fillStyle = bloom;
      ctx.fillRect(rectX, rectY, width, height);
      ctx.strokeStyle = `rgba(200, 240, 255, ${state.ringAlpha})`;
      ctx.lineWidth = 2 + progress * 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.max(width, height) * (0.1 + progress * 0.42), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (state.impactAlpha > 0.001) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.pow(state.impactAlpha, 0.8)})`;
      ctx.fillRect(rectX, rectY, width, height);
      ctx.restore();
    }
  }

  private drawBitplaneWipeTransition({
    ctx,
    progress,
    scale,
    offsetX,
    offsetY,
    shakeX,
    shakeY,
    camera,
    smoothing
  }: TransitionDrawContext): void {
    this.drawBitplaneWipeTransitionCanvas(
      ctx,
      this.transitionCanvas,
      this.baseCanvas,
      progress,
      offsetX + shakeX,
      offsetY + shakeY,
      this.baseWidth * scale,
      this.baseHeight * scale,
      camera,
      smoothing
    );
  }

  private drawBitplaneWipeTransitionCanvas(
    ctx: CanvasRenderingContext2D,
    fromCanvas: HTMLCanvasElement,
    toCanvas: HTMLCanvasElement,
    progress: number,
    rectX: number,
    rectY: number,
    width: number,
    height: number,
    camera: CameraState = { zoom: 1, panX: 0, panY: 0 },
    smoothing = true
  ): void {
    const state = computeBitplaneWipeTransitionState(progress, width);

    this.drawCanvasToRect(ctx, fromCanvas, rectX, rectY, width, height, 1, camera, smoothing);

    for (const band of state.bands) {
      if (band.progress <= 0.001) {
        continue;
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(rectX + band.x, rectY, band.width + 0.75, height);
      ctx.clip();
      this.drawCanvasToRect(ctx, toCanvas, rectX, rectY, width, height, band.progress, camera, smoothing);
      ctx.restore();

      if (band.edgeGlow > 0.001 && band.progress < 0.999) {
        const edgeX = rectX + band.x + band.width;
        const glowWidth = Math.max(2, width * 0.006);
        const glow = ctx.createLinearGradient(edgeX - glowWidth, rectY, edgeX + glowWidth, rectY);
        glow.addColorStop(0, "rgba(255, 255, 255, 0)");
        glow.addColorStop(0.5, `rgba(190, 235, 255, ${band.edgeGlow * 0.4})`);
        glow.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.save();
        ctx.fillStyle = glow;
        ctx.fillRect(edgeX - glowWidth, rectY, glowWidth * 2, height);
        ctx.restore();
      }
    }

    if (state.overlayAlpha > 0.001) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = `rgba(255, 255, 255, ${state.overlayAlpha})`;
      for (const band of state.bands) {
        const scanlineStep = Math.max(2, Math.round(6 - band.progress * 3));
        for (let y = rectY + (band.index % 2); y < rectY + height; y += scanlineStep) {
          ctx.fillRect(rectX + band.x, y, Math.max(1, band.width - 1), 1);
        }
      }
      ctx.restore();
    }
  }

  private drawCameraPunchThroughStreaks(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    progress: number,
    state: CameraPunchThroughTransitionState
  ): void {
    const maxRadius = Math.hypot(width, height) * 0.5;
    const streakCount = 26;
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 0; i < streakCount; i += 1) {
      const angle = (Math.PI * 2 * i) / streakCount + progress * 0.35;
      const distance = maxRadius * (0.12 + (i % 5) * 0.035);
      const length = maxRadius * state.streakLength;
      const innerX = centerX + Math.cos(angle) * distance * 0.15;
      const innerY = centerY + Math.sin(angle) * distance * 0.15;
      const outerX = centerX + Math.cos(angle) * Math.min(maxRadius, distance + length);
      const outerY = centerY + Math.sin(angle) * Math.min(maxRadius, distance + length);
      const alpha = state.streakAlpha * (0.45 + ((i * 17) % 7) * 0.08);
      ctx.strokeStyle = `rgba(175, 225, 255, ${clamp(alpha, 0, 1)})`;
      ctx.lineWidth = 1.5 + progress * 4 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(innerX, innerY);
      ctx.lineTo(outerX, outerY);
      ctx.stroke();
    }
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
    this.drawCanvasToRect(
      ctx,
      canvas,
      offsetX + shakeX,
      offsetY + shakeY,
      this.baseWidth * scale,
      this.baseHeight * scale,
      alpha,
      camera,
      smoothing
    );
  }

  private drawCanvasToRect(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    x: number,
    y: number,
    width: number,
    height: number,
    alpha: number,
    camera: CameraState,
    smoothing: boolean,
    extraZoom = 1,
    extraPanX = 0,
    extraPanY = 0
  ): void {
    const widthScale = width / this.baseWidth;
    const heightScale = height / this.baseHeight;
    ctx.save();
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.imageSmoothingEnabled = smoothing;
    ctx.translate(x, y);
    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.zoom * extraZoom, camera.zoom * extraZoom);
    ctx.translate(
      -width / 2 + camera.panX * widthScale + extraPanX,
      -height / 2 + camera.panY * heightScale + extraPanY
    );
    ctx.drawImage(canvas, 0, 0, width, height);
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
