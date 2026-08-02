import Phaser from 'phaser';
import { BOMB, COLORS, PLAYER, TILE } from '../config';
import { Bomb, ensureBombTexture } from '../entities/Bomb';
import { ExplosionCell } from '../entities/Explosion';
import { SoftBlock, ensureSoftBlockTexture } from '../entities/SoftBlock';
import type { Player } from '../entities/Player';
import type { InputState } from './InputSystem';
import { DIRS, tileCenter, tileKey, worldToTile } from '../utils/grid';

export interface BombSystemEvents {
  onSoftDestroyed?: (tx: number, ty: number, droppedPowerUp: boolean) => void;
  onPlayerBurned?: () => void;
  /** When soft block should drop a real power-up. */
  onPowerUpDrop?: (tx: number, ty: number) => void;
  onExplode?: () => void;
  onPlant?: () => void;
  onThrow?: () => void;
}

/**
 * Plant, Power Glove throw, fuse, cross explosion, soft blocks, chain.
 */
export class BombSystem {
  readonly bombs: Phaser.Physics.Arcade.Group;
  readonly softBlocks: Phaser.Physics.Arcade.StaticGroup;
  private readonly fireCells: ExplosionCell[] = [];
  private readonly softByCell = new Map<string, SoftBlock>();
  private readonly bombByCell = new Map<string, Bomb>();
  private readonly airborne = new Set<Bomb>();
  private readonly fireByCell = new Map<string, ExplosionCell>();

  private solidLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private mapW = 0;
  private mapH = 0;

  maxBombs: number = PLAYER.startMaxBombs;
  fireRange: number = PLAYER.startFireRange;
  private ownerId = 1;

  private burnedPlayerThisBurst = false;

  // --- Power Glove charge ---
  private charging = false;
  private chargeTime = 0;
  private chargeReserved = false;
  private heldBombFx: Phaser.GameObjects.Image | null = null;
  private chargeBarBg: Phaser.GameObjects.Rectangle | null = null;
  private chargeBarFg: Phaser.GameObjects.Rectangle | null = null;
  /** 0–1 charge when throwing; exposed for HUD. */
  chargeRatio = 0;

  constructor(
    private scene: Phaser.Scene,
    private events: BombSystemEvents = {},
  ) {
    ensureBombTexture(scene);
    ensureSoftBlockTexture(scene);

    this.bombs = scene.physics.add.group({
      classType: Bomb,
      maxSize: 24,
      runChildUpdate: false,
    });

    this.softBlocks = scene.physics.add.staticGroup({
      classType: SoftBlock,
      maxSize: 128,
    });
  }

  setLevel(
    solidLayer: Phaser.Tilemaps.TilemapLayer,
    mapWidthPx: number,
    mapHeightPx: number,
  ): void {
    this.solidLayer = solidLayer;
    this.mapW = Math.floor(mapWidthPx / TILE);
    this.mapH = Math.floor(mapHeightPx / TILE);

    // Airborne bombs collide with solids and softs
    this.scene.physics.add.collider(
      this.bombs,
      solidLayer,
      this.onBombHitSolid,
      this.airborneOnlyProcess,
      this,
    );
    this.scene.physics.add.collider(
      this.bombs,
      this.softBlocks,
      this.onBombHitSoft,
      this.airborneOnlyProcess,
      this,
    );
  }

  /** Place soft blocks from tile coords. Returns how many were placed. */
  spawnSoftBlocks(cells: { tx: number; ty: number }[]): number {
    let count = 0;
    for (const { tx, ty } of cells) {
      if (this.spawnSoft(tx, ty)) count += 1;
    }
    return count;
  }

  spawnSoft(tx: number, ty: number): SoftBlock | null {
    const key = tileKey(tx, ty);
    if (this.softByCell.has(key)) return null;
    if (this.isHard(tx, ty)) return null;

    const { x, y } = tileCenter(tx, ty);
    let block = this.softBlocks.getFirstDead(false) as SoftBlock | null;
    if (!block) {
      block = new SoftBlock(this.scene, x, y);
      this.softBlocks.add(block);
    }
    block.place(tx, ty, x, y);
    this.softByCell.set(key, block);
    return block;
  }

  activeBombCount(): number {
    return this.bombByCell.size + this.airborne.size + (this.chargeReserved ? 1 : 0);
  }

  isCharging(): boolean {
    return this.charging;
  }

