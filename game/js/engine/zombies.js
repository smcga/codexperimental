'use strict';

const { evaluateHazardCollision } = require('./hazards');
const { RoleManager } = require('./roles');

const STATES = {
  WALK: 'walk',
  TURN: 'turn',
  FALL: 'fall',
  CLIMB: 'climb',
  FLOAT: 'float',
  DIG: 'dig',
  BASH: 'bash',
  MINE: 'mine',
  BUILD: 'build',
  BLOCK: 'block',
  EXPLODE: 'explode',
  DEAD: 'dead',
  EXIT: 'exit',
};

const ANIMATIONS = {
  WALK: 'walk',
  TURN: 'turn',
  FALL: 'fall',
  CLIMB: 'climb',
  FLOAT: 'float',
  DIG: 'dig',
  BUILD: 'build',
  BLOCK: 'block',
  EXPLODE: 'explode',
  DEAD: 'dead',
  EXIT: 'exit',
};

const SKIN_VARIANTS = ['mint', 'violet', 'amber', 'teal'];

const ROLE_TO_STATE = {
  digger: STATES.DIG,
  basher: STATES.BASH,
  miner: STATES.MINE,
  builder: STATES.BUILD,
  floater: STATES.FLOAT,
  bomber: STATES.EXPLODE,
  blocker: STATES.BLOCK,
  climber: STATES.WALK,
};

const ROLE_DEFAULTS = {
  diggerDepth: 8,
  basherLength: 8,
  basherHeight: 2,
  minerLength: 8,
  builderSteps: 8,
  bomberFuse: 4,
  explosionRadius: 1,
  floatGravityScale: 0.3,
  floatTerminalVelocity: 1.5,
};

