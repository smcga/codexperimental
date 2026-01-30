export function tunnelValue(x: number, y: number, time: number): number {
  const cx = x - 160;
  const cy = y - 90;
  const radius = Math.sqrt(cx * cx + cy * cy) + 0.0001;
  const angle = Math.atan2(cy, cx);
  const wave = Math.sin(radius * 0.08 - time * 2.2);
  const stripes = Math.sin(angle * 8 + time * 1.5);
  return 0.5 + 0.25 * wave + 0.25 * stripes;
}
