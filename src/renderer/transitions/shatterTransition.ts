import { clamp } from "../../util/math";

type Point = { x: number; y: number };

type Polygon = Point[];

export type ShatterShard = {
  polygon: Polygon;
  centroid: Point;
  direction: Point;
  rotation: number;
  delay: number;
  speed: number;
  scale: number;
};

export type ShatterTransitionLayout = {
  width: number;
  height: number;
  shards: ShatterShard[];
};

export type ShatterShardState = ShatterShard & {
  offsetX: number;
  offsetY: number;
  currentScale: number;
  currentRotation: number;
  alpha: number;
};

export type ShatterTransitionState = {
  toAlpha: number;
  crackAlpha: number;
  crackWidth: number;
  shards: ShatterShardState[];
};

const SHARD_COUNT = 18;
const PRNG_SEED = 0x5f3759df;

export function createShatterTransitionLayout(width: number, height: number): ShatterTransitionLayout {
  const sites = createSites(width, height, SHARD_COUNT);
  const center = { x: width / 2, y: height / 2 };
  const bounds: Polygon = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height }
  ];

  const shards = sites
    .map((site, index) => {
      let polygon = bounds;
      for (let otherIndex = 0; otherIndex < sites.length; otherIndex += 1) {
        if (otherIndex === index) {
          continue;
        }
        polygon = clipPolygonToVoronoiCell(polygon, site, sites[otherIndex]);
        if (polygon.length === 0) {
          break;
        }
      }
      if (polygon.length < 3) {
        return null;
      }
      const centroid = computePolygonCentroid(polygon);
      const radialX = centroid.x - center.x;
      const radialY = centroid.y - center.y;
      const radialLength = Math.hypot(radialX, radialY) || 1;
      const directionNoise = hashUnit(index * 2 + 1) * 0.45;
      const directionNoiseY = hashUnit(index * 2 + 2) * 0.45;
      const directionX = radialX / radialLength + directionNoise;
      const directionY = radialY / radialLength + directionNoiseY;
      const directionLength = Math.hypot(directionX, directionY) || 1;

      return {
        polygon,
        centroid,
        direction: {
          x: directionX / directionLength,
          y: directionY / directionLength
        },
        rotation: (hashUnit(index * 3 + 7) * Math.PI) / 7,
        delay: 0.02 + index * 0.012 + hash01(index * 5 + 13) * 0.06,
        speed: 0.8 + hash01(index * 7 + 19) * 0.9,
        scale: 0.9 + hash01(index * 11 + 23) * 0.16
      } satisfies ShatterShard;
    })
    .filter((shard): shard is ShatterShard => shard !== null);

  return { width, height, shards };
}

export function computeShatterTransitionState(
  layout: ShatterTransitionLayout,
  progress: number,
  bass = 0,
  beatStrength = 0
): ShatterTransitionState {
  const safeProgress = clamp(progress, 0, 1);
  const safeBass = clamp(bass, 0, 1);
  const safeBeatStrength = clamp(beatStrength, 0, 1);
  const bassBoost = 1 + safeBass * 0.85 + safeBeatStrength * 0.45;
  const maxDistance = Math.hypot(layout.width, layout.height) * 0.52;

  const shards = layout.shards.map((shard) => {
    const local = clamp((safeProgress - shard.delay) / Math.max(0.18, 1 - shard.delay), 0, 1);
    const eased = easeOutCubic(local);
    const distance = maxDistance * shard.speed * eased * bassBoost;
    return {
      ...shard,
      offsetX: shard.direction.x * distance,
      offsetY: shard.direction.y * distance,
      currentScale: shard.scale + safeProgress * 0.08 + safeBass * 0.06,
      currentRotation: shard.rotation * eased * (1 + safeBass * 0.35),
      alpha: clamp(1 - safeProgress * 1.15 - local * 0.12, 0, 1)
    };
  });

  return {
    toAlpha: clamp(0.18 + safeProgress * 1.08, 0, 1),
    crackAlpha: clamp(0.5 - safeProgress * 0.28 + safeBass * 0.18, 0, 0.9),
    crackWidth: 0.85 + safeProgress * 1.6 + safeBass * 1.4,
    shards
  };
}

function createSites(width: number, height: number, count: number): Point[] {
  const random = createMulberry32(PRNG_SEED ^ (width << 8) ^ height);
  const cols = Math.ceil(Math.sqrt(count * (width / Math.max(height, 1))));
  const rows = Math.ceil(count / cols);
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  const sites: Point[] = [];

  for (let row = 0; row < rows && sites.length < count; row += 1) {
    for (let col = 0; col < cols && sites.length < count; col += 1) {
      sites.push({
        x: (col + 0.2 + random() * 0.6) * cellWidth,
        y: (row + 0.2 + random() * 0.6) * cellHeight
      });
    }
  }

  return sites;
}

function clipPolygonToVoronoiCell(subject: Polygon, site: Point, other: Point): Polygon {
  if (subject.length === 0) {
    return subject;
  }

  const deltaX = other.x - site.x;
  const deltaY = other.y - site.y;
  const constant = other.x * other.x + other.y * other.y - site.x * site.x - site.y * site.y;
  const isInside = (point: Point) => 2 * (point.x * deltaX + point.y * deltaY) <= constant;
  const intersection = (start: Point, end: Point): Point => {
    const numerator = constant - 2 * (start.x * deltaX + start.y * deltaY);
    const denominator = 2 * ((end.x - start.x) * deltaX + (end.y - start.y) * deltaY);
    if (Math.abs(denominator) < 1e-8) {
      return end;
    }
    const t = numerator / denominator;
    return {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t
    };
  };

  const result: Polygon = [];
  for (let index = 0; index < subject.length; index += 1) {
    const current = subject[index];
    const previous = subject[(index - 1 + subject.length) % subject.length];
    const currentInside = isInside(current);
    const previousInside = isInside(previous);

    if (currentInside) {
      if (!previousInside) {
        result.push(intersection(previous, current));
      }
      result.push(current);
    } else if (previousInside) {
      result.push(intersection(previous, current));
    }
  }

  return result;
}

function computePolygonCentroid(polygon: Polygon): Point {
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;

  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const cross = current.x * next.y - next.x * current.y;
    twiceArea += cross;
    cx += (current.x + next.x) * cross;
    cy += (current.y + next.y) * cross;
  }

  if (Math.abs(twiceArea) < 1e-6) {
    return polygon.reduce(
      (acc, point) => ({ x: acc.x + point.x / polygon.length, y: acc.y + point.y / polygon.length }),
      { x: 0, y: 0 }
    );
  }

  return {
    x: cx / (3 * twiceArea),
    y: cy / (3 * twiceArea)
  };
}

function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash01(index: number): number {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function hashUnit(index: number): number {
  return hash01(index) * 2 - 1;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
}
