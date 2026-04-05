import { describe, expect, it } from "vitest";
import { countNeighbours, createSeededRng, resolveGameOfLifeParams, seedInitialGrid, stepSimulation } from "./gameOfLifeEffect";

const toGrid = (cells: Uint8Array, cols: number, rows: number): number[][] => {
  const grid: number[][] = [];
  for (let y = 0; y < rows; y += 1) {
    const row: number[] = [];
    for (let x = 0; x < cols; x += 1) {
      row.push(cells[y * cols + x]);
    }
    grid.push(row);
  }
  return grid;
};

describe("gameOfLifeEffect simulation", () => {
  it("blinker oscillates with period 2", () => {
    const cols = 5;
    const rows = 5;
    const current = new Uint8Array(cols * rows);
    const next = new Uint8Array(cols * rows);
    const age = new Uint16Array(cols * rows);
    const trail = new Float32Array(cols * rows);

    current[1 * cols + 2] = 1;
    current[2 * cols + 2] = 1;
    current[3 * cols + 2] = 1;

    stepSimulation(current, next, age, trail, cols, rows, false, 0.12);
    expect(toGrid(current, cols, rows)).toEqual([
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0]
    ]);

    stepSimulation(current, next, age, trail, cols, rows, false, 0.12);
    expect(toGrid(current, cols, rows)).toEqual([
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0]
    ]);
  });

  it("block remains stable", () => {
    const cols = 4;
    const rows = 4;
    const current = new Uint8Array(cols * rows);
    const next = new Uint8Array(cols * rows);
    const age = new Uint16Array(cols * rows);
    const trail = new Float32Array(cols * rows);

    current[1 * cols + 1] = 1;
    current[1 * cols + 2] = 1;
    current[2 * cols + 1] = 1;
    current[2 * cols + 2] = 1;

    for (let i = 0; i < 4; i += 1) {
      stepSimulation(current, next, age, trail, cols, rows, false, 0.1);
    }

    expect(toGrid(current, cols, rows)).toEqual([
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0]
    ]);
  });

  it("glider translates diagonally after four steps", () => {
    const cols = 10;
    const rows = 10;
    const current = new Uint8Array(cols * rows);
    const next = new Uint8Array(cols * rows);
    const age = new Uint16Array(cols * rows);
    const trail = new Float32Array(cols * rows);

    const start = [
      [1, 0],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2]
    ];
    for (const [x, y] of start) {
      current[y * cols + x] = 1;
    }

    for (let i = 0; i < 4; i += 1) {
      stepSimulation(current, next, age, trail, cols, rows, false, 0.12);
    }

    const expected = new Set(["2,1", "3,2", "1,3", "2,3", "3,3"]);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const alive = current[y * cols + x] === 1;
        expect(alive).toBe(expected.has(`${x},${y}`));
      }
    }
  });

  it("deterministic seeding is identical for the same seed", () => {
    const cols = 18;
    const rows = 12;
    const total = cols * rows;
    const left = new Uint8Array(total);
    const right = new Uint8Array(total);
    const leftAge = new Uint16Array(total);
    const rightAge = new Uint16Array(total);
    const params = resolveGameOfLifeParams({ seed: 2026, patternMode: "mixed", density: 0.22 });

    seedInitialGrid(left, leftAge, cols, rows, params, createSeededRng(2026));
    seedInitialGrid(right, rightAge, cols, rows, params, createSeededRng(2026));

    expect(Array.from(left)).toEqual(Array.from(right));
  });

  it("counts bounded neighbours correctly", () => {
    const cols = 3;
    const rows = 3;
    const cells = Uint8Array.from([
      1, 1, 0,
      0, 1, 0,
      0, 0, 0
    ]);

    expect(countNeighbours(cells, 0, 0, cols, rows, false)).toBe(2);
    expect(countNeighbours(cells, 2, 2, cols, rows, false)).toBe(1);
  });
});
