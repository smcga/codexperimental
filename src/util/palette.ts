export function buildPalette(): Uint32Array {
  const palette = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    const t = i / 255;
    const r = Math.floor(128 + 127 * Math.sin(Math.PI * 2 * (t + 0.0)));
    const g = Math.floor(128 + 127 * Math.sin(Math.PI * 2 * (t + 0.33)));
    const b = Math.floor(128 + 127 * Math.sin(Math.PI * 2 * (t + 0.66)));
    palette[i] = (255 << 24) | (b << 16) | (g << 8) | r;
  }
  return palette;
}
