export function rotoValue(x: number, y: number, time: number): number {
  const angle = time * 0.6;
  const scale = 0.8 + 0.2 * Math.sin(time * 0.8);
  const u = (x - 160) * Math.cos(angle) - (y - 90) * Math.sin(angle);
  const v = (x - 160) * Math.sin(angle) + (y - 90) * Math.cos(angle);
  const checks = ((Math.floor((u * scale) / 20) + Math.floor((v * scale) / 20)) & 1) === 0 ? 1 : 0;
  return checks ? 0.8 : 0.2;
}
