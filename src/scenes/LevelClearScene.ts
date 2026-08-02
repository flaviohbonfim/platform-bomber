import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { RunState } from '../systems/GameState';

export class LevelClearScene extends Phaser.Scene {
  constructor() {
    super('LevelClear');
  }

  create(data: {
    levelName: string;
    nextLevelId: string | null;
    score: number;
  }): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0a12, 0.88).setOrigin(0);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'STAGE CLEAR!', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#fbbf24',
        stroke: '#422006',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 16, data.levelName, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#e2e8f0',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 10,
        `SCORE  ${String(data.score).padStart(6, '0')}`,
        {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#fef08a',
        },
      )
      .setOrigin(0.5);

    const hasNext = !!data.nextLevelId;
    const prompt = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 48,
        hasNext ? 'Z / ENTER — próxima fase' : 'Z / ENTER — vitória',
        {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#86efac',
        },
      )
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.4,
      duration: 450,
      yoyo: true,
      repeat: -1,
    });

    const go = () => {
      this.scene.stop('UI');
      if (data.nextLevelId) {
        this.scene.start('Game', { levelId: data.nextLevelId, continueRun: true });
      } else {
        this.scene.start('Victory');
      }
    };

    this.input.keyboard?.once('keydown-Z', go);
    this.input.keyboard?.once('keydown-ENTER', go);
    this.input.keyboard?.once('keydown-SPACE', go);
    this.input.once('pointerdown', go);

    void (this.registry.get('run') as RunState | undefined);
  }
}
