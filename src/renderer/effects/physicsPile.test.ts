import { describe, expect, it } from "vitest";
import { PhysicsWorld } from "./physicsPile";

const STEP = 1 / 120;

const stepWorld = (world: PhysicsWorld, steps: number) => {
  for (let i = 0; i < steps; i += 1) {
    world.step(STEP);
  }
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
});
