import { clamp, lerp, smoothstep } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type PaletteName = "day" | "dusk" | "night" | "neon";

type Color = { r: number; g: number; b: number };

type ForestPalette = {
  skyTop: Color;
  skyHorizon: Color;
  haze: Color;
  groundNear: Color;
  groundFar: Color;
  treeTintNear: Color;
  treeTintFar: Color;
  trunk: Color;
};

type ForestTree = {
  x: number;
  z: number;
  scale: number;
  variant: number;
  wobblePhase: number;
  trunkBias: number;
};

type RenderTree = {
  tree: ForestTree;
  sx: number;
  sy: number;
  size: number;
  depthN: number;
};

const clamp01 = (value: number): number => clamp(value, 0, 1);

const PALETTES: Record<PaletteName, ForestPalette> = {
  day: {
    skyTop: { r: 108, g: 174, b: 222 },
    skyHorizon: { r: 198, g: 224, b: 238 },
    haze: { r: 210, g: 224, b: 228 },
    groundNear: { r: 42, g: 78, b: 58 },
    groundFar: { r: 92, g: 116, b: 102 },
    treeTintNear: { r: 42, g: 124, b: 68 },
    treeTintFar: { r: 112, g: 142, b: 126 },
    trunk: { r: 78, g: 56, b: 40 }
  },
  dusk: {
    skyTop: { r: 58, g: 72, b: 124 },
    skyHorizon: { r: 230, g: 160, b: 126 },
    haze: { r: 202, g: 146, b: 138 },
    groundNear: { r: 38, g: 44, b: 52 },
    groundFar: { r: 84, g: 78, b: 88 },
    treeTintNear: { r: 98, g: 78, b: 62 },
    treeTintFar: { r: 142, g: 122, b: 118 },
    trunk: { r: 68, g: 48, b: 38 }
  },
  night: {
    skyTop: { r: 16, g: 22, b: 48 },
    skyHorizon: { r: 50, g: 76, b: 104 },
    haze: { r: 82, g: 102, b: 124 },
    groundNear: { r: 18, g: 28, b: 30 },
    groundFar: { r: 42, g: 56, b: 64 },
    treeTintNear: { r: 32, g: 88, b: 76 },
    treeTintFar: { r: 82, g: 112, b: 120 },
    trunk: { r: 52, g: 38, b: 34 }
  },
  neon: {
    skyTop: { r: 24, g: 12, b: 52 },
    skyHorizon: { r: 156, g: 70, b: 134 },
    haze: { r: 112, g: 84, b: 160 },
    groundNear: { r: 24, g: 42, b: 36 },
    groundFar: { r: 56, g: 70, b: 82 },
    treeTintNear: { r: 54, g: 206, b: 164 },
    treeTintFar: { r: 118, g: 122, b: 182 },
    trunk: { r: 72, g: 54, b: 64 }
  }
};

export const BILLBOARD_FOREST_DEFAULTS = {
  treeCount: 260,
  speed: 1,
  spread: 1,
  depth: 1,
  fog: 0.62,
  sway: 0.3,
  trunkHeight: 1,
  canopySize: 1,
  palette: "dusk",
  seed: 1337,
  layers: 4,
  groundMist: 0.45,
  beatPulse: 0.4,
  tilt: 0.12,
  parallax: 0.25
} as const;

const resolvePaletteName = (params: Record<string, unknown>): PaletteName => {
  const value = params.palette;
  if (value === "day" || value === "dusk" || value === "night" || value === "neon") {
    return value;
  }
  return BILLBOARD_FOREST_DEFAULTS.palette;
};

export const createMulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967295;
  };
};

const mixColor = (a: Color, b: Color, t: number): Color => ({
  r: lerp(a.r, b.r, t),
  g: lerp(a.g, b.g, t),
  b: lerp(a.b, b.b, t)
});

const colorToString = (color: Color, alpha = 1): string =>
  `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${alpha.toFixed(3)})`;

