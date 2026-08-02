import Phaser from 'phaser';
import { BOSS, GAME_HEIGHT, GAME_WIDTH, LIVES, TILE } from '../config';
import { Boss, ensureBossTexture } from '../entities/Boss';
import { ExitDoor } from '../entities/ExitDoor';
import { ensurePlayerTexture, Player } from '../entities/Player';
import { loadLevel, type LoadedLevel } from '../levels/LevelLoader';
import type { LevelDef } from '../levels/types';
import { firstLevelId, getLevel } from '../levels/world1';
import { getAudio } from '../systems/AudioSystem';
import { BombSystem } from '../systems/BombSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { CheckpointSystem } from '../systems/CheckpointSystem';
import { EnemySystem } from '../systems/EnemySystem';
import {
  advanceToLevel,
  createInitialRunState,
  type RunState,
} from '../systems/GameState';
import { InputSystem } from '../systems/InputSystem';
import { LivesSystem } from '../systems/LivesSystem';
import { PowerUpSystem } from '../systems/PowerUpSystem';
import { tileCenter } from '../utils/grid';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputSys!: InputSystem;
  private cameraSys!: CameraSystem;
  private bombSys!: BombSystem;
  private livesSys!: LivesSystem;
  private checkpointSys!: CheckpointSystem;
  private enemySys!: EnemySystem;
  private powerUpSys!: PowerUpSystem;
  private level!: LoadedLevel;
  private levelDef!: LevelDef;
  private run!: RunState;
  private exitDoor: ExitDoor | null = null;
  private boss: Boss | null = null;
  private bossHpFg: Phaser.GameObjects.Rectangle | null = null;
  private bossHpLabel: Phaser.GameObjects.Text | null = null;
  private softRemaining = 0;
  private debugText!: Phaser.GameObjects.Text;
  private clearing = false;
  private bossDefeated = false;

  constructor() {
    super('Game');
  }

  init(data: { levelId?: string; continueRun?: boolean; reset?: boolean }): void {
    const levelId = data.levelId ?? firstLevelId();
    const existing = this.registry.get('run') as RunState | undefined;

    if (data.reset || !existing) {
      this.run = createInitialRunState(levelId);
      this.registry.set('run', this.run);
    } else if (data.continueRun && data.levelId) {
      this.run = existing;
      advanceToLevel(this.run, data.levelId);
    } else {
      this.run = existing;
      if (data.levelId) this.run.levelId = data.levelId;
    }

    this.levelDef = getLevel(this.run.levelId);
  }

  create(): void {
    ensurePlayerTexture(this);
    ensureBossTexture(this);
    this.clearing = false;
    this.bossDefeated = false;
    this.boss = null;
    this.exitDoor = null;

    const audio = getAudio();
    audio.resume();
    audio.startMusic(this.levelDef.isBoss ? 'boss' : 'world');

    if (this.scene.isActive('UI') || this.scene.isSleeping('UI')) {
      this.scene.stop('UI');
    }
    this.scene.launch('UI');

    const def = this.levelDef;

    // Sky gradient + parallax decor
    const bg = this.add.graphics();
    bg.fillGradientStyle(def.skyTop, def.skyTop, def.skyBottom, def.skyBottom, 1);
    bg.fillRect(0, 0, def.width * TILE * 2, def.height * TILE * 2);
    bg.setScrollFactor(0.08, 0);
    bg.setDepth(-20);

    // Far hills
    if (this.textures.exists('bg-hill')) {
      for (let i = 0; i < 6; i++) {
        this.add
          .image(40 + i * 90, def.height * TILE - 48, 'bg-hill')
          .setScrollFactor(0.2, 0.05)
          .setDepth(-15)
          .setAlpha(0.55)
          .setTint(def.isBoss ? 0x7f1d1d : 0xffffff);
      }
    }
    // Clouds
    if (this.textures.exists('bg-cloud') && !def.id.includes('cave') && !def.isBoss) {
      for (let i = 0; i < 5; i++) {
        this.add
          .image(60 + i * 120, 40 + (i % 3) * 18, 'bg-cloud')
          .setScrollFactor(0.12, 0)
          .setDepth(-12)
          .setAlpha(0.75);
      }
    }

    this.level = loadLevel(this, def);

    this.physics.world.setBounds(0, 0, this.level.width, this.level.height);
    this.physics.world.gravity.y = 0;

    const spawn = {
      x: this.run.checkpointX,
      y: this.run.checkpointY,
    };
    this.player = new Player(this, spawn.x, spawn.y);
    this.player.setSpeedStacks(this.run.speedStacks);

    this.livesSys = new LivesSystem(this, this.run, () => this.emitHud());

    this.powerUpSys = new PowerUpSystem(this, this.run, {
      onCollected: () => {
        audio.playPickup();
        this.syncPowersToSystems();
        this.emitHud();
      },
      onHudDirty: () => this.emitHud(),
    });

    this.bombSys = new BombSystem(this, {
      onSoftDestroyed: () => {
        this.softRemaining = Math.max(0, this.softRemaining - 1);
        this.livesSys.addScore(LIVES.scoreSoft);
        this.emitHud();
      },
      onPlayerBurned: () => this.onPlayerHurt(),
      onPowerUpDrop: (tx, ty) => this.powerUpSys.tryDropFromSoft(tx, ty),
      onExplode: () => audio.playExplode(),
      onPlant: () => audio.playPlant(),
      onThrow: () => audio.playThrow(),
    });
    this.bombSys.setLevel(this.level.solidLayer, this.level.width, this.level.height);
    this.syncPowersToSystems();
    this.softRemaining = this.bombSys.spawnSoftBlocks(def.softs);

    for (const pu of def.powerups ?? []) {
      this.powerUpSys.spawnAtTile(pu.tx, pu.ty, pu.kind);
    }
    this.powerUpSys.setupOverlap(this.player);

    this.enemySys = new EnemySystem(this, {
      onEnemyKilled: (_kind, score) => {
        audio.playEnemyDeath();
        this.livesSys.addScore(score);
        this.emitHud();
      },
      onPlayerHit: () => this.onPlayerHurt(),
    });
    this.enemySys.setLevel(this.level.solidLayer, this.bombSys.softBlocks);
    this.enemySys.spawnAll(def.enemies);
    this.enemySys.setupPlayerCollisions(this.player);

    this.checkpointSys = new CheckpointSystem(this, this.run, () => {
      audio.playCheckpoint();
      this.livesSys.addScore(LIVES.scoreCheckpoint);
      this.emitHud();
    });
    this.checkpointSys.spawn(def.checkpoints);
    this.checkpointSys.setupOverlap(this.player);

    // Boss arena
    if (def.isBoss && def.bossSpawn) {
      const { x, y } = tileCenter(def.bossSpawn.tx, def.bossSpawn.ty);
      this.boss = new Boss(this, x, y + TILE / 2);
      this.physics.add.collider(this.boss, this.level.solidLayer);
      this.physics.add.collider(this.boss, this.bombSys.softBlocks);
      this.physics.add.overlap(this.player, this.boss, () => {
        if (!this.boss?.isDead()) this.onPlayerHurt();
      });

      // Force checkpoint on arena entry
      this.run.checkpointX = spawn.x;
      this.run.checkpointY = spawn.y;
      this.run.hasCheckpoint = true;

      this.createBossHpBar();

      this.events.on('boss-spawn-adds', this.spawnBossAdds, this);
      this.events.on('boss-defeated', this.onBossDefeated, this);
      this.events.once('shutdown', () => {
        this.events.off('boss-spawn-adds', this.spawnBossAdds, this);
        this.events.off('boss-defeated', this.onBossDefeated, this);
      });

      // Exit hidden until boss dies
      this.exitDoor = new ExitDoor(this, def.exit.tx, def.exit.ty);
      this.exitDoor.setVisible(false);
      this.exitDoor.setActive(false);
      (this.exitDoor.body as Phaser.Physics.Arcade.Body).enable = false;
    } else {
      this.exitDoor = new ExitDoor(this, def.exit.tx, def.exit.ty);
      this.physics.add.overlap(this.player, this.exitDoor, () => this.tryClearLevel());
    }

    this.physics.add.collider(this.player, this.level.solidLayer);
    this.physics.add.collider(
      this.player,
      this.level.onewayLayer,
      undefined,
      this.onewayProcess,
      this,
    );
    this.physics.add.collider(this.player, this.bombSys.softBlocks);
    this.physics.add.collider(
      this.player,
      this.bombSys.bombs,
      undefined,
      this.bombSys.bombCollideProcess,
      this,
    );

    this.inputSys = new InputSystem(this);
    this.cameraSys = new CameraSystem(this, this.player, {
      width: this.level.width,
      height: this.level.height,
    });

    const banner = this.add
      .text(8, 42, `${def.name}\n${def.subtitle}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#e2e8f0',
        backgroundColor: '#00000066',
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.tweens.add({
      targets: banner,
      alpha: 0,
      delay: 2800,
      duration: 600,
      onComplete: () => banner.destroy(),
    });

    this.debugText = this.add
      .text(8, GAME_HEIGHT - 16, '', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#64748b',
      })
      .setScrollFactor(0)
      .setDepth(100);

    if (this.run.hasCheckpoint) {
      this.livesSys.iFrames = LIVES.iFrameDuration * 0.5;
    }

    this.emitHud();
  }

  private createBossHpBar(): void {
    const w = 200;
    const x = GAME_WIDTH / 2;
    const y = GAME_HEIGHT - 28;
    this.add
      .rectangle(x, y, w, 10, 0x000000, 0.6)
      .setScrollFactor(0)
      .setDepth(210)
      .setStrokeStyle(1, 0xfbbf24, 0.8);
    this.bossHpFg = this.add
      .rectangle(x - w / 2 + 1, y, w - 2, 6, 0xef4444, 1)
      .setScrollFactor(0)
      .setDepth(211)
      .setOrigin(0, 0.5);
    this.bossHpLabel = this.add
      .text(x, y - 12, 'KING BOMB', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#fef08a',
      })
      .setScrollFactor(0)
      .setDepth(211)
      .setOrigin(0.5);
  }

  private updateBossHpBar(): void {
    if (!this.boss || !this.bossHpFg) return;
    const ratio = this.boss.hpRatio;
    this.bossHpFg.width = Math.max(0, (200 - 2) * ratio);
    if (ratio < 0.33) this.bossHpFg.setFillStyle(0xef4444, 1);
    else if (ratio < 0.66) this.bossHpFg.setFillStyle(0xfb923c, 1);
    else this.bossHpFg.setFillStyle(0xef4444, 1);
    this.bossHpLabel?.setText(`KING BOMB  P${this.boss.phase}  ${this.boss.hp}/${this.boss.maxHp}`);
  }

  private spawnBossAdds = (): void => {
    if (!this.levelDef.bossSpawn) return;
    const base = this.levelDef.bossSpawn.tx;
    const floor = this.levelDef.bossSpawn.ty;
    this.enemySys.spawnOne('ballom', base - 4, floor);
    this.enemySys.spawnOne('ballom', base + 2, floor);
  };

  private onBossDefeated = (): void => {
    if (this.bossDefeated) return;
    this.bossDefeated = true;
    this.livesSys.addScore(BOSS.scoreDefeat);
    getAudio().playClear();

    // Unlock exit
    if (this.exitDoor) {
      this.exitDoor.setVisible(true);
      this.exitDoor.setActive(true);
      (this.exitDoor.body as Phaser.Physics.Arcade.Body).enable = true;
      this.physics.add.overlap(this.player, this.exitDoor, () => this.tryClearLevel());
    }

    // Or auto-clear after delay
    this.time.delayedCall(1500, () => {
      if (!this.clearing) this.tryClearLevel(true);
    });

    this.emitHud();
  };

  private syncPowersToSystems(): void {
    this.bombSys.maxBombs = this.run.maxBombs;
    this.bombSys.fireRange = this.run.fireRange;
    this.player.setSpeedStacks(this.run.speedStacks);
  }

  private emitHud(charge?: number): void {
    this.game.events.emit('hud-update', {
      state: this.run,
      softRemaining: this.softRemaining,
      charge,
      enemies: this.enemySys?.aliveCount?.() ?? 0,
      levelName: this.levelDef?.name,
      bossHp: this.boss && !this.boss.isDead() ? this.boss.hpRatio : undefined,
    });
  }

  private onewayProcess: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    playerObj,
    tileObj,
  ): boolean => {
    const player = playerObj as Player;
    if (player.isDroppingThrough) return false;

    const body = player.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y < -10) return false;

    const tile = tileObj as Phaser.Tilemaps.Tile;
    if (!tile || typeof tile.getTop !== 'function') {
      return body.velocity.y >= 0;
    }

    const platformTop = tile.getTop();
    const feet = body.bottom;
    return feet <= platformTop + 6;
  };

  private onPlayerHurt(): void {
    if (this.clearing) return;
    if (this.livesSys.isInvulnerable()) return;
    const result = this.livesSys.hurt(this.player);
    if (result === 'ignored') return;
    getAudio().playHurt();
    this.emitHud();
  }

  private tryClearLevel(force = false): void {
    if (this.clearing) return;
    if (!force) {
      if (!this.player.canControl() || this.livesSys.isDying()) return;
      if (this.levelDef.isBoss && !this.bossDefeated) return;

      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (!(body.blocked.down || body.touching.down) && body.velocity.y < -20) return;
    }

    this.clearing = true;
    this.player.freezeControl();
    this.player.setTint(0xc4b5fd);
    getAudio().playClear();
    getAudio().stopMusic();

    if (!force) this.livesSys.addScore(500);
    this.cameras.main.fade(500, 0, 0, 0);

    this.time.delayedCall(550, () => {
      this.scene.stop('UI');
      this.scene.start('LevelClear', {
        levelName: this.levelDef.name,
        nextLevelId: this.levelDef.nextLevelId,
        score: this.run.score,
      });
    });
  }

  private goGameOver(): void {
    getAudio().stopMusic();
    this.scene.stop('UI');
    this.scene.start('GameOver', { score: this.run.score });
  }

  update(_time: number, delta: number): void {
    if (this.clearing) return;

    const dt = Math.min(delta / 1000, 0.05);
    const input = this.inputSys.update();

    const deathResult = this.livesSys.update(dt, this.player);
    if (deathResult === 'gameover') {
      this.goGameOver();
      return;
    }
    if (deathResult === 'respawn') {
      this.syncPowersToSystems();
      this.emitHud();
    }

    const canPlay = this.player.canControl() && !this.livesSys.isDying();

    if (canPlay) {
      this.player.update(dt, input, this.level.solidLayer);
      this.bombSys.handleInput(dt, this.player, input);
    } else {
      this.player.update(dt, input, this.level.solidLayer);
    }

    this.bombSys.update(dt, this.player);
    this.enemySys.update(dt, this.player, this.bombSys);

    // Boss
    if (this.boss && !this.boss.isDead()) {
      this.boss.updateBoss(dt, this.player, this.bombSys, this.level.solidLayer);
      // Fire damage to boss
      if (this.bombSys.isEntityOnFire(this.boss)) {
        this.boss.takeDamage(1);
      }
      this.updateBossHpBar();
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.cameraSys.update(dt, this.player.getFacing(), body.velocity.x);

    if (canPlay && this.player.y > this.level.height + 24) {
      this.onPlayerHurt();
      if (!this.livesSys.isDying() && this.run.lives > 0) {
        this.player.setPosition(this.run.checkpointX, this.run.checkpointY);
        body.setVelocity(0, 0);
      }
    }

    this.emitHud(this.bombSys.isCharging() ? this.bombSys.chargeRatio : 0);

    const bossInfo = this.boss
      ? ` boss:${this.boss.hp}/${this.boss.maxHp} P${this.boss.phase}`
      : '';
    this.debugText.setText(
      `${this.levelDef.id}  foes:${this.enemySys.aliveCount()}${bossInfo}`,
    );
  }
}
