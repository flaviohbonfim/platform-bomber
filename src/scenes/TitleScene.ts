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

    // Gradient sky
    const g = this.add.graphics();
    g.fillGradientStyle(0x1e3a5f, 0x1e3a5f, 0x0c1220, 0x0c1220, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Decorative hills
    if (this.textures.exists('bg-hill')) {
      for (let i = 0; i < 4; i++) {
        this.add.image(80 + i * 160, GAME_HEIGHT - 20, 'bg-hill').setAlpha(0.35).setScale(1.2);
      }
    }

    // Hero showcase
    if (this.textures.exists('player')) {
      const hero = this.add.image(GAME_WIDTH / 2 - 120, GAME_HEIGHT / 2 + 10, 'player');
      hero.setScale(2.2);
      this.tweens.add({
        targets: hero,
        y: hero.y - 6,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    if (this.textures.exists('bomb')) {
      this.add.image(GAME_WIDTH / 2 - 70, GAME_HEIGHT / 2 + 28, 'bomb').setScale(1.6);
    }
    if (this.textures.exists('enemy-ballom')) {
      this.add.image(GAME_WIDTH / 2 + 130, GAME_HEIGHT / 2 + 20, 'enemy-ballom').setScale(1.8);
    }
    if (this.textures.exists('boss-king')) {
      this.add.image(GAME_WIDTH / 2 + 190, GAME_HEIGHT / 2 + 8, 'boss-king').setScale(1.1).setAlpha(0.9);
    }

    this.add
      .text(GAME_WIDTH / 2, 56, 'BOMB PLATFORM', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#f8fafc',
        stroke: '#0f172a',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 92, 'modern pixel sidescroller', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#7dd3fc',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'World 1 — Garden · Brick · Cave · King Bomb', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#cbd5e1',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 72, 'PRESSIONE ENTER / Z', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#fbbf24',
        stroke: '#422006',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    void COLORS;

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
