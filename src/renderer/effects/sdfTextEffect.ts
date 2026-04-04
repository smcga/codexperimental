import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const SDF_TEXT_DEFAULTS = {
  text: "SDF TEXT",
  fontFamily: "Arial, sans-serif",
  fontWeight: "700",
  fontScale: 0.22,
  lineGap: 0.16,
  align: "center" as "left" | "center" | "right",
  verticalAlign: "middle" as "top" | "middle" | "bottom",
  offsetX: 0,
  offsetY: 0,
  softness: 0.08,
  outlineWidth: 0.08,
  glowWidth: 0.22,
  fillAlpha: 1,
  outlineAlpha: 0.9,
  glowAlpha: 0.6,
  fillColor: "#ffffff",
  outlineColor: "#7dd3fc",
  glowColor: "#60a5fa",
  shadowColor: "#000000",
  pulse: 0,
  wobble: 0,
  glowPulse: 0.35,
  outlinePulse: 0,
  chromaticAberration: 0,
  driftX: 0,
  driftY: 0,
  audioGlow: 0.5,
  audioScale: 0.04,
  audioOutline: 0.2,
  beatFlash: 0.35,
  fieldResolution: 256,
  maxFieldResolution: 512,
  debugField: false
};

export type SdfTextLayout = {
  lines: string[];
  lineWidths: number[];
  textBlockWidth: number;
  textBlockHeight: number;
  fontSize: number;
  lineAdvance: number;
};

type SdfTextResolvedParams = typeof SDF_TEXT_DEFAULTS;

type EraMultipliers = {
  softness: number;
  glow: number;
  outline: number;
  chromatic: number;
  quantizeSteps: number;
};

type SdfFieldCacheEntry = {
  key: string;
  width: number;
  height: number;
  signedDistance: Float32Array;
  debugImage: ImageData;
};

const asNumber = (value: unknown, fallback: number): number => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

const asText = (value: unknown, fallback: string): string => (typeof value === "string" && value.length > 0 ? value : fallback);

const asBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value > 0.5;
  }
  return fallback;
};

