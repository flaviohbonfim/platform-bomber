import Phaser from 'phaser';
import { generateAllSprites } from './SpriteFactory';

/**
 * Prefer polished PNG sprites from /assets/sprites; fall back to procedural.
 */
export function preloadGameAssets(scene: Phaser.Scene): void {
  const images: { key: string; path: string }[] = [
    { key: 'player', path: 'assets/sprites/player.png' },
    { key: 'player-walk', path: 'assets/sprites/player-walk.png' },
    { key: 'player-jump', path: 'assets/sprites/player-jump.png' },
    { key: 'player-throw', path: 'assets/sprites/player-throw.png' },
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

  for (const { key, path } of images) {
    scene.load.image(key, path);
  }

  // 4-frame walk cycle sheet (48×56 per frame)
  scene.load.spritesheet('player-sheet', 'assets/sprites/player-sheet.png', {
    frameWidth: 48,
    frameHeight: 56,
  });
}

/** After load: animations + procedural fallbacks for missing keys. */
export function finalizeAssets(scene: Phaser.Scene): void {
  generateAllSprites(scene);

  if (!scene.anims.exists('bomber-walk') && scene.textures.exists('player-sheet')) {
    scene.anims.create({
      key: 'bomber-walk',
      frames: scene.anims.generateFrameNumbers('player-sheet', { start: 0, end: 3 }),
      frameRate: 12,
      repeat: -1,
    });
  }

  if (!scene.anims.exists('bomber-idle') && scene.textures.exists('player')) {
    scene.anims.create({
      key: 'bomber-idle',
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 1,
      repeat: -1,
    });
  }
}
