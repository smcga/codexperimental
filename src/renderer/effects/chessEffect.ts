// Self-playing chess effect with higher-contrast board highlights and more recognisable,
// silhouette-led piece drawings with clearer crowns, crosses, mitres, battlements, and horse heads.
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

type PieceFeatureTag =
  | "crown"
  | "cross"
  | "mitre"
  | "horseHead"
  | "battlements"
  | "pawnHead"
  | "tallBody";

type PieceSilhouette = {
  label: "pawn" | "rook" | "knight" | "bishop" | "queen" | "king";
  featureTags: PieceFeatureTag[];
  crownPoints: number;
  geometryScore: number;
};

type PieceDrawCommand =
  | { kind: "circle"; x: number; y: number; radius: number }
  | { kind: "rect"; x: number; y: number; width: number; height: number }
  | { kind: "polygon"; points: Array<[number, number]> }
  | { kind: "line"; from: [number, number]; to: [number, number] };

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

const withBase = (...commands: PieceDrawCommand[]): PieceDrawCommand[] => [
  { kind: "rect", x: -0.66, y: 0.49, width: 1.32, height: 0.18 },
  { kind: "rect", x: -0.5, y: 0.29, width: 1.0, height: 0.16 },
  ...commands
];

const pieceGeometryByType: Record<Lowercase<PieceCode>, PieceDrawCommand[]> = {
  p: withBase(
    { kind: "circle", x: 0, y: -0.34, radius: 0.26 },
    { kind: "rect", x: -0.16, y: -0.08, width: 0.32, height: 0.08 },
    {
      kind: "polygon",
      points: [
        [-0.18, -0.02],
        [0.18, -0.02],
        [0.3, 0.27],
        [-0.3, 0.27]
      ]
    },
    { kind: "line", from: [-0.12, 0.08], to: [0.12, 0.08] }
  ),
  r: withBase(
    { kind: "rect", x: -0.38, y: -0.34, width: 0.76, height: 0.64 },
    { kind: "rect", x: -0.48, y: -0.5, width: 0.13, height: 0.16 },
    { kind: "rect", x: -0.18, y: -0.5, width: 0.13, height: 0.16 },
    { kind: "rect", x: 0.05, y: -0.5, width: 0.13, height: 0.16 },
    { kind: "rect", x: 0.35, y: -0.5, width: 0.13, height: 0.16 },
    { kind: "line", from: [-0.24, -0.08], to: [0.24, -0.08] }
  ),
  n: withBase(
    {
      kind: "polygon",
      points: [
        [-0.4, 0.29],
        [-0.34, -0.12],
        [-0.28, -0.42],
        [-0.08, -0.58],
        [0.08, -0.48],
        [0.02, -0.34],
        [0.18, -0.22],
        [0.34, -0.04],
        [0.18, 0.08],
        [0.28, 0.29]
      ]
    },
    { kind: "polygon", points: [[-0.18, -0.54], [-0.1, -0.72], [-0.02, -0.5]] },
    { kind: "circle", x: -0.12, y: -0.33, radius: 0.04 },
    { kind: "line", from: [-0.06, -0.08], to: [0.16, 0] },
    { kind: "line", from: [-0.1, 0.06], to: [0.14, 0.16] }
  ),
  b: withBase(
    { kind: "circle", x: 0, y: -0.38, radius: 0.18 },
    {
      kind: "polygon",
      points: [
        [0, -0.62],
        [0.12, -0.5],
        [0.04, -0.3],
        [0.2, -0.14],
        [0.22, -0.04],
        [0.16, 0.27],
        [-0.16, 0.27],
        [-0.22, -0.04],
        [-0.2, -0.14],
        [-0.04, -0.3],
        [-0.12, -0.5]
      ]
    },
    { kind: "line", from: [-0.04, -0.58], to: [0.14, -0.24] },
    { kind: "line", from: [-0.16, 0.02], to: [0.16, 0.02] }
  ),
  q: withBase(
    {
      kind: "polygon",
      points: [
        [-0.42, 0.27],
        [-0.34, -0.12],
        [-0.24, -0.38],
        [-0.12, -0.18],
        [0, -0.44],
        [0.12, -0.18],
        [0.24, -0.38],
        [0.34, -0.12],
        [0.42, 0.27]
      ]
    },
    { kind: "circle", x: -0.3, y: -0.44, radius: 0.07 },
    { kind: "circle", x: -0.15, y: -0.56, radius: 0.07 },
    { kind: "circle", x: 0, y: -0.62, radius: 0.08 },
    { kind: "circle", x: 0.15, y: -0.56, radius: 0.07 },
    { kind: "circle", x: 0.3, y: -0.44, radius: 0.07 },
    { kind: "line", from: [-0.24, -0.1], to: [0.24, -0.1] }
  ),
  k: withBase(
    { kind: "rect", x: -0.2, y: -0.22, width: 0.4, height: 0.52 },
    {
      kind: "polygon",
      points: [
        [-0.34, 0.27],
        [-0.24, -0.06],
        [0.24, -0.06],
        [0.34, 0.27]
      ]
    },
    { kind: "rect", x: -0.1, y: -0.46, width: 0.2, height: 0.1 },
    { kind: "line", from: [0, -0.78], to: [0, -0.36] },
    { kind: "line", from: [-0.2, -0.58], to: [0.2, -0.58] },
    { kind: "line", from: [-0.2, -0.08], to: [0.2, -0.08] }
  )
};

