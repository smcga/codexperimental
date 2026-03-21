import { fitSquareToSafe } from "./framingFit";
import { Effect, EffectRenderContext } from "./types";

type PieceCode = "P" | "R" | "N" | "B" | "Q" | "K" | "p" | "r" | "n" | "b" | "q" | "k";

type Board = (PieceCode | null)[][];

type Move = {
  from: string;
  to: string;
};

type ResolvedMove = {
  from: string;
  to: string;
  capture: boolean;
  captured?: PieceCode | null;
};

const BASE_MOVE_INTERVAL = 1.5;
const CAPTURE_FLASH_DURATION = 0.4;
const REANCHOR_GAP_MULTIPLIER = 4;

// Scripted moves: no castling, en passant, or promotions are modeled.
const MOVE_SCRIPT: Move[] = [
  { from: "e2", to: "e4" },
  { from: "e7", to: "e5" },
  { from: "g1", to: "f3" },
  { from: "b8", to: "c6" },
  { from: "f1", to: "c4" },
  { from: "g8", to: "f6" },
  { from: "d2", to: "d3" },
  { from: "f8", to: "c5" },
  { from: "c2", to: "c3" },
  { from: "d7", to: "d6" },
  { from: "b1", to: "d2" },
  { from: "c8", to: "g4" },
  { from: "h2", to: "h3" },
  { from: "g4", to: "h5" },
  { from: "b2", to: "b4" },
  { from: "h7", to: "h6" },
  { from: "b4", to: "c5" },
  { from: "d6", to: "c5" },
  { from: "d3", to: "d4" },
  { from: "c5", to: "d4" },
  { from: "c3", to: "d4" },
  { from: "c6", to: "d4" },
  { from: "f3", to: "d4" },
  { from: "e5", to: "d4" },
  { from: "c4", to: "f7" },
  { from: "e8", to: "f7" },
  { from: "d1", to: "b3" },
  { from: "f7", to: "f8" },
  { from: "b3", to: "b7" },
  { from: "c7", to: "c6" },
  { from: "b7", to: "b5" },
  { from: "a7", to: "a6" },
  { from: "b5", to: "b7" },
  { from: "d8", to: "d7" },
  { from: "b7", to: "d7" },
  { from: "f6", to: "d7" },
  { from: "d2", to: "f3" },
  { from: "h5", to: "f3" },
  { from: "g2", to: "f3" },
  { from: "d4", to: "d3" },
  { from: "c1", to: "f4" },
  { from: "d3", to: "d2" },
  { from: "e1", to: "d2" },
  { from: "d7", to: "f6" },
  { from: "f4", to: "h6" },
  { from: "g7", to: "h6" }
];

type AnchorState = {
  localStartTime: number;
  lastRenderTime: number;
};

const anchorState = new WeakMap<object, AnchorState>();

export function createInitialBoard(): Board {
  return [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"]
  ];
}

export function squareToCoords(square: string): { row: number; col: number } {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1] ?? "0", 10);
  return { row: 8 - rank, col: file };
}

export function applyMove(board: Board, move: Move): ResolvedMove {
  const { row: fromRow, col: fromCol } = squareToCoords(move.from);
  const { row: toRow, col: toCol } = squareToCoords(move.to);
  const piece = board[fromRow]?.[fromCol] ?? null;
  const captured = board[toRow]?.[toCol] ?? null;

  if (!piece) {
    return { ...move, capture: false, captured: null };
  }

  board[fromRow][fromCol] = null;
  board[toRow][toCol] = piece;

  return { ...move, capture: captured !== null, captured };
}

export function buildBoardAtMove(moveIndex: number): { board: Board; lastMove?: ResolvedMove } {
  const board = createInitialBoard();
  let lastMove: ResolvedMove | undefined;
  const clampedIndex = Math.max(0, Math.min(moveIndex, MOVE_SCRIPT.length));

  for (let i = 0; i < clampedIndex; i += 1) {
    const move = MOVE_SCRIPT[i];
    const resolved = applyMove(board, move);
    if (i === clampedIndex - 1) {
      lastMove = resolved;
    }
  }

  return { board, lastMove };
}

