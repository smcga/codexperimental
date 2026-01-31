import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";
import {
  Vec3,
  add,
  cross,
  dot,
  normalize,
  projectPoint,
  rotateX,
  rotateY,
  rotateZ,
  subtract
} from "./simple3d";

type Face = {
  indices: [number, number, number, number];
};

type Solid = {
  position: Vec3;
  size: number;
  hue: number;
  spin: Vec3;
};

const CUBE_VERTICES: Vec3[] = [
  { x: -1, y: -1, z: -1 },
  { x: 1, y: -1, z: -1 },
  { x: 1, y: 1, z: -1 },
  { x: -1, y: 1, z: -1 },
  { x: -1, y: -1, z: 1 },
  { x: 1, y: -1, z: 1 },
  { x: 1, y: 1, z: 1 },
  { x: -1, y: 1, z: 1 }
];

const CUBE_FACES: Face[] = [
  { indices: [0, 1, 2, 3] },
  { indices: [4, 5, 6, 7] },
  { indices: [0, 1, 5, 4] },
  { indices: [2, 3, 7, 6] },
  { indices: [1, 2, 6, 5] },
  { indices: [0, 3, 7, 4] }
];

const LIGHT_DIRECTION = normalize({ x: -0.4, y: -0.3, z: -1 });

function applyRotation(point: Vec3, rotation: Vec3): Vec3 {
  const rotatedX = rotateX(point, rotation.x);
  const rotatedY = rotateY(rotatedX, rotation.y);
  return rotateZ(rotatedY, rotation.z);
}

function colorFromHue(hue: number, lightness: number, alpha = 1): string {
  return `hsla(${hue}, 70%, ${lightness}%, ${alpha})`;
}

export class Proper3DEffect implements Effect {
  private solids: Solid[] = [
    { position: { x: -1.8, y: -0.6, z: 0.2 }, size: 0.9, hue: 200, spin: { x: 0.7, y: 0.4, z: 0.2 } },
    { position: { x: 1.4, y: 0.9, z: 0.9 }, size: 0.7, hue: 330, spin: { x: 0.3, y: 0.8, z: 0.6 } },
    { position: { x: -0.2, y: 1.4, z: -0.4 }, size: 0.6, hue: 140, spin: { x: 0.6, y: 0.5, z: 0.4 } },
    { position: { x: 0.9, y: -1.3, z: -0.2 }, size: 0.75, hue: 48, spin: { x: 0.4, y: 0.7, z: 0.3 } }
  ];

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const speed = params.speed ?? 1.0;
    const energy = clamp(audio.bass * 1.1 + audio.mid * 0.6, 0, 1);
    const fov = Math.min(width, height) * 0.85;
    const cameraDistance = 6.5;
    const timeOffset = time * 0.55 * speed;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgb(5, 8, 14)";
    ctx.fillRect(0, 0, width, height);

    this.solids.forEach((solid, index) => {
      const wobble = Math.sin(timeOffset * 1.6 + index) * 0.25;
      const pulse = 1 + energy * 0.15;
      const position = add(solid.position, { x: wobble * 0.4, y: -wobble * 0.3, z: wobble * 0.6 });
      const rotation = {
        x: timeOffset * solid.spin.x + index * 0.5,
        y: timeOffset * solid.spin.y + index * 0.4,
        z: timeOffset * solid.spin.z + index * 0.2
      };
      const vertices = CUBE_VERTICES.map((vertex) => {
        const scaled = {
          x: vertex.x * solid.size * pulse,
          y: vertex.y * solid.size * pulse,
          z: vertex.z * solid.size * pulse
        };
        const rotated = applyRotation(scaled, rotation);
        return add(rotated, position);
      });

      const faces = CUBE_FACES.map((face) => {
        const points = face.indices.map((index) => vertices[index]);
        const edgeA = subtract(points[1], points[0]);
        const edgeB = subtract(points[2], points[0]);
        const normal = normalize(cross(edgeA, edgeB));
        const light = clamp(dot(normal, LIGHT_DIRECTION), 0.05, 1);
        const depth = points.reduce((sum, point) => sum + point.z, 0) / points.length;
        return { points, normal, light, depth };
      })
        .filter((face) => face.normal.z < 0)
        .sort((a, b) => b.depth - a.depth);

      faces.forEach((face) => {
        const projected = face.points.map((point) => projectPoint(point, cameraDistance, fov, width, height));
        if (projected.some((point) => point.depth <= 0)) {
          return;
        }
        ctx.beginPath();
        projected.forEach((point, pointIndex) => {
          if (pointIndex === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.closePath();

        const baseLightness = 38 + face.light * 34 + energy * 10;
        ctx.fillStyle = colorFromHue(solid.hue, baseLightness);
        ctx.fill();

        ctx.strokeStyle = colorFromHue(solid.hue, baseLightness + 10, 0.7);
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    });

    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.fillRect(0, 0, width, height);
  }
}
