import {
  addSoftCluster,
  digPit,
  emptyGrid,
  fillFloor,
  fillWalls,
  placeRect,
  walkFloorTy,
} from './buildUtils';
import type { LevelDef } from './types';

const H = 22;

/**
 * World 1-1 — Green Garden
 * Teaches: run/jump, plant bomb, soft blocks, Ballom, exit door.
 */
function buildW1_1(): LevelDef {
  const W = 56;
  const grid = emptyGrid(W, H);
  fillFloor(grid);
  fillWalls(grid, 7);

  // Gentle steps
  placeRect(grid, 8, H - 5, 4, 1, 1);
  placeRect(grid, 14, H - 7, 4, 1, 1);
  placeRect(grid, 20, H - 5, 3, 1, 1);

  // One-ways intro
  placeRect(grid, 26, H - 8, 5, 1, 2);
  placeRect(grid, 32, H - 6, 4, 1, 1);

  // Landing before exit
  placeRect(grid, 40, H - 5, 6, 1, 1);
  placeRect(grid, 48, H - 5, 4, 1, 1);

  const floor = walkFloorTy(H);
  const softs: { tx: number; ty: number }[] = [];
  addSoftCluster(softs, 9, floor, [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, -1],
  ]);
  addSoftCluster(softs, 15, H - 8, [
    [0, 0],
    [1, 0],
    [2, 0],
  ]);
  addSoftCluster(softs, 27, H - 9, [
    [0, 0],
    [1, 0],
    [3, 0],
  ]);
  addSoftCluster(softs, 41, H - 6, [
    [0, 0],
    [1, 0],
    [2, 0],
  ]);

  return {
    id: 'w1-1',
    name: '1-1 Green Garden',
    subtitle: 'Aprenda a plantar bombas',
    nextLevelId: 'w1-2',
    width: W,
    height: H,
    skyTop: 0x3d6b4f,
    skyBottom: 0x1a2e24,
    grid,
    spawn: { tx: 3, ty: floor },
    exit: { tx: 52, ty: floor },
    checkpoints: [
      { tx: 18, ty: floor },
      { tx: 36, ty: floor },
    ],
    softs,
    enemies: [
      { kind: 'ballom', tx: 12, ty: floor },
      { kind: 'ballom', tx: 22, ty: floor },
      { kind: 'ballom', tx: 33, ty: H - 7 },
    ],
    powerups: [
      { tx: 5, ty: floor, kind: 'bomb' },
      { tx: 6, ty: floor, kind: 'fire' },
    ],
    startMaxBombs: 1,
    startFireRange: 1,
  };
}

/**
 * World 1-2 — Brick Town
 * Teaches: throw bombs to high softs, Onil chase, one-ways.
 */
