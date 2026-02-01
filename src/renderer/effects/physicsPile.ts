import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type Vec2 = {
  x: number;
  y: number;
};

type Body = {
  position: Vec2;
  velocity: Vec2;
  angle: number;
  angularVelocity: number;
  width: number;
  height: number;
  halfWidth: number;
  halfHeight: number;
  invMass: number;
  invInertia: number;
  restitution: number;
  friction: number;
  axes: [Vec2, Vec2];
  corners: [Vec2, Vec2, Vec2, Vec2];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type Contact = {
  bodyA: Body;
  bodyB: Body;
  normalX: number;
  normalY: number;
  penetration: number;
  pointX: number;
  pointY: number;
  restitution: number;
  friction: number;
};

type SpawnMode = "pile" | "rain";

type WorldConfig = {
  count: number;
  width: number;
  height: number;
  restitution: number;
  friction: number;
  gravity: number;
  seed?: number;
  spawnMode: SpawnMode;
};

const DEFAULT_FIXED_STEP = 1 / 120;
const MAX_SUBSTEPS = 6;
const MAX_CONTACTS = 1200;
const SOLVER_ITERATIONS = 6;
const POSITION_CORRECTION_PERCENT = 0.6;
const POSITION_CORRECTION_SLOP = 0.01;
const LINEAR_DAMPING = 0.995;
const ANGULAR_DAMPING = 0.995;

const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967295;
  };
};

const clamp01 = (value: number): number => clamp(value, 0, 1);

const dot = (ax: number, ay: number, bx: number, by: number): number => ax * bx + ay * by;

const setVec2 = (target: Vec2, x: number, y: number): Vec2 => {
  target.x = x;
  target.y = y;
  return target;
};

const resolveSpawnMode = (params: Record<string, unknown>): SpawnMode =>
  params.spawnMode === "rain" ? "rain" : "pile";

const resolveSeed = (params: Record<string, unknown>): number | undefined => {
  const seed = params.seed;
  return typeof seed === "number" && Number.isFinite(seed) ? seed : undefined;
};

const createVec2 = (): Vec2 => ({ x: 0, y: 0 });

const createBody = (width: number, height: number, mass: number): Body => {
  const invMass = mass > 0 ? 1 / mass : 0;
  const inertia = mass > 0 ? (mass * (width * width + height * height)) / 12 : 0;
  const invInertia = inertia > 0 ? 1 / inertia : 0;
  return {
    position: createVec2(),
    velocity: createVec2(),
    angle: 0,
    angularVelocity: 0,
    width,
    height,
    halfWidth: width / 2,
    halfHeight: height / 2,
    invMass,
    invInertia,
    restitution: 0.2,
    friction: 0.6,
    axes: [createVec2(), createVec2()],
    corners: [createVec2(), createVec2(), createVec2(), createVec2()],
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0
  };
};

const updateBodyShape = (body: Body): void => {
  const cos = Math.cos(body.angle);
  const sin = Math.sin(body.angle);
  const axisX = body.axes[0];
  const axisY = body.axes[1];
  axisX.x = cos;
  axisX.y = sin;
  axisY.x = -sin;
  axisY.y = cos;
  const hx = body.halfWidth;
  const hy = body.halfHeight;
  const ux = axisX.x * hx;
  const uy = axisX.y * hx;
  const vx = axisY.x * hy;
  const vy = axisY.y * hy;
  const cx = body.position.x;
  const cy = body.position.y;

  const c0 = body.corners[0];
  const c1 = body.corners[1];
  const c2 = body.corners[2];
  const c3 = body.corners[3];

  c0.x = cx - ux - vx;
  c0.y = cy - uy - vy;
  c1.x = cx + ux - vx;
  c1.y = cy + uy - vy;
  c2.x = cx + ux + vx;
  c2.y = cy + uy + vy;
  c3.x = cx - ux + vx;
  c3.y = cy - uy + vy;

  let minX = c0.x;
  let maxX = c0.x;
  let minY = c0.y;
  let maxY = c0.y;
  if (c1.x < minX) minX = c1.x;
  if (c2.x < minX) minX = c2.x;
  if (c3.x < minX) minX = c3.x;
  if (c1.x > maxX) maxX = c1.x;
  if (c2.x > maxX) maxX = c2.x;
  if (c3.x > maxX) maxX = c3.x;
  if (c1.y < minY) minY = c1.y;
  if (c2.y < minY) minY = c2.y;
  if (c3.y < minY) minY = c3.y;
  if (c1.y > maxY) maxY = c1.y;
  if (c2.y > maxY) maxY = c2.y;
  if (c3.y > maxY) maxY = c3.y;
  body.minX = minX;
  body.maxX = maxX;
  body.minY = minY;
  body.maxY = maxY;
};

