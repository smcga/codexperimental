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

type SpawnMode = "pile" | "rain";

const MAX_BODIES = 40;
const MAX_CONTACTS = 2000;
const FIXED_STEP = 1 / 120;
const MAX_SUB_STEPS = 6;
const SOLVER_ITERATIONS = 6;
const GRAVITY_AUDIO_SCALE = 0.35;
const POSITION_SLOP = 0.01;
const POSITION_PERCENT = 0.2;

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

function resolveNumberParam(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export class PhysicsWorld {
  bodies: Body[] = [];
  contacts: Contact[] = [];
  contactCount = 0;
  width: number;
  height: number;
  gravity: number;
  accumulator = 0;
  lastTime = 0;
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
    this.bodies.length = 0;

    const clamped = clamp(count, 5, MAX_BODIES);
    const columns = Math.max(3, Math.floor(Math.sqrt(clamped)));
    const baseX = this.width * 0.5;
    const baseY = this.height * 0.78;
    const spacingX = this.width * 0.08;
    const spacingY = this.height * 0.06;

    for (let i = 0; i < clamped; i += 1) {
      const width = 30 + rng() * 40;
      const height = 24 + rng() * 36;
      const palette = PALETTE[i % PALETTE.length];
      const col = i % columns;
      const row = Math.floor(i / columns);

      let x = baseX + (col - (columns - 1) / 2) * spacingX + (rng() - 0.5) * 12;
      let y = baseY - row * spacingY - rng() * 18;
      let vx = (rng() - 0.5) * 40;
      let vy = (rng() - 0.5) * 30;

      if (spawnMode === "rain") {
        x = rng() * this.width;
        y = -rng() * this.height * 0.6 - 40;
        vx = (rng() - 0.5) * 20;
        vy = rng() * 40;
      }

      const angle = (rng() - 0.5) * 0.6;
      const angularVelocity = (rng() - 0.5) * 1.2;
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
  }): Body {
    const mass = options.mass ?? Math.max(0.5, (options.width * options.height) / 2000);
    const invMass = 1 / mass;
    const inertia = (mass * (options.width * options.width + options.height * options.height)) / 12;
    const invInertia = 1 / inertia;
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
      stroke: options.stroke ?? "#f97316"
    };
    this.updateAxes(body);
    this.bodies.push(body);
    return body;
  }

  applyBeatImpulse(magnitude: number, strength: number): void {
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.5;
    const scaled = magnitude * (0.4 + strength * 0.6);

    for (let i = 0; i < this.bodies.length; i += 1) {
      const body = this.bodies[i];
      let dx = body.x - centerX;
      let dy = body.y - centerY;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) {
        dx = 0;
        dy = -1;
      } else {
        dx /= dist;
        dy /= dist;
      }
      const impulseX = dx * scaled;
      const impulseY = dy * scaled;
      body.vx += impulseX * body.invMass;
      body.vy += impulseY * body.invMass;
    }
  }

  step(dt: number): void {
    for (let i = 0; i < this.bodies.length; i += 1) {
      const body = this.bodies[i];
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
      for (let i = 0; i < this.contactCount; i += 1) {
        this.applyImpulse(this.contacts[i]);
      }
    }

    for (let i = 0; i < this.contactCount; i += 1) {
      this.applyPositionCorrection(this.contacts[i]);
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
    const friction = b ? Math.sqrt(a.friction * b.friction) : a.friction;
    const restitution = b ? Math.min(a.restitution, b.restitution) : a.restitution;
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

  private applyPositionCorrection(contact: Contact): void {
    const a = contact.a;
    const b = contact.b;
    const invMassSum = a.invMass + (b ? b.invMass : 0);
    if (invMassSum <= 0) {
      return;
    }
    const correction = Math.max(contact.penetration - POSITION_SLOP, 0) / invMassSum * POSITION_PERCENT;
    const corrX = correction * contact.nx;
    const corrY = correction * contact.ny;
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
    beatImpulse: 250,
    spawnMode: "pile" as SpawnMode,
    seed: null as number | null,
    width: 0,
    height: 0
  };
  private trailStyle = "rgba(0, 0, 0, 0.2)";
  private trailAlpha = DEFAULT_TRAIL;

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const count = clamp(resolveNumberParam(params.count, DEFAULT_COUNT), 5, MAX_BODIES);
    const restitution = clamp(resolveNumberParam(params.restitution, 0.25), 0, 1);
    const friction = clamp(resolveNumberParam(params.friction, 0.6), 0, 1);
    const gravity = resolveNumberParam(params.gravity, 900);
    const beatImpulse = resolveNumberParam(params.beatImpulse, 250);
    const seed = resolveNumberParam(params.seed, Number.NaN);
    const spawnMode = resolveSpawnMode((params as Record<string, unknown>).spawnMode);
    const trail = clamp(resolveNumberParam(params.trail, DEFAULT_TRAIL), 0, 1);

    if (!this.world || this.lastConfig.width !== width || this.lastConfig.height !== height) {
      this.world = new PhysicsWorld(width, height, gravity);
      this.lastConfig.width = width;
      this.lastConfig.height = height;
      this.lastConfig.count = count;
      this.lastConfig.restitution = restitution;
      this.lastConfig.friction = friction;
      this.lastConfig.gravity = gravity;
      this.lastConfig.beatImpulse = beatImpulse;
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

    const frameDt = clamp(time - world.lastTime, 0, 0.05);
    world.lastTime = time;
    world.gravity = gravity * (1 + audio.bass * GRAVITY_AUDIO_SCALE);
    world.update(frameDt);

    if (audio.beat || audio.beatStrength > 0.2) {
      world.applyBeatImpulse(beatImpulse, audio.beatStrength);
    }

    ctx.lineWidth = 2;
    for (let i = 0; i < world.bodies.length; i += 1) {
      const body = world.bodies[i];
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

  reset(): void {
    this.world = null;
    this.trailAlpha = DEFAULT_TRAIL;
    this.trailStyle = `rgba(0, 0, 0, ${DEFAULT_TRAIL})`;
  }
}
