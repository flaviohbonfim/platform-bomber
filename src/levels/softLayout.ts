import { GREYBOX_HEIGHT } from './greyboxLevel';

/** Soft block positions for PR2 bomb practice. */
export function buildSoftBlockCells(): { tx: number; ty: number }[] {
  const h = GREYBOX_HEIGHT;
  const floorTy = h - 3; // one tile above solid floor top (floor is h-1 and h-2)
  // Soft blocks sit on the walkable row above floor tiles at y = h-3
  const cells: { tx: number; ty: number }[] = [];

  // Tutorial cluster near start (right of spawn)
  addCluster(cells, 8, floorTy, [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, -1],
    [2, -1],
    [1, -2],
  ]);

  // On mid platform steps
  addCluster(cells, 13, h - 8, [
    [0, 0],
    [1, 0],
    [2, 0],
  ]);

  // Near one-ways
  addCluster(cells, 25, h - 9, [
    [0, 0],
    [1, 0],
    [3, 0],
    [4, 0],
  ]);

  // After pit
  addCluster(cells, 52, floorTy, [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, -1],
    [3, 0],
    [4, -1],
    [5, 0],
  ]);

  // High platform softs (encourage placement after jump)
  addCluster(cells, 61, h - 9, [
    [0, 0],
    [1, 0],
  ]);

  addCluster(cells, 65, h - 12, [
    [0, 0],
    [1, 0],
    [2, 0],
  ]);

  // Throw range targets: elevated softs hard to reach by walking plant
  // (platforms around x=30 one-way and floating blocks)
  addCluster(cells, 30, h - 12, [
    [0, 0],
    [1, 0],
    [2, 0],
  ]);
  addCluster(cells, 52, h - 13, [
    [0, 0],
    [1, 0],
  ]);
  addCluster(cells, 55, h - 15, [
    [0, 0],
    [1, 0],
  ]);

  return cells;
}

function addCluster(
  out: { tx: number; ty: number }[],
  ox: number,
  oy: number,
  offsets: [number, number][],
): void {
  for (const [dx, dy] of offsets) {
    out.push({ tx: ox + dx, ty: oy + dy });
  }
}
