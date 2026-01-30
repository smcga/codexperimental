import { EffectDefinition } from "./types";

export class RotozoomEffect implements EffectDefinition {
  name = "rotozoom";

  render({ ctx, width, height, time, audio, params }: Parameters<EffectDefinition["render"]>[0]): void {
    const scale = 1.2 + Math.sin(time * 0.8) * 0.2 + audio.bass * 0.4;
    const rotation = time * (params.rotateSpeed ?? 0.3) + audio.treble * 0.8;
    const size = params.tileSize ?? 24;

    ctx.save();
    ctx.fillStyle = "#050009";
    ctx.fillRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    for (let y = -height; y < height; y += size) {
      for (let x = -width; x < width; x += size) {
        const checker = ((x / size) ^ (y / size)) & 1;
        ctx.fillStyle = checker
          ? `rgba(255, 120, 220, ${0.3 + audio.mid * 0.4})`
          : `rgba(50, 160, 255, ${0.2 + audio.mid * 0.3})`;
        ctx.fillRect(x, y, size, size);
      }
    }

    ctx.restore();
  }
}
