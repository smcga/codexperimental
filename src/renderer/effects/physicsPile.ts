import { Effect, EffectRenderContext } from "./types";
import { clamp } from "../../util/math";

type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  width: number;
  height: number;
  halfW: number;
  halfH: number;
  invMass: number;
  invInertia: number;
  restitution: number;
  friction: number;
  axisXx: number;
  axisXy: number;
  axisYx: number;
  axisYy: number;
  fill: string;
  stroke: string;
  render: boolean;
};

type Contact = {
  a: Body;
  b: Body | null;
  nx: number;
  ny: number;
  px: number;
  py: number;
  penetration: number;
  restitution: number;
  friction: number;
};

type Joint = {
  a: Body;
  b: Body;
  restLength: number;
  stiffness: number;
  damping: number;
};

type ShatterParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
};

type SpawnMode = "pile" | "rain";
type KickOriginMode = "center" | "floorCenter" | "random";

const MAX_BODIES = 40;
const MAX_CONTACTS = 2000;
const FIXED_STEP = 1 / 120;
const MAX_SUB_STEPS = 6;
const SOLVER_ITERATIONS = 6;
const GRAVITY_AUDIO_SCALE = 0.35;
const POSITION_SLOP = 0.01;
const POSITION_PERCENT = 0.2;
const IMPACT_STRENGTH_SCALE = 0.02;
const JOINT_STIFFNESS = 0.45;
const JOINT_DAMPING = 0.12;
const SHATTER_DURATION = 0.8;
const SHATTER_PARTICLES_PER_BODY = 5;

const PALETTE = [
  { fill: "#1b263b", stroke: "#f77f00" },
  { fill: "#0b132b", stroke: "#5bc0eb" },
  { fill: "#212d40", stroke: "#f4d35e" },
  { fill: "#1f1d2b", stroke: "#d90429" },
  { fill: "#111827", stroke: "#60a5fa" },
  { fill: "#0f172a", stroke: "#f472b6" }
];

