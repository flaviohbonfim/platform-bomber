import type { EnemySpawn } from '../systems/EnemySystem';
import { GREYBOX_HEIGHT } from './greyboxLevel';

/** Enemy placements for greybox combat practice. */
export function buildEnemySpawns(): EnemySpawn[] {
  const h = GREYBOX_HEIGHT;
  const floor = h - 3;

  return [
    // Early Balloms — teach bomb combat safely
    { kind: 'ballom', tx: 10, ty: floor },
    { kind: 'ballom', tx: 16, ty: floor },

    // Mid — Onil chase on platforms
    { kind: 'onil', tx: 28, ty: h - 9 },
    { kind: 'ballom', tx: 34, ty: h - 9 },

    // After pit
    { kind: 'onil', tx: 53, ty: floor },
    { kind: 'ballom', tx: 58, ty: floor },

    // High area — Dahl (jump + spore)
    { kind: 'dahl', tx: 62, ty: h - 9 },
    { kind: 'dahl', tx: 70, ty: h - 6 },

    // One more ballom near end
    { kind: 'ballom', tx: 74, ty: floor },
  ];
}
