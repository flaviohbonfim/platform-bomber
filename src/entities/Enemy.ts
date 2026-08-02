import Phaser from 'phaser';
import { ENEMY, TILE } from '../config';
import { approach } from '../utils/feel';
import type { Player } from './Player';

export type EnemyKind = 'ballom' | 'onil' | 'dahl';

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  kind: EnemyKind = 'ballom';
  hp = 1;
  facing = 1;
  /** Cooldown so multi-frame fire doesn't melt HP instantly. */
  fireHitCd = 0;
  protected moveSpeed: number = ENEMY.ballomSpeed;
  protected dying = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false); // manual
    body.setSize(12, 12);
    body.setOffset(2, 4);
    body.setCollideWorldBounds(true);

    this.setDisplaySize(16, 16);
    this.setDepth(9);
  }

  spawnAt(x: number, y: number): void {
    this.enableBody(true, x, y, true, true);
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.setAngle(0);
    this.setScale(1);
    this.dying = false;
    this.hp = this.kind === 'dahl' ? 2 : 1;
    this.facing = Math.random() < 0.5 ? -1 : 1;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
  }

  isDying(): boolean {
    return this.dying;
  }

  /** Returns true if enemy died. */
  takeDamage(amount = 1): boolean {
    if (this.dying || !this.active) return false;
    this.hp -= amount;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.active && !this.dying) this.clearTint();
    });
    if (this.hp <= 0) {
      this.killEnemy();
      return true;
    }
    return false;
  }

  killEnemy(): void {
    if (this.dying) return;
    this.dying = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 0.4,
      duration: 180,
      onComplete: () => {
        this.setActive(false);
        this.setVisible(false);
      },
    });
  }

  abstract aiUpdate(
    dt: number,
    player: Player,
    solidLayer: Phaser.Tilemaps.TilemapLayer,
    softGroup: Phaser.Physics.Arcade.StaticGroup,
  ): void;

  protected applyGravity(dt: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!(body.blocked.down || body.touching.down)) {
      body.velocity.y = Math.min(body.velocity.y + ENEMY.gravity * dt, ENEMY.maxFall);
    } else if (body.velocity.y > 0) {
      body.velocity.y = 0;
    }
  }

  protected moveHorizontal(dt: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const target = this.facing * this.moveSpeed;
    body.setVelocityX(approach(body.velocity.x, target, this.moveSpeed * 8 * dt));
    this.setFlipX(this.facing < 0);
  }

  /** Turn around on wall or ledge. */
  protected patrolTurn(solidLayer: Phaser.Tilemaps.TilemapLayer): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.left || body.touching.left) this.facing = 1;
    if (body.blocked.right || body.touching.right) this.facing = -1;

    // Ledge detect: look ahead at feet
    if (body.blocked.down || body.touching.down) {
      const lookX = this.x + this.facing * (TILE * 0.6);
      const lookY = body.bottom + 2;
      const tile = solidLayer.getTileAtWorldXY(lookX, lookY);
      if (!tile || !tile.collides) {
        this.facing *= -1;
      }
    }
  }
}

export function ensureEnemyTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('enemy-ballom')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    // Pink balloon
    g.fillStyle(0xf9a8d4, 1);
    g.fillCircle(8, 9, 6);
    g.fillStyle(0x831843, 1);
    g.fillCircle(6, 8, 1.5);
    g.fillCircle(10, 8, 1.5);
    g.fillStyle(0xbe185d, 1);
    g.fillTriangle(8, 14, 6, 16, 10, 16);
    g.generateTexture('enemy-ballom', 16, 16);
    g.destroy();
  }
  if (!scene.textures.exists('enemy-onil')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    // Blue mean balloon
    g.fillStyle(0x60a5fa, 1);
    g.fillCircle(8, 8, 7);
    g.fillStyle(0x1e3a8a, 1);
    g.fillRect(4, 6, 3, 2);
    g.fillRect(9, 6, 3, 2);
    g.fillStyle(0xef4444, 1);
    g.fillTriangle(8, 10, 5, 12, 11, 12);
    g.generateTexture('enemy-onil', 16, 16);
    g.destroy();
  }
  if (!scene.textures.exists('enemy-dahl')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    // Green hopper
    g.fillStyle(0x4ade80, 1);
    g.fillRoundedRect(2, 4, 12, 10, 3);
    g.fillStyle(0x14532d, 1);
    g.fillCircle(5, 8, 1.5);
    g.fillCircle(11, 8, 1.5);
    g.fillStyle(0x22c55e, 1);
    g.fillRect(3, 13, 4, 2);
    g.fillRect(9, 13, 4, 2);
    g.generateTexture('enemy-dahl', 16, 16);
    g.destroy();
  }
  if (!scene.textures.exists('spore')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xa3e635, 1);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0x65a30d, 0.8);
    g.fillCircle(3, 3, 1.5);
    g.generateTexture('spore', 8, 8);
    g.destroy();
  }
}