const DEFAULT_TRAIL = 0.2;
const DEFAULT_COUNT = 18;
const DEFAULT_KICK_IMPULSE = 250;

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let result = Math.imul(t ^ (t >>> 15), t | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function resolveSpawnMode(value: unknown): SpawnMode {
  return value === "rain" ? "rain" : "pile";
}

function resolveKickOriginMode(value: unknown): KickOriginMode {
  if (value === "center" || value === "random" || value === "floorCenter") {
    return value;
  }
  return "floorCenter";
}

function resolveNumberParam(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export class PhysicsWorld {
  bodies: Body[] = [];
  contacts: Contact[] = [];
  joints: Joint[] = [];
  contactCount = 0;
  width: number;
  height: number;
  gravity: number;
  accumulator = 0;
  lastTime = 0;
  impactStrength = 0;
  wreckingBall: Body | null = null;
  wreckingAnchor: Body | null = null;
  wreckingTriggered = false;
  beatLoosenTimer = 0;
  loosenDuration = 0.18;
  loosenFrictionMult = 0.25;
  loosenRestitutionAdd = 0.35;
  loosenPosCorrMult = 0.35;
  loosenExtraSlop = 1.5;
  sepBiasRad = (10 * Math.PI) / 180;
  kickRadius = 0;
  scatterAngleRad = (25 * Math.PI) / 180;
  scatterJitter = 0.35;
  kickUpBias = 0.35;
  kickTorque = 35;
  maxLinVel = 1800;
  maxAngVel = 18;
  kickOriginMode: KickOriginMode = "floorCenter";
  kickOriginY: number | null = null;
  loosenActive = false;
  private rng: () => number = Math.random;
  private tempSpawnBody: Body = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVelocity: 0,
    width: 0,
    height: 0,
    halfW: 0,
    halfH: 0,
    invMass: 0,
    invInertia: 0,
    restitution: 0,
    friction: 0,
    axisXx: 1,
    axisXy: 0,
    axisYx: 0,
    axisYy: 1,
    fill: "",
    stroke: "",
    render: false
  };
  private tempOverlap = { nx: 0, ny: 0, penetration: 0 };
  private tempSupportA = { x: 0, y: 0 };
  private tempSupportB = { x: 0, y: 0 };
  private tempSupportWall = { x: 0, y: 0 };

  constructor(width: number, height: number, gravity: number) {
    this.width = width;
    this.height = height;
    this.gravity = gravity;
    for (let i = 0; i < MAX_CONTACTS; i += 1) {
      this.contacts.push({
        a: null as unknown as Body,
        b: null,
        nx: 0,
        ny: 0,
        px: 0,
        py: 0,
        penetration: 0,
        restitution: 0,
        friction: 0
      });
    }
  }

  resetBodies(
    count: number,
    spawnMode: SpawnMode,
    restitution: number,
    friction: number,
    seed: number | null
  ): void {
    const rng = seed === null ? Math.random : mulberry32(seed);
    this.rng = rng;
    this.bodies.length = 0;
    this.joints.length = 0;
    this.wreckingBall = null;
    this.wreckingAnchor = null;
    this.wreckingTriggered = false;
    this.beatLoosenTimer = 0;

    const clamped = clamp(count, 5, MAX_BODIES);
    const columns = Math.max(3, Math.floor(Math.sqrt(clamped)));
    const widths: number[] = new Array(clamped);
    const heights: number[] = new Array(clamped);
    let maxW = 0;
    let maxH = 0;

    for (let i = 0; i < clamped; i += 1) {
      const width = 30 + rng() * 40;
      const height = 24 + rng() * 36;
      widths[i] = width;
      heights[i] = height;
      maxW = Math.max(maxW, width);
      maxH = Math.max(maxH, height);
    }

    const maxExtent = Math.hypot(maxW, maxH);
    const spacingX = Math.max(this.width * 0.08, maxExtent * 1.05);
    const spacingY = Math.max(this.height * 0.06, maxExtent * 1.05);
    const totalWidth = (columns - 1) * spacingX;
    const minBaseX = maxExtent * 0.5 + totalWidth * 0.5;
    const maxBaseX = this.width - maxExtent * 0.5 - totalWidth * 0.5;
    const baseX = clamp(this.width * 0.5, minBaseX, maxBaseX);
    const baseY = Math.min(this.height * 0.78, this.height - maxExtent * 0.5);

    for (let i = 0; i < clamped; i += 1) {
      const width = widths[i];
      const height = heights[i];
      const palette = PALETTE[i % PALETTE.length];
      const col = i % columns;
      const row = Math.floor(i / columns);
      const angle = (rng() - 0.5) * 0.6;
      const angularVelocity = (rng() - 0.5) * 1.2;

      let x = 0;
      let y = 0;
      let vx = 0;
      let vy = 0;

      let placed = false;
      const target = { x: 0, y: 0 };
      for (let attempt = 0; attempt < 16; attempt += 1) {
        if (spawnMode === "rain") {
          x = rng() * this.width;
          y = -rng() * this.height * 0.6 - 40 - attempt * 8;
          vx = (rng() - 0.5) * 20;
          vy = rng() * 40;
        } else {
          x = baseX + (col - (columns - 1) / 2) * spacingX;
          y = baseY - row * spacingY - attempt * 6;
          vx = (rng() - 0.5) * 40;
          vy = (rng() - 0.5) * 30;
        }
        if (this.resolveSpawnPosition(x, y, width, height, angle, target)) {
          x = target.x;
          y = target.y;
          placed = true;
          break;
        }
      }
      if (!placed) {
        x = baseX + (col - (columns - 1) / 2) * spacingX;
        y = -height - i * height * 1.5;
      }

      this.addBody({
        x,
        y,
        vx,
        vy,
        width,
        height,
        angle,
        angularVelocity,
        restitution,
        friction,
        fill: palette.fill,
        stroke: palette.stroke
      });
    }

    this.resolveInitialOverlaps();
    this.buildStickJoints(rng);
  }

  addBody(options: {
    x: number;
    y: number;
    vx?: number;
    vy?: number;
    width: number;
    height: number;
    angle?: number;
    angularVelocity?: number;
    restitution: number;
    friction: number;
    fill?: string;
    stroke?: string;
    mass?: number;
    render?: boolean;
  }): Body {
    const mass = options.mass ?? Math.max(0.5, (options.width * options.height) / 2000);
    const invMass = mass > 0 ? 1 / mass : 0;
    const inertia = mass > 0 ? (mass * (options.width * options.width + options.height * options.height)) / 12 : 0;
    const invInertia = inertia > 0 ? 1 / inertia : 0;
    const body: Body = {
      x: options.x,
      y: options.y,
      vx: options.vx ?? 0,
      vy: options.vy ?? 0,
      angle: options.angle ?? 0,
      angularVelocity: options.angularVelocity ?? 0,
      width: options.width,
      height: options.height,
      halfW: options.width * 0.5,
      halfH: options.height * 0.5,
      invMass,
      invInertia,
      restitution: options.restitution,
      friction: options.friction,
      axisXx: 1,
      axisXy: 0,
      axisYx: 0,
      axisYy: 1,
      fill: options.fill ?? "#111827",
      stroke: options.stroke ?? "#f97316",
      render: options.render ?? true
    };
    this.updateAxes(body);
    this.bodies.push(body);
    return body;
  }

  addJoint(a: Body, b: Body, restLength: number, stiffness = JOINT_STIFFNESS, damping = JOINT_DAMPING): void {
    this.joints.push({
      a,
      b,
      restLength,
      stiffness,
      damping
    });
  }

  triggerWreckingBall(): void {
    if (this.wreckingTriggered) {
      return;
    }
    this.wreckingTriggered = true;
    const anchor = this.addBody({
      x: this.width * 0.85,
      y: this.height * 0.15,
      width: 8,
      height: 8,
      restitution: 0,
      friction: 0.8,
      mass: 0,
      render: false
    });
    const ballSize = Math.min(this.width, this.height) * 0.18;
    const length = Math.min(this.width, this.height) * 0.4;
    const ball = this.addBody({
      x: anchor.x + length,
      y: anchor.y + length * 0.25,
      width: ballSize,
      height: ballSize,
      restitution: 0.1,
      friction: 0.7,
      mass: 14,
      fill: "#2b2d42",
      stroke: "#f72585",
      angularVelocity: -0.4
    });
    ball.vx = -120;
    ball.vy = 20;
    this.addJoint(anchor, ball, length, 0.8, 0.2);
    this.wreckingBall = ball;
    this.wreckingAnchor = anchor;
  }

  applyBeatImpulse(magnitude: number, strength: number): void {
    const baseImpulse = magnitude * (0.4 + strength * 0.6);
    const radius = this.kickRadius > 0 ? this.kickRadius : Math.min(this.width, this.height) * 0.6;
    let originX = this.width * 0.5;
    let originY = this.height * 0.65;
    if (this.kickOriginMode === "center") {
      originY = this.height * 0.5;
    } else if (this.kickOriginMode === "random") {
      originX = this.rng() * this.width;
      originY = this.height * (0.45 + 0.3 * this.rng());
    }
    if (this.kickOriginY !== null) {
      originY = this.kickOriginY;
    }
    this.beatLoosenTimer = Math.max(this.beatLoosenTimer, this.loosenDuration);

    for (let i = 0; i < this.bodies.length; i += 1) {
      const body = this.bodies[i];
      if (body.invMass === 0) {
        continue;
      }
      let dx = body.x - originX;
      let dy = body.y - originY;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) {
        dx = 0;
        dy = -1;
      } else {
        dx /= dist;
        dy /= dist;
      }
      const jitterAngle = (this.rng() * 2 - 1) * this.scatterAngleRad;
      const jitterScale = 1 + (this.rng() * 2 - 1) * this.scatterJitter;
      const cos = Math.cos(jitterAngle);
      const sin = Math.sin(jitterAngle);
      let dirX = dx * cos - dy * sin;
      let dirY = dx * sin + dy * cos;
      dirY -= this.kickUpBias;
      const dirLength = Math.hypot(dirX, dirY);
      if (dirLength > 1e-5) {
        dirX /= dirLength;
        dirY /= dirLength;
      }
      const falloff = clamp(1 - dist / radius, 0, 1);
      const weight = 0.3 + 0.7 * falloff;
      const impulse = baseImpulse * weight * jitterScale;
      body.vx += dirX * impulse * body.invMass;
      body.vy += dirY * impulse * body.invMass;
      const spin = (this.rng() < 0.5 ? -1 : 1) * this.kickTorque * falloff;
      body.angularVelocity += spin * body.invInertia;
      const speed = Math.hypot(body.vx, body.vy);
      if (speed > this.maxLinVel) {
        const scale = this.maxLinVel / speed;
        body.vx *= scale;
        body.vy *= scale;
      }
      if (Math.abs(body.angularVelocity) > this.maxAngVel) {
        body.angularVelocity = Math.sign(body.angularVelocity) * this.maxAngVel;
      }
    }
  }

  private buildStickJoints(rng: () => number): void {
    if (this.bodies.length < 4) {
      return;
    }
    const bridgeCount = Math.min(6, this.bodies.length - 1);
    for (let i = 0; i < bridgeCount; i += 1) {
      const a = this.bodies[i];
      const b = this.bodies[i + 1];
      const restLength = Math.hypot(b.x - a.x, b.y - a.y);
      this.addJoint(a, b, restLength, JOINT_STIFFNESS, JOINT_DAMPING);
    }
    const base = Math.floor(this.bodies.length * 0.4);
    const torso = this.bodies[base];
    const head = this.bodies[base + 1];
    const arm = this.bodies[base + 2];
    const leg = this.bodies[base + 3];
    if (torso && head) {
      this.addJoint(torso, head, Math.hypot(head.x - torso.x, head.y - torso.y), 0.6, 0.18);
    }
    if (torso && arm) {
      this.addJoint(torso, arm, Math.hypot(arm.x - torso.x, arm.y - torso.y), 0.55, 0.16);
    }
    if (torso && leg) {
      this.addJoint(torso, leg, Math.hypot(leg.x - torso.x, leg.y - torso.y), 0.55, 0.16);
      if (rng() > 0.4 && this.bodies.length > base + 4) {
        const extra = this.bodies[base + 4];
        if (extra) {
          this.addJoint(leg, extra, Math.hypot(extra.x - leg.x, extra.y - leg.y), 0.5, 0.14);
        }
      }
    }
  }

  step(dt: number): void {
    this.impactStrength = 0;
    this.loosenActive = this.beatLoosenTimer > 0;
    if (this.beatLoosenTimer > 0) {
      this.beatLoosenTimer = Math.max(0, this.beatLoosenTimer - dt);
    }
    for (let i = 0; i < this.bodies.length; i += 1) {
      const body = this.bodies[i];
      if (body.invMass === 0) {
        continue;
      }
      body.vy += this.gravity * dt;
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      body.angle += body.angularVelocity * dt;
      this.updateAxes(body);
    }

    this.contactCount = 0;
    for (let i = 0; i < this.bodies.length; i += 1) {
      this.detectWallContacts(this.bodies[i]);
    }
    for (let i = 0; i < this.bodies.length; i += 1) {
      for (let j = i + 1; j < this.bodies.length; j += 1) {
        this.detectBodyContact(this.bodies[i], this.bodies[j]);
      }
    }

    for (let iter = 0; iter < SOLVER_ITERATIONS; iter += 1) {
      for (let i = 0; i < this.joints.length; i += 1) {
        this.applyJointConstraint(this.joints[i]);
      }
      for (let i = 0; i < this.contactCount; i += 1) {
        this.applyImpulse(this.contacts[i]);
      }
    }

    for (let i = 0; i < this.contactCount; i += 1) {
      this.applyPositionCorrection(this.contacts[i]);
    }
    for (let i = 0; i < this.joints.length; i += 1) {
      this.applyJointConstraint(this.joints[i]);
    }
  }

  update(dt: number): void {
    this.accumulator += dt;
    let steps = 0;
    while (this.accumulator >= FIXED_STEP && steps < MAX_SUB_STEPS) {
      this.step(FIXED_STEP);
      this.accumulator -= FIXED_STEP;
      steps += 1;
    }
    if (steps === MAX_SUB_STEPS) {
      this.accumulator = 0;
    }
  }

  getBodyExtentY(body: Body): number {
    return Math.abs(body.axisXy) * body.halfW + Math.abs(body.axisYy) * body.halfH;
  }

  bodiesOverlap(a: Body, b: Body): boolean {
    return this.checkBodiesOverlap(a, b);
  }

  getOverlapDepth(a: Body, b: Body): number {
    if (!this.getOverlapInfo(a, b, this.tempOverlap)) {
      return 0;
    }
    return this.tempOverlap.penetration;
  }

  private updateAxes(body: Body): void {
    const cos = Math.cos(body.angle);
    const sin = Math.sin(body.angle);
    body.axisXx = cos;
    body.axisXy = sin;
    body.axisYx = -sin;
    body.axisYy = cos;
  }

  private detectWallContacts(body: Body): void {
    const extentX = Math.abs(body.axisXx) * body.halfW + Math.abs(body.axisYx) * body.halfH;
    const extentY = Math.abs(body.axisXy) * body.halfW + Math.abs(body.axisYy) * body.halfH;

    if (body.x - extentX < 0) {
      this.pushContact(body, null, -1, 0, extentX - body.x, body);
    }
    if (body.x + extentX > this.width) {
      this.pushContact(body, null, 1, 0, body.x + extentX - this.width, body);
    }
    if (body.y + extentY > this.height) {
      this.pushContact(body, null, 0, 1, body.y + extentY - this.height, body);
    }
    if (body.y - extentY < 0) {
      this.pushContact(body, null, 0, -1, extentY - body.y, body);
    }
  }

  private detectBodyContact(a: Body, b: Body): void {
    let minOverlap = Number.POSITIVE_INFINITY;
    let normalX = 0;
    let normalY = 0;
    const dx = b.x - a.x;
    const dy = b.y - a.y;

    if (!this.testAxis(a, b, a.axisXx, a.axisXy, dx, dy, (overlap, ax, ay) => {
      if (overlap < minOverlap) {
        minOverlap = overlap;
        normalX = ax;
        normalY = ay;
      }
    })) {
      return;
    }
    if (!this.testAxis(a, b, a.axisYx, a.axisYy, dx, dy, (overlap, ax, ay) => {
      if (overlap < minOverlap) {
        minOverlap = overlap;
        normalX = ax;
        normalY = ay;
      }
    })) {
      return;
    }
    if (!this.testAxis(a, b, b.axisXx, b.axisXy, dx, dy, (overlap, ax, ay) => {
      if (overlap < minOverlap) {
        minOverlap = overlap;
        normalX = ax;
        normalY = ay;
      }
    })) {
      return;
    }
    if (!this.testAxis(a, b, b.axisYx, b.axisYy, dx, dy, (overlap, ax, ay) => {
      if (overlap < minOverlap) {
        minOverlap = overlap;
        normalX = ax;
        normalY = ay;
      }
    })) {
      return;
    }

    if (dx * normalX + dy * normalY < 0) {
      normalX = -normalX;
      normalY = -normalY;
    }

    this.supportPointInto(a, normalX, normalY, this.tempSupportA);
    this.supportPointInto(b, -normalX, -normalY, this.tempSupportB);
    this.pushContact(
      a,
      b,
      normalX,
      normalY,
      minOverlap,
      null,
      (this.tempSupportA.x + this.tempSupportB.x) * 0.5,
      (this.tempSupportA.y + this.tempSupportB.y) * 0.5
    );
  }

  private testAxis(
    a: Body,
    b: Body,
    axisX: number,
    axisY: number,
    dx: number,
    dy: number,
    onOverlap: (overlap: number, ax: number, ay: number) => void
  ): boolean {
    const distance = Math.abs(dx * axisX + dy * axisY);
    const rA =
      a.halfW * Math.abs(axisX * a.axisXx + axisY * a.axisXy) +
      a.halfH * Math.abs(axisX * a.axisYx + axisY * a.axisYy);
    const rB =
      b.halfW * Math.abs(axisX * b.axisXx + axisY * b.axisXy) +
      b.halfH * Math.abs(axisX * b.axisYx + axisY * b.axisYy);
    const overlap = rA + rB - distance;
    if (overlap <= 0) {
      return false;
    }
    onOverlap(overlap, axisX, axisY);
    return true;
  }

  private getOverlapInfo(a: Body, b: Body, target: { nx: number; ny: number; penetration: number }): boolean {
    let minOverlap = Number.POSITIVE_INFINITY;
    let normalX = 0;
    let normalY = 0;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (!this.testAxis(a, b, a.axisXx, a.axisXy, dx, dy, (overlap, ax, ay) => {
      if (overlap < minOverlap) {
        minOverlap = overlap;
        normalX = ax;
        normalY = ay;
      }
    })) {
      return false;
    }
    if (!this.testAxis(a, b, a.axisYx, a.axisYy, dx, dy, (overlap, ax, ay) => {
      if (overlap < minOverlap) {
        minOverlap = overlap;
        normalX = ax;
        normalY = ay;
      }
    })) {
      return false;
    }
    if (!this.testAxis(a, b, b.axisXx, b.axisXy, dx, dy, (overlap, ax, ay) => {
      if (overlap < minOverlap) {
        minOverlap = overlap;
        normalX = ax;
        normalY = ay;
      }
    })) {
      return false;
    }
    if (!this.testAxis(a, b, b.axisYx, b.axisYy, dx, dy, (overlap, ax, ay) => {
      if (overlap < minOverlap) {
        minOverlap = overlap;
        normalX = ax;
        normalY = ay;
      }
    })) {
      return false;
    }
    if (dx * normalX + dy * normalY < 0) {
      normalX = -normalX;
      normalY = -normalY;
    }
    target.nx = normalX;
    target.ny = normalY;
    target.penetration = minOverlap;
    return true;
  }

  private axisOverlap(a: Body, b: Body, axisX: number, axisY: number, dx: number, dy: number): boolean {
    const distance = Math.abs(dx * axisX + dy * axisY);
    const rA =
      a.halfW * Math.abs(axisX * a.axisXx + axisY * a.axisXy) +
      a.halfH * Math.abs(axisX * a.axisYx + axisY * a.axisYy);
    const rB =
      b.halfW * Math.abs(axisX * b.axisXx + axisY * b.axisXy) +
      b.halfH * Math.abs(axisX * b.axisYx + axisY * b.axisYy);
    return rA + rB - distance > 0;
  }

  private checkBodiesOverlap(a: Body, b: Body): boolean {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (!this.axisOverlap(a, b, a.axisXx, a.axisXy, dx, dy)) {
      return false;
    }
    if (!this.axisOverlap(a, b, a.axisYx, a.axisYy, dx, dy)) {
      return false;
    }
    if (!this.axisOverlap(a, b, b.axisXx, b.axisXy, dx, dy)) {
      return false;
    }
    if (!this.axisOverlap(a, b, b.axisYx, b.axisYy, dx, dy)) {
      return false;
    }
    return true;
  }

  private resolveSpawnPosition(
    x: number,
    y: number,
    width: number,
    height: number,
    angle: number,
    target: { x: number; y: number }
  ): boolean {
    const temp = this.tempSpawnBody;
    temp.x = x;
    temp.y = y;
    temp.width = width;
    temp.height = height;
    temp.halfW = width * 0.5;
    temp.halfH = height * 0.5;
    temp.angle = angle;
    this.updateAxes(temp);
    for (let pass = 0; pass < 4; pass += 1) {
      let overlapFound = false;
      for (let i = 0; i < this.bodies.length; i += 1) {
        if (!this.getOverlapInfo(temp, this.bodies[i], this.tempOverlap)) {
          continue;
        }
        overlapFound = true;
        temp.x -= this.tempOverlap.nx * (this.tempOverlap.penetration + 1);
        temp.y -= this.tempOverlap.ny * (this.tempOverlap.penetration + 1);
      }
      if (!overlapFound) {
        target.x = temp.x;
        target.y = temp.y;
        return true;
      }
    }
    for (let lift = 0; lift < 12; lift += 1) {
      let hasOverlap = false;
      for (let i = 0; i < this.bodies.length; i += 1) {
        if (this.checkBodiesOverlap(temp, this.bodies[i])) {
          hasOverlap = true;
          break;
        }
      }
      if (!hasOverlap) {
        target.x = temp.x;
        target.y = temp.y;
        return true;
      }
      temp.y -= height * 0.6;
      temp.x += (this.rng() - 0.5) * 4;
    }
    return false;
  }

  private resolveInitialOverlaps(): void {
    for (let pass = 0; pass < 12; pass += 1) {
      this.contactCount = 0;
      for (let i = 0; i < this.bodies.length; i += 1) {
        for (let j = i + 1; j < this.bodies.length; j += 1) {
          this.detectBodyContact(this.bodies[i], this.bodies[j]);
        }
      }
      if (this.contactCount === 0) {
        break;
      }
      for (let i = 0; i < this.contactCount; i += 1) {
        this.applyPositionCorrection(this.contacts[i]);
      }
    }
  }

  private supportPointInto(body: Body, nx: number, ny: number, target: { x: number; y: number }): void {
    const d1 = nx * body.axisXx + ny * body.axisXy;
    const d2 = nx * body.axisYx + ny * body.axisYy;
    const sign1 = d1 >= 0 ? 1 : -1;
    const sign2 = d2 >= 0 ? 1 : -1;
    target.x = body.x + body.axisXx * body.halfW * sign1 + body.axisYx * body.halfH * sign2;
    target.y = body.y + body.axisXy * body.halfW * sign1 + body.axisYy * body.halfH * sign2;
  }

  private pushContact(
    a: Body,
    b: Body | null,
    nx: number,
    ny: number,
    penetration: number,
    wallBody: Body | null,
    px?: number,
    py?: number
  ): void {
    if (this.contactCount >= this.contacts.length) {
      return;
    }
    const contact = this.contacts[this.contactCount];
    this.contactCount += 1;
    const baseFriction = b ? Math.sqrt(a.friction * b.friction) : a.friction;
    const baseRestitution = b ? Math.min(a.restitution, b.restitution) : a.restitution;
    const friction = baseFriction * (this.loosenActive ? this.loosenFrictionMult : 1);
    const restitution = this.loosenActive
      ? Math.min(1, baseRestitution + this.loosenRestitutionAdd)
      : baseRestitution;
    contact.a = a;
    contact.b = b;
    contact.nx = nx;
    contact.ny = ny;
    contact.penetration = penetration;
    contact.restitution = restitution;
    contact.friction = friction;
    if (px !== undefined && py !== undefined) {
      contact.px = px;
      contact.py = py;
      return;
    }
    const supportNx = b ? nx : -nx;
    const supportNy = b ? ny : -ny;
    this.supportPointInto(wallBody ?? a, supportNx, supportNy, this.tempSupportWall);
    contact.px = this.tempSupportWall.x;
    contact.py = this.tempSupportWall.y;
  }

  private applyImpulse(contact: Contact): void {
    const a = contact.a;
    const b = contact.b;
    const nx = contact.nx;
    const ny = contact.ny;
    const rAx = contact.px - a.x;
    const rAy = contact.py - a.y;
    const rBx = b ? contact.px - b.x : 0;
    const rBy = b ? contact.py - b.y : 0;

    const vAx = a.vx - a.angularVelocity * rAy;
    const vAy = a.vy + a.angularVelocity * rAx;
    const vBx = b ? b.vx - b.angularVelocity * rBy : 0;
    const vBy = b ? b.vy + b.angularVelocity * rBx : 0;

    const rvx = vBx - vAx;
    const rvy = vBy - vAy;
    const velAlongNormal = rvx * nx + rvy * ny;
    if (velAlongNormal > 0) {
      return;
    }

    this.impactStrength = Math.max(this.impactStrength, -velAlongNormal);

    const rAcn = rAx * ny - rAy * nx;
    const rBcn = rBx * ny - rBy * nx;
    const invMassSum =
      a.invMass +
      (b ? b.invMass : 0) +
      rAcn * rAcn * a.invInertia +
      (b ? rBcn * rBcn * b.invInertia : 0);
    if (invMassSum <= 0) {
      return;
    }

    const j = (-(1 + contact.restitution) * velAlongNormal) / invMassSum;
    const impulseX = j * nx;
    const impulseY = j * ny;
    a.vx -= impulseX * a.invMass;
    a.vy -= impulseY * a.invMass;
    a.angularVelocity -= rAcn * j * a.invInertia;
    if (b) {
      b.vx += impulseX * b.invMass;
      b.vy += impulseY * b.invMass;
      b.angularVelocity += rBcn * j * b.invInertia;
    }

    const tangentX = rvx - velAlongNormal * nx;
    const tangentY = rvy - velAlongNormal * ny;
    const tangentLength = Math.hypot(tangentX, tangentY);
    if (tangentLength < 1e-6) {
      return;
    }
    const tx = tangentX / tangentLength;
    const ty = tangentY / tangentLength;
    const vt = rvx * tx + rvy * ty;
    const jt = -vt / invMassSum;
    const maxFriction = j * contact.friction;
    const clamped = Math.max(-maxFriction, Math.min(jt, maxFriction));
    const frictionX = clamped * tx;
    const frictionY = clamped * ty;
    a.vx -= frictionX * a.invMass;
    a.vy -= frictionY * a.invMass;
    a.angularVelocity -= (rAx * frictionY - rAy * frictionX) * a.invInertia;
    if (b) {
      b.vx += frictionX * b.invMass;
      b.vy += frictionY * b.invMass;
      b.angularVelocity += (rBx * frictionY - rBy * frictionX) * b.invInertia;
    }
  }

  private applyJointConstraint(joint: Joint): void {
    const { a, b } = joint;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-5) {
      return;
    }
    const nx = dx / dist;
    const ny = dy / dist;
    const invMassSum = a.invMass + b.invMass;
    if (invMassSum <= 0) {
      return;
    }
    const error = dist - joint.restLength;
    const correction = (error * joint.stiffness) / invMassSum;
    const corrX = correction * nx;
    const corrY = correction * ny;
    a.x += corrX * a.invMass;
    a.y += corrY * a.invMass;
    b.x -= corrX * b.invMass;
    b.y -= corrY * b.invMass;

    const relVel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    const dampingImpulse = (-relVel * joint.damping) / invMassSum;
    const dampX = dampingImpulse * nx;
    const dampY = dampingImpulse * ny;
    a.vx -= dampX * a.invMass;
    a.vy -= dampY * a.invMass;
    b.vx += dampX * b.invMass;
    b.vy += dampY * b.invMass;
  }

  private applyPositionCorrection(contact: Contact): void {
    const a = contact.a;
    const b = contact.b;
    const invMassSum = a.invMass + (b ? b.invMass : 0);
    if (invMassSum <= 0) {
      return;
    }
    const slop = POSITION_SLOP + (this.loosenActive ? this.loosenExtraSlop : 0);
    const percent = POSITION_PERCENT * (this.loosenActive ? this.loosenPosCorrMult : 1);
    const correction = Math.max(contact.penetration - slop, 0) / invMassSum * percent;
    let nx = contact.nx;
    let ny = contact.ny;
    if (this.loosenActive && this.sepBiasRad > 1e-5) {
      const angle = (this.rng() * 2 - 1) * this.sepBiasRad;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rx = nx * cos - ny * sin;
      const ry = nx * sin + ny * cos;
      nx = rx;
      ny = ry;
    }
    const corrX = correction * nx;
    const corrY = correction * ny;
    a.x -= corrX * a.invMass;
    a.y -= corrY * a.invMass;
    if (b) {
      b.x += corrX * b.invMass;
      b.y += corrY * b.invMass;
    }
  }
}

