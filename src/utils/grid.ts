import { TILE } from '../config';

export function worldToTile(x: number, y: number): { tx: number; ty: number } {
  return {
    tx: Math.floor(x / TILE),
    ty: Math.floor(y / TILE),
  };
}

export function tileCenter(tx: number, ty: number): { x: number; y: number } {
  return {
    x: tx * TILE + TILE / 2,
    y: ty * TILE + TILE / 2,
  };
}

export function tileKey(tx: number, ty: number): string {
  return `${tx},${ty}`;
}

export const DIRS = [
  { dx: 0, dy: -1 }, // N
  { dx: 0, dy: 1 }, // S
  { dx: -1, dy: 0 }, // W
  { dx: 1, dy: 0 }, // E
] as const;
