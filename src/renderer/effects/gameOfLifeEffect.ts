import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type PaletteMode = "mono" | "heat" | "era";
type PatternMode = "random" | "curated" | "mixed";

type GameOfLifeParams = {
  cellSize: number;
  stepRate: number;
  seed?: number;
  density: number;
  wrap: boolean;
  paletteMode: PaletteMode;
  gridLines: boolean;
  fadeTrails: number;
  gliderRate: number;
  patternMode: PatternMode;
  burstOnBeat: number;
  survivalTint: number;
  safeFit: boolean;
};

type GameOfLifeState = {
  cols: number;
  rows: number;
  drawX: number;
  drawY: number;
  drawW: number;
  drawH: number;
  cellSize: number;
  current: Uint8Array;
  next: Uint8Array;
  age: Uint16Array;
  trail: Float32Array;
  accumulator: number;
  tickCount: number;
  rngState: number;
  anchorTime: number;
  lastTime: number;
  reseedKey: string;
  seededValue: number;
};

type Rng = () => number;

type Pattern = ReadonlyArray<readonly [number, number]>;

const MAX_STEPS_PER_FRAME = 12;
const REANCHOR_GAP_SECONDS = 2.5;
const RESEED_REBUILD_MAX_TICKS = 900;

const BLINKER: Pattern = [
  [0, 0],
  [1, 0],
  [2, 0]
];

const TOAD: Pattern = [
  [1, 0],
  [2, 0],
  [3, 0],
  [0, 1],
  [1, 1],
  [2, 1]
];

const BEACON: Pattern = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
  [2, 2],
  [3, 2],
  [2, 3],
  [3, 3]
];

const GLIDER: Pattern = [
  [1, 0],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2]
];

const LWSS: Pattern = [
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [0, 1],
  [4, 1],
  [4, 2],
  [0, 3],
  [3, 3]
];

const PULSAR: Pattern = [
  [2, 0], [3, 0], [4, 0], [8, 0], [9, 0], [10, 0],
  [0, 2], [5, 2], [7, 2], [12, 2],
  [0, 3], [5, 3], [7, 3], [12, 3],
  [0, 4], [5, 4], [7, 4], [12, 4],
  [2, 5], [3, 5], [4, 5], [8, 5], [9, 5], [10, 5],
  [2, 7], [3, 7], [4, 7], [8, 7], [9, 7], [10, 7],
  [0, 8], [5, 8], [7, 8], [12, 8],
  [0, 9], [5, 9], [7, 9], [12, 9],
  [0, 10], [5, 10], [7, 10], [12, 10],
  [2, 12], [3, 12], [4, 12], [8, 12], [9, 12], [10, 12]
];

const CURATED_LIBRARY: Pattern[] = [BLINKER, TOAD, BEACON, GLIDER, LWSS, PULSAR];

const PALETTES = {
  mono: {
    bg: "#07090d",
    newborn: "#eff6ff",
    survivor: "#78b8ff",
    trail: "#6a9fd9",
    grid: "rgba(255,255,255,0.08)"
  },
  heat: {
    bg: "#0f0704",
    newborn: "#ffd9a8",
    survivor: "#ff7d4d",
    trail: "#d95731",
    grid: "rgba(255,190,120,0.08)"
  }
} as const;

export const GAME_OF_LIFE_DEFAULTS: GameOfLifeParams = {
  cellSize: 8,
  stepRate: 8,
  density: 0.22,
  wrap: true,
  paletteMode: "mono",
  gridLines: false,
  fadeTrails: 0.12,
  gliderRate: 0,
  patternMode: "mixed",
  burstOnBeat: 0.25,
  survivalTint: 0.42,
  safeFit: true
};

const asFinite = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const asBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value >= 0.5;
  }
  return fallback;
};

const asString = (value: unknown, fallback: string): string => (typeof value === "string" && value ? value : fallback);

const parsePaletteMode = (value: unknown): PaletteMode => {
  const mode = asString(value, GAME_OF_LIFE_DEFAULTS.paletteMode);
  return mode === "heat" || mode === "era" ? mode : "mono";
};

const parsePatternMode = (value: unknown): PatternMode => {
  const mode = asString(value, GAME_OF_LIFE_DEFAULTS.patternMode);
  return mode === "random" || mode === "curated" ? mode : "mixed";
};

