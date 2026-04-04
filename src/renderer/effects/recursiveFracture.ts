import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type FractureProgressMode = "outward" | "inward";
type FracturePaletteMode = "mono" | "era" | "heat";

type RecursiveFractureParams = {
  seed: number;
  shapeCount: number;
  maxDepth: number;
  splitBias: number;
  angleJitter: number;
  gap: number;
  strokeWidth: number;
  fillAlpha: number;
  lineAlpha: number;
  progressSpeed: number;
  progressMode: FractureProgressMode;
  beatPunch: number;
  bassInfluence: number;
  trebleDetail: number;
  paletteMode: FracturePaletteMode;
  minFragmentSize: number;
};

type Vec2 = { x: number; y: number };

type ShardNode = {
  depth: number;
  polygon: Vec2[];
  center: Vec2;
  area: number;
  revealAt: number;
  tint: number;
  children: ShardNode[];
};

type CachedTree = {
  key: string;
  nodes: ShardNode[];
};

const TAU = Math.PI * 2;
const MIN_LINE_EPSILON = 0.01;

export const RECURSIVE_FRACTURE_DEFAULTS = {
  seed: 7,
  shapeCount: 3,
  maxDepth: 6,
  splitBias: 0.65,
  angleJitter: 0.22,
  gap: 2,
  strokeWidth: 1.25,
  fillAlpha: 0.18,
  lineAlpha: 0.9,
  progressSpeed: 0.11,
  progressMode: "outward",
  beatPunch: 0.35,
  bassInfluence: 0.2,
  trebleDetail: 0.3,
  paletteMode: "heat",
  minFragmentSize: 24
} as const;

const toFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveProgressMode = (value: unknown): FractureProgressMode =>
  value === "inward" ? "inward" : "outward";

const resolvePaletteMode = (value: unknown): FracturePaletteMode => {
  if (value === "mono" || value === "era" || value === "heat") {
    return value;
  }
  return RECURSIVE_FRACTURE_DEFAULTS.paletteMode;
};

export const resolveRecursiveFractureParams = (params: Record<string, unknown>): RecursiveFractureParams => ({
  seed: Math.round(toFiniteNumber(params.seed, RECURSIVE_FRACTURE_DEFAULTS.seed)),
  shapeCount: Math.round(clamp(toFiniteNumber(params.shapeCount, RECURSIVE_FRACTURE_DEFAULTS.shapeCount), 1, 6)),
  maxDepth: Math.round(clamp(toFiniteNumber(params.maxDepth, RECURSIVE_FRACTURE_DEFAULTS.maxDepth), 1, 8)),
  splitBias: clamp(toFiniteNumber(params.splitBias, RECURSIVE_FRACTURE_DEFAULTS.splitBias), 0, 1),
  angleJitter: clamp(toFiniteNumber(params.angleJitter, RECURSIVE_FRACTURE_DEFAULTS.angleJitter), 0, 1),
  gap: clamp(toFiniteNumber(params.gap, RECURSIVE_FRACTURE_DEFAULTS.gap), 0, 8),
  strokeWidth: clamp(toFiniteNumber(params.strokeWidth, RECURSIVE_FRACTURE_DEFAULTS.strokeWidth), 0.2, 4),
  fillAlpha: clamp(toFiniteNumber(params.fillAlpha, RECURSIVE_FRACTURE_DEFAULTS.fillAlpha), 0, 1),
  lineAlpha: clamp(toFiniteNumber(params.lineAlpha, RECURSIVE_FRACTURE_DEFAULTS.lineAlpha), 0, 1),
  progressSpeed: clamp(toFiniteNumber(params.progressSpeed, RECURSIVE_FRACTURE_DEFAULTS.progressSpeed), 0.01, 0.8),
  progressMode: resolveProgressMode(params.progressMode),
  beatPunch: clamp(toFiniteNumber(params.beatPunch, RECURSIVE_FRACTURE_DEFAULTS.beatPunch), 0, 1.5),
  bassInfluence: clamp(toFiniteNumber(params.bassInfluence, RECURSIVE_FRACTURE_DEFAULTS.bassInfluence), 0, 1),
  trebleDetail: clamp(toFiniteNumber(params.trebleDetail, RECURSIVE_FRACTURE_DEFAULTS.trebleDetail), 0, 1),
  paletteMode: resolvePaletteMode(params.paletteMode),
  minFragmentSize: clamp(toFiniteNumber(params.minFragmentSize, RECURSIVE_FRACTURE_DEFAULTS.minFragmentSize), 8, 80)
});

