import { describe, expect, it } from "vitest";

import { applyMove, buildBoardAtMove, createInitialBoard, drawPiece, resolveLocalStartTime } from "./chessEffect";

class TestPath2D {
  arc(): void {}
  moveTo(): void {}
  lineTo(): void {}
  bezierCurveTo(): void {}
  closePath(): void {}
  rect(): void {}
}

if (!("Path2D" in globalThis)) {
  (globalThis as typeof globalThis & { Path2D: typeof TestPath2D }).Path2D = TestPath2D;
}

describe("chessEffect helpers", () => {
  it("builds the initial board with standard piece placement", () => {
    const board = createInitialBoard();

    expect(board[0][0]).toBe("r");
    expect(board[7][4]).toBe("K");
    expect(board[6][3]).toBe("P");
  });

  it("applies scripted moves and resolves captures", () => {
    const { board, lastMove } = buildBoardAtMove(17);

    expect(board[3][2]).toBe("P");
    expect(lastMove?.capture).toBe(true);
  });

  it("moves pieces and clears their origin square", () => {
    const board = createInitialBoard();
    const resolved = applyMove(board, { from: "b1", to: "c3" });

    expect(resolved.capture).toBe(false);
    expect(board[7][1]).toBeNull();
    expect(board[5][2]).toBe("N");
  });

  it("anchors local time and re-anchors on large gaps or backwards jumps", () => {
    const anchorKey = {};
    const moveInterval = 1;

    const firstAnchor = resolveLocalStartTime(anchorKey, 10, moveInterval);
    expect(firstAnchor).toBe(10);

    const sameAnchor = resolveLocalStartTime(anchorKey, 12, moveInterval);
    expect(sameAnchor).toBe(10);

    const gapAnchor = resolveLocalStartTime(anchorKey, 20, moveInterval);
    expect(gapAnchor).toBe(20);

    const backwardAnchor = resolveLocalStartTime(anchorKey, 5, moveInterval);
    expect(backwardAnchor).toBe(5);
  });

  it("draws all piece types with gradient shading", () => {
    const gradient = { addColorStop: () => undefined };
    const ctx = {
      save: () => undefined,
      restore: () => undefined,
      translate: () => undefined,
      scale: () => undefined,
      beginPath: () => undefined,
      arc: () => undefined,
      ellipse: () => undefined,
      fill: () => undefined,
      stroke: () => undefined,
      createRadialGradient: () => gradient,
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      lineJoin: "round",
      lineCap: "round",
      globalAlpha: 1
    } as unknown as CanvasRenderingContext2D;

    ["P", "R", "N", "B", "Q", "K", "p", "r", "n", "b", "q", "k"].forEach((piece) => {
      expect(() => drawPiece(ctx, piece, 10, 10, 40)).not.toThrow();
    });
  });
});
