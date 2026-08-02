import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { RunState } from '../systems/GameState';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('Victory');
  }

  create(): void {
    const run = this.registry.get('run') as RunState | undefined;
    const score = run?.score ?? 0;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0c1220).setOrigin(0);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'WORLD 1 CLEAR', {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#a78bfa',
        stroke: '#2e1065',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'Você zerou o vertical slice!', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#cbd5e1',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 12, `SCORE FINAL  ${String(score).padStart(6, '0')}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#fef08a',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 52, 'ENTER — voltar ao título', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-ENTER', () => {
      this.registry.remove('run');
      this.scene.start('Title');
    });
    this.input.keyboard?.once('keydown-ESC', () => {
      this.registry.remove('run');
      this.scene.start('Title');
    });
  }
}
