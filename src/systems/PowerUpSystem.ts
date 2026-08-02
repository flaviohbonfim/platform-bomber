import Phaser from 'phaser';
import { LIVES, POWERUP } from '../config';
import {
  ensurePowerUpTextures,
  PowerUp,
  rollPowerUpKind,
  type PowerUpKind,
} from '../entities/PowerUp';
import type { Player } from '../entities/Player';
import type { RunState } from './GameState';
import { tileCenter } from '../utils/grid';

export interface PowerUpSystemEvents {
  onCollected?: (kind: PowerUpKind) => void;
  onHudDirty?: () => void;
}

/**
 * Spawns and collects Bomb/Fire/Speed/Life power-ups; mutates RunState.
 */
export class PowerUpSystem {
  readonly group: Phaser.Physics.Arcade.Group;

  constructor(
    private scene: Phaser.Scene,
    private state: RunState,
    private events: PowerUpSystemEvents = {},
  ) {
    ensurePowerUpTextures(scene);
    this.group = scene.physics.add.group({
      classType: PowerUp,
      maxSize: 32,
      runChildUpdate: false,
    });
  }

  setupOverlap(player: Player): void {
    this.scene.physics.add.overlap(player, this.group, (_p, obj) => {
      const pu = obj as PowerUp;
      if (!pu.active) return;
      this.collect(pu, player);
    });
  }

  spawnAtTile(tx: number, ty: number, kind?: PowerUpKind): PowerUp | null {
    const k = kind ?? rollPowerUpKind(POWERUP.dropWeights);
    const { x, y } = tileCenter(tx, ty);
    return this.spawnAt(x, y, k);
  }

  spawnAt(x: number, y: number, kind: PowerUpKind): PowerUp | null {
    let pu = this.group.getFirstDead(false) as PowerUp | null;
    if (!pu) {
      if (this.group.getLength() >= 32) return null;
      pu = new PowerUp(this.scene, x, y);
      this.group.add(pu);
    }
    pu.spawn(kind, x, y);
    return pu;
  }

  /** Random drop from soft block. */
  tryDropFromSoft(tx: number, ty: number): void {
    this.spawnAtTile(tx, ty);
  }

  private collect(pu: PowerUp, player: Player): void {
    const kind = pu.kind;
    pu.collect();

    switch (kind) {
      case 'bomb':
        if (this.state.maxBombs < POWERUP.maxBombs) this.state.maxBombs += 1;
        break;
      case 'fire':
        if (this.state.fireRange < POWERUP.maxFire) this.state.fireRange += 1;
        break;
      case 'speed':
        if (this.state.speedStacks < POWERUP.maxSpeedStacks) {
          this.state.speedStacks += 1;
          player.setSpeedStacks(this.state.speedStacks);
        }
        break;
      case 'life':
        if (this.state.lives < LIVES.max) this.state.lives += 1;
        break;
    }

    this.state.score += LIVES.scorePowerUp;
    this.events.onCollected?.(kind);
    this.events.onHudDirty?.();

    // Pickup flash
    const flash = this.scene.add.circle(pu.x, pu.y, 6, 0xffffff, 0.8);
    this.scene.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });
  }
}