export class PhysicsWorld {
  private bodies: Body[] = [];
  private contacts: Contact[] = [];
  private contactCount = 0;
  private width = 0;
  private height = 0;
  private gravity = 900;
  private restitution = 0.25;
  private friction = 0.6;
  private accumulator = 0;
  private lastTime = 0;
  private readonly fixedStep = DEFAULT_FIXED_STEP;
  private readonly tempVecA: Vec2 = createVec2();
  private readonly tempVecB: Vec2 = createVec2();
  private readonly staticBody: Body = createBody(0, 0, 0);

  constructor(config: WorldConfig) {
    this.reset(config);
  }

  reset(config: WorldConfig): void {
    this.width = config.width;
    this.height = config.height;
    this.gravity = config.gravity;
    this.restitution = config.restitution;
    this.friction = config.friction;
    this.accumulator = 0;
    this.lastTime = 0;
    this.bodies = [];

    const random = config.seed !== undefined ? mulberry32(config.seed) : Math.random;
    const count = config.count;
    for (let i = 0; i < count; i += 1) {
      const size = 24 + random() * 36;
      const body = createBody(size, size * (0.6 + random() * 0.8), size * size * 0.01);
      body.restitution = this.restitution;
      body.friction = this.friction;
      if (config.spawnMode === "rain") {
        body.position.x = size + random() * (this.width - size * 2);
        body.position.y = -random() * this.height * 0.5 - size * 2;
      } else {
        body.position.x = this.width * 0.5 + (random() - 0.5) * this.width * 0.25;
        body.position.y = this.height * 0.35 + (random() - 0.5) * this.height * 0.2;
      }
      body.angle = (random() - 0.5) * 0.6;
      body.velocity.x = (random() - 0.5) * 30;
      body.velocity.y = (random() - 0.5) * 30;
      body.angularVelocity = (random() - 0.5) * 0.5;
      updateBodyShape(body);
      this.bodies.push(body);
    }

    if (this.contacts.length === 0) {
      for (let i = 0; i < MAX_CONTACTS; i += 1) {
        this.contacts.push({
          bodyA: this.staticBody,
          bodyB: this.staticBody,
          normalX: 0,
          normalY: 0,
          penetration: 0,
          pointX: 0,
          pointY: 0,
          restitution: 0,
          friction: 0
        });
      }
    }
  }

  setMaterial(restitution: number, friction: number): void {
    this.restitution = restitution;
    this.friction = friction;
    for (let i = 0; i < this.bodies.length; i += 1) {
      const body = this.bodies[i];
      body.restitution = restitution;
      body.friction = friction;
    }
  }

  setGravity(gravity: number): void {
    this.gravity = gravity;
  }

  getBodies(): Body[] {
    return this.bodies;
  }

  stepToTime(time: number): void {
    if (this.lastTime === 0) {
      this.lastTime = time;
      return;
    }
    const dt = clamp(time - this.lastTime, 0, 0.05);
    this.lastTime = time;
    this.accumulator += dt;
    let substeps = 0;
    while (this.accumulator >= this.fixedStep && substeps < MAX_SUBSTEPS) {
      this.step(this.fixedStep);
      this.accumulator -= this.fixedStep;
      substeps += 1;
    }
    if (substeps === MAX_SUBSTEPS) {
      this.accumulator = 0;
    }
  }

