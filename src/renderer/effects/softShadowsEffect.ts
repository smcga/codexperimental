import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type SoftShadowPaletteName = "studio" | "sunset" | "mono";

type SoftShadowPalette = {
  skyTop: string;
  skyBottom: string;
  floorTop: string;
  floorBottom: string;
  objectBase: string;
  objectHighlight: string;
  rim: string;
};

type ShadowPass = {
  offset: number;
  radiusX: number;
  radiusY: number;
  alpha: number;
};

const DEFAULTS = {
  count: 3,
  lightAngle: 0.8,
  lightSweep: 0.35,
  height: 0.32,
  shadowLength: 1.2,
  softness: 0.6,
  contactHardness: 0.7,
  passCount: 6,
  objectSize: 0.12,
  motion: 0.4,
  floorGlow: 0.2,
  audioReactive: 0.35
};

const PALETTES: Record<SoftShadowPaletteName, SoftShadowPalette> = {
  studio: {
    skyTop: "#111521",
    skyBottom: "#2a3140",
    floorTop: "#3d4556",
    floorBottom: "#1d2230",
    objectBase: "#9eb7cf",
    objectHighlight: "#f8fdff",
    rim: "#8ed2ff"
  },
  sunset: {
    skyTop: "#26162c",
    skyBottom: "#60405b",
    floorTop: "#65556e",
    floorBottom: "#2f2737",
    objectBase: "#f0b386",
    objectHighlight: "#fff3db",
    rim: "#ffcf98"
  },
  mono: {
    skyTop: "#111111",
    skyBottom: "#2a2a2a",
    floorTop: "#585858",
    floorBottom: "#1f1f1f",
    objectBase: "#cecece",
    objectHighlight: "#ffffff",
    rim: "#f4f4f4"
  }
};

const ERA_PASS_CAP: Record<string, number> = {
  "8bit": 3,
  "16bit": 4,
  ps1: 6,
  pcdemo: 10,
  future: 12
};

export const clampRange = (value: number, min: number, max: number): number => clamp(value, min, max);

export const resolveLightDirection = (angle: number): { x: number; y: number } => ({
  x: Math.cos(angle),
  y: Math.sin(angle)
});

export const resolvePassCountForEra = (passCount: number, era?: string): number => {
  const requested = Math.round(clampRange(passCount, 1, 12));
  const cap = era ? ERA_PASS_CAP[era] : undefined;
  return cap ? Math.min(requested, cap) : requested;
};

export const buildShadowPassProfile = (
  passCount: number,
  softness: number,
  contactHardness: number,
  shadowLength: number,
  baseRadius: number
): ShadowPass[] => {
  const passes = Math.max(1, Math.round(passCount));
  const soft = clampRange(softness, 0, 1.5);
  const hard = clampRange(contactHardness, 0, 1);
  const profile: ShadowPass[] = [];

  for (let i = 0; i < passes; i += 1) {
    const t = passes === 1 ? 0 : i / (passes - 1);
    const tightness = 1 - t;
    const spread = 1 + t * (0.85 + soft * 1.8);
    const alpha = (0.2 + hard * 0.42) * Math.pow(tightness, 1.15) + (0.06 + hard * 0.1) * (1 - t);
    profile.push({
      offset: t * shadowLength,
      radiusX: baseRadius * spread,
      radiusY: baseRadius * (0.5 + t * (0.55 + soft * 0.95)),
      alpha: clampRange(alpha, 0.01, 0.9)
    });
  }

  return profile;
};

const resolvePalette = (paletteParam: unknown): SoftShadowPalette => {
  if (paletteParam === "studio" || paletteParam === "sunset" || paletteParam === "mono") {
    return PALETTES[paletteParam];
  }
  return PALETTES.studio;
};

