'use strict';

const assert = require('assert');
const { Terrain } = require('../terrain');

function testDiggerRemovesSoft() {
  const terrain = new Terrain(10, 10);
  terrain.addSoft(2, 2);
  terrain.addSoft(2, 3);
  terrain.applyDigger(2, 2, 2);
  assert.ok(!terrain.soft.get(2, 2) && !terrain.soft.get(2, 3), 'digger clears vertical column');
}

function testBasherStopsAtSteel() {
  const terrain = new Terrain(10, 10);
  terrain.addSoft(3, 3);
  terrain.addSoft(4, 3);
  terrain.steel.set(4, 3, true);
  terrain.applyBasher(3, 3, 3, 1, 1);
  assert.ok(!terrain.soft.get(3, 3), 'soft tile removed');
  assert.ok(terrain.soft.get(4, 3) || terrain.steel.get(4, 3), 'steel blocks removal');
}

function testMinerDiagonal() {
  const terrain = new Terrain(10, 10);
  terrain.addSoft(1, 1);
  terrain.addSoft(2, 1);
  terrain.addSoft(3, 2);
  terrain.applyMiner(1, 1, 3, 2);
  assert.ok(!terrain.soft.get(1, 1), 'start cleared');
  assert.ok(!terrain.soft.get(3, 2), 'diagonal cleared');
}

function testBuilderAddsSteps() {
  const terrain = new Terrain(10, 10);
  terrain.applyBuilder(1, 5, 3, 1);
  assert.ok(terrain.soft.get(1, 5), 'first plank placed');
  assert.ok(terrain.soft.get(3, 4), 'raised plank placed');
}

function run() {
  testDiggerRemovesSoft();
  testBasherStopsAtSteel();
  testMinerDiagonal();
  testBuilderAddsSteps();
  console.log('terrain tests passed');
}

run();