export const resolveGameOfLifeParams = (params: Record<string, unknown>): GameOfLifeParams => {
  const providedSeed = params.seed;
  return {
    cellSize: clamp(Math.round(asFinite(params.cellSize, GAME_OF_LIFE_DEFAULTS.cellSize)), 4, 32),
    stepRate: clamp(asFinite(params.stepRate, GAME_OF_LIFE_DEFAULTS.stepRate), 1, 30),
    seed: typeof providedSeed === "number" && Number.isFinite(providedSeed) ? Math.floor(Math.abs(providedSeed)) : undefined,
    density: clamp(asFinite(params.density, GAME_OF_LIFE_DEFAULTS.density), 0.01, 0.9),
    wrap: asBoolean(params.wrap, GAME_OF_LIFE_DEFAULTS.wrap),
    paletteMode: parsePaletteMode(params.paletteMode),
    gridLines: asBoolean(params.gridLines, GAME_OF_LIFE_DEFAULTS.gridLines),
    fadeTrails: clamp(asFinite(params.fadeTrails, GAME_OF_LIFE_DEFAULTS.fadeTrails), 0, 1),
    gliderRate: clamp(asFinite(params.gliderRate, GAME_OF_LIFE_DEFAULTS.gliderRate), 0, 1),
    patternMode: parsePatternMode(params.patternMode),
    burstOnBeat: clamp(asFinite(params.burstOnBeat, GAME_OF_LIFE_DEFAULTS.burstOnBeat), 0, 1),
    survivalTint: clamp(asFinite(params.survivalTint, GAME_OF_LIFE_DEFAULTS.survivalTint), 0, 1),
    safeFit: asBoolean(params.safeFit, GAME_OF_LIFE_DEFAULTS.safeFit)
  };
};

export const createSeededRng = (seed: number): Rng => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hashFloat = (x: number, y: number, seed: number): number => {
  const dot = x * 127.1 + y * 311.7 + seed * 74.7;
  const val = Math.sin(dot) * 43758.5453;
  return val - Math.floor(val);
};

const indexAt = (x: number, y: number, cols: number): number => y * cols + x;

function stampPattern(buffer: Uint8Array, age: Uint16Array, cols: number, rows: number, px: number, py: number, pattern: Pattern, wrap: boolean): void {
  for (const [dx, dy] of pattern) {
    let x = px + dx;
    let y = py + dy;

    if (wrap) {
      x = ((x % cols) + cols) % cols;
      y = ((y % rows) + rows) % rows;
    } else if (x < 0 || y < 0 || x >= cols || y >= rows) {
      continue;
    }

    const idx = indexAt(x, y, cols);
    buffer[idx] = 1;
    age[idx] = Math.max(1, age[idx]);
  }
}

export const seedInitialGrid = (
  buffer: Uint8Array,
  age: Uint16Array,
  cols: number,
  rows: number,
  params: GameOfLifeParams,
  rng: Rng
): void => {
  buffer.fill(0);
  age.fill(0);

  const applyRandom = (): void => {
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const idx = indexAt(x, y, cols);
        if (rng() < params.density) {
          buffer[idx] = 1;
          age[idx] = 1;
        }
      }
    }
  };

  const applyCurated = (): void => {
    const available = CURATED_LIBRARY.filter((pattern) => {
      const maxX = pattern.reduce((highest, [x]) => Math.max(highest, x), 0) + 1;
      const maxY = pattern.reduce((highest, [, y]) => Math.max(highest, y), 0) + 1;
      return maxX <= cols && maxY <= rows;
    });

    if (available.length === 0) {
      applyRandom();
      return;
    }

    const placements = clamp(Math.floor(2 + (cols * rows) / 1800), 2, 7);
    for (let i = 0; i < placements; i += 1) {
      const pattern = available[Math.floor(rng() * available.length)] ?? available[0];
      const w = pattern.reduce((highest, [x]) => Math.max(highest, x), 0) + 1;
      const h = pattern.reduce((highest, [, y]) => Math.max(highest, y), 0) + 1;
      const px = Math.floor(rng() * Math.max(1, cols - w + 1));
      const py = Math.floor(rng() * Math.max(1, rows - h + 1));
      stampPattern(buffer, age, cols, rows, px, py, pattern, params.wrap);
    }
  };

  if (params.patternMode === "random") {
    applyRandom();
    return;
  }

  if (params.patternMode === "curated") {
    applyCurated();
    return;
  }

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const idx = indexAt(x, y, cols);
      if (rng() < params.density * 0.45) {
        buffer[idx] = 1;
        age[idx] = 1;
      }
    }
  }
  applyCurated();
};

