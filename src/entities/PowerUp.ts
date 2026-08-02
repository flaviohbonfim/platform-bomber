import Phaser from 'phaser';
import { COLORS, TILE } from '../config';

export type PowerUpKind = 'bomb' | 'fire' | 'speed' | 'life';

const KIND_COLOR: Record<PowerUpKind, number> = {
  bomb: 0x1e1e24,
  fire: 0xfb923c,
  speed: 0x38bdf8,
  life: 0xef4444,
};

const KIND_LABEL: Record<PowerUpKind, string> = {
  bomb: 'B',
  fire: 'F',
  speed: 'S',
  life: '♥',
};

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  kind: PowerUpKind = 'bomb';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'powerup-bomb');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(TILE - 4, TILE - 4);
    body.setOffset(2, 2);

    this.setDisplaySize(TILE, TILE);
    this.setDepth(7);
  }

  spawn(kind: PowerUpKind, x: number, y: number): void {
    this.kind = kind;
    this.setTexture(`powerup-${kind}`);
    this.enableBody(true, x, y, true, true);
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.setScale(1);

    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      y: y - 3,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  collect(): void {
    this.scene.tweens.killTweensOf(this);
    this.disableBody(true, true);
    this.setActive(false);
    this.setVisible(false);
  }
}

export function ensurePowerUpTextures(scene: Phaser.Scene): void {
  void scene;
  void TILE;
  void COLORS;
  void KIND_COLOR;
  void KIND_LABEL;
}

/** Weighted random power-up kind. */
export function rollPowerUpKind(
  weights: Record<PowerUpKind, number>,
): PowerUpKind {
  const entries = Object.entries(weights) as [PowerUpKind, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [kind, w] of entries) {
    r -= w;
    if (r <= 0) return kind;
  }
  return 'bomb';
}
