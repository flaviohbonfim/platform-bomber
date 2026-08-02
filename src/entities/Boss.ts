import Phaser from 'phaser';
import { BOSS, COLORS } from '../config';
import type { Player } from './Player';
import type { BombSystem } from '../systems/BombSystem';
import { getAudio } from '../systems/AudioSystem';
import { worldToTile } from '../utils/grid';

export type BossPhase = 1 | 2 | 3;

type BossState =
  | 'intro'
  | 'walk'
  | 'plant'
  | 'throw'
  | 'telegraph'
  | 'slam'
  | 'hurt'
  | 'dead';

/**
 * King Bomb — 3-phase arena boss.
 * P1 walk+plant · P2 throw+adds · P3 slam rage.
 */
export class Boss extends Phaser.Physics.Arcade.Sprite {
  maxHp: number = BOSS.maxHp;
  hp: number = BOSS.maxHp;
  phase: BossPhase = 1;
  private aiState: BossState = 'intro';
  private facing = -1;
  private actionCd = 1.2;
  private stateTimer = 1.0;
  private hitCd = 0;
  private addsSpawned = false;
  private dying = false;
  private crown!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'boss-king');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(28, 28);
    body.setOffset(2, 4);
    body.setCollideWorldBounds(true);
    body.setImmovable(false);

    this.setDisplaySize(32, 32);
    this.setDepth(11);
    this.setOrigin(0.5, 1);

    this.crown = scene.add.rectangle(x, y - 36, 14, 6, 0xfbbf24).setDepth(12);
    this.label = scene.add
      .text(x, y - 48, 'KING BOMB', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#fef08a',
      })
      .setOrigin(0.5)
      .setDepth(12);
  }

  static ensureTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('boss-king')) return;
    const g = scene.make.graphics({ x: 0, y: 0 });
    // Big black bomb body
    g.fillStyle(COLORS.bomb, 1);
    g.fillCircle(16, 18, 13);
    g.fillStyle(COLORS.bombHighlight, 1);
    g.fillCircle(11, 14, 4);
    // Angry eyes
    g.fillStyle(0xef4444, 1);
    g.fillRect(9, 14, 4, 3);
    g.fillRect(19, 14, 4, 3);
    // Fuse
    g.lineStyle(2, COLORS.fuse, 1);
    g.lineBetween(16, 5, 20, 1);
    g.fillStyle(0xfef08a, 1);
    g.fillCircle(20, 1, 2);
    // Crown
    g.fillStyle(0xfbbf24, 1);
    g.fillRect(8, 4, 16, 4);
    g.fillTriangle(8, 4, 11, 0, 14, 4);
    g.fillTriangle(14, 4, 16, -1, 18, 4);
    g.fillTriangle(18, 4, 21, 0, 24, 4);
    g.generateTexture('boss-king', 32, 32);
    g.destroy();
  }

  get hpRatio(): number {
    return this.hp / this.maxHp;
  }

  isDead(): boolean {
    return this.dying || this.aiState === 'dead';
  }

  /** Damage from player bomb fire. Returns true if killed. */
  takeDamage(amount = 1): boolean {
    if (this.dying || this.hitCd > 0 || this.aiState === 'intro') return false;
    this.hp = Math.max(0, this.hp - amount);
    this.hitCd = BOSS.hitIFrames;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (!this.dying) this.clearTint();
    });
    this.scene.cameras.main.shake(100, 0.006);
    getAudio().playBossHit();

    this.updatePhase();

    if (this.hp <= 0) {
      this.beginDeath();
      return true;
    }

    // Brief stun
    this.aiState = 'hurt';
    this.stateTimer = 0.25;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    return false;
  }

  private updatePhase(): void {
    const prev = this.phase;
    if (this.hpRatio <= BOSS.phase3HpRatio) this.phase = 3;
    else if (this.hpRatio <= BOSS.phase2HpRatio) this.phase = 2;
    else this.phase = 1;

    if (this.phase !== prev) {
      getAudio().playBossPhase();
      this.scene.cameras.main.flash(120, 255, 100, 50, false);
      this.actionCd = 0.5;
      if (this.phase === 2 && !this.addsSpawned) {
        this.addsSpawned = true;
        // Signal via event
        this.scene.events.emit('boss-spawn-adds');
      }
      this.scene.events.emit('boss-phase', this.phase);
    }
  }

  private beginDeath(): void {
    this.dying = true;
    this.aiState = 'dead';
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    getAudio().playBossDefeat();
    this.scene.cameras.main.shake(400, 0.012);

    this.scene.tweens.add({
      targets: [this, this.crown, this.label],
      alpha: 0,
      scaleX: 1.5,
      scaleY: 0.3,
      duration: 800,
      onComplete: () => {
        this.crown.destroy();
        this.label.destroy();
        this.setActive(false);
        this.setVisible(false);
        this.scene.events.emit('boss-defeated');
      },
    });

    // Victory particles
    for (let i = 0; i < 12; i++) {
      const p = this.scene.add.circle(
        this.x + Phaser.Math.Between(-20, 20),
        this.y - 16,
        3,
        Phaser.Math.RND.pick([0xfbbf24, 0xfb923c, 0xef4444, 0xfef08a]),
      );
      p.setDepth(20);
      this.scene.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-40, 40),
        y: p.y - Phaser.Math.Between(20, 60),
        alpha: 0,
        duration: 600 + Math.random() * 400,
        onComplete: () => p.destroy(),
      });
    }
  }

  updateBoss(
    dt: number,
    player: Player,
    bombSys: BombSystem,
    solidLayer: Phaser.Tilemaps.TilemapLayer,
  ): void {
    if (this.dying) return;

    this.hitCd = Math.max(0, this.hitCd - dt);
    this.actionCd = Math.max(0, this.actionCd - dt);
    this.stateTimer -= dt;

    // Gravity
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!(body.blocked.down || body.touching.down)) {
      body.velocity.y = Math.min(body.velocity.y + BOSS.gravity * dt, 400);
    } else if (body.velocity.y > 0) {
      body.velocity.y = 0;
    }

    // Sync crown/label
    this.crown.setPosition(this.x, this.y - 36);
    this.label.setPosition(this.x, this.y - 50);
    this.label.setText(`KING BOMB  P${this.phase}`);

    if (this.aiState === 'intro') {
      body.setVelocityX(0);
      if (this.stateTimer <= 0) {
        this.aiState = 'walk';
        this.actionCd = 0.8;
      }
      return;
    }

    if (this.aiState === 'hurt') {
      body.setVelocityX(0);
      if (this.stateTimer <= 0) this.aiState = 'walk';
      return;
    }

    if (this.aiState === 'telegraph') {
      body.setVelocityX(0);
      this.setTint(0xf97316);
      // Flash
      this.setAlpha(0.6 + 0.4 * Math.sin(this.scene.time.now / 40));
      if (this.stateTimer <= 0) {
        this.clearTint();
        this.setAlpha(1);
        this.aiState = 'slam';
        this.stateTimer = 0.35;
        this.doSlam(bombSys, player);
      }
      return;
    }

    if (this.aiState === 'slam') {
      body.setVelocityX(0);
      if (this.stateTimer <= 0) {
        this.aiState = 'walk';
        this.actionCd = BOSS.slamCooldown * (this.phase === 3 ? 0.75 : 1);
      }
      return;
    }

    if (this.aiState === 'plant' || this.aiState === 'throw') {
      body.setVelocityX(0);
      if (this.stateTimer <= 0) {
        this.aiState = 'walk';
      }
      return;
    }

    // Walk AI
    this.facing = player.x >= this.x ? 1 : -1;
    this.setFlipX(this.facing < 0);

    // Bounce walls
    if (body.blocked.left) this.facing = 1;
    if (body.blocked.right) this.facing = -1;

    const speed = BOSS.walkSpeed * (this.phase === 3 ? 1.25 : 1);
    body.setVelocityX(this.facing * speed);

    // Pick action
    if (this.actionCd <= 0 && (body.blocked.down || body.touching.down)) {
      this.pickAction(player, bombSys, solidLayer);
    }
  }

  private pickAction(
    player: Player,
    bombSys: BombSystem,
    _solidLayer: Phaser.Tilemaps.TilemapLayer,
  ): void {
    const roll = Math.random();

    if (this.phase === 1) {
      if (roll < 0.7) this.doPlant(bombSys);
      else this.doThrow(player, bombSys, 0.4);
    } else if (this.phase === 2) {
      if (roll < 0.45) this.doThrow(player, bombSys, 0.7);
      else if (roll < 0.75) this.doPlant(bombSys);
      else this.startTelegraph();
    } else {
      // Phase 3 rage
      if (roll < 0.4) this.startTelegraph();
      else if (roll < 0.75) this.doThrow(player, bombSys, 1);
      else this.doPlant(bombSys, true);
    }
  }

  private doPlant(bombSys: BombSystem, rage = false): void {
    this.aiState = 'plant';
    this.stateTimer = 0.4;
    this.actionCd = BOSS.plantCooldown * (this.phase === 3 ? 0.7 : 1);

    const body = this.body as Phaser.Physics.Arcade.Body;
    const py = body.bottom - 2;
    const { tx, ty } = worldToTile(this.x + this.facing * 12, py);
    const range = rage ? BOSS.rageFireRange : BOSS.plantFireRange;
    bombSys.forcePlantBomb(tx, ty, range);
    getAudio().playPlant();

    // Squash juice
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.85,
      scaleX: 1.15,
      duration: 80,
      yoyo: true,
    });
  }

  private doThrow(player: Player, bombSys: BombSystem, charge: number): void {
    this.aiState = 'throw';
    this.stateTimer = 0.35;
    this.actionCd = BOSS.throwCooldown * (this.phase === 3 ? 0.65 : 1);

    const dir = player.x >= this.x ? 1 : -1;
    this.facing = dir;
    const speed = Phaser.Math.Linear(140, 280, charge);
    const up = Phaser.Math.Linear(-160, -280, charge);
    const range =
      this.phase >= 3 ? BOSS.rageFireRange : this.phase === 2 ? BOSS.throwFireRange : 1;

    bombSys.forceThrowBomb(this.x + dir * 14, this.y - 20, dir * speed, up, range);
    getAudio().playThrow();

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      duration: 60,
      yoyo: true,
    });
  }

  private startTelegraph(): void {
    this.aiState = 'telegraph';
    this.stateTimer = BOSS.slamTelegraph;
    this.actionCd = 99;
    getAudio().playSlamTelegraph();
    // Warning line on ground
    const line = this.scene.add
      .rectangle(this.x, this.y + 2, 200, 4, 0xef4444, 0.5)
      .setDepth(8);
    this.scene.tweens.add({
      targets: line,
      alpha: 0.15,
      duration: BOSS.slamTelegraph * 1000,
      yoyo: true,
      repeat: 2,
      onComplete: () => line.destroy(),
    });
  }

  private doSlam(bombSys: BombSystem, _player: Player): void {
    this.scene.cameras.main.shake(220, 0.01);
    getAudio().playExplode();

    // Fire line along floor from boss
    const { tx, ty } = worldToTile(this.x, this.y - 4);
    const floorTy = ty; // approx boss cell
    const range = this.phase >= 3 ? 5 : 4;
    bombSys.spawnFireLine(tx, floorTy, range);

    // Landing squash
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.7,
      scaleX: 1.3,
      duration: 100,
      yoyo: true,
    });
  }

  destroy(fromScene?: boolean): void {
    this.crown?.destroy();
    this.label?.destroy();
    super.destroy(fromScene);
  }
}

export function ensureBossTexture(scene: Phaser.Scene): void {
  Boss.ensureTexture(scene);
}
