import Phaser from 'phaser';
import { TILE } from '../config';
import { tileCenter } from '../utils/grid';

/**
 * Level exit portal. Player must stand and overlap to clear the stage.
 */
export class ExitDoor extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, tx: number, ty: number) {
    const { x, y } = tileCenter(tx, ty);
    // Feet on floor cell bottom
    const baseY = y + TILE / 2;
    super(scene, x, baseY - 14, 'exit-door');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(5);
    this.setOrigin(0.5, 1);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(16, 24);
    body.setOffset(4, 4);

    // Pulse glow
    scene.tweens.add({
      targets: this,
      alpha: 0.75,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Floating particles hint
    scene.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => {
        if (!this.active) return;
        const p = scene.add.circle(
          this.x + Phaser.Math.Between(-6, 6),
          this.y - 10,
          2,
          0xc4b5fd,
          0.9,
        );
        p.setDepth(6);
        scene.tweens.add({
          targets: p,
          y: p.y - 16,
          alpha: 0,
          duration: 500,
          onComplete: () => p.destroy(),
        });
      },
    });
  }
}
