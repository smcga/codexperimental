'use strict';

const fs = require('fs');
const path = require('path');
const { Terrain } = require('./terrain');
const { HAZARD_TYPES } = require('./hazards');

const DEFAULT_LEGEND = {
  '#': 'steel',
  'x': 'soft',
  '.': 'empty',
};

function buildDeterministicSchedule(rate = 1, count = 0, offset = 0) {
  const schedule = [];
  for (let i = 0; i < count; i += 1) {
    schedule.push(offset + i * rate);
  }
  return schedule;
}

function hydrateTerrain(terrainSpec = {}) {
  const legend = Object.assign({}, DEFAULT_LEGEND, terrainSpec.legend || {});
  const bitmap = terrainSpec.bitmap || [];

  if (!Array.isArray(bitmap) || bitmap.length === 0) {
    return new Terrain(0, 0);
  }

  const width = bitmap[0].length;
  const height = bitmap.length;
  const terrain = new Terrain(width, height);

  bitmap.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const cell = legend[row[x]] || 'empty';
      if (cell === 'soft') {
        terrain.addSoft(x, y);
      }
      if (cell === 'steel') {
        terrain.steel.set(x, y, true);
      }
    }
  });

  return terrain;
}

function normalizeHazards(rawHazards = []) {
  return rawHazards
    .filter((hazard) => hazard && HAZARD_TYPES.includes(hazard.type))
    .map((hazard) => ({
      type: hazard.type,
      area: hazard.area,
    }));
}

function normalizePortals(rawPortals = []) {
  return rawPortals.map((portal) => {
    const schedule = buildDeterministicSchedule(
      portal.rate || portal.cooldown || 1,
      portal.maxUses || 0,
      portal.offset || 0
    );

    return {
      id: portal.id,
      entry: portal.entry,
      exit: portal.exit,
      cooldown: portal.cooldown || 0,
      schedule,
    };
  });
}

function parseLevel(schema = {}) {
  const terrain = hydrateTerrain(schema.terrain);
  const spawn = Object.assign({ rate: 1, max: 0, offset: 0 }, schema.spawn || {});
  const spawnSchedule = buildDeterministicSchedule(spawn.rate, spawn.max, spawn.offset);

  return {
    id: schema.id,
    name: schema.name,
    terrain,
    portals: normalizePortals(schema.portals),
    hazards: normalizeHazards(schema.hazards),
    spawn,
    spawnSchedule,
    requiredSaves: schema.requiredSaves || 0,
    timeLimit: schema.timeLimit || 0,
    roles: schema.roles || {},
    tier: schema.tier || 'Training',
  };
}

function loadLevelFromFile(levelPath) {
  const resolved = path.resolve(levelPath);
  const raw = fs.readFileSync(resolved, 'utf8');
  const schema = JSON.parse(raw);
  return parseLevel(schema);
}

module.exports = {
  buildDeterministicSchedule,
  hydrateTerrain,
  normalizeHazards,
  normalizePortals,
  parseLevel,
  loadLevelFromFile,
};