  step(dt: number): void {
    const bodies = this.bodies;
    for (let i = 0; i < bodies.length; i += 1) {
      const body = bodies[i];
      body.velocity.y += this.gravity * dt;
      body.velocity.x *= LINEAR_DAMPING;
      body.velocity.y *= LINEAR_DAMPING;
      body.angularVelocity *= ANGULAR_DAMPING;
      body.position.x += body.velocity.x * dt;
      body.position.y += body.velocity.y * dt;
      body.angle += body.angularVelocity * dt;
      updateBodyShape(body);
    }

    this.contactCount = 0;
    for (let i = 0; i < bodies.length; i += 1) {
      for (let j = i + 1; j < bodies.length; j += 1) {
        if (this.contactCount >= this.contacts.length) {
          break;
        }
        const contact = this.contacts[this.contactCount];
        if (this.testOBB(bodies[i], bodies[j], contact)) {
          this.contactCount += 1;
        }
      }
    }

    for (let i = 0; i < bodies.length; i += 1) {
      if (this.contactCount >= this.contacts.length) {
        break;
      }
      this.testWalls(bodies[i]);
    }

    for (let iteration = 0; iteration < SOLVER_ITERATIONS; iteration += 1) {
      for (let i = 0; i < this.contactCount; i += 1) {
        this.resolveContact(this.contacts[i]);
      }
    }

    for (let i = 0; i < this.contactCount; i += 1) {
      this.correctPositions(this.contacts[i]);
    }

    for (let i = 0; i < bodies.length; i += 1) {
      updateBodyShape(bodies[i]);
    }
  }

  applyRadialImpulse(cx: number, cy: number, strength: number): void {
    const bodies = this.bodies;
    for (let i = 0; i < bodies.length; i += 1) {
      const body = bodies[i];
      let dx = body.position.x - cx;
      let dy = body.position.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;
      dx /= dist;
      dy /= dist;
      const impulse = strength * body.invMass;
      body.velocity.x += dx * impulse;
      body.velocity.y += dy * impulse;
      body.angularVelocity += (dx - dy) * 0.2 * strength * body.invInertia;
    }
  }

  private testWalls(body: Body): void {
    if (body.minX < 0) {
      this.addWallContact(body, -1, 0, -body.minX);
    }
    if (body.maxX > this.width) {
      this.addWallContact(body, 1, 0, body.maxX - this.width);
    }
    if (body.minY < 0) {
      this.addWallContact(body, 0, -1, -body.minY);
    }
    if (body.maxY > this.height) {
      this.addWallContact(body, 0, 1, body.maxY - this.height);
    }
  }

  private addWallContact(body: Body, normalX: number, normalY: number, penetration: number): void {
    if (this.contactCount >= this.contacts.length) {
      return;
    }
    const contact = this.contacts[this.contactCount];
    const support = this.supportPoint(body, normalX, normalY, this.tempVecA);
    contact.bodyA = body;
    contact.bodyB = this.staticBody;
    contact.normalX = normalX;
    contact.normalY = normalY;
    contact.penetration = penetration;
    contact.pointX = support.x;
    contact.pointY = support.y;
    contact.restitution = body.restitution;
    contact.friction = body.friction;
    this.contactCount += 1;
  }

  private testOBB(bodyA: Body, bodyB: Body, contact: Contact): boolean {
    let minOverlap = Infinity;
    let normalX = 0;
    let normalY = 0;
    for (let i = 0; i < 4; i += 1) {
      const axis =
        i < 2
          ? bodyA.axes[i]
          : bodyB.axes[i === 2 ? 0 : 1];
      let minA = Infinity;
      let maxA = -Infinity;
      let minB = Infinity;
      let maxB = -Infinity;
      for (let j = 0; j < bodyA.corners.length; j += 1) {
        const corner = bodyA.corners[j];
        const projection = dot(corner.x, corner.y, axis.x, axis.y);
        if (projection < minA) minA = projection;
        if (projection > maxA) maxA = projection;
      }
      for (let j = 0; j < bodyB.corners.length; j += 1) {
        const corner = bodyB.corners[j];
        const projection = dot(corner.x, corner.y, axis.x, axis.y);
        if (projection < minB) minB = projection;
        if (projection > maxB) maxB = projection;
      }
      const overlap = Math.min(maxA, maxB) - Math.max(minA, minB);
      if (overlap <= 0) {
        return false;
      }
      if (overlap < minOverlap) {
        minOverlap = overlap;
        normalX = axis.x;
        normalY = axis.y;
      }
    }

    const dx = bodyB.position.x - bodyA.position.x;
    const dy = bodyB.position.y - bodyA.position.y;
    if (dx * normalX + dy * normalY < 0) {
      normalX = -normalX;
      normalY = -normalY;
    }

    const supportA = this.supportPoint(bodyA, normalX, normalY, this.tempVecA);
    const supportB = this.supportPoint(bodyB, -normalX, -normalY, this.tempVecB);
    contact.bodyA = bodyA;
    contact.bodyB = bodyB;
    contact.normalX = normalX;
    contact.normalY = normalY;
    contact.penetration = minOverlap;
    contact.pointX = (supportA.x + supportB.x) * 0.5;
    contact.pointY = (supportA.y + supportB.y) * 0.5;
    contact.restitution = Math.min(bodyA.restitution, bodyB.restitution);
    contact.friction = Math.sqrt(bodyA.friction * bodyB.friction);
    return true;
  }

