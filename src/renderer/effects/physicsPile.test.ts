import { describe, expect, it } from "vitest";

import { PhysicsWorld } from "./physicsPile";

const STEP = 1 / 120;

const createWorld = (count: number, gravity = 900, seed = 1) =>
  new PhysicsWorld({
    count,
    width: 800,
    height: 600,
    restitution: 0.25,
    friction: 0.6,
    gravity,
    seed,
    spawnMode: "pile"
  });

describe("physics pile", () => {
  it("settles a single body above the floor", () => {
    const world = createWorld(1, 900, 2);
    const body = world.getBodies()[0];
    body.position.x = 400;
    body.position.y = 100;
    body.velocity.x = 0;
    body.velocity.y = 0;
    world.step(0);

    for (let i = 0; i < 1200; i += 1) {
      world.step(STEP);
    }

    expect(body.position.y).toBeLessThanOrEqual(600 - body.halfHeight + 0.75);
    expect(Math.abs(body.velocity.y)).toBeLessThan(6);
  });

  it("reflects relative velocity along the collision normal", () => {
    const world = createWorld(2, 0, 4);
    world.setMaterial(0.5, 0);
    const [bodyA, bodyB] = world.getBodies();
    bodyA.position.x = 320;
    bodyA.position.y = 300;
    bodyA.velocity.x = 60;
    bodyA.velocity.y = 0;
    bodyA.angle = 0;
    bodyA.angularVelocity = 0;
    bodyB.position.x = 480;
    bodyB.position.y = 300;
    bodyB.velocity.x = -60;
    bodyB.velocity.y = 0;
    bodyB.angle = 0;
    bodyB.angularVelocity = 0;
    world.step(0);

    for (let i = 0; i < 240; i += 1) {
      world.step(STEP);
    }

    const relativeAfter = bodyB.velocity.x - bodyA.velocity.x;
    expect(relativeAfter).toBeGreaterThan(0);
    expect(relativeAfter).toBeGreaterThan(10);
  });

  it("keeps positions and velocities finite over time", () => {
    const world = createWorld(10, 900, 12);
    for (let i = 0; i < 1200; i += 1) {
      world.step(STEP);
    }

    for (const body of world.getBodies()) {
      expect(Number.isFinite(body.position.x)).toBe(true);
      expect(Number.isFinite(body.position.y)).toBe(true);
      expect(Number.isFinite(body.velocity.x)).toBe(true);
      expect(Number.isFinite(body.velocity.y)).toBe(true);
      expect(Number.isFinite(body.angle)).toBe(true);
      expect(Number.isFinite(body.angularVelocity)).toBe(true);
    }
  });

  it("produces similar results with smaller fixed steps", () => {
    const worldA = createWorld(5, 600, 7);
    const worldB = createWorld(5, 600, 7);

    worldA.step(1 / 60);
    worldB.step(1 / 120);
    worldB.step(1 / 120);

    const bodyA = worldA.getBodies()[0];
    const bodyB = worldB.getBodies()[0];

    expect(bodyA.position.x).toBeCloseTo(bodyB.position.x, 1);
    expect(bodyA.position.y).toBeCloseTo(bodyB.position.y, 1);
    expect(bodyA.velocity.y).toBeCloseTo(bodyB.velocity.y, 1);
  });
});
