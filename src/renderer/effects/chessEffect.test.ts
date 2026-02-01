import { describe, expect, it } from "vitest";

import { applyMove, buildBoardAtMove, createInitialBoard, resolveLocalStartTime } from "./chessEffect";

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
});