  /**
   * Handle bomb button: tap plant / hold charge / release throw.
   */
  handleInput(dt: number, player: Player, input: InputState): void {
    if (input.bombPressed) {
      if (this.activeBombCount() < this.maxBombs) {
        this.charging = true;
        this.chargeTime = 0;
        this.chargeReserved = true;
        this.chargeRatio = 0;
        this.ensureChargeFx(player);
      }
    }

    if (this.charging && input.bombHeld) {
      this.chargeTime += dt;
      const afterTap = Math.max(0, this.chargeTime - BOMB.tapMaxTime);
      this.chargeRatio = Math.min(1, afterTap / BOMB.chargeFullTime);
      this.updateChargeFx(player);
    }

    if (this.charging && input.bombReleased) {
      this.finishCharge(player);
    }

    // Cancel charge if somehow lost button without release edge
    if (this.charging && !input.bombHeld && !input.bombReleased) {
      this.finishCharge(player);
    }
  }

  private finishCharge(player: Player): void {
    if (!this.charging) return;

    const hold = this.chargeTime;
    const ratio = this.chargeRatio;
    this.charging = false;
    this.chargeReserved = false;
    this.clearChargeFx();

    if (hold < BOMB.tapMaxTime) {
      this.tryPlant(player); // onPlant fired inside spawnPlantedBomb
    } else {
      this.tryThrow(player, ratio);
    }

    this.chargeTime = 0;
    this.chargeRatio = 0;
  }

  private ensureChargeFx(player: Player): void {
    if (!this.heldBombFx) {
      this.heldBombFx = this.scene.add.image(player.x, player.y, 'bomb');
      this.heldBombFx.setDisplaySize(TILE - 2, TILE - 2);
      this.heldBombFx.setDepth(12);
    }
    this.heldBombFx.setVisible(true);

    if (!this.chargeBarBg) {
      this.chargeBarBg = this.scene.add
        .rectangle(0, 0, 28, 4, 0x000000, 0.55)
        .setDepth(12)
        .setOrigin(0.5, 0.5);
      this.chargeBarFg = this.scene.add
        .rectangle(0, 0, 0, 3, COLORS.fuse, 1)
        .setDepth(13)
        .setOrigin(0, 0.5);
    }
    this.chargeBarBg.setVisible(true);
    this.chargeBarFg?.setVisible(true);
  }

  private updateChargeFx(player: Player): void {
    if (!this.heldBombFx) return;
    const facing = player.getFacing();
    const handX = player.x + facing * 8;
    const handY = player.y - 10;
    this.heldBombFx.setPosition(handX, handY);
    this.heldBombFx.setFlipX(facing < 0);
    // Pulse with charge
    const s = 1 + this.chargeRatio * 0.2;
    this.heldBombFx.setScale(s);

    if (this.chargeBarBg && this.chargeBarFg) {
      this.chargeBarBg.setPosition(player.x, player.y - 22);
      this.chargeBarFg.setPosition(player.x - 13, player.y - 22);
      this.chargeBarFg.width = 26 * this.chargeRatio;
      this.chargeBarFg.setFillStyle(
        this.chargeRatio > 0.85 ? 0xfef08a : COLORS.fuse,
        1,
      );
    }

    // Slight crouch tint on player while charging throw
    if (this.chargeRatio > 0) {
      player.setTint(0xfde68a);
    } else {
      player.clearTint();
    }
  }

  private clearChargeFx(): void {
    this.heldBombFx?.setVisible(false);
    this.chargeBarBg?.setVisible(false);
    this.chargeBarFg?.setVisible(false);
  }

  /**
   * Try plant at feet with facing bias. Returns true if planted.
   */
  tryPlant(player: Player): boolean {
    if (this.bombByCell.size + this.airborne.size >= this.maxBombs) return false;

    const body = player.body as Phaser.Physics.Arcade.Body;
    const px = player.x + player.getFacing() * BOMB.plantFacingBias;
    const py = body.bottom - 2;
    let { tx, ty } = worldToTile(px, py);

    if (this.isBlockedForBomb(tx, ty)) {
      const feet = worldToTile(player.x, py);
      tx = feet.tx;
      ty = feet.ty;
    }

    if (this.isBlockedForBomb(tx, ty)) return false;

    return this.spawnPlantedBomb(tx, ty, this.fireRange, this.ownerId) !== null;
  }

