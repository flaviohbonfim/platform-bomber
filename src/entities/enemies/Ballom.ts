import type { Player } from '../Player';
import { ENEMY } from '../../config';
import { Enemy } from '../Enemy';

export class Ballom extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy-ballom');
    this.kind = 'ballom';
    this.moveSpeed = ENEMY.ballomSpeed;
    this.hp = 1;
  }

  aiUpdate(
    dt: number,
    _player: Player,
    solidLayer: Phaser.Tilemaps.TilemapLayer,
    _softGroup: Phaser.Physics.Arcade.StaticGroup,
  ): void {
    if (this.dying || !this.active) return;
    this.applyGravity(dt);
    this.patrolTurn(solidLayer);
    this.moveHorizontal(dt);
  }
}
