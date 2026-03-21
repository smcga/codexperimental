// Demoscene-flavoured lemmings-like colony where tiny walkers spill from the sky,
// traverse a deformable landscape, use contextual abilities, and score by reaching a portal.
import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const LEMMINGS_MARCH_DEFAULTS = {
  spawnInterval: 0.9,
  colonySize: 18,
  worldLength: 320,
  hilliness: 0.65,
  wallRate: 0.22,
  digRate: 18,
  bashRate: 28,
  bridgeRate: 6,
  floatiness: 0.45,
  scrollFollow: 0.22,
  seed: 73
};

export type LemmingAbility = "walker" | "climber" | "digger" | "basher" | "builder" | "floater";

type TerrainData = {
  surfaceY: number[];
  wallHeight: number[];
  bridgeY: number[];
  goalCol: number;
};

type LemmingAgent = {
  id: number;
  x: number;
  y: number;
  vy: number;
  dir: -1 | 1;
  ability: LemmingAbility;
  umbrella: boolean;
  action: "walk" | "climb" | "dig" | "bash" | "build";
  actionTimer: number;
  buildSegments: number;
  bashCol: number;
  digCol: number;
};

type EffectState = {
  seed: number;
  width: number;
  height: number;
  tileSize: number;
  worldCols: number;
  terrain: TerrainData;
  agents: LemmingAgent[];
  nextId: number;
  spawnCooldown: number;
  rescued: number;
  cameraX: number;
  simAccumulator: number;
};

const FIXED_STEP = 1 / 30;

const asFinite = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const lemmingsHash01 = (index: number, seed: number): number => {
  const x = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453123;
  return x - Math.floor(x);
};

export const pickLemmingAbility = (id: number, seed: number): LemmingAbility => {
  const roll = lemmingsHash01(id * 1.37 + 5.1, seed);
  if (roll < 0.18) {
    return "climber";
  }
  if (roll < 0.36) {
    return "digger";
  }
  if (roll < 0.54) {
    return "basher";
  }
  if (roll < 0.72) {
    return "builder";
  }
  if (roll < 0.9) {
    return "floater";
  }
  return "walker";
};

export const applyUmbrellaFallSpeed = (vy: number, ability: LemmingAbility, floatiness: number): number => {
  if (ability !== "floater" || vy <= 90) {
    return vy;
  }
  return lerp(vy, 72, clamp(floatiness, 0, 1));
};

export function buildLemmingsTerrain(
  worldCols: number,
  baseY: number,
  tileSize: number,
  seed: number,
  hilliness: number,
  wallRate: number
): TerrainData {
  const safeCols = Math.max(96, Math.floor(worldCols));
  const surfaceY: number[] = [];
  const wallHeight: number[] = [];
  const bridgeY = Array.from({ length: safeCols }, () => Number.POSITIVE_INFINITY);
  const heightRange = tileSize * (3 + hilliness * 4);
  let current = baseY;

  for (let col = 0; col < safeCols; col += 1) {
    const noiseA = lemmingsHash01(col * 0.29 + 9, seed);
    const noiseB = lemmingsHash01(col * 0.073 + 21, seed + 17);
    const slope = (noiseA - 0.5) * tileSize * 0.55 + Math.sin(col * 0.11 + seed * 0.03) * hilliness * 1.4;
    current += slope;
    current = clamp(current, baseY - heightRange, baseY + tileSize * 1.5);
    const terraced = Math.round(current / 2) * 2;
    surfaceY.push(terraced);

    let wall = 0;
    const wallCluster = lemmingsHash01(col * 0.41 + 3, seed);
    if (col > 12 && col < safeCols - 18 && wallCluster < wallRate) {
      wall = tileSize * (1.4 + noiseB * 2.8);
    }
    if (col % 47 >= 3 && col % 47 <= 6) {
      wall = 0;
    }
    wallHeight.push(wall);
  }

  const goalCol = safeCols - 10;
  wallHeight[goalCol] = 0;
  wallHeight[goalCol - 1] = 0;
  bridgeY[goalCol] = surfaceY[goalCol] - tileSize * 0.4;
  bridgeY[goalCol - 1] = surfaceY[goalCol] - tileSize * 0.4;

  return { surfaceY, wallHeight, bridgeY, goalCol };
}

const terrainIndexAt = (state: EffectState, worldX: number): number =>
  clamp(Math.floor(worldX / state.tileSize), 0, state.worldCols - 1);

