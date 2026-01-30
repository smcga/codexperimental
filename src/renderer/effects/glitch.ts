import { randRange } from "../../util/math";
import { EffectDefinition } from "./types";

export class GlitchEffect implements EffectDefinition {
  name = "glitch";

  render({ ctx, width, height, time, audio }: Parameters<EffectDefinition["render"]>[0]): void {
    ctx.save();
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#12001d");
    gradient.addColorStop(1, "#001018");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + audio.treble * 0.2})`;
    for (let i = 0; i < 40; i += 1) {
      ctx.fillRect(randRange(0, width), randRange(0, height), randRange(40, 140), 1);
    }

    if (audio.beat || Math.random() < audio.treble * 0.2) {
      const slices = 8 + Math.floor(audio.treble * 12);
      for (let i = 0; i < slices; i += 1) {
        const sliceHeight = randRange(6, 20);
        const y = randRange(0, height - sliceHeight);
        const offset = randRange(-30, 30) * (0.3 + audio.treble);
        ctx.drawImage(ctx.canvas, 0, y, width, sliceHeight, offset, y, width, sliceHeight);
      }
    }

    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(60, 220, 255, ${0.12 + audio.treble * 0.2})`;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = `rgba(255, 70, 200, ${0.08 + audio.beatStrength * 0.2})`;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(time * 4) * 0.05})`;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }
}
