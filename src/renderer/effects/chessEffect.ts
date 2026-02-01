import { Effect, EffectRenderContext } from "./types";

type ChessColor = "white" | "black";

type ChessPiece = {
  id: string;
  type: "K" | "Q" | "R" | "B" | "N" | "P";
  color: ChessColor;
  file: number;
  rank: number;
};

type Position = {
  file: number;
  rank: number;
};

type ChessMove = {
  notation: string;
  from: Position;
  to: Position;
  capture?: Position;
  promotion?: ChessPiece["type"];
  extras?: Array<{ from: Position; to: Position }>;
};

const basePieces: ChessPiece[] = [
  { id: "wK", type: "K", color: "white", file: 4, rank: 0 },
  { id: "wQ", type: "Q", color: "white", file: 3, rank: 0 },
  { id: "wR1", type: "R", color: "white", file: 0, rank: 0 },
  { id: "wR2", type: "R", color: "white", file: 7, rank: 0 },
  { id: "wB1", type: "B", color: "white", file: 2, rank: 0 },
  { id: "wB2", type: "B", color: "white", file: 5, rank: 0 },
  { id: "wN1", type: "N", color: "white", file: 1, rank: 0 },
  { id: "wN2", type: "N", color: "white", file: 6, rank: 0 },
  ...Array.from({ length: 8 }, (_value, index) => ({
    id: `wP${index + 1}`,
    type: "P" as const,
    color: "white" as const,
    file: index,
    rank: 1
  })),
  { id: "bK", type: "K", color: "black", file: 4, rank: 7 },
  { id: "bQ", type: "Q", color: "black", file: 3, rank: 7 },
  { id: "bR1", type: "R", color: "black", file: 0, rank: 7 },
  { id: "bR2", type: "R", color: "black", file: 7, rank: 7 },
  { id: "bB1", type: "B", color: "black", file: 2, rank: 7 },
  { id: "bB2", type: "B", color: "black", file: 5, rank: 7 },
  { id: "bN1", type: "N", color: "black", file: 1, rank: 7 },
  { id: "bN2", type: "N", color: "black", file: 6, rank: 7 },
  ...Array.from({ length: 8 }, (_value, index) => ({
    id: `bP${index + 1}`,
    type: "P" as const,
    color: "black" as const,
    file: index,
    rank: 6
  }))
];

const chessMoves: ChessMove[] = [
  { notation: "e4", from: { file: 4, rank: 1 }, to: { file: 4, rank: 3 } },
  { notation: "...c5", from: { file: 2, rank: 6 }, to: { file: 2, rank: 4 } },
  { notation: "Nf3", from: { file: 6, rank: 0 }, to: { file: 5, rank: 2 } },
  { notation: "...Nc6", from: { file: 1, rank: 7 }, to: { file: 2, rank: 5 } },
  { notation: "Bb5", from: { file: 5, rank: 0 }, to: { file: 1, rank: 4 } },
  { notation: "...a6", from: { file: 0, rank: 6 }, to: { file: 0, rank: 5 } },
  { notation: "Ba4", from: { file: 1, rank: 4 }, to: { file: 0, rank: 3 } },
  { notation: "...Nf6", from: { file: 6, rank: 7 }, to: { file: 5, rank: 5 } },
  {
    notation: "O-O",
    from: { file: 4, rank: 0 },
    to: { file: 6, rank: 0 },
    extras: [{ from: { file: 7, rank: 0 }, to: { file: 5, rank: 0 } }]
  },
  { notation: "...d6", from: { file: 3, rank: 6 }, to: { file: 3, rank: 5 } },
  { notation: "Re1", from: { file: 5, rank: 0 }, to: { file: 4, rank: 0 } },
  { notation: "...b5", from: { file: 1, rank: 6 }, to: { file: 1, rank: 4 } },
  { notation: "Bb3", from: { file: 0, rank: 3 }, to: { file: 1, rank: 2 } },
  { notation: "...Bb7", from: { file: 2, rank: 7 }, to: { file: 5, rank: 4 } },
  { notation: "c3", from: { file: 2, rank: 1 }, to: { file: 2, rank: 2 } },
  { notation: "...Be7", from: { file: 5, rank: 7 }, to: { file: 4, rank: 6 } },
  { notation: "d4", from: { file: 3, rank: 1 }, to: { file: 3, rank: 3 } },
  {
    notation: "...cxd4",
    from: { file: 2, rank: 4 },
    to: { file: 3, rank: 3 },
    capture: { file: 3, rank: 3 }
  },
  {
    notation: "cxd4",
    from: { file: 2, rank: 2 },
    to: { file: 3, rank: 3 },
    capture: { file: 3, rank: 3 }
  }
];

