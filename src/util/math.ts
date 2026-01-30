export const TAU = Math.PI * 2;

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const randRange = (min: number, max: number) =>
  min + Math.random() * (max - min);

export const noteToFrequency = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
