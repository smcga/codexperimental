'use strict';

const assert = require('assert');
const { ANIMATIONS, SKIN_VARIANTS, STATES, Zombie, createQuotaTracker, updateHorde } = require('../zombies');
const { Terrain } = require('../terrain');

function testQuotaRespected() {
  const tracker = createQuotaTracker({ roles: { builder: 1 } });
  const first = new Zombie(1);
  const second = new Zombie(2);

  assert.ok(first.assignRole('builder', tracker), 'first builder allowed');
  assert.ok(!second.assignRole('builder', tracker), 'second builder blocked by quota');
  assert.strictEqual(tracker.remaining('builder'), 0, 'quota consumed');
}

function testVariantSelectionDeterministic() {
  const zombieA = new Zombie(0);
  const zombieB = new Zombie(3);
  const zombieC = new Zombie(4);

  assert.strictEqual(zombieA.variant, SKIN_VARIANTS[0], 'first zombie uses first variant');
  assert.strictEqual(zombieB.variant, SKIN_VARIANTS[3], 'variants cycle by id');
  assert.strictEqual(zombieC.variant, SKIN_VARIANTS[0], 'variants wrap deterministically');
}

function testWalkerTurnsAtWall() {
  const terrain = new Terrain(5, 5);
  terrain.addSoft(2, 1);
  terrain.addSoft(1, 2);
  terrain.addSoft(2, 2);
  const zombie = new Zombie(1, { x: 1, y: 1, direction: 1 });
  zombie.update({ terrain });
  assert.strictEqual(zombie.state, STATES.TURN, 'zombie turns on wall');
  assert.strictEqual(zombie.animation, ANIMATIONS.TURN, 'turn animation applied');
  zombie.update({ terrain });
  assert.strictEqual(zombie.direction, -1, 'direction flipped after turn');
  assert.strictEqual(zombie.facing, 'left', 'facing tracked from direction');
}

function testZombieFallsUnderGravity() {
  const terrain = new Terrain(5, 5);
  const zombie = new Zombie(7, { x: 2, y: 0 });
  zombie.update({ terrain, gravity: 0.5, delta: 2 });
  assert.strictEqual(zombie.state, STATES.FALL, 'zombie enters falling state');
  assert.ok(zombie.y > 0, 'zombie position updated by gravity');
  assert.strictEqual(zombie.animation, ANIMATIONS.FALL, 'falling animation set');
}

function testHazardKillsZombie() {
  const terrain = new Terrain(3, 3);
  terrain.addSoft(1, 1);
  const zombie = new Zombie(2, { x: 1, y: 0 });
  zombie.update({
    terrain,
    hazards: [{ type: 'acid', area: { x1: 1, y1: 0, x2: 1, y2: 2 } }],
  });
  assert.strictEqual(zombie.alive, false, 'zombie dies on hazard contact');
  assert.strictEqual(zombie.state, STATES.DEAD, 'death state applied');
  assert.strictEqual(zombie.animation, ANIMATIONS.DEAD, 'death animation set');
}

function testPortalUseIsDeterministicAcrossHorde() {
  const terrain = new Terrain(4, 4);
  terrain.addSoft(1, 1);
  terrain.addSoft(2, 1);
  const portals = [
    { id: 'A', entry: { x: 1, y: 1 }, exit: { x: 3, y: 1 }, schedule: [0] },
  ];
  const earlyZombie = new Zombie(1, { x: 1, y: 1 });
  const lateZombie = new Zombie(5, { x: 1, y: 1 });

  updateHorde([lateZombie, earlyZombie], { terrain, portals, tick: 0 });

  assert.strictEqual(earlyZombie.state, STATES.EXIT, 'first in order exits');
  assert.strictEqual(earlyZombie.x, 3, 'first zombie teleports to exit');
  assert.notStrictEqual(lateZombie.state, STATES.EXIT, 'second zombie waits');
  assert.strictEqual(portals[0].nextUseIndex, 1, 'portal use consumed deterministically');
}

function run() {
  testQuotaRespected();
  testVariantSelectionDeterministic();
  testWalkerTurnsAtWall();
  testZombieFallsUnderGravity();
  testHazardKillsZombie();
  testPortalUseIsDeterministicAcrossHorde();
  console.log('zombie tests passed');
}

run();
