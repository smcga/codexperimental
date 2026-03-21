import { describe, expect, it } from "vitest";

import {
  applyMove,
  buildBoardAtMove,
  createInitialBoard,
  getPieceDrawCommands,
  getPieceSilhouette,
  resolveLocalStartTime
} from "./chessEffect";

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

  it("exposes distinct silhouette traits for each major chess piece", () => {
    expect(getPieceSilhouette("Q")).toMatchObject({
      label: "queen",
      featureTags: expect.arrayContaining(["crown"]),
      crownPoints: 3
    });
    expect(getPieceSilhouette("K")).toMatchObject({
      label: "king",
      featureTags: expect.arrayContaining(["cross"]),
      crownPoints: 0
    });
    expect(getPieceSilhouette("B")).toMatchObject({
      label: "bishop",
      featureTags: expect.arrayContaining(["mitre"])
    });
    expect(getPieceSilhouette("N")).toMatchObject({
      label: "knight",
      featureTags: expect.arrayContaining(["horseHead"])
    });
    expect(getPieceSilhouette("R")).toMatchObject({
      label: "rook",
      featureTags: expect.arrayContaining(["battlements"]),
      crownPoints: 3
    });
    expect(getPieceSilhouette("P")).toMatchObject({
      label: "pawn",
      featureTags: ["pawnHead"]
    });
  });

  it("builds draw commands that preserve iconic piece details", () => {
    const pawnCommands = getPieceDrawCommands("P");
    const queenCommands = getPieceDrawCommands("Q");
    const kingCommands = getPieceDrawCommands("K");
    const knightCommands = getPieceDrawCommands("N");
    const bishopCommands = getPieceDrawCommands("B");
    const rookCommands = getPieceDrawCommands("R");

    expect(pawnCommands.filter((command) => command.kind === "line")).toHaveLength(1);
    expect(queenCommands.filter((command) => command.kind === "circle")).toHaveLength(5);
    expect(queenCommands.filter((command) => command.kind === "line")).toHaveLength(1);
    expect(kingCommands.filter((command) => command.kind === "line")).toHaveLength(3);
    expect(knightCommands.filter((command) => command.kind === "polygon")).toHaveLength(2);
    expect(knightCommands.filter((command) => command.kind === "line")).toHaveLength(2);
    expect(bishopCommands.filter((command) => command.kind === "line")).toHaveLength(2);
    expect(rookCommands.filter((command) => command.kind === "rect")).toHaveLength(7);
  });

  it("gives major pieces unique geometry signatures so they stay recognisable at a glance", () => {
    const signature = (piece: "Q" | "K" | "B" | "N" | "R" | "P") =>
      getPieceDrawCommands(piece).reduce<Record<string, number>>((counts, command) => {
        counts[command.kind] = (counts[command.kind] ?? 0) + 1;
        return counts;
      }, {});

    expect(signature("P")).toEqual({ rect: 3, circle: 1, polygon: 1, line: 1 });
    expect(signature("R")).toEqual({ rect: 7, line: 1 });
    expect(signature("N")).toEqual({ rect: 2, polygon: 2, circle: 1, line: 2 });
    expect(signature("B")).toEqual({ rect: 2, circle: 1, polygon: 1, line: 2 });
    expect(signature("Q")).toEqual({ rect: 2, polygon: 1, circle: 5, line: 1 });
    expect(signature("K")).toEqual({ rect: 4, polygon: 1, line: 3 });
  });
});