export class SoftShadowsEffect implements Effect {
  render({ ctx, width, height, time, audio, params, era, safeRect, framing }: EffectRenderContext): void {
    const count = Math.round(clampRange(params.count ?? DEFAULTS.count, 1, 6));
    const lightAngle = (params.lightAngle ?? DEFAULTS.lightAngle) +
      Math.sin(time * 0.28) * (params.lightSweep ?? DEFAULTS.lightSweep) * (0.8 + (audio.bass ?? 0) * (params.audioReactive ?? DEFAULTS.audioReactive) * 0.3);
    const casterHeight = clampRange(params.height ?? DEFAULTS.height, 0.05, 0.9);
    const shadowLength = clampRange(params.shadowLength ?? DEFAULTS.shadowLength, 0.2, 2.2);
    const softness = clampRange(params.softness ?? DEFAULTS.softness, 0, 1.5);
    const contactHardness = clampRange(params.contactHardness ?? DEFAULTS.contactHardness, 0, 1);
    const passCount = resolvePassCountForEra(params.passCount ?? DEFAULTS.passCount, era);
    const objectSize = clampRange(params.objectSize ?? DEFAULTS.objectSize, 0.05, 0.25);
    const motion = clampRange(params.motion ?? DEFAULTS.motion, 0, 1.5);
    const floorGlow = clampRange(params.floorGlow ?? DEFAULTS.floorGlow, 0, 1);
    const audioReactive = clampRange(params.audioReactive ?? DEFAULTS.audioReactive, 0, 1);

    const activeRect = framing?.mode === "mobileFit" && safeRect ? safeRect : { x: 0, y: 0, w: width, h: height };
    const cx = activeRect.x + activeRect.w * 0.5;
    const horizonY = activeRect.y + activeRect.h * 0.34;
    const floorY = activeRect.y + activeRect.h * 0.78;
    const sceneScaleX = activeRect.w * 0.68;
    const sceneScaleY = activeRect.h * 0.27;

    const palette = resolvePalette((params as Record<string, unknown>).palette);

    ctx.clearRect(0, 0, width, height);
    this.drawBackground(ctx, width, height, horizonY, palette);
    this.drawFloor(ctx, activeRect.x, activeRect.w, horizonY, floorY, floorGlow, palette);

    const lightDirection = resolveLightDirection(lightAngle);
    const pulse = (audio.rms ?? 0) * audioReactive;

    for (let i = 0; i < count; i += 1) {
      const objectSeed = i * 1.73;
      const lane = count === 1 ? 0.5 : i / (count - 1);
      const worldX = lerp(-0.45, 0.45, lane) + Math.sin(time * 0.36 + objectSeed) * (0.05 + 0.03 * motion);
      const worldZ = 0.18 + i * 0.16 + Math.sin(time * 0.24 + objectSeed * 1.3) * 0.03;
      const bob = (0.45 + motion) * (0.08 + pulse * 0.03) * Math.sin(time * (0.9 + motion * 0.6) + objectSeed * 2.4);
      const y = casterHeight + bob;

      const contactX = cx + worldX * sceneScaleX;
      const contactY = floorY - worldZ * sceneScaleY;
      const shadowReach = y * shadowLength * sceneScaleY * (1.35 + softness * 0.7);
      const shadowBaseRadius = objectSize * activeRect.w * (0.34 + worldZ * 0.22);
      const profile = buildShadowPassProfile(passCount, softness + pulse * 0.25, contactHardness, 1, shadowBaseRadius);

      for (let p = profile.length - 1; p >= 0; p -= 1) {
        const pass = profile[p];
        const centerX = contactX + lightDirection.x * shadowReach * pass.offset;
        const centerY = contactY + lightDirection.y * shadowReach * pass.offset * 0.75;
        const alpha = pass.alpha * (0.55 + pulse * 0.25);
        this.drawShadowEllipse(ctx, centerX, centerY, pass.radiusX, pass.radiusY, Math.atan2(lightDirection.y, lightDirection.x), alpha);
      }

      this.drawContactShadow(ctx, contactX, contactY, shadowBaseRadius, contactHardness);
      this.drawCaster(ctx, contactX, contactY, y, objectSize * activeRect.w, palette, i, time);
    }

    this.drawVignette(ctx, width, height);
  }

  private drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number, horizonY: number, palette: SoftShadowPalette): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, palette.skyTop);
    gradient.addColorStop(0.58, palette.skyBottom);
    gradient.addColorStop(1, palette.floorBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.035)";
    ctx.fillRect(0, horizonY - height * 0.01, width, height * 0.006);
  }

  private drawFloor(
    ctx: CanvasRenderingContext2D,
    startX: number,
    spanW: number,
    horizonY: number,
    floorY: number,
    floorGlow: number,
    palette: SoftShadowPalette
  ): void {
    const floorGradient = ctx.createLinearGradient(0, horizonY, 0, floorY + (floorY - horizonY));
    floorGradient.addColorStop(0, palette.floorTop);
    floorGradient.addColorStop(1, palette.floorBottom);
    ctx.fillStyle = floorGradient;
    ctx.beginPath();
    ctx.moveTo(startX, horizonY);
    ctx.lineTo(startX + spanW, horizonY);
    ctx.lineTo(startX + spanW, floorY + (floorY - horizonY));
    ctx.lineTo(startX, floorY + (floorY - horizonY));
    ctx.closePath();
    ctx.fill();

    const glowAlpha = 0.08 + floorGlow * 0.24;
    ctx.fillStyle = `rgba(220, 240, 255, ${glowAlpha.toFixed(3)})`;
    ctx.fillRect(startX, floorY - (floorY - horizonY) * 0.38, spanW, (floorY - horizonY) * 0.08);
  }

  private drawShadowEllipse(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rx: number,
    ry: number,
    angle: number,
    alpha: number
  ): void {
    ctx.fillStyle = `rgba(0, 0, 0, ${clampRange(alpha, 0, 1).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(1, rx), Math.max(0.8, ry), angle, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawContactShadow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, contactHardness: number): void {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.65);
    gradient.addColorStop(0, `rgba(0,0,0,${(0.3 + contactHardness * 0.45).toFixed(3)})`);
    gradient.addColorStop(0.55, `rgba(0,0,0,${(0.15 + contactHardness * 0.2).toFixed(3)})`);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 0.75, radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawCaster(
    ctx: CanvasRenderingContext2D,
    contactX: number,
    contactY: number,
    y: number,
    size: number,
    palette: SoftShadowPalette,
    index: number,
    time: number
  ): void {
    const centerY = contactY - y * size * 2.1;
    const radius = size * (0.74 + 0.08 * Math.sin(time * 0.6 + index));
    const grad = ctx.createRadialGradient(contactX - radius * 0.25, centerY - radius * 0.35, radius * 0.1, contactX, centerY, radius);
    grad.addColorStop(0, palette.objectHighlight);
    grad.addColorStop(0.65, palette.objectBase);
    grad.addColorStop(1, "rgba(20,24,30,0.9)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(contactX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `${palette.rim}aa`;
    ctx.lineWidth = Math.max(1, size * 0.04);
    ctx.beginPath();
    ctx.arc(contactX, centerY, radius * 0.96, Math.PI * 0.75, Math.PI * 1.65);
    ctx.stroke();
  }

  private drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const vignette = ctx.createRadialGradient(width * 0.5, height * 0.58, Math.min(width, height) * 0.2, width * 0.5, height * 0.58, Math.max(width, height) * 0.85);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }
}
