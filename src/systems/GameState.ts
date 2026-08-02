import { LIVES, PLAYER } from '../config';
import { firstLevelId, getLevel } from '../levels/world1';
import { TILE } from '../config';
import { tileCenter } from '../utils/grid';

/** Persistent run state across levels of a single play session. */
export interface RunState {
  lives: number;
  score: number;
  maxBombs: number;
  fireRange: number;
  speedStacks: number;
  checkpointX: number;
  checkpointY: number;
  hasCheckpoint: boolean;
  levelId: string;
}

function spawnWorld(levelId: string): { x: number; y: number } {
  const level = getLevel(levelId);
  const { x, y } = tileCenter(level.spawn.tx, level.spawn.ty);
  return { x, y: y + TILE / 2 - 4 };
}

export function createInitialRunState(levelId = firstLevelId()): RunState {
  const level = getLevel(levelId);
  const spawn = spawnWorld(levelId);
  return {
    lives: LIVES.start,
    score: 0,
    maxBombs: level.startMaxBombs ?? PLAYER.startMaxBombs,
    fireRange: level.startFireRange ?? PLAYER.startFireRange,
    speedStacks: 0,
    checkpointX: spawn.x,
    checkpointY: spawn.y,
    hasCheckpoint: false,
    levelId,
  };
}

export function resetRunState(state: RunState, levelId = firstLevelId()): void {
  const level = getLevel(levelId);
  const spawn = spawnWorld(levelId);
  state.lives = LIVES.start;
  state.score = 0;
  state.maxBombs = level.startMaxBombs ?? PLAYER.startMaxBombs;
  state.fireRange = level.startFireRange ?? PLAYER.startFireRange;
  state.speedStacks = 0;
  state.checkpointX = spawn.x;
  state.checkpointY = spawn.y;
  state.hasCheckpoint = false;
  state.levelId = levelId;
}

/** Advance to next level, keeping lives/score/powers; reset checkpoint to spawn. */
export function advanceToLevel(state: RunState, nextLevelId: string): void {
  const spawn = spawnWorld(nextLevelId);
  state.levelId = nextLevelId;
  state.checkpointX = spawn.x;
  state.checkpointY = spawn.y;
  state.hasCheckpoint = false;
}

export function spawnForLevel(levelId: string): { x: number; y: number } {
  return spawnWorld(levelId);
}
