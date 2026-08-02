import { GREYBOX_HEIGHT } from './greyboxLevel';

/** Checkpoint flag tile positions for greybox. */
export function buildCheckpointCells(): { tx: number; ty: number }[] {
  const h = GREYBOX_HEIGHT;
  // Place on walkable floor/platform tops (empty cells above solids)
  return [
    { tx: 20, ty: h - 3 }, // after first steps
    { tx: 40, ty: h - 3 }, // before pit
    { tx: 54, ty: h - 3 }, // after pit
  ];
}
