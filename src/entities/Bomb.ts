import Phaser from 'phaser';
import { BOMB, COLORS, TILE } from '../config';

export type BombState = 'planted' | 'airborne';

export class Bomb extends Phaser.Physics.Arcade.Sprite {
  tx = 0;
  ty = 0;
  fuseLeft = BOMB.fuseTime;
  fireRange = 1;
  /** Owner may pass through until they leave the cell (planted only). */
  allowsOwnerPass = true;
  exploding = false;
  ownerId = 0;
  state: BombState = 'planted';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bomb');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(TILE - 4, TILE - 4);
    body.setOffset(2, 2);

    this.setDisplaySize(TILE, TILE);
    this.setDepth(8);
  }

  /** Planted on grid. */
  armPlanted(tx: number, ty: number, fireRange: number, ownerId: number): void {
    this.tx = tx;
    this.ty = ty;
    this.fireRange = fireRange;
    this.ownerId = ownerId;
    this.fuseLeft = BOMB.fuseTime;
    this.allowsOwnerPass = true;
    this.exploding = false;
    this.state = 'planted';
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.setRotation(0);
    this.setScale(1);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setImmovable(true);
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    body.moves = true;

    this.startFusePulse();
  }

  /** Thrown as projectile; fuse already running. */
  armAirborne(
    x: number,
    y: number,
    vx: number,
    vy: number,
    fireRange: number,
    ownerId: number,
  ): void {
    this.tx = -1;
    this.ty = -1;
    this.fireRange = fireRange;
    this.ownerId = ownerId;
    this.fuseLeft = BOMB.fuseTime;
    this.allowsOwnerPass = true; // no player collide while flying
    this.exploding = false;
    this.state = 'airborne';
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.setRotation(0);
    this.setScale(1);
    this.setPosition(x, y);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setImmovable(false);
    body.setAllowGravity(false); // manual gravity
    body.setVelocity(vx, vy);
    body.moves = true;

    this.scene.tweens.killTweensOf(this);
    // Spin while flying
    this.scene.tweens.add({
      targets: this,
      angle: vx >= 0 ? 360 : -360,
      duration: 400,
      repeat: -1,
    });
  }

  /** Snap to grid after landing. */
  becomePlanted(tx: number, ty: number, x: number, y: number): void {
    this.state = 'planted';
    this.tx = tx;
    this.ty = ty;
    this.allowsOwnerPass = true;
    this.setPosition(x, y);
    this.setRotation(0);
    this.scene.tweens.killTweensOf(this);
    this.setScale(1);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setImmovable(true);
    body.setAllowGravity(false);

    this.startFusePulse();
  }

  private startFusePulse(): void {
    this.scene.tweens.killTweensOf(this);
    this.setAngle(0);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 200,
      yoyo: true,
      repeat: -1,
    });
  }

  /** Tick fuse; returns true when it should explode. */
  tick(dt: number): boolean {
    if (this.exploding) return false;
    this.fuseLeft -= dt;
    if (this.fuseLeft < 0.5) {
      this.setAlpha(0.55 + 0.45 * Math.sin(this.fuseLeft * 40));
    }
    return this.fuseLeft <= 0;
  }

  /** Apply throw gravity while airborne. */
  tickAirborne(dt: number): void {
    if (this.state !== 'airborne' || this.exploding) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.velocity.y = Math.min(
      body.velocity.y + BOMB.throwGravity * dt,
      BOMB.throwMaxFall,
    );
  }

  disarm(): void {
    this.exploding = true;
    this.scene.tweens.killTweensOf(this);
    this.setActive(false);
    this.setVisible(false);
    this.setAngle(0);
    this.setScale(1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    body.setVelocity(0, 0);
  }
}

export function ensureBombTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('bomb')) return;

  const g = scene.make.graphics({ x: 0, y: 0 });
  const s = TILE;

  g.fillStyle(COLORS.bomb, 1);
  g.fillCircle(s / 2, s / 2 + 1, s / 2 - 2);
  g.fillStyle(COLORS.bombHighlight, 1);
  g.fillCircle(s / 2 - 2, s / 2 - 1, 3);

  g.lineStyle(2, COLORS.fuse, 1);
  g.lineBetween(s / 2, 3, s / 2 + 3, 0);
  g.fillStyle(0xfef08a, 1);
  g.fillCircle(s / 2 + 3, 0, 1.5);

  g.generateTexture('bomb', s, s);
  g.destroy();
}
