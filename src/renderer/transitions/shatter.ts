import { clamp, lerp, smoothstep } from "../../util/math";

type Point = { x: number; y: number };

type Cell = {
  polygon: Point[];
  centroid: Point;
  area: number;
  direction: Point;
  tangent: Point;
  random: number;
  spin: number;
  delay: number;
  depth: number;
};

export type ShatterShardState = {
  order: number;
  polygon: Point[];
  centroid: Point;
  translateX: number;
  translateY: number;
  rotation: number;
  scale: number;
  alpha: number;
  shadowAlpha: number;
  edgeAlpha: number;
};

export type ShatterTransitionState = {
  toAlpha: number;
  backdropAlpha: number;
  flashAlpha: number;
  shards: ShatterShardState[];
};

const CELL_CACHE = new Map<string, Cell[]>();

const hash01 = (index: number, salt: number): number => {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453123;
  return value - Math.floor(value);
};

const signedDistanceToBisector = (point: Point, seed: Point, other: Point): number => {
  return (
    point.x * (2 * (other.x - seed.x)) +
    point.y * (2 * (other.y - seed.y)) +
    seed.x * seed.x +
    seed.y * seed.y -
    (other.x * other.x + other.y * other.y)
  );
};

const intersectBisector = (a: Point, b: Point, seed: Point, other: Point): Point => {
  const da = signedDistanceToBisector(a, seed, other);
  const db = signedDistanceToBisector(b, seed, other);
  const t = da / (da - db || 1e-6);
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t)
  };
};

const clipPolygonToSeed = (polygon: Point[], seed: Point, other: Point): Point[] => {
  if (polygon.length === 0) {
    return polygon;
  }
  const result: Point[] = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    const currentInside = signedDistanceToBisector(current, seed, other) <= 0;
    const nextInside = signedDistanceToBisector(next, seed, other) <= 0;
    if (currentInside && nextInside) {
      result.push(next);
    } else if (currentInside && !nextInside) {
      result.push(intersectBisector(current, next, seed, other));
    } else if (!currentInside && nextInside) {
      result.push(intersectBisector(current, next, seed, other), next);
    }
  }
  return result;
};

const computePolygonAreaAndCentroid = (polygon: Point[]): { area: number; centroid: Point } => {
  if (polygon.length < 3) {
    const fallback = polygon[0] ?? { x: 0, y: 0 };
    return { area: 0, centroid: fallback };
  }
  let doubleArea = 0;
  let centroidX = 0;
  let centroidY = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    const cross = current.x * next.y - next.x * current.y;
    doubleArea += cross;
    centroidX += (current.x + next.x) * cross;
    centroidY += (current.y + next.y) * cross;
  }
  const area = doubleArea / 2;
  if (Math.abs(area) < 1e-6) {
    const avg = polygon.reduce(
      (acc, point) => ({ x: acc.x + point.x / polygon.length, y: acc.y + point.y / polygon.length }),
      { x: 0, y: 0 }
    );
    return { area: 0, centroid: avg };
  }
  return {
    area: Math.abs(area),
    centroid: {
      x: centroidX / (3 * doubleArea),
      y: centroidY / (3 * doubleArea)
    }
  };
};

const buildSeeds = (width: number, height: number): Point[] => {
  const columns = 6;
  const rows = 4;
  const seeds: Point[] = [];
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const jitterX = (hash01(index, 1) - 0.5) * cellWidth * 0.58;
      const jitterY = (hash01(index, 2) - 0.5) * cellHeight * 0.58;
      seeds.push({
        x: clamp((column + 0.5) * cellWidth + jitterX, 0, width),
        y: clamp((row + 0.5) * cellHeight + jitterY, 0, height)
      });
    }
  }
  return seeds;
};

