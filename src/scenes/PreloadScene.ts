import Phaser from 'phaser';
import { generateAllSprites } from '../assets/SpriteFactory';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, 200, 12, 0x334155);
    const bar = this.add
      .rectangle(width / 2 - 98, height / 2, 4, 8, 0x34d399)
      .setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      bar.width = 4 + 192 * value;
    });

    // Tiny dummy so load pipeline runs
    this.load.image(
      '__dummy',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    );
  }

  create(): void {
    generateAllSprites(this);
    this.scene.start('Title');
  }
}
