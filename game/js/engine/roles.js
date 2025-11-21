'use strict';

const DEFAULT_ROLE_QUOTAS = {
  blocker: 0,
  digger: 0,
  basher: 0,
  miner: 0,
  builder: 0,
  floater: 0,
  bomber: 0,
  climber: 0,
};

function hitTestZombie(zombie, x, y) {
  if (!zombie || !zombie.alive) return false;
  return zombie.x === x && zombie.y === y;
}

class RoleManager {
  constructor(level = {}) {
    this.quotas = Object.assign({}, DEFAULT_ROLE_QUOTAS, level.roles || {});
    this.consumed = Object.keys(DEFAULT_ROLE_QUOTAS).reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});
    this.selectedRole = null;
  }

  canUse(role) {
    if (!role) return false;
    const quota = this.quotas[role] || 0;
    return this.consumed[role] < quota;
  }

  use(role) {
    if (!this.canUse(role)) return false;
    this.consumed[role] += 1;
    return true;
  }

  remaining(role) {
    const quota = this.quotas[role] || 0;
    return quota - this.consumed[role];
  }

  select(role) {
    this.selectedRole = role;
  }

  assignToZombie(zombie, role) {
    if (!zombie || !role) return false;
    return zombie.assignRole(role, this);
  }

  assignAtPosition(zombies, x, y, roleOverride = null) {
    const role = roleOverride || this.selectedRole;
    if (!role) return false;
    const target = (zombies || []).find((z) => hitTestZombie(z, x, y));
    if (!target) return false;
    return this.assignToZombie(target, role);
  }
}

module.exports = { DEFAULT_ROLE_QUOTAS, RoleManager, hitTestZombie };
