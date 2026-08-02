import Phaser from 'phaser';
import { BOMB, COLORS, TILE } from '../config';

/** Visual + hit zone for one explosion cell. */
export class ExplosionCell extends Phaser.GameObjects.Container {
  tx = 0;
  ty = 0;
  life = BOMB.fireDuration;
  activeHit = true;
  private gfx: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    scene.add.existing(this);
    this.setDepth(9);
    this.setVisible(false);
    this.setActive(false);

    if (scene.textures.exists('fx-explode')) {
      this.gfx = scene.add.image(0, 0, 'fx-explode').setDisplaySize(TILE + 4, TILE + 4);
    } else {
      this.gfx = scene.add.rectangle(0, 0, TILE, TILE, COLORS.fireMid, 0.9);
    }
    this.add(this.gfx);
  }

  ignite(tx: number, ty: number, x: number, y: number, isCore: boolean): void {
    this.tx = tx;
    this.ty = ty;
    this.setPosition(x, y);
    this.life = BOMB.fireDuration;
    this.activeHit = true;
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.setScale(isCore ? 1.15 : 0.9);
    this.scene.tweens.add({
      targets: this,
      scaleX: isCore ? 1.35 : 1.1,
      scaleY: isCore ? 1.35 : 1.1,
      duration: 70,
      yoyo: true,
    });
  }

  tick(dt: number): boolean {
    if (!this.active) return false;
    this.life -= dt;
    const t = Math.max(0, this.life / BOMB.fireDuration);
    this.setAlpha(0.3 + 0.7 * t);
    if (this.life <= 0) {
      this.setActive(false);
      this.setVisible(false);
      this.activeHit = false;
      return true;
    }
    return false;
  }
}

export function ensureExplosionTexture(_scene: Phaser.Scene): void {
  // Rectangle-based for PR2; spritesheet can replace later.
}
