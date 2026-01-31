export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export function rotateX(point: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos
  };
}

export function rotateY(point: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos
  };
}

export function rotateZ(point: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
    z: point.z
  };
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z
  };
}

export function subtract(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z
  };
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function normalize(vec: Vec3): Vec3 {
  const length = Math.hypot(vec.x, vec.y, vec.z) || 1;
  return {
    x: vec.x / length,
    y: vec.y / length,
    z: vec.z / length
  };
}

export function projectPoint(
  point: Vec3,
  cameraDistance: number,
  fov: number,
  width: number,
  height: number
): { x: number; y: number; scale: number; depth: number } {
  const depth = cameraDistance + point.z;
  const scale = fov / depth;
  return {
    x: width / 2 + point.x * scale,
    y: height / 2 + point.y * scale,
    scale,
    depth
  };
}
