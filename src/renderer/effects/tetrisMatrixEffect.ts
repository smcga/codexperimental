import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const TETRIS_MATRIX_DEFAULTS = {
  speed: 1,
  level: 8,
  glow: 0.78,
  contrast: 0.88,
  ghost: 1,
  seed: 1989
};

export const TETRIS_BOARD_WIDTH = 10;
export const TETRIS_BOARD_HEIGHT = 20;
const SPAWN_Y = -2;
const PREVIEW_COUNT = 3;
const SCREEN_PADDING_CELLS = 0.6;
const PANEL_GAP_CELLS = 0.8;
const LEFT_PANEL_CELLS = 3.6;
const RIGHT_PANEL_CELLS = 3.9;

export type Pentomino = "F" | "I" | "L" | "P" | "N" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";

export type TetrisPlacement = {
  rotation: number;
  x: number;
  y: number;
  score: number;
  clearedLines: number;
  piece: Pentomino;
  dropMode?: "normal" | "quick" | "hesitate";
  hesitation?: number;
};

export type TetrisResolvedParams = {
  speed: number;
  level: number;
  glow: number;
  contrast: number;
  ghost: number;
  seed: number;
};

type CellValue = 0 | 1 | 2 | 3 | 4;

type CachedState = {
  board: CellValue[];
  placements: TetrisPlacement[];
  score: number;
  lines: number;
  pieceCount: number;
  bag: Pentomino[];
};

const SHADE_ORDER: CellValue[] = [4, 3, 2, 1, 2, 3, 4, 3, 2, 1, 2, 3];
const GAMEBOY_PALETTE = {
  shell: "#8bac0f",
  shellDark: "#556b2f",
  screenBorder: "#2f4a21",
  bezel: "#9bbc0f",
  bg: "#0f1f0f",
  low: "#1f3a1c",
  mid: "#3f6b2f",
  high: "#77a834",
  bright: "#b7d25c",
  glare: "rgba(214, 244, 125, 0.12)",
  ghost: "rgba(183, 210, 92, 0.18)",
  grid: "rgba(15, 31, 15, 0.16)",
  scanline: "rgba(15, 31, 15, 0.12)",
  text: "#1f3a1c"
} as const;

export const PIECE_SEQUENCE: Pentomino[] = ["F", "I", "L", "P", "N", "T", "U", "V", "W", "X", "Y", "Z"];

type ShapePoint = [number, number];
type RotationSet = Array<Array<[number, number]>>;

const BASE_PENTOMINOES: Record<Pentomino, ShapePoint[]> = {
  F: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 2]],
  I: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  L: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]],
  P: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]],
  N: [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3]],
  T: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]],
  U: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
  V: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
  W: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]],
  X: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
  Y: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]]
};

