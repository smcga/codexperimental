import { describe, expect, it, vi } from "vitest";
import { PhysicsPileEffect, PhysicsWorld } from "./physicsPile";
import { EffectRenderContext } from "./types";

const STEP = 1 / 120;

const stepWorld = (world: PhysicsWorld, steps: number) => {
  for (let i = 0; i < steps; i += 1) {
    world.step(STEP);
  }
};


const createRenderContext = (ctx: CanvasRenderingContext2D): EffectRenderContext =>
  ({
    ctx,
    width: 320,
    height: 200,
    time: 1,
    delta: STEP,
    audio: {
      rms: 0,
      bass: 0,
      mid: 0,
      treble: 0,
      beat: false,
      beatStrength: 0,
      impactStrength: 0
    },
    params: {
      count: 10,
      seed: 3,
      trail: 0
    }
  } as EffectRenderContext);

const stddev = (values: number[]): number => {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

describe("PhysicsWorld", () => {
  it("settles a box on the floor", () => {
    const world = new PhysicsWorld(300, 200, 900);
    const body = world.addBody({
      x: 150,
      y: 20,
      width: 40,
      height: 20,
      restitution: 0.1,
      friction: 0.8
    });

    stepWorld(world, 900);

    const extent = world.getBodyExtentY(body);
    expect(body.y + extent).toBeLessThanOrEqual(200.5);
    expect(Math.abs(body.vy)).toBeLessThan(5);
  });

  it("reflects relative velocity based on restitution", () => {
    const world = new PhysicsWorld(800, 200, 0);
    const a = world.addBody({
      x: 150,
      y: 100,
      width: 40,
      height: 20,
      restitution: 0.6,
      friction: 0.05,
      vx: 80,
      vy: 0,
      angle: 0
    });
    const b = world.addBody({
      x: 250,
      y: 100,
      width: 40,
      height: 20,
      restitution: 0.6,
      friction: 0.05,
      vx: -80,
      vy: 0,
      angle: 0
    });

    const rvBefore = b.vx - a.vx;
    let rvAfter = rvBefore;
    for (let i = 0; i < 240; i += 1) {
      world.step(STEP);
      rvAfter = b.vx - a.vx;
      if (rvAfter > 0) {
        break;
      }
    }

    expect(rvAfter).toBeGreaterThan(0);
    expect(rvAfter).toBeLessThan(Math.abs(rvBefore));
    expect(rvAfter).toBeGreaterThan(Math.abs(rvBefore) * 0.3);
  });

  it("keeps positions and velocities finite over time", () => {
    const world = new PhysicsWorld(320, 180, 900);
    world.resetBodies(12, "pile", 0.25, 0.6, 3);

    stepWorld(world, 1200);

    world.bodies.forEach((body) => {
      expect(Number.isFinite(body.x)).toBe(true);
      expect(Number.isFinite(body.y)).toBe(true);
      expect(Number.isFinite(body.vx)).toBe(true);
      expect(Number.isFinite(body.vy)).toBe(true);
    });
  });

  it("matches fixed-step results within tolerance", () => {
    const worldA = new PhysicsWorld(600, 1000, 500);
    const worldB = new PhysicsWorld(600, 1000, 500);
    worldA.addBody({
      x: 200,
      y: 200,
      width: 30,
      height: 30,
      restitution: 0.2,
      friction: 0.5,
      vx: 40,
      vy: -10,
      angle: 0.2
    });
    worldB.addBody({
      x: 200,
      y: 200,
      width: 30,
      height: 30,
      restitution: 0.2,
      friction: 0.5,
      vx: 40,
      vy: -10,
      angle: 0.2
    });

    worldA.step(1 / 60);
    worldB.step(1 / 120);
    worldB.step(1 / 120);

    const bodyA = worldA.bodies[0];
    const bodyB = worldB.bodies[0];
    expect(Math.abs(bodyA.x - bodyB.x)).toBeLessThan(0.6);
    expect(Math.abs(bodyA.y - bodyB.y)).toBeLessThan(0.6);
    expect(Math.abs(bodyA.vx - bodyB.vx)).toBeLessThan(0.6);
    expect(Math.abs(bodyA.vy - bodyB.vy)).toBeLessThan(0.6);
  });

  it("keeps jointed bodies within a distance band", () => {
    const world = new PhysicsWorld(400, 240, 600);
    const a = world.addBody({
      x: 160,
      y: 80,
      width: 30,
      height: 20,
      restitution: 0.2,
      friction: 0.6
    });
    const b = world.addBody({
      x: 220,
      y: 80,
      width: 30,
      height: 20,
      restitution: 0.2,
      friction: 0.6
    });
    const restLength = Math.hypot(b.x - a.x, b.y - a.y);
    world.addJoint(a, b, restLength, 0.7, 0.2);

    stepWorld(world, 300);

    const finalDistance = Math.hypot(b.x - a.x, b.y - a.y);
    expect(finalDistance).toBeGreaterThan(restLength * 0.7);
    expect(finalDistance).toBeLessThan(restLength * 1.3);
  });

  it("tracks impact strength from collisions", () => {
    const world = new PhysicsWorld(300, 200, 0);
    const a = world.addBody({
      x: 100,
      y: 100,
      width: 30,
      height: 20,
      restitution: 0.3,
      friction: 0.4,
      vx: 120
    });
    world.addBody({
      x: 160,
      y: 100,
      width: 30,
      height: 20,
      restitution: 0.3,
      friction: 0.4,
      vx: -80
    });

    let impact = 0;
    for (let i = 0; i < 180; i += 1) {
      world.step(STEP);
      impact = Math.max(impact, world.impactStrength);
      if (impact > 0) {
        break;
      }
    }

    expect(impact).toBeGreaterThan(0);
    expect(Number.isFinite(a.vx)).toBe(true);
  });

  it("spawns bodies without initial overlaps", () => {
    const world = new PhysicsWorld(360, 240, 900);
    world.resetBodies(18, "pile", 0.2, 0.5, 9);

    let maxOverlap = 0;
    for (let i = 0; i < world.bodies.length; i += 1) {
      for (let j = i + 1; j < world.bodies.length; j += 1) {
        maxOverlap = Math.max(maxOverlap, world.getOverlapDepth(world.bodies[i], world.bodies[j]));
      }
    }
    expect(maxOverlap).toBeLessThanOrEqual(1);
  });

  it("scatters bodies with varied velocities on beat kicks", () => {
    const world = new PhysicsWorld(360, 240, 900);
    world.resetBodies(16, "pile", 0.2, 0.5, 12);
    world.kickRadius = 300;
    world.scatterAngleRad = (30 * Math.PI) / 180;
    world.scatterJitter = 0.4;
    world.kickUpBias = 0.3;
    world.kickTorque = 40;
    world.maxLinVel = 2500;
    world.maxAngVel = 25;
    world.kickOriginMode = "floorCenter";

    world.applyBeatImpulse(800, 1);
    stepWorld(world, 10);

    const vxs = world.bodies.map((body) => body.vx);
    const vys = world.bodies.map((body) => body.vy);
    const spins = world.bodies.map((body) => Math.abs(body.angularVelocity));
    const spinCount = spins.filter((spin) => spin > 0.6).length;

    expect(stddev(vxs)).toBeGreaterThan(30);
    expect(stddev(vys)).toBeGreaterThan(30);
    expect(spinCount).toBeGreaterThanOrEqual(Math.floor(world.bodies.length * 0.3));
  });

  it("kicks bodies upward away from the floor origin", () => {
    const world = new PhysicsWorld(360, 240, 0);
    world.resetBodies(16, "pile", 0.2, 0.5, 21);
    world.kickRadius = 400;
    world.scatterAngleRad = 0;
    world.scatterJitter = 0;
    world.kickUpBias = 0.35;
    world.kickOriginMode = "floorCenter";

    world.applyBeatImpulse(700, 1);

    const averageVy = world.bodies.reduce((sum, body) => sum + body.vy, 0) / world.bodies.length;
    expect(averageVy).toBeLessThan(0);
  });

  it("remains stable with periodic beat impulses", () => {
    const world = new PhysicsWorld(320, 180, 900);
    world.resetBodies(14, "pile", 0.22, 0.55, 7);
    world.kickRadius = 260;
    world.kickOriginMode = "floorCenter";
    world.maxLinVel = 1800;
    world.maxAngVel = 18;

    for (let i = 0; i < 1200; i += 1) {
      if (i % 60 === 0) {
        world.applyBeatImpulse(550, 0.8);
      }
      world.step(STEP);
    }

    world.bodies.forEach((body) => {
      expect(Number.isFinite(body.x)).toBe(true);
      expect(Number.isFinite(body.y)).toBe(true);
      expect(Number.isFinite(body.vx)).toBe(true);
      expect(Number.isFinite(body.vy)).toBe(true);
      expect(Number.isFinite(body.angularVelocity)).toBe(true);
    });
  });

  it("clamps beat impulses to maximum velocities", () => {
    const world = new PhysicsWorld(240, 200, 0);
    world.addBody({
      x: 120,
      y: 100,
      width: 40,
      height: 20,
      restitution: 0.2,
      friction: 0.6
    });
    world.kickRadius = 400;
    world.kickOriginMode = "center";
    world.maxLinVel = 200;
    world.maxAngVel = 2;
    world.kickTorque = 200;

    world.applyBeatImpulse(5000, 1);

    const body = world.bodies[0];
    const speed = Math.hypot(body.vx, body.vy);
    expect(speed).toBeLessThanOrEqual(world.maxLinVel + 1e-3);
    expect(Math.abs(body.angularVelocity)).toBeLessThanOrEqual(world.maxAngVel + 1e-3);
  });
});

describe("PhysicsPileEffect", () => {
  it("does not render connector lines between boxes", () => {
    const effect = new PhysicsPileEffect();
    const lineTo = vi.fn();
    const ctx = {
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo,
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
      fillStyle: "#000",
      strokeStyle: "#fff",
      lineWidth: 1
    } as unknown as CanvasRenderingContext2D;

    effect.render(createRenderContext(ctx));

    expect(lineTo).not.toHaveBeenCalled();
  });
});
