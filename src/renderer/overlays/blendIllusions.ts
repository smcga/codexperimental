import { AudioFeatures } from "../../audio/audioPlayer";
import { BlendIllusionsConfig, BlendIllusionsMode } from "../../config/loadConfig";
import { clamp } from "../../util/math";

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
  drift: number;
  speed: number;
  phase: number;
  hue: number;
};

type GlowState = {
  pulse: number;
};

const TAU = Math.PI * 2;
const DEFAULT_SEED = 1337;
const glowBlobCache = new Map<number, GlowBlob[]>();
const glowStateCache = new Map<number, GlowState>();
let colorDodgeSupported: boolean | null = null;

function createRng(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function resolveSeed(seedSource?: number | string): number {
  if (typeof seedSource === "number") {
    return seedSource;
  }
  if (typeof seedSource === "string") {
    return hashString(seedSource) ^ DEFAULT_SEED;
  }
  return DEFAULT_SEED;
}

function getGlowBlobs(seed: number): GlowBlob[] {
  const cached = glowBlobCache.get(seed);
  if (cached) {
    return cached;
  }
  const rng = createRng(seed);
  const blobs: GlowBlob[] = Array.from({ length: 4 }, () => {
    return {
      x: 0.15 + rng() * 0.7,
      y: 0.15 + rng() * 0.7,
      radius: 0.18 + rng() * 0.22,
      drift: 0.04 + rng() * 0.08,
      speed: 0.25 + rng() * 0.4,
      phase: rng() * TAU,
      hue: 180 + rng() * 120
    };
  });
  glowBlobCache.set(seed, blobs);
  return blobs;
}

function getGlowState(seed: number): GlowState {
  const cached = glowStateCache.get(seed);
  if (cached) {
    return cached;
  }
  const state = { pulse: 0 };
  glowStateCache.set(seed, state);
  return state;
}

function isColorDodgeSupported(ctx: CanvasRenderingContext2D): boolean {
  if (colorDodgeSupported !== null) {
    return colorDodgeSupported;
  }
  const previous = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = "color-dodge";
  colorDodgeSupported = ctx.globalCompositeOperation === "color-dodge";
  ctx.globalCompositeOperation = previous;
  return colorDodgeSupported;
}

function shouldRender(mode: BlendIllusionsMode, target: BlendIllusionsMode): boolean {
  return mode === "all" || mode === target;
}

function renderInversionTorch(
  ctx: CanvasRenderingContext2D,
  contentRect: ContentRect,
  time: number,
  audio: AudioFeatures,
  intensity: number,
  seed: number
): void {
  const minDim = Math.min(contentRect.width, contentRect.height);
  const driftX = Math.sin(time * 0.35 + seed * 0.01) * 0.18 + Math.sin(time * 0.9 + seed * 0.02) * 0.08;
  const driftY = Math.cos(time * 0.28 + seed * 0.03) * 0.16 + Math.sin(time * 0.7 + seed * 0.05) * 0.06;
  const beatJitter = audio.beat ? audio.beatStrength * 0.08 : 0;
  const jitterAngle = time * 3.2 + seed * 0.1;
  const jitterX = Math.cos(jitterAngle) * beatJitter;
  const jitterY = Math.sin(jitterAngle) * beatJitter;

  const centerX = contentRect.x + contentRect.width * (0.5 + driftX) + jitterX * minDim;
  const centerY = contentRect.y + contentRect.height * (0.5 + driftY) + jitterY * minDim;
  const radius = clamp(
    minDim * (0.2 + audio.rms * 0.18 + audio.bass * 0.12 + Math.sin(time * 0.4 + seed * 0.03) * 0.08),
    minDim * 0.18,
    minDim * 0.45
  );

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, TAU);
  ctx.clip();
  ctx.globalCompositeOperation = "difference";
  ctx.globalAlpha = clamp(0.85 * intensity, 0, 0.95);
  ctx.fillStyle = "white";
  ctx.fillRect(contentRect.x, contentRect.y, contentRect.width, contentRect.height);
  ctx.restore();
}