const normalizeCells = (cells: ShapePoint[]): ShapePoint[] => {
  const minX = Math.min(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  return cells
    .map(([x, y]) => [x - minX, y - minY] as ShapePoint)
    .sort(([ax, ay], [bx, by]) => (ax === bx ? ay - by : ax - bx));
};

const rotate90 = (cells: ShapePoint[]): ShapePoint[] => {
  const maxY = Math.max(...cells.map(([, y]) => y));
  return cells.map(([x, y]) => [maxY - y, x]);
};

const reflectHorizontally = (cells: ShapePoint[]): ShapePoint[] => {
  const maxX = Math.max(...cells.map(([x]) => x));
  return cells.map(([x, y]) => [maxX - x, y]);
};

const encodeCells = (cells: ShapePoint[]): string => cells.map(([x, y]) => `${x},${y}`).join("|");

const buildUniqueRotations = (base: ShapePoint[]): RotationSet => {
  const variants: ShapePoint[][] = [];
  let current = normalizeCells(base);
  for (let i = 0; i < 4; i += 1) {
    variants.push(current);
    variants.push(normalizeCells(reflectHorizontally(current)));
    current = normalizeCells(rotate90(current));
  }

  const unique = new Map<string, ShapePoint[]>();
  variants.forEach((variant) => {
    unique.set(encodeCells(variant), variant);
  });
  return [...unique.values()];
};

const PENTOMINO_ROTATIONS: Record<Pentomino, RotationSet> = {
  F: buildUniqueRotations(BASE_PENTOMINOES.F),
  I: buildUniqueRotations(BASE_PENTOMINOES.I),
  L: buildUniqueRotations(BASE_PENTOMINOES.L),
  P: buildUniqueRotations(BASE_PENTOMINOES.P),
  N: buildUniqueRotations(BASE_PENTOMINOES.N),
  T: buildUniqueRotations(BASE_PENTOMINOES.T),
  U: buildUniqueRotations(BASE_PENTOMINOES.U),
  V: buildUniqueRotations(BASE_PENTOMINOES.V),
  W: buildUniqueRotations(BASE_PENTOMINOES.W),
  X: buildUniqueRotations(BASE_PENTOMINOES.X),
  Y: buildUniqueRotations(BASE_PENTOMINOES.Y),
  Z: buildUniqueRotations(BASE_PENTOMINOES.Z)
};

const asFinite = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const hash = (value: number, seed: number): number => {
  const n = Math.sin(value * 12.9898 + seed * 78.233) * 43758.5453123;
  return n - Math.floor(n);
};

export const resolveTetrisMatrixParams = (params: Record<string, number>): TetrisResolvedParams => ({
  speed: clamp(asFinite(params.speed, TETRIS_MATRIX_DEFAULTS.speed), 0.35, 3),
  level: clamp(Math.round(asFinite(params.level, TETRIS_MATRIX_DEFAULTS.level)), 1, 20),
  glow: clamp(asFinite(params.glow, TETRIS_MATRIX_DEFAULTS.glow), 0, 1.5),
  contrast: clamp(asFinite(params.contrast, TETRIS_MATRIX_DEFAULTS.contrast), 0.35, 1.3),
  ghost: clamp(asFinite(params.ghost, TETRIS_MATRIX_DEFAULTS.ghost), 0, 1),
  seed: Math.abs(Math.round(asFinite(params.seed, TETRIS_MATRIX_DEFAULTS.seed)))
});

export const createEmptyBoard = (): CellValue[] => new Array(TETRIS_BOARD_WIDTH * TETRIS_BOARD_HEIGHT).fill(0) as CellValue[];

const boardIndex = (x: number, y: number): number => y * TETRIS_BOARD_WIDTH + x;

type TetrisLayout = {
  cellSize: number;
  boardLeft: number;
  boardTop: number;
  boardWidthPx: number;
  boardHeightPx: number;
  boardRight: number;
  leftPanelX: number;
  leftPanelY: number;
  leftPanelW: number;
  leftPanelH: number;
  rightPanelX: number;
  rightPanelY: number;
  rightPanelW: number;
  rightPanelH: number;
  screenX: number;
  screenY: number;
  screenW: number;
  screenH: number;
};

export const computeTetrisLayout = (width: number, height: number): TetrisLayout => {
  const maxCellByHeight = Math.floor(height * 0.72 / TETRIS_BOARD_HEIGHT);
  const maxCellByWidth = Math.floor(width / (TETRIS_BOARD_WIDTH + LEFT_PANEL_CELLS + RIGHT_PANEL_CELLS + PANEL_GAP_CELLS * 2 + SCREEN_PADDING_CELLS * 2));
  const cellSize = Math.max(4, Math.min(maxCellByHeight, maxCellByWidth));

  const boardWidthPx = cellSize * TETRIS_BOARD_WIDTH;
  const boardHeightPx = cellSize * TETRIS_BOARD_HEIGHT;
  const leftPanelW = cellSize * LEFT_PANEL_CELLS;
  const rightPanelW = cellSize * RIGHT_PANEL_CELLS;
  const panelGap = cellSize * PANEL_GAP_CELLS;
  const screenPadding = cellSize * SCREEN_PADDING_CELLS;
  const screenW = leftPanelW + panelGap + boardWidthPx + panelGap + rightPanelW + screenPadding * 2;
  const screenH = boardHeightPx + screenPadding * 2;
  const screenX = Math.round((width - screenW) * 0.5);
  const screenY = Math.round((height - screenH) * 0.5);
  const boardLeft = screenX + screenPadding + leftPanelW + panelGap;
  const boardTop = screenY + screenPadding;
  const boardRight = boardLeft + boardWidthPx;
  const leftPanelX = screenX + screenPadding;
  const leftPanelY = screenY + screenPadding;
  const rightPanelX = boardRight + panelGap;
  const rightPanelY = leftPanelY;

  return {
    cellSize,
    boardLeft,
    boardTop,
    boardWidthPx,
    boardHeightPx,
    boardRight,
    leftPanelX,
    leftPanelY,
    leftPanelW,
    leftPanelH: boardHeightPx,
    rightPanelX,
    rightPanelY,
    rightPanelW,
    rightPanelH: boardHeightPx,
    screenX,
    screenY,
    screenW,
    screenH
  };
};

export const getPieceCells = (piece: Pentomino, rotation: number): Array<[number, number]> => {
  const rotations = PENTOMINO_ROTATIONS[piece];
  return rotations[((rotation % rotations.length) + rotations.length) % rotations.length] ?? rotations[0] ?? [];
};

export const collides = (board: CellValue[], piece: Pentomino, rotation: number, offsetX: number, offsetY: number): boolean =>
  getPieceCells(piece, rotation).some(([x, y]) => {
    const boardX = offsetX + x;
    const boardY = offsetY + y;
    if (boardX < 0 || boardX >= TETRIS_BOARD_WIDTH || boardY >= TETRIS_BOARD_HEIGHT) {
      return true;
    }
    if (boardY < 0) {
      return false;
    }
    return board[boardIndex(boardX, boardY)] !== 0;
  });

export const findDropY = (board: CellValue[], piece: Pentomino, rotation: number, offsetX: number): number => {
  let y = SPAWN_Y;
  while (!collides(board, piece, rotation, offsetX, y + 1)) {
    y += 1;
  }
  return y;
};

export const applyPlacement = (board: CellValue[], placement: TetrisPlacement): { board: CellValue[]; clearedLines: number } => {
  const nextBoard = board.slice() as CellValue[];
  const shade = SHADE_ORDER[PIECE_SEQUENCE.indexOf(placement.piece)] ?? 3;
  getPieceCells(placement.piece, placement.rotation).forEach(([x, y]) => {
    const boardX = placement.x + x;
    const boardY = placement.y + y;
    if (boardX < 0 || boardX >= TETRIS_BOARD_WIDTH || boardY < 0 || boardY >= TETRIS_BOARD_HEIGHT) {
      return;
    }
    nextBoard[boardIndex(boardX, boardY)] = shade;
  });

  let clearedLines = 0;
  for (let y = TETRIS_BOARD_HEIGHT - 1; y >= 0; y -= 1) {
    let filled = true;
    for (let x = 0; x < TETRIS_BOARD_WIDTH; x += 1) {
      if (nextBoard[boardIndex(x, y)] === 0) {
        filled = false;
        break;
      }
    }
    if (!filled) {
      continue;
    }
    clearedLines += 1;
    for (let row = y; row > 0; row -= 1) {
      for (let x = 0; x < TETRIS_BOARD_WIDTH; x += 1) {
        nextBoard[boardIndex(x, row)] = nextBoard[boardIndex(x, row - 1)];
      }
    }
    for (let x = 0; x < TETRIS_BOARD_WIDTH; x += 1) {
      nextBoard[boardIndex(x, 0)] = 0;
    }
    y += 1;
  }

  return { board: nextBoard, clearedLines };
};

const computeColumnHeights = (board: CellValue[]): number[] => {
  const heights: number[] = [];
  for (let x = 0; x < TETRIS_BOARD_WIDTH; x += 1) {
    let height = 0;
    for (let y = 0; y < TETRIS_BOARD_HEIGHT; y += 1) {
      if (board[boardIndex(x, y)] !== 0) {
        height = TETRIS_BOARD_HEIGHT - y;
        break;
      }
    }
    heights.push(height);
  }
  return heights;
};

export const countBoardHoles = (board: CellValue[]): number => {
  let holes = 0;
  for (let x = 0; x < TETRIS_BOARD_WIDTH; x += 1) {
    let seenFilled = false;
    for (let y = 0; y < TETRIS_BOARD_HEIGHT; y += 1) {
      const cell = board[boardIndex(x, y)];
      if (cell !== 0) {
        seenFilled = true;
      } else if (seenFilled) {
        holes += 1;
      }
    }
  }
  return holes;
};

const countWellDepth = (heights: number[]): number => {
  let wells = 0;
  for (let x = 0; x < heights.length; x += 1) {
    const left = x === 0 ? heights[x + 1] ?? heights[x] : heights[x - 1];
    const right = x === heights.length - 1 ? heights[x - 1] ?? heights[x] : heights[x + 1];
    const minEdge = Math.min(left, right);
    if (minEdge > heights[x]) {
      wells += minEdge - heights[x];
    }
  }
  return wells;
};

export const choosePlacement = (board: CellValue[], piece: Pentomino, seed: number, pieceIndex: number): TetrisPlacement => {
  const rotations = PENTOMINO_ROTATIONS[piece];
  const candidates: TetrisPlacement[] = [];

  rotations.forEach((_, rotation) => {
    const cells = getPieceCells(piece, rotation);
    const minX = Math.min(...cells.map(([x]) => x));
    const maxX = Math.max(...cells.map(([x]) => x));

    for (let x = -minX; x <= TETRIS_BOARD_WIDTH - 1 - maxX; x += 1) {
      const y = findDropY(board, piece, rotation, x);
      if (collides(board, piece, rotation, x, y)) {
        continue;
      }
      const placement: TetrisPlacement = { rotation, x, y, score: Number.NEGATIVE_INFINITY, clearedLines: 0, piece };
      const { board: placedBoard, clearedLines } = applyPlacement(board, placement);
      const heights = computeColumnHeights(placedBoard);
      const aggregateHeight = heights.reduce((sum, value) => sum + value, 0);
      const bumpiness = heights.slice(1).reduce((sum, value, index) => sum + Math.abs(value - heights[index]), 0);
      const holes = countBoardHoles(placedBoard);
      const wells = countWellDepth(heights);
      const centerBias = Math.abs(x + (maxX + minX) * 0.5 - (TETRIS_BOARD_WIDTH - 1) * 0.5);
      const randomness = hash(pieceIndex * 17 + rotation * 5 + x, seed) * 0.75;
      const score =
        clearedLines * 9.5 -
        aggregateHeight * 0.32 -
        holes * 2.8 -
        bumpiness * 0.26 -
        wells * 0.18 -
        centerBias * 0.08 +
        randomness;

      candidates.push({ ...placement, score, clearedLines });
    }
  });

  if (candidates.length === 0) {
    return { piece, rotation: 0, x: 3, y: SPAWN_Y, score: -9999, clearedLines: 0, dropMode: "normal", hesitation: 0 };
  }

  candidates.sort((a, b) => b.score - a.score || b.y - a.y || a.x - b.x);
  const best = candidates[0]!;
  const second = candidates[1];
  const confidence = Math.max(0, best.score - (second?.score ?? best.score - 2));
  const uncertain = confidence < 0.65;
  const topChoices = candidates.slice(0, uncertain ? Math.min(4, candidates.length) : Math.min(2, candidates.length));
  const pickJitter = hash(pieceIndex * 29 + seed * 0.17, seed);
  const pickIndex = uncertain ? Math.floor(pickJitter * topChoices.length) : Math.floor(pickJitter * Math.min(2, topChoices.length));
  const chosen = topChoices[Math.min(topChoices.length - 1, pickIndex)] ?? best;
  const styleRoll = hash(pieceIndex * 41 + chosen.rotation * 7 + chosen.x, seed + 11);
  const dropMode: TetrisPlacement["dropMode"] = styleRoll > 0.78 ? "quick" : styleRoll < (uncertain ? 0.42 : 0.24) ? "hesitate" : "normal";
  const hesitation = dropMode === "hesitate" ? 0.14 + hash(pieceIndex * 13 + chosen.x, seed + 3) * 0.22 : 0;

  return { ...chosen, dropMode, hesitation };
};

export const isPlacementAboveTop = (piece: Pentomino, rotation: number, y: number): boolean =>
  getPieceCells(piece, rotation).some(([, cellY]) => y + cellY < 0);

const getPieceBounds = (cells: Array<[number, number]>): { minX: number; maxX: number; minY: number; maxY: number } => ({
  minX: Math.min(...cells.map(([x]) => x)),
  maxX: Math.max(...cells.map(([x]) => x)),
  minY: Math.min(...cells.map(([, y]) => y)),
  maxY: Math.max(...cells.map(([, y]) => y))
});

const shuffleBag = (seed: number, bagIndex: number): Pentomino[] => {
  const bag = [...PIECE_SEQUENCE];
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(hash(seed * 0.13 + bagIndex * 7.1 + i * 1.7, seed + bagIndex * 13) * (i + 1));
    [bag[i], bag[swapIndex]] = [bag[swapIndex]!, bag[i]!];
  }
  return bag;
};

