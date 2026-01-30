import { lerp } from "../../util/math";
import { Starfield } from "./starfield";
import type { Effect, EffectRenderArgs } from "./types";

export class StarfieldEffect implements Effect {
  private stars = new Starfield(240, 2.6);

  render({ ctx, width, height, delta, features, params }: EffectRenderArgs): void {
    const speed = typeof params?.speed === "number" ? params.speed : 1;
    const warp = typeof params?.warp === "number" ? params.warp : 0.4;
    const intensity = lerp(0.4, 1.4, features.bass + features.beatStrength * 0.6);

    ctx.fillStyle = "#02040c";
    ctx.fillRect(0, 0, width, height);

    this.stars.update(delta, speed + intensity * warp);
    this.stars.render(ctx, width, height, intensity);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(120, 200, 255, ${0.2 + intensity * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(width * 0.1, height * 0.5);
    ctx.lineTo(width * 0.9, height * 0.5);
    ctx.stroke();
    ctx.restore();
  }
}
