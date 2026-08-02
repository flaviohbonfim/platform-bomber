import Phaser from 'phaser';
import { LIVES } from '../config';
import type { Player } from '../entities/Player';
import type { RunState } from './GameState';

export type HurtResult = 'ignored' | 'hurt' | 'dead';

/**
 * Lives, i-frames, death animation, respawn at checkpoint.
 */
export class LivesSystem {
  iFrames = 0;
  private dying = false;
  private deathTimer = 0;

  constructor(
    private scene: Phaser.Scene,
    private state: RunState,
    private onChanged: () => void,
  ) {}

  isDying(): boolean {
    return this.dying;
  }

  isInvulnerable(): boolean {
    return this.iFrames > 0 || this.dying;
  }

  /**
   * Apply damage. Returns result for scene handling.
   */
  hurt(player: Player): HurtResult {
    if (this.isInvulnerable()) return 'ignored';
    if (player.isDead()) return 'ignored';

    this.state.lives -= 1;
    this.onChanged();

    if (this.state.lives <= 0) {
      this.startDeath(player, true);
      return 'dead';
    }

    this.startDeath(player, false);
    return 'hurt';
  }

  private startDeath(player: Player, gameOver: boolean): void {
    this.dying = true;
    this.deathTimer = LIVES.deathAnimDuration;
    player.beginDeath();

    const body = player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(player.getFacing() * -40, -180);
    body.setCollideWorldBounds(false);

    this.scene.cameras.main.shake(160, 0.008);
    this.scene.cameras.main.flash(100, 255, 60, 60, false);

    if (gameOver) {
      // Longer pause then game over
      this.deathTimer = LIVES.deathAnimDuration + 0.4;
    }
  }

  /**
   * Tick death / i-frames. Returns 'respawn' | 'gameover' | null.
   */
  update(dt: number, player: Player): 'respawn' | 'gameover' | null {
    if (this.iFrames > 0) {
      this.iFrames = Math.max(0, this.iFrames - dt);
      if (!this.dying) {
        player.setAlpha(this.iFrames > 0 ? 0.5 + 0.5 * Math.sin(this.iFrames * 28) : 1);
        if (this.iFrames <= 0) {
          player.setAlpha(1);
          player.clearTint();
        }
      }
    }

    if (!this.dying) return null;

    this.deathTimer -= dt;
    player.setAngle(player.angle + 480 * dt);
    player.setAlpha(0.7);

    if (this.deathTimer > 0) return null;

    this.dying = false;

    if (this.state.lives <= 0) {
      return 'gameover';
    }

    this.respawn(player);
    return 'respawn';
  }

  respawn(player: Player): void {
    player.endDeath(this.state.checkpointX, this.state.checkpointY);
    this.iFrames = LIVES.iFrameDuration;
    player.setAlpha(0.7);
    this.onChanged();
  }

  addLife(): boolean {
    if (this.state.lives >= LIVES.max) return false;
    this.state.lives += 1;
    this.onChanged();
    return true;
  }

  addScore(n: number): void {
    this.state.score += n;
    this.onChanged();
  }
}
