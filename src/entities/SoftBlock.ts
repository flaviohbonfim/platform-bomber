import Phaser from 'phaser';
import { COLORS, TILE } from '../config';

export class SoftBlock extends Phaser.Physics.Arcade.Sprite {
  tx = 0;
  ty = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'soft-block');
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static

    this.setDisplaySize(TILE, TILE);
    this.setDepth(3);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(TILE, TILE);
    body.updateFromGameObject();
  }

  place(tx: number, ty: number, x: number, y: number): void {
    this.tx = tx;
    this.ty = ty;
    this.enableBody(true, x, y, true, true);
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.setScale(1);
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.updateFromGameObject();
    this.refreshBody();
  }

  /** Play destroy FX then deactivate. */
  destroyBlock(onDone?: () => void): void {
    this.disableBody(true, false);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.4,
      scaleY: 0.4,
      duration: 120,
      onComplete: () => {
        this.setActive(false);
        this.setVisible(false);
        onDone?.();
      },
    });
  }
}

export function ensureSoftBlockTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('soft-block')) return;

  const g = scene.make.graphics({ x: 0, y: 0 });
  const s = TILE;

  g.fillStyle(COLORS.soft, 1);
  g.fillRect(0, 0, s, s);
  g.fillStyle(COLORS.softDark, 1);
  g.fillRect(0, s - 3, s, 3);
  g.fillRect(s - 3, 0, 3, s);
  g.fillStyle(COLORS.softLight, 0.5);
  g.fillRect(1, 1, s - 4, 2);
  // brick lines
  g.lineStyle(1, COLORS.softDark, 0.6);
  g.lineBetween(0, s / 2, s, s / 2);
  g.lineBetween(s / 2, 0, s / 2, s / 2);
  g.lineBetween(s / 3, s / 2, s / 3, s);

  g.generateTexture('soft-block', s, s);
  g.destroy();
}
