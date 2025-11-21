'use strict';

const assert = require('assert');
const { GameLoop } = require('../loop');

function createLoop(overrides = {}) {
  let currentTime = 0;
  const timeSource = () => currentTime;
  const loop = new GameLoop(
    Object.assign(
      {
        stepMs: 10,
        maxUpdates: 5,
        timeSource,
      },
      overrides
    )
  );

  loop._schedule = () => {};
  loop._setTime = (value) => {
    currentTime = value;
  };
  return loop;
}

function testFixedStepUpdates() {
  let updateCalls = 0;
  let lastAlpha = 0;
  const loop = createLoop({
    onUpdate: () => {
      updateCalls += 1;
    },
    onFrame: (alpha) => {
      lastAlpha = alpha;
    },
  });

  loop.start();
  loop._setTime(0);
  loop.advance(25);

  assert.strictEqual(updateCalls, 2, 'should process two full steps');
  assert.ok(lastAlpha > 0.4 && lastAlpha < 0.6, 'alpha should reflect remainder time');
  loop.stop();
}

function testMaxUpdatesGuard() {
  let updateCalls = 0;
  const loop = createLoop({
    stepMs: 5,
    maxUpdates: 3,
    onUpdate: () => {
      updateCalls += 1;
    },
  });

  loop.start();
  loop._setTime(0);
  loop.advance(50);

  assert.strictEqual(updateCalls, 3, 'should clamp updates to configured maximum');
  loop.stop();
}

function run() {
  testFixedStepUpdates();
  testMaxUpdatesGuard();
  console.log('loop tests passed');
}

run();