export function countNeighbours(buffer: Uint8Array, x: number, y: number, cols: number, rows: number, wrap: boolean): number {
  let count = 0;
  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      if (ox === 0 && oy === 0) {
        continue;
      }

      let nx = x + ox;
      let ny = y + oy;

      if (wrap) {
        nx = ((nx % cols) + cols) % cols;
        ny = ((ny % rows) + rows) % rows;
      } else if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) {
        continue;
      }

      count += buffer[indexAt(nx, ny, cols)];
    }
  }
  return count;
}

export const stepSimulation = (
  current: Uint8Array,
  next: Uint8Array,
  age: Uint16Array,
  trail: Float32Array,
  cols: number,
  rows: number,
  wrap: boolean,
  fadeTrails: number
): void => {
  const retention = clamp(1 - fadeTrails, 0, 1);

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const idx = indexAt(x, y, cols);
      const alive = current[idx] === 1;
      const neighbours = countNeighbours(current, x, y, cols, rows, wrap);
      const survives = alive && (neighbours === 2 || neighbours === 3);
      const born = !alive && neighbours === 3;
      const nextAlive = survives || born;

      next[idx] = nextAlive ? 1 : 0;
      age[idx] = nextAlive ? (alive ? Math.min(4095, age[idx] + 1) : 1) : 0;

      const target = nextAlive ? 1 : 0;
      trail[idx] = trail[idx] * retention + target * (1 - retention);
    }
  }

  current.set(next);
};

const quantizeParam = (value: number): number => Math.round(value * 10000) / 10000;

const buildReseedKey = (params: GameOfLifeParams, cols: number, rows: number): string =>
  [
    cols,
    rows,
    params.cellSize,
    quantizeParam(params.stepRate),
    quantizeParam(params.density),
    params.wrap ? 1 : 0,
    params.patternMode,
    params.seed ?? "auto"
  ].join("|");

const resolveEraPalette = (era: string | undefined) => {
  const eraMode = era?.toLowerCase();
  if (eraMode === "8bit" || eraMode === "16bit") {
    return {
      bg: "#04040a",
      newborn: "#f8f1ff",
      survivor: "#9a7cff",
      trail: "#6f58c8",
      grid: "rgba(220,210,255,0.11)"
    };
  }
  if (eraMode === "ps1" || eraMode === "pcdemo") {
    return {
      bg: "#05090f",
      newborn: "#c3f8ff",
      survivor: "#48c6ff",
      trail: "#2e81cc",
      grid: "rgba(140,220,255,0.09)"
    };
  }
  return {
    bg: "#05070a",
    newborn: "#f4fbff",
    survivor: "#68d4ff",
    trail: "#4892c7",
    grid: "rgba(170,230,255,0.08)"
  };
};

const resolvePalette = (mode: PaletteMode, era: string | undefined) => {
  if (mode === "heat") {
    return PALETTES.heat;
  }
  if (mode === "era") {
    return resolveEraPalette(era);
  }
  return PALETTES.mono;
};

const readBeatStrength = (audio: EffectRenderContext["audio"]): number =>
  clamp((audio.beat ? 0.35 : 0) + (audio.beatStrength ?? 0) * 0.5 + (audio.impactStrength ?? 0) * 0.35 + (audio.rms ?? 0) * 0.2, 0, 1.5);

const maybeInjectGlider = (state: GameOfLifeState, params: GameOfLifeParams, forceChance: number, timeBucket: number): void => {
  const chance = clamp(params.gliderRate + forceChance, 0, 1);
  const sample = hashFloat(timeBucket, state.tickCount, state.rngState);
  if (sample > chance || state.cols < 4 || state.rows < 4) {
    return;
  }
  const px = Math.floor(hashFloat(timeBucket + 11, state.tickCount + 17, state.rngState) * (state.cols - 3));
  const py = Math.floor(hashFloat(timeBucket + 19, state.tickCount + 29, state.rngState) * (state.rows - 3));
  stampPattern(state.current, state.age, state.cols, state.rows, px, py, GLIDER, params.wrap);
};

