export const createPalette = () => {
  const palette = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    const t = i / 255;
    const r = Math.floor(128 + 127 * Math.sin(t * Math.PI * 2 + 0));
    const g = Math.floor(128 + 127 * Math.sin(t * Math.PI * 2 + 2));
    const b = Math.floor(128 + 127 * Math.sin(t * Math.PI * 2 + 4));
    palette[i] = (255 << 24) | (b << 16) | (g << 8) | r;
  }
  return palette;
};
