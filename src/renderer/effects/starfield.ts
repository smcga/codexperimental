import { randRange } from "../../util/math";

export type Star = {
  x: number;
  y: number;
  z: number;
  twinkle: number;
};

type StarfieldUpdateOptions = {
  turnRate?: number;
  turnStrength?: number;
  drift?: number;
};

type StarfieldRenderOptions = {
  warp?: number;
  sparkle?: number;
  colorShift?: number;
};

export class Starfield {
  private stars: Star[];
  private turnPhase = randRange(0, Math.PI * 2);
  private turnStrength = 0.35;
  private turnRate = 0.6;
  private drift = 0.14;
  private driftPhase = randRange(0, Math.PI * 2);

  constructor(private count: number, private depth: number) {
    this.stars = Array.from({ length: count }, () => this.spawnStar());
  }

  private spawnStar(): Star {
    return {
      x: randRange(-1, 1),
      y: randRange(-1, 1),
      z: randRange(0.1, this.depth),
      twinkle: randRange(0, Math.PI * 2)
    };
  }

  update(delta: number, speed: number, options: StarfieldUpdateOptions = {}): void {
    this.turnRate = options.turnRate ?? 0.6;
    this.turnStrength = options.turnStrength ?? 0.35;
    this.drift = options.drift ?? 0.14;
    this.turnPhase += delta * this.turnRate;
    this.driftPhase += delta * (0.4 + Math.abs(speed) * 0.35);
    const movement = speed * delta;
    this.stars.forEach((star) => {
      star.z -= movement;
      star.x += Math.sin(this.driftPhase + star.y * 5 + star.twinkle * 0.5) * this.drift * delta * 0.35;
      if (star.z <= 0.05) {
        Object.assign(star, this.spawnStar(), { z: this.depth });
      } else if (star.x < -1.4 || star.x > 1.4) {
        star.x = randRange(-1, 1);
      }
    });
  }

  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number,
    options: StarfieldRenderOptions = {}
  ): void {
    const warp = options.warp ?? 0;
    const sparkle = options.sparkle ?? 0.55;
    const colorShift = options.colorShift ?? 0;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) * 0.45;
    const yaw = Math.sin(this.turnPhase) * this.turnStrength;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    this.stars.forEach((star) => {
      const perspective = scale / star.z;
      const yawOffset = yaw * (1 - star.z / this.depth);
      const offsetX = star.x + yawOffset;
      const offsetY = star.y;
      const x = centerX + offsetX * perspective;
      const y = centerY + star.y * perspective;
      const size = Math.max(0.8, (1 - star.z / this.depth) * 3) + intensity * 1.5;
      const twinklePulse = 0.65 + 0.35 * Math.sin(this.turnPhase * 2.4 + star.twinkle);
      const sparkleBoost = 1 + sparkle * twinklePulse;
      const alpha = Math.min(1, (0.35 + intensity * 0.9) * sparkleBoost);
      const depthBlend = 1 - star.z / this.depth;
      const hue = 200 + colorShift * 120 - depthBlend * 30;
      const saturation = 72 + depthBlend * 18;
      const lightness = 65 + depthBlend * 18 + sparkle * twinklePulse * 8;
      ctx.fillStyle = `hsla(${hue.toFixed(1)}, ${saturation.toFixed(1)}%, ${lightness.toFixed(1)}%, ${alpha.toFixed(3)})`;
      ctx.fillRect(x, y, size, size);
      if (warp > 0.01) {
        ctx.strokeStyle = `hsla(${(hue - 8).toFixed(1)}, ${(saturation + 6).toFixed(1)}%, ${(lightness + 4).toFixed(1)}%, ${(alpha * warp).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(x, y);
        const streakStretch = 1 + warp * 2.2 + depthBlend * 0.8;
        ctx.lineTo(
          centerX + offsetX * perspective * streakStretch,
          centerY + offsetY * perspective * streakStretch
        );
        ctx.stroke();
      }
    });
    ctx.restore();
  }
}