const maybeInjectBurst = (state: GameOfLifeState, params: GameOfLifeParams, beatStrength: number, timeBucket: number): void => {
  if (beatStrength <= 0 || params.burstOnBeat <= 0) {
    return;
  }
  const triggerRoll = hashFloat(timeBucket + 31, state.tickCount + 3, state.rngState);
  if (triggerRoll > params.burstOnBeat * beatStrength) {
    return;
  }
  const cx = Math.floor(hashFloat(timeBucket + 7, state.tickCount + 5, state.rngState) * state.cols);
  const cy = Math.floor(hashFloat(timeBucket + 13, state.tickCount + 9, state.rngState) * state.rows);
  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      if (ox === 0 && oy === 0) {
        continue;
      }
      const x = params.wrap ? ((cx + ox + state.cols) % state.cols) : cx + ox;
      const y = params.wrap ? ((cy + oy + state.rows) % state.rows) : cy + oy;
      if (!params.wrap && (x < 0 || y < 0 || x >= state.cols || y >= state.rows)) {
        continue;
      }
      const idx = indexAt(x, y, state.cols);
      state.current[idx] = 1;
      state.age[idx] = Math.max(1, state.age[idx]);
    }
  }
};

const resolveLayout = (ctx: EffectRenderContext, cellSize: number, safeFit: boolean) => {
  const safe = safeFit && ctx.safeRect ? ctx.safeRect : { x: 0, y: 0, w: ctx.width, h: ctx.height };
  const usableW = Math.max(cellSize * 8, safe.w);
  const usableH = Math.max(cellSize * 8, safe.h);
  const cols = clamp(Math.floor(usableW / cellSize), 8, 320);
  const rows = clamp(Math.floor(usableH / cellSize), 8, 320);
  const drawW = cols * cellSize;
  const drawH = rows * cellSize;
  const drawX = safe.x + (safe.w - drawW) * 0.5;
  const drawY = safe.y + (safe.h - drawH) * 0.5;
  return { cols, rows, drawW, drawH, drawX, drawY };
};

export class GameOfLifeEffect implements Effect {
  private state: GameOfLifeState | null = null;

  reset(): void {
    this.state = null;
  }

  private rebuildState(layout: ReturnType<typeof resolveLayout>, params: GameOfLifeParams, time: number): GameOfLifeState {
    const cells = layout.cols * layout.rows;
    const current = new Uint8Array(cells);
    const next = new Uint8Array(cells);
    const age = new Uint16Array(cells);
    const trail = new Float32Array(cells);
    const seededValue = params.seed ?? Math.floor(time * 1000);
    const rng = createSeededRng(seededValue);

    seedInitialGrid(current, age, layout.cols, layout.rows, params, rng);

    for (let i = 0; i < cells; i += 1) {
      trail[i] = current[i];
    }

    return {
      cols: layout.cols,
      rows: layout.rows,
      drawX: layout.drawX,
      drawY: layout.drawY,
      drawW: layout.drawW,
      drawH: layout.drawH,
      cellSize: params.cellSize,
      current,
      next,
      age,
      trail,
      accumulator: 0,
      tickCount: 0,
      rngState: seededValue,
      anchorTime: time,
      lastTime: time,
      reseedKey: buildReseedKey(params, layout.cols, layout.rows),
      seededValue
    };
  }

