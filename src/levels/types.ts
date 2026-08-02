import type { PowerUpKind } from '../entities/PowerUp';
import type { EnemySpawn } from '../systems/EnemySystem';

/** 0 empty · 1 hard solid · 2 one-way */
export type TileCell = 0 | 1 | 2;

export interface LevelDef {
  id: string;
  name: string;
  subtitle: string;
  /** Next level id, or null if world clear. */
  nextLevelId: string | null;
  width: number;
  height: number;
  skyTop: number;
  skyBottom: number;
  /** Row-major grid [ty][tx] */
  grid: TileCell[][];
  spawn: { tx: number; ty: number };
  exit: { tx: number; ty: number };
  checkpoints: { tx: number; ty: number }[];
  softs: { tx: number; ty: number }[];
  enemies: EnemySpawn[];
  powerups?: { tx: number; ty: number; kind: PowerUpKind }[];
  /** Applied only when starting a fresh run on this level. */
  startMaxBombs?: number;
  startFireRange?: number;
  /** Boss arena — no exit until boss dies (or exit hidden). */
  isBoss?: boolean;
  bossSpawn?: { tx: number; ty: number };
}

export interface LevelCatalog {
  order: string[];
  byId: Record<string, LevelDef>;
}
