import { clamp, smoothstep } from "../../util/math";

export type PacketLossCellState = {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  freeze: number;
  dropout: number;
  reveal: number;
  jitterX: number;
  jitterY: number;
  glow: number;
};

export type PacketLossTransitionState = {
  cols: number;
  rows: number;
  cells: PacketLossCellState[];
  noiseAlpha: number;
};

const hash01 = (index: number): number => {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
};

export function computePacketLossTransitionState(
  progress: number,
  width: number,
  height: number,
  cols?: number,
  rows?: number
): PacketLossTransitionState {
  const safeProgress = clamp(progress, 0, 1);
  const resolvedCols = Math.max(8, Math.min(20, cols ?? Math.round(width / 28)));
  const resolvedRows = Math.max(5, Math.min(14, rows ?? Math.round(height / 20)));
  const cellWidth = width / resolvedCols;
  const cellHeight = height / resolvedRows;

  const cells = Array.from({ length: resolvedCols * resolvedRows }, (_, index) => {
    const col = index % resolvedCols;
    const row = Math.floor(index / resolvedCols);
    const order = hash01(index * 3 + row * 11 + col * 17);
    const dropoutBias = hash01(index * 5 + 19);
    const jitterSeedX = hash01(index * 7 + 23) - 0.5;
    const jitterSeedY = hash01(index * 13 + 29) - 0.5;
    const freezeStart = clamp(order * 0.38, 0, 0.46);
    const freezeEnd = clamp(freezeStart + 0.14 + dropoutBias * 0.08, freezeStart + 0.08, 0.76);
    const revealStart = clamp(0.2 + order * 0.58 + dropoutBias * 0.06, 0.14, 0.86);
    const revealEnd = clamp(revealStart + 0.16 + (1 - order) * 0.12, revealStart + 0.08, 1);
    const freeze = smoothstep(freezeStart, freezeEnd, safeProgress) * (1 - smoothstep(revealStart, revealEnd, safeProgress));
    const reveal = smoothstep(revealStart, revealEnd, safeProgress);
    const dropoutWindow =
      smoothstep(freezeStart + 0.04, freezeEnd, safeProgress) *
      (1 - smoothstep(revealStart - 0.02, revealStart + 0.12, safeProgress));
    const dropout = clamp(dropoutWindow * (0.4 + dropoutBias * 0.6), 0, 1);
    const jitterStrength = freeze * (1 - reveal) * (0.35 + dropoutBias * 0.65);

    return {
      index,
      x: col * cellWidth,
      y: row * cellHeight,
      width: cellWidth,
      height: cellHeight,
      freeze,
      dropout,
      reveal,
      jitterX: jitterSeedX * cellWidth * 0.22 * jitterStrength,
      jitterY: jitterSeedY * cellHeight * 0.18 * jitterStrength,
      glow: clamp((1 - Math.abs(reveal - 0.5) * 2) * (0.45 + dropoutBias * 0.55), 0, 1)
    };
  });

  return {
    cols: resolvedCols,
    rows: resolvedRows,
    cells,
    noiseAlpha: clamp(Math.exp(-Math.pow((safeProgress - 0.48) / 0.2, 2)) * 0.22, 0, 0.22)
  };
}
