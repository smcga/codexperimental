'use strict';

class TerrainLayer {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cells = new Array(width * height).fill(false);
  }

  index(x, y) {
    return y * this.width + x;
  }

  inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  set(x, y, value) {
    if (!this.inBounds(x, y)) return;
    this.cells[this.index(x, y)] = value;
  }

  get(x, y) {
    if (!this.inBounds(x, y)) return false;
    return this.cells[this.index(x, y)];
  }
}

class Terrain {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.soft = new TerrainLayer(width, height);
    this.steel = new TerrainLayer(width, height);
  }

  isSolid(x, y) {
    return this.steel.get(x, y) || this.soft.get(x, y);
  }

  isSteel(x, y) {
    return this.steel.get(x, y);
  }

  addSoft(x, y) {
    if (this.steel.get(x, y)) return;
    this.soft.set(x, y, true);
  }

  removeSoft(x, y) {
    this.soft.set(x, y, false);
  }

  applyDigger(x, y, depth = 3) {
    for (let dy = 0; dy < depth; dy += 1) {
      this.removeSoft(x, y + dy);
    }
  }

  applyBasher(x, y, length = 4, height = 2, direction = 1) {
    for (let dx = 0; dx < length; dx += 1) {
      for (let dy = 0; dy < height; dy += 1) {
        const targetX = x + dx * direction;
        if (!this.isSteel(targetX, y + dy)) {
          this.removeSoft(targetX, y + dy);
        }
      }
    }
  }

  applyMiner(x, y, length = 4, slope = 2) {
    for (let i = 0; i < length; i += 1) {
      const targetX = x + i;
      const targetY = y + Math.floor(i / slope);
      if (!this.isSteel(targetX, targetY)) {
        this.removeSoft(targetX, targetY);
      }
    }
  }

  applyBuilder(x, y, length = 4, rise = 0) {
    for (let i = 0; i < length; i += 1) {
      const targetX = x + i;
      const targetY = y - Math.floor((i * rise) / Math.max(length - 1, 1));
      this.addSoft(targetX, targetY);
    }
  }
}

module.exports = { Terrain, TerrainLayer };