const supportYAt = (state: EffectState, worldX: number): number => {
  const col = terrainIndexAt(state, worldX);
  return Math.min(state.terrain.surfaceY[col], state.terrain.bridgeY[col]);
};

const wallTopAt = (state: EffectState, worldX: number): number => {
  const col = terrainIndexAt(state, worldX);
  return state.terrain.surfaceY[col] - state.terrain.wallHeight[col];
};

const shouldTriggerAbility = (agentId: number, seed: number, time: number, bias: number): boolean => {
  const bucket = Math.floor(time * 1.75);
  return lemmingsHash01(agentId * 13.7 + bucket * 5.3, seed + bucket) < bias;
};

const createAgent = (state: EffectState): LemmingAgent => {
  const id = state.nextId;
  state.nextId += 1;
  return {
    id,
    x: state.tileSize * 3,
    y: -state.tileSize * (2 + lemmingsHash01(id, state.seed) * 3),
    vy: 0,
    dir: 1,
    ability: pickLemmingAbility(id, state.seed),
    umbrella: false,
    action: "walk",
    actionTimer: 0,
    buildSegments: 0,
    bashCol: -1,
    digCol: -1
  };
};

const ensureState = (
  current: EffectState | null,
  width: number,
  height: number,
  seed: number,
  worldLength: number,
  hilliness: number,
  wallRate: number
): EffectState => {
  const tileSize = clamp(Math.round(height / 24), 10, 20);
  const worldCols = Math.max(96, Math.floor(worldLength));
  if (
    current &&
    current.width === width &&
    current.height === height &&
    current.seed === seed &&
    current.worldCols === worldCols &&
    current.tileSize === tileSize
  ) {
    return current;
  }

  const baseY = Math.floor(height * 0.8);
  return {
    seed,
    width,
    height,
    tileSize,
    worldCols,
    terrain: buildLemmingsTerrain(worldCols, baseY, tileSize, seed, hilliness, wallRate),
    agents: [],
    nextId: 0,
    spawnCooldown: 0,
    rescued: 0,
    cameraX: 0,
    simAccumulator: 0
  };
};

