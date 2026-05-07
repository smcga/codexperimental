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
type OutfitAnchors = { leftShoulder: Point2D; rightShoulder: Point2D; leftWaist: Point2D; rightWaist: Point2D; leftHip: Point2D; rightHip: Point2D };

export const LUSH_LIFE_DANCE_DEFAULTS = {
  bpm: 120,
  amplitude: 1,
  bounce: 0.7,
  trail: 0.28,
  glow: 0.55,
  silhouetteScale: 1,
  stageHue: 316,
  accentHue: 186,
  audioReactive: 0.6,
  hairHue: 48,
  outfitHue: 316,
  metalHue: 200,
  sparkle: 0.65,
  fashionDetail: 0.75
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
  audioReactive: clamp(toNumber(params.audioReactive, LUSH_LIFE_DANCE_DEFAULTS.audioReactive), 0, 1),
  hairHue: clamp(toNumber(params.hairHue, LUSH_LIFE_DANCE_DEFAULTS.hairHue), 0, 360),
  outfitHue: clamp(toNumber(params.outfitHue, LUSH_LIFE_DANCE_DEFAULTS.outfitHue), 0, 360),
  metalHue: clamp(toNumber(params.metalHue, LUSH_LIFE_DANCE_DEFAULTS.metalHue), 0, 360),
  sparkle: clamp(toNumber(params.sparkle, LUSH_LIFE_DANCE_DEFAULTS.sparkle), 0, 1),
  fashionDetail: clamp(toNumber(params.fashionDetail, LUSH_LIFE_DANCE_DEFAULTS.fashionDetail), 0, 1)
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



export const buildLushLifeOutfitAnchors = (joints: { chest: Point2D; hip: Point2D }, dancerScale: number): OutfitAnchors => {
  const shoulderWidth = dancerScale * 0.18;
  const waistWidth = dancerScale * 0.105;
  const hipWidth = dancerScale * 0.145;
  const shoulderY = joints.chest[1] + dancerScale * 0.015;
  const waistY = lerp(joints.chest[1], joints.hip[1], 0.58);
  const hipY = joints.hip[1] + dancerScale * 0.018;
  const torsoLeanX = joints.hip[0] - joints.chest[0];
  const centerX = lerp(joints.chest[0], joints.hip[0], 0.55);
  return {
    leftShoulder: [joints.chest[0] - shoulderWidth + torsoLeanX * 0.08, shoulderY],
    rightShoulder: [joints.chest[0] + shoulderWidth + torsoLeanX * 0.08, shoulderY],
    leftWaist: [centerX - waistWidth, waistY],
    rightWaist: [centerX + waistWidth, waistY],
    leftHip: [joints.hip[0] - hipWidth, hipY],
    rightHip: [joints.hip[0] + hipWidth, hipY]
  };
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
    const headRadius = Math.max(9, dancerScale * 0.05);
    const anchors = buildLushLifeOutfitAnchors({ chest: joints.chest, hip: joints.hip }, dancerScale);

    const drawStageLights = (): void => {
      ctx.save();
      const halo = ctx.createRadialGradient(centerX, centerY - dancerScale * 0.2, dancerScale * 0.1, centerX, centerY, dancerScale * 1.1);
      halo.addColorStop(0, `hsla(${cfg.outfitHue.toFixed(1)} 95% 65% / ${(0.16 + drive * 0.18).toFixed(3)})`);
      halo.addColorStop(1, "hsla(0 0% 0% / 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, floorY);

      for (let i = 0; i < 3; i += 1) {
        const t = beats * 0.85 + i * 1.9;
        const x = width * (0.2 + i * 0.3) + Math.sin(t) * width * 0.05;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - width * 0.18, floorY);
        ctx.lineTo(x + width * 0.18, floorY);
        ctx.closePath();
        ctx.fillStyle = `hsla(${(cfg.metalHue + i * 18).toFixed(1)} 100% 70% / ${(0.035 + drive * 0.05).toFixed(3)})`;
        ctx.fill();
      }
      ctx.restore();
    };

    const drawGhostTrail = (): void => {
      if (cfg.trail < 0.06) return;
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(2, dancerScale * 0.021);
      ctx.strokeStyle = `hsla(${cfg.accentHue.toFixed(1)} 90% 68% / ${(cfg.trail * 0.28).toFixed(3)})`;
      for (let i = 1; i <= 3; i += 1) {
        const ghostPose = sampleLushLifePose(phraseProgress - i * 0.025);
        const ghostX = centerX - i * 8 * cfg.amplitude;
        const ghostY = centerY + i * 3;
        const g = (x: number, y: number): Point2D => [ghostX + x * dancerScale * cfg.amplitude, ghostY + y * dancerScale];
        const gh = {
          head: g(ghostPose.headX, ghostPose.headY),
          chest: g(ghostPose.chestX, ghostPose.chestY),
          hip: g(ghostPose.hipX, ghostPose.hipY),
          le: g(ghostPose.leftElbowX, ghostPose.leftElbowY),
          lh: g(ghostPose.leftHandX, ghostPose.leftHandY),
          re: g(ghostPose.rightElbowX, ghostPose.rightElbowY),
          rh: g(ghostPose.rightHandX, ghostPose.rightHandY),
          lk: g(ghostPose.leftKneeX, ghostPose.leftKneeY),
          lf: g(ghostPose.leftFootX, ghostPose.leftFootY),
          rk: g(ghostPose.rightKneeX, ghostPose.rightKneeY),
          rf: g(ghostPose.rightFootX, ghostPose.rightFootY)
        };
        [[gh.head, gh.chest], [gh.chest, gh.hip], [gh.chest, gh.le], [gh.le, gh.lh], [gh.chest, gh.re], [gh.re, gh.rh], [gh.hip, gh.lk], [gh.lk, gh.lf], [gh.hip, gh.rk], [gh.rk, gh.rf]].forEach((seg) => {
          ctx.beginPath(); ctx.moveTo(seg[0][0], seg[0][1]); ctx.lineTo(seg[1][0], seg[1][1]); ctx.stroke();
        });
      }
      ctx.restore();
    };
    const drawHair = (): void => {
      const sway = Math.sin(beats * 0.7) * headRadius * 0.1 + drive * headRadius * 0.06;
      const hairW = headRadius * 1.7;
      const hairDrop = headRadius * 1.15;
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.shadowColor = `hsla(${cfg.hairHue.toFixed(1)} 95% 65% / 0.42)`;
      ctx.shadowBlur = 9 + 5 * cfg.fashionDetail;
      ctx.fillStyle = `hsl(${cfg.hairHue.toFixed(1)} 95% 61%)`;
      ctx.beginPath();
      ctx.moveTo(joints.head[0] - hairW * 0.52, joints.head[1] - headRadius * 0.42);
      ctx.bezierCurveTo(
        joints.head[0] - hairW * 0.95,
        joints.head[1] - headRadius * 0.04,
        joints.head[0] - hairW * 0.78,
        joints.head[1] + hairDrop * 0.88,
        joints.head[0] - hairW * 0.18,
        joints.head[1] + hairDrop * 0.98
      );
      ctx.bezierCurveTo(
        joints.head[0] + hairW * 0.42 + sway,
        joints.head[1] + hairDrop * 0.92,
        joints.head[0] + hairW * 0.78 + sway,
        joints.head[1] + hairDrop * 0.28,
        joints.head[0] + hairW * 0.5,
        joints.head[1] - headRadius * 0.34
      );
      ctx.bezierCurveTo(
        joints.head[0] + hairW * 0.14,
        joints.head[1] - headRadius * 0.56,
        joints.head[0] - hairW * 0.2,
        joints.head[1] - headRadius * 0.56,
        joints.head[0] - hairW * 0.52,
        joints.head[1] - headRadius * 0.42
      );
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = `hsla(${(cfg.hairHue + 12).toFixed(1)} 100% 75% / 0.42)`;
      ctx.beginPath();
      ctx.moveTo(joints.head[0] - hairW * 0.12, joints.head[1] - headRadius * 0.1);
      ctx.bezierCurveTo(
        joints.head[0] + hairW * 0.24,
        joints.head[1] - headRadius * 0.2,
        joints.head[0] + hairW * 0.34 + sway * 0.2,
        joints.head[1] + hairDrop * 0.28,
        joints.head[0] + hairW * 0.02,
        joints.head[1] + hairDrop * 0.38
      );
      ctx.fill();
      ctx.restore();
    };

    const drawLimb = (a: Point2D, b: Point2D) => {
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    };

    const drawOutfit = (): void => {
      ctx.save();
      ctx.shadowBlur = 10 * (0.8 + drive);
      ctx.shadowColor = `hsla(${cfg.outfitHue.toFixed(1)} 100% 60% / 0.35)`;
      ctx.fillStyle = `hsla(${cfg.outfitHue.toFixed(1)} 95% 58% / ${(0.52 + cfg.fashionDetail * 0.2).toFixed(3)})`;
      ctx.beginPath();
      const topInset = dancerScale * 0.018;
      const topBottomY = anchors.leftWaist[1] - dancerScale * 0.025;
      ctx.moveTo(anchors.leftShoulder[0] + topInset, anchors.leftShoulder[1] + dancerScale * 0.004);
      ctx.quadraticCurveTo(joints.chest[0], anchors.leftShoulder[1] - dancerScale * 0.006, anchors.rightShoulder[0] - topInset, anchors.rightShoulder[1] + dancerScale * 0.004);
      ctx.lineTo(anchors.rightWaist[0] - dancerScale * 0.008, topBottomY);
      ctx.lineTo(anchors.leftWaist[0] + dancerScale * 0.008, topBottomY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = `hsla(${cfg.outfitHue.toFixed(1)} 92% 56% / 0.5)`;
      ctx.beginPath();
      const skirtTopY = anchors.leftHip[1] - dancerScale * 0.004;
      const skirtBottomY = anchors.leftHip[1] + dancerScale * 0.095;
      ctx.moveTo(anchors.leftHip[0] + dancerScale * 0.01, skirtTopY);
      ctx.lineTo(anchors.rightHip[0] - dancerScale * 0.01, skirtTopY);
      ctx.lineTo(anchors.rightHip[0] - dancerScale * 0.028, skirtBottomY);
      ctx.lineTo(anchors.leftHip[0] + dancerScale * 0.028, skirtBottomY + dancerScale * 0.006);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = `hsla(${cfg.outfitHue.toFixed(1)} 85% 44% / 0.26)`;
      ctx.beginPath();
      ctx.moveTo(anchors.leftHip[0] + dancerScale * 0.014, skirtTopY + dancerScale * 0.01);
      ctx.lineTo(anchors.leftHip[0] + dancerScale * 0.06, skirtTopY + dancerScale * 0.006);
      ctx.lineTo(anchors.leftHip[0] + dancerScale * 0.052, skirtBottomY - dancerScale * 0.008);
      ctx.lineTo(anchors.leftHip[0] + dancerScale * 0.02, skirtBottomY + dancerScale * 0.001);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawBelt = (): void => {
      const y = lerp(anchors.leftWaist[1], anchors.leftHip[1], 0.5);
      ctx.save();
      ctx.fillStyle = `hsla(${cfg.metalHue.toFixed(1)} 88% 72% / ${(0.42 + cfg.fashionDetail * 0.22).toFixed(3)})`;
      ctx.fillRect(anchors.leftHip[0] + dancerScale * 0.018, y - dancerScale * 0.01, anchors.rightHip[0] - anchors.leftHip[0] - dancerScale * 0.036, dancerScale * 0.02);
      ctx.restore();
    };

    const drawBoot = (knee: Point2D, foot: Point2D): void => {
      const dx = foot[0] - knee[0];
      const dy = foot[1] - knee[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowBlur = 8;
      ctx.shadowColor = `hsla(${cfg.metalHue.toFixed(1)} 90% 70% / 0.5)`;
      ctx.strokeStyle = `hsl(${cfg.metalHue.toFixed(1)} 70% 74%)`;
      ctx.lineWidth = Math.max(5, dancerScale * 0.036);
      ctx.beginPath();
      ctx.moveTo(foot[0] - nx * dancerScale * 0.075 - dx * 0.07, foot[1] - ny * dancerScale * 0.075 - dy * 0.07);
      ctx.lineTo(foot[0] + nx * dancerScale * 0.075, foot[1] + ny * dancerScale * 0.075);
      ctx.stroke();
      ctx.lineWidth = Math.max(6, dancerScale * 0.04);
      ctx.beginPath();
      ctx.moveTo(foot[0] - nx * dancerScale * 0.09 + ny * dancerScale * 0.02, foot[1] - ny * dancerScale * 0.09 - nx * dancerScale * 0.02);
      ctx.lineTo(foot[0] + nx * dancerScale * 0.1 + ny * dancerScale * 0.02, foot[1] + ny * dancerScale * 0.1 - nx * dancerScale * 0.02);
      ctx.stroke();
      ctx.strokeStyle = `hsl(${cfg.outfitHue.toFixed(1)} 95% 62%)`;
      ctx.lineWidth = Math.max(3, dancerScale * 0.022);
      ctx.beginPath();
      ctx.moveTo(foot[0] - nx * dancerScale * 0.06 + ny * dancerScale * 0.004, foot[1] - ny * dancerScale * 0.06 - nx * dancerScale * 0.004);
      ctx.lineTo(foot[0] + nx * dancerScale * 0.07 + ny * dancerScale * 0.004, foot[1] + ny * dancerScale * 0.07 - nx * dancerScale * 0.004);
      ctx.stroke();
      ctx.restore();
    };

    const drawSparkles = (): void => {
      ctx.save();
      ctx.lineCap = "round";
      const sparkleCount = 30;
      for (let i = 0; i < sparkleCount; i += 1) {
        const px = centerX + Math.sin(i * 3.17 + beats * 0.8) * dancerScale * (0.35 + ((i % 5) / 10));
        const py = centerY - dancerScale * 0.3 + Math.cos(i * 2.41 + beats * 1.3) * dancerScale * 0.55;
        const twinkle = 0.5 + 0.5 * Math.sin(beats * 4 + i * 1.7);
        const alpha = cfg.sparkle * (0.06 + twinkle * 0.2) * (0.6 + drive * 0.7);
        const size = dancerScale * (0.008 + twinkle * 0.006);
        ctx.strokeStyle = `hsla(${(cfg.metalHue + i * 5).toFixed(1)} 100% 78% / ${alpha.toFixed(3)})`;
        ctx.lineWidth = Math.max(1, dancerScale * 0.004);
        ctx.beginPath();
        ctx.moveTo(px - size, py);
        ctx.lineTo(px + size, py);
        ctx.moveTo(px, py - size);
        ctx.lineTo(px, py + size);
        ctx.stroke();
      }
      ctx.restore();
    };

    drawStageLights();
    drawGhostTrail();
    drawHair();

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = `hsl(${cfg.accentHue.toFixed(1)} 95% ${(60 + drive * 18).toFixed(1)}%)`;
    ctx.shadowColor = `hsla(${cfg.accentHue.toFixed(1)} 100% 65% / ${clamp(cfg.glow * (0.5 + drive), 0, 1).toFixed(3)})`;
    ctx.shadowBlur = 28 * cfg.glow * (1 + drive);
    ctx.lineWidth = Math.max(3, dancerScale * 0.028);

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
    ctx.restore();

    drawOutfit();
    drawBoot(joints.lk, joints.lf);
    drawBoot(joints.rk, joints.rf);

    ctx.fillStyle = `hsl(${(cfg.stageHue + 28).toFixed(1)} 82% ${(54 + drive * 20).toFixed(1)}%)`;
    ctx.beginPath();
    ctx.arc(joints.head[0], joints.head[1], headRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "hsla(0 0% 100% / 0.35)";
    ctx.beginPath();
    ctx.arc(joints.head[0] + headRadius * 0.3, joints.head[1] - headRadius * 0.28, headRadius * 0.18, 0, Math.PI * 2);
    ctx.fill();
    drawSparkles();
  }
}
