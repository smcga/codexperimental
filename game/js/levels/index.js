'use strict';

const training = require('../../levels/training-ground.json');
const intermediate = require('../../levels/intermediate-crossroads.json');
const advanced = require('../../levels/advanced-foundry.json');
const expert = require('../../levels/expert-gauntlet.json');

const chapters = [
  {
    tier: 'Training',
    description: 'Tutorial pacing with gentle quotas and ample time.',
    levels: [training],
  },
  {
    tier: 'Intermediate',
    description: 'Introduces parallel routing and alternating portals.',
    levels: [intermediate],
  },
  {
    tier: 'Advanced',
    description: 'Resource juggling with moving hazards and compressed timers.',
    levels: [advanced],
  },
  {
    tier: 'Expert',
    description: 'Tight quotas, mirrored portals, and unforgiving hazards.',
    levels: [expert],
  },
];

module.exports = chapters;
