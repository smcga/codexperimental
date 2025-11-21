'use strict';

function defaultTimeSource() {
  return typeof performance !== 'undefined' && performance.now
    ? performance.now()
    : Date.now();
}

class GameLoop {
  constructor({
    stepMs = 50,
    maxUpdates = 5,
    onUpdate = () => {},
    onFrame = () => {},
    timeSource = defaultTimeSource,
  } = {}) {
    this.stepMs = stepMs;
    this.maxUpdates = maxUpdates;
    this.onUpdate = onUpdate;
    this.onFrame = onFrame;
    this.timeSource = timeSource;

    this._accumulator = 0;
    this._lastTime = null;
    this._running = false;
    this._handle = null;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = this.timeSource();
    this._schedule();
  }

  stop() {
    this._running = false;
    if (this._handle) {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this._handle);
      } else {
        clearTimeout(this._handle);
      }
    }
    this._handle = null;
  }

  advance(deltaMs) {
    if (!this._running && this._lastTime === null) {
      this._lastTime = this.timeSource();
    }
    this._iterate(this.timeSource() + deltaMs, deltaMs);
  }

  _iterate(now, forcedDelta = null) {
    if (!this._running) return;
    const delta = forcedDelta !== null ? forcedDelta : now - this._lastTime;
    this._lastTime = now;
    this._accumulator += delta;

    let updates = 0;
    while (this._accumulator >= this.stepMs && updates < this.maxUpdates) {
      this.onUpdate(this.stepMs);
      this._accumulator -= this.stepMs;
      updates += 1;
    }

    const alpha = this.stepMs > 0 ? this._accumulator / this.stepMs : 0;
    this.onFrame(alpha);
    this._schedule();
  }

  _schedule() {
    if (!this._running) return;
    const callback = () => this._iterate(this.timeSource());

    if (typeof requestAnimationFrame === 'function') {
      this._handle = requestAnimationFrame(callback);
    } else {
      this._handle = setTimeout(callback, this.stepMs);
    }
  }
}

module.exports = { GameLoop };