export const projectBillboard = (
  treeX: number,
  treeZ: number,
  viewportWidth: number,
  viewportHeight: number,
  horizonY: number,
  focal: number,
  baseScale: number
): { x: number; y: number; size: number } => {
  const depth = Math.max(0.06, treeZ);
  const inv = focal / depth;
  const x = viewportWidth * 0.5 + treeX * inv;
  const y = horizonY + viewportHeight * 0.34 * inv;
  const size = baseScale * inv;
  return { x, y, size };
};

const createTreeSprite = (
  variant: number,
  palette: ForestPalette,
  trunkHeight: number,
  canopySize: number
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 168;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }

  const w = canvas.width;
  const h = canvas.height;
  const trunkW = 14 + (variant % 3) * 2;
  const trunkH = (44 + (variant % 2) * 8) * trunkHeight;
  const canopyR = (36 + variant * 2) * canopySize;
  const rootY = h - 10;
  const trunkY = rootY - trunkH;

  ctx.clearRect(0, 0, w, h);

  const trunkGrad = ctx.createLinearGradient(0, trunkY, 0, rootY);
  trunkGrad.addColorStop(0, colorToString(mixColor(palette.trunk, { r: 220, g: 220, b: 220 }, 0.08)));
  trunkGrad.addColorStop(1, colorToString(mixColor(palette.trunk, { r: 0, g: 0, b: 0 }, 0.35)));
  ctx.fillStyle = trunkGrad;
  ctx.beginPath();
  ctx.roundRect(w * 0.5 - trunkW * 0.5, trunkY, trunkW, trunkH, 4);
  ctx.fill();

  const canopyCenterY = trunkY - canopyR * 0.25;
  const canopyGradient = ctx.createRadialGradient(w * 0.44, canopyCenterY - canopyR * 0.2, canopyR * 0.2, w * 0.5, canopyCenterY, canopyR * 1.2);
  canopyGradient.addColorStop(0, colorToString(mixColor(palette.treeTintNear, { r: 255, g: 255, b: 255 }, 0.28), 0.95));
  canopyGradient.addColorStop(0.7, colorToString(palette.treeTintNear, 0.95));
  canopyGradient.addColorStop(1, colorToString(mixColor(palette.treeTintNear, { r: 0, g: 0, b: 0 }, 0.38), 0.85));
  ctx.fillStyle = canopyGradient;

  const lumps = 4 + (variant % 3);
  for (let i = 0; i < lumps; i += 1) {
    const angle = (i / lumps) * Math.PI * 2;
    const rx = canopyR * (0.52 + 0.18 * Math.sin(i * 1.9 + variant));
    const ry = canopyR * (0.46 + 0.24 * Math.cos(i * 2.3 + variant));
    const cx = w * 0.5 + Math.cos(angle) * canopyR * 0.35;
    const cy = canopyCenterY + Math.sin(angle) * canopyR * 0.22;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, angle * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = colorToString(mixColor(palette.treeTintNear, { r: 255, g: 255, b: 255 }, 0.35), 0.24);
  ctx.beginPath();
  ctx.ellipse(w * 0.44, canopyCenterY - canopyR * 0.32, canopyR * 0.5, canopyR * 0.36, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = colorToString(mixColor(palette.treeTintNear, { r: 0, g: 0, b: 0 }, 0.45), 0.2);
  ctx.beginPath();
  ctx.ellipse(w * 0.62, canopyCenterY + canopyR * 0.1, canopyR * 0.52, canopyR * 0.36, 0.38, 0, Math.PI * 2);
  ctx.fill();

  if (variant % 2 === 0) {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = colorToString(mixColor(palette.trunk, { r: 0, g: 0, b: 0 }, 0.2), 0.66);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, trunkY + trunkH * 0.4);
    ctx.lineTo(w * 0.27, trunkY + trunkH * 0.12);
    ctx.moveTo(w * 0.5, trunkY + trunkH * 0.36);
    ctx.lineTo(w * 0.7, trunkY + trunkH * 0.08);
    ctx.stroke();
  }

  return canvas;
};

const createForestSprites = (
  palette: ForestPalette,
  trunkHeight: number,
  canopySize: number
): HTMLCanvasElement[] => Array.from({ length: 4 }, (_, index) => createTreeSprite(index, palette, trunkHeight, canopySize));