// Small deterministic PRNG so seed + params + time always map to stable geometry.
export const createFracturePrng = (seed: number): (() => number) => {
  let state = (seed | 0) ^ 0x9e3779b9;
  return () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
};

const polygonArea = (polygon: Vec2[]): number => {
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const p = polygon[i];
    const q = polygon[(i + 1) % polygon.length];
    sum += p.x * q.y - q.x * p.y;
  }
  return Math.abs(sum * 0.5);
};

const polygonCentroid = (polygon: Vec2[]): Vec2 => {
  let x = 0;
  let y = 0;
  for (const point of polygon) {
    x += point.x;
    y += point.y;
  }
  const inv = 1 / Math.max(1, polygon.length);
  return { x: x * inv, y: y * inv };
};

const signedDistance = (point: Vec2, linePoint: Vec2, normal: Vec2): number =>
  (point.x - linePoint.x) * normal.x + (point.y - linePoint.y) * normal.y;

const intersectSegment = (a: Vec2, b: Vec2, linePoint: Vec2, normal: Vec2): Vec2 => {
  const da = signedDistance(a, linePoint, normal);
  const db = signedDistance(b, linePoint, normal);
  const t = clamp(da / (da - db || MIN_LINE_EPSILON), 0, 1);
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  };
};

const splitPolygon = (polygon: Vec2[], linePoint: Vec2, normal: Vec2): [Vec2[], Vec2[]] | null => {
  const left: Vec2[] = [];
  const right: Vec2[] = [];

  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    const currentDist = signedDistance(current, linePoint, normal);
    const nextDist = signedDistance(next, linePoint, normal);
    const currentInsideLeft = currentDist >= 0;
    const currentInsideRight = currentDist <= 0;

    if (currentInsideLeft) {
      left.push(current);
    }
    if (currentInsideRight) {
      right.push(current);
    }

    if ((currentDist > 0 && nextDist < 0) || (currentDist < 0 && nextDist > 0)) {
      const intersection = intersectSegment(current, next, linePoint, normal);
      left.push(intersection);
      right.push(intersection);
    }
  }

  if (left.length < 3 || right.length < 3) {
    return null;
  }

  return [left, right];
};

const makePanelPolygon = (cx: number, cy: number, w: number, h: number, rotation: number): Vec2[] => {
  const corners: Vec2[] = [
    { x: -w * 0.5, y: -h * 0.5 },
    { x: w * 0.5, y: -h * 0.5 },
    { x: w * 0.5, y: h * 0.5 },
    { x: -w * 0.5, y: h * 0.5 }
  ];
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return corners.map((corner) => ({
    x: cx + corner.x * cos - corner.y * sin,
    y: cy + corner.x * sin + corner.y * cos
  }));
};

const collectNodes = (node: ShardNode, target: ShardNode[]): void => {
  target.push(node);
  node.children.forEach((child) => collectNodes(child, target));
};

export const buildFractureCacheKey = (width: number, height: number, params: RecursiveFractureParams): string => {
  const widthBucket = Math.max(1, Math.round(width / 48));
  const heightBucket = Math.max(1, Math.round(height / 48));
  return [
    widthBucket,
    heightBucket,
    params.seed,
    params.shapeCount,
    params.maxDepth,
    params.splitBias.toFixed(3),
    params.angleJitter.toFixed(3),
    params.minFragmentSize.toFixed(2)
  ].join("|");
};

const choosePalette = (mode: FracturePaletteMode, era: string | undefined): [number, number, number] => {
  if (mode === "mono") {
    return [230, 234, 245];
  }
  if (mode === "heat") {
    return [255, 176, 82];
  }
  switch (era) {
    case "8bit":
      return [130, 255, 178];
    case "16bit":
      return [118, 198, 255];
    case "ps1":
      return [255, 150, 200];
    case "pcdemo":
      return [170, 195, 255];
    case "future":
    default:
      return [135, 220, 255];
  }
};