const stepAgent = (
  state: EffectState,
  agent: LemmingAgent,
  dt: number,
  time: number,
  floatiness: number,
  digRate: number,
  bashRate: number,
  bridgeRate: number
): boolean => {
  const gravity = state.tileSize * 22;
  const walkSpeed = state.tileSize * 2.2;
  const climbSpeed = state.tileSize * 2.4;
  const supportY = supportYAt(state, agent.x);
  const onGround = agent.y >= supportY - 0.5 && agent.vy >= 0;
  const goalX = state.terrain.goalCol * state.tileSize;
  const goalY = supportYAt(state, goalX);

  if (Math.abs(agent.x - goalX) < state.tileSize * 0.8 && Math.abs(agent.y - goalY) < state.tileSize * 1.2) {
    state.rescued += 1;
    return false;
  }

  if (onGround) {
    agent.y = supportY;
    agent.vy = 0;
    agent.umbrella = false;
  } else {
    agent.vy += gravity * dt;
    agent.vy = applyUmbrellaFallSpeed(agent.vy, agent.ability, floatiness);
    agent.umbrella = agent.ability === "floater" && agent.vy < gravity * dt * 1.5;
    agent.y += agent.vy * dt;
  }

  const aheadX = agent.x + agent.dir * state.tileSize * 0.7;
  const aheadSupportY = supportYAt(state, aheadX);
  const slopeDelta = supportY - aheadSupportY;
  const dropAhead = aheadSupportY - supportY;
  const aheadCol = terrainIndexAt(state, aheadX);
  const wallHeight = state.terrain.wallHeight[aheadCol];

  if (agent.action === "climb") {
    agent.actionTimer -= dt;
    agent.y -= climbSpeed * dt;
    if (agent.y <= wallTopAt(state, aheadX) + state.tileSize * 0.25 || agent.actionTimer <= 0) {
      agent.action = "walk";
      agent.x += agent.dir * state.tileSize * 0.45;
      agent.y = Math.min(agent.y, supportYAt(state, agent.x));
    }
    return true;
  }

  if (agent.action === "dig") {
    agent.actionTimer -= dt;
    const digCol = terrainIndexAt(state, agent.x);
    state.terrain.surfaceY[digCol] = Math.min(
      state.height - state.tileSize * 0.5,
      state.terrain.surfaceY[digCol] + digRate * dt
    );
    agent.y = supportYAt(state, agent.x);
    if (agent.actionTimer <= 0) {
      agent.action = "walk";
    }
    return true;
  }

  if (agent.action === "bash") {
    agent.actionTimer -= dt;
    const bashCol = clamp(agent.bashCol, 0, state.worldCols - 1);
    state.terrain.wallHeight[bashCol] = Math.max(0, state.terrain.wallHeight[bashCol] - bashRate * dt);
    agent.x += agent.dir * walkSpeed * dt * 0.65;
    if (agent.actionTimer <= 0 || state.terrain.wallHeight[bashCol] <= state.tileSize * 0.35) {
      agent.action = "walk";
    }
    return true;
  }

  if (agent.action === "build") {
    agent.actionTimer -= dt;
    if (agent.buildSegments > 0) {
      const segmentCol = terrainIndexAt(state, agent.x + agent.dir * state.tileSize * 0.9);
      const rise = Math.max(state.tileSize * 0.3, bridgeRate * state.tileSize * 0.05 + agent.buildSegments * state.tileSize * 0.12);
      state.terrain.bridgeY[segmentCol] = Math.min(state.terrain.bridgeY[segmentCol], supportY - rise);
      agent.buildSegments -= 1;
    }
    agent.x += agent.dir * walkSpeed * dt * 0.8;
    agent.y = supportYAt(state, agent.x);
    if (agent.actionTimer <= 0 || agent.buildSegments <= 0) {
      agent.action = "walk";
    }
    return true;
  }

  if (onGround && wallHeight > state.tileSize * 1.15) {
    if (agent.ability === "basher" && shouldTriggerAbility(agent.id, state.seed, time, 0.55)) {
      agent.action = "bash";
      agent.actionTimer = 0.55;
      agent.bashCol = aheadCol;
      return true;
    }
    if (agent.ability === "climber") {
      agent.action = "climb";
      agent.actionTimer = 0.7;
      return true;
    }
    agent.dir *= -1;
    return true;
  }

  if (onGround && dropAhead > state.tileSize * 1.1 && agent.ability === "builder" && shouldTriggerAbility(agent.id, state.seed, time, 0.48)) {
    agent.action = "build";
    agent.actionTimer = 0.9;
    agent.buildSegments = 4;
    return true;
  }

  if (onGround && lemmingsHash01(agent.id * 7.1 + aheadCol * 0.41, state.seed) < 0.04) {
    agent.dir *= -1;
  }

  if (onGround && agent.ability === "digger" && shouldTriggerAbility(agent.id, state.seed, time, 0.18)) {
    agent.action = "dig";
    agent.actionTimer = 0.65;
    agent.digCol = terrainIndexAt(state, agent.x);
    return true;
  }

  agent.x += agent.dir * walkSpeed * dt;

  if (onGround) {
    if (slopeDelta > state.tileSize * 1.15) {
      agent.dir *= -1;
      agent.x += agent.dir * walkSpeed * dt;
    } else {
      agent.y = supportYAt(state, agent.x);
    }
  }

  if (agent.x < state.tileSize) {
    agent.dir = 1;
    agent.x = state.tileSize;
  }

  return agent.x < state.worldCols * state.tileSize + state.tileSize * 3 && agent.y < state.height + state.tileSize * 6;
};

const drawBackdrop = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, beat: number): void => {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, `hsl(${212 + Math.sin(time * 0.08) * 10} 65% 18%)`);
  sky.addColorStop(0.48, `hsl(${228 + beat * 18} 54% 12%)`);
  sky.addColorStop(1, "hsl(242 38% 7%)");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
};

