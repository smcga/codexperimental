'use strict';

const assert = require('assert');
const { ANIMATIONS, SKIN_VARIANTS, STATES, Zombie, createQuotaTracker, updateHorde } = require('../zombies');
const { RoleManager } = require('../roles');
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

function testRoleManagerAssignsByHitTest() {
  const manager = new RoleManager({ roles: { blocker: 1 } });
  const zombies = [new Zombie(1, { x: 1, y: 1 }), new Zombie(2, { x: 2, y: 1 })];

  manager.select('blocker');
  const assigned = manager.assignAtPosition(zombies, 2, 1);

  assert.ok(assigned, 'role assignment succeeds on hit');
  assert.strictEqual(zombies[1].role, 'blocker', 'target zombie receives role');
  assert.strictEqual(manager.remaining('blocker'), 0, 'quota consumed after assignment');
}

function testBlockerDeflectsWalkers() {
  const terrain = new Terrain(5, 5);
  terrain.addSoft(1, 2);
  terrain.addSoft(2, 2);
  const blocker = new Zombie(1, { x: 2, y: 1 });
  const walker = new Zombie(2, { x: 1, y: 1, direction: 1 });
  blocker.assignRole('blocker', createQuotaTracker({ roles: { blocker: 1 } }));

  updateHorde([walker, blocker], { terrain });

  assert.strictEqual(walker.state, STATES.TURN, 'walker turns at blocker');
  assert.strictEqual(walker.direction, -1, 'walker direction flipped by blocker');
}

function testDiggingRolesModifyTerrain() {
  const terrain = new Terrain(5, 5);
  terrain.addSoft(1, 1);
  terrain.addSoft(2, 1);
  terrain.addSoft(2, 0);
  terrain.addSoft(1, 2);
  terrain.addSoft(2, 2);

  const digger = new Zombie(3, { x: 1, y: 0 });
  digger.assignRole('digger', createQuotaTracker({ roles: { digger: 1 } }));
  digger.update({ terrain });
  assert.strictEqual(digger.y, 1, 'digger moves downward');
  assert.ok(!terrain.soft.get(1, 1), 'digger removes soft terrain below');

  const basher = new Zombie(4, { x: 1, y: 1, direction: 1 });
  basher.assignRole('basher', createQuotaTracker({ roles: { basher: 1 } }));
  basher.update({ terrain });
  assert.strictEqual(basher.x, 2, 'basher moves horizontally');
  assert.ok(!terrain.soft.get(2, 1), 'basher clears path forward');
  assert.ok(!terrain.soft.get(2, 0), 'basher clears headroom');

  const miner = new Zombie(5, { x: 2, y: 1, direction: 1 });
  terrain.addSoft(3, 2);
  miner.assignRole('miner', createQuotaTracker({ roles: { miner: 1 } }));
  miner.update({ terrain });
  assert.strictEqual(miner.x, 3, 'miner moves diagonally forward');
  assert.strictEqual(miner.y, 2, 'miner descends while digging');
  assert.ok(!terrain.soft.get(3, 2), 'miner clears diagonal tile');
}

function testClimberRespectsOverhangs() {
  const terrain = new Terrain(5, 5);
  terrain.addSoft(2, 1);
  terrain.addSoft(2, 0);
  terrain.addSoft(1, 2);
  terrain.addSoft(2, 2);
  const climber = new Zombie(6, { x: 1, y: 1, direction: 1 });
  climber.assignRole('climber', createQuotaTracker({ roles: { climber: 1 } }));

  climber.update({ terrain });

  assert.strictEqual(climber.state, STATES.TURN, 'climber turns away from overhang');
  assert.strictEqual(climber.direction, -1, 'climber reverses when blocked');
}

function testFloaterReducesFallSpeed() {
  const terrain = new Terrain(5, 5);
  const walker = new Zombie(7, { x: 1, y: 0 });
  const floater = new Zombie(8, { x: 2, y: 0 });
  floater.assignRole('floater', createQuotaTracker({ roles: { floater: 1 } }));

  walker.update({ terrain, gravity: 1, delta: 1 });
  floater.update({ terrain, gravity: 1, delta: 1 });

  assert.ok(floater.velocity.y < walker.velocity.y, 'floater accelerates slower while falling');
  assert.strictEqual(floater.state, STATES.FLOAT, 'floater enters float state while falling');
}

function testBuilderAddsStepsUnlessObstructed() {
  const terrain = new Terrain(5, 5);
  terrain.addSoft(1, 3);
  terrain.addSoft(2, 3);
  const builder = new Zombie(9, { x: 1, y: 2, direction: 1 });
  builder.assignRole('builder', createQuotaTracker({ roles: { builder: 1 } }));

  builder.update({ terrain });
  assert.ok(terrain.soft.get(2, 1), 'builder places staircase tile');
  assert.strictEqual(builder.x, 2, 'builder moves onto new step');

  terrain.steel.set(3, 0, true);
  builder.update({ terrain });
  assert.strictEqual(builder.state, STATES.WALK, 'builder stops when obstructed');
}

function testBomberClearsTerrainAndBlockers() {
  const terrain = new Terrain(5, 5);
  terrain.addSoft(2, 1);
  terrain.addSoft(2, 2);
  const bomber = new Zombie(10, { x: 2, y: 1 });
  bomber.assignRole('bomber', createQuotaTracker({ roles: { bomber: 1 } }));
  const blocker = new Zombie(11, { x: 3, y: 1 });
  blocker.assignRole('blocker', createQuotaTracker({ roles: { blocker: 1 } }));
  terrain.addSoft(3, 2);

  updateHorde([bomber, blocker], { terrain });
  updateHorde([bomber, blocker], { terrain });
  updateHorde([bomber, blocker], { terrain });
  updateHorde([bomber, blocker], { terrain });

  assert.ok(!terrain.soft.get(2, 1) && !terrain.soft.get(2, 2), 'explosion clears nearby terrain');
  assert.ok(!blocker.alive || blocker.role === null, 'blocker cleared or destroyed by blast');
}

function run() {
  testQuotaRespected();
  testVariantSelectionDeterministic();
  testWalkerTurnsAtWall();
  testZombieFallsUnderGravity();
  testHazardKillsZombie();
  testPortalUseIsDeterministicAcrossHorde();
  testRoleManagerAssignsByHitTest();
  testBlockerDeflectsWalkers();
  testDiggingRolesModifyTerrain();
  testClimberRespectsOverhangs();
  testFloaterReducesFallSpeed();
  testBuilderAddsStepsUnlessObstructed();
  testBomberClearsTerrainAndBlockers();
  console.log('zombie tests passed');
}

run();
