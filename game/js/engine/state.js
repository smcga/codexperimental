'use strict';

class SessionEvaluator {
  constructor({ requiredSaved = 0, totalZombies = 0, timeLimitMs = 0 } = {}) {
    this.requiredSaved = requiredSaved;
    this.totalZombies = totalZombies;
    this.timeLimitMs = timeLimitMs;
    this.saved = 0;
    this.deaths = 0;
    this.elapsed = 0;
  }

  recordSaved(count = 1) {
    this.saved += count;
  }

  recordDeath(count = 1) {
    this.deaths += count;
  }

  tick(deltaMs) {
    this.elapsed += deltaMs;
  }

  get timeRemaining() {
    if (!this.timeLimitMs) return Infinity;
    return Math.max(0, this.timeLimitMs - this.elapsed);
  }

  evaluate() {
    if (this.saved >= this.requiredSaved) return 'success';
    if (this.timeLimitMs && this.elapsed >= this.timeLimitMs) return 'failed';
    if (this.saved + this.deaths >= this.totalZombies && this.requiredSaved) return 'failed';
    return 'running';
  }
}

function bindControlHandlers(doc, { onRestart, onPause, onFastForward }) {
  const restartBtn = doc.querySelector('[data-action="restart"]');
  const pauseBtn = doc.querySelector('[data-action="pause"]');
  const fastForwardBtn = doc.querySelector('[data-action="fast-forward"]');

  if (restartBtn && onRestart) {
    restartBtn.addEventListener('click', onRestart);
  }

  if (pauseBtn && onPause) {
    pauseBtn.addEventListener('click', onPause);
  }

  if (fastForwardBtn && onFastForward) {
    fastForwardBtn.addEventListener('click', onFastForward);
  }
}

module.exports = { SessionEvaluator, bindControlHandlers };