export const generateForestTrees = (seed: number, treeCount: number, spread: number, depth: number): ForestTree[] => {
  const random = createMulberry32(seed);
  const trees: ForestTree[] = new Array(treeCount);
  for (let i = 0; i < treeCount; i += 1) {
    trees[i] = {
      x: (random() * 2 - 1) * spread,
      z: random() * depth + 0.25,
      scale: lerp(0.72, 1.35, random()),
      variant: Math.floor(random() * 4),
      wobblePhase: random() * Math.PI * 2,
      trunkBias: random()
    };
  }
  return trees;
};

export class BillboardForestEffect implements Effect {
  private trees: ForestTree[] = [];
  private drawList: RenderTree[] = [];
  private sprites: HTMLCanvasElement[] = [];
  private seed = Number.NaN;
  private treeCount = -1;
  private spread = -1;
  private depth = -1;
  private paletteName: PaletteName = "dusk";
  private trunkHeight = 1;
  private canopySize = 1;
  private beatPulse = 0;

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const treeCount = Math.round(clamp(params.treeCount ?? BILLBOARD_FOREST_DEFAULTS.treeCount, 80, 520));
    const speed = Math.max(0.05, params.speed ?? BILLBOARD_FOREST_DEFAULTS.speed);
    const spread = Math.max(0.35, params.spread ?? BILLBOARD_FOREST_DEFAULTS.spread) * (Math.min(width, height) * 0.78);
    const depth = Math.max(0.4, params.depth ?? BILLBOARD_FOREST_DEFAULTS.depth) * 2.8;
    const fog = clamp01(params.fog ?? BILLBOARD_FOREST_DEFAULTS.fog);
    const sway = clamp(params.sway ?? BILLBOARD_FOREST_DEFAULTS.sway, 0, 1.2);
    const trunkHeight = clamp(params.trunkHeight ?? BILLBOARD_FOREST_DEFAULTS.trunkHeight, 0.65, 1.5);
    const canopySize = clamp(params.canopySize ?? BILLBOARD_FOREST_DEFAULTS.canopySize, 0.7, 1.5);
    const seed = Math.round(params.seed ?? BILLBOARD_FOREST_DEFAULTS.seed);
    const layers = Math.max(1, Math.round(params.layers ?? BILLBOARD_FOREST_DEFAULTS.layers));
    const groundMist = clamp01(params.groundMist ?? BILLBOARD_FOREST_DEFAULTS.groundMist);
    const beatPulseParam = clamp01(params.beatPulse ?? BILLBOARD_FOREST_DEFAULTS.beatPulse);
    const tilt = clamp(params.tilt ?? BILLBOARD_FOREST_DEFAULTS.tilt, -0.6, 0.6);
    const parallax = clamp(params.parallax ?? BILLBOARD_FOREST_DEFAULTS.parallax, 0, 1);

    const paletteName = resolvePaletteName(params as Record<string, unknown>);
    const palette = PALETTES[paletteName];

    if (
      this.trees.length === 0 ||
      this.seed !== seed ||
      this.treeCount !== treeCount ||
      this.spread !== spread ||
      this.depth !== depth
    ) {
      this.seed = seed;
      this.treeCount = treeCount;
      this.spread = spread;
      this.depth = depth;
      this.trees = generateForestTrees(seed, treeCount, spread, depth);
      this.drawList = new Array(treeCount);
      for (let i = 0; i < treeCount; i += 1) {
        this.drawList[i] = { tree: this.trees[i], sx: 0, sy: 0, size: 0, depthN: 0 };
      }
    }

    if (
      this.sprites.length === 0 ||
      this.paletteName !== paletteName ||
      Math.abs(this.trunkHeight - trunkHeight) > 0.01 ||
      Math.abs(this.canopySize - canopySize) > 0.01
    ) {
      this.paletteName = paletteName;
      this.trunkHeight = trunkHeight;
      this.canopySize = canopySize;
      this.sprites = createForestSprites(palette, trunkHeight, canopySize);
    }

    const dt = clamp(delta, 1 / 240, 0.06);
    const bass = audio.bass ?? 0;
    const mids = audio.mid ?? 0;
    const treble = audio.treble ?? 0;

