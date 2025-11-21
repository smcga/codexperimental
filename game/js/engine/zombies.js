'use strict';

const STATES = {
  WALK: 'walk',
  TURN: 'turn',
  FALL: 'fall',
  CLIMB: 'climb',
  FLOAT: 'float',
  DIG: 'dig',
  BUILD: 'build',
  EXPLODE: 'explode',
};

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

class Zombie {
  constructor(id, { x = 0, y = 0, direction = 1 } = {}) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.state = STATES.WALK;
    this.role = null;
    this.verticalSpeed = 0;
    this.grounded = false;
    this.alive = true;
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
    const terrain = context.terrain;

    if (this.state === STATES.EXPLODE) {
      this.alive = false;
      return;
    }

    const aheadX = this.x + this.direction;
    const belowY = this.y + 1;
    const groundAhead = terrain && terrain.isSolid(aheadX, this.y);
    const groundBelow = terrain && terrain.isSolid(this.x, belowY);

    if (!groundBelow && this.state !== STATES.FLOAT) {
      this.state = STATES.FALL;
      this.verticalSpeed += (context.gravity || 1) * (context.delta || 1);
      this.y += this.verticalSpeed;
      if (groundBelow) {
        this.state = STATES.WALK;
        this.verticalSpeed = 0;
      }
      return;
    }

    switch (this.state) {
      case STATES.WALK:
        if (groundAhead) {
          this.state = STATES.TURN;
          this.direction *= -1;
        } else {
          this.x += this.direction;
        }
        break;
      case STATES.CLIMB:
        if (groundAhead) {
          this.y -= 1;
        } else {
          this.state = STATES.WALK;
        }
        break;
      case STATES.FLOAT:
        this.verticalSpeed = Math.max(0.2, this.verticalSpeed * 0.5);
        this.y += this.verticalSpeed;
        if (groundBelow) {
          this.state = STATES.WALK;
          this.verticalSpeed = 0;
        }
        break;
      case STATES.DIG:
        if (terrain) {
          terrain.applyDigger(this.x, this.y, 1);
          this.y += 1;
        }
        break;
      case STATES.BUILD:
        if (terrain) {
          terrain.applyBuilder(this.x, this.y, 1, 0);
          this.x += this.direction;
        }
        break;
      case STATES.TURN:
        this.direction = this.direction === 0 ? 0 : this.direction;
        this.state = this.direction === 0 ? STATES.TURN : STATES.WALK;
        break;
      default:
        this.state = STATES.WALK;
        break;
    }
  }
}

module.exports = { STATES, Zombie, createQuotaTracker };