const revealProgress = (time: number, speed: number, mode: FractureProgressMode, bass: number, bassInfluence: number): number => {
  const cyc = time * speed + bass * bassInfluence * 0.35;
  const ramp = ((cyc % 1) + 1) % 1;
  return mode === "inward" ? 1 - ramp : ramp;
};

const insetPolygon = (polygon: Vec2[], center: Vec2, amount: number): Vec2[] => {
  if (amount <= 0) {
    return polygon;
  }
  return polygon.map((point) => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const len = Math.hypot(dx, dy) || 1;
    const scale = Math.max(0, (len - amount) / len);
    return {
      x: center.x + dx * scale,
      y: center.y + dy * scale
    };
  });
};

const drawPolygon = (ctx: CanvasRenderingContext2D, polygon: Vec2[]): void => {
  if (polygon.length < 3) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i += 1) {
    ctx.lineTo(polygon[i].x, polygon[i].y);
  }
  ctx.closePath();
};

const generateChildNodes = (
  polygon: Vec2[],
  depth: number,
  params: RecursiveFractureParams,
  rand: () => number,
  revealOffset: number
): ShardNode => {
  const center = polygonCentroid(polygon);
  const area = polygonArea(polygon);

  const node: ShardNode = {
    depth,
    polygon,
    center,
    area,
    revealAt: clamp((depth + revealOffset) / Math.max(1, params.maxDepth + 1), 0, 1),
    tint: rand(),
    children: []
  };

  if (depth >= params.maxDepth || area <= params.minFragmentSize * params.minFragmentSize) {
    return node;
  }

  const axisAngle = Math.atan2(polygon[1].y - polygon[0].y, polygon[1].x - polygon[0].x);
  const baseAngle = (rand() > 0.5 ? axisAngle : axisAngle + Math.PI * 0.5) + (rand() - 0.5) * params.angleJitter * Math.PI;
  const normal = { x: Math.cos(baseAngle), y: Math.sin(baseAngle) };
  const tangent = { x: -normal.y, y: normal.x };

  let minProj = Number.POSITIVE_INFINITY;
  let maxProj = Number.NEGATIVE_INFINITY;
  for (const point of polygon) {
    const projection = point.x * tangent.x + point.y * tangent.y;
    minProj = Math.min(minProj, projection);
    maxProj = Math.max(maxProj, projection);
  }
  const centerProjection = center.x * tangent.x + center.y * tangent.y;
  const spread = (maxProj - minProj) * 0.5;
  const irregularity = (1 - params.splitBias) * 0.35;
  const offset = (rand() - 0.5) * spread * irregularity;
  const linePoint = {
    x: center.x + tangent.x * (offset + (centerProjection - (minProj + maxProj) * 0.5) * 0.1),
    y: center.y + tangent.y * (offset + (centerProjection - (minProj + maxProj) * 0.5) * 0.1)
  };

  const split = splitPolygon(polygon, linePoint, normal);
  if (!split) {
    return node;
  }

  const [first, second] = split;
  node.children = [
    generateChildNodes(first, depth + 1, params, rand, revealOffset + rand() * 0.15),
    generateChildNodes(second, depth + 1, params, rand, revealOffset + rand() * 0.15)
  ];

  return node;
};

export const buildRecursiveFractureTree = (width: number, height: number, params: RecursiveFractureParams): ShardNode[] => {
  const rand = createFracturePrng(params.seed);
  const panelCount = Math.max(1, Math.round(params.shapeCount));
  const nodes: ShardNode[] = [];

  for (let i = 0; i < panelCount; i += 1) {
    const isPrimary = i === 0;
    const scale = isPrimary ? 0.78 : 0.36 + rand() * 0.14;
    const aspect = isPrimary ? 1.25 : 0.8 + rand() * 0.9;
    const panelW = Math.min(width, height) * scale * aspect;
    const panelH = Math.min(width, height) * scale;
    const spread = Math.min(width, height) * (isPrimary ? 0.04 : 0.28);
    const cx = width * 0.5 + (rand() - 0.5) * spread * (isPrimary ? 0.8 : 1.8);
    const cy = height * 0.52 + (rand() - 0.5) * spread * (isPrimary ? 0.7 : 1.6);
    const rotation = (rand() - 0.5) * (isPrimary ? 0.22 : 0.5);
    const polygon = makePanelPolygon(cx, cy, panelW, panelH, rotation);
    nodes.push(generateChildNodes(polygon, 0, params, rand, rand() * 0.07));
  }

  return nodes;
};