    if (audio.beat) {
      this.beatPulse = Math.max(this.beatPulse, (audio.beatStrength ?? 1) * beatPulseParam);
    }
    this.beatPulse = Math.max(0, this.beatPulse - dt * 2.8);

    const travel = dt * (0.35 + speed * 1.1 + bass * 0.9 * beatPulseParam + this.beatPulse * 0.8);
    const horizonBase = height * lerp(0.44, 0.53, clamp01((1 - width / Math.max(height, 1)) * 0.7));
    const horizonY = horizonBase + Math.sin(time * 0.6) * 8 * sway + bass * 10 * sway;
    const focal = Math.min(width, height) * (0.55 + parallax * 0.18);
    const baseScale = Math.min(width, height) * 0.56;
    const yaw = Math.sin(time * 0.22) * (0.35 + sway * 0.28) + Math.sin(time * 0.93) * 0.08 + mids * 0.12;
    const exposurePulse = this.beatPulse * 0.24;

    this.drawBackground(ctx, width, height, horizonY, palette, fog, groundMist, layers, time, exposurePulse);

    const nearClip = 0.12;
    for (let i = 0; i < this.trees.length; i += 1) {
      const tree = this.trees[i];
      tree.z -= travel * (0.85 + tree.scale * 0.45);
      if (tree.z < nearClip) {
        tree.z += depth;
      }

      const wobble = Math.sin(time * (0.8 + treble * 1.6) + tree.wobblePhase) * sway * 20;
      const worldX = tree.x + wobble + yaw * (1 - tree.z / depth) * spread * 0.65;
      const projection = projectBillboard(worldX, tree.z, width, height, horizonY, focal, baseScale * tree.scale);
      const depthN = clamp01(tree.z / depth);
      const draw = this.drawList[i];
      draw.sx = projection.x;
      draw.sy = projection.y;
      draw.size = projection.size;
      draw.depthN = depthN;
    }

    this.drawList.sort((a, b) => b.tree.z - a.tree.z);

    ctx.save();
    ctx.translate(0, Math.sin(time * 0.37) * tilt * 10 + this.beatPulse * tilt * 18);

    for (let i = 0; i < this.drawList.length; i += 1) {
      const item = this.drawList[i];
      const sprite = this.sprites[item.tree.variant % this.sprites.length];
      if (!sprite) {
        continue;
      }

      const far = item.depthN;
      const fogMix = smoothstep(0.12, 1, far) * fog;
      const tint = mixColor(palette.treeTintNear, palette.treeTintFar, fogMix);
      const fogColor = mixColor(tint, palette.haze, fogMix * 0.7);

      const drawW = item.size * 0.8;
      const drawH = item.size * 1.45;
      const x = item.sx - drawW * 0.5;
      const y = item.sy - drawH;

      if (x > width + drawW || x < -drawW || y > height + drawH || y < -drawH * 1.4) {
        continue;
      }

      const alpha = clamp01(1 - fogMix * 0.85);
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, x, y, drawW, drawH);

      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = colorToString(fogColor, clamp01(0.08 + fogMix * 0.44));
      ctx.fillRect(x, y, drawW, drawH);
      ctx.globalCompositeOperation = "source-over";

      ctx.fillStyle = colorToString({ r: 0, g: 0, b: 0 }, clamp01((1 - far) * 0.2));
      ctx.beginPath();
      ctx.ellipse(item.sx, item.sy + drawH * 0.02, drawW * (0.28 + item.tree.trunkBias * 0.2), drawH * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    this.drawForegroundStreaks(ctx, width, height, horizonY, time, speed, palette, fog);

    if (paletteName === "night" || paletteName === "neon") {
      this.drawDustMotes(ctx, width, height, time, palette, treble);
    }

    ctx.restore();

    if (exposurePulse > 0.01) {
      ctx.fillStyle = colorToString({ r: 255, g: 255, b: 255 }, exposurePulse * (paletteName === "neon" ? 0.2 : 0.12));
      ctx.fillRect(0, 0, width, height);
    }
  }

