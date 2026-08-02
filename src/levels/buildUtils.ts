import type { TileCell } from './types';

export function emptyGrid(w: number, h: number): TileCell[][] {
  return Array.from({ length: h }, () => Array(w).fill(0) as TileCell[]);
}

export function fillFloor(grid: TileCell[][], thickness = 2): void {
  const h = grid.length;
  const w = grid[0].length;
  for (let t = 0; t < thickness; t++) {
    for (let x = 0; x < w; x++) {
      grid[h - 1 - t][x] = 1;
    }
  }
}

export function fillWalls(grid: TileCell[][], heightTiles = 8): void {
  const h = grid.length;
  const w = grid[0].length;
  for (let y = h - heightTiles; y < h; y++) {
    if (y < 0) continue;
    grid[y][0] = 1;
    grid[y][1] = 1;
    grid[y][w - 1] = 1;
    grid[y][w - 2] = 1;
  }
}

export function placeRect(
  grid: TileCell[][],
  tx: number,
  ty: number,
  tw: number,
  th: number,
  value: TileCell,
): void {
  for (let y = ty; y < ty + th && y < grid.length; y++) {
    for (let x = tx; x < tx + tw && x < grid[0].length; x++) {
      if (y >= 0 && x >= 0) grid[y][x] = value;
    }
  }
}

/** Dig a pit through floor thickness. */
export function digPit(grid: TileCell[][], x0: number, x1: number): void {
  const h = grid.length;
  for (let x = x0; x < x1; x++) {
    grid[h - 1][x] = 0;
    grid[h - 2][x] = 0;
  }
}

export function walkFloorTy(h: number): number {
  // Floor solid at h-1 and h-2 → walkable empty row is h-3
  return h - 3;
}

export function addSoftCluster(
  out: { tx: number; ty: number }[],
  ox: number,
  oy: number,
  offsets: [number, number][],
): void {
  for (const [dx, dy] of offsets) {
    out.push({ tx: ox + dx, ty: oy + dy });
  }
}