function buildW1_2(): LevelDef {
  const W = 64;
  const grid = emptyGrid(W, H);
  fillFloor(grid);
  fillWalls(grid, 8);

  // Multi-height city blocks
  placeRect(grid, 6, H - 5, 3, 1, 1);
  placeRect(grid, 11, H - 8, 4, 1, 1);
  placeRect(grid, 17, H - 5, 3, 1, 1);
  placeRect(grid, 22, H - 10, 5, 1, 2); // high one-way (throw targets)
  placeRect(grid, 28, H - 7, 4, 1, 1);
  placeRect(grid, 34, H - 11, 4, 1, 2);
  placeRect(grid, 40, H - 6, 5, 1, 1);
  placeRect(grid, 48, H - 9, 4, 1, 1);
  placeRect(grid, 54, H - 5, 6, 1, 1);

  // Small pit mid
  digPit(grid, 44, 47);
  placeRect(grid, 43, H - 6, 1, 1, 1);
  placeRect(grid, 47, H - 6, 1, 1, 1);
  placeRect(grid, 45, H - 9, 2, 1, 2);

  const floor = walkFloorTy(H);
  const softs: { tx: number; ty: number }[] = [];
  addSoftCluster(softs, 7, H - 6, [
    [0, 0],
    [1, 0],
  ]);
  // High throw targets on one-ways
  addSoftCluster(softs, 22, H - 11, [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ]);
  addSoftCluster(softs, 34, H - 12, [
    [0, 0],
    [1, 0],
    [2, 0],
  ]);
  addSoftCluster(softs, 40, H - 7, [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ]);
  addSoftCluster(softs, 49, H - 10, [
    [0, 0],
    [1, 0],
  ]);

  return {
    id: 'w1-2',
    name: '1-2 Brick Town',
    subtitle: 'Arremesse bombas nas alturas',
    nextLevelId: 'w1-3',
    width: W,
    height: H,
    skyTop: 0x5b4a3f,
    skyBottom: 0x2a211c,
    grid,
    spawn: { tx: 3, ty: floor },
    exit: { tx: 58, ty: floor },
    checkpoints: [
      { tx: 16, ty: floor },
      { tx: 30, ty: H - 8 },
      { tx: 50, ty: floor },
    ],
    softs,
    enemies: [
      { kind: 'ballom', tx: 9, ty: floor },
      { kind: 'onil', tx: 18, ty: floor },
      { kind: 'onil', tx: 29, ty: H - 8 },
      { kind: 'ballom', tx: 41, ty: H - 7 },
      { kind: 'onil', tx: 55, ty: floor },
    ],
    powerups: [{ tx: 5, ty: floor, kind: 'speed' }],
  };
}

/**
 * World 1-3 — Cave Fuse
 * Teaches: combine jump + throw + multi-bomb, Dahl, lethal pits.
 */
function buildW1_3(): LevelDef {
  const W = 72;
  const grid = emptyGrid(W, H);
  fillFloor(grid);
  fillWalls(grid, 10);

  // Cave ledges
  placeRect(grid, 7, H - 6, 3, 1, 1);
  placeRect(grid, 12, H - 9, 4, 1, 1);
  placeRect(grid, 18, H - 6, 3, 1, 1);

  // Pit 1
  digPit(grid, 22, 28);
  placeRect(grid, 21, H - 7, 1, 1, 1);
  placeRect(grid, 28, H - 7, 2, 1, 1);
  placeRect(grid, 24, H - 10, 3, 1, 2);

  // Mid climb
  placeRect(grid, 32, H - 5, 3, 1, 1);
  placeRect(grid, 36, H - 8, 3, 1, 1);
  placeRect(grid, 40, H - 11, 4, 1, 1);
  placeRect(grid, 45, H - 8, 3, 1, 2);
  placeRect(grid, 50, H - 5, 4, 1, 1);

  // Pit 2 larger
  digPit(grid, 55, 62);
  placeRect(grid, 54, H - 6, 1, 1, 1);
  placeRect(grid, 62, H - 6, 2, 1, 1);
  placeRect(grid, 57, H - 10, 4, 1, 2);
  placeRect(grid, 58, H - 13, 2, 1, 1);

  // Exit platform
  placeRect(grid, 65, H - 5, 5, 1, 1);

  const floor = walkFloorTy(H);
  const softs: { tx: number; ty: number }[] = [];
  addSoftCluster(softs, 8, H - 7, [
    [0, 0],
    [1, 0],
    [0, -1],
  ]);
  addSoftCluster(softs, 13, H - 10, [
    [0, 0],
    [1, 0],
    [2, 0],
  ]);
  addSoftCluster(softs, 24, H - 11, [
    [0, 0],
    [1, 0],
    [2, 0],
  ]);
  addSoftCluster(softs, 37, H - 9, [
    [0, 0],
    [1, 0],
  ]);
  addSoftCluster(softs, 40, H - 12, [
    [0, 0],
    [1, 0],
    [2, 0],
  ]);
  addSoftCluster(softs, 57, H - 11, [
    [0, 0],
    [1, 0],
    [2, 0],
  ]);
  addSoftCluster(softs, 58, H - 14, [
    [0, 0],
    [1, 0],
  ]);
  addSoftCluster(softs, 66, H - 6, [
    [0, 0],
    [1, 0],
    [2, 0],
  ]);

  return {
    id: 'w1-3',
    name: '1-3 Cave Fuse',
    subtitle: 'Combine pulo, arremesso e bombas',
    nextLevelId: 'w1-boss',
    width: W,
    height: H,
    skyTop: 0x2d2640,
    skyBottom: 0x12101a,
    grid,
    spawn: { tx: 3, ty: floor },
    exit: { tx: 68, ty: floor },
    checkpoints: [
      { tx: 16, ty: floor },
      { tx: 33, ty: floor },
      { tx: 51, ty: floor },
    ],
    softs,
    enemies: [
      { kind: 'ballom', tx: 10, ty: floor },
      { kind: 'onil', tx: 14, ty: H - 10 },
      { kind: 'dahl', tx: 30, ty: floor },
      { kind: 'onil', tx: 38, ty: H - 9 },
      { kind: 'dahl', tx: 42, ty: H - 12 },
      { kind: 'ballom', tx: 52, ty: floor },
      { kind: 'dahl', tx: 60, ty: H - 11 },
      { kind: 'onil', tx: 66, ty: floor },
    ],
    powerups: [
      { tx: 5, ty: floor, kind: 'bomb' },
      { tx: 6, ty: floor, kind: 'fire' },
    ],
  };
}

