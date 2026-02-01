import { describe, expect, it } from "vitest";

import { applyMove, createPieceMap } from "./chessEffect";

const piece = (id: string, type: "K" | "Q" | "R" | "B" | "N" | "P", file: number, rank: number) => ({
  id,
  type,
  color: "white" as const,
  file,
  rank
});

describe("chess effect move logic", () => {
  it("moves a piece to the new square", () => {
    const pieces = createPieceMap([piece("wK", "K", 4, 0)]);

    applyMove(pieces, {
      notation: "Ke2",
      from: { file: 4, rank: 0 },
      to: { file: 4, rank: 1 }
    });

    expect(pieces.has("4,0")).toBe(false);
    expect(pieces.has("4,1")).toBe(true);
  });

  it("handles captures and extra moves", () => {
    const pieces = createPieceMap([
      piece("wK", "K", 4, 0),
      piece("wR", "R", 7, 0),
      { id: "bP", type: "P", color: "black" as const, file: 6, rank: 0 }
    ]);

    applyMove(pieces, {
      notation: "O-O",
      from: { file: 4, rank: 0 },
      to: { file: 6, rank: 0 },
      capture: { file: 6, rank: 0 },
      extras: [{ from: { file: 7, rank: 0 }, to: { file: 5, rank: 0 } }]
    });

    expect(pieces.has("4,0")).toBe(false);
    expect(pieces.has("6,0")).toBe(true);
    expect(pieces.has("7,0")).toBe(false);
    expect(pieces.has("5,0")).toBe(true);
    expect(pieces.get("6,0")?.type).toBe("K");
    expect(pieces.get("5,0")?.type).toBe("R");
  });
});
