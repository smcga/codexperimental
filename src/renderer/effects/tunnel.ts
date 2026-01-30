import { TAU } from "../../util/math";

export class Tunnel {
  private width: number;
  private height: number;
  private imageData: ImageData;
  private pattern: ImageData;
  private patternSize: number;

  constructor(width: number, height: number, patternSize = 96) {
    this.width = width;
    this.height = height;
    this.imageData = new ImageData(width, height);
    this.patternSize = patternSize;
    this.pattern = this.buildPattern(patternSize);
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.imageData = new ImageData(width, height);
  }

  private buildPattern(size: number) {
    const pattern = new ImageData(size, size);
    const data = pattern.data;
    let idx = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const checker = ((x >> 4) + (y >> 4)) % 2 === 0;
        const value = checker ? 220 : 60;
        data[idx++] = value;
        data[idx++] = checker ? 80 : 10;
        data[idx++] = checker ? 240 : 80;
        data[idx++] = 255;
      }
    }
    return pattern;
  }

  render(time: number, intensity: number) {
    const data = this.imageData.data;
    const w = this.width;
    const h = this.height;
    const pattern = this.pattern.data;
    const size = this.patternSize;
    const centerX = w / 2;
    const centerY = h / 2;
    const spin = time * (0.4 + intensity * 0.6);
    const zoom = 0.6 + intensity * 0.35;
    let idx = 0;

    for (let y = 0; y < h; y++) {
      const dy = y - centerY;
      for (let x = 0; x < w; x++) {
        const dx = x - centerX;
        const radius = Math.sqrt(dx * dx + dy * dy) || 1;
        const angle = Math.atan2(dy, dx) + spin;
        const u = ((angle / TAU) * size + time * 10) % size;
        const v = ((size * zoom) / radius + time * 12) % size;
        const pu = (Math.floor(u) + size) % size;
        const pv = (Math.floor(v) + size) % size;
        const pIndex = (pv * size + pu) * 4;
        data[idx++] = pattern[pIndex];
        data[idx++] = pattern[pIndex + 1];
        data[idx++] = pattern[pIndex + 2];
        data[idx++] = 255;
      }
    }
    return this.imageData;
  }
}