const parseColor = (value: string): [number, number, number] => {
  const match = /^#?([a-f\d]{3}|[a-f\d]{6})$/i.exec(value.trim());
  if (!match) {
    return [255, 255, 255];
  }
  const hex = match[1].length === 3 ? match[1].split("").map((ch) => `${ch}${ch}`).join("") : match[1];
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
};

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  if (edge0 === edge1) {
    return x < edge0 ? 0 : 1;
  }
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const resolveSdfTextParams = (params: Record<string, unknown>): SdfTextResolvedParams => ({
  text: asText(params.text, SDF_TEXT_DEFAULTS.text),
  fontFamily: asText(params.fontFamily, SDF_TEXT_DEFAULTS.fontFamily),
  fontWeight: asText(params.fontWeight, SDF_TEXT_DEFAULTS.fontWeight),
  fontScale: clamp(asNumber(params.fontScale, SDF_TEXT_DEFAULTS.fontScale), 0.05, 0.8),
  lineGap: clamp(asNumber(params.lineGap, SDF_TEXT_DEFAULTS.lineGap), 0, 0.8),
  align: params.align === "left" || params.align === "right" || params.align === "center" ? params.align : SDF_TEXT_DEFAULTS.align,
  verticalAlign:
    params.verticalAlign === "top" || params.verticalAlign === "bottom" || params.verticalAlign === "middle"
      ? params.verticalAlign
      : SDF_TEXT_DEFAULTS.verticalAlign,
  offsetX: asNumber(params.offsetX, SDF_TEXT_DEFAULTS.offsetX),
  offsetY: asNumber(params.offsetY, SDF_TEXT_DEFAULTS.offsetY),
  softness: clamp(asNumber(params.softness, SDF_TEXT_DEFAULTS.softness), 0.01, 0.6),
  outlineWidth: clamp(asNumber(params.outlineWidth, SDF_TEXT_DEFAULTS.outlineWidth), 0, 0.8),
  glowWidth: clamp(asNumber(params.glowWidth, SDF_TEXT_DEFAULTS.glowWidth), 0, 1.3),
  fillAlpha: clamp(asNumber(params.fillAlpha, SDF_TEXT_DEFAULTS.fillAlpha), 0, 1),
  outlineAlpha: clamp(asNumber(params.outlineAlpha, SDF_TEXT_DEFAULTS.outlineAlpha), 0, 1),
  glowAlpha: clamp(asNumber(params.glowAlpha, SDF_TEXT_DEFAULTS.glowAlpha), 0, 1),
  fillColor: asText(params.fillColor, SDF_TEXT_DEFAULTS.fillColor),
  outlineColor: asText(params.outlineColor, SDF_TEXT_DEFAULTS.outlineColor),
  glowColor: asText(params.glowColor, SDF_TEXT_DEFAULTS.glowColor),
  shadowColor: asText(params.shadowColor, SDF_TEXT_DEFAULTS.shadowColor),
  pulse: clamp(asNumber(params.pulse, SDF_TEXT_DEFAULTS.pulse), 0, 1.5),
  wobble: clamp(asNumber(params.wobble, SDF_TEXT_DEFAULTS.wobble), 0, 1),
  glowPulse: clamp(asNumber(params.glowPulse, SDF_TEXT_DEFAULTS.glowPulse), 0, 2),
  outlinePulse: clamp(asNumber(params.outlinePulse, SDF_TEXT_DEFAULTS.outlinePulse), 0, 2),
  chromaticAberration: clamp(asNumber(params.chromaticAberration, SDF_TEXT_DEFAULTS.chromaticAberration), 0, 1),
  driftX: clamp(asNumber(params.driftX, SDF_TEXT_DEFAULTS.driftX), -2, 2),
  driftY: clamp(asNumber(params.driftY, SDF_TEXT_DEFAULTS.driftY), -2, 2),
  audioGlow: clamp(asNumber(params.audioGlow, SDF_TEXT_DEFAULTS.audioGlow), 0, 2),
  audioScale: clamp(asNumber(params.audioScale, SDF_TEXT_DEFAULTS.audioScale), 0, 0.3),
  audioOutline: clamp(asNumber(params.audioOutline, SDF_TEXT_DEFAULTS.audioOutline), 0, 1),
  beatFlash: clamp(asNumber(params.beatFlash, SDF_TEXT_DEFAULTS.beatFlash), 0, 1),
  fieldResolution: clamp(Math.round(asNumber(params.fieldResolution, SDF_TEXT_DEFAULTS.fieldResolution)), 96, 1024),
  maxFieldResolution: clamp(Math.round(asNumber(params.maxFieldResolution, SDF_TEXT_DEFAULTS.maxFieldResolution)), 128, 1024),
  debugField: asBoolean(params.debugField, SDF_TEXT_DEFAULTS.debugField)
});

export const layoutTextBlock = (
  measureText: (line: string) => number,
  text: string,
  fontSize: number,
  lineGap: number
): SdfTextLayout => {
  const lines = text.split("\n").map((line) => line.trimEnd());
  const safeLines = lines.length > 0 ? lines : [""];
  const lineWidths = safeLines.map((line) => measureText(line));
  const textBlockWidth = Math.max(1, ...lineWidths);
  const lineAdvance = fontSize * (1 + lineGap);
  const textBlockHeight = fontSize + Math.max(0, safeLines.length - 1) * lineAdvance;
  return { lines: safeLines, lineWidths, textBlockWidth, textBlockHeight, fontSize, lineAdvance };
};

export const createSdfCacheKey = (resolved: SdfTextResolvedParams, width: number, height: number): string =>
  [
    resolved.text,
    resolved.fontFamily,
    resolved.fontWeight,
    resolved.fontScale.toFixed(4),
    resolved.lineGap.toFixed(4),
    resolved.align,
    resolved.verticalAlign,
    width,
    height,
    Math.min(resolved.fieldResolution, resolved.maxFieldResolution)
  ].join("|");

