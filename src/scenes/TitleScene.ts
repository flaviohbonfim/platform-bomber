import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { firstLevelId } from '../levels/world1';
import { getAudio } from '../systems/AudioSystem';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    getAudio().stopMusic();

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg).setOrigin(0);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 56, 'BOMB PLATFORM', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#f5f5f5',
        stroke: '#1e293b',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 24, 'World 1 — 3 stages + Boss', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 4, 'Garden · Brick · Cave · King Bomb', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#64748b',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 32, 'PRESSIONE ENTER / Z', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#fbbf24',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.35,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 24,
        '←→ mover  Z pular  X bomba (tap/hold)  portal = sair da fase',
        {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#64748b',
        },
      )
      .setOrigin(0.5);

    const start = () => {
      getAudio().resume();
      this.registry.remove('run');
      this.scene.start('Game', { levelId: firstLevelId(), reset: true });
    };

    this.input.keyboard?.once('keydown-ENTER', start);
    this.input.keyboard?.once('keydown-Z', start);
    this.input.keyboard?.once('keydown-SPACE', start);
    this.input.once('pointerdown', start);
  }
}
