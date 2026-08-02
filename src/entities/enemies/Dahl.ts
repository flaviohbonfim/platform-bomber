import type { Player } from '../Player';
import { ENEMY } from '../../config';
import { Enemy } from '../Enemy';

export type SporeSpawnFn = (x: number, y: number, dir: number) => void;

export class Dahl extends Enemy {
  private shootCd: number = ENEMY.dahlShootCooldown;
  private jumpCd = 0;
  private onSpore: SporeSpawnFn | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy-dahl');
    this.kind = 'dahl';
    this.moveSpeed = ENEMY.dahlSpeed;
    this.hp = 2;
  }

  setSporeCallback(fn: SporeSpawnFn): void {
    this.onSpore = fn;
  }

  aiUpdate(
    dt: number,
    player: Player,
    solidLayer: Phaser.Tilemaps.TilemapLayer,
    _softGroup: Phaser.Physics.Arcade.StaticGroup,
  ): void {
    if (this.dying || !this.active) return;
    this.applyGravity(dt);

    const body = this.body as Phaser.Physics.Arcade.Body;
    const onFloor = body.blocked.down || body.touching.down;

    this.shootCd -= dt;
    this.jumpCd -= dt;

    // Jump short gaps or toward player if close
    if (onFloor && this.jumpCd <= 0) {
      const lookX = this.x + this.facing * 18;
      const lookY = body.bottom + 4;
      const groundAhead = solidLayer.getTileAtWorldXY(lookX, lookY);
      const gap = !groundAhead || !groundAhead.collides;
      const playerNear =
        Math.abs(player.x - this.x) < 80 && Math.abs(player.y - this.y) < 40;

      if (gap || (playerNear && Math.random() < 0.02)) {
        body.setVelocityY(ENEMY.dahlJumpVy);
        this.jumpCd = 1.1;
      }
    }

    // Shoot spore toward player
    if (
      this.shootCd <= 0 &&
      player.canControl() &&
      Math.abs(player.y - this.y) < 48 &&
      Math.abs(player.x - this.x) < 200
    ) {
      const dir = player.x >= this.x ? 1 : -1;
      this.facing = dir;
      this.onSpore?.(this.x + dir * 8, this.y - 2, dir);
      this.shootCd = ENEMY.dahlShootCooldown + Math.random() * 0.6;
    }

    this.patrolTurn(solidLayer);
    this.moveHorizontal(dt);
  }
}