const buildCells = (width: number, height: number): Cell[] => {
  const cacheKey = `${width}x${height}`;
  const cached = CELL_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }
  const seeds = buildSeeds(width, height);
  const center = { x: width / 2, y: height / 2 };
  const bounds: Point[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height }
  ];

  const cells = seeds
    .map((seed, index) => {
      let polygon = bounds;
      for (let otherIndex = 0; otherIndex < seeds.length; otherIndex += 1) {
        if (otherIndex === index) {
          continue;
        }
        polygon = clipPolygonToSeed(polygon, seed, seeds[otherIndex]);
        if (polygon.length < 3) {
          break;
        }
      }
      const { area, centroid } = computePolygonAreaAndCentroid(polygon);
      const dx = centroid.x - center.x;
      const dy = centroid.y - center.y;
      const length = Math.hypot(dx, dy) || 1;
      const direction = { x: dx / length, y: dy / length };
      const tangent = { x: -direction.y, y: direction.x };
      return {
        polygon,
        centroid,
        area,
        direction,
        tangent,
        random: hash01(index, 3),
        spin: hash01(index, 4) * 2 - 1,
        delay: hash01(index, 5) * 0.18,
        depth: 0.82 + hash01(index, 6) * 0.45
      };
    })
    .filter((cell) => cell.polygon.length >= 3 && cell.area > 8)
    .sort((a, b) => b.area - a.area);

  CELL_CACHE.set(cacheKey, cells);
  return cells;
};

export function computeShatterTransitionState(
  progress: number,
  width: number,
  height: number,
  beatStrength: number
): ShatterTransitionState {
  const safeProgress = clamp(progress, 0, 1);
  const safeBeat = clamp(beatStrength, 0, 1.5);
  const cells = buildCells(width, height);
  const blast = smoothstep(0.04, 0.92, safeProgress);
  const toAlpha = clamp(0.14 + smoothstep(0.08, 0.72, safeProgress) * 0.92, 0, 1);
  const flashAlpha = clamp(Math.exp(-Math.pow((safeProgress - 0.52) / 0.15, 2)) * (0.16 + safeBeat * 0.18), 0, 0.45);
  const backdropAlpha = clamp(0.22 + smoothstep(0.12, 0.84, safeProgress) * 0.5, 0, 0.72);

  const maxTravel = Math.hypot(width, height) * 0.54;
  const beatPush = safeBeat * (width * 0.04 + height * 0.015);

  const shards = cells.map((cell, index) => {
    const localProgress = clamp((safeProgress - cell.delay) / (1 - cell.delay), 0, 1);
    const launch = smoothstep(0, 1, localProgress);
    const spread = (0.18 + cell.random * 0.82) * blast;
    const distance = maxTravel * spread * (0.32 + launch * 0.86) * cell.depth + beatPush * (0.55 + cell.random * 0.65);
    const tangential = (cell.spin * width * 0.045) * Math.pow(localProgress, 1.15);
    const lift = -(0.05 + (1 - cell.direction.y * 0.5) * 0.06) * height * launch;
    const fadeStart = 0.48 + cell.random * 0.18;
    const alpha = clamp(1 - smoothstep(fadeStart, 1, safeProgress) * (0.74 + cell.random * 0.18), 0, 1);
    const scale = 1 - 0.08 * launch + safeBeat * 0.012;
    const edgeAlpha = clamp(0.22 + (1 - localProgress) * 0.5 + safeBeat * 0.08, 0, 0.8);
    const shadowAlpha = clamp(0.08 + localProgress * 0.18 + safeBeat * 0.05, 0, 0.35);
    return {
      order: index,
      polygon: cell.polygon,
      centroid: cell.centroid,
      translateX: cell.direction.x * distance + cell.tangent.x * tangential,
      translateY: cell.direction.y * distance + cell.tangent.y * tangential + lift,
      rotation: cell.spin * (0.12 + launch * 1.6) * (0.8 + cell.random * 0.9),
      scale,
      alpha,
      shadowAlpha,
      edgeAlpha
    };
  });

  return {
    toAlpha,
    backdropAlpha,
    flashAlpha,
    shards: shards.sort((a, b) => {
      const aDistance = Math.hypot(a.translateX, a.translateY);
      const bDistance = Math.hypot(b.translateX, b.translateY);
      return aDistance - bDistance || a.order - b.order;
    })
  };
}