/**
 * World 1 Boss — King Bomb arena
 * Multi-height arena, soft cover, 3-phase boss fight.
 */
function buildW1_Boss(): LevelDef {
  const W = 42;
  const grid = emptyGrid(W, H);
  fillFloor(grid);
  fillWalls(grid, 12);

  // Side platforms
  placeRect(grid, 4, H - 8, 5, 1, 1);
  placeRect(grid, 12, H - 11, 4, 1, 2);
  placeRect(grid, 26, H - 11, 4, 1, 2);
  placeRect(grid, 33, H - 8, 5, 1, 1);
  // Mid ledges
  placeRect(grid, 18, H - 6, 6, 1, 1);
  placeRect(grid, 10, H - 5, 3, 1, 1);
  placeRect(grid, 29, H - 5, 3, 1, 1);

  const floor = walkFloorTy(H);
  const softs: { tx: number; ty: number }[] = [];
  addSoftCluster(softs, 8, floor, [
    [0, 0],
    [1, 0],
  ]);
  addSoftCluster(softs, 19, H - 7, [
    [0, 0],
    [1, 0],
    [2, 0],
  ]);
  addSoftCluster(softs, 30, floor, [
    [0, 0],
    [1, 0],
  ]);
  addSoftCluster(softs, 13, H - 12, [
    [0, 0],
    [1, 0],
  ]);
  addSoftCluster(softs, 27, H - 12, [
    [0, 0],
    [1, 0],
  ]);

  return {
    id: 'w1-boss',
    name: '1-Boss King Bomb',
    subtitle: 'Derrote o rei das bombas!',
    nextLevelId: null,
    width: W,
    height: H,
    skyTop: 0x4a1c2f,
    skyBottom: 0x1a0a12,
    grid,
    spawn: { tx: 4, ty: floor },
    exit: { tx: 38, ty: floor }, // unlocked after boss
    checkpoints: [{ tx: 5, ty: floor }],
    softs,
    enemies: [],
    powerups: [
      { tx: 6, ty: floor, kind: 'bomb' },
      { tx: 7, ty: floor, kind: 'fire' },
    ],
    isBoss: true,
    bossSpawn: { tx: 28, ty: floor },
  };
}

export const WORLD1_LEVELS: LevelDef[] = [
  buildW1_1(),
  buildW1_2(),
  buildW1_3(),
  buildW1_Boss(),
];

export const LEVEL_ORDER = WORLD1_LEVELS.map((l) => l.id);

export function getLevel(id: string): LevelDef {
  const level = WORLD1_LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`Unknown level: ${id}`);
  return level;
}

export function firstLevelId(): string {
  return WORLD1_LEVELS[0].id;
}
