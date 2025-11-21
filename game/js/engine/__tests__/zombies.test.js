'use strict';

const assert = require('assert');
const { Zombie, STATES, createQuotaTracker } = require('../zombies');
const { Terrain } = require('../terrain');

function testQuotaRespected() {
  const tracker = createQuotaTracker({ roles: { builder: 1 } });
  const first = new Zombie(1);
  const second = new Zombie(2);

  assert.ok(first.assignRole('builder', tracker), 'first builder allowed');
  assert.ok(!second.assignRole('builder', tracker), 'second builder blocked by quota');
  assert.strictEqual(tracker.remaining('builder'), 0, 'quota consumed');
}

function testWalkerTurnsAtWall() {
  const terrain = new Terrain(5, 5);
  terrain.addSoft(2, 0);
  terrain.addSoft(1, 1);
  terrain.addSoft(2, 1);
  const zombie = new Zombie(1, { x: 1, y: 0, direction: 1 });
  zombie.update({ terrain });
  assert.strictEqual(zombie.state, STATES.TURN, 'zombie turns on wall');
  zombie.update({ terrain });
  assert.strictEqual(zombie.direction, -1, 'direction flipped after turn');
}

function testDiggerDescends() {
  const terrain = new Terrain(5, 5);
  terrain.addSoft(2, 1);
  terrain.addSoft(2, 2);
  const zombie = new Zombie(1, { x: 2, y: 1 });
  zombie.assignRole('digger', createQuotaTracker({ roles: { digger: 1 } }));
  zombie.update({ terrain });
  assert.strictEqual(zombie.state, STATES.DIG, 'digger maintains digging state');
  assert.strictEqual(zombie.y, 2, 'digger moved downward');
}

function testFloaterFallsSlowly() {
  const terrain = new Terrain(5, 5);
  const zombie = new Zombie(1, { x: 2, y: 0 });
  zombie.assignRole('floater', createQuotaTracker({ roles: { floater: 1 } }));
  zombie.verticalSpeed = 2;
  zombie.update({ terrain });
  assert.ok(zombie.y > 0 && zombie.y < 2, 'floater descends with reduced speed');
}

function run() {
  testQuotaRespected();
  testWalkerTurnsAtWall();
  testDiggerDescends();
  testFloaterFallsSlowly();
  console.log('zombie tests passed');
}

run();
