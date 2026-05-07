import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type Pose = {
  hipX: number;
  hipY: number;
  chestX: number;
  chestY: number;
  headX: number;
  headY: number;
  leftElbowX: number;
  leftElbowY: number;
  leftHandX: number;
  leftHandY: number;
  rightElbowX: number;
  rightElbowY: number;
  rightHandX: number;
  rightHandY: number;
  leftKneeX: number;
  leftKneeY: number;
  leftFootX: number;
  leftFootY: number;
  rightKneeX: number;
  rightKneeY: number;
  rightFootX: number;
  rightFootY: number;
};

type Point2D = [number, number];

export const LUSH_LIFE_DANCE_DEFAULTS = {
  bpm: 120,
  amplitude: 1,
  bounce: 0.7,
  trail: 0.28,
  glow: 0.55,
  silhouetteScale: 1,
  stageHue: 316,
  accentHue: 186,
  audioReactive: 0.6
} as const;

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const resolveLushLifeDanceParams = (params: Record<string, unknown>) => ({
  bpm: clamp(toNumber(params.bpm, LUSH_LIFE_DANCE_DEFAULTS.bpm), 60, 180),
  amplitude: clamp(toNumber(params.amplitude, LUSH_LIFE_DANCE_DEFAULTS.amplitude), 0.4, 1.8),
  bounce: clamp(toNumber(params.bounce, LUSH_LIFE_DANCE_DEFAULTS.bounce), 0, 1.2),
  trail: clamp(toNumber(params.trail, LUSH_LIFE_DANCE_DEFAULTS.trail), 0, 0.9),
  glow: clamp(toNumber(params.glow, LUSH_LIFE_DANCE_DEFAULTS.glow), 0, 1),
  silhouetteScale: clamp(toNumber(params.silhouetteScale, LUSH_LIFE_DANCE_DEFAULTS.silhouetteScale), 0.5, 1.5),
  stageHue: clamp(toNumber(params.stageHue, LUSH_LIFE_DANCE_DEFAULTS.stageHue), 0, 360),
  accentHue: clamp(toNumber(params.accentHue, LUSH_LIFE_DANCE_DEFAULTS.accentHue), 0, 360),
  audioReactive: clamp(toNumber(params.audioReactive, LUSH_LIFE_DANCE_DEFAULTS.audioReactive), 0, 1)
});

const BASE_POSE: Pose = {
  hipX: 0,
  hipY: 0,
  chestX: 0,
  chestY: -0.24,
  headX: 0,
  headY: -0.42,
  leftElbowX: -0.14,
  leftElbowY: -0.18,
  leftHandX: -0.2,
  leftHandY: -0.02,
  rightElbowX: 0.14,
  rightElbowY: -0.18,
  rightHandX: 0.2,
  rightHandY: -0.02,
  leftKneeX: -0.1,
  leftKneeY: 0.22,
  leftFootX: -0.12,
  leftFootY: 0.48,
  rightKneeX: 0.1,
  rightKneeY: 0.22,
  rightFootX: 0.12,
  rightFootY: 0.48
};

const LIMB_CHOREOGRAPHY_SPEED_MULTIPLIER = 5;

const buildPose = (overrides: Partial<Pose>): Pose => ({ ...BASE_POSE, ...overrides });

