import type { Player } from '../Player';
import { ENEMY } from '../../config';
import { Enemy } from '../Enemy';

export class Onil extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy-onil');
    this.kind = 'onil';
    this.moveSpeed = ENEMY.onilSpeed;
    this.hp = 1;
  }

  aiUpdate(
    dt: number,
    player: Player,
    solidLayer: Phaser.Tilemaps.TilemapLayer,
    _softGroup: Phaser.Physics.Arcade.StaticGroup,
  ): void {
    if (this.dying || !this.active) return;
    this.applyGravity(dt);

    // Chase if roughly same platform height and within range
    const dy = Math.abs(player.y - this.y);
    const dx = player.x - this.x;
    const inRange = Math.abs(dx) < 160 && dy < 28 && player.canControl();

    if (inRange) {
      this.facing = dx >= 0 ? 1 : -1;
      this.moveSpeed = ENEMY.onilSpeed;
    } else {
      this.moveSpeed = ENEMY.onilSpeed * 0.65;
      this.patrolTurn(solidLayer);
    }

    this.moveHorizontal(dt);
  }
}
