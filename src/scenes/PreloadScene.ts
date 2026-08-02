import Phaser from 'phaser';
import { ensurePlayerTexture } from '../entities/Player';
import { ensureTileTextures } from '../levels/LevelLoader';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    // PR1: all textures generated in create; no external assets yet.
    const { width, height } = this.scale;
    const barBg = this.add.rectangle(width / 2, height / 2, 200, 12, 0x334155);
    const bar = this.add.rectangle(width / 2 - 98, height / 2, 4, 8, 0x34d399).setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      bar.width = 4 + 192 * value;
    });

    // Dummy load so the bar can show (instant otherwise)
    this.load.image(
      '__dummy',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    );

    void barBg;
  }

  create(): void {
    ensureTileTextures(this);
    ensurePlayerTexture(this);
    this.scene.start('Title');
  }
}