export class PhysicsPileEffect implements Effect {
  private world: PhysicsWorld | null = null;
  private lastConfig = {
    count: DEFAULT_COUNT,
    restitution: 0.25,
    friction: 0.6,
    gravity: 900,
    beatImpulse: DEFAULT_KICK_IMPULSE,
    spawnMode: "pile" as SpawnMode,
    seed: null as number | null,
    width: 0,
    height: 0
  };
  private trailStyle = "rgba(0, 0, 0, 0.2)";
  private trailAlpha = DEFAULT_TRAIL;
  private shatterParticles: ShatterParticle[] = [];
  private shatterTimer = 0;
  private shatterActive = false;

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const count = clamp(resolveNumberParam(params.count, DEFAULT_COUNT), 5, MAX_BODIES);
    const restitution = clamp(resolveNumberParam(params.restitution, 0.25), 0, 1);
    const friction = clamp(resolveNumberParam(params.friction, 0.6), 0, 1);
    const gravity = resolveNumberParam(params.gravity, 900);
    const kickImpulseParam = resolveNumberParam(params.kickImpulse, Number.NaN);
    const beatImpulse = resolveNumberParam(params.beatImpulse, DEFAULT_KICK_IMPULSE);
    const kickImpulse = Number.isFinite(kickImpulseParam) ? kickImpulseParam : beatImpulse;
    const kickRadius = resolveNumberParam(
      params.kickRadius,
      Math.min(width, height) * 0.6
    );
    const scatterAngleDeg = resolveNumberParam(params.scatterAngleDeg, 25);
    const scatterJitter = clamp(resolveNumberParam(params.scatterJitter, 0.35), 0, 1);
    const kickUpBias = clamp(resolveNumberParam(params.kickUpBias, 0.35), 0, 1);
    const kickTorque = resolveNumberParam(params.kickTorque, 35);
    const loosenDuration = resolveNumberParam(params.loosenDuration, 0.18);
    const loosenFrictionMult = clamp(resolveNumberParam(params.loosenFrictionMult, 0.25), 0, 1);
    const loosenRestitutionAdd = clamp(resolveNumberParam(params.loosenRestitutionAdd, 0.35), 0, 1);
    const loosenPosCorrMult = clamp(resolveNumberParam(params.loosenPosCorrMult, 0.35), 0, 1);
    const loosenExtraSlop = resolveNumberParam(params.loosenExtraSlop, 1.5);
    const maxLinVel = resolveNumberParam(params.maxLinVel, 1800);
    const maxAngVel = resolveNumberParam(params.maxAngVel, 18);
    const kickOrigin = resolveKickOriginMode((params as Record<string, unknown>).kickOrigin);
    const kickOriginY = resolveNumberParam(params.kickOriginY, Number.NaN);
    const sepBiasDeg = resolveNumberParam(params.sepBiasDeg, 10);
    const seed = resolveNumberParam(params.seed, Number.NaN);
    const spawnMode = resolveSpawnMode((params as Record<string, unknown>).spawnMode);
    const trail = clamp(resolveNumberParam(params.trail, DEFAULT_TRAIL), 0, 1);
    const shatter = clamp(resolveNumberParam(params.shatter, 0), 0, 1);
    const wreckingCue = clamp(resolveNumberParam(params.wreckingCue, 0), 0, 1);