  render(context: EffectRenderContext): void {
    const params = resolveGameOfLifeParams(context.params as Record<string, unknown>);
    const layout = resolveLayout(context, params.cellSize, params.safeFit);
    const reseedKey = buildReseedKey(params, layout.cols, layout.rows);

    if (!this.state || this.state.reseedKey !== reseedKey) {
      this.state = this.rebuildState(layout, params, context.time);
    }

    const state = this.state;
    state.drawX = layout.drawX;
    state.drawY = layout.drawY;
    state.drawW = layout.drawW;
    state.drawH = layout.drawH;

    const stepInterval = 1 / params.stepRate;
    const deltaTime = Math.max(0, context.time - state.lastTime);
    const jumped = context.time < state.lastTime || deltaTime > REANCHOR_GAP_SECONDS;

    if (jumped) {
      state.anchorTime = context.time;
      state.lastTime = context.time;
      state.accumulator = 0;
      const rebuilt = this.rebuildState(layout, params, context.time);
      this.state = rebuilt;
      const localElapsed = Math.max(0, context.time - rebuilt.anchorTime);
      const ticksToCatchUp = Math.min(RESEED_REBUILD_MAX_TICKS, Math.floor(localElapsed / stepInterval));
      for (let i = 0; i < ticksToCatchUp; i += 1) {
        stepSimulation(rebuilt.current, rebuilt.next, rebuilt.age, rebuilt.trail, rebuilt.cols, rebuilt.rows, params.wrap, params.fadeTrails);
        rebuilt.tickCount += 1;
      }
    }

    const liveState = this.state as GameOfLifeState;
    const beatStrength = readBeatStrength(context.audio);
    const effectiveDelta = clamp(context.delta > 0 ? context.delta : context.time - liveState.lastTime, 0, 0.25);
    liveState.lastTime = context.time;
    liveState.accumulator += effectiveDelta;

    let stepped = 0;
    while (liveState.accumulator >= stepInterval && stepped < MAX_STEPS_PER_FRAME) {
      liveState.accumulator -= stepInterval;
      const beatBucket = Math.floor((context.time + liveState.tickCount * 0.13) * 8);
      maybeInjectBurst(liveState, params, beatStrength, beatBucket);
      maybeInjectGlider(liveState, params, beatStrength * 0.18, beatBucket + 17);
      stepSimulation(liveState.current, liveState.next, liveState.age, liveState.trail, liveState.cols, liveState.rows, params.wrap, params.fadeTrails);
      liveState.tickCount += 1;
      stepped += 1;
    }

    const palette = resolvePalette(params.paletteMode, context.era);
    const pulse = clamp(beatStrength * 0.4, 0, 0.5);
    const bgAlpha = clamp(0.95 - pulse * 0.15, 0.75, 0.97);

    const { ctx } = context;
    ctx.save();
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, context.width, context.height);

    if (params.fadeTrails > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${bgAlpha})`;
      ctx.fillRect(liveState.drawX, liveState.drawY, liveState.drawW, liveState.drawH);
    }

    const baseSize = Math.max(1, Math.floor(liveState.cellSize));

    for (let y = 0; y < liveState.rows; y += 1) {
      for (let x = 0; x < liveState.cols; x += 1) {
        const idx = indexAt(x, y, liveState.cols);
        const alive = liveState.current[idx] === 1;
        const trailValue = liveState.trail[idx];

        if (!alive && trailValue < 0.02) {
          continue;
        }

        const px = liveState.drawX + x * liveState.cellSize;
        const py = liveState.drawY + y * liveState.cellSize;

        if (alive) {
          const age = liveState.age[idx];
          const survivorMix = clamp((age - 1) / 8, 0, 1) * params.survivalTint;
          const lightnessBoost = pulse * 0.2;
          const color = age <= 1 ? palette.newborn : palette.survivor;
          ctx.fillStyle = color;
          ctx.globalAlpha = clamp(0.72 + survivorMix * 0.24 + lightnessBoost, 0.45, 1);
          ctx.fillRect(px, py, baseSize, baseSize);
        } else {
          ctx.fillStyle = palette.trail;
          ctx.globalAlpha = clamp(trailValue * (0.65 + pulse * 0.4), 0, 0.7);
          ctx.fillRect(px, py, baseSize, baseSize);
        }
      }
    }

    ctx.globalAlpha = 1;
    if (params.gridLines) {
      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= liveState.cols; x += 1) {
        const px = liveState.drawX + x * liveState.cellSize + 0.5;
        ctx.moveTo(px, liveState.drawY);
        ctx.lineTo(px, liveState.drawY + liveState.drawH);
      }
      for (let y = 0; y <= liveState.rows; y += 1) {
        const py = liveState.drawY + y * liveState.cellSize + 0.5;
        ctx.moveTo(liveState.drawX, py);
        ctx.lineTo(liveState.drawX + liveState.drawW, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}