export const summarizeFractureTree = (nodes: ShardNode[]): { nodeCount: number; maxDepth: number; leafCount: number } => {
  let nodeCount = 0;
  let maxDepth = 0;
  let leafCount = 0;
  const stack = [...nodes];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) {
      continue;
    }
    nodeCount += 1;
    maxDepth = Math.max(maxDepth, node.depth);
    if (node.children.length === 0) {
      leafCount += 1;
    }
    stack.push(...node.children);
  }
  return { nodeCount, maxDepth, leafCount };
};

export class RecursiveFractureEffect implements Effect {
  private cachedTree: CachedTree | null = null;

  reset(): void {
    this.cachedTree = null;
  }

  render({ ctx, width, height, time, audio, params, era }: EffectRenderContext): void {
    const config = resolveRecursiveFractureParams(params as Record<string, unknown>);
    const cacheKey = buildFractureCacheKey(width, height, config);

    if (!this.cachedTree || this.cachedTree.key !== cacheKey) {
      const roots = buildRecursiveFractureTree(width, height, config);
      const flattened: ShardNode[] = [];
      roots.forEach((root) => collectNodes(root, flattened));
      this.cachedTree = { key: cacheKey, nodes: flattened };
    }

    const reveal = revealProgress(time, config.progressSpeed, config.progressMode, audio.bass, config.bassInfluence);
    const beatPulse = audio.beat ? 1 : 0;
    const beatKick = clamp(audio.beatStrength * 0.7 + beatPulse * 0.6, 0, 1) * config.beatPunch;
    const trebleBoost = clamp(audio.treble * config.trebleDetail, 0, 1);
    const rmsBoost = clamp(audio.rms * 0.6, 0, 0.6);
    const [pr, pg, pb] = choosePalette(config.paletteMode, era);

    ctx.fillStyle = "rgb(8, 10, 18)";
    ctx.fillRect(0, 0, width, height);

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    for (const node of this.cachedTree.nodes) {
      if (node.revealAt > reveal + 0.08) {
        continue;
      }

      const depthMix = 1 - node.depth / Math.max(1, config.maxDepth);
      const detailMix = node.depth / Math.max(1, config.maxDepth);
      const revealMix = clamp(1 - Math.abs(node.revealAt - reveal) * 2.8, 0, 1);
      const brightness = clamp(0.26 + node.tint * 0.2 + detailMix * 0.4 + revealMix * 0.18 + trebleBoost * detailMix, 0, 1);
      const alphaFill = clamp(config.fillAlpha * (0.65 + depthMix * 0.4 + rmsBoost) * (0.8 + revealMix * 0.4), 0, 1);
      const alphaLine = clamp(config.lineAlpha * (0.72 + detailMix * 0.45 + beatKick * 0.55 + trebleBoost * 0.25), 0, 1);
      const lineWidth = config.strokeWidth * (0.85 + depthMix * 0.6 + beatKick * 0.35);

      const driftScale = beatKick * (1.2 + detailMix * 1.4);
      const driftX = (node.center.x - width * 0.5) * 0.004 * driftScale;
      const driftY = (node.center.y - height * 0.5) * 0.004 * driftScale;

      const gapped = insetPolygon(node.polygon, node.center, config.gap * (0.9 + beatKick * 0.7));
      const shifted = gapped.map((point) => ({ x: point.x + driftX, y: point.y + driftY }));

      const r = Math.round(pr * brightness);
      const g = Math.round(pg * brightness);
      const b = Math.round(pb * brightness);

      drawPolygon(ctx, shifted);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alphaFill.toFixed(3)})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 25)}, ${alphaLine.toFixed(3)})`;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }
}
