'use strict';

const assert = require('assert');
const path = require('path');
const {
  buildDeterministicSchedule,
  hydrateTerrain,
  normalizePortals,
  parseLevel,
  loadLevelFromFile,
} = require('../level-loader');

function testBuildDeterministicSchedule() {
  const schedule = buildDeterministicSchedule(3, 4, 2);
  assert.deepStrictEqual(schedule, [2, 5, 8, 11], 'schedule increments deterministically');
}

function testHydrateTerrainFromBitmap() {
  const terrain = hydrateTerrain({
    legend: { '#': 'steel', 'x': 'soft', '.': 'empty' },
    bitmap: ['#x.', '.x#'],
  });

  assert.ok(terrain.steel.get(0, 0), 'steel tiles set');
  assert.ok(terrain.soft.get(1, 0), 'soft tiles set');
  assert.strictEqual(terrain.width, 3, 'terrain width derived from bitmap');
  assert.strictEqual(terrain.height, 2, 'terrain height derived from bitmap');
}

function testPortalSchedulingIsDeterministic() {
  const portals = normalizePortals([
    { id: 'A', entry: { x: 0, y: 0 }, exit: { x: 1, y: 1 }, cooldown: 5, maxUses: 3 },
  ]);

  assert.deepStrictEqual(portals[0].schedule, [0, 5, 10], 'portal schedule respects cooldown and count');
}

function testParseLevelAggregatesData() {
  const level = parseLevel({
    id: 'unit-test-level',
    name: 'Unit Test Level',
    tier: 'Training',
    timeLimit: 30,
    requiredSaves: 2,
    roles: { builder: 1 },
    spawn: { rate: 2, max: 3, offset: 1 },
    terrain: { legend: { x: 'soft', '.': 'empty' }, bitmap: ['x.'] },
    portals: [
      { id: 'A', entry: { x: 0, y: 0 }, exit: { x: 1, y: 0 }, cooldown: 4, maxUses: 2 },
    ],
    hazards: [{ type: 'fire', area: { x1: 0, y1: 0, x2: 1, y2: 1 } }],
  });

  assert.strictEqual(level.spawnSchedule[0], 1, 'spawn offset applied');
  assert.strictEqual(level.spawnSchedule[1], 3, 'spawn rate applied');
  assert.strictEqual(level.requiredSaves, 2, 'required saves surfaced');
  assert.strictEqual(level.timeLimit, 30, 'time limit surfaced');
  assert.strictEqual(level.roles.builder, 1, 'role quota surfaced');
  assert.strictEqual(level.portals[0].schedule[1], 4, 'portal cooldown schedule applied');
  assert.strictEqual(level.hazards.length, 1, 'hazards included');
}

function testLoadLevelFromDisk() {
  const levelPath = path.join(__dirname, '../../../levels/training-ground.json');
  const level = loadLevelFromFile(levelPath);

  assert.strictEqual(level.name, 'Training Ground', 'name parsed from disk');
  assert.strictEqual(level.spawnSchedule.length, 10, 'spawn count used for deterministic schedule');
  assert.strictEqual(level.portals[0].schedule[2], 10, 'portal rate applied to schedule');
  assert.ok(level.terrain.isSolid(0, 0), 'terrain hydrated from bitmap');
  assert.strictEqual(level.requiredSaves, 6, 'required saves parsed');
}

function run() {
  testBuildDeterministicSchedule();
  testHydrateTerrainFromBitmap();
  testPortalSchedulingIsDeterministic();
  testParseLevelAggregatesData();
  testLoadLevelFromDisk();
  console.log('level loader tests passed');
}

run();
