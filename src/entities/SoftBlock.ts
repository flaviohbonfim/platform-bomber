import Phaser from 'phaser';
import { TILE } from '../config';

export class SoftBlock extends Phaser.Physics.Arcade.Sprite {
  tx = 0;
  ty = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'soft-block');
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static

    this.setDisplaySize(TILE, TILE);
    this.setDepth(3);
    this.setOrigin(0.5, 0.5);

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
  void scene;
}
