import { lerp } from "../../util/math";
import { ParticleSystem } from "./particles";
import { Starfield } from "./starfield";
import type { Effect, EffectRenderArgs } from "./types";

export class FinaleEffect implements Effect {
  private stars = new Starfield(260, 2.8);
  private particles = new ParticleSystem();

  render({ ctx, width, height, time, delta, features }: EffectRenderArgs): void {
    const intensity = lerp(0.6, 1.6, features.bass + features.beatStrength * 0.6);
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, width, height);

    this.stars.update(delta, 1.2 + intensity * 1.2);
    this.stars.render(ctx, width, height, intensity);

    if (features.beat) {
      this.particles.emitBurst(40, width, height, 3 + intensity * 2);
    }
    this.particles.update(delta);
    this.particles.render(ctx, intensity);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(80, 220, 255, ${0.15 + intensity * 0.2})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = `rgba(255, 200, 120, ${0.4 + features.treble * 0.4})`;
    ctx.lineWidth = 2 + features.mid * 2;
    ctx.beginPath();
    const radius = Math.min(width, height) * (0.2 + Math.sin(time) * 0.04);
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