const getPieceAtIndex = (cache: CachedState, seed: number, index: number): Pentomino => {
  while (cache.bag.length <= index) {
    const bagIndex = Math.floor(cache.bag.length / PIECE_SEQUENCE.length);
    cache.bag.push(...shuffleBag(seed, bagIndex));
  }
  return cache.bag[index] ?? "I";
};

export class TetrisMatrixEffect implements Effect {
  private cache: CachedState = {
    board: createEmptyBoard(),
    placements: [],
    score: 0,
    lines: 0,
    pieceCount: 0,
    bag: []
  };

  private seed = TETRIS_MATRIX_DEFAULTS.seed;

  private resetSimulationState(preservePieceCount = false): void {
    this.cache.board = createEmptyBoard();
    this.cache.score = 0;
    this.cache.lines = 0;
    this.cache.placements = [];
    if (!preservePieceCount) {
      this.cache.pieceCount = 0;
    }
    this.cache.bag = [];
  }

  private ensureSimulation(pieceCount: number, seed: number): void {
    if (this.seed !== seed) {
      this.seed = seed;
      this.cache = {
        board: createEmptyBoard(),
        placements: [],
        score: 0,
        lines: 0,
        pieceCount: 0,
        bag: []
      };
    }

    while (this.cache.pieceCount < pieceCount) {
      const piece = getPieceAtIndex(this.cache, seed, this.cache.pieceCount);
      let placement = choosePlacement(this.cache.board, piece, seed, this.cache.pieceCount);

      if (isPlacementAboveTop(piece, placement.rotation, placement.y) || collides(this.cache.board, piece, placement.rotation, placement.x, placement.y)) {
        this.resetSimulationState(true);
        this.cache.pieceCount += 1;
        continue;
      }

      const result = applyPlacement(this.cache.board, placement);
      placement = { ...placement, clearedLines: result.clearedLines };
      this.cache.board = result.board;
      this.cache.placements.push(placement);
      this.cache.lines += result.clearedLines;
      this.cache.score += 40 + result.clearedLines * result.clearedLines * 110;
      this.cache.pieceCount += 1;
    }
  }

