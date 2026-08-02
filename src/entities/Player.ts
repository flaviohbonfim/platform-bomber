import Phaser from 'phaser';
import { COLORS, FEEL, PLAYER, POWERUP } from '../config';
import { approach, deriveJumpPhysics, type JumpPhysics } from '../utils/feel';
import { getAudio } from '../systems/AudioSystem';
import type { InputState } from '../systems/InputSystem';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private physicsFeel: JumpPhysics;
  private coyoteTimer = 0;
  private bufferTimer = 0;
  private facing = 1; // 1 right, -1 left
  private wasOnFloor = false;
  private dropThroughTimer = 0;
  private speedStacks = 0;
  private maxRunSpeed: number = FEEL.maxRunSpeed;

  /** Exposed for one-way drop-through handling in GameScene. */
  isDroppingThrough = false;
  /** False while death animation / until respawn. */
  private controllable = true;
  private dead = false;
  private frozen = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.physicsFeel = deriveJumpPhysics();

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER.width, PLAYER.height);
    body.setOffset(
      (PLAYER.displayWidth - PLAYER.width) / 2,
      PLAYER.displayHeight - PLAYER.height,
    );
    body.setCollideWorldBounds(true);
    body.setMaxVelocityY(FEEL.maxFallSpeed);
    // Gravity is applied per-frame with asymmetric rise/fall.
    body.setAllowGravity(false);

    this.setDisplaySize(PLAYER.displayWidth, PLAYER.displayHeight);
    this.setDepth(10);
  }

  getFacing(): number {
    return this.facing;
  }

  setSpeedStacks(stacks: number): void {
    this.speedStacks = Math.max(0, stacks);
    const bonus = 1 + this.speedStacks * POWERUP.speedPerStack;
    this.maxRunSpeed = FEEL.maxRunSpeed * bonus;
    this.physicsFeel = deriveJumpPhysics(
      FEEL.jumpHeightTiles,
      FEEL.timeToApex,
      FEEL.fallMultiplier,
      this.maxRunSpeed,
      FEEL.groundAccelTime,
      FEEL.airControl,
    );
  }

  canControl(): boolean {
    return this.controllable && this.active && !this.dead && !this.frozen;
  }

  isDead(): boolean {
    return this.dead;
  }

  /** Freeze input without death animation (level clear, cutscene). */
  freezeControl(): void {
    this.frozen = true;
    this.controllable = false;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
  }

  beginDeath(): void {
    this.controllable = false;
    this.dead = true;
    this.frozen = false;
    this.setTint(0xef4444);
  }

  endDeath(x: number, y: number): void {
    this.controllable = true;
    this.dead = false;
    this.frozen = false;
    this.setAngle(0);
    this.setAlpha(1);
    this.clearTint();
    this.setPosition(x, y);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setCollideWorldBounds(true);
    body.enable = true;

    this.coyoteTimer = 0;
    this.bufferTimer = 0;
    this.isDroppingThrough = false;
    this.dropThroughTimer = 0;
  }

  update(dt: number, input: InputState, solidLayer?: Phaser.Tilemaps.TilemapLayer): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Level clear freeze — stay put
    if (this.frozen) {
      body.setVelocity(0, 0);
      return;
    }

    // Death: only apply gravity / spin handled by LivesSystem
    if (!this.controllable) {
      body.setVelocityY(body.velocity.y + this.physicsFeel.fallGravity * dt);
      if (body.velocity.y > FEEL.maxFallSpeed) body.setVelocityY(FEEL.maxFallSpeed);
      return;
    }

    const onFloor = body.blocked.down || body.touching.down;

    // --- Timers ---
    if (onFloor) {
      this.coyoteTimer = FEEL.coyoteTime;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (input.jumpPressed) {
      this.bufferTimer = FEEL.jumpBuffer;
    } else {
      this.bufferTimer = Math.max(0, this.bufferTimer - dt);
    }

    // Drop-through one-way platforms
    if (this.dropThroughTimer > 0) {
      this.dropThroughTimer = Math.max(0, this.dropThroughTimer - dt);
      this.isDroppingThrough = this.dropThroughTimer > 0;
    } else {
      this.isDroppingThrough = false;
    }

    if (input.down && input.jumpPressed && onFloor) {
      this.dropThroughTimer = 0.18;
      this.isDroppingThrough = true;
      this.coyoteTimer = 0;
      this.bufferTimer = 0;
    }

    // --- Horizontal move ---
    let targetVx = 0;
    if (input.left) {
      targetVx = -this.maxRunSpeed;
      this.facing = -1;
    } else if (input.right) {
      targetVx = this.maxRunSpeed;
      this.facing = 1;
    }

    const accel = onFloor ? this.physicsFeel.groundAccel : this.physicsFeel.airAccel;
    if (targetVx !== 0) {
      body.setVelocityX(approach(body.velocity.x, targetVx, accel * dt));
    } else if (onFloor) {
      // Friction toward stop
      body.setVelocityX(body.velocity.x * Math.pow(FEEL.groundFriction, dt * 60));
      if (Math.abs(body.velocity.x) < 4) body.setVelocityX(0);
    } else {
      // Mild air drag when no input
      body.setVelocityX(approach(body.velocity.x, 0, accel * 0.35 * dt));
    }

    // Flip visual
    this.setFlipX(this.facing < 0);

    // --- Jump (coyote + buffer) ---
    if (this.bufferTimer > 0 && this.coyoteTimer > 0 && !this.isDroppingThrough) {
      body.setVelocityY(this.physicsFeel.jumpVelocity);
      this.bufferTimer = 0;
      this.coyoteTimer = 0;
      getAudio().playJump();
    }

    // Variable jump height
    if (input.jumpReleased && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * FEEL.jumpCutMultiplier);
    }

    // --- Asymmetric gravity + apex hang ---
    let g = this.physicsFeel.gravity;
    if (body.velocity.y > 0) {
      g = this.physicsFeel.fallGravity;
    } else if (
      Math.abs(body.velocity.y) < FEEL.apexHangThreshold &&
      !onFloor
    ) {
      g = this.physicsFeel.gravity * FEEL.apexHangMultiplier;
    }
    // Fast-fall optional
    if (input.down && body.velocity.y > 0) {
      g *= 1.35;
    }

    body.setVelocityY(body.velocity.y + g * dt);

    // Clamp fall
    if (body.velocity.y > FEEL.maxFallSpeed) {
      body.setVelocityY(FEEL.maxFallSpeed);
    }

    // Corner correction on ceiling clip
    if (solidLayer && body.blocked.up && body.velocity.y < 0) {
      this.tryCornerCorrection(solidLayer);
    }

    // Landing squash juice
    if (onFloor && !this.wasOnFloor) {
      this.scene.tweens.add({
        targets: this,
        scaleY: 0.85,
        scaleX: 1.1,
        duration: 50,
        yoyo: true,
        onComplete: () => {
          this.setScale(1);
          this.setFlipX(this.facing < 0);
        },
      });
    }
    this.wasOnFloor = onFloor;
  }

  private tryCornerCorrection(layer: Phaser.Tilemaps.TilemapLayer): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const maxNudge = FEEL.cornerCorrection;
    const checks = [1, 2, 3, 4].filter((n) => n <= maxNudge);

    for (const offset of checks) {
      // Try nudge right
      if (this.isSpaceFree(layer, body.x + offset, body.y, body.width, body.height * 0.4)) {
        this.x += offset;
        body.updateFromGameObject();
        return;
      }
      // Try nudge left
      if (this.isSpaceFree(layer, body.x - offset, body.y, body.width, body.height * 0.4)) {
        this.x -= offset;
        body.updateFromGameObject();
        return;
      }
    }
  }

  private isSpaceFree(
    layer: Phaser.Tilemaps.TilemapLayer,
    x: number,
    y: number,
    w: number,
    h: number,
  ): boolean {
    const tiles = layer.getTilesWithinWorldXY(x, y, w, h, { isNotEmpty: true });
    return tiles.every((t) => !t.collides);
  }
}

/** Create placeholder player texture (White Bomber-ish silhouette). */
export function ensurePlayerTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('player')) return;

  const g = scene.make.graphics({ x: 0, y: 0 });
  const w = PLAYER.displayWidth;
  const h = PLAYER.displayHeight;

  // Body (white helmet/suit)
  g.fillStyle(COLORS.player, 1);
  g.fillRoundedRect(2, 4, w - 4, h - 6, 3);

  // Outline
  g.lineStyle(1, COLORS.playerOutline, 1);
  g.strokeRoundedRect(2, 4, w - 4, h - 6, 3);

  // Visor
  g.fillStyle(0x334155, 1);
  g.fillRect(4, 8, w - 8, 5);

  // Antenna
  g.fillStyle(COLORS.playerAntenna, 1);
  g.fillRect(w / 2 - 1, 0, 2, 5);
  g.fillCircle(w / 2, 1, 2);

  // Feet
  g.fillStyle(0x0f172a, 1);
  g.fillRect(3, h - 4, 4, 3);
  g.fillRect(w - 7, h - 4, 4, 3);

  g.generateTexture('player', w, h);
  g.destroy();
}
