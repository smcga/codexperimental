export function plasmaValue(x: number, y: number, time: number): number {
  const value =
    Math.sin(x * 0.06 + time * 1.3) +
    Math.sin(y * 0.05 + time * 1.1) +
    Math.sin((x + y) * 0.03 + time * 0.8) +
    Math.sin(Math.hypot(x - 160, y - 90) * 0.06 + time * 1.5);
  return value * 0.25 + 0.5;
}