  reset(): void {
    this.seed = TETRIS_MATRIX_DEFAULTS.seed;
    this.cache = {
      board: createEmptyBoard(),
      placements: [],
      score: 0,
      lines: 0,
      pieceCount: 0,
      bag: []
    };
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const resolved = resolveTetrisMatrixParams(params);
    const secondsPerPiece = 0.95 / resolved.speed;
    const pieceFloat = Math.max(0, time) / secondsPerPiece;
    const settledCount = Math.floor(pieceFloat);
    const pieceProgress = pieceFloat - settledCount;
    this.ensureSimulation(settledCount, resolved.seed);

    const currentPiece = getPieceAtIndex(this.cache, resolved.seed, settledCount);
    const currentPlacement = choosePlacement(this.cache.board, currentPiece, resolved.seed, settledCount);
    const preview: Pentomino[] = [];
    for (let i = 1; i <= PREVIEW_COUNT; i += 1) {
      preview.push(getPieceAtIndex(this.cache, resolved.seed, settledCount + i));
    }

    const layout = computeTetrisLayout(width, height);
    const {
      cellSize,
      boardLeft,
      boardTop,
      boardWidthPx,
      boardHeightPx,
      leftPanelX,
      leftPanelY,
      leftPanelW,
      leftPanelH,
      rightPanelX,
      rightPanelY,
      rightPanelW,
      screenX,
      screenY,
      screenW,
      screenH
    } = layout;
    const beatGlow = (audio.beat ? 1 : 0) * (0.2 + (audio.beatStrength ?? 0) * 0.55);
    const rmsGlow = clamp(audio.rms ?? 0, 0, 1) * 0.18;
    const hesitation = clamp(currentPlacement.hesitation ?? 0, 0, 0.4);
    const easedProgressRaw =
      currentPlacement.dropMode === "quick"
        ? Math.pow(pieceProgress, 0.44)
        : currentPlacement.dropMode === "hesitate"
          ? pieceProgress <= hesitation
            ? 0
            : Math.pow((pieceProgress - hesitation) / Math.max(0.01, 1 - hesitation), 1.06)
          : Math.pow(pieceProgress, 0.86);
    const easedProgress = clamp(easedProgressRaw, 0, 1);
    const dropY = Math.round((SPAWN_Y + (currentPlacement.y - SPAWN_Y) * easedProgress) * cellSize);
    const lockPulse = Math.max(0, 1 - Math.abs(pieceProgress - 0.92) * 9);
    const rotateInFlight =
      currentPlacement.rotation !== 0 &&
      pieceProgress < 0.4 &&
      hash(settledCount * 5 + currentPlacement.x, resolved.seed) < 0.55;
    const renderedRotation = rotateInFlight ? 0 : currentPlacement.rotation;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, GAMEBOY_PALETTE.shell);
    bgGradient.addColorStop(1, GAMEBOY_PALETTE.shellDark);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = `rgba(255,255,255,${0.03 + beatGlow * 0.04})`;
    ctx.fillRect(width * 0.08, height * 0.08, width * 0.5, height * 0.18);