  private supportPoint(body: Body, dirX: number, dirY: number, out: Vec2): Vec2 {
    let bestDot = -Infinity;
    let bestX = 0;
    let bestY = 0;
    for (let i = 0; i < body.corners.length; i += 1) {
      const corner = body.corners[i];
      const projection = dot(corner.x, corner.y, dirX, dirY);
      if (projection > bestDot) {
        bestDot = projection;
        bestX = corner.x;
        bestY = corner.y;
      }
    }
    return setVec2(out, bestX, bestY);
  }

  private resolveContact(contact: Contact): void {
    const bodyA = contact.bodyA;
    const bodyB = contact.bodyB;
    const invMassA = bodyA.invMass;
    const invMassB = bodyB.invMass;
    const invInertiaA = bodyA.invInertia;
    const invInertiaB = bodyB.invInertia;
    const normalX = contact.normalX;
    const normalY = contact.normalY;

    const raX = contact.pointX - bodyA.position.x;
    const raY = contact.pointY - bodyA.position.y;
    const rbX = contact.pointX - bodyB.position.x;
    const rbY = contact.pointY - bodyB.position.y;

    const velAX = bodyA.velocity.x - bodyA.angularVelocity * raY;
    const velAY = bodyA.velocity.y + bodyA.angularVelocity * raX;
    const velBX = bodyB.velocity.x - bodyB.angularVelocity * rbY;
    const velBY = bodyB.velocity.y + bodyB.angularVelocity * rbX;
    const relVelX = velBX - velAX;
    const relVelY = velBY - velAY;
    const velAlongNormal = relVelX * normalX + relVelY * normalY;

    if (velAlongNormal > 0) {
      return;
    }

    const raCrossN = raX * normalY - raY * normalX;
    const rbCrossN = rbX * normalY - rbY * normalX;
    const invMassSum = invMassA + invMassB + raCrossN * raCrossN * invInertiaA + rbCrossN * rbCrossN * invInertiaB;
    if (invMassSum <= 0) {
      return;
    }

    const restitution = contact.restitution;
    const j = (-(1 + restitution) * velAlongNormal) / invMassSum;
    const impulseX = normalX * j;
    const impulseY = normalY * j;

    bodyA.velocity.x -= impulseX * invMassA;
    bodyA.velocity.y -= impulseY * invMassA;
    bodyA.angularVelocity -= (raX * impulseY - raY * impulseX) * invInertiaA;

    bodyB.velocity.x += impulseX * invMassB;
    bodyB.velocity.y += impulseY * invMassB;
    bodyB.angularVelocity += (rbX * impulseY - rbY * impulseX) * invInertiaB;

    const tangentX = relVelX - normalX * velAlongNormal;
    const tangentY = relVelY - normalY * velAlongNormal;
    const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
    if (tangentLen <= 0.00001) {
      return;
    }

    const tX = tangentX / tangentLen;
    const tY = tangentY / tangentLen;
    const raCrossT = raX * tY - raY * tX;
    const rbCrossT = rbX * tY - rbY * tX;
    const invMassTan = invMassA + invMassB + raCrossT * raCrossT * invInertiaA + rbCrossT * rbCrossT * invInertiaB;
    if (invMassTan <= 0) {
      return;
    }
    let jt = -(relVelX * tX + relVelY * tY) / invMassTan;
    const maxFriction = j * contact.friction;
    jt = clamp(jt, -maxFriction, maxFriction);

    const frictionImpulseX = tX * jt;
    const frictionImpulseY = tY * jt;

    bodyA.velocity.x -= frictionImpulseX * invMassA;
    bodyA.velocity.y -= frictionImpulseY * invMassA;
    bodyA.angularVelocity -= (raX * frictionImpulseY - raY * frictionImpulseX) * invInertiaA;

    bodyB.velocity.x += frictionImpulseX * invMassB;
    bodyB.velocity.y += frictionImpulseY * invMassB;
    bodyB.angularVelocity += (rbX * frictionImpulseY - rbY * frictionImpulseX) * invInertiaB;
  }