    if (!this.world || this.lastConfig.width !== width || this.lastConfig.height !== height) {
      this.world = new PhysicsWorld(width, height, gravity);
      this.lastConfig.width = width;
      this.lastConfig.height = height;
      this.lastConfig.count = count;
      this.lastConfig.restitution = restitution;
      this.lastConfig.friction = friction;
      this.lastConfig.gravity = gravity;
      this.lastConfig.beatImpulse = kickImpulse;
      this.lastConfig.spawnMode = spawnMode;
      this.lastConfig.seed = Number.isFinite(seed) ? seed : null;
      this.world.resetBodies(
        count,
        spawnMode,
        restitution,
        friction,
        this.lastConfig.seed
      );
      this.world.lastTime = time;
    } else if (
      this.lastConfig.count !== count ||
      this.lastConfig.restitution !== restitution ||
      this.lastConfig.friction !== friction ||
      this.lastConfig.spawnMode !== spawnMode ||
      this.lastConfig.seed !== (Number.isFinite(seed) ? seed : null)
    ) {
      this.lastConfig.count = count;
      this.lastConfig.restitution = restitution;
      this.lastConfig.friction = friction;
      this.lastConfig.spawnMode = spawnMode;
      this.lastConfig.seed = Number.isFinite(seed) ? seed : null;
      this.world.resetBodies(
        count,
        spawnMode,
        restitution,
        friction,
        this.lastConfig.seed
      );
    }