export function resolveLocalStartTime(
  anchorKey: object,
  time: number,
  moveInterval: number,
  startTime?: number
): number {
  if (typeof startTime === "number" && Number.isFinite(startTime)) {
    anchorState.set(anchorKey, { localStartTime: startTime, lastRenderTime: time });
    return startTime;
  }

  const existing = anchorState.get(anchorKey);
  if (!existing) {
    anchorState.set(anchorKey, { localStartTime: time, lastRenderTime: time });
    return time;
  }

  const timeGap = time - existing.lastRenderTime;
  if (time < existing.lastRenderTime || timeGap > moveInterval * REANCHOR_GAP_MULTIPLIER) {
    anchorState.set(anchorKey, { localStartTime: time, lastRenderTime: time });
    return time;
  }

  anchorState.set(anchorKey, { ...existing, lastRenderTime: time });
  return existing.localStartTime;
}

const piecePathCache: Partial<
  Record<Lowercase<PieceCode>, { body: Path2D; top?: Path2D; cutout?: Path2D; accent?: Path2D; full: Path2D }>
> = {};

function getPiecePaths(kind: Lowercase<PieceCode>): { body: Path2D; top?: Path2D; cutout?: Path2D; accent?: Path2D; full: Path2D } {
  const cached = piecePathCache[kind];
  if (cached) {
    return cached;
  }

  const body = new Path2D();
  let top: Path2D | undefined;
  let cutout: Path2D | undefined;
  let accent: Path2D | undefined;

  switch (kind) {
    case "p": {
      body.moveTo(-0.12, 0.08);
      body.lineTo(-0.08, -0.08);
      body.lineTo(0.08, -0.08);
      body.lineTo(0.12, 0.08);
      body.closePath();

      top = new Path2D();
      top.arc(0, -0.22, 0.095, 0, Math.PI * 2);
      break;
    }
    case "r": {
      body.moveTo(-0.17, 0.08);
      body.lineTo(-0.145, -0.28);
      body.lineTo(0.145, -0.28);
      body.lineTo(0.17, 0.08);
      body.closePath();

      top = new Path2D();
      top.moveTo(-0.18, -0.28);
      top.lineTo(-0.18, -0.38);
      top.lineTo(-0.12, -0.38);
      top.lineTo(-0.12, -0.32);
      top.lineTo(-0.04, -0.32);
      top.lineTo(-0.04, -0.38);
      top.lineTo(0.04, -0.38);
      top.lineTo(0.04, -0.32);
      top.lineTo(0.12, -0.32);
      top.lineTo(0.12, -0.38);
      top.lineTo(0.18, -0.38);
      top.lineTo(0.18, -0.28);
      top.closePath();
      break;
    }
    case "n": {
      body.moveTo(-0.17, 0.1);
      body.lineTo(-0.1, -0.08);
      body.lineTo(-0.1, -0.24);
      body.lineTo(-0.04, -0.4);
      body.lineTo(0.05, -0.47);
      body.lineTo(0.09, -0.39);
      body.lineTo(0.03, -0.33);
      body.lineTo(0.12, -0.29);
      body.lineTo(0.17, -0.2);
      body.lineTo(0.08, -0.12);
      body.lineTo(-0.01, -0.14);
      body.lineTo(0.05, -0.06);
      body.lineTo(0.02, 0.1);
      body.closePath();

      accent = new Path2D();
      accent.moveTo(-0.08, -0.34);
      accent.lineTo(-0.03, -0.43);
      accent.lineTo(0.02, -0.35);

      cutout = new Path2D();
      cutout.arc(0.04, -0.27, 0.022, 0, Math.PI * 2);
      break;
    }
    case "b": {
      body.moveTo(-0.12, 0.1);
      body.lineTo(-0.08, -0.12);
      body.bezierCurveTo(-0.06, -0.28, -0.03, -0.36, 0, -0.44);
      body.bezierCurveTo(0.03, -0.36, 0.06, -0.28, 0.08, -0.12);
      body.lineTo(0.12, 0.1);
      body.closePath();

      top = new Path2D();
      top.moveTo(-0.09, -0.38);
      top.bezierCurveTo(-0.09, -0.5, -0.03, -0.58, 0, -0.58);
      top.bezierCurveTo(0.03, -0.58, 0.09, -0.5, 0.09, -0.38);
      top.bezierCurveTo(0.09, -0.31, 0.04, -0.25, 0, -0.22);
      top.bezierCurveTo(-0.04, -0.25, -0.09, -0.31, -0.09, -0.38);
      top.closePath();

      cutout = new Path2D();
      cutout.moveTo(-0.01, -0.51);
      cutout.lineTo(0.07, -0.4);
      cutout.lineTo(0.045, -0.37);
      cutout.lineTo(-0.03, -0.48);
      cutout.closePath();
      break;
    }
    case "q": {
      body.moveTo(-0.18, 0.1);
      body.lineTo(-0.14, -0.15);
      body.lineTo(0.14, -0.15);
      body.lineTo(0.18, 0.1);
      body.closePath();

      top = new Path2D();
      top.moveTo(-0.19, -0.15);
      top.lineTo(-0.14, -0.35);
      top.lineTo(-0.08, -0.2);
      top.lineTo(-0.02, -0.39);
      top.lineTo(0, -0.2);
      top.lineTo(0.02, -0.39);
      top.lineTo(0.08, -0.2);
      top.lineTo(0.14, -0.35);
      top.lineTo(0.19, -0.15);
      top.closePath();

      accent = new Path2D();
      for (const px of [-0.14, -0.07, 0, 0.07, 0.14]) {
        accent.moveTo(px + 0.018, -0.37);
        accent.arc(px, -0.37, 0.018, 0, Math.PI * 2);
      }
      break;
    }
    case "k": {
      body.moveTo(-0.19, 0.1);
      body.lineTo(-0.15, -0.14);
      body.lineTo(0.15, -0.14);
      body.lineTo(0.19, 0.1);
      body.closePath();

      top = new Path2D();
      top.rect(-0.15, -0.3, 0.3, 0.09);

      accent = new Path2D();
      accent.rect(-0.018, -0.47, 0.036, 0.18);
      accent.rect(-0.095, -0.41, 0.19, 0.04);
      break;
    }
    default:
      break;
  }

  const full = new Path2D();
  full.addPath(body);
  if (top) {
    full.addPath(top);
  }
  if (accent) {
    full.addPath(accent);
  }

  const paths = { body, top, cutout, accent, full };
  piecePathCache[kind] = paths;
  return paths;
}

