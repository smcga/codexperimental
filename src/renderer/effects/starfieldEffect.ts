import type { EffectRenderContext } from "./types";
import { Starfield } from "./starfield";

export class StarfieldEffect {
  private field = new Starfield(260, 2.8);

  render({ ctx, width, height, delta, features, params }: EffectRenderContext): void {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#02040d";
    ctx.fillRect(0, 0, width, height);

    const speed = params.speed ?? 0.9;
    const warp = params.warp ?? 0.25;
    this.field.update(delta, speed + features.bass * 1.2 + warp * 2);
    this.field.render(ctx, width, height, features.treble + features.bass * 0.6);
  }

  reset(): void {
    this.field = new Starfield(260, 2.8);
  }
}
