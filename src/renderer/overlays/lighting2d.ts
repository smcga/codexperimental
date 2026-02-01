import { AudioFeatures } from "../../audio/audioPlayer";
import { Lighting2DConfig, SectionConfig } from "../../config/loadConfig";
import { clamp } from "../../util/math";

type LightState = {
  beatBoost: number;
  jitterPhase: number;
};

type Point = {
  x: number;
  y: number;
};

const BEAT_DECAY = 2.4;
const BASE_SHADOW_ALPHA = 0.55;

export class Lighting2DOverlay {
  private shadowCanvas: HTMLCanvasElement;
  private shadowCtx: CanvasRenderingContext2D;
  private lightStateBySection = new Map<string, LightState[]>();

  constructor(width: number, height: number) {
    this.shadowCanvas = document.createElement("canvas");
    this.shadowCanvas.width = width;
    this.shadowCanvas.height = height;
    const shadowCtx = this.shadowCanvas.getContext("2d");
    if (!shadowCtx) {
      throw new Error("Unable to create lighting shadow canvas");
    }
    this.shadowCtx = shadowCtx;
  }

  reset(): void {
    this.lightStateBySection.clear();
    this.shadowCtx.clearRect(0, 0, this.shadowCanvas.width, this.shadowCanvas.height);
  }

  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    delta: number,
    audio: AudioFeatures,
    section: SectionConfig
  ): void {
    const lighting = section.overlays.lighting2d;
    if (!lighting || !lighting.enabled) {
      return;
    }

    this.ensureShadowSize(width, height);
    this.applyAmbient(ctx, width, height, lighting);
    this.renderShadows(width, height, time, delta, audio, lighting, section.id);
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(this.shadowCanvas, 0, 0, width, height);
    ctx.restore();
    this.renderLights(ctx, width, height, time, delta, audio, lighting, section.id);
  }

  private ensureShadowSize(width: number, height: number): void {
    if (this.shadowCanvas.width !== width || this.shadowCanvas.height !== height) {
      this.shadowCanvas.width = width;
      this.shadowCanvas.height = height;
    }
  }

  private applyAmbient(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    lighting: Lighting2DConfig
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = `rgba(0, 0, 0, ${clamp(lighting.ambient, 0, 1)})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  private renderShadows(
    width: number,
    height: number,
    time: number,
    delta: number,
    audio: AudioFeatures,
    lighting: Lighting2DConfig,
    sectionId: string
  ): void {
    const shadowCtx = this.shadowCtx;
    shadowCtx.clearRect(0, 0, width, height);

    const minDim = Math.min(width, height);
    const shadowLengthPx = lighting.shadow.length * minDim;
    const baseShadowAlpha = clamp(BASE_SHADOW_ALPHA + lighting.ambient * 0.1, 0.2, 0.8);
    const softShadowAlpha = baseShadowAlpha * 0.4;
    const softLength = shadowLengthPx * (1 + lighting.shadow.softness * 0.6);

    const lightStates = this.getLightStates(sectionId, lighting);

    lighting.lights.forEach((light, index) => {
      const state = lightStates[index];
      if (!state) {
        return;
      }
      const { x, y } = this.resolveLightPosition(light, width, height, time, audio, state);
      lighting.occluders.forEach((occluder) => {
        const rect = {
          x: occluder.x * width,
          y: occluder.y * height,
          w: occluder.w * width,
          h: occluder.h * height
        };
        if (this.isPointInsideRect(x, y, rect)) {
          return;
        }
        const corners = this.getRectCorners(rect);
        const silhouette = this.getSilhouetteCorners({ x, y }, corners);
        if (!silhouette) {
          return;
        }
        const shadowPolygon = this.buildShadowPolygon({ x, y }, silhouette, shadowLengthPx);
        shadowCtx.fillStyle = `rgba(0, 0, 0, ${baseShadowAlpha})`;
        this.fillPolygon(shadowCtx, shadowPolygon);

        if (lighting.shadow.softness > 0) {
          const softPolygon = this.buildShadowPolygon({ x, y }, silhouette, softLength);
          shadowCtx.fillStyle = `rgba(0, 0, 0, ${softShadowAlpha})`;
          this.fillPolygon(shadowCtx, softPolygon);
        }
      });
    });

  }

  private renderLights(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    delta: number,
    audio: AudioFeatures,
    lighting: Lighting2DConfig,
    sectionId: string
  ): void {
    const minDim = Math.min(width, height);
    const lightStates = this.getLightStates(sectionId, lighting);

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    lighting.lights.forEach((light, index) => {
      const state = lightStates[index];
      if (!state) {
        return;
      }
      const { x, y } = this.resolveLightPosition(light, width, height, time, audio, state);
      const radius = light.radius * minDim;
      if (radius <= 0) {
        return;
      }
      const flicker = 1 + light.flicker * (0.5 * audio.rms + 0.5 * audio.bass);
      const beatBoost = 1 + state.beatBoost * 0.5;
      const intensity = clamp(light.intensity * flicker * beatBoost, 0, 2);
      const alpha = clamp(0.35 * intensity, 0, 1);

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, light.colour);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.globalAlpha = alpha;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
    this.updateBeatStates(lightStates, delta, audio.beat);
  }

  private resolveLightPosition(
    light: Lighting2DConfig["lights"][number],
    width: number,
    height: number,
    time: number,
    audio: AudioFeatures,
    state: LightState
  ): Point {
    let nx = light.x;
    let ny = light.y;
    if (light.follow === "centre") {
      nx = 0.5;
      ny = 0.5;
    } else if (light.follow === "beatJitter") {
      const jitter = 0.05 * audio.beatStrength;
      const phase = time * 2.4 + state.jitterPhase;
      nx += Math.cos(phase) * jitter;
      ny += Math.sin(phase * 1.3) * jitter;
    }
    nx = clamp(nx, 0, 1);
    ny = clamp(ny, 0, 1);
    return { x: nx * width, y: ny * height };
  }

  private updateBeatStates(states: LightState[], delta: number, beat: boolean): void {
    states.forEach((state) => {
      if (beat) {
        state.beatBoost = 1;
      } else {
        state.beatBoost = Math.max(0, state.beatBoost - delta * BEAT_DECAY);
      }
    });
  }

  private getLightStates(sectionId: string, lighting: Lighting2DConfig): LightState[] {
    const existing = this.lightStateBySection.get(sectionId);
    if (existing && existing.length === lighting.lights.length) {
      return existing;
    }
    const states = lighting.lights.map((_, index) => {
      return {
        beatBoost: 0,
        jitterPhase: index * 1.7
      };
    });
    this.lightStateBySection.set(sectionId, states);
    return states;
  }

  private isPointInsideRect(pointX: number, pointY: number, rect: { x: number; y: number; w: number; h: number }): boolean {
    return pointX >= rect.x && pointX <= rect.x + rect.w && pointY >= rect.y && pointY <= rect.y + rect.h;
  }

  private getRectCorners(rect: { x: number; y: number; w: number; h: number }): Point[] {
    return [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.w, y: rect.y },
      { x: rect.x + rect.w, y: rect.y + rect.h },
      { x: rect.x, y: rect.y + rect.h }
    ];
  }

  private getSilhouetteCorners(light: Point, corners: Point[]): [Point, Point] | null {
    const angles = corners.map((corner) => {
      let angle = Math.atan2(corner.y - light.y, corner.x - light.x);
      if (angle < 0) {
        angle += Math.PI * 2;
      }
      return { corner, angle };
    });
    angles.sort((a, b) => a.angle - b.angle);

    let maxGap = -Infinity;
    let gapIndex = 0;
    for (let i = 0; i < angles.length; i += 1) {
      const nextIndex = (i + 1) % angles.length;
      const current = angles[i].angle;
      const next = angles[nextIndex].angle + (nextIndex === 0 ? Math.PI * 2 : 0);
      const gap = next - current;
      if (gap > maxGap) {
        maxGap = gap;
        gapIndex = i;
      }
    }

    const startIndex = (gapIndex + 1) % angles.length;
    const endIndex = gapIndex;
    const cornerA = angles[startIndex].corner;
    const cornerB = angles[endIndex].corner;
    if (!cornerA || !cornerB) {
      return null;
    }
    return [cornerA, cornerB];
  }

  private buildShadowPolygon(light: Point, corners: [Point, Point], length: number): Point[] {
    const [cornerA, cornerB] = corners;
    const farA = this.extendPoint(light, cornerA, length);
    const farB = this.extendPoint(light, cornerB, length);
    return [cornerA, cornerB, farB, farA];
  }

  private extendPoint(light: Point, corner: Point, length: number): Point {
    const dx = corner.x - light.x;
    const dy = corner.y - light.y;
    const mag = Math.hypot(dx, dy);
    if (mag === 0) {
      return { x: corner.x, y: corner.y };
    }
    const dirX = dx / mag;
    const dirY = dy / mag;
    return {
      x: corner.x + dirX * length,
      y: corner.y + dirY * length
    };
  }

  private fillPolygon(ctx: CanvasRenderingContext2D, points: Point[]): void {
    if (points.length < 3) {
      return;
    }
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }
}
