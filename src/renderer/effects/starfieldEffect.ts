import { Effect, EffectRenderContext } from "./types";
import { Starfield } from "./starfield";
import { clamp } from "../../util/math";

export class StarfieldEffect implements Effect {
  private starfield = new Starfield(260, 2.6);

  render({ ctx, width, height, delta, audio, params }: EffectRenderContext): void {
    const speed = params.speed ?? 1.0;
    const warp = params.warp ?? 0.3;
    const turn = params.turn ?? 0.4;
    const intensity = clamp(audio.bass + audio.rms, 0, 1);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);
    this.starfield.update(delta, 0.6 + speed + audio.bass * 2.2, turn + audio.rms * 0.3);
    this.starfield.render(ctx, width, height, intensity, warp + audio.beatStrength * 0.6);
  }

  reset(): void {
    this.starfield = new Starfield(260, 2.6);
  }
}
