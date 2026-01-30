import { EffectDefinition } from "./types";

export class IsoGridEffect implements EffectDefinition {
  name = "isogrid";

  render({ ctx, width, height, time, audio }: Parameters<EffectDefinition["render"]>[0]): void {
    ctx.save();
    ctx.fillStyle = "#020014";
    ctx.fillRect(0, 0, width, height);
    ctx.translate(width / 2, height * 0.65);

    const gridSize = 20;
    const lines = 20;
    const wave = (x: number, y: number) =>
      Math.sin(time * 1.5 + x * 0.2 + y * 0.3) * (6 + audio.bass * 12);

    ctx.strokeStyle = `rgba(120, 220, 255, ${0.4 + audio.mid * 0.4})`;
    ctx.lineWidth = 1;

    for (let i = -lines; i <= lines; i += 1) {
      ctx.beginPath();
      for (let j = -lines; j <= lines; j += 1) {
        const x = (i * gridSize + j * gridSize) * 0.5;
        const y = (j * gridSize - i * gridSize) * 0.25;
        const z = wave(i, j);
        if (j === -lines) {
          ctx.moveTo(x, y - z);
        } else {
          ctx.lineTo(x, y - z);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }
}