const pieceSilhouettes: Record<Lowercase<PieceCode>, PieceSilhouette> = {
  p: { label: "pawn", featureTags: ["pawnHead"], crownPoints: 0, geometryScore: 4 },
  r: { label: "rook", featureTags: ["battlements", "tallBody"], crownPoints: 3, geometryScore: 6 },
  n: { label: "knight", featureTags: ["horseHead", "tallBody"], crownPoints: 0, geometryScore: 7 },
  b: { label: "bishop", featureTags: ["mitre", "tallBody"], crownPoints: 0, geometryScore: 7 },
  q: { label: "queen", featureTags: ["crown", "tallBody"], crownPoints: 3, geometryScore: 8 },
  k: { label: "king", featureTags: ["cross", "tallBody"], crownPoints: 0, geometryScore: 7 }
};

export function getPieceSilhouette(piece: PieceCode): PieceSilhouette {
  return pieceSilhouettes[piece.toLowerCase() as Lowercase<PieceCode>];
}

export function getPieceDrawCommands(piece: PieceCode): PieceDrawCommand[] {
  return pieceGeometryByType[piece.toLowerCase() as Lowercase<PieceCode>];
}

function renderCommand(ctx: CanvasRenderingContext2D, command: PieceDrawCommand, scale: number): void {
  switch (command.kind) {
    case "circle":
      ctx.beginPath();
      ctx.arc(command.x * scale, command.y * scale, command.radius * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      return;
    case "rect":
      ctx.beginPath();
      ctx.rect(command.x * scale, command.y * scale, command.width * scale, command.height * scale);
      ctx.fill();
      ctx.stroke();
      return;
    case "polygon":
      ctx.beginPath();
      command.points.forEach(([px, py], index) => {
        const x = px * scale;
        const y = py * scale;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      return;
    case "line":
      ctx.beginPath();
      ctx.moveTo(command.from[0] * scale, command.from[1] * scale);
      ctx.lineTo(command.to[0] * scale, command.to[1] * scale);
      ctx.stroke();
      return;
    default:
      return;
  }
}

function drawPiece(ctx: CanvasRenderingContext2D, piece: PieceCode, x: number, y: number, size: number): void {
  const isWhite = piece === piece.toUpperCase();
  const silhouette = getPieceSilhouette(piece);
  const fill = isWhite ? "#f7f0dd" : "#18181c";
  const stroke = isWhite ? "#1a2230" : "#f7f0dd";
  const accent = isWhite ? "rgba(17, 24, 39, 0.18)" : "rgba(255, 248, 230, 0.22)";
  const scale = size * 0.38;

  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.shadowColor = isWhite ? "rgba(11, 15, 20, 0.22)" : "rgba(247, 240, 221, 0.16)";
  ctx.shadowBlur = size * 0.06;
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1.5, size * 0.055);

  for (const command of getPieceDrawCommands(piece)) {
    renderCommand(ctx, command, scale);
  }

  ctx.shadowBlur = 0;
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, size * 0.028);
  ctx.beginPath();
  switch (silhouette.label) {
    case "pawn":
      ctx.moveTo(-scale * 0.16, scale * 0.08);
      ctx.lineTo(scale * 0.16, scale * 0.08);
      break;
    case "rook":
      ctx.moveTo(-scale * 0.24, -scale * 0.08);
      ctx.lineTo(scale * 0.24, -scale * 0.08);
      ctx.moveTo(-scale * 0.24, scale * 0.06);
      ctx.lineTo(scale * 0.24, scale * 0.06);
      break;
    case "knight":
      ctx.moveTo(-scale * 0.08, -scale * 0.06);
      ctx.lineTo(scale * 0.18, scale * 0.02);
      ctx.moveTo(-scale * 0.12, scale * 0.08);
      ctx.lineTo(scale * 0.14, scale * 0.16);
      break;
    case "bishop":
      ctx.moveTo(-scale * 0.04, -scale * 0.4);
      ctx.lineTo(scale * 0.12, -scale * 0.16);
      ctx.moveTo(-scale * 0.16, scale * 0.02);
      ctx.lineTo(scale * 0.16, scale * 0.02);
      break;
    case "queen":
      ctx.moveTo(-scale * 0.26, -scale * 0.1);
      ctx.lineTo(scale * 0.26, -scale * 0.1);
      ctx.moveTo(-scale * 0.18, -scale * 0.28);
      ctx.lineTo(0, -scale * 0.46);
      ctx.lineTo(scale * 0.18, -scale * 0.28);
      break;
    case "king":
      ctx.moveTo(0, -scale * 0.56);
      ctx.lineTo(0, -scale * 0.32);
      ctx.moveTo(-scale * 0.16, -scale * 0.44);
      ctx.lineTo(scale * 0.16, -scale * 0.44);
      ctx.moveTo(-scale * 0.2, -scale * 0.06);
      ctx.lineTo(scale * 0.2, -scale * 0.06);
      break;
  }
  ctx.stroke();

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
