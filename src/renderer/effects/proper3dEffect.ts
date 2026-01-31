import { Effect, EffectRenderContext } from "./types";
import {
  Vec3,
  faceNormal,
  normalizeVector,
  projectPoint,
  rotateX,
  rotateY,
  rotateZ,
  shadeHexColor
} from "./threeDMath";

type Face = {
  indices: number[];
  color: string;
};

type Mesh = {
  vertices: Vec3[];
  faces: Face[];
};

type SceneObject = {
  mesh: Mesh;
  position: Vec3;
  rotation: Vec3;
  spin: Vec3;
  scale: number;
};

const createCube = (color: string): Mesh => ({
  vertices: [
    { x: -1, y: -1, z: -1 },
    { x: 1, y: -1, z: -1 },
    { x: 1, y: 1, z: -1 },
    { x: -1, y: 1, z: -1 },
    { x: -1, y: -1, z: 1 },
    { x: 1, y: -1, z: 1 },
    { x: 1, y: 1, z: 1 },
    { x: -1, y: 1, z: 1 }
  ],
  faces: [
    { indices: [0, 1, 2, 3], color },
    { indices: [4, 5, 6, 7], color },
    { indices: [0, 1, 5, 4], color },
    { indices: [2, 3, 7, 6], color },
    { indices: [1, 2, 6, 5], color },
    { indices: [0, 3, 7, 4], color }
  ]
});

const createPyramid = (color: string): Mesh => ({
  vertices: [
    { x: -1, y: -1, z: -1 },
    { x: 1, y: -1, z: -1 },
    { x: 1, y: -1, z: 1 },
    { x: -1, y: -1, z: 1 },
    { x: 0, y: 1.2, z: 0 }
  ],
  faces: [
    { indices: [0, 1, 2, 3], color },
    { indices: [0, 1, 4], color },
    { indices: [1, 2, 4], color },
    { indices: [2, 3, 4], color },
    { indices: [3, 0, 4], color }
  ]
});

const createPrism = (color: string): Mesh => ({
  vertices: [
    { x: -1, y: -0.6, z: -1 },
    { x: 1, y: -0.6, z: -1 },
    { x: 1, y: 0.6, z: -1 },
    { x: -1, y: 0.6, z: -1 },
    { x: -0.3, y: -0.2, z: 1 },
    { x: 0.9, y: -0.2, z: 1 },
    { x: 0.9, y: 0.8, z: 1 },
    { x: -0.3, y: 0.8, z: 1 }
  ],
  faces: [
    { indices: [0, 1, 2, 3], color },
    { indices: [4, 5, 6, 7], color },
    { indices: [0, 1, 5, 4], color },
    { indices: [2, 3, 7, 6], color },
    { indices: [1, 2, 6, 5], color },
    { indices: [0, 3, 7, 4], color }
  ]
});

const buildScene = (): SceneObject[] => [
  {
    mesh: createCube("#66d9ff"),
    position: { x: -1.8, y: 0.6, z: 0 },
    rotation: { x: 0.2, y: 0.4, z: 0.1 },
    spin: { x: 0.4, y: 0.8, z: 0.2 },
    scale: 1.1
  },
  {
    mesh: createPyramid("#ffd166"),
    position: { x: 1.8, y: -0.2, z: -0.5 },
    rotation: { x: -0.4, y: 0.2, z: -0.1 },
    spin: { x: -0.3, y: 0.6, z: 0.15 },
    scale: 1.0
  },
  {
    mesh: createPrism("#b583ff"),
    position: { x: 0, y: -1.1, z: 1.2 },
    rotation: { x: 0.6, y: -0.4, z: 0.2 },
    spin: { x: 0.25, y: -0.5, z: 0.3 },
    scale: 0.9
  }
];

const lightDirection: Vec3 = normalizeVector({ x: -0.3, y: -0.4, z: 0.85 });

export class Proper3DEffect implements Effect {
  private objects = buildScene();

  reset(): void {
    this.objects = buildScene();
  }

  render({ ctx, width, height, time, audio }: EffectRenderContext): void {
    ctx.fillStyle = "#05070f";
    ctx.fillRect(0, 0, width, height);

    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.4, 40, width * 0.5, height * 0.4, height);
    gradient.addColorStop(0, "rgba(80, 120, 255, 0.25)");
    gradient.addColorStop(1, "rgba(5, 8, 25, 0.9)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const cameraDistance = 6.5;
    const fov = 3.4 + audio.energy * 1.1;
    const timeOffset = time * (0.6 + audio.mid * 0.4);

    ctx.save();
    ctx.translate(width / 2, height / 2);

    const facesToDraw: Array<{ points: Vec3[]; color: string; depth: number; normal: Vec3 }> = [];

    this.objects.forEach((object, index) => {
      const spin = {
        x: object.rotation.x + timeOffset * object.spin.x + index * 0.3,
        y: object.rotation.y + timeOffset * object.spin.y + index * 0.25,
        z: object.rotation.z + timeOffset * object.spin.z
      };

      const transformed = object.mesh.vertices.map((vertex) => {
        let point: Vec3 = {
          x: vertex.x * object.scale,
          y: vertex.y * object.scale,
          z: vertex.z * object.scale
        };
        point = rotateX(point, spin.x);
        point = rotateY(point, spin.y);
        point = rotateZ(point, spin.z);
        return {
          x: point.x + object.position.x,
          y: point.y + object.position.y,
          z: point.z + object.position.z
        };
      });

      object.mesh.faces.forEach((face) => {
        const points = face.indices.map((index) => transformed[index]);
        const normal = faceNormal(points[0], points[1], points[2]);
        const depth = points.reduce((sum, point) => sum + point.z, 0) / points.length;
        facesToDraw.push({ points, color: face.color, depth, normal });
      });
    });

    facesToDraw
      .sort((a, b) => a.depth - b.depth)
      .forEach((face) => {
        const light = Math.max(0.1, normalDot(face.normal, lightDirection));
        const fillColor = shadeHexColor(face.color, light + audio.treble * 0.4);
        ctx.beginPath();
        face.points.forEach((point, index) => {
          const projected = projectPoint(point, cameraDistance, fov);
          const x = projected.x * 140;
          const y = projected.y * 140;
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

    ctx.restore();
  }
}

const normalDot = (a: Vec3, b: Vec3): number => {
  const dot = a.x * b.x + a.y * b.y + a.z * b.z;
  return Math.max(0, dot);
};