const POSES: Pose[] = [
  buildPose({ hipX: 0.1, rightHandX: 0.34, rightHandY: -0.2, leftHandX: -0.24 }),
  buildPose({ hipY: 0.02, chestY: -0.22 }),
  buildPose({ hipX: -0.1, leftHandX: -0.34, leftHandY: -0.2, rightHandX: 0.24 }),
  buildPose({ hipY: 0.02, chestY: -0.22 }),
  buildPose({ hipX: 0.16, rightHandX: 0.36, rightHandY: -0.34, leftHandX: -0.12 }),
  buildPose({ chestX: 0.08, rightHandX: 0.2, rightHandY: -0.08 }),
  buildPose({ hipX: -0.12, leftHandX: -0.32, rightHandX: 0.32, leftHandY: -0.06, rightHandY: -0.06 }),
  buildPose({ chestY: -0.2, leftHandX: -0.12, rightHandX: 0.12, leftHandY: -0.12, rightHandY: -0.12 }),
  buildPose({ rightHandX: 0.16, rightHandY: -0.38, leftHandX: -0.16, leftHandY: -0.38, hipX: 0.08 }),
  buildPose({ headX: -0.05, leftHandY: -0.36, rightHandY: -0.34 }),
  buildPose({ leftHandX: -0.08, rightHandX: 0.08, leftHandY: -0.22, rightHandY: -0.22 }),
  buildPose({ chestY: -0.19, hipY: 0.02 }),
  buildPose({ chestY: -0.3, headY: -0.47 }),
  buildPose({ chestY: -0.2, hipY: 0.08, leftKneeY: 0.24, rightKneeY: 0.24 }),
  buildPose({ hipX: 0.06, chestX: 0.1, rightFootX: 0.04, leftFootX: -0.18 }),
  buildPose({ hipX: 0, chestX: 0, leftHandX: -0.18, rightHandX: 0.24, rightHandY: -0.3 }),
];

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const sampleLushLifePose = (phraseProgress: number): Pose => {
  const wrapped = ((phraseProgress % 1) + 1) % 1;
  const frameIndex = wrapped * POSES.length;
  const currentIndex = Math.floor(frameIndex) % POSES.length;
  const nextIndex = (currentIndex + 1) % POSES.length;
  const t = frameIndex - Math.floor(frameIndex);
  const current = POSES[currentIndex];
  const next = POSES[nextIndex];
  const result = {} as Pose;
  (Object.keys(BASE_POSE) as Array<keyof Pose>).forEach((key) => {
    result[key] = lerp(current[key], next[key], t);
  });
  return result;
};

export const resolveLushLifePoseProgress = (beats: number): number =>
  ((beats * LIMB_CHOREOGRAPHY_SPEED_MULTIPLIER) / 48) % 1;

export const buildHandFingerSegments = (
  wrist: Point2D,
  elbow: Point2D,
  palmRadius: number,
  spread: number
): Array<{ from: Point2D; to: Point2D }> => {
  const axisX = wrist[0] - elbow[0];
  const axisY = wrist[1] - elbow[1];
  const axisLen = Math.hypot(axisX, axisY) || 1;
  const dirX = axisX / axisLen;
  const dirY = axisY / axisLen;
  const perpX = -dirY;
  const perpY = dirX;

  return [-0.9, -0.45, 0, 0.45, 0.9].map((offsetScale, index) => {
    const baseX = wrist[0] + perpX * offsetScale * palmRadius * 0.9;
    const baseY = wrist[1] + perpY * offsetScale * palmRadius * 0.9;
    const fingerLength = palmRadius * (1.05 + (index === 2 ? 0.25 : 0));
    const curl = 0.18 - Math.abs(offsetScale) * 0.08;
    return {
      from: [baseX, baseY] as Point2D,
      to: [baseX + dirX * fingerLength + perpX * spread * curl, baseY + dirY * fingerLength + perpY * spread * curl] as Point2D
    };
  });
};