function renderImpossibleGlow(
  ctx: CanvasRenderingContext2D,
  contentRect: ContentRect,
  time: number,
  delta: number,
  audio: AudioFeatures,
  intensity: number,
  seed: number
): void {
  const state = getGlowState(seed);
  if (audio.beat) {
    state.pulse = Math.max(state.pulse, audio.beatStrength);
  }
  state.pulse = clamp(state.pulse - delta * 1.6, 0, 1);

  const pulseStrength = clamp(state.pulse + audio.bass * 0.35, 0, 1);
  const baseAlpha = clamp(0.12 * intensity + pulseStrength * 0.22 * intensity, 0, 0.55);
  const composite = isColorDodgeSupported(ctx) ? "color-dodge" : "screen";
  const blobs = getGlowBlobs(seed);

  ctx.save();
  ctx.globalCompositeOperation = composite;
  blobs.forEach((blob, index) => {
    const wobble = Math.sin(time * blob.speed + blob.phase + index) * blob.drift;
    const x = contentRect.x + contentRect.width * clamp(blob.x + wobble, 0.05, 0.95);
    const y = contentRect.y + contentRect.height * clamp(blob.y + Math.cos(time * blob.speed * 0.7 + blob.phase) * blob.drift, 0.05, 0.95);
    const radius = Math.max(
      contentRect.width,
      contentRect.height
    ) * clamp(blob.radius * (1 + pulseStrength * 0.6 + audio.rms * 0.5), 0.18, 0.6);

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${baseAlpha})`);
    gradient.addColorStop(0.45, `hsla(${blob.hue}, 100%, 70%, ${baseAlpha * 0.6})`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
  });
  ctx.restore();
}

function drawLinePattern(
  ctx: CanvasRenderingContext2D,
  contentRect: ContentRect,
  spacing: number
): void {
  const maxDim = Math.hypot(contentRect.width, contentRect.height);
  const start = -maxDim;
  const end = maxDim * 2;

  ctx.beginPath();
  for (let y = start; y <= end; y += spacing) {
    ctx.moveTo(contentRect.x + start, contentRect.y + y);
    ctx.lineTo(contentRect.x + end, contentRect.y + y);
  }
  ctx.stroke();
}

function renderBlendMoire(
  ctx: CanvasRenderingContext2D,
  contentRect: ContentRect,
  time: number,
  audio: AudioFeatures,
  intensity: number,
  seed: number
): void {
  const spacingBase = clamp(26 - audio.treble * 18, 8, 30);
  const driftSpeed = 0.12 + audio.bass * 0.35;
  const centerX = contentRect.x + contentRect.width / 2;
  const centerY = contentRect.y + contentRect.height / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(time * driftSpeed * 0.4 + seed * 0.001);
  ctx.translate(-centerX, -centerY);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = clamp(0.22 * intensity + audio.treble * 0.18, 0.1, 0.5);
  ctx.strokeStyle = "rgba(120, 220, 255, 0.9)";
  ctx.lineWidth = 1;
  drawLinePattern(ctx, contentRect, spacingBase);
  ctx.restore();

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(-(time * driftSpeed * 0.55 + seed * 0.002));
  ctx.translate(-centerX, -centerY);
  ctx.globalCompositeOperation = "difference";
  ctx.globalAlpha = clamp(0.28 * intensity + audio.treble * 0.22, 0.15, 0.6);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 1;
  drawLinePattern(ctx, contentRect, spacingBase * 0.92);
  ctx.restore();
}

export function renderBlendIllusions(
  ctx: CanvasRenderingContext2D,
  contentRect: ContentRect,
  time: number,
  delta: number,
  audio: AudioFeatures,
  config: BlendIllusionsConfig,
  seedSource?: number | string
): void {
  const mode = config.mode;
  const intensity = clamp(config.intensity, 0, 2);
  if (intensity <= 0) {
    return;
  }
  const seed = resolveSeed(seedSource);

  if (shouldRender(mode, "torch")) {
    renderInversionTorch(ctx, contentRect, time, audio, intensity, seed);
  }
  if (shouldRender(mode, "glow")) {
    renderImpossibleGlow(ctx, contentRect, time, delta, audio, intensity, seed + 101);
  }
  if (shouldRender(mode, "moire")) {
    renderBlendMoire(ctx, contentRect, time, audio, intensity, seed + 202);
  }
}
