import Phaser from 'phaser';
import { generateAllSprites } from './SpriteFactory';

/**
 * Prefer polished PNG sprites from /assets/sprites; fall back to procedural.
 */
export function preloadGameAssets(scene: Phaser.Scene): void {
  const keys: { key: string; path: string }[] = [
    { key: 'player', path: 'assets/sprites/player.png' },
    { key: 'player-walk', path: 'assets/sprites/player-walk.png' },
    { key: 'bomb', path: 'assets/sprites/bomb.png' },
    { key: 'enemy-ballom', path: 'assets/sprites/enemy-ballom.png' },
    { key: 'enemy-onil', path: 'assets/sprites/enemy-onil.png' },
    { key: 'enemy-dahl', path: 'assets/sprites/enemy-dahl.png' },
    { key: 'boss-king', path: 'assets/sprites/boss-king.png' },
    { key: 'soft-block', path: 'assets/sprites/soft-block.png' },
    { key: 'tile-hard', path: 'assets/sprites/tile-hard.png' },
    { key: 'tile-hard-brick', path: 'assets/sprites/tile-hard-brick.png' },
    { key: 'tile-hard-cave', path: 'assets/sprites/tile-hard-cave.png' },
    { key: 'tile-oneway', path: 'assets/sprites/tile-oneway.png' },
    { key: 'fx-explode', path: 'assets/sprites/fx-explode.png' },
  ];

  for (const { key, path } of keys) {
    scene.load.image(key, path);
  }
}

/** After load: generate any missing procedural textures (HUD, powerups, etc.). */
export function finalizeAssets(scene: Phaser.Scene): void {
  // Always generate procedural set for keys that may not exist as PNG
  // generateAllSprites skips existing keys — so PNGs win.
  generateAllSprites(scene);
}
