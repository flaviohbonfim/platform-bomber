import Phaser from 'phaser';
import { finalizeAssets, preloadGameAssets } from '../assets/AssetLoader';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const { width, height } = this.scale;

    // Stylish loading bar
    this.add.rectangle(width / 2, height / 2, width, height, 0x0c1220);
    this.add
      .text(width / 2, height / 2 - 28, 'BOMB PLATFORM', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 - 8, 'loading…', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    const barBg = this.add.rectangle(width / 2, height / 2 + 20, 220, 10, 0x1e293b);
    const bar = this.add
      .rectangle(width / 2 - 108, height / 2 + 20, 4, 6, 0x38bdf8)
      .setOrigin(0, 0.5);
    void barBg;

    this.load.on('progress', (value: number) => {
      bar.width = 4 + 212 * value;
    });

    preloadGameAssets(this);
  }

  create(): void {
    finalizeAssets(this);
    this.scene.start('Title');
  }
}