const buildDistanceMap = (mask: Uint8ClampedArray, width: number, height: number, seedInside: boolean): Float32Array => {
  const inf = 1e9;
  const out = new Float32Array(width * height);
  for (let i = 0; i < out.length; i += 1) {
    const inside = mask[i] > 127;
    out[i] = inside === seedInside ? 0 : inf;
  }

  const sqrt2 = Math.SQRT2;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      let best = out[idx];
      if (x > 0) {
        best = Math.min(best, out[idx - 1] + 1);
      }
      if (y > 0) {
        best = Math.min(best, out[idx - width] + 1);
        if (x > 0) {
          best = Math.min(best, out[idx - width - 1] + sqrt2);
        }
        if (x < width - 1) {
          best = Math.min(best, out[idx - width + 1] + sqrt2);
        }
      }
      out[idx] = best;
    }
  }

  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = width - 1; x >= 0; x -= 1) {
      const idx = y * width + x;
      let best = out[idx];
      if (x < width - 1) {
        best = Math.min(best, out[idx + 1] + 1);
      }
      if (y < height - 1) {
        best = Math.min(best, out[idx + width] + 1);
        if (x > 0) {
          best = Math.min(best, out[idx + width - 1] + sqrt2);
        }
        if (x < width - 1) {
          best = Math.min(best, out[idx + width + 1] + sqrt2);
        }
      }
      out[idx] = best;
    }
  }

  return out;
};

export const buildSignedDistanceField = (mask: Uint8ClampedArray, width: number, height: number): Float32Array => {
  const insideDistance = buildDistanceMap(mask, width, height, false);
  const outsideDistance = buildDistanceMap(mask, width, height, true);
  const signed = new Float32Array(width * height);
  for (let i = 0; i < signed.length; i += 1) {
    signed[i] = outsideDistance[i] - insideDistance[i];
  }
  return signed;
};

const eraMultipliers = (era: string | undefined): EraMultipliers => {
  switch (era) {
    case "8bit":
      return { softness: 0.65, glow: 0.45, outline: 1.05, chromatic: 0.45, quantizeSteps: 5 };
    case "16bit":
      return { softness: 0.8, glow: 0.7, outline: 1.12, chromatic: 0.65, quantizeSteps: 0 };
    case "future":
      return { softness: 1.15, glow: 1.2, outline: 1.05, chromatic: 1.2, quantizeSteps: 0 };
    case "ps1":
    case "pcdemo":
      return { softness: 1, glow: 1, outline: 1, chromatic: 1, quantizeSteps: 0 };
    default:
      return { softness: 1, glow: 1, outline: 1, chromatic: 1, quantizeSteps: 0 };
  }
};

const blendPixel = (
  data: Uint8ClampedArray,
  index: number,
  color: [number, number, number],
  alpha: number
): void => {
  const a = clamp(alpha, 0, 1);
  if (a <= 0) {
    return;
  }
  const inv = 1 - a;
  data[index] = Math.round(data[index] * inv + color[0] * a);
  data[index + 1] = Math.round(data[index + 1] * inv + color[1] * a);
  data[index + 2] = Math.round(data[index + 2] * inv + color[2] * a);
  data[index + 3] = Math.round((data[index + 3] / 255 * inv + a) * 255);
};