const drawTerrain = (ctx: CanvasRenderingContext2D, state: EffectState, cameraX: number): void => {
  const { width, height, tileSize } = state;
  const startCol = Math.max(0, Math.floor(cameraX / tileSize) - 2);
  const endCol = Math.min(state.worldCols - 1, startCol + Math.ceil(width / tileSize) + 4);

  ctx.fillStyle = "rgba(180, 210, 255, 0.08)";
  for (let i = 0; i < 5; i += 1) {
    const x = ((i * 131 + state.seed * 17) % (width + 120)) - 60 + Math.sin(i + cameraX * 0.002) * 24;
    const y = height * (0.18 + i * 0.09);
    ctx.beginPath();
    ctx.arc(x, y, 26 + i * 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#223149";
  ctx.beginPath();
  ctx.moveTo(-4, height);
  for (let col = startCol; col <= endCol; col += 1) {
    const x = col * tileSize - cameraX;
    ctx.lineTo(x, state.terrain.surfaceY[col] - tileSize * 5);
  }
  ctx.lineTo(width + 4, height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#5a4f3a";
  ctx.beginPath();
  ctx.moveTo(-4, height);
  for (let col = startCol; col <= endCol; col += 1) {
    const x = col * tileSize - cameraX;
    ctx.lineTo(x, state.terrain.surfaceY[col]);
  }
  ctx.lineTo(width + 4, height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#7b6f52";
  for (let col = startCol; col <= endCol; col += 1) {
    const x = col * tileSize - cameraX;
    ctx.fillRect(x, state.terrain.surfaceY[col], tileSize + 1, 3);
    const wallHeight = state.terrain.wallHeight[col];
    if (wallHeight > 0.4) {
      ctx.fillStyle = "#40372c";
      ctx.fillRect(x + tileSize * 0.18, state.terrain.surfaceY[col] - wallHeight, tileSize * 0.64, wallHeight);
      ctx.fillStyle = "#7b6f52";
    }
    if (Number.isFinite(state.terrain.bridgeY[col])) {
      ctx.fillStyle = "#a68557";
      ctx.fillRect(x - 1, state.terrain.bridgeY[col], tileSize + 2, 3);
      ctx.fillStyle = "#7b6f52";
    }
  }
};

const drawPortal = (ctx: CanvasRenderingContext2D, state: EffectState, cameraX: number, time: number): void => {
  const x = state.terrain.goalCol * state.tileSize - cameraX;
  const y = supportYAt(state, state.terrain.goalCol * state.tileSize);
  const pulse = 0.75 + Math.sin(time * 4) * 0.15;

  ctx.save();
  ctx.translate(x, y - state.tileSize * 1.5);
  ctx.fillStyle = `rgba(120, 220, 255, ${0.14 * pulse})`;
  ctx.beginPath();
  ctx.arc(0, 0, state.tileSize * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(120, 240, 255, ${0.85 * pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, state.tileSize * 0.85, state.tileSize * 1.25, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

const drawAgent = (ctx: CanvasRenderingContext2D, state: EffectState, agent: LemmingAgent, cameraX: number, time: number): void => {
  const x = agent.x - cameraX;
  const footY = agent.y;
  const bodyH = state.tileSize * 0.95;
  const bodyW = state.tileSize * 0.5;
  const headR = state.tileSize * 0.22;
  const stride = Math.sin(time * 12 + agent.id * 0.6) * state.tileSize * 0.12;

  ctx.fillStyle = agent.ability === "floater" ? "#9fe6ff" : "#7bf07f";
  ctx.fillRect(x - bodyW * 0.5, footY - bodyH, bodyW, bodyH * 0.72);
  ctx.fillStyle = "#ffe0b8";
  ctx.beginPath();
  ctx.arc(x, footY - bodyH - headR * 0.35, headR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, footY - bodyH * 0.28);
  ctx.lineTo(x + stride * agent.dir, footY);
  ctx.moveTo(x, footY - bodyH * 0.28);
  ctx.lineTo(x - stride * agent.dir, footY);
  ctx.stroke();

  ctx.strokeStyle = "#2a2435";
  ctx.beginPath();
  ctx.moveTo(x - bodyW * 0.1, footY - bodyH * 0.8);
  ctx.lineTo(x + agent.dir * bodyW * 0.45, footY - bodyH * 0.56);
  ctx.stroke();

  if (agent.umbrella) {
    ctx.strokeStyle = "#f8f49a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, footY - bodyH - state.tileSize * 0.5, state.tileSize * 0.55, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, footY - bodyH - state.tileSize * 0.5);
    ctx.lineTo(x, footY - bodyH * 0.55);
    ctx.stroke();
  }

  if (agent.action !== "walk") {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillRect(x - bodyW * 0.7, footY - bodyH - state.tileSize * 0.7, bodyW * 1.4, 2);
  }
};

export class LemmingsMarchEffect implements Effect {
  private state: EffectState | null = null;

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const spawnInterval = clamp(asFinite(params.spawnInterval, LEMMINGS_MARCH_DEFAULTS.spawnInterval), 0.2, 3);
    const colonySize = clamp(Math.round(asFinite(params.colonySize, LEMMINGS_MARCH_DEFAULTS.colonySize)), 4, 48);
    const worldLength = clamp(Math.round(asFinite(params.worldLength, LEMMINGS_MARCH_DEFAULTS.worldLength)), 120, 640);
    const hilliness = clamp(asFinite(params.hilliness, LEMMINGS_MARCH_DEFAULTS.hilliness), 0, 1.4);
    const wallRate = clamp(asFinite(params.wallRate, LEMMINGS_MARCH_DEFAULTS.wallRate), 0, 0.5);
    const digRate = clamp(asFinite(params.digRate, LEMMINGS_MARCH_DEFAULTS.digRate), 2, 40);
    const bashRate = clamp(asFinite(params.bashRate, LEMMINGS_MARCH_DEFAULTS.bashRate), 2, 40);
    const bridgeRate = clamp(asFinite(params.bridgeRate, LEMMINGS_MARCH_DEFAULTS.bridgeRate), 1, 12);
    const floatiness = clamp(asFinite(params.floatiness, LEMMINGS_MARCH_DEFAULTS.floatiness), 0, 1);
    const scrollFollow = clamp(asFinite(params.scrollFollow, LEMMINGS_MARCH_DEFAULTS.scrollFollow), 0, 1);
    const seed = Math.round(asFinite(params.seed, LEMMINGS_MARCH_DEFAULTS.seed));

    this.state = ensureState(this.state, width, height, seed, worldLength, hilliness, wallRate);
    const state = this.state;

    drawBackdrop(ctx, width, height, time, audio.beatStrength ?? 0);

    state.spawnCooldown -= Math.max(0, delta);
    if (state.agents.length < colonySize && state.spawnCooldown <= 0) {
      state.agents.push(createAgent(state));
      state.spawnCooldown = spawnInterval;
    }

    state.simAccumulator += Math.min(0.15, Math.max(0, delta));
    while (state.simAccumulator >= FIXED_STEP) {
      state.simAccumulator -= FIXED_STEP;
      state.agents = state.agents.filter((agent) =>
        stepAgent(state, agent, FIXED_STEP, time, floatiness, digRate, bashRate, bridgeRate)
      );
    }

    const terrainEase = 1 + (audio.bass ?? 0) * 0.08;
    const terrainShift = state.tileSize * 0.004 * terrainEase;
    if (audio.beat) {
      const col = terrainIndexAt(state, state.cameraX + width * 0.6);
      state.terrain.bridgeY[col] = Math.min(state.terrain.bridgeY[col], supportYAt(state, col * state.tileSize) - terrainShift);
    }

    const desiredCameraX = clamp(
      Math.max(0, ...state.agents.map((agent) => agent.x - width * 0.3), state.tileSize * 2),
      0,
      state.worldCols * state.tileSize - width + state.tileSize * 8
    );
    state.cameraX = lerp(state.cameraX, desiredCameraX, 0.08 + scrollFollow * 0.2);


    drawTerrain(ctx, state, state.cameraX);
    drawPortal(ctx, state, state.cameraX, time);
    state.agents.forEach((agent) => drawAgent(ctx, state, agent, state.cameraX, time));

    const hatchX = state.tileSize * 2 - state.cameraX;
    ctx.fillStyle = "#5fe0ff";
    ctx.fillRect(hatchX, 0, state.tileSize * 1.2, state.tileSize * 1.2);
    ctx.fillStyle = "rgba(95,224,255,0.2)";
    ctx.fillRect(hatchX - state.tileSize * 0.4, 0, state.tileSize * 2, state.tileSize * 4);

    ctx.fillStyle = "rgba(8, 11, 20, 0.72)";
    ctx.fillRect(12, 12, 182, 54);
    ctx.fillStyle = "#dff7ff";
    ctx.font = `bold ${Math.max(14, Math.floor(height * 0.045))}px monospace`;
    ctx.fillText(`RESCUED ${state.rescued}`, 22, 34);
    ctx.font = `${Math.max(11, Math.floor(height * 0.032))}px monospace`;
    ctx.fillText(`ACTIVE ${state.agents.length}  GOAL ${state.terrain.goalCol}`, 22, 54);
  }

  reset(): void {
    this.state = null;
  }
}
