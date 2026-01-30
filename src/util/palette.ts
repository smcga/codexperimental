import { TAU } from './math';

export type Palette = Uint32Array;

export const createPalette = () => {
  const palette = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    const t = i / 256;
    const r = Math.floor(128 + 127 * Math.sin(TAU * (t + 0.0)));
    const g = Math.floor(128 + 127 * Math.sin(TAU * (t + 0.33)));
    const b = Math.floor(128 + 127 * Math.sin(TAU * (t + 0.66)));
    palette[i] = (255 << 24) | (b << 16) | (g << 8) | r;
  }
  return palette;
};
