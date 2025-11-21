'use strict';

const { evaluateHazardCollision } = require('./hazards');

const STATES = {
  WALK: 'walk',
  TURN: 'turn',
  FALL: 'fall',
  CLIMB: 'climb',
  FLOAT: 'float',
  DIG: 'dig',
  BUILD: 'build',
  EXPLODE: 'explode',
  DEAD: 'dead',
  EXIT: 'exit',
};

const ANIMATIONS = {
  WALK: 'walk',
  TURN: 'turn',
  FALL: 'fall',
  DEAD: 'dead',
  EXIT: 'exit',
};

const SKIN_VARIANTS = ['mint', 'violet', 'amber', 'teal'];

const ROLE_TO_STATE = {
  digger: STATES.DIG,
  builder: STATES.BUILD,
  floater: STATES.FLOAT,
  bomber: STATES.EXPLODE,
};

function createQuotaTracker(level) {
  const quotas = Object.assign(
    {
      digger: 0,
      builder: 0,
      floater: 0,
      bomber: 0,
      blocker: 0,
    },
    level && level.roles ? level.roles : {}
  );

  const consumed = {
    digger: 0,
    builder: 0,
    floater: 0,
    bomber: 0,
    blocker: 0,
  };

  return {
    canUse(role) {
      return consumed[role] < (quotas[role] || 0);
    },
    use(role) {
      if (!this.canUse(role)) return false;
      consumed[role] += 1;
      return true;
    },
    remaining(role) {
      return (quotas[role] || 0) - consumed[role];
    },
  };
}

function normalizePortals(portals = []) {
  return portals
    .map((portal) => {
      if (typeof portal.nextUseIndex !== 'number') {
        portal.nextUseIndex = 0;
      }
      return portal;
    })
    .sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
}

function portalAvailable(portal, tick = 0) {
  const { schedule = [], nextUseIndex = 0 } = portal;
  if (nextUseIndex >= schedule.length) return false;
  return tick >= schedule[nextUseIndex];
}

function zombieAtPortalEntry(zombie, portal) {
  return zombie.x === portal.entry.x && zombie.y === portal.entry.y;
}

class Zombie {
  constructor(id, { x = 0, y = 0, direction = 1, variant } = {}) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.direction = direction >= 0 ? 1 : -1;
    this.state = STATES.WALK;
    this.role = null;
    this.velocity = { x: 0, y: 0 };
    this.grounded = false;
    this.alive = true;
    this.exiting = false;
    this.animation = ANIMATIONS.WALK;
    this.variant = variant || SKIN_VARIANTS[id % SKIN_VARIANTS.length];
    this.facing = this.direction >= 0 ? 'right' : 'left';
  }

  assignRole(role, quotaTracker) {
    if (!quotaTracker || !quotaTracker.use(role)) {
      return false;
    }
    this.role = role;
    if (ROLE_TO_STATE[role]) {
      this.state = ROLE_TO_STATE[role];
    }
    if (role === 'blocker') {
      this.direction = 0;
      this.state = STATES.TURN;
    }
    return true;
  }

  update(context = {}) {
    if (!this.alive) return;
    if (this.state === STATES.EXPLODE) {
      this.alive = false;
      return;
    }

    const {
      terrain,
      hazards = [],
      portals = [],
      gravity = 1,
      terminalVelocity = 4,
      delta = 1,
      tick = 0,
      onExit,
      onDeath,
    } = context;

    const hazardStatus = evaluateHazardCollision(this, hazards);
    if (hazardStatus.killed) {
      this._die(onDeath, hazardStatus.hazard);
      return;
    }

    if (hazardStatus.deflected) {
      this._turnAround();
    }

    const orderedPortals = normalizePortals(portals);
    for (const portal of orderedPortals) {
      if (portalAvailable(portal, tick) && zombieAtPortalEntry(this, portal)) {
        portal.nextUseIndex += 1;
        this.x = portal.exit.x;
        this.y = portal.exit.y;
        this.state = STATES.EXIT;
        this.animation = ANIMATIONS.EXIT;
        this.exiting = true;
        this.velocity = { x: 0, y: 0 };
        if (onExit) onExit(this, portal);
        return;
      }
    }

    const aheadX = this.x + this.direction;
    const belowY = this.y + 1;
    const groundAhead = terrain && terrain.isSolid(aheadX, this.y);
    const groundBelow = terrain && terrain.isSolid(this.x, belowY);

    if (!groundBelow && this.state !== STATES.FLOAT) {
      this.state = STATES.FALL;
      this.animation = ANIMATIONS.FALL;
      this.velocity.y = Math.min(terminalVelocity, this.velocity.y + gravity * delta);
      this.y += this.velocity.y;
      this.grounded = false;
      this._updateFacing();
      return;
    }

    this.grounded = true;
    this.velocity.y = 0;

    switch (this.state) {
      case STATES.WALK:
        if (groundAhead) {
          this._turnAround();
        } else {
          this.velocity.x = this.direction * delta;
          this.x += this.velocity.x;
          this.animation = ANIMATIONS.WALK;
        }
        break;
      default:
        this.state = STATES.WALK;
        this.velocity.x = this.direction * delta;
        this.x += this.velocity.x;
        this.animation = ANIMATIONS.WALK;
        break;
    }

    this._updateFacing();

    const postMoveHazard = evaluateHazardCollision(this, hazards);
    if (postMoveHazard.killed) {
      this._die(onDeath, postMoveHazard.hazard);
    }
  }

  _turnAround() {
    this.direction = this.direction === 0 ? 0 : this.direction * -1;
    this.state = STATES.TURN;
    this.animation = ANIMATIONS.TURN;
    this.velocity.x = 0;
    this._updateFacing();
  }

  _die(callback, hazard) {
    this.alive = false;
    this.state = STATES.DEAD;
    this.animation = ANIMATIONS.DEAD;
    this.velocity = { x: 0, y: 0 };
    if (callback) callback(this, hazard);
  }

  _updateFacing() {
    this.facing = this.direction >= 0 ? 'right' : 'left';
  }
}

function updateHorde(zombies = [], context = {}) {
  const ordered = [...zombies].sort((a, b) => a.id - b.id);
  ordered.forEach((zombie) => zombie.update(context));
}

module.exports = { STATES, ANIMATIONS, SKIN_VARIANTS, Zombie, createQuotaTracker, updateHorde };