    if (trail !== this.trailAlpha) {
      this.trailAlpha = trail;
      this.trailStyle = `rgba(0, 0, 0, ${trail})`;
    }

    ctx.fillStyle = this.trailStyle;
    ctx.fillRect(0, 0, width, height);

    const world = this.world;
    if (!world) {
      return;
    }

    world.kickRadius = kickRadius;
    world.scatterAngleRad = (scatterAngleDeg * Math.PI) / 180;
    world.scatterJitter = scatterJitter;
    world.kickUpBias = kickUpBias;
    world.kickTorque = kickTorque;
    world.loosenDuration = loosenDuration;
    world.loosenFrictionMult = loosenFrictionMult;
    world.loosenRestitutionAdd = loosenRestitutionAdd;
    world.loosenPosCorrMult = loosenPosCorrMult;
    world.loosenExtraSlop = loosenExtraSlop;
    world.maxLinVel = maxLinVel;
    world.maxAngVel = maxAngVel;
    world.kickOriginMode = kickOrigin;
    world.kickOriginY = Number.isFinite(kickOriginY) ? kickOriginY : null;
    world.sepBiasRad = (sepBiasDeg * Math.PI) / 180;

    audio.impactStrength = 0;
    const frameDt = clamp(time - world.lastTime, 0, 0.05);
    world.lastTime = time;
    world.gravity = gravity * (1 + audio.bass * GRAVITY_AUDIO_SCALE);
    if (wreckingCue > 0.5) {
      world.triggerWreckingBall();
    }

