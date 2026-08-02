import { TILE } from '../config';

/**
 * Procedural greybox level for PR1 feel tuning.
 * 0 = empty, 1 = hard solid, 2 = one-way platform
 */
export const GREYBOX_WIDTH = 80; // tiles
export const GREYBOX_HEIGHT = 22; // tiles

export function buildGreyboxGrid(): number[][] {
  const w = GREYBOX_WIDTH;
  const h = GREYBOX_HEIGHT;
  const grid: number[][] = Array.from({ length: h }, () => Array(w).fill(0));

  // Floor
  for (let x = 0; x < w; x++) {
    grid[h - 1][x] = 1;
    grid[h - 2][x] = 1;
  }

  // Left / right walls (low)
  for (let y = h - 8; y < h; y++) {
    grid[y][0] = 1;
    grid[y][1] = 1;
    grid[y][w - 1] = 1;
    grid[y][w - 2] = 1;
  }

  // Starter platform steps (teach jump heights)
  placeRect(grid, 6, h - 5, 4, 1, 1);
  placeRect(grid, 12, h - 7, 4, 1, 1);
  placeRect(grid, 18, h - 5, 3, 1, 1);

  // One-way platforms (green)
  placeRect(grid, 24, h - 8, 5, 1, 2);
  placeRect(grid, 30, h - 11, 4, 1, 2);
  placeRect(grid, 36, h - 8, 6, 1, 2);

  // Gap with landing
  // floor already solid; dig a pit
  for (let x = 44; x < 50; x++) {
    grid[h - 1][x] = 0;
    grid[h - 2][x] = 0;
  }
  // ledges around pit
  placeRect(grid, 42, h - 6, 2, 1, 1);
  placeRect(grid, 50, h - 6, 2, 1, 1);
  placeRect(grid, 46, h - 9, 3, 1, 2); // one-way over pit

  // High stack for corner-correction / multi-jump practice
  placeRect(grid, 56, h - 5, 3, 1, 1);
  placeRect(grid, 60, h - 8, 3, 1, 1);
  placeRect(grid, 64, h - 11, 3, 1, 1);
  placeRect(grid, 68, h - 8, 4, 1, 2);
  placeRect(grid, 72, h - 5, 5, 1, 1);

  // Floating one-ways for drop-through practice
  placeRect(grid, 8, h - 12, 4, 1, 2);
  placeRect(grid, 14, h - 14, 3, 1, 2);

  // Small floating blocks
  placeRect(grid, 52, h - 12, 2, 1, 1);
  placeRect(grid, 55, h - 14, 2, 1, 1);

  return grid;
}

function placeRect(
  grid: number[][],
  tx: number,
  ty: number,
  tw: number,
  th: number,
  value: number,
): void {
  for (let y = ty; y < ty + th && y < grid.length; y++) {
    for (let x = tx; x < tx + tw && x < grid[0].length; x++) {
      if (y >= 0 && x >= 0) grid[y][x] = value;
    }
  }
}

export function worldWidth(): number {
  return GREYBOX_WIDTH * TILE;
}

export function worldHeight(): number {
  return GREYBOX_HEIGHT * TILE;
}

/** Spawn near left side, on floor. */
export function spawnPosition(): { x: number; y: number } {
  return {
    x: 4 * TILE + TILE / 2,
    y: (GREYBOX_HEIGHT - 3) * TILE,
  };
}
