import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { RunState } from '../systems/GameState';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(data: { score?: number }): void {
    const run = this.registry.get('run') as RunState | undefined;
    const score = data.score ?? run?.score ?? 0;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0a12, 0.92).setOrigin(0);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'GAME OVER', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#ef4444',
        stroke: '#450a0a',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 8, `SCORE  ${String(score).padStart(6, '0')}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#fef08a',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 36, 'Z / ENTER — tentar de novo', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#e2e8f0',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 56, 'ESC — título', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    const retry = () => {
      this.scene.stop('UI');
      this.registry.remove('run');
      this.scene.start('Game', { reset: true, levelId: 'w1-1' });
    };
    const title = () => {
      this.scene.stop('UI');
      this.scene.start('Title');
    };

    this.input.keyboard?.once('keydown-Z', retry);
    this.input.keyboard?.once('keydown-ENTER', retry);
    this.input.keyboard?.once('keydown-SPACE', retry);
    this.input.keyboard?.once('keydown-ESC', title);
  }
}