function createQuotaTracker(level) {
  return new RoleManager(level || {});
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
    this.roleData = {};
  }

  assignRole(role, quotaTracker) {
    if (!quotaTracker || !quotaTracker.use(role)) {
      return false;
    }
    this.role = role;
    if (ROLE_TO_STATE[role]) {
      this.state = ROLE_TO_STATE[role];
    }
    this._initialiseRoleData(role);
    return true;
  }

  update(context = {}) {
    if (!this.alive) return;

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
      blockers = new Map(),
      onExplosion,
    } = context;

    const hazardStatus = evaluateHazardCollision(this, hazards);
    if (hazardStatus.killed) {
      this._die(onDeath, hazardStatus.hazard);
      return;
    }

    if (hazardStatus.deflected) {
      this._turnAround();
    }

    if (this.state === STATES.EXPLODE) {
      const explosion = this._updateBomber(delta, terrain, onExplosion);
      if (explosion) return explosion;
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
    const obstacleAhead = blockers.has(`${aheadX}:${this.y}`);
    const groundAhead = terrain && terrain.isSolid(aheadX, this.y);
    const groundBelow = terrain && terrain.isSolid(this.x, belowY);

    if (!groundBelow && this.state !== STATES.FLOAT && this.state !== STATES.BUILD) {
      this._enterFallState();
      this._applyFall(gravity, terminalVelocity, delta, ROLE_DEFAULTS.floatTerminalVelocity);
      return;
    }

    if (this.state === STATES.FLOAT && !groundBelow) {
      this._applyFall(
        gravity * ROLE_DEFAULTS.floatGravityScale,
        ROLE_DEFAULTS.floatTerminalVelocity,
        delta,
        ROLE_DEFAULTS.floatTerminalVelocity
      );
      this.animation = ANIMATIONS.FLOAT;
      this._updateFacing();
      return;
    }

    this.grounded = true;
    this.velocity.y = 0;

    switch (this.state) {
      case STATES.WALK:
        this._handleWalking(groundAhead || obstacleAhead, terrain);
        break;
      case STATES.CLIMB:
        this._handleClimb(groundAhead || obstacleAhead, terrain);
        break;
      case STATES.DIG:
        this._handleDigger(terrain);
        break;
      case STATES.BASH:
        this._handleBasher(terrain);
        break;
      case STATES.MINE:
        this._handleMiner(terrain);
        break;
      case STATES.BUILD:
        this._handleBuilder(terrain, obstacleAhead);
        break;
      case STATES.BLOCK:
        this._handleBlocker(terrain, groundBelow);
        break;
      case STATES.EXPLODE:
        this.animation = ANIMATIONS.EXPLODE;
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

  _clearRole() {
    this.role = null;
    if (this.state !== STATES.DEAD && this.state !== STATES.EXIT) {
      this.state = STATES.WALK;
      this.animation = ANIMATIONS.WALK;
    }
    this.roleData = {};
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

  _handleWalking(obstacleAhead, terrain) {
    if (this.role === 'climber' && obstacleAhead) {
      this._attemptClimb(terrain);
      return;
    }

    if (obstacleAhead) {
      this._turnAround();
      return;
    }

    this.velocity.x = this.direction;
    this.x += this.velocity.x;
    this.animation = ANIMATIONS.WALK;
  }

  _attemptClimb(terrain) {
    const aheadX = this.x + this.direction;
    const aboveY = this.y - 1;
    if (!terrain || aboveY < 0) {
      this._turnAround();
      return;
    }

    const overhangBlocked = terrain.isSolid(this.x, aboveY) || terrain.isSolid(aheadX, aboveY);
    const landingBlocked = terrain.isSolid(aheadX, this.y - 2);
    if (overhangBlocked || landingBlocked) {
      this._turnAround();
      return;
    }

    this.x = aheadX;
    this.y -= 1;
    this.state = STATES.CLIMB;
    this.animation = ANIMATIONS.CLIMB;
  }

  _handleClimb(obstacleAhead, terrain) {
    if (obstacleAhead) {
      this._attemptClimb(terrain);
      return;
    }
    this.state = STATES.WALK;
    this.animation = ANIMATIONS.WALK;
    this._handleWalking(false, terrain);
  }

  _enterFallState() {
    this.state = this.role === 'floater' ? STATES.FLOAT : STATES.FALL;
    this.animation = this.role === 'floater' ? ANIMATIONS.FLOAT : ANIMATIONS.FALL;
    this.grounded = false;
  }

  _applyFall(gravity, maxVelocity, delta, animationVelocityCap) {
    this.velocity.y = Math.min(maxVelocity, this.velocity.y + gravity * delta);
    this.y += this.velocity.y;
    if (animationVelocityCap && this.velocity.y > animationVelocityCap) {
      this.animation = ANIMATIONS.FALL;
    }
  }

  _handleDigger(terrain) {
    const targetY = this.y + 1;
    if (!terrain || terrain.isSteel(this.x, targetY)) {
      this._clearRole();
      return;
    }
    terrain.removeSoft(this.x, targetY);
    this.y = targetY;
    this.animation = ANIMATIONS.DIG;
    this.roleData.steps = (this.roleData.steps || ROLE_DEFAULTS.diggerDepth) - 1;
    if (this.roleData.steps <= 0) {
      this._clearRole();
    }
  }

  _handleBasher(terrain) {
    const targetX = this.x + this.direction;
    if (!terrain || terrain.isSteel(targetX, this.y)) {
      this._clearRole();
      return;
    }
    for (let dy = 0; dy < ROLE_DEFAULTS.basherHeight; dy += 1) {
      terrain.removeSoft(targetX, this.y - dy);
    }
    this.x = targetX;
    this.animation = ANIMATIONS.DIG;
    this.roleData.steps = (this.roleData.steps || ROLE_DEFAULTS.basherLength) - 1;
    if (this.roleData.steps <= 0) {
      this._clearRole();
    }
  }

  _handleMiner(terrain) {
    const targetX = this.x + this.direction;
    const targetY = this.y + 1;
    if (!terrain || terrain.isSteel(targetX, targetY)) {
      this._clearRole();
      return;
    }
    terrain.removeSoft(targetX, targetY);
    this.x = targetX;
    this.y = targetY;
    this.animation = ANIMATIONS.DIG;
    this.roleData.steps = (this.roleData.steps || ROLE_DEFAULTS.minerLength) - 1;
    if (this.roleData.steps <= 0) {
      this._clearRole();
    }
  }

  _handleBuilder(terrain, obstacleAhead) {
    if (!terrain) {
      this._clearRole();
      return;
    }
    const headBlocked = terrain.isSolid(this.x, this.y - 1);
    if (headBlocked || obstacleAhead) {
      this._clearRole();
      return;
    }
    const nextX = this.x + this.direction;
    const nextY = this.y - 1;
    if (terrain.isSolid(nextX, nextY)) {
      this._clearRole();
      return;
    }
    terrain.addSoft(nextX, nextY);
    this.x = nextX;
    this.y = nextY;
    this.animation = ANIMATIONS.BUILD;
    this.roleData.steps = (this.roleData.steps || ROLE_DEFAULTS.builderSteps) - 1;
    if (this.roleData.steps <= 0) {
      this._clearRole();
    }
  }

  _handleBlocker(terrain, groundBelow) {
    if (!groundBelow && terrain) {
      this._enterFallState();
      return;
    }
    this.direction = 0;
    this.velocity = { x: 0, y: 0 };
    this.animation = ANIMATIONS.BLOCK;
  }

  _updateBomber(delta, terrain, onExplosion) {
    this.roleData.fuse =
      typeof this.roleData.fuse === 'number'
        ? this.roleData.fuse - delta
        : ROLE_DEFAULTS.bomberFuse - delta;

    this.animation = ANIMATIONS.EXPLODE;

    if (this.roleData.fuse > 0) {
      return null;
    }

    this.alive = false;
    if (onExplosion) {
      onExplosion({
        x: this.x,
        y: this.y,
        radius: ROLE_DEFAULTS.explosionRadius,
        terrain,
      });
    }
    this._die();
    return { type: 'explosion', x: this.x, y: this.y, radius: ROLE_DEFAULTS.explosionRadius };
  }

  applyExplosion(explosion) {
    const dx = this.x - explosion.x;
    const dy = this.y - explosion.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= explosion.radius && this.alive) {
      this._die();
    }
    if (this.role === 'blocker' && distance <= explosion.radius) {
      this._clearRole();
    }
  }

  _initialiseRoleData(role) {
    this.roleData = {};
    if (role === 'bomber') {
      this.roleData.fuse = ROLE_DEFAULTS.bomberFuse;
      this.animation = ANIMATIONS.EXPLODE;
    }
    if (role === 'blocker') {
      this.state = STATES.BLOCK;
      this.animation = ANIMATIONS.BLOCK;
      this.direction = 0;
    }
  }
}

function updateHorde(zombies = [], context = {}) {
  const ordered = [...zombies].sort((a, b) => a.id - b.id);
  const blockerMap = new Map();
  ordered.forEach((zombie) => {
    if (zombie.role === 'blocker' && zombie.alive) {
      blockerMap.set(`${zombie.x}:${zombie.y}`, zombie.id);
    }
  });

  const explosions = [];
  ordered.forEach((zombie) => {
    const result = zombie.update(Object.assign({}, context, { blockers: blockerMap }));
    if (result && result.type === 'explosion') {
      explosions.push(result);
    }
  });

  if (explosions.length && context.terrain) {
    explosions.forEach((explosion) => {
      for (let dx = -explosion.radius; dx <= explosion.radius; dx += 1) {
        for (let dy = -explosion.radius; dy <= explosion.radius; dy += 1) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > explosion.radius) continue;
          context.terrain.removeSoft(explosion.x + dx, explosion.y + dy);
        }
      }
    });
  }

  explosions.forEach((explosion) => {
    ordered.forEach((zombie) => {
      if (zombie.alive || zombie.role === 'blocker') {
        zombie.applyExplosion(explosion);
      }
    });
  });
}

module.exports = { STATES, ANIMATIONS, SKIN_VARIANTS, Zombie, createQuotaTracker, updateHorde };
