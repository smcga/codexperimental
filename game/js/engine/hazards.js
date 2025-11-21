'use strict';

const HAZARD_TYPES = ['fire', 'acid', 'pit', 'blades', 'pistons'];

function pointInArea(x, y, area) {
  return x >= area.x1 && x <= area.x2 && y >= area.y1 && y <= area.y2;
}

function evaluateHazardCollision(zombie, hazards = []) {
  for (const hazard of hazards) {
    if (!hazard || !hazard.area || !HAZARD_TYPES.includes(hazard.type)) continue;
    if (!pointInArea(zombie.x, zombie.y, hazard.area)) continue;

    if (zombie.role === 'blocker' && (hazard.type === 'blades' || hazard.type === 'pistons')) {
      return { killed: false, deflected: true, hazard };
    }

    return { killed: true, deflected: false, hazard };
  }

  return { killed: false, deflected: false, hazard: null };
}

module.exports = { HAZARD_TYPES, evaluateHazardCollision };
