import { describe, expect, it, vi } from "vitest";

import {
  applyPlacement,
  choosePlacement,
  collides,
  countBoardHoles,
  createEmptyBoard,
  findDropY,
  getPieceCells,
  resolveTetrisMatrixParams,
  TETRIS_BOARD_HEIGHT,
  TETRIS_BOARD_WIDTH,
  TETRIS_MATRIX_DEFAULTS,
  TetrisMatrixEffect
} from "./tetrisMatrixEffect";

const createGradient = () => ({ addColorStop: vi.fn() });

const createCtx = () =>
  ({
    fillStyle: "",
    font: "",
    textAlign: "left",
    textBaseline: "alphabetic",
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    createLinearGradient: vi.fn(() => createGradient()),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn()
  }) as unknown as CanvasRenderingContext2D;

const audio = {
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.4,
  bass: 0.25,
  mid: 0.2,
  treble: 0.15,
  beat: true,
  beatStrength: 0.5,
  impactStrength: 0.3
};

describe("tetrisMatrixEffect helpers", () => {
  it("exposes stable defaults for docs and UI", () => {
    expect(TETRIS_MATRIX_DEFAULTS).toEqual({
      speed: 1,
      level: 8,
      glow: 0.78,
      contrast: 0.88,
      ghost: 1,
      seed: 1989
    });
  });

  it("clamps params into supported ranges", () => {
    expect(
      resolveTetrisMatrixParams({
        speed: 10,
        level: 0,
        glow: -1,
        contrast: 2,
        ghost: 4,
        seed: -9
      })
    ).toEqual({
      speed: 3,
      level: 1,
      glow: 0,
      contrast: 1.3,
      ghost: 1,
      seed: 9
    });
  });

  it("returns valid drop positions without colliding", () => {
    const board = createEmptyBoard();
    const piece = "I";
    const rotation = 0;
    const x = 3;
    const y = findDropY(board, piece, rotation, x);

    expect(y).toBeGreaterThanOrEqual(-2);
    expect(collides(board, piece, rotation, x, y)).toBe(false);
    expect(collides(board, piece, rotation, x, y + 1)).toBe(true);
  });

  it("applies placements and clears complete lines", () => {
    const board = createEmptyBoard();
    const bottomRow = TETRIS_BOARD_HEIGHT - 1;
    for (let x = 0; x < TETRIS_BOARD_WIDTH; x += 1) {
      if (x === TETRIS_BOARD_WIDTH - 1) {
        continue;
      }
      board[bottomRow * TETRIS_BOARD_WIDTH + x] = 2;
    }

    const result = applyPlacement(board, {
      piece: "I",
      rotation: 1,
      x: TETRIS_BOARD_WIDTH - 1,
      y: bottomRow - 4,
      score: 0,
      clearedLines: 0
    });

    expect(result.clearedLines).toBe(1);
    expect(result.board.slice(0, TETRIS_BOARD_WIDTH)).toEqual(new Array(TETRIS_BOARD_WIDTH).fill(0));
    expect(result.board.filter((cell) => cell !== 0)).toHaveLength(4);
  });

  it("prefers placements that avoid creating holes when possible", () => {
    const board = createEmptyBoard();
    const lastRow = TETRIS_BOARD_HEIGHT - 1;
    const secondLastRow = TETRIS_BOARD_HEIGHT - 2;
    for (let x = 0; x < TETRIS_BOARD_WIDTH; x += 1) {
      if (x !== 5) {
        board[lastRow * TETRIS_BOARD_WIDTH + x] = 3;
        board[secondLastRow * TETRIS_BOARD_WIDTH + x] = 3;
      }
    }

    const placement = choosePlacement(board, "I", 1989, 12);
    const after = applyPlacement(board, placement).board;

    expect(countBoardHoles(after)).toBe(0);
    expect(placement.x).toBe(5);
  });

  it("defines pentomino rotations with five minos each", () => {
    const pieces = ["F", "I", "L", "P", "N", "T", "U", "V", "W", "X", "Y", "Z"] as const;
    pieces.forEach((piece) => {
      const cells = getPieceCells(piece, 0);
      expect(cells).toHaveLength(5);
    });
  });
});

describe("TetrisMatrixEffect", () => {
  it("renders a green game-boy-like playfield and hud", () => {
    const effect = new TetrisMatrixEffect();
    const ctx = createCtx();
    const colors = new Set<string>();
    const labels: string[] = [];

    (ctx.fillRect as ReturnType<typeof vi.fn>).mockImplementation(() => {
      colors.add(String((ctx as unknown as { fillStyle: unknown }).fillStyle));
    });
    (ctx.fillText as ReturnType<typeof vi.fn>).mockImplementation((text: string) => {
      labels.push(text);
    });

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 4.25,
      delta: 1 / 60,
      audio,
      params: {}
    });

    expect((ctx.clearRect as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
    expect(colors.has("#0f1f0f")).toBe(true);
    expect(colors.has("#9bbc0f")).toBe(true);
    expect(colors.has("#77a834") || colors.has("#b7d25c")).toBe(true);
    expect(labels).toContain("SCORE");
    expect(labels).toContain("NEXT");
    expect(labels).toContain("DOT MATRIX");
  });

  it("resets cached simulation state", () => {
    const effect = new TetrisMatrixEffect();
    const ctx = createCtx();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 10,
      delta: 1 / 60,
      audio,
      params: { seed: 1989 }
    });
    effect.reset?.();

    const secondCtx = createCtx();
    expect(() =>
      effect.render({
        ctx: secondCtx,
        width: 320,
        height: 180,
        time: 0.1,
        delta: 1 / 60,
        audio,
        params: { seed: 1989 }
      })
    ).not.toThrow();
  });
});