  tryThrow(player: Player, chargeRatio: number): boolean {
    if (this.bombByCell.size + this.airborne.size >= this.maxBombs) return false;

    const facing = player.getFacing();
    const t = Phaser.Math.Clamp(chargeRatio, 0, 1);
    const speed = Phaser.Math.Linear(BOMB.throwSpeedMin, BOMB.throwSpeedMax, t);
    const up = Phaser.Math.Linear(BOMB.throwUpMin, BOMB.throwUpMax, t);
    const vx = facing * speed;
    const vy = up;

    const x = player.x + facing * 10;
    const y = player.y - 8;

    const bomb = this.acquireBomb();
    if (!bomb) return false;

    bomb.armAirborne(x, y, vx, vy, this.fireRange, this.ownerId);
    this.airborne.add(bomb);
    player.clearTint();
    this.events.onThrow?.();
    return true;
  }

  private spawnPlantedBomb(
    tx: number,
    ty: number,
    fireRange: number,
    ownerId: number,
  ): Bomb | null {
    const key = tileKey(tx, ty);
    if (this.isBlockedForBomb(tx, ty)) return null;

    const { x, y } = tileCenter(tx, ty);
    const bomb = this.acquireBomb();
    if (!bomb) return null;

    bomb.setPosition(x, y);
    bomb.armPlanted(tx, ty, fireRange, ownerId);
    this.bombByCell.set(key, bomb);
    this.events.onPlant?.();
    return bomb;
  }

  /** Boss/enemy plant (ignores player max bombs). */
  forcePlantBomb(tx: number, ty: number, fireRange: number): Bomb | null {
    // Try cell and neighbors if blocked
    const candidates = [
      { tx, ty },
      { tx: tx + 1, ty },
      { tx: tx - 1, ty },
      { tx, ty: ty - 1 },
    ];
    for (const c of candidates) {
      if (!this.isBlockedForBomb(c.tx, c.ty)) {
        return this.spawnPlantedBomb(c.tx, c.ty, fireRange, 99);
      }
    }
    return null;
  }

  /** Boss/enemy throw projectile. */
  forceThrowBomb(
    x: number,
    y: number,
    vx: number,
    vy: number,
    fireRange: number,
  ): Bomb | null {
    const bomb = this.acquireBomb();
    if (!bomb) return null;
    bomb.armAirborne(x, y, vx, vy, fireRange, 99);
    this.airborne.add(bomb);
    this.events.onThrow?.();
    return bomb;
  }

  /** Horizontal fire line for boss slam (no soft-stop on center ray). */
  spawnFireLine(cx: number, cy: number, range: number): void {
    this.scene.cameras.main.shake(BOMB.shakeDuration, BOMB.shakeIntensity * 1.5);
    this.events.onExplode?.();

    const cells = [{ tx: cx, ty: cy, isCore: true }];
    for (const dx of [-1, 1]) {
      for (let i = 1; i <= range; i++) {
        const tx = cx + dx * i;
        const ty = cy;
        if (!this.inBounds(tx, ty)) break;
        if (this.isHard(tx, ty)) break;
        cells.push({ tx, ty, isCore: false });
        const soft = this.softByCell.get(tileKey(tx, ty));
        if (soft && soft.active) this.destroySoft(soft);
        // chain bombs
        const other = this.bombByCell.get(tileKey(tx, ty));
        if (other && !other.exploding) this.explode(other);
      }
    }

    for (const c of cells) {
      this.spawnFire(c.tx, c.ty, c.isCore);
    }
  }

  private acquireBomb(): Bomb | null {
    let bomb = this.bombs.getFirstDead(false) as Bomb | null;
    if (!bomb) {
      if (this.bombs.getLength() >= 24) return null;
      bomb = new Bomb(this.scene, 0, 0);
      this.bombs.add(bomb);
    } else {
      bomb.enableBody(true, 0, 0, true, true);
    }
    return bomb;
  }

