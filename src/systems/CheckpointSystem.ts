import Phaser from 'phaser';
import { COLORS, TILE } from '../config';
import type { Player } from '../entities/Player';
import type { RunState } from './GameState';
import { tileCenter } from '../utils/grid';

interface CheckpointFlag {
  tx: number;
  ty: number;
  x: number;
  y: number;
  activated: boolean;
  sprite: Phaser.GameObjects.Container;
  zone: Phaser.GameObjects.Zone;
}

export function ensureCheckpointTextures(scene: Phaser.Scene): void {
  void scene;
  void COLORS;
}

/**
 * Checkpoint flags: activate on touch, update run state spawn.
 */
export class CheckpointSystem {
  private flags: CheckpointFlag[] = [];

  constructor(
    private scene: Phaser.Scene,
    private state: RunState,
    private onActivated: (flagIndex: number) => void,
  ) {
    ensureCheckpointTextures(scene);
  }

  /** Spawn flags at tile positions (feet on tile below). */
  spawn(cells: { tx: number; ty: number }[]): void {
    for (const { tx, ty } of cells) {
      const { x, y } = tileCenter(tx, ty);
      // Place base at bottom of cell
      const baseY = y + TILE / 2;

      const pole = this.scene.add.image(0, -14, 'flag-pole');
      const flag = this.scene.add.image(8, -22, 'flag-off');
      flag.setName('flag-cloth');

      const container = this.scene.add.container(x, baseY, [pole, flag]);
      container.setDepth(6);

      const zone = this.scene.add.zone(x, baseY - 12, 20, 28);
      this.scene.physics.add.existing(zone, true);

      this.flags.push({
        tx,
        ty,
        x,
        y: baseY - 16,
        activated: false,
        sprite: container,
        zone,
      });
    }
  }

  /** Overlap player with checkpoints. */
  setupOverlap(player: Player): void {
    for (const flag of this.flags) {
      this.scene.physics.add.overlap(player, flag.zone, () => {
        this.activate(flag);
      });
    }
  }

  private activate(flag: CheckpointFlag): void {
    if (flag.activated) return;
    flag.activated = true;

    this.state.checkpointX = flag.x;
    this.state.checkpointY = flag.y;
    this.state.hasCheckpoint = true;

    const cloth = flag.sprite.getByName('flag-cloth') as Phaser.GameObjects.Image;
    cloth?.setTexture('flag-on');

    this.scene.tweens.add({
      targets: flag.sprite,
      y: flag.sprite.y - 4,
      duration: 120,
      yoyo: true,
    });

    // Sparkle
    const burst = this.scene.add.circle(flag.x, flag.y - 10, 3, 0xfef08a, 1);
    this.scene.tweens.add({
      targets: burst,
      scale: 3,
      alpha: 0,
      duration: 300,
      onComplete: () => burst.destroy(),
    });

    this.onActivated(this.flags.indexOf(flag));
  }

  getFlags(): readonly CheckpointFlag[] {
    return this.flags;
  }
}
