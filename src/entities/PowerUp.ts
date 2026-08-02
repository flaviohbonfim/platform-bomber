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
  const kinds: PowerUpKind[] = ['bomb', 'fire', 'speed', 'life'];
  for (const kind of kinds) {
    const key = `powerup-${kind}`;
    if (scene.textures.exists(key)) continue;

    const g = scene.make.graphics({ x: 0, y: 0 });
    const s = TILE;
    g.fillStyle(0xf8fafc, 1);
    g.fillRoundedRect(1, 1, s - 2, s - 2, 3);
    g.lineStyle(1, KIND_COLOR[kind], 1);
    g.strokeRoundedRect(1, 1, s - 2, s - 2, 3);
    g.fillStyle(KIND_COLOR[kind], 1);

    if (kind === 'bomb') {
      g.fillCircle(s / 2, s / 2 + 1, 4);
      g.fillStyle(COLORS.fuse, 1);
      g.fillRect(s / 2 - 1, 3, 2, 3);
    } else if (kind === 'fire') {
      g.fillTriangle(s / 2, 3, s - 3, s - 3, 3, s - 3);
      g.fillStyle(COLORS.fireCore, 1);
      g.fillTriangle(s / 2, 7, s - 5, s - 3, 5, s - 3);
    } else if (kind === 'speed') {
      g.fillTriangle(4, 4, 4, s - 4, s - 3, s / 2);
    } else {
      g.fillCircle(5, 6, 3);
      g.fillCircle(11, 6, 3);
      g.fillTriangle(2, 7, 14, 7, 8, 13);
    }

    // Label hint
    void KIND_LABEL;

    g.generateTexture(key, s, s);
    g.destroy();
  }
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