export const shadeFieldToImageData = (
  signedDistance: Float32Array,
  width: number,
  height: number,
  resolved: SdfTextResolvedParams,
  audio: EffectRenderContext["audio"],
  time: number,
  era: string | undefined
): ImageData => {
  const imageData =
    typeof ImageData !== "undefined"
      ? new ImageData(width, height)
      : ({ width, height, data: new Uint8ClampedArray(width * height * 4) } as ImageData);
  const data = imageData.data;
  const eraScale = eraMultipliers(era);

  const beat = audio.beat ? 1 : 0;
  const glowDrive = clamp(audio.rms * resolved.audioGlow + audio.beatStrength * resolved.beatFlash + beat * resolved.beatFlash * 0.8, 0, 2);
  const outlineDrive = clamp(audio.rms * resolved.audioOutline + beat * resolved.beatFlash, 0, 1.5);

  const softness = Math.max(0.01, resolved.softness * eraScale.softness);
  const outlineWidth = Math.max(0, resolved.outlineWidth * eraScale.outline * (1 + outlineDrive + Math.sin(time * 5.2) * resolved.outlinePulse));
  const glowWidth = Math.max(0, resolved.glowWidth * eraScale.glow * (1 + glowDrive + Math.sin(time * 4.4) * resolved.glowPulse));

  const fillColor = parseColor(resolved.fillColor);
  const outlineColor = parseColor(resolved.outlineColor);
  const glowColor = parseColor(resolved.glowColor);

  for (let i = 0; i < signedDistance.length; i += 1) {
    const idx = i * 4;
    const d = signedDistance[i] / Math.max(1, width * 0.06);

    const fillMask = 1 - smoothstep(-softness, softness, d);
    const outlineDist = Math.abs(d);
    const outlineMask = (1 - smoothstep(outlineWidth, outlineWidth + softness, outlineDist)) * (1 - fillMask * 0.65);
    const glowDist = Math.max(0, d - softness * 0.2);
    const glowMask = glowWidth <= 0 ? 0 : Math.exp(-Math.pow(glowDist / Math.max(0.0001, glowWidth), 2));

    blendPixel(data, idx, glowColor, glowMask * resolved.glowAlpha);
    blendPixel(data, idx, outlineColor, outlineMask * resolved.outlineAlpha);
    blendPixel(data, idx, fillColor, fillMask * resolved.fillAlpha);

    if (eraScale.quantizeSteps > 0) {
      const steps = eraScale.quantizeSteps;
      data[idx] = Math.round((data[idx] / 255) * steps) * Math.round(255 / steps);
      data[idx + 1] = Math.round((data[idx + 1] / 255) * steps) * Math.round(255 / steps);
      data[idx + 2] = Math.round((data[idx + 2] / 255) * steps) * Math.round(255 / steps);
    }
  }

  return imageData;
};

const mapOffset = (value: number, reference: number): number => (Math.abs(value) <= 1 ? value * reference : value);

export class SdfTextEffect implements Effect {
  private cacheEntry: SdfFieldCacheEntry | null = null;
  private maskCanvas: HTMLCanvasElement | null = null;
  private shadeCanvas: HTMLCanvasElement | null = null;

  reset(): void {
    this.cacheEntry = null;
  }

  private ensureCanvas(canvas: HTMLCanvasElement | null, width: number, height: number): HTMLCanvasElement {
    const next = canvas ?? document.createElement("canvas");
    if (next.width !== width || next.height !== height) {
      next.width = width;
      next.height = height;
    }
    return next;
  }

  private rebuildCacheIfNeeded(resolved: SdfTextResolvedParams, width: number, height: number): void {
    const key = createSdfCacheKey(resolved, width, height);
    if (this.cacheEntry?.key === key) {
      return;
    }

    const fieldResolution = Math.min(resolved.fieldResolution, resolved.maxFieldResolution);
    const canvasSize = clamp(Math.round(fieldResolution), 96, resolved.maxFieldResolution);
    this.maskCanvas = this.ensureCanvas(this.maskCanvas, canvasSize, canvasSize);
    const maskCtx = this.maskCanvas.getContext("2d");
    if (!maskCtx) {
      return;
    }

    const fontSize = Math.max(12, Math.round(Math.min(width, height) * resolved.fontScale));
    maskCtx.clearRect(0, 0, canvasSize, canvasSize);
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, canvasSize, canvasSize);
    maskCtx.fillStyle = "white";
    maskCtx.textBaseline = "top";
    maskCtx.font = `${resolved.fontWeight} ${fontSize}px ${resolved.fontFamily}`;

    const layout = layoutTextBlock(
      (line) => maskCtx.measureText(line).width,
      resolved.text,
      fontSize,
      resolved.lineGap
    );

    const margin = Math.round(canvasSize * 0.08);
    const availableW = canvasSize - margin * 2;
    const availableH = canvasSize - margin * 2;
    const fitScale = Math.min(1, availableW / layout.textBlockWidth, availableH / layout.textBlockHeight);

    maskCtx.save();
    maskCtx.translate(margin, margin);
    maskCtx.scale(fitScale, fitScale);

    const originX = resolved.align === "left" ? 0 : resolved.align === "right" ? availableW / fitScale : availableW / fitScale * 0.5;
    const blockTop = resolved.verticalAlign === "top" ? 0 : resolved.verticalAlign === "bottom" ? availableH / fitScale - layout.textBlockHeight : (availableH / fitScale - layout.textBlockHeight) * 0.5;

