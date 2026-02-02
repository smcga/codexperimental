import { Effect, EffectRenderContext } from "./types";
import { clamp } from "../../util/math";
import { ParticleSystem } from "./particles";

export class ParticleFieldEffect implements Effect {
  private particles = new ParticleSystem();

  render({ ctx, width, height, delta, audio, params }: EffectRenderContext): void {
    const trail = clamp(params.trail ?? 0.2, 0, 0.6);
    ctx.fillStyle = `rgba(0, 0, 0, ${trail})`;
    ctx.fillRect(0, 0, width, height);

    const burstBase = clamp(Math.round(params.burst ?? 24), 4, 80);
    const burstAudio = clamp(params.burstAudio ?? 20, 0, 60);
    const forceBase = clamp(params.force ?? 1, 0.2, 4);
    const forceAudio = clamp(params.forceAudio ?? 2, 0, 6);

    if (audio.beat) {
      this.particles.emitBurst(
        burstBase + Math.floor(audio.bass * burstAudio),
        width,
        height,
        forceBase + audio.bass * forceAudio
      );
    }
    this.particles.update(delta);
    this.particles.render(ctx, audio.bass + audio.rms);
  }

  reset(): void {
    this.particles = new ParticleSystem();
  }
}