function withAlpha(hexColor: string, alpha: number): string {
  const hex = hexColor.replace("#", "");
  const value = hex.length === 3 ? hex.split("").map((part) => part + part).join("") : hex;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function drawPiece(ctx: CanvasRenderingContext2D, piece: PieceCode, x: number, y: number, size: number): void {
  const isWhite = piece === piece.toUpperCase();
  const fill = isWhite ? "#f6f2e8" : "#1b1b1b";
  const stroke = isWhite ? "#1b1b1b" : "#f6f2e8";
  const u = size;
  const lineWidth = Math.max(1.5, u * 0.05);
  const kind = piece.toLowerCase() as Lowercase<PieceCode>;

  const baseRadius = u * 0.3;
  const bodyLift = -u * 0.08;
  const pieceScale = u;

  const paths = getPiecePaths(kind);

  ctx.save();
  ctx.translate(x, y + u * 0.14);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = stroke;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.globalAlpha = 0.18;
  ctx.fillStyle = stroke;
  ctx.beginPath();
  ctx.ellipse(0, u * 0.2, baseRadius * 0.88, baseRadius * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(0, u * 0.14, baseRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.lineWidth = lineWidth * 0.72;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(-u * 0.03, u * 0.11, baseRadius * 0.73, Math.PI * 0.86, Math.PI * 1.9);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = lineWidth;

  ctx.save();
  ctx.translate(0, bodyLift);
  ctx.scale(pieceScale, pieceScale);
  ctx.fillStyle = fill;
  ctx.fill(paths.body);
  if (paths.top) {
    ctx.fill(paths.top);
  }
  if (paths.accent) {
    ctx.fill(paths.accent);
  }

  if (paths.cutout) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fill(paths.cutout);
    ctx.restore();
  }

  const highlight = ctx.createLinearGradient(-0.25, -0.58, 0.12, -0.08);
  highlight.addColorStop(0, withAlpha(isWhite ? fill : stroke, 0.2));
  highlight.addColorStop(1, withAlpha(isWhite ? fill : stroke, 0));
  ctx.save();
  ctx.clip(paths.full);
  ctx.fillStyle = highlight;
  ctx.fillRect(-0.34, -0.72, 0.68, 0.9);
  ctx.restore();

  ctx.stroke(paths.full);
  ctx.restore();

  ctx.restore();
}

export class ChessEffect implements Effect {
  render({ ctx, width, height, time, audio, params, framing, safeRect }: EffectRenderContext): void {
    const speed = typeof params.speed === "number" && params.speed > 0 ? params.speed : 1;
    const showHighlights = params.showHighlights === undefined ? true : params.showHighlights !== 0;
    const moveInterval = BASE_MOVE_INTERVAL * speed;
    const localStartTime = resolveLocalStartTime(this, time, moveInterval, params.startTime);
    const localTime = time - localStartTime;
    const moveIndex = Math.max(0, Math.floor(localTime / moveInterval));
    const { board, lastMove } = buildBoardAtMove(moveIndex);

    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, width, height);

    const preferredBoardSize = Math.min(width, height) * 0.72;
    const isMobileFit = framing?.mode === "mobileFit";
    const activeSafeRect = safeRect ?? { x: 0, y: 0, w: width, h: height };
    const boardSize = isMobileFit ? fitSquareToSafe(preferredBoardSize, activeSafeRect) : preferredBoardSize;
    const squareSize = boardSize / 8;
    const boardCenterX = isMobileFit ? activeSafeRect.x + activeSafeRect.w / 2 : width / 2;
    const boardCenterY = isMobileFit ? activeSafeRect.y + activeSafeRect.h / 2 : height / 2;
    const boardLeft = boardCenterX - boardSize / 2;
    const boardTop = boardCenterY - boardSize / 2;

    ctx.save();
    ctx.translate(boardLeft, boardTop);

    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const isLight = (row + col) % 2 === 0;
        ctx.fillStyle = isLight ? "#e6e0d0" : "#2b2f3a";
        ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
      }
    }

    if (showHighlights && lastMove) {
      const fromCoords = squareToCoords(lastMove.from);
      const toCoords = squareToCoords(lastMove.to);
      ctx.fillStyle = "rgba(255, 215, 120, 0.35)";
      ctx.fillRect(fromCoords.col * squareSize, fromCoords.row * squareSize, squareSize, squareSize);
      ctx.fillStyle = "rgba(120, 210, 255, 0.4)";
      ctx.fillRect(toCoords.col * squareSize, toCoords.row * squareSize, squareSize, squareSize);

      if (lastMove.capture) {
        const timeIntoMove = time - moveIndex * moveInterval;
        const flash = Math.max(0, 1 - timeIntoMove / CAPTURE_FLASH_DURATION);
        const intensity = flash * (0.6 + audio.beatStrength * 0.6);
        ctx.fillStyle = `rgba(255, 120, 120, ${intensity})`;
        ctx.fillRect(toCoords.col * squareSize, toCoords.row * squareSize, squareSize, squareSize);
      }
    }

    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const piece = board[row][col];
        if (!piece) {
          continue;
        }
        const centerX = col * squareSize + squareSize / 2;
        const centerY = row * squareSize + squareSize / 2;
        drawPiece(ctx, piece, centerX, centerY, squareSize);
      }
    }

    ctx.restore();

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = `${Math.max(12, squareSize * 0.25)}px "Courier New", monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`Move ${Math.min(moveIndex, MOVE_SCRIPT.length)}`, width / 2, boardTop + boardSize + squareSize * 0.8);
  }
}