  private airborneOnlyProcess: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    bombObj,
  ): boolean => {
    const bomb = bombObj as Bomb;
    return bomb.active && bomb.state === 'airborne' && !bomb.exploding;
  };

  private onBombHitSolid: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    bombObj,
  ): void => {
    const bomb = bombObj as Bomb;
    if (bomb.state !== 'airborne') return;
    const body = bomb.body as Phaser.Physics.Arcade.Body;
    // Sticky land on floor; bounce lightly off walls
    if (body.blocked.down || body.touching.down) {
      this.landBomb(bomb);
    } else if (body.blocked.left || body.blocked.right) {
      body.setVelocityX(body.velocity.x * -0.35);
    } else if (body.blocked.up || body.touching.up) {
      body.setVelocityY(Math.abs(body.velocity.y) * 0.3);
    }
  };

  private onBombHitSoft: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    bombObj,
  ): void => {
    const bomb = bombObj as Bomb;
    if (bomb.state !== 'airborne') return;
    const body = bomb.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down || body.velocity.y >= 0) {
      this.landBomb(bomb);
    } else {
      body.setVelocityX(body.velocity.x * -0.25);
    }
  };

  private landBomb(bomb: Bomb): void {
    if (bomb.state !== 'airborne' || bomb.exploding) return;

    this.airborne.delete(bomb);

    let { tx, ty } = worldToTile(bomb.x, bomb.y);
    // Prefer cell under bomb center; if blocked, search nearby
    if (this.isBlockedForBomb(tx, ty)) {
      const free = this.findNearestFreeCell(tx, ty);
      if (!free) {
        // No space — explode where we are
        bomb.tx = tx;
        bomb.ty = ty;
        this.explode(bomb);
        return;
      }
      tx = free.tx;
      ty = free.ty;
    }

    const { x, y } = tileCenter(tx, ty);
    bomb.becomePlanted(tx, ty, x, y);
    this.bombByCell.set(tileKey(tx, ty), bomb);
  }

  private findNearestFreeCell(
    ox: number,
    oy: number,
  ): { tx: number; ty: number } | null {
    if (!this.isBlockedForBomb(ox, oy)) return { tx: ox, ty: oy };
    for (let r = 1; r <= 3; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tx = ox + dx;
          const ty = oy + dy;
          if (!this.isBlockedForBomb(tx, ty)) return { tx, ty };
        }
      }
    }
    return null;
  }

  /** Call each frame after handleInput. */
  update(dt: number, player: Player): void {
    // Airborne physics
    for (const bomb of [...this.airborne]) {
      if (!bomb.active || bomb.exploding) {
        this.airborne.delete(bomb);
        continue;
      }
      bomb.tickAirborne(dt);
      // Land check if overlapping solid feet (fallback if collider missed)
      const body = bomb.body as Phaser.Physics.Arcade.Body;
      if (body.blocked.down) {
        this.landBomb(bomb);
      }
    }

    // Exit-own-bomb
    this.bombs.children.each((obj) => {
      const bomb = obj as Bomb;
      if (!bomb.active || bomb.state !== 'planted' || !bomb.allowsOwnerPass) return true;
      const overlapping = this.scene.physics.overlap(player, bomb);
      if (!overlapping) bomb.allowsOwnerPass = false;
      return true;
    });

    // Fuse timers (planted + airborne)
    const toExplode: Bomb[] = [];
    this.bombs.children.each((obj) => {
      const bomb = obj as Bomb;
      if (!bomb.active || bomb.exploding) return true;
      if (bomb.tick(dt)) toExplode.push(bomb);
      return true;
    });
    for (const b of toExplode) {
      if (b.state === 'airborne') {
        // Snap explode cell from world pos
        const { tx, ty } = worldToTile(b.x, b.y);
        b.tx = tx;
        b.ty = ty;
        this.airborne.delete(b);
      }
      this.explode(b);
    }

    // Fire cells
    this.burnedPlayerThisBurst = false;
    for (const cell of this.fireCells) {
      if (!cell.active) continue;
      cell.tick(dt);
      if (!cell.active) {
        this.fireByCell.delete(tileKey(cell.tx, cell.ty));
      } else if (cell.activeHit && this.playerTouchesCell(player, cell)) {
        if (!this.burnedPlayerThisBurst) {
          this.burnedPlayerThisBurst = true;
          this.events.onPlayerBurned?.();
        }
      }
    }
  }

  /** Process callback for player vs bomb collider. */
  bombCollideProcess: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _playerObj,
    bombObj,
  ): boolean => {
    const bomb = bombObj as Bomb;
    if (!bomb.active || bomb.state !== 'planted') return false;
    if (bomb.allowsOwnerPass) return false;
    return true;
  };

  private explode(bomb: Bomb): void {
    if (bomb.exploding) return;

    if (bomb.state === 'planted') {
      this.bombByCell.delete(tileKey(bomb.tx, bomb.ty));
    }
    this.airborne.delete(bomb);
    bomb.disarm();

    this.scene.cameras.main.shake(BOMB.shakeDuration, BOMB.shakeIntensity);
    this.events.onExplode?.();
    this.spawnExplosionParticles(bomb.x, bomb.y);

    const cx = bomb.tx;
    const cy = bomb.ty;
    const cells = this.computeFireCells(cx, cy, bomb.fireRange);
    const chainBombs: Bomb[] = [];

    for (const c of cells) {
      const soft = this.softByCell.get(tileKey(c.tx, c.ty));
      if (soft && soft.active) {
        this.destroySoft(soft);
      }

      const other = this.bombByCell.get(tileKey(c.tx, c.ty));
      if (other && other !== bomb && !other.exploding) {
        chainBombs.push(other);
      }

      this.spawnFire(c.tx, c.ty, c.isCore);
    }

    for (const b of chainBombs) {
      this.explode(b);
    }
  }

  private computeFireCells(
    cx: number,
    cy: number,
    range: number,
  ): { tx: number; ty: number; isCore: boolean }[] {
    const result: { tx: number; ty: number; isCore: boolean }[] = [
      { tx: cx, ty: cy, isCore: true },
    ];

    for (const { dx, dy } of DIRS) {
      for (let i = 1; i <= range; i++) {
        const tx = cx + dx * i;
        const ty = cy + dy * i;
        if (!this.inBounds(tx, ty)) break;
        if (this.isHard(tx, ty)) break;

        result.push({ tx, ty, isCore: false });

        if (this.softByCell.has(tileKey(tx, ty))) break;
      }
    }
    return result;
  }

  private destroySoft(soft: SoftBlock): void {
    const key = tileKey(soft.tx, soft.ty);
    this.softByCell.delete(key);
    const drop = Math.random() < BOMB.softDropChance;
    soft.destroyBlock(() => {
      this.events.onSoftDestroyed?.(soft.tx, soft.ty, drop);
    });
    if (drop) {
      this.events.onPowerUpDrop?.(soft.tx, soft.ty);
    }
  }

  private spawnExplosionParticles(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 * i) / 8;
      const p = this.scene.add.circle(
        x,
        y,
        2 + Math.random() * 2,
        Phaser.Math.RND.pick([COLORS.fireCore, COLORS.fireMid, COLORS.fireEdge]),
        0.95,
      );
      p.setDepth(15);
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(ang) * (12 + Math.random() * 16),
        y: y + Math.sin(ang) * (12 + Math.random() * 16),
        alpha: 0,
        duration: 200 + Math.random() * 150,
        onComplete: () => p.destroy(),
      });
    }
  }

  /** True if sprite body overlaps any active fire cell. */
  isEntityOnFire(entity: Phaser.GameObjects.Sprite): boolean {
    const body = entity.body as Phaser.Physics.Arcade.Body | null;
    if (!body || !body.enable) return false;
    for (const cell of this.fireCells) {
      if (!cell.active || !cell.activeHit) continue;
      const half = TILE / 2 - 1;
      if (
        body.right > cell.x - half &&
        body.left < cell.x + half &&
        body.bottom > cell.y - half &&
        body.top < cell.y + half
      ) {
        return true;
      }
    }
    return false;
  }

  private spawnFire(tx: number, ty: number, isCore: boolean): void {
    const key = tileKey(tx, ty);
    let cell = this.fireCells.find((c) => !c.active);
    if (!cell) {
      cell = new ExplosionCell(this.scene);
      this.fireCells.push(cell);
    }
    const { x, y } = tileCenter(tx, ty);
    cell.ignite(tx, ty, x, y, isCore);
    this.fireByCell.set(key, cell);
  }

  private playerTouchesCell(player: Player, cell: ExplosionCell): boolean {
    const body = player.body as Phaser.Physics.Arcade.Body;
    const half = TILE / 2 - 1;
    return (
      body.right > cell.x - half &&
      body.left < cell.x + half &&
      body.bottom > cell.y - half &&
      body.top < cell.y + half
    );
  }

  isHard(tx: number, ty: number): boolean {
    if (!this.solidLayer) return true;
    if (!this.inBounds(tx, ty)) return true;
    const tile = this.solidLayer.getTileAt(tx, ty);
    return !!(tile && tile.index > 0 && tile.collides);
  }

  isBlockedForBomb(tx: number, ty: number): boolean {
    if (!this.inBounds(tx, ty)) return true;
    if (this.isHard(tx, ty)) return true;
    if (this.softByCell.has(tileKey(tx, ty))) return true;
    if (this.bombByCell.has(tileKey(tx, ty))) return true;
    return false;
  }

  private inBounds(tx: number, ty: number): boolean {
    return tx >= 0 && ty >= 0 && tx < this.mapW && ty < this.mapH;
  }
}