    if (shatter > 0.2 && !this.shatterActive) {
      this.startShatter(world);
    }

    if (this.shatterActive) {
      this.updateShatter(frameDt);
      this.renderShatter(ctx);
      world.accumulator = 0;
    } else {
      world.update(frameDt);
      if (audio.beat || audio.beatStrength > 0.2) {
        world.applyBeatImpulse(kickImpulse, audio.beatStrength);
      }

      audio.impactStrength = clamp(world.impactStrength * IMPACT_STRENGTH_SCALE, 0, 1);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      for (let i = 0; i < world.joints.length; i += 1) {
        const joint = world.joints[i];
        ctx.beginPath();
        ctx.moveTo(joint.a.x, joint.a.y);
        ctx.lineTo(joint.b.x, joint.b.y);
        ctx.stroke();
      }

      for (let i = 0; i < world.bodies.length; i += 1) {
        const body = world.bodies[i];
        if (!body.render) {
          continue;
        }
        ctx.save();
        ctx.translate(body.x, body.y);
        ctx.rotate(body.angle);
        ctx.fillStyle = body.fill;
        ctx.strokeStyle = body.stroke;
        ctx.fillRect(-body.halfW, -body.halfH, body.width, body.height);
        ctx.strokeRect(-body.halfW, -body.halfH, body.width, body.height);
        ctx.restore();
      }
    }
  }

  reset(): void {
    this.world = null;
    this.trailAlpha = DEFAULT_TRAIL;
    this.trailStyle = `rgba(0, 0, 0, ${DEFAULT_TRAIL})`;
    this.shatterParticles = [];
    this.shatterTimer = 0;
    this.shatterActive = false;
  }

  private startShatter(world: PhysicsWorld): void {
    this.shatterParticles = [];
    this.shatterTimer = 0;
    this.shatterActive = true;
    world.bodies.forEach((body) => {
      if (!body.render) {
        return;
      }
      for (let i = 0; i < SHATTER_PARTICLES_PER_BODY; i += 1) {
        const offsetX = (i % 2 === 0 ? -1 : 1) * body.halfW * 0.4;
        const offsetY = (i < 2 ? -1 : 1) * body.halfH * 0.4;
        this.shatterParticles.push({
          x: body.x + offsetX,
          y: body.y + offsetY,
          vx: body.vx * 0.3 + (Math.random() - 0.5) * 120,
          vy: body.vy * 0.3 + (Math.random() - 0.5) * 120,
          life: 0,
          maxLife: SHATTER_DURATION,
          size: Math.max(2, Math.min(body.halfW, body.halfH) * 0.25),
          color: body.stroke
        });
      }
    });
  }

  private updateShatter(delta: number): void {
    this.shatterTimer += delta;
    this.shatterParticles.forEach((particle) => {
      particle.life += delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy += 120 * delta;
    });
    if (this.shatterTimer > SHATTER_DURATION) {
      this.shatterParticles = this.shatterParticles.filter((particle) => particle.life < particle.maxLife);
      if (this.shatterParticles.length === 0) {
        this.shatterActive = false;
      }
    }
  }

  private renderShatter(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    this.shatterParticles.forEach((particle) => {
      const lifeRatio = 1 - particle.life / particle.maxLife;
      if (lifeRatio <= 0) {
        return;
      }
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = lifeRatio;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (0.6 + lifeRatio * 0.6), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}
