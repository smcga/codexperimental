export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export type Vec2 = {
  x: number;
  y: number;
  scale: number;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const normalizeVector = (vector: Vec3): Vec3 => {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length
  };
};

export const rotateX = (point: Vec3, angle: number): Vec3 => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos
  };
};

export const rotateY = (point: Vec3, angle: number): Vec3 => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos
  };
};

export const rotateZ = (point: Vec3, angle: number): Vec3 => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
    z: point.z
  };
};

export const projectPoint = (point: Vec3, cameraDistance: number, fov: number): Vec2 => {
  const depth = Math.max(0.1, cameraDistance - point.z);
  const scale = fov / depth;
  return {
    x: point.x * scale,
    y: point.y * scale,
    scale: clamp(scale, 0.1, 8)
  };
};

export const subtract = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z
});

export const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x
});

export const faceNormal = (a: Vec3, b: Vec3, c: Vec3): Vec3 => {
  const ab = subtract(b, a);
  const ac = subtract(c, a);
  return normalizeVector(cross(ab, ac));
};

export const shadeHexColor = (hex: string, intensity: number): string => {
  const sanitized = hex.replace("#", "");
  const value = parseInt(sanitized, 16);
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  const factor = clamp(intensity, 0, 1);
  const shaded = (channel: number) => Math.round(channel * (0.35 + factor * 0.65));
  return `rgb(${shaded(r)}, ${shaded(g)}, ${shaded(b)})`;
};
