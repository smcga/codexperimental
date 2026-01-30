export class PixelBuffer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData;

  constructor(public width: number, public height: number) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create pixel buffer context");
    }
    this.ctx = ctx;
    this.imageData = ctx.createImageData(width, height);
  }

  commit(): void {
    this.ctx.putImageData(this.imageData, 0, 0);
  }
}