    ctx.fillStyle = GAMEBOY_PALETTE.bezel;
    ctx.fillRect(screenX, screenY, screenW, screenH);
    ctx.fillStyle = GAMEBOY_PALETTE.screenBorder;
    ctx.fillRect(screenX + cellSize * 0.45, screenY + cellSize * 0.45, screenW - cellSize * 0.9, screenH - cellSize * 0.9);
    ctx.fillStyle = GAMEBOY_PALETTE.bg;
    ctx.fillRect(boardLeft, boardTop, boardWidthPx, boardHeightPx);

    ctx.fillStyle = "rgba(15,31,15,0.55)";
    ctx.fillRect(leftPanelX, leftPanelY, leftPanelW, leftPanelH);
    ctx.fillRect(rightPanelX, rightPanelY, rightPanelW, leftPanelH);

    const screenGlow = clamp(resolved.glow + beatGlow + rmsGlow, 0, 1.6);
    ctx.fillStyle = `rgba(183, 210, 92, ${0.05 + screenGlow * 0.08})`;
    ctx.fillRect(boardLeft, boardTop, boardWidthPx, boardHeightPx);

    for (let y = 0; y < TETRIS_BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < TETRIS_BOARD_WIDTH; x += 1) {
        const cell = this.cache.board[boardIndex(x, y)] ?? 0;
        const px = boardLeft + x * cellSize;
        const py = boardTop + y * cellSize;

        ctx.fillStyle = GAMEBOY_PALETTE.grid;
        ctx.fillRect(px, py, cellSize - 1, cellSize - 1);

        if (cell === 0) {
          continue;
        }

        const shade = [GAMEBOY_PALETTE.low, GAMEBOY_PALETTE.mid, GAMEBOY_PALETTE.high, GAMEBOY_PALETTE.bright][cell - 1] ?? GAMEBOY_PALETTE.high;
        ctx.fillStyle = shade;
        ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
        ctx.fillStyle = `rgba(255,255,255,${0.05 * resolved.contrast})`;
        ctx.fillRect(px + 1, py + 1, cellSize - 3, Math.max(1, Math.floor(cellSize * 0.16)));
      }
    }

    const ghostY = currentPlacement.y;
    if (resolved.ghost > 0.01) {
      ctx.fillStyle = GAMEBOY_PALETTE.ghost;
      getPieceCells(currentPiece, currentPlacement.rotation).forEach(([x, y]) => {
        const px = boardLeft + (currentPlacement.x + x) * cellSize;
        const py = boardTop + (ghostY + y) * cellSize;
        if (py < boardTop) {
          return;
        }
        ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
      });
    }

    const activeShade = lockPulse > 0.15 ? GAMEBOY_PALETTE.bright : GAMEBOY_PALETTE.high;
    getPieceCells(currentPiece, renderedRotation).forEach(([x, y]) => {
      const px = boardLeft + (currentPlacement.x + x) * cellSize;
      const py = boardTop + dropY + y * cellSize;
      if (py < boardTop - cellSize || py > boardTop + boardHeightPx) {
        return;
      }
      ctx.fillStyle = activeShade;
      ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
      ctx.fillStyle = GAMEBOY_PALETTE.low;
      ctx.fillRect(px + Math.floor(cellSize * 0.18), py + Math.floor(cellSize * 0.18), cellSize * 0.22, cellSize * 0.22);
    });

    ctx.fillStyle = GAMEBOY_PALETTE.text;
    ctx.font = `${Math.max(9, Math.floor(cellSize * 0.9))}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const hudX = leftPanelX + cellSize * 0.35;
    ctx.fillText("SCORE", hudX, leftPanelY + cellSize * 0.55);
    ctx.fillText(String(this.cache.score).padStart(5, "0"), hudX, leftPanelY + cellSize * 1.45);
    ctx.fillText("LINES", hudX, leftPanelY + cellSize * 2.8);
    ctx.fillText(String(this.cache.lines).padStart(3, "0"), hudX, leftPanelY + cellSize * 3.7);
    ctx.fillText(`LV ${String(resolved.level).padStart(2, "0")}`, hudX, leftPanelY + cellSize * 5.05);

    const previewX = rightPanelX + cellSize * 0.45;
    ctx.fillText("NEXT", previewX, rightPanelY + cellSize * 0.55);
    preview.forEach((piece, previewIndex) => {
      const previewY = rightPanelY + cellSize * (1.7 + previewIndex * 4.05);
      const previewCells = getPieceCells(piece, 0);
      const bounds = getPieceBounds(previewCells);
      const previewScale = cellSize * 0.5;
      const previewW = (bounds.maxX - bounds.minX + 1) * previewScale;
      const centredX = previewX + (rightPanelW - cellSize * 0.9 - previewW) * 0.5;
      previewCells.forEach(([x, y]) => {
        ctx.fillStyle = previewIndex === 0 ? GAMEBOY_PALETTE.high : GAMEBOY_PALETTE.mid;
        ctx.fillRect(
          centredX + (x - bounds.minX) * previewScale,
          previewY + (y - bounds.minY) * previewScale,
          cellSize * 0.42,
          cellSize * 0.42
        );
      });
    });

    ctx.textAlign = "center";
    ctx.fillText("DOT MATRIX", width * 0.5, screenY + screenH + cellSize * 0.75);
    ctx.fillText("8-BIT STACK", width * 0.5, screenY + screenH + cellSize * 1.65);

    ctx.fillStyle = GAMEBOY_PALETTE.glare;
    ctx.fillRect(screenX + cellSize * 0.9, screenY + cellSize * 0.7, screenW * 0.28, screenH * 0.14);

    for (let y = 0; y < height; y += 3) {
      ctx.fillStyle = GAMEBOY_PALETTE.scanline;
      ctx.fillRect(0, y, width, 1);
    }

    ctx.restore();
  }
}
