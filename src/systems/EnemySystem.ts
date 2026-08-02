import Phaser from 'phaser';
import { ENEMY, LIVES } from '../config';
import { Ballom } from '../entities/enemies/Ballom';
import { Dahl } from '../entities/enemies/Dahl';
import { Onil } from '../entities/enemies/Onil';
import { ensureEnemyTextures, type Enemy, type EnemyKind } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import type { BombSystem } from './BombSystem';
import { tileCenter } from '../utils/grid';

export interface EnemySpawn {
  kind: EnemyKind;
  tx: number;
  ty: number;
}

export interface EnemySystemEvents {
  onEnemyKilled?: (kind: EnemyKind, score: number) => void;
  onPlayerHit?: () => void;
}

/**
 * Spawns and updates enemies; fire damage via BombSystem; contact damage.
 */
export class EnemySystem {
  readonly group: Phaser.Physics.Arcade.Group;
  readonly spores: Phaser.Physics.Arcade.Group;
  private solidLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private softGroup: Phaser.Physics.Arcade.StaticGroup | null = null;

  constructor(
    private scene: Phaser.Scene,
    private events: EnemySystemEvents = {},
  ) {
    ensureEnemyTextures(scene);

    this.group = scene.physics.add.group({
      runChildUpdate: false,
      maxSize: 32,
    });

    this.spores = scene.physics.add.group({
      maxSize: 16,
      allowGravity: false,
    });
  }

  setLevel(
    solidLayer: Phaser.Tilemaps.TilemapLayer,
    softGroup: Phaser.Physics.Arcade.StaticGroup,
  ): void {
    this.solidLayer = solidLayer;
    this.softGroup = softGroup;

    this.scene.physics.add.collider(this.group, solidLayer);
    this.scene.physics.add.collider(this.group, softGroup);
    this.scene.physics.add.collider(this.spores, solidLayer, (spore) => {
      (spore as Phaser.Physics.Arcade.Sprite).destroy();
    });
  }

  setupPlayerCollisions(player: Player): void {
    this.scene.physics.add.overlap(player, this.group, () => {
      this.events.onPlayerHit?.();
    });
    this.scene.physics.add.overlap(player, this.spores, (_p, spore) => {
      (spore as Phaser.Physics.Arcade.Sprite).destroy();
      this.events.onPlayerHit?.();
    });
  }

  spawnAll(spawns: EnemySpawn[]): void {
    for (const s of spawns) {
      this.spawnOne(s.kind, s.tx, s.ty);
    }
  }

  spawnOne(kind: EnemyKind, tx: number, ty: number): Enemy | null {
    // Feet on bottom of cell (sprites use origin bottom-center)
    const { x, y } = tileCenter(tx, ty);
    const footY = y + 16; // bottom of 32px tile
    let enemy: Enemy;

    switch (kind) {
      case 'onil':
        enemy = new Onil(this.scene, x, y);
        break;
      case 'dahl': {
        const dahl = new Dahl(this.scene, x, y);
        dahl.setSporeCallback((sx, sy, dir) => this.spawnSpore(sx, sy, dir));
        enemy = dahl;
        break;
      }
      default:
        enemy = new Ballom(this.scene, x, y);
        break;
    }

    this.group.add(enemy);
    enemy.spawnAt(x, footY);
    return enemy;
  }

  private spawnSpore(x: number, y: number, dir: number): void {
    const spore = this.spores.create(x, y, 'spore') as Phaser.Physics.Arcade.Sprite;
    if (!spore) return;
    spore.setDepth(11);
    spore.setDisplaySize(8, 8);
    const body = spore.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(dir * ENEMY.sporeSpeed, 0);
    body.setSize(6, 6);

    this.scene.time.delayedCall(ENEMY.sporeLife * 1000, () => {
      if (spore.active) spore.destroy();
    });
  }

  update(dt: number, player: Player, bombSys: BombSystem): void {
    if (!this.solidLayer || !this.softGroup) return;

    this.group.children.each((obj) => {
      const enemy = obj as Enemy;
      if (!enemy.active || enemy.isDying()) return true;

      enemy.aiUpdate(dt, player, this.solidLayer!, this.softGroup!);

      if (enemy.fireHitCd > 0) enemy.fireHitCd -= dt;

      // Fire damage (once per burst window)
      if (enemy.fireHitCd <= 0 && bombSys.isEntityOnFire(enemy)) {
        enemy.fireHitCd = 0.4;
        const died = enemy.takeDamage(1);
        if (died) {
          const score = this.scoreFor(enemy.kind);
          this.events.onEnemyKilled?.(enemy.kind, score);
        }
      }
      return true;
    });
  }

  private scoreFor(kind: EnemyKind): number {
    switch (kind) {
      case 'onil':
        return LIVES.scoreOnil;
      case 'dahl':
        return LIVES.scoreDahl;
      default:
        return LIVES.scoreBallom;
    }
  }

  aliveCount(): number {
    let n = 0;
    this.group.children.each((obj) => {
      const e = obj as Enemy;
      if (e.active && !e.isDying()) n += 1;
      return true;
    });
    return n;
  }
}
