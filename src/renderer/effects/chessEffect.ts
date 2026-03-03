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

const pieceSilhouetteCache: Partial<Record<Lowercase<PieceCode>, Path2D>> = {};

function getPieceSilhouette(kind: Lowercase<PieceCode>): Path2D {
  const cached = pieceSilhouetteCache[kind];
  if (cached) {
    return cached;
  }

  const path = new Path2D();
  switch (kind) {
    case "p": {
      path.arc(0, -0.34, 0.16, 0, Math.PI * 2);
      path.moveTo(-0.11, -0.2);
      path.bezierCurveTo(-0.16, -0.12, -0.15, 0.05, -0.1, 0.2);
      path.lineTo(0.1, 0.2);
      path.bezierCurveTo(0.15, 0.05, 0.16, -0.12, 0.11, -0.2);
      path.closePath();
      break;
    }
    case "r": {
      path.moveTo(-0.2, 0.2);
      path.lineTo(-0.18, -0.34);
      path.lineTo(0.18, -0.34);
      path.lineTo(0.2, 0.2);
      path.closePath();

      path.rect(-0.24, -0.48, 0.09, 0.1);
      path.rect(-0.1, -0.48, 0.09, 0.1);
      path.rect(0.04, -0.48, 0.09, 0.1);
      path.rect(0.18, -0.48, 0.09, 0.1);
      break;
    }
    case "n": {
      path.moveTo(-0.21, 0.22);
      path.bezierCurveTo(-0.22, 0.04, -0.2, -0.15, -0.14, -0.34);
      path.bezierCurveTo(-0.08, -0.56, 0.12, -0.62, 0.22, -0.49);
      path.bezierCurveTo(0.13, -0.48, 0.04, -0.42, 0, -0.3);
      path.bezierCurveTo(0.09, -0.26, 0.18, -0.18, 0.21, -0.04);
      path.bezierCurveTo(0.16, 0.03, 0.1, 0.08, 0.03, 0.14);
      path.lineTo(0.16, 0.22);
      path.closePath();
      break;
    }
    case "b": {
      path.moveTo(-0.15, 0.2);
      path.bezierCurveTo(-0.16, 0.02, -0.1, -0.16, -0.03, -0.26);
      path.bezierCurveTo(-0.18, -0.34, -0.17, -0.58, 0, -0.62);
      path.bezierCurveTo(0.17, -0.58, 0.18, -0.34, 0.03, -0.26);
      path.bezierCurveTo(0.1, -0.16, 0.16, 0.02, 0.15, 0.2);
      path.closePath();
      break;
    }
    case "q": {
      path.moveTo(-0.22, 0.2);
      path.bezierCurveTo(-0.2, -0.04, -0.16, -0.24, -0.12, -0.36);
      path.lineTo(0.12, -0.36);
      path.bezierCurveTo(0.16, -0.24, 0.2, -0.04, 0.22, 0.2);
      path.closePath();

      path.moveTo(-0.2, -0.35);
      path.lineTo(-0.12, -0.52);
      path.lineTo(-0.02, -0.37);
      path.lineTo(0, -0.56);
      path.lineTo(0.02, -0.37);
      path.lineTo(0.12, -0.52);
      path.lineTo(0.2, -0.35);
      path.closePath();
      break;
    }
    case "k": {
      path.moveTo(-0.23, 0.2);
      path.bezierCurveTo(-0.22, -0.05, -0.16, -0.25, -0.1, -0.35);
      path.lineTo(0.1, -0.35);
      path.bezierCurveTo(0.16, -0.25, 0.22, -0.05, 0.23, 0.2);
      path.closePath();

      path.rect(-0.18, -0.43, 0.36, 0.08);
      break;
    }
    default:
      break;
  }

  pieceSilhouetteCache[kind] = path;
  return path;
}

function drawBase(ctx: CanvasRenderingContext2D, radius: number, fill: string, stroke: string): void {
  const rim = new Path2D();
  rim.arc(0, 0.23, radius, 0, Math.PI * 2);

  const baseGradient = ctx.createRadialGradient(-radius * 0.35, 0.16, radius * 0.2, 0, 0.23, radius);
  baseGradient.addColorStop(0, fill);
  baseGradient.addColorStop(1, stroke);
  ctx.fillStyle = baseGradient;
  ctx.fill(rim);
  ctx.stroke(rim);

  ctx.globalAlpha = 0.24;
  ctx.beginPath();
  ctx.arc(-radius * 0.2, 0.18, radius * 0.62, Math.PI * 0.9, Math.PI * 1.9);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function drawPiece(ctx: CanvasRenderingContext2D, piece: PieceCode, x: number, y: number, size: number): void {
  const isWhite = piece === piece.toUpperCase();
  const fill = isWhite ? "#f6f2e8" : "#1b1b1b";
  const stroke = isWhite ? "#1b1b1b" : "#f6f2e8";
  const pieceHeight = size * 0.9;
  const baseRadius = size * 0.325;
  const pieceScale = pieceHeight;

  ctx.save();
  ctx.translate(x, y + size * 0.18);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1.2, size * 0.045);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.globalAlpha = 0.2;
  ctx.fillStyle = stroke;
  ctx.beginPath();
  ctx.ellipse(0.02 * size, baseRadius * 1.15, baseRadius * 0.92, baseRadius * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  drawBase(ctx, baseRadius, fill, stroke);

  const silhouette = getPieceSilhouette(piece.toLowerCase());
  const bodyGradient = ctx.createRadialGradient(
    -pieceScale * 0.16,
    -pieceScale * 0.52,
    pieceScale * 0.05,
    0,
    -pieceScale * 0.12,
    pieceScale * 0.7
  );
  bodyGradient.addColorStop(0, fill);
  bodyGradient.addColorStop(1, stroke);
  ctx.fillStyle = bodyGradient;

  ctx.save();
  ctx.scale(pieceScale, pieceScale);
  ctx.fill(silhouette);
  ctx.stroke(silhouette);

  if (piece.toLowerCase() === "n") {
    const eye = new Path2D();
    eye.arc(0.09, -0.36, 0.03, 0, Math.PI * 2);
    ctx.fillStyle = stroke;
    ctx.fill(eye);
  }

  if (piece.toLowerCase() === "b") {
    const slit = new Path2D();
    slit.moveTo(-0.02, -0.48);
    slit.lineTo(0.07, -0.36);
    slit.lineTo(0.03, -0.33);
    slit.lineTo(-0.05, -0.45);
    slit.closePath();
    ctx.fillStyle = stroke;
    ctx.fill(slit);
  }

  if (piece.toLowerCase() === "q") {
    const bead = new Path2D();
    [-0.2, -0.1, 0, 0.1, 0.2].forEach((px) => {
      bead.moveTo(px + 0.03, -0.52);
      bead.arc(px, -0.52, 0.03, 0, Math.PI * 2);
    });
    ctx.fillStyle = fill;
    ctx.fill(bead);
    ctx.stroke(bead);
  }

  if (piece.toLowerCase() === "k") {
    const cross = new Path2D();
    cross.rect(-0.02, -0.62, 0.04, 0.18);
    cross.rect(-0.09, -0.56, 0.18, 0.04);
    ctx.fillStyle = fill;
    ctx.fill(cross);
    ctx.stroke(cross);
  }
  ctx.restore();

  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(0, -pieceHeight * 0.26, pieceHeight * 0.12, Math.PI * 0.2, Math.PI * 0.9);
  ctx.stroke();
  ctx.globalAlpha = 1;

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