const fileLabels = ["a", "b", "c", "d", "e", "f", "g", "h"];

const positionKey = (pos: Position): string => `${pos.file},${pos.rank}`;

export const createPieceMap = (pieces: ChessPiece[]): Map<string, ChessPiece> =>
  new Map(pieces.map((piece) => [positionKey(piece), { ...piece }]));

export const applyMove = (pieces: Map<string, ChessPiece>, move: ChessMove): void => {
  const fromKey = positionKey(move.from);
  const movingPiece = pieces.get(fromKey);
  if (!movingPiece) {
    return;
  }

  pieces.delete(fromKey);
  if (move.capture) {
    pieces.delete(positionKey(move.capture));
  } else {
    pieces.delete(positionKey(move.to));
  }

  pieces.set(positionKey(move.to), {
    ...movingPiece,
    file: move.to.file,
    rank: move.to.rank,
    type: move.promotion ?? movingPiece.type
  });

  move.extras?.forEach((extraMove) => {
    const extraKey = positionKey(extraMove.from);
    const extraPiece = pieces.get(extraKey);
    if (!extraPiece) {
      return;
    }
    pieces.delete(extraKey);
    pieces.set(positionKey(extraMove.to), {
      ...extraPiece,
      file: extraMove.to.file,
      rank: extraMove.to.rank
    });
  });
};

const getMoveState = (time: number, speed: number) => {
  const moveDuration = 1.5 / speed;
  const moveIndex = Math.floor(time / moveDuration);
  const progress = Math.min(1, Math.max(0, time / moveDuration - moveIndex));
  const pieces = createPieceMap(basePieces);

  for (let index = 0; index < Math.min(moveIndex, chessMoves.length); index += 1) {
    applyMove(pieces, chessMoves[index]);
  }

  const currentMove = moveIndex < chessMoves.length ? chessMoves[moveIndex] : null;
  if (!currentMove) {
    return { pieces, currentMove: null, progress: 0, movingPiece: null };
  }

  const fromKey = positionKey(currentMove.from);
  const movingPiece = pieces.get(fromKey);
  if (!movingPiece) {
    return { pieces, currentMove: null, progress: 0, movingPiece: null };
  }

  pieces.delete(fromKey);
  pieces.delete(positionKey(currentMove.to));

  return { pieces, currentMove, progress, movingPiece };
};

const lerp = (start: number, end: number, progress: number) => start + (end - start) * progress;

const drawSquare = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
};