    for (let i = 0; i < layout.lines.length; i += 1) {
      const line = layout.lines[i];
      const lineWidth = layout.lineWidths[i] ?? 0;
      const x = resolved.align === "left" ? originX : resolved.align === "right" ? originX - lineWidth : originX - lineWidth * 0.5;
      const y = blockTop + i * layout.lineAdvance;
      maskCtx.fillText(line, x, y);
    }
    maskCtx.restore();

    const maskData = maskCtx.getImageData(0, 0, canvasSize, canvasSize).data;
    const alphaMask = new Uint8ClampedArray(canvasSize * canvasSize);
    for (let i = 0; i < alphaMask.length; i += 1) {
      alphaMask[i] = maskData[i * 4 + 3];
    }

    const signedDistance = buildSignedDistanceField(alphaMask, canvasSize, canvasSize);
    const debugImage = new ImageData(canvasSize, canvasSize);
    for (let i = 0; i < signedDistance.length; i += 1) {
      const value = clamp(Math.round((signedDistance[i] * 3 + 128)), 0, 255);
      const idx = i * 4;
      debugImage.data[idx] = value;
      debugImage.data[idx + 1] = value;
      debugImage.data[idx + 2] = value;
      debugImage.data[idx + 3] = 255;
    }

    this.cacheEntry = {
      key,
      width: canvasSize,
      height: canvasSize,
      signedDistance,
      debugImage
    };
  }

  render({ ctx, width, height, time, audio, params, era }: EffectRenderContext): void {
    if (typeof document === "undefined") {
      return;
    }
    const resolved = resolveSdfTextParams(params as Record<string, unknown>);
    this.rebuildCacheIfNeeded(resolved, width, height);
    if (!this.cacheEntry) {
      return;
    }

    this.shadeCanvas = this.ensureCanvas(this.shadeCanvas, this.cacheEntry.width, this.cacheEntry.height);
    const shadeCtx = this.shadeCanvas.getContext("2d");
    if (!shadeCtx) {
      return;
    }

    if (resolved.debugField) {
      shadeCtx.putImageData(this.cacheEntry.debugImage, 0, 0);
    } else {
      const imageData = shadeFieldToImageData(this.cacheEntry.signedDistance, this.cacheEntry.width, this.cacheEntry.height, resolved, audio, time, era);
      shadeCtx.putImageData(imageData, 0, 0);
    }

    const baseScale = 0.68;
    const pulseScale = 1 + Math.sin(time * 3.1) * resolved.pulse * 0.08;
    const audioScale = 1 + (audio.rms + audio.beatStrength * 0.6) * resolved.audioScale + (audio.beat ? resolved.beatFlash * 0.06 : 0);
    const scale = baseScale * pulseScale * audioScale;

    const driftPxX = resolved.driftX * width * 0.02 + Math.sin(time * 0.8) * resolved.wobble * width * 0.008;
    const driftPxY = resolved.driftY * height * 0.02 + Math.cos(time * 0.95) * resolved.wobble * height * 0.008;

    const drawWidth = this.cacheEntry.width * scale;
    const drawHeight = this.cacheEntry.height * scale;
    const centerX = width * 0.5 + mapOffset(resolved.offsetX, width) + driftPxX;
    const centerY = height * 0.5 + mapOffset(resolved.offsetY, height) + driftPxY;
    const drawX = centerX - drawWidth * 0.5;
    const drawY = centerY - drawHeight * 0.5;

    ctx.save();
    ctx.imageSmoothingEnabled = true;

    const eraScale = eraMultipliers(era);
    const aberrationPx = resolved.chromaticAberration * eraScale.chromatic * Math.min(width, height) * 0.01;
    if (!resolved.debugField && aberrationPx > 0.01) {
      ctx.globalAlpha = 0.45;
      ctx.drawImage(this.shadeCanvas, drawX - aberrationPx, drawY, drawWidth, drawHeight);
      ctx.globalAlpha = 0.45;
      ctx.drawImage(this.shadeCanvas, drawX + aberrationPx, drawY, drawWidth, drawHeight);
      ctx.globalAlpha = 1;
    }

    ctx.drawImage(this.shadeCanvas, drawX, drawY, drawWidth, drawHeight);

    if (!resolved.debugField) {
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = resolved.shadowColor;
      ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
    }
    ctx.restore();
  }
}
