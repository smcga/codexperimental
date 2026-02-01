import { AudioFeatures } from "../../audio/audioPlayer";
import { clamp } from "../../util/math";

const TAU = Math.PI * 2;

export type BlendIllusionMode = "torch" | "glow" | "moire" | "all";

export type BlendIllusionsParams = {
  mode: BlendIllusionMode;
  intensity: number;
};

export type ContentRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type GlowBlob = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  phase: number;
};

let glowEnvelope = 0;
let colorDodgeSupported: boolean | null = null;

const glowBlobs = createGlowBlobs(5, 0x9b57f2);

function createRng(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function createGlowBlobs(count: number, seed: number): GlowBlob[] {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => {
    return {
      x: rng() * 0.8 + 0.1,
      y: rng() * 0.7 + 0.15,
      radius: rng() * 0.18 + 0.12,
      speed: rng() * 0.35 + 0.15,
      phase: rng() * TAU
    };
  });
}

function resolveColorDodge(ctx: CanvasRenderingContext2D): GlobalCompositeOperation {
  if (colorDodgeSupported === null) {
    const previous = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "color-dodge";
    colorDodgeSupported = ctx.globalCompositeOperation === "color-dodge";
    ctx.globalCompositeOperation = previous;
  }
  return colorDodgeSupported ? "color-dodge" : "screen";
}

function drawInversionTorch(
  ctx: CanvasRenderingContext2D,
  rect: ContentRect,
  time: number,
  audio: AudioFeatures,
  intensity: number
): void {
  const width = rect.width;
  const height = rect.height;
  const centerX = rect.x + width / 2;
  const centerY = rect.y + height / 2;
  const driftX = Math.sin(time * 0.7) * width * 0.18 + Math.sin(time * 1.3) * width * 0.06;
  const driftY = Math.cos(time * 0.6) * height * 0.14 + Math.sin(time * 1.1) * height * 0.05;
  const jitter = audio.beat ? audio.beatStrength * 14 : 0;
  const jitterAngle = time * 5.2;
  const x = centerX + driftX + Math.cos(jitterAngle) * jitter;
  const y = centerY + driftY + Math.sin(jitterAngle) * jitter;
  const radius = Math.min(width, height) * (0.18 + audio.rms * 0.08 + audio.bass * 0.06);

  ctx.save();
  ctx.globalCompositeOperation = "difference";
  ctx.globalAlpha = clamp(0.85 * intensity, 0, 1);
  const gradient = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function updateGlowEnvelope(audio: AudioFeatures, delta: number): number {
  const decay = Math.exp(-delta * 5.5);
  glowEnvelope *= decay;
  if (audio.beat) {
    glowEnvelope = Math.max(glowEnvelope, clamp(audio.beatStrength * 1.2, 0, 1));
  }
  glowEnvelope = clamp(glowEnvelope + audio.rms * 0.04, 0, 1);
  return glowEnvelope;
}

function drawImpossibleGlow(
  ctx: CanvasRenderingContext2D,
  rect: ContentRect,
  time: number,
  delta: number,
  audio: AudioFeatures,
  intensity: number
): void {
  const pulse = updateGlowEnvelope(audio, delta);
  const composite = resolveColorDodge(ctx);
  const maxRadius = Math.min(rect.width, rect.height);
  const baseAlpha = clamp(0.18 * intensity + pulse * 0.25, 0, 0.45);
  const glowBoost = 1 + pulse * 0.8;

  ctx.save();
  ctx.globalCompositeOperation = composite;
  glowBlobs.forEach((blob) => {
    const drift = time * blob.speed;
    const offsetX = Math.sin(drift + blob.phase) * 0.06;
    const offsetY = Math.cos(drift + blob.phase) * 0.05;
    const x = rect.x + rect.width * clamp(blob.x + offsetX, 0.05, 0.95);
    const y = rect.y + rect.height * clamp(blob.y + offsetY, 0.08, 0.92);
    const radius = maxRadius * blob.radius * (1 + audio.rms * 0.4) * glowBoost * intensity;
    const gradient = ctx.createRadialGradient(x, y, radius * 0.08, x, y, radius);
    const coreAlpha = clamp(baseAlpha * 1.2, 0, 0.6);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha})`);
    gradient.addColorStop(0.45, `rgba(120, 220, 255, ${coreAlpha * 0.6})`);
    gradient.addColorStop(1, "rgba(20, 120, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
  });
  ctx.restore();
}

function drawLinePattern(
  ctx: CanvasRenderingContext2D,
  rect: ContentRect,
  spacing: number,
  angle: number,
  offset: { x: number; y: number }
): void {
  const width = rect.width;
  const height = rect.height;
  const centerX = rect.x + width / 2 + offset.x;
  const centerY = rect.y + height / 2 + offset.y;
  const span = Math.hypot(width, height);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.translate(-centerX, -centerY);
  ctx.beginPath();
  for (let x = centerX - span; x <= centerX + span; x += spacing) {
    ctx.moveTo(x, centerY - span);
    ctx.lineTo(x, centerY + span);
  }
  ctx.stroke();
  ctx.restore();
}

function drawMoireInterference(
  ctx: CanvasRenderingContext2D,
  rect: ContentRect,
  time: number,
  audio: AudioFeatures,
  intensity: number
): void {
  const spacing = clamp(8 + (1 - audio.treble) * 18, 8, 26);
  const baseAlpha = clamp(0.18 + audio.treble * 0.22, 0.12, 0.4) * intensity;
  const drift = time * (0.08 + audio.bass * 0.22);

  ctx.save();
  ctx.lineWidth = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = `rgba(255, 255, 255, ${baseAlpha})`;
  drawLinePattern(ctx, rect, spacing, drift * 0.6, { x: 0, y: 0 });

  ctx.globalCompositeOperation = "difference";
  ctx.strokeStyle = `rgba(180, 220, 255, ${clamp(baseAlpha * 1.4, 0, 0.6)})`;
  drawLinePattern(ctx, rect, spacing * 0.92, drift * 0.6 + 0.22, {
    x: Math.sin(drift) * 8,
    y: Math.cos(drift * 0.8) * 6
  });
  ctx.restore();
}

export function renderBlendIllusions(
  ctx: CanvasRenderingContext2D,
  contentRect: ContentRect,
  time: number,
  delta: number,
  audio: AudioFeatures,
  params: BlendIllusionsParams
): void {
  const intensity = clamp(params.intensity, 0, 1.5);
  if (intensity <= 0) {
    return;
  }

  const modes: BlendIllusionMode[] =
    params.mode === "all" ? ["torch", "glow", "moire"] : [params.mode];

  modes.forEach((mode) => {
    switch (mode) {
      case "torch":
        drawInversionTorch(ctx, contentRect, time, audio, intensity);
        break;
      case "glow":
        drawImpossibleGlow(ctx, contentRect, time, delta, audio, intensity);
        break;
      case "moire":
        drawMoireInterference(ctx, contentRect, time, audio, intensity);
        break;
      case "all":
        break;
      default: {
        const _exhaustiveCheck: never = mode;
        return _exhaustiveCheck;
      }
    }
  });
}
