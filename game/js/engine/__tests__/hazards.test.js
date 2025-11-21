'use strict';

const assert = require('assert');
const { evaluateHazardCollision } = require('../hazards');

function makeHazard(type, area) {
  return { type, area };
}

function testFatalHazard() {
  const zombie = { x: 2, y: 2 };
  const hazard = makeHazard('fire', { x1: 0, y1: 0, x2: 3, y2: 3 });
  const result = evaluateHazardCollision(zombie, [hazard]);
  assert.ok(result.killed, 'zombie should die in fire');
  assert.ok(!result.deflected, 'fire is not deflectable');
}

function testBlockerDeflects() {
  const zombie = { x: 1, y: 1, role: 'blocker' };
  const hazard = makeHazard('blades', { x1: 0, y1: 0, x2: 2, y2: 2 });
  const result = evaluateHazardCollision(zombie, [hazard]);
  assert.ok(!result.killed, 'blocker survives blades');
  assert.ok(result.deflected, 'blocker should deflect moving hazard');
}

function run() {
  testFatalHazard();
  testBlockerDeflects();
  console.log('hazard tests passed');
}

run();