const drawPiece = (
  ctx: CanvasRenderingContext2D,
  piece: ChessPiece,
  x: number,
  y: number,
  size: number,
  glow: number,
  isMoving = false
) => {
  const radius = size * 0.32;
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);

  ctx.shadowColor = piece.color === "white" ? "rgba(255, 230, 190, 0.7)" : "rgba(40, 180, 255, 0.6)";
  ctx.shadowBlur = glow * (isMoving ? 1.4 : 1);

  ctx.fillStyle = piece.color === "white" ? "#f4e9d8" : "#1c2330";
  ctx.strokeStyle = piece.color === "white" ? "#c9b58e" : "#0b111b";
  ctx.lineWidth = size * 0.08;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = piece.color === "white" ? "#1b1b1b" : "#c9d7f1";
  ctx.font = `bold ${size * 0.42}px "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(piece.type, 0, 1);
  ctx.restore();
};

export class ChessEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const speed = params.speed ?? 1;
    const boardSize = Math.min(width, height) * 0.72;
    const squareSize = boardSize / 8;
    const boardX = (width - boardSize) / 2;
    const boardY = (height - boardSize) / 2;
    const boardPulse = 0.15 + audio.mid * 0.4;
    const glow = 8 + audio.treble * 18;

    ctx.fillStyle = "rgba(4, 6, 12, 0.65)";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(Math.sin(time * 0.35) * 0.03);
    ctx.translate(-width / 2, -height / 2);

    ctx.fillStyle = `rgba(10, 12, 20, ${0.4 + boardPulse})`;
    ctx.fillRect(boardX - squareSize * 0.3, boardY - squareSize * 0.3, boardSize + squareSize * 0.6, boardSize + squareSize * 0.6);

    for (let rank = 0; rank < 8; rank += 1) {
      for (let file = 0; file < 8; file += 1) {
        const isLight = (file + rank) % 2 === 0;
        const color = isLight ? "rgba(233, 226, 208, 0.95)" : "rgba(43, 54, 76, 0.9)";
        drawSquare(
          ctx,
          boardX + file * squareSize,
          boardY + (7 - rank) * squareSize,
          squareSize,
          color
        );
      }
    }

    const { pieces, currentMove, progress, movingPiece } = getMoveState(time, speed);

    if (currentMove) {
      const highlight = `rgba(120, 210, 255, ${0.25 + audio.treble * 0.4})`;
      const fromX = boardX + currentMove.from.file * squareSize;
      const fromY = boardY + (7 - currentMove.from.rank) * squareSize;
      const toX = boardX + currentMove.to.file * squareSize;
      const toY = boardY + (7 - currentMove.to.rank) * squareSize;
      drawSquare(ctx, fromX, fromY, squareSize, highlight);
      drawSquare(ctx, toX, toY, squareSize, highlight);
    }

    pieces.forEach((piece) => {
      const x = boardX + piece.file * squareSize;
      const y = boardY + (7 - piece.rank) * squareSize;
      drawPiece(ctx, piece, x, y, squareSize, glow);
    });

    if (currentMove && movingPiece) {
      const startX = boardX + currentMove.from.file * squareSize;
      const startY = boardY + (7 - currentMove.from.rank) * squareSize;
      const endX = boardX + currentMove.to.file * squareSize;
      const endY = boardY + (7 - currentMove.to.rank) * squareSize;
      const x = lerp(startX, endX, progress);
      const y = lerp(startY, endY, progress);
      drawPiece(ctx, movingPiece, x, y, squareSize, glow, true);
    }

    ctx.fillStyle = "rgba(10, 18, 30, 0.65)";
    ctx.fillRect(boardX, boardY + boardSize + squareSize * 0.15, boardSize, squareSize * 0.65);
    ctx.fillStyle = "#bfe9ff";
    ctx.font = `${squareSize * 0.32}px "Segoe UI", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const moveIndex = Math.min(chessMoves.length - 1, Math.floor(time / (1.5 / speed)));
    const recentMoves = chessMoves.slice(Math.max(0, moveIndex - 4), moveIndex + 1);
    const notation = recentMoves.map((move) => move.notation).join("  ");
    ctx.fillText(`Moves: ${notation}`, boardX + squareSize * 0.2, boardY + boardSize + squareSize * 0.48);

    ctx.fillStyle = "#9fb0c0";
    ctx.textAlign = "center";
    ctx.font = `${squareSize * 0.24}px "Segoe UI", sans-serif`;
    ctx.fillText(
      fileLabels.join("  "),
      boardX + boardSize / 2,
      boardY - squareSize * 0.35
    );

    ctx.restore();
  }
}