  private correctPositions(contact: Contact): void {
    const bodyA = contact.bodyA;
    const bodyB = contact.bodyB;
    const invMassA = bodyA.invMass;
    const invMassB = bodyB.invMass;
    const invMassSum = invMassA + invMassB;
    if (invMassSum <= 0) {
      return;
    }
    const correctionMagnitude =
      Math.max(contact.penetration - POSITION_CORRECTION_SLOP, 0) * (POSITION_CORRECTION_PERCENT / invMassSum);
    const correctionX = contact.normalX * correctionMagnitude;
    const correctionY = contact.normalY * correctionMagnitude;
    bodyA.position.x -= correctionX * invMassA;
    bodyA.position.y -= correctionY * invMassA;
    bodyB.position.x += correctionX * invMassB;
    bodyB.position.y += correctionY * invMassB;
  }
}

export class PhysicsPileEffect implements Effect {
  private world: PhysicsWorld | null = null;
  private width = 0;
  private height = 0;
  private count = 0;
  private seed?: number;
  private spawnMode: SpawnMode = "pile";

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const count = Math.round(clamp(params.count ?? 18, 5, 40));
    const restitution = clamp01(params.restitution ?? 0.25);
    const friction = clamp01(params.friction ?? 0.6);
    const gravityBase = params.gravity ?? 900;
    const beatImpulse = params.beatImpulse ?? 250;
    const trail = clamp01(params.trail ?? 0.2);
    const spawnMode = resolveSpawnMode(params as Record<string, unknown>);
    const seed = resolveSeed(params as Record<string, unknown>);

    const needsReset =
      !this.world ||
      this.width !== width ||
      this.height !== height ||
      this.count !== count ||
      this.seed !== seed ||
      this.spawnMode !== spawnMode;

    if (needsReset) {
      this.world = new PhysicsWorld({
        count,
        width,
        height,
        restitution,
        friction,
        gravity: gravityBase,
        seed,
        spawnMode
      });
      this.width = width;
      this.height = height;
      this.count = count;
      this.seed = seed;
      this.spawnMode = spawnMode;
    }

    const world = this.world;
    if (!world) {
      return;
    }

    const bass = audio?.bass ?? 0;
    const gravity = gravityBase * (1 + bass * 0.25);
    world.setGravity(gravity);
    world.setMaterial(restitution, friction);
    world.stepToTime(time);

    if (audio?.beat || (audio?.beatStrength ?? 0) > 0.2) {
      const strength = beatImpulse * (0.5 + (audio?.beatStrength ?? 0));
      world.applyRadialImpulse(width * 0.5, height * 0.4, strength);
    }

    ctx.globalAlpha = trail;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    const bodies = world.getBodies();
    ctx.lineWidth = 2;
    for (let i = 0; i < bodies.length; i += 1) {
      const body = bodies[i];
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);
      ctx.fillStyle = "rgba(140, 196, 255, 0.8)";
      ctx.strokeStyle = "rgba(20, 40, 60, 0.85)";
      ctx.beginPath();
      ctx.rect(-body.halfWidth, -body.halfHeight, body.width, body.height);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  reset(): void {
    this.world = null;
  }
}