export class LushLifeDanceEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const cfg = resolveLushLifeDanceParams(params as Record<string, unknown>);
    const beats = time * (cfg.bpm / 60);
    const phraseProgress = resolveLushLifePoseProgress(beats);
    const countPulse = beats % 1;

    const bass = clamp(audio.bass, 0, 1);
    const rms = clamp(audio.rms, 0, 1);
    const beatBoost = (audio.beat ? 0.25 : 0) + clamp(audio.beatStrength, 0, 1) * 0.45;
    const drive = (bass * 0.8 + rms * 0.7 + beatBoost) * cfg.audioReactive;

    const pose = sampleLushLifePose(phraseProgress);
    const dancerScale = Math.min(width, height) * 0.5 * cfg.silhouetteScale;

    ctx.fillStyle = `hsla(${cfg.stageHue.toFixed(1)} 55% 6% / ${clamp(0.82 + cfg.trail * 0.25, 0, 1).toFixed(3)})`;
    ctx.fillRect(0, 0, width, height);

    const floorY = height * 0.82;
    ctx.fillStyle = `hsla(${(cfg.accentHue + 18).toFixed(1)} 82% 56% / ${(0.12 + drive * 0.2).toFixed(3)})`;
    ctx.fillRect(0, floorY, width, height - floorY);

    const centerX = width * 0.5 + Math.sin(beats * Math.PI) * 16 * cfg.amplitude;
    const bounce = Math.sin(countPulse * Math.PI) * 24 * cfg.bounce * (1 + drive * 0.7);
    const centerY = height * 0.62 + bounce;

    const project = (x: number, y: number): [number, number] => [centerX + x * dancerScale * cfg.amplitude, centerY + y * dancerScale];

    const joints = {
      hip: project(pose.hipX, pose.hipY),
      chest: project(pose.chestX, pose.chestY),
      head: project(pose.headX, pose.headY),
      le: project(pose.leftElbowX, pose.leftElbowY),
      lh: project(pose.leftHandX, pose.leftHandY),
      re: project(pose.rightElbowX, pose.rightElbowY),
      rh: project(pose.rightHandX, pose.rightHandY),
      lk: project(pose.leftKneeX, pose.leftKneeY),
      lf: project(pose.leftFootX, pose.leftFootY),
      rk: project(pose.rightKneeX, pose.rightKneeY),
      rf: project(pose.rightFootX, pose.rightFootY)
    };

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = `hsl(${cfg.accentHue.toFixed(1)} 95% ${(60 + drive * 18).toFixed(1)}%)`;
    ctx.shadowColor = `hsla(${cfg.accentHue.toFixed(1)} 100% 65% / ${clamp(cfg.glow * (0.5 + drive), 0, 1).toFixed(3)})`;
    ctx.shadowBlur = 28 * cfg.glow * (1 + drive);
    ctx.lineWidth = Math.max(3, dancerScale * 0.028);

    const drawLimb = (a: Point2D, b: Point2D) => {
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    };

    drawLimb(joints.head, joints.chest);
    drawLimb(joints.chest, joints.hip);
    drawLimb(joints.chest, joints.le);
    drawLimb(joints.le, joints.lh);
    drawLimb(joints.chest, joints.re);
    drawLimb(joints.re, joints.rh);
    drawLimb(joints.hip, joints.lk);
    drawLimb(joints.lk, joints.lf);
    drawLimb(joints.hip, joints.rk);
    drawLimb(joints.rk, joints.rf);

    const shoulderWidth = dancerScale * 0.14;
    const leftShoulder: Point2D = [joints.chest[0] - shoulderWidth, joints.chest[1] - dancerScale * 0.02];
    const rightShoulder: Point2D = [joints.chest[0] + shoulderWidth, joints.chest[1] - dancerScale * 0.02];
    drawLimb(leftShoulder, rightShoulder);

    const drawPalmAndFingers = (wrist: Point2D, elbow: Point2D, spread: number): void => {
      const palmRadius = Math.max(3, dancerScale * 0.018);
      ctx.beginPath();
      ctx.arc(wrist[0], wrist[1], palmRadius, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();

      const fingers = buildHandFingerSegments(wrist, elbow, palmRadius, spread);
      ctx.lineWidth = Math.max(1.3, dancerScale * 0.009);
      fingers.forEach((finger) => drawLimb(finger.from, finger.to));
      ctx.lineWidth = Math.max(3, dancerScale * 0.028);
    };

    drawPalmAndFingers(joints.lh, joints.le, -1);
    drawPalmAndFingers(joints.rh, joints.re, 1);

    ctx.fillStyle = `hsla(${cfg.accentHue.toFixed(1)} 100% 72% / ${(0.25 + drive * 0.22).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(joints.hip[0], joints.hip[1] + dancerScale * 0.06, dancerScale * 0.13, dancerScale * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `hsl(${(cfg.stageHue + 28).toFixed(1)} 82% ${(54 + drive * 20).toFixed(1)}%)`;
    ctx.beginPath();
    ctx.arc(joints.head[0], joints.head[1], Math.max(9, dancerScale * 0.05), 0, Math.PI * 2);
    ctx.fill();
  }
}
