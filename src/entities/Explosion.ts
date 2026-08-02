import Phaser from 'phaser';
import { BOMB, COLORS, TILE } from '../config';

/** Visual + hit zone for one explosion cell. */
export class ExplosionCell extends Phaser.GameObjects.Rectangle {
  tx = 0;
  ty = 0;
  life = BOMB.fireDuration;
  activeHit = true;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, TILE, TILE, COLORS.fireMid, 0.9);
    scene.add.existing(this);
    this.setDepth(9);
    this.setVisible(false);
    this.setActive(false);
  }

  ignite(tx: number, ty: number, x: number, y: number, isCore: boolean): void {
    this.tx = tx;
    this.ty = ty;
    this.setPosition(x, y);
    this.life = BOMB.fireDuration;
    this.activeHit = true;
    this.setActive(true);
    this.setVisible(true);
    this.setFillStyle(isCore ? COLORS.fireCore : COLORS.fireMid, 0.95);
    this.setScale(0.6);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 60,
      yoyo: true,
    });
  }

  tick(dt: number): boolean {
    if (!this.active) return false;
    this.life -= dt;
    // Fade + color shift
    const t = Math.max(0, this.life / BOMB.fireDuration);
    this.setAlpha(0.35 + 0.65 * t);
    if (t < 0.5) this.setFillStyle(COLORS.fireEdge, 0.35 + 0.65 * t);
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