  reset(): void {
    this.trees = [];
    this.drawList = [];
    this.sprites = [];
    this.seed = Number.NaN;
    this.treeCount = -1;
    this.spread = -1;
    this.depth = -1;
    this.beatPulse = 0;
  }

  private drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    horizonY: number,
    palette: ForestPalette,
    fog: number,
    groundMist: number,
    layers: number,
    time: number,
    exposurePulse: number
  ): void {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, colorToString(palette.skyTop));
    sky.addColorStop(Math.max(0.01, horizonY / Math.max(height, 1)), colorToString(palette.skyHorizon));
    sky.addColorStop(1, colorToString(mixColor(palette.groundNear, { r: 0, g: 0, b: 0 }, 0.2)));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    for (let layer = 0; layer < layers; layer += 1) {
      const depthN = layer / Math.max(1, layers - 1);
      const y = lerp(horizonY * 0.84, horizonY * 1.05, depthN);
      const amp = lerp(height * 0.08, height * 0.02, depthN);
      const tone = mixColor(palette.treeTintNear, palette.haze, 0.46 + depthN * 0.4);
      ctx.fillStyle = colorToString(tone, 0.24 - depthN * 0.08 + exposurePulse * 0.06);
      ctx.beginPath();
      ctx.moveTo(0, height);
      const step = Math.max(18, Math.round(width / 28));
      for (let x = -step; x <= width + step; x += step) {
        const wave = Math.sin(x * 0.01 + time * (0.2 + depthN * 0.3) + layer * 1.7) * amp;
        ctx.lineTo(x, y + wave);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    }

    const mist = ctx.createLinearGradient(0, horizonY - height * 0.04, 0, height);
    mist.addColorStop(0, colorToString(palette.haze, 0));
    mist.addColorStop(0.55, colorToString(palette.haze, groundMist * (0.2 + fog * 0.28)));
    mist.addColorStop(1, colorToString(palette.haze, groundMist * (0.45 + fog * 0.4)));
    ctx.fillStyle = mist;
    ctx.fillRect(0, horizonY - height * 0.05, width, height - horizonY + height * 0.05);

    const ground = ctx.createLinearGradient(0, horizonY, 0, height);
    ground.addColorStop(0, colorToString(palette.groundFar, 0.25));
    ground.addColorStop(1, colorToString(palette.groundNear, 0.6));
    ctx.fillStyle = ground;
    ctx.fillRect(0, horizonY, width, height - horizonY);
  }

  private drawForegroundStreaks(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    horizonY: number,
    time: number,
    speed: number,
    palette: ForestPalette,
    fog: number
  ): void {
    const streakAlpha = clamp01((speed - 0.8) * 0.12 + 0.05);
    if (streakAlpha <= 0.01) {
      return;
    }

    const tint = colorToString(mixColor(palette.trunk, { r: 0, g: 0, b: 0 }, 0.1), streakAlpha * (0.9 - fog * 0.35));
    ctx.fillStyle = tint;
    const motion = (time * (200 + speed * 60)) % (height * 1.2);

    const leftX = width * 0.05 + Math.sin(time * 0.9) * width * 0.02;
    const rightX = width * 0.95 + Math.cos(time * 1.1) * width * 0.02;
    ctx.fillRect(leftX - width * 0.02, horizonY - height * 0.1, width * 0.04, motion + height * 0.1);
    ctx.fillRect(rightX - width * 0.025, horizonY - height * 0.08, width * 0.05, motion * 0.9 + height * 0.1);
  }

  private drawDustMotes(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    palette: ForestPalette,
    treble: number
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const count = 24;
    for (let i = 0; i < count; i += 1) {
      const p = i * 13.37;
      const x = ((Math.sin(time * 0.24 + p) * 0.5 + 0.5) * 1.1 - 0.05) * width;
      const y = ((Math.cos(time * 0.33 + p * 1.7) * 0.5 + 0.5) * 0.7 + 0.08) * height;
      const r = 0.8 + ((i % 3) + 1) * 0.6 + treble * 0.8;
      const alpha = 0.03 + (i % 4) * 0.01 + treble * 0.08;
      ctx.fillStyle = colorToString(palette.haze, alpha);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
